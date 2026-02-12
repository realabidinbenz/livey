import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Middleware
 * Protects against brute force, spam, and DoS attacks
 */

/**
 * Global rate limiter - applies to all routes
 * 100 requests per minute per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests, please try again later',
      status: 429
    }
  }
});

/**
 * Auth rate limiter - applies to login/signup
 * 5 requests per 15 minutes per IP (brute force protection)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again in 15 minutes',
      status: 429
    }
  }
});

/**
 * Order rate limiter - applies to public order creation
 * 10 requests per 15 minutes per IP (spam protection)
 */
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many orders, please try again later',
      status: 429
    }
  }
});

/**
 * Chat rate limiter - applies to public chat message posting
 * 10 requests per 15 minutes per IP (spam protection)
 */
export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many messages, please try again later',
      status: 429
    }
  }
});
