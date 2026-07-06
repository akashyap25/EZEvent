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
const { requestTracer, sentryRequestHandler, sentryErrorHandler, metrics, captureError } = require('./services/observability');

const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const chatRoutes = require('./routes/chatRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');
const emailRoutes = require('./routes/emailRoutes');
const smsRoutes = require('./routes/smsRoutes');
const socialMediaRoutes = require('./routes/socialMediaRoutes');
const connectToMongo = require('./db/db');
const { securityConfig } = require('./config/security');
const { cacheService } = require('./services/cacheService');
const { createCacheMiddleware, warmCache, getCacheStats, clearCache } = require('./middlewares/cacheMiddleware');
const { performanceMonitor, performanceMiddleware } = require('./utils/performanceMonitor');
const { generateCSRFToken } = require('./middlewares/csrfProtection');
const { generalRateLimit } = require('./middlewares/rateLimiting');
const { sanitizeInput, handleValidationErrors, commonValidations } = require('./utils/validationUtils');
const { xssProtection, xssHelmetConfig, sqlInjectionProtection } = require('./middlewares/xssProtection');
const { 
  validateApiVersion, 
  getVersionInfo, 
  getAllVersions, 
  checkDeprecation,
  versionErrorHandler 
} = require('./middlewares/apiVersioning');
const { 
  validateRequestSize, 
  dosProtection, 
  requestTimeout, 
  memoryMonitor, 
  dynamicRateLimit 
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
  adaptiveRateLimit, 
  trustedSourceBypass, 
  getRateLimitStatus 
} = require('./middlewares/userRateLimiting');
const cleanupService = require('./services/cleanupService');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { requestId, additionalSecurityHeaders } = require('./middlewares/securityEnhancements');

const port = process.env.PORT || 5000;
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

// Body parsing with size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization and validation
app.use(sanitizeInput);
app.use(sqlInjectionProtection);
app.use(xssProtection);

// CSRF protection for all routes
app.use(generateCSRFToken);

// Performance monitoring middleware
app.use(performanceMiddleware);

// Cache warming middleware
app.use(warmCache);

// Cache management endpoints
app.get('/api/cache/stats', getCacheStats);
app.delete('/api/cache/clear', clearCache);

// Performance monitoring endpoints
app.get('/api/performance/metrics', (req, res) => {
  res.json({
    success: true,
    data: performanceMonitor.getMetrics()
  });
});

app.get('/api/performance/report', (req, res) => {
  res.json({
    success: true,
    data: performanceMonitor.getPerformanceReport()
  });
});

// API versioning info routes (before any other middleware)
app.get('/api/versions', getAllVersions);
app.get('/api/versions/:version', getVersionInfo);

// API versioning middleware (only for actual versioned routes)
app.use('/api/v1', validateApiVersion, checkDeprecation);
app.use('/api/v2', validateApiVersion, checkDeprecation);

// User-based rate limiting (after versioning routes)
app.use('/api', trustedSourceBypass, userRateLimit);
app.use('/api/events/search', burstRateLimit(20, 60000)); // 20 requests per minute for search
app.use('/api/upload', burstRateLimit(10, 300000)); // 10 uploads per 5 minutes

// Versioned API routes
const v1EventRoutes = require('./routes/v1/eventRoutes');
const v1UserRoutes = require('./routes/v1/userRoutes');

// API v1 routes
app.use('/api/v1/events', v1EventRoutes);
app.use('/api/v1/users', v1UserRoutes);

// Legacy routes (redirect to v1)
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', pushNotificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/social', socialMediaRoutes);

// OAuth Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Unified Communication routes
const communicationRoutes = require('./routes/communicationRoutes');
app.use('/api/communication', communicationRoutes);

// Event Management routes
const recurringEventRoutes = require('./routes/recurringEventRoutes');
const eventAnalyticsRoutes = require('./routes/eventAnalyticsRoutes');
const calendarExportRoutes = require('./routes/calendarExportRoutes');
const eventCollaborationRoutes = require('./routes/eventCollaborationRoutes');
const eventTemplateRoutes = require('./routes/eventTemplateRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const searchRoutes = require('./routes/searchRoutes');

app.use('/api/recurring-events', recurringEventRoutes);
app.use('/api/analytics', eventAnalyticsRoutes);
app.use('/api/calendar-export', calendarExportRoutes);
app.use('/api/collaboration', eventCollaborationRoutes);
app.use('/api/templates', eventTemplateRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/search', searchRoutes);

// Bookmark routes
const bookmarkRoutes = require('./routes/bookmarkRoutes');
app.use('/api/bookmarks', bookmarkRoutes);

// Waitlist routes
const waitlistRoutes = require('./routes/waitlistRoutes');
app.use('/api/waitlist', waitlistRoutes);

// Image upload routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Billing routes
const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing', billingRoutes);

// Engagement routes (polls, feed, survey, networking, microsite)
const engagementRoutes = require('./routes/engagementRoutes');
app.use('/api/engagement', engagementRoutes);

// AI-powered features routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Support ticket and FAQ routes
const supportRoutes = require('./routes/supportRoutes');
app.use('/api/support', supportRoutes);

// Check-in and QR code routes
const checkInRoutes = require('./routes/checkInRoutes');
app.use('/api/check-in', checkInRoutes);

// Review routes
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// Rate limit status endpoint
app.get('/api/rate-limit-status', getRateLimitStatus);

// Public platform stats (cached, no auth needed)
app.get('/api/stats', async (req, res) => {
  try {
    const Event = require('./models/event');
    const User = require('./models/user');
    const Category = require('./models/category');
    const Order = require('./models/order');

    const [totalEvents, totalUsers, totalCategories, totalOrders] = await Promise.all([
      Event.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ isActive: true }),
      Category.countDocuments({ isDeleted: { $ne: true } }),
      Order.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      data: { totalEvents, totalUsers, totalCategories, totalOrders }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { totalEvents: 0, totalUsers: 0, totalCategories: 0, totalOrders: 0 }
    });
  }
});

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

// Explicit route: find-or-create event chat room (avoids 404 with mounted router)
const { authenticateToken, requireAuth } = require('./middlewares/authMiddleware');
const ChatService = require('./services/chatService');
app.post('/api/chat/events/:eventId/rooms',
  authenticateToken,
  requireAuth,
  commonValidations.mongoId('eventId'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { name, description } = req.body || {};
      const chatRoom = await ChatService.findOrCreateEventChatRoom(eventId, req.user._id, {
        name: name || 'Event Chat',
        description: description || 'General discussion for this event'
      });
      res.status(201).json({ success: true, data: chatRoom });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler);

// Global error handler
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);


// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || process.env.CLIENT_BASE_URL || "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Attach Redis adapter for multi-instance scaling (if Redis is configured)
if (process.env.REDIS_URL) {
  const { createAdapter } = require('@socket.io/redis-adapter');
  const { createClient } = require('redis');
  
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  
  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter connected — multi-instance ready');
    })
    .catch((err) => {
      console.warn('Socket.IO Redis adapter failed, using in-memory (single instance only):', err.message);
    });
} else {
  console.log('Socket.IO using in-memory adapter (single instance). Set REDIS_URL for multi-instance.');
}

// Initialize chat socket
const ChatSocket = require('./socket/chatSocket');
const chatSocket = new ChatSocket(io);

server.listen(port, async () => {
  // Connect to MongoDB
  await connectToMongo();
  
  // Initialize Redis cache
  try {
    await cacheService.connect();
    } catch (error) {
    console.warn('Redis cache service not available:', error.message);
  }
  
  // Start cleanup service
  cleanupService.start();
  
  // Start reminder service (automated email reminders)
  const reminderService = require('./services/reminderService');
  reminderService.start();
  
  // Start performance monitoring
  setInterval(() => {
    performanceMonitor.exportMetrics();
  }, 60000); // Export metrics every minute
  
  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    cleanupService.stop();
    server.close(async () => {
      try {
        await cacheService.disconnect();
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        } catch (err) {
        console.error('Error during shutdown:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
});

module.exports = app;

