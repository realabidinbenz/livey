import { supabaseAuth } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Auth Middleware
 * Verifies JWT token and attaches user to req.user
 * Returns 401 if token is missing or invalid
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'No authorization token provided', status: 401 }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase Auth (uses anon client for auth verification only)
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token', { error: error?.message });
      return res.status(401).json({
        error: { message: 'Invalid or expired token', status: 401 }
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    res.status(401).json({
      error: { message: 'Authentication failed', status: 401 }
    });
  }
};
