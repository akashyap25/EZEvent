const rateLimit = require('express-rate-limit');
const { securityConfig } = require('../config/security');
const logger = require('../utils/logger');

const getClientKey = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  return ip.includes(':') ? ip : ip;
};

// Redis store factory for rate limiting (persists across server restarts)
let redisStoreFactory = undefined;
if (process.env.REDIS_URL) {
  try {
    const { RedisStore } = require('rate-limit-redis');
    const { createClient } = require('redis');
    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(() => {});
    redisStoreFactory = (prefix) => new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix
    });
    logger.info('Rate limiter using Redis store (persistent across restarts)');
  } catch (err) {
    logger.warn('Rate limiter using in-memory store (Redis not available)');
  }
} else {
  logger.info('Rate limiter using in-memory store (set REDIS_URL for persistence)');
}

// Authentication rate limiting
const authRateLimit = rateLimit({
  ...securityConfig.rateLimits.auth,
  ...(redisStoreFactory && { store: redisStoreFactory('auth:') }),
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${getClientKey(req)}-${email}`;
  },
  skip: (req) => {
    // Skip rate limiting for successful requests
    return req.auth?.userId;
  }
});

// Password reset rate limiting
const passwordResetRateLimit = rateLimit({
  ...securityConfig.rateLimits.passwordReset,
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${getClientKey(req)}-${email}`;
  }
});

// General API rate limiting
const generalRateLimit = rateLimit({
  ...securityConfig.rateLimits.general,
  ...(redisStoreFactory && { store: redisStoreFactory('general:') })
});

// Account lockout rate limiting (for failed login attempts)
const accountLockoutRateLimit = rateLimit({
  windowMs: securityConfig.accountLockout.lockoutDuration,
  max: securityConfig.accountLockout.maxFailedAttempts,
  message: {
    success: false,
    message: 'Too many failed login attempts. Account temporarily locked.',
    code: 'ACCOUNT_LOCKED',
    lockoutDuration: securityConfig.accountLockout.lockoutDuration
  },
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `lockout-${getClientKey(req)}-${email}`;
  },
  skip: (req) => {
    // Skip if user is already authenticated
    return req.auth?.userId;
  }
});

// Create custom rate limiter for specific endpoints
const createCustomRateLimit = (config) => {
  return rateLimit({
    ...config,
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  authRateLimit,
  passwordResetRateLimit,
  generalRateLimit,
  accountLockoutRateLimit,
  createCustomRateLimit
};