import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Auth Controller
 * Handles user authentication (signup, login, logout, me)
 */

/**
 * Signup - Create new seller account
 * POST /api/auth/signup
 * Body: { email, password }
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required', status: 400 }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: { message: 'Password must be at least 8 characters', status: 400 }
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      logger.error('Signup failed', { email, error: error.message });
      return res.status(400).json({
        error: { message: error.message, status: 400 }
      });
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email }]);

    if (profileError) {
      logger.error('Profile creation failed', { userId: data.user.id, error: profileError.message });
      // User created but profile failed - this is handled by trigger in production
    }

    logger.info('User signup', { userId: data.user.id, email });

    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: data.session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login - Authenticate existing user
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required', status: 400 }
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.warn('Login failed', { email, reason: error.message });
      return res.status(401).json({
        error: { message: 'Invalid email or password', status: 401 }
      });
    }

    logger.info('User login', { userId: data.user.id, email });

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: data.session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout - Sign out user
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <token>
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: { message: 'No token provided', status: 401 }
      });
    }

    // Sign out with Supabase Auth
    const { error } = await supabase.auth.signOut(token);

    if (error) {
      logger.error('Logout failed', { error: error.message });
      return res.status(400).json({
        error: { message: error.message, status: 400 }
      });
    }

    logger.info('User logout', { userId: req.user?.id });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Me - Get current user info
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
export const me = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: { message: 'No token provided', status: 401 }
      });
    }

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: { message: 'Invalid token', status: 401 }
      });
    }

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        business_name: profile?.business_name
      }
    });
  } catch (error) {
    next(error);
  }
};
