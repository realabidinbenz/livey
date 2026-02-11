import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Orders Controller
 * Handles order creation and management
 *
 * CREATE is public (from widget)
 * LIST, GET, UPDATE are seller-only (require auth)
 */

/**
 * Generate Order Number
 * Format: ORD-YYYYMMDD-001 (sequential per day)
 */
const generateOrderNumber = async (sellerId) => {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const prefix = `ORD-${today}`;

  // Get today's order count for this seller
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .like('order_number', `${prefix}-%`);

  if (error) {
    logger.error('Failed to count orders', { sellerId, error: error.message });
    throw new Error('Failed to generate order number');
  }

  const sequence = String(count + 1).padStart(3, '0');
  return `${prefix}-${sequence}`;
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
 *   quantity: number
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

    // Validate quantity
    const orderQuantity = quantity || 1;
    if (typeof orderQuantity !== 'number' || orderQuantity < 1) {
      return res.status(400).json({
        error: { message: 'Quantity must be a positive number', status: 400 }
      });
    }

    // Validate phone format (Algerian: 05, 06, 07 + 8 digits)
    const phoneRegex = /^(05|06|07)\d{8}$/;
    if (!phoneRegex.test(customer_phone)) {
      return res.status(400).json({
        error: {
          message: 'Invalid phone number. Must be 10 digits starting with 05, 06, or 07',
          status: 400
        }
      });
    }

    // Fetch product (need to snapshot name, price, seller_id)
    const { data: product, error: productError } = await supabase
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

    // Calculate total price
    const totalPrice = product.price * orderQuantity;

    // Generate order number
    const orderNumber = await generateOrderNumber(product.seller_id);

    // Decrease stock if stock tracking is enabled (stock is not null)
    if (product.stock !== null) {
      const newStock = product.stock - orderQuantity;

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product_id);

      if (stockError) {
        logger.error('Failed to update stock', {
          productId: product_id,
          error: stockError.message
        });
        // Don't block order if stock update fails (seller can handle manually)
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        session_id: session_id || null,
        product_id: product.id,
        seller_id: product.seller_id,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_address: customer_address.trim(),
        product_name: product.name, // Snapshot
        product_price: product.price, // Snapshot
        quantity: orderQuantity,
        total_price: totalPrice,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) {
      logger.error('Create order failed', {
        productId: product_id,
        sellerId: product.seller_id,
        error: orderError.message
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

    // Query orders with pagination (RLS automatically filters by seller_id)
    const { data: orders, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
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

    // Query order (RLS ensures seller can only access their own orders)
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('seller_id', sellerId)
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

    // Update order status (RLS ensures seller can only update their own orders)
    const { data: order, error } = await supabase
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
      oldStatus: order.status,
      newStatus: status
    });

    res.json({ order });
  } catch (error) {
    next(error);
  }
};
