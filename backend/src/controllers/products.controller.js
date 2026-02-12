import { supabaseAdmin } from '../config/supabase.js';
import { sellerSelect } from '../utils/query.js';
import logger from '../utils/logger.js';

/**
 * Products Controller
 * Handles product CRUD operations
 * All endpoints require authentication (req.user is set by auth middleware)
 */

/**
 * Check if a product is pinned in an active live session
 * @param {string} productId - Product UUID
 * @param {string} sellerId - Seller UUID
 * @returns {Promise<boolean>} true if product is pinned in a live session
 */
const isProductPinnedInLiveSession = async (productId, sellerId) => {
  // Find live sessions for this seller
  const { data: liveSessions } = await supabaseAdmin
    .from('live_sessions')
    .select('id')
    .eq('seller_id', sellerId)
    .eq('status', 'live');

  if (!liveSessions || liveSessions.length === 0) return false;

  const liveSessionIds = liveSessions.map(s => s.id);

  // Check if product is pinned in any of those sessions
  const { data: pinnedEntries } = await supabaseAdmin
    .from('session_products')
    .select('id')
    .eq('product_id', productId)
    .in('session_id', liveSessionIds)
    .not('pinned_at', 'is', null)
    .limit(1);

  return pinnedEntries && pinnedEntries.length > 0;
};

/**
 * List Products - Get seller's products (paginated)
 * GET /api/products?limit=50&offset=0
 */
export const listProducts = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset) || 0;

    const { data: products, error, count } = await sellerSelect('products', sellerId, '*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('List products failed', { sellerId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to fetch products', status: 500 }
      });
    }

    res.json({
      products,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Product
 * POST /api/products
 * Body: { name, price, image_url?, stock?, description? }
 */
export const createProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { name, price, image_url, stock, description } = req.body;

    // Validate required fields
    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        error: { message: 'Name and price are required', status: 400 }
      });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        error: { message: 'Price must be a positive number', status: 400 }
      });
    }

    if (stock !== undefined && stock !== null) {
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          error: { message: 'Stock must be a positive number', status: 400 }
        });
      }
    }

    // Create product
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([{
        seller_id: sellerId,
        name,
        price,
        image_url: image_url || null,
        stock: stock !== undefined ? stock : null, // NULL means unlimited
        description: description || null
      }])
      .select()
      .single();

    if (error) {
      logger.error('Create product failed', { sellerId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to create product', status: 500 }
      });
    }

    logger.info('Product created', {
      productId: product.id,
      sellerId,
      name: product.name,
      price: product.price
    });

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const { data: product, error } = await sellerSelect('products', sellerId)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !product) {
      return res.status(404).json({
        error: { message: 'Product not found', status: 404 }
      });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Product
 * PUT /api/products/:id
 * Body: { name?, price?, image_url?, stock?, description? }
 */
export const updateProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { name, price, image_url, stock, description } = req.body;

    // Check if product is pinned in a live session
    const isPinned = await isProductPinnedInLiveSession(id, sellerId);
    if (isPinned) {
      return res.status(400).json({
        error: { message: 'Cannot update a product while it is pinned in an active live session', status: 400 }
      });
    }

    // Validate price if provided
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({
          error: { message: 'Price must be a positive number', status: 400 }
        });
      }
    }

    // Validate stock if provided
    if (stock !== undefined && stock !== null) {
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          error: { message: 'Stock must be a positive number', status: 400 }
        });
      }
    }

    // Build update object (only include provided fields)
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (image_url !== undefined) updates.image_url = image_url;
    if (stock !== undefined) updates.stock = stock;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { message: 'No fields to update', status: 400 }
      });
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('seller_id', sellerId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !product) {
      logger.error('Update product failed', { sellerId, productId: id, error: error?.message });
      return res.status(404).json({
        error: { message: 'Product not found or update failed', status: 404 }
      });
    }

    logger.info('Product updated', {
      productId: product.id,
      sellerId,
      updates: Object.keys(updates)
    });

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Product (Soft Delete)
 * DELETE /api/products/:id
 * Sets deleted_at timestamp instead of actually deleting
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    // Check if product is pinned in a live session
    const isPinned = await isProductPinnedInLiveSession(id, sellerId);
    if (isPinned) {
      return res.status(400).json({
        error: { message: 'Cannot delete a product while it is pinned in an active live session', status: 400 }
      });
    }

    // Soft delete (set deleted_at)
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('seller_id', sellerId)
      .is('deleted_at', null) // Only delete if not already deleted
      .select()
      .single();

    if (error || !product) {
      return res.status(404).json({
        error: { message: 'Product not found', status: 404 }
      });
    }

    logger.info('Product deleted (soft)', {
      productId: product.id,
      sellerId,
      name: product.name
    });

    res.json({
      message: 'Product deleted successfully',
      product: { id: product.id, name: product.name }
    });
  } catch (error) {
    next(error);
  }
};
