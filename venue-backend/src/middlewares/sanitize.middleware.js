const sanitizeHtml = require('sanitize-html');

/**
 * Recursively sanitizes strings in an object/array.
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      return sanitizeHtml(obj, {
        allowedTags: [], // Strip all tags by default for generic fields
        allowedAttributes: {},
      });
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

/**
 * Middleware to sanitize request body strings to prevent XSS.
 */
const sanitizeMiddleware = (options = {}) => (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

module.exports = sanitizeMiddleware;
