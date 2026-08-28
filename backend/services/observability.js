/**
 * Observability & APM Module
 *
 * Provides:
 * - Error tracking (optional Sentry or local console logging)
 * - Request tracing
 * - Performance monitoring
 * - Structured logging
 * - Health metrics export
 *
 * Configuration:
 *   SENTRY_DSN=https://xxx@sentry.io/xxx  (optional, enables Sentry)
 *   LOG_LEVEL=info|debug|warn|error
 */

let Sentry = null;

if (process.env.SENTRY_DSN) {
  Sentry = require('@sentry/node');
}

const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';
const sentryEnabled = !!process.env.SENTRY_DSN;

// ─── Optional Sentry Initialization ─────────────────────────────────────

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',

    tracesSampleRate: isProduction ? 0.1 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 0,

    ignoreErrors: [
      'ECONNRESET',
      'EPIPE',
      'ECONNREFUSED',
      'jwt malformed',
      'invalid token',
      'Rate limit exceeded'
    ],

    sendDefaultPii: false,

    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    }
  });
  logger.info(`Sentry initialized (env: ${process.env.NODE_ENV}, traces: ${isProduction ? '10%' : '100%'})`);
} else {
  logger.info('Sentry not configured. Using local console/error logging for development.');
}

// ─── Express Middleware ──────────────────────────────────────────────────

/**
 * Request tracing middleware — adds trace context to every request
 */
const requestTracer = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const traceId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  req.traceId = traceId;
  res.setHeader('X-Request-ID', traceId);
  
  // Track response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Number(process.hrtime.bigint() - startTime) / 1e6; // ms
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`[SLOW] ${req.method} ${req.path} took ${duration.toFixed(0)}ms (trace: ${traceId})`);
    }
    
    // Record metrics
    metrics.recordRequest(req.method, req.path, res.statusCode, duration);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Sentry error handler — must be added AFTER routes, BEFORE other error handlers
 */
const sentryErrorHandler = sentryEnabled
  ? Sentry.Handlers?.errorHandler?.() || ((err, req, res, next) => next(err))
  : (err, req, res, next) => next(err);

/**
 * Sentry request handler — must be added BEFORE routes
 */
const sentryRequestHandler = sentryEnabled
  ? Sentry.Handlers?.requestHandler?.() || ((req, res, next) => next())
  : (req, res, next) => next();

// ─── Metrics Collector ──────────────────────────────────────────────────

class MetricsCollector {
  constructor() {
    this.requests = { total: 0, byStatus: {}, byMethod: {} };
    this.latency = { total: 0, count: 0, max: 0, p95: [] };
    this.errors = { total: 0, byType: {} };
    this.startTime = Date.now();
  }

  recordRequest(method, path, status, duration) {
    this.requests.total++;
    this.requests.byStatus[status] = (this.requests.byStatus[status] || 0) + 1;
    this.requests.byMethod[method] = (this.requests.byMethod[method] || 0) + 1;
    
    this.latency.total += duration;
    this.latency.count++;
    this.latency.max = Math.max(this.latency.max, duration);
    
    // Keep last 100 for p95 calculation
    this.latency.p95.push(duration);
    if (this.latency.p95.length > 100) this.latency.p95.shift();
  }

  recordError(error, context = {}) {
    this.errors.total++;
    const type = error.name || 'UnknownError';
    this.errors.byType[type] = (this.errors.byType[type] || 0) + 1;

    // Send to Sentry if configured
    if (sentryEnabled) {
      Sentry.captureException(error, { extra: context });
    }
  }

  getMetrics() {
    const sorted = [...this.latency.p95].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    
    return {
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      requests: this.requests,
      latency: {
        avg: this.latency.count > 0 ? Math.round(this.latency.total / this.latency.count) : 0,
        max: Math.round(this.latency.max),
        p95: sorted[p95Index] ? Math.round(sorted[p95Index]) : 0
      },
      errors: this.errors,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };
  }

  reset() {
    this.requests = { total: 0, byStatus: {}, byMethod: {} };
    this.latency = { total: 0, count: 0, max: 0, p95: [] };
    this.errors = { total: 0, byType: {} };
  }
}

const metrics = new MetricsCollector();

// ─── Structured Logger ──────────────────────────────────────────────────

/**
 * Capture and report unhandled errors
 */
const captureError = (error, context = {}) => {
  metrics.recordError(error, context);

  if (sentryEnabled && Sentry) {
    Sentry.captureException(error, { extra: context });
  }

  if (isProduction) {
    logger.error(`[ERROR] ${error.message} (${context.source || 'unknown'})`);
  } else {
    logger.error(`[ERROR] ${error.message}`, context);
  }
};

/**
 * Capture a message/event for tracking
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (sentryEnabled && Sentry) {
    Sentry.captureMessage(message, { level, extra: context });
  }
};

// ─── Global Error Handlers ──────────────────────────────────────────────

process.on('unhandledRejection', (reason, _promise) => {
  captureError(reason instanceof Error ? reason : new Error(String(reason)), {
    source: 'unhandledRejection'
  });
});

process.on('uncaughtException', (error) => {
  captureError(error, { source: 'uncaughtException' });
  if (sentryEnabled && Sentry) {
    Sentry.close(2000).then(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// ─── Exports ─────────────────────────────────────────────────────────────

module.exports = {
  Sentry,
  requestTracer,
  sentryRequestHandler,
  sentryErrorHandler,
  metrics,
  captureError,
  captureMessage,
  sentryEnabled
};
