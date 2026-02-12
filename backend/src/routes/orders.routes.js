import express from 'express';
import {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { orderLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * Orders Routes
 * Base path: /api/orders
 *
 * POST /api/orders - PUBLIC (no auth required - from widget, rate limited)
 * Other routes require authentication
 */

// POST /api/orders - Create order (PUBLIC - no auth, rate limited)
router.post('/', orderLimiter, createOrder);

// Apply auth middleware to remaining routes
router.use(requireAuth);

// GET /api/orders - List seller's orders (paginated)
router.get('/', listOrders);

// GET /api/orders/:id - Get single order
router.get('/:id', getOrderById);

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', updateOrderStatus);

export default router;
