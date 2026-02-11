import express from 'express';
import {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/products.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Products Routes
 * Base path: /api/products
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(requireAuth);

// GET /api/products - List seller's products (paginated)
router.get('/', listProducts);

// POST /api/products - Create new product
router.post('/', createProduct);

// GET /api/products/:id - Get single product
router.get('/:id', getProductById);

// PUT /api/products/:id - Update product
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', deleteProduct);

export default router;
