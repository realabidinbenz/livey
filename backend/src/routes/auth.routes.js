import express from 'express';
import { signup, login, logout, me } from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * Auth Routes
 * Base path: /api/auth
 */

// POST /api/auth/signup - Create new seller account (rate limited)
router.post('/signup', authLimiter, signup);

// POST /api/auth/login - Authenticate existing user (rate limited)
router.post('/login', authLimiter, login);

// POST /api/auth/logout - Sign out user
router.post('/logout', logout);

// GET /api/auth/me - Get current user info
router.get('/me', me);

export default router;
