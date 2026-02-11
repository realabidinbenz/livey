/**
 * Simple logger utility
 * Logs to console (shows in Vercel logs)
 *
 * Usage:
 *   logger.info('Order created', { orderId: '123', sellerId: 'abc' });
 *   logger.error('Database error', { error: err.message });
 */

const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp,
      message,
      ...meta
    }));
  },

  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp,
      message,
      ...meta
    }));
  },

  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp,
      message,
      ...meta
    }));
  }
};

export default logger;
