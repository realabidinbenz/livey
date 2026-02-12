import express from 'express';
import {
  createSession,
  getActiveSession,
  getSessionById,
  endSession,
  pinProduct,
  listSessions
} from '../controllers/sessions.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Sessions Routes
 * Base path: /api/sessions
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(requireAuth);

// CRITICAL: /active MUST be registered BEFORE /:id
// Otherwise Express matches "active" as a UUID parameter

// GET /api/sessions/active - Get seller's active session
router.get('/active', getActiveSession);

// GET /api/sessions - List all sessions (paginated)
router.get('/', listSessions);

// POST /api/sessions - Create new session
router.post('/', createSession);

// GET /api/sessions/:id - Get session by ID
router.get('/:id', getSessionById);

// PUT /api/sessions/:id/end - End a live session
router.put('/:id/end', endSession);

// POST /api/sessions/:id/pin - Pin a product in session
router.post('/:id/pin', pinProduct);

export default router;
