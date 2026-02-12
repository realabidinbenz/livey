import express from 'express';
import { getWidgetData } from '../controllers/widget.controller.js';

const router = express.Router();

/**
 * Widget Routes
 * Base path: /api/widget
 * Public endpoint - no auth required, global rate limiter applies (100/min)
 */

router.get('/:sessionId', getWidgetData);

export default router;
