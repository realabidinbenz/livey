import logger from '../utils/logger.js';

// Fields that must NEVER be logged (PII / secrets)
const REDACTED_FIELDS = ['password', 'token', 'refresh_token', 'access_token'];

/**
 * Sanitize request body for logging
 * Replaces sensitive fields with '[REDACTED]'
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  for (const field of REDACTED_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
};

/**
 * Error handling middleware
 * Catches all errors and returns consistent JSON response
 * Logs errors with full stack trace (passwords redacted)
 */
export const errorMiddleware = (err, req, res, next) => {
  // Log error with full context (sensitive fields stripped)
  logger.error('API error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id || 'anonymous',
    body: sanitizeBody(req.body)
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      status: statusCode
    }
  });
};
