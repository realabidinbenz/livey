import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchWidgetData } from '../services/api'
import { subscribeToSession } from '../services/realtime'

/**
 * Central state management for widget data
 * Fetches initial data, handles realtime updates, manages loading/error states
 * @param {string} sessionId - The session ID
 * @returns {Object} Widget data and state
 */
export function useWidgetData(sessionId) {
    // State:
    const [session, setSession] = useState(null);        // Session object
    const [products, setProducts] = useState([]);        // Array of session_products
    const [pinnedProduct, setPinnedProduct] = useState(null);  // Currently pinned product
    const [messages, setMessages] = useState([]);        // Chat messages array
    const [loading, setLoading] = useState(true);        // Initial loading state
    const [error, setError] = useState(null);            // Error message string
    const [realtimeConnected, setRealtimeConnected] = useState(false);

    const pollingIntervalRef = useRef(null);
    const unsubscribeRef = useRef(null);

    // On mount (useEffect with [sessionId]):
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchWidgetData(sessionId);
                setSession(data.session);
                setProducts(data.products);
                setPinnedProduct(data.pinned_product);
                setMessages(data.messages);
                setLoading(false);

                // Subscribe to realtime
                const { unsubscribe } = subscribeToSession(sessionId, {
                    onNewMessage: (newMessage) => {
                        setMessages(prev => {
                            // Deduplicate by id
                            if (prev.some(m => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage];
                        });
                    },
                    onPinChange: (updatedSessionProduct) => {
                        setProducts(prev =>
                            prev.map(p => p.id === updatedSessionProduct.id ? updatedSessionProduct : p)
                        );
                        // Recalculate pinned product
                        if (updatedSessionProduct.pinned_at) {
                            setPinnedProduct(updatedSessionProduct);
                        } else if (pinnedProduct?.id === updatedSessionProduct.id) {
                            setPinnedProduct(null);
                        }
                    },
                    onSessionStatusChange: (updatedSession) => {
                        setSession(prev => ({ ...prev, ...updatedSession }));
                    }
                });

                unsubscribeRef.current = unsubscribe;
                setRealtimeConnected(true);
            } catch (err) {
                setError(err.message || 'Failed to load widget data');
                setLoading(false);
            }
        };

        loadData();

        // Cleanup on unmount or sessionId change
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [sessionId]);

    // Polling fallback (useEffect):
    useEffect(() => {
        // If realtimeConnected is false after 5 seconds:
        //   - Poll fetchWidgetData(sessionId) every 3 seconds
        //   - Update messages and pinnedProduct from response
        //   - Clear interval on cleanup or when realtime connects

        if (!realtimeConnected && !loading) {
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    const data = await fetchWidgetData(sessionId);
                    setMessages(data.messages);
                    setPinnedProduct(data.pinned_product);
                    setSession(data.session);
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 3000);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [realtimeConnected, loading, sessionId]);

    // Expose: addMessage(msg) for optimistic UI
    const addMessage = useCallback((msg) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    // Expose: removeMessage(msgId) for rolling back failed optimistic messages
    const removeMessage = useCallback((msgId) => {
        setMessages(prev => prev.filter(m => m.id !== msgId));
    }, []);

    // Return: { session, products, pinnedProduct, messages, loading, error, addMessage, removeMessage }
    return { session, products, pinnedProduct, messages, loading, error, addMessage, removeMessage };
}
