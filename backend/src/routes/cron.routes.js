import express from 'express';
import { syncSheets } from '../controllers/cron.controller.js';

const router = express.Router();

/**
 * Cron Routes
 * Base path: /api/cron
 *
 * These endpoints are called by Vercel Cron or manually by developers
 * Authentication via CRON_SECRET header (not JWT)
 */

// POST /api/cron/sync-sheets - Retry failed Sheets syncs
router.post('/sync-sheets', syncSheets);

export default router;
