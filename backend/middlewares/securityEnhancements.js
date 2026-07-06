const crypto = require('crypto');

/**
 * Request ID middleware - adds unique ID to each request for tracing
 */
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Sanitize response data - remove sensitive fields before sending
 */
const sanitizeResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    if (data && typeof data === 'object') {
      data = removeSensitiveFields(data);
    }
    return originalJson(data);
  };
  
  next();
};

const SENSITIVE_FIELDS = ['password', 'passwordHistory', '__v', 'failedLoginAttempts', 'lockoutUntil'];

function removeSensitiveFields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => removeSensitiveFields(item));
  }
  
  if (obj && typeof obj === 'object') {
    // Handle Mongoose documents
    const plain = obj.toObject ? obj.toObject() : { ...obj };
    
    for (const field of SENSITIVE_FIELDS) {
      delete plain[field];
    }
    
    return plain;
  }
  
  return obj;
}

/**
 * Security headers beyond Helmet defaults
 */
const additionalSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Disabled in favor of CSP
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

module.exports = {
  requestId,
  sanitizeResponse,
  additionalSecurityHeaders
};
