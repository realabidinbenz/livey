import { supabaseAdmin } from '../config/supabase.js';
import { sellerSelect } from '../utils/query.js';
import { extractYouTubeId } from '../utils/youtube.js';
import logger from '../utils/logger.js';

/**
 * Sessions Controller
 * Handles live session management: create, end, pin products
 * All endpoints require authentication
 */

/**
 * Generate YouTube embed iframe HTML
 * @param {string} videoId - 11-character YouTube video ID
 * @returns {string} iframe HTML string
 */
const generateEmbedCode = (videoId) => {
  return `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
};

/**
 * Validate if a string is a valid YouTube video ID
 * @param {*} id - Value to check
 * @returns {boolean} true if valid 11-char ID
 */
const isValidVideoId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[\w-]{11}$/.test(id);
};

/**
 * Create Session - POST /api/sessions
 * Body: { youtube_url, product_ids }
 */
export const createSession = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { youtube_url, product_ids } = req.body;

    // Validate youtube_url is provided
    if (!youtube_url) {
      return res.status(400).json({
        error: { message: 'YouTube URL is required', status: 400 }
      });
    }

    // Resolve video ID: try extractYouTubeId first, then check isValidVideoId
    let videoId = extractYouTubeId(youtube_url);
    if (!videoId && isValidVideoId(youtube_url)) {
      videoId = youtube_url;
    }

    if (!videoId) {
      return res.status(400).json({
        error: { message: 'Invalid YouTube URL or video ID', status: 400 }
      });
    }

    // Validate product_ids is a non-empty array
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        error: { message: 'product_ids must be a non-empty array', status: 400 }
      });
    }

    // Verify all products belong to seller and not deleted
    const { data: validProducts, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .in('id', product_ids)
      .eq('seller_id', sellerId)
      .is('deleted_at', null);

    if (productError) {
      logger.error('Product validation failed', { sellerId, error: productError.message });
      return res.status(500).json({
        error: { message: 'Failed to validate products', status: 500 }
      });
    }

    if (validProducts.length !== product_ids.length) {
      return res.status(400).json({
        error: { message: 'One or more products not found or do not belong to you', status: 400 }
      });
    }

    // End any existing live sessions for this seller
    const { data: liveSessions } = await supabaseAdmin
      .from('live_sessions')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('status', 'live');

    if (liveSessions && liveSessions.length > 0) {
      for (const session of liveSessions) {
        // End the session
        await supabaseAdmin
          .from('live_sessions')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', session.id);

        // Clear pinned_at on session_products (only those actually pinned)
        await supabaseAdmin
          .from('session_products')
          .update({ pinned_at: null })
          .eq('session_id', session.id)
          .not('pinned_at', 'is', null);
      }
      logger.info('Auto-ended previous live sessions', { sellerId, count: liveSessions.length });
    }

    // Generate embed code
    const embedCode = generateEmbedCode(videoId);

    // Insert new live session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .insert([{
        seller_id: sellerId,
        youtube_video_id: videoId,
        status: 'live',
        embed_code: embedCode
      }])
      .select()
      .single();

    if (sessionError || !session) {
      logger.error('Create session failed', { sellerId, error: sessionError?.message });
      return res.status(500).json({
        error: { message: 'Failed to create session', status: 500 }
      });
    }

    // Insert session_products for each product_id
    const sessionProductsData = product_ids.map(productId => ({
      session_id: session.id,
      product_id: productId
    }));

    const { error: spError } = await supabaseAdmin
      .from('session_products')
      .insert(sessionProductsData);

    if (spError) {
      logger.error('Create session_products failed', { sessionId: session.id, error: spError.message });
    }

    // Fetch session_products with joined product data
    const { data: sessionProducts } = await supabaseAdmin
      .from('session_products')
      .select(`
        *,
        products:product_id (*)
      `)
      .eq('session_id', session.id);

    logger.info('Session created', {
      sessionId: session.id,
      sellerId,
      videoId,
      productCount: product_ids.length
    });

    res.status(201).json({
      session,
      products: sessionProducts || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Active Session - GET /api/sessions/active
 * Returns active session for the seller, or { session: null } if none
 */
export const getActiveSession = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const { data: session, error } = await sellerSelect('live_sessions', sellerId)
      .eq('status', 'live')
      .single();

    // No active session is a valid state - return null, not 404
    if (error?.code === 'PGRST116' || !session) {
      return res.json({ session: null });
    }

    if (error) {
      logger.error('Get active session failed', { sellerId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to fetch session', status: 500 }
      });
    }

    // Fetch session_products with joined product data
    const { data: sessionProducts } = await supabaseAdmin
      .from('session_products')
      .select(`
        *,
        products:product_id (*)
      `)
      .eq('session_id', session.id);

    // Find pinned product
    const pinnedProduct = sessionProducts?.find(sp => sp.pinned_at !== null) || null;

    res.json({
      session,
      products: sessionProducts || [],
      pinned_product: pinnedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session by ID - GET /api/sessions/:id
 */
export const getSessionById = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const { data: session, error } = await sellerSelect('live_sessions', sellerId)
      .eq('id', id)
      .single();

    if (error || !session) {
      return res.status(404).json({
        error: { message: 'Session not found', status: 404 }
      });
    }

    // Fetch session_products with joined product data
    const { data: sessionProducts } = await supabaseAdmin
      .from('session_products')
      .select(`
        *,
        products:product_id (*)
      `)
      .eq('session_id', session.id);

    // Find pinned product
    const pinnedProduct = sessionProducts?.find(sp => sp.pinned_at !== null) || null;

    res.json({
      session,
      products: sessionProducts || [],
      pinned_product: pinnedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End Session - PUT /api/sessions/:id/end
 */
export const endSession = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    // Fetch session and verify ownership + status
    const { data: session, error } = await sellerSelect('live_sessions', sellerId)
      .eq('id', id)
      .single();

    if (error || !session) {
      return res.status(404).json({
        error: { message: 'Session not found', status: 404 }
      });
    }

    if (session.status !== 'live') {
      return res.status(400).json({
        error: { message: 'Only live sessions can be ended', status: 400 }
      });
    }

    // Update session status
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('live_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      logger.error('End session failed', { sessionId: id, sellerId, error: updateError?.message });
      return res.status(500).json({
        error: { message: 'Failed to end session', status: 500 }
      });
    }

    // Clear pinned_at for this session's products (only those actually pinned)
    await supabaseAdmin
      .from('session_products')
      .update({ pinned_at: null })
      .eq('session_id', id)
      .not('pinned_at', 'is', null);

    logger.info('Session ended', { sessionId: id, sellerId });

    res.json({ session: updatedSession });
  } catch (error) {
    next(error);
  }
};

/**
 * Pin Product - POST /api/sessions/:id/pin
 * Body: { product_id }
 */
export const pinProduct = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { product_id } = req.body;

    // Validate product_id
    if (!product_id) {
      return res.status(400).json({
        error: { message: 'product_id is required', status: 400 }
      });
    }

    // Verify session exists, belongs to seller, and status='live'
    const { data: session, error } = await sellerSelect('live_sessions', sellerId)
      .eq('id', id)
      .single();

    if (error || !session) {
      return res.status(404).json({
        error: { message: 'Session not found', status: 404 }
      });
    }

    if (session.status !== 'live') {
      return res.status(400).json({
        error: { message: 'Can only pin products in live sessions', status: 400 }
      });
    }

    // Verify product belongs to seller and not deleted
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('seller_id', sellerId)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        error: { message: 'Product not found or has been deleted', status: 404 }
      });
    }

    // Check if product is already in session_products
    const { data: existingSp } = await supabaseAdmin
      .from('session_products')
      .select('id')
      .eq('session_id', id)
      .eq('product_id', product_id)
      .single();

    // If not in session_products, auto-insert it
    if (!existingSp) {
      const { error: insertError } = await supabaseAdmin
        .from('session_products')
        .insert([{ session_id: id, product_id: product_id }]);

      if (insertError) {
        logger.error('Auto-insert session_product failed', { sessionId: id, productId: product_id, error: insertError.message });
        return res.status(500).json({
          error: { message: 'Failed to add product to session', status: 500 }
        });
      }
    }

    // Clear existing pinned_at for other products in this session
    await supabaseAdmin
      .from('session_products')
      .update({ pinned_at: null })
      .eq('session_id', id)
      .neq('product_id', product_id)
      .not('pinned_at', 'is', null);

    // Set pinned_at=NOW() on the target product
    const { data: updatedSp, error: updateError } = await supabaseAdmin
      .from('session_products')
      .update({ pinned_at: new Date().toISOString() })
      .eq('session_id', id)
      .eq('product_id', product_id)
      .select(`
        *,
        products:product_id (*)
      `)
      .single();

    if (updateError || !updatedSp) {
      logger.error('Pin product failed', { sessionId: id, productId: product_id, error: updateError?.message });
      return res.status(500).json({
        error: { message: 'Failed to pin product', status: 500 }
      });
    }

    logger.info('Product pinned', { sessionId: id, productId: product_id, sellerId });

    res.json({ session_product: updatedSp });
  } catch (error) {
    next(error);
  }
};

/**
 * List Sessions - GET /api/sessions
 * Returns paginated list of seller's sessions
 */
export const listSessions = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset) || 0;

    const { data: sessions, error, count } = await sellerSelect('live_sessions', sellerId, '*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('List sessions failed', { sellerId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to fetch sessions', status: 500 }
      });
    }

    res.json({
      sessions: sessions || [],
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
