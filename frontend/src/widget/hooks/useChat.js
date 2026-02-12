import { useState, useEffect, useCallback } from 'react';
import { sendMessage } from '../services/api';
import { toast } from 'sonner';

const STORAGE_KEY = 'livey_chat_name';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Chat-specific state management hook
 * Handles sender name persistence, message sending, and optimistic UI
 * @returns {Object} Chat state and functions
 */
export function useChat() {
    // State:
    const [senderName, setSenderNameState] = useState('');
    const [showNamePrompt, setShowNamePrompt] = useState(true);
    const [sending, setSending] = useState(false);

    // SENDER NAME PERSISTENCE:
    useEffect(() => {
        // On mount: read from localStorage
        //   If exists and not expired (24 hours): set senderName, showNamePrompt=false
        //   If missing or expired: set showNamePrompt=true

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { name, timestamp } = JSON.parse(stored);
                if (Date.now() - timestamp < EXPIRY_MS) {
                    setSenderNameState(name);
                    setShowNamePrompt(false);
                }
            }
        } catch (e) {
            console.error('Failed to parse stored name:', e);
        }
    }, []);

    // setSenderName(name):
    const setSenderName = useCallback((name) => {
        // Save to localStorage, set senderName state, set showNamePrompt=false
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                name: trimmed,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to save name:', e);
        }

        setSenderNameState(trimmed);
        setShowNamePrompt(false);
    }, []);

    // sendChatMessage(sessionId, messageText, addMessageCallback, removeMessageCallback):
    const sendChatMessage = useCallback(async (sessionId, messageText, addMessageCallback, removeMessageCallback) => {
        // 1. If no senderName → set showNamePrompt=true, return
        // 2. Set sending=true
        // 3. Optimistic UI: call addMessageCallback with temp message
        // 4. Call sendMessage(sessionId, { sender_name: senderName, message: messageText })
        // 5. Set sending=false
        // 6. On error: show toast (sonner), remove temp message

        if (!senderName) {
            setShowNamePrompt(true);
            return;
        }

        const trimmed = messageText.trim();
        if (!trimmed) return;

        setSending(true);

        // Optimistic UI
        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            session_id: sessionId,
            sender_name: senderName,
            message: trimmed,
            is_seller: false,
            created_at: new Date().toISOString()
        };

        addMessageCallback(tempMessage);

        try {
            await sendMessage(sessionId, { sender_name: senderName, message: trimmed });
        } catch (err) {
            toast.error(err.message || 'Failed to send message');
            removeMessageCallback(tempId);
        } finally {
            setSending(false);
        }
    }, [senderName]);

    // Return: { senderName, showNamePrompt, sending, setSenderName, sendChatMessage }
    return { senderName, showNamePrompt, sending, setSenderName, sendChatMessage };
}
