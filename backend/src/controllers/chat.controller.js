import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Chat Controller
 * Handles chat messages for live sessions
 * GET/POST are public, DELETE requires auth
 */

/**
 * Get Messages - GET /api/chat/:sessionId/messages
 * Public endpoint - returns last 100 messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        error: { message: 'Session not found', status: 404 }
      });
    }

    // Fetch messages (not deleted, ordered by created_at ASC)
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, session_id, sender_name, message, is_seller, created_at')
      .eq('session_id', sessionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Get messages failed', { sessionId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to fetch messages', status: 500 }
      });
    }

    // Return empty array if no messages (never 404)
    res.json({ messages: messages || [] });
  } catch (error) {
    next(error);
  }
};

/**
 * Send Message - POST /api/chat/:sessionId/messages
 * Public endpoint (rate limited) - customers can send messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { sender_name, message } = req.body;

    // Validate sender_name
    if (!sender_name || typeof sender_name !== 'string') {
      return res.status(400).json({
        error: { message: 'sender_name is required', status: 400 }
      });
    }

    const trimmedName = sender_name.trim();
    if (trimmedName.length === 0) {
      return res.status(400).json({
        error: { message: 'sender_name cannot be empty', status: 400 }
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        error: { message: 'sender_name must be 50 characters or less', status: 400 }
      });
    }

    // Validate message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: { message: 'message is required', status: 400 }
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        error: { message: 'message cannot be empty', status: 400 }
      });
    }

    if (trimmedMessage.length > 200) {
      return res.status(400).json({
        error: { message: 'message must be 200 characters or less', status: 400 }
      });
    }

    // Verify session exists AND status='live'
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        error: { message: 'Session not found', status: 404 }
      });
    }

    if (session.status !== 'live') {
      return res.status(400).json({
        error: { message: 'Cannot send messages in a non-live session', status: 400 }
      });
    }

    // Insert message with is_seller: false
    const { data: newMessage, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        sender_name: trimmedName,
        message: trimmedMessage,
        is_seller: false
      }])
      .select('id, session_id, sender_name, message, is_seller, created_at')
      .single();

    if (error || !newMessage) {
      logger.error('Send message failed', { sessionId, error: error?.message });
      return res.status(500).json({
        error: { message: 'Failed to send message', status: 500 }
      });
    }

    res.status(201).json({ message: newMessage });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Message - DELETE /api/chat/:sessionId/messages/:id
 * Auth required - only session owner (seller) can delete
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { sessionId, id } = req.params;

    // Verify seller owns the session (join through live_sessions)
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('live_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('seller_id', sellerId)
      .single();

    if (sessionError || !session) {
      return res.status(403).json({
        error: { message: 'You do not have permission to delete messages in this session', status: 403 }
      });
    }

    // Verify message exists in this session and not already deleted
    const { data: existingMessage, error: msgError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, deleted_at')
      .eq('id', id)
      .eq('session_id', sessionId)
      .single();

    if (msgError || !existingMessage) {
      return res.status(404).json({
        error: { message: 'Message not found', status: 404 }
      });
    }

    if (existingMessage.deleted_at) {
      return res.status(400).json({
        error: { message: 'Message already deleted', status: 400 }
      });
    }

    // Soft delete: set deleted_at=NOW()
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('session_id', sessionId);

    if (error) {
      logger.error('Delete message failed', { messageId: id, sessionId, error: error.message });
      return res.status(500).json({
        error: { message: 'Failed to delete message', status: 500 }
      });
    }

    logger.info('Chat message deleted', { messageId: id, sessionId, sellerId });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
