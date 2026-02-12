import express from 'express';
import {
  getMessages,
  sendMessage,
  deleteMessage
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { chatLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * Chat Routes
 * Base path: /api/chat
 * GET/POST are public, DELETE requires auth (applied per-route)
 */

// Public routes
router.get('/:sessionId/messages', getMessages);
router.post('/:sessionId/messages', chatLimiter, sendMessage);

// Auth-only route (applied per-route, not via router.use)
router.delete('/:sessionId/messages/:id', requireAuth, deleteMessage);

export default router;
