import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { sellerSelect } from '../utils/query.js';
import { syncOrderToSheets } from '../services/sheets.sync.service.js';
import { normalizePhone } from '../middleware/validation.middleware.js';
import logger from '../utils/logger.js';

/**
 * Orders Controller
 * Handles order creation and management
 *
 * CREATE is public (from widget)
 * LIST, GET, UPDATE are seller-only (require auth)
 */

/**
 * Generate Order Number (race-condition free)
 * Format: ORD-YYYYMMDD-XXXX (date + 4-char random hex)
 * No DB query needed. Collision probability: ~1 in 65,536 per day.
 */
const generateOrderNumber = () => {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = crypto.randomBytes(2).toString('hex');
  return `ORD-${today}-${random}`;
};

/**
 * Create Order (PUBLIC - no auth required)
 * POST /api/orders
 * Body: {
 *   product_id: string,
 *   session_id?: string (optional),
 *   customer_name: string,
 *   customer_phone: string,
 *   customer_address: string,
 *   quantity: number (optional, default 1)
 * }
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      product_id,
      session_id,
      customer_name,
      customer_phone,
      customer_address,
      quantity
    } = req.body;

    // Validate required fields
    if (!product_id || !customer_name || !customer_phone || !customer_address) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: product_id, customer_name, customer_phone, customer_address',
          status: 400
        }
      });
    }

    // Validate quantity (must be a positive integer, default 1)
    const orderQuantity = (quantity === undefined || quantity === null) ? 1 : quantity;
    if (typeof orderQuantity !== 'number' || !Number.isInteger(orderQuantity) || orderQuantity < 1) {
      return res.status(400).json({
        error: { message: 'Quantity must be a positive integer', status: 400 }
      });
    }

    // Validate field lengths (prevent abuse + Google Sheets cell overflow)
    if (customer_name.length > 100) {
      return res.status(400).json({
        error: { message: 'Customer name must be 100 characters or less', status: 400 }
      });
    }

    if (customer_address.length > 500) {
      return res.status(400).json({
        error: { message: 'Customer address must be 500 characters or less', status: 400 }
      });
    }

    // Normalize and validate phone (handles +213, spaces, dashes)
    const normalizedPhone = normalizePhone(customer_phone);
    const phoneRegex = /^(05|06|07)\d{8}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        error: {
          message: 'Invalid phone number. Must be 10 digits starting with 05, 06, or 07',
          status: 400
        }
      });
    }

    // Fetch product (need to snapshot name, price, seller_id)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, seller_id')
      .eq('id', product_id)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        error: { message: 'Product not found or no longer available', status: 404 }
      });
    }

    // Calculate total price (server-side, never trust client)
    const totalPrice = product.price * orderQuantity;

    // Generate order number (random hex, no DB query needed)
    const orderNumber = generateOrderNumber();

    // Decrease stock if stock tracking is enabled (stock is not null)
    if (product.stock !== null) {
      const newStock = product.stock - orderQuantity;

      const { error: stockError } = await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', product_id);

      if (stockError) {
        logger.error('Failed to update stock', {
          productId: product_id,
          error: stockError.message
        });
        // Don't block order if stock update fails (seller handles manually per MVP spec)
      }
    }

    // Create order (random hex order number eliminates race conditions)
    const orderData = {
      order_number: orderNumber,
      session_id: session_id || null,
      product_id: product.id,
      seller_id: product.seller_id,
      customer_name: customer_name.trim(),
      customer_phone: normalizedPhone,
      customer_address: customer_address.trim(),
      product_name: product.name,
      product_price: product.price,
      quantity: orderQuantity,
      total_price: totalPrice,
      status: 'pending'
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError || !order) {
      logger.error('Create order failed', {
        productId: product_id,
        sellerId: product.seller_id,
        error: orderError?.message
      });
      return res.status(500).json({
        error: { message: 'Failed to create order', status: 500 }
      });
    }

    logger.info('Order created', {
      orderId: order.id,
      orderNumber: order.order_number,
      sellerId: order.seller_id,
      productId: order.product_id,
      productName: order.product_name,
      quantity: order.quantity,
      totalPrice: order.total_price
    });

    // Fire-and-forget: sync to Google Sheets (async, non-blocking)
    syncOrderToSheets(order).catch((err) => {
      logger.error('Sheets sync fire-and-forget error', {
        orderId: order.id,
        error: err.message
      });
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * List Orders (Seller only - requires auth)
 * GET /api/orders?limit=50&offset=0
 */
export const listOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset) || 0;

    const { data: orders, error, count } = await sellerSelect('orders', sellerId, '*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('List orders failed', { sellerId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to fetch orders', status: 500 }
      });
    }

    res.json({
      orders,
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
 * Get Order by ID (Seller only - requires auth)
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const { data: order, error } = await sellerSelect('orders', sellerId)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        error: { message: 'Order not found', status: 404 }
      });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status (Seller only - requires auth)
 * PUT /api/orders/:id/status
 * Body: { status: 'pending' | 'confirmed' | 'cancelled' | 'delivered' }
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          status: 400
        }
      });
    }

    // Fetch current order to log the old status
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .eq('seller_id', sellerId)
      .single();

    if (!currentOrder) {
      return res.status(404).json({
        error: { message: 'Order not found', status: 404 }
      });
    }

    const oldStatus = currentOrder.status;

    // Update order status
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (error || !order) {
      logger.error('Update order status failed', {
        sellerId,
        orderId: id,
        error: error?.message
      });
      return res.status(404).json({
        error: { message: 'Order not found or update failed', status: 404 }
      });
    }

    logger.info('Order status updated', {
      orderId: order.id,
      orderNumber: order.order_number,
      sellerId,
      oldStatus,
      newStatus: status
    });

    res.json({ order });
  } catch (error) {
    next(error);
  }
};
