import express from 'express';
import {
  connect,
  callback,
  status,
  test,
  disconnect
} from '../controllers/sheets.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Sheets Routes
 * Base path: /api/sheets
 */

// GET /api/sheets/callback - OAuth callback (public - Google redirects here)
router.get('/callback', callback);

// Apply auth middleware to remaining routes
router.use(requireAuth);

// POST /api/sheets/connect - Start OAuth flow
router.post('/connect', connect);

// GET /api/sheets/status - Check connection status
router.get('/status', status);

// POST /api/sheets/test - Test connection
router.post('/test', test);

// DELETE /api/sheets/disconnect - Remove connection
router.delete('/disconnect', disconnect);

export default router;
