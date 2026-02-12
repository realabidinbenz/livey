import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Widget Controller
 * Handles public widget data endpoint - returns session, products, and chat messages
 * This is a PUBLIC endpoint (no auth required)
 */

/**
 * Get Widget Data - GET /api/widget/:sessionId
 * Returns session info, products, pinned product, and recent chat messages
 */
export const getWidgetData = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        // Validate UUID format (defense-in-depth)
        if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
            return res.status(400).json({
                error: { message: 'Invalid session ID format', status: 400 }
            });
        }

        // Fetch session (exclude seller_id for privacy)
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('live_sessions')
            .select('id, youtube_video_id, status, embed_code, started_at, ended_at, created_at')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({
                error: { message: 'Session not found', status: 404 }
            });
        }

        // Fetch session_products with joined product data
        const { data: sessionProducts, error: productsError } = await supabaseAdmin
            .from('session_products')
            .select(`
        id,
        session_id,
        product_id,
        pinned_at,
        products:product_id (id, name, price, image_url, stock, description)
      `)
            .eq('session_id', sessionId);

        if (productsError) {
            logger.error('Failed to fetch session products', { sessionId, error: productsError.message });
            return res.status(500).json({
                error: { message: 'Failed to fetch session products', status: 500 }
            });
        }

        // Find pinned product
        const pinnedProduct = sessionProducts?.find(sp => sp.pinned_at !== null) || null;

        // Fetch last 100 chat messages
        const { data: messages, error: messagesError } = await supabaseAdmin
            .from('chat_messages')
            .select('id, session_id, sender_name, message, is_seller, created_at')
            .eq('session_id', sessionId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(100);

        if (messagesError) {
            logger.error('Failed to fetch chat messages', { sessionId, error: messagesError.message });
            return res.status(500).json({
                error: { message: 'Failed to fetch chat messages', status: 500 }
            });
        }

        logger.info('Widget data fetched', { sessionId, status: session.status });

        res.json({
            session,
            products: sessionProducts || [],
            pinned_product: pinnedProduct,
            messages: messages || []
        });
    } catch (error) {
        next(error);
    }
};
