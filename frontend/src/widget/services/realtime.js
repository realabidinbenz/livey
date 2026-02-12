import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Subscribe to realtime updates for a widget session
 * @param {string} sessionId - The session ID to subscribe to
 * @param {Object} callbacks - Callback functions for different events
 * @param {Function} callbacks.onNewMessage - Called when a new message is inserted
 * @param {Function} callbacks.onPinChange - Called when a product is pinned/unpinned
 * @param {Function} callbacks.onSessionStatusChange - Called when session status changes
 * @returns {{unsubscribe: Function}} Object with unsubscribe function
 */
export function subscribeToSession(sessionId, callbacks) {
    const { onNewMessage, onPinChange, onSessionStatusChange } = callbacks;

    const channel = supabase.channel(`widget-session-${sessionId}`);

    // Subscribe to new chat messages
    channel.on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
            if (onNewMessage && payload.new) {
                onNewMessage(payload.new);
            }
        }
    );

    // Subscribe to product pin changes
    channel.on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_products',
            filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
            if (onPinChange && payload.new) {
                onPinChange(payload.new);
            }
        }
    );

    // Subscribe to session status changes
    channel.on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'live_sessions',
            filter: `id=eq.${sessionId}`
        },
        (payload) => {
            if (onSessionStatusChange && payload.new) {
                onSessionStatusChange(payload.new);
            }
        }
    );

    channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime connection failed, falling back to polling');
            // Set a flag that the polling fallback should activate
            // This can be accessed by components to switch to polling mode
            window.__LIVEY_REALTIME_FAILED__ = true;
        }
    });

    return {
        unsubscribe: () => {
            supabase.removeChannel(channel);
        }
    };
}

/**
 * Unsubscribe from all channels (cleanup on widget unmount)
 */
export function unsubscribeAll() {
    supabase.removeAllChannels();
}

export default supabase;
