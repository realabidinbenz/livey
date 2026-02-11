import logger from '../utils/logger.js';

/**
 * Error handling middleware
 * Catches all errors and returns consistent JSON response
 * Logs errors with full stack trace
 */
export const errorMiddleware = (err, req, res, next) => {
  // Log error with full context
  logger.error('API error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id || 'anonymous',
    body: req.body
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
