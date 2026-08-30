const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' 
  : process.env.NODE_ENV === 'test' ? '.env.test'
  : '.env.development';
dotenv.config({ path: envFile });
dotenv.config(); // Fallback to .env if env-specific file doesn't exist

// Initialize observability EARLY (before other imports to catch startup errors)
const { requestTracer, sentryRequestHandler, sentryErrorHandler, metrics } = require('./services/observability');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');
const compression = require('compression');
const { securityConfig } = require('./config/security');
const { warmCache } = require('./middlewares/cacheMiddleware');
const { performanceMiddleware } = require('./utils/performanceMonitor');
const { generateCSRFToken } = require('./middlewares/csrfProtection');
const { generalRateLimit } = require('./middlewares/rateLimiting');
const { sanitizeInput } = require('./utils/validationUtils');
const { xssProtection, xssHelmetConfig, sqlInjectionProtection } = require('./middlewares/xssProtection');
const { 
  validateApiVersion, 
  checkDeprecation,
  versionErrorHandler 
} = require('./middlewares/apiVersioning');
const { 
  validateRequestSize, 
  dosProtection, 
  requestTimeout, 
  memoryMonitor
} = require('./middlewares/requestLimits');
const { 
  getCorsConfig, 
  corsErrorHandler, 
  corsPreflightHandler, 
  corsSecurityHeaders, 
  corsLogger, 
  corsRateLimit 
} = require('./middlewares/corsSecurity');
const { 
  userRateLimit, 
  burstRateLimit, 
  trustedSourceBypass
} = require('./middlewares/userRateLimiting');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { requestId, additionalSecurityHeaders } = require('./middlewares/securityEnhancements');
const mountRoutes = require('./routes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler);

// Request tracing & APM
app.use(requestTracer);
app.use(requestId);

// Security middleware
app.use(xssHelmetConfig);
app.use(additionalSecurityHeaders);

// Compression middleware for better performance
app.use(compression({
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: securityConfig.session.secret,
  resave: securityConfig.session.resave,
  saveUninitialized: securityConfig.session.saveUninitialized,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: securityConfig.session.cookie
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration with enhanced security (MUST be before rate limiting)
app.use(cors(getCorsConfig()));
app.use(corsPreflightHandler);
app.use(corsSecurityHeaders);
app.use(corsLogger);
app.use(corsRateLimit);

// Rate limiting (after CORS so rate limit responses have CORS headers)
app.use(generalRateLimit);

// Apply raw bodyParser only to the webhook route
app.post('/api/orders/webhook', bodyParser.raw({ type: 'application/json' }));

// Request size limits and DoS protection
app.use(validateRequestSize);
app.use(dosProtection);
app.use(requestTimeout(30000)); // 30 second timeout
app.use(memoryMonitor);

// Body parsing with size limits. Skips the Stripe webhook route: its raw
// Buffer body (set above) must reach stripe.webhooks.constructEvent()
// untouched for signature verification -- body-parser.json() does not skip
// bodies a previous body-parser middleware already parsed, so without this
// guard it silently replaces the Buffer with a parsed object and every
// webhook delivery fails signature verification.
const skipForStripeWebhook = (parser) => (req, res, next) => {
  if (req.originalUrl === '/api/orders/webhook') return next();
  return parser(req, res, next);
};
app.use(skipForStripeWebhook(bodyParser.json({ limit: '10mb' })));
app.use(skipForStripeWebhook(bodyParser.urlencoded({ extended: true, limit: '10mb' })));
app.use(cookieParser());

// Input sanitization and validation. sanitizeInput and xssProtection both
// reassign req.body (to sanitize string fields), which would clobber the
// raw Buffer body Stripe webhook signature verification requires -- skip
// them for that route, same reasoning as the body-parser guard above.
app.use(skipForStripeWebhook(sanitizeInput));
app.use(sqlInjectionProtection);
app.use(skipForStripeWebhook(xssProtection));

// CSRF protection for all routes
app.use(generateCSRFToken);

// Performance monitoring middleware
app.use(performanceMiddleware);

// Cache warming middleware
app.use(warmCache);

// Ops/monitoring endpoints (cache stats, performance, versions, stats, rate-limit status)
app.use('/api', systemRoutes);

// API versioning middleware (only for actual versioned routes)
app.use('/api/v1', validateApiVersion, checkDeprecation);
app.use('/api/v2', validateApiVersion, checkDeprecation);

// User-based rate limiting (after versioning routes)
app.use('/api', trustedSourceBypass, userRateLimit);
app.use('/api/events/search', burstRateLimit(20, 60000)); // 20 requests per minute for search
app.use('/api/upload', burstRateLimit(10, 300000)); // 10 uploads per 5 minutes

// Mount all API route modules (see routes/index.js)
mountRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  const { jobQueue } = require('./services/jobQueue');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    jobQueue: jobQueue.getStats(),
    metrics: metrics.getMetrics()
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Eazy Event API Docs'
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// CORS error handler
app.use(corsErrorHandler);

// API versioning error handler
app.use(versionErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler);

// Global error handler
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;

