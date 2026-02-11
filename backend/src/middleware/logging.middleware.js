import logger from '../utils/logger.js';

/**
 * Logging middleware
 * Logs every API request with: method, path, status, response time, user ID
 */
export const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('API request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip
    });
  });

  next();
};
