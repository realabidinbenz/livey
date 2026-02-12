// Main Widget Application Component
// This is the root component for the embeddable widget
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { useWidgetData } from './hooks/useWidgetData';
import { useChat } from './hooks/useChat';
import { YouTubePlayer } from './components/YouTubePlayer';
import { ProductCard } from './components/ProductCard';
import { ChatPanel } from './components/ChatPanel';
import { OrderForm } from './components/OrderForm';
import { OrderConfirmation } from './components/OrderConfirmation';

/**
 * WidgetApp - Main widget component that wires all hooks and components together
 * 
 * @param {Object} props
 * @param {string} props.sessionId - The session ID to load
 */
export default function WidgetApp({ sessionId }) {
    // State for modals
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);

    // Hooks
    const { session, products, pinnedProduct, messages, loading, error, addMessage, removeMessage } = useWidgetData(sessionId);
    const { senderName, showNamePrompt, sending, setSenderName, sendChatMessage } = useChat();

    // Loading state
    if (loading) {
        return (
            <div className="animate-pulse space-y-3 max-w-2xl mx-auto p-3">
                <div className="bg-gray-200 rounded" style={{ paddingBottom: '56.25%' }}></div>
                <div className="bg-gray-200 rounded h-24"></div>
                <div className="bg-gray-200 rounded h-48"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-6 text-center text-red-600">
                <p>Unable to load widget</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    // Session not found
    if (!session) {
        return (
            <div className="p-6 text-center text-gray-500">
                Session not found or has ended.
            </div>
        );
    }

    return (
        <div id="livey-widget" className="space-y-3 font-sans max-w-2xl mx-auto">
            <Toaster position="top-center" richColors />

            {/* YouTube Player */}
            <YouTubePlayer
                videoId={session.youtube_video_id}
                isLive={session.status === 'live'}
                onVideoEnd={() => {/* session status will update via realtime */ }}
            />

            {/* Product Card (shows pinned product or waiting message) */}
            <ProductCard
                product={pinnedProduct}
                isLive={session.status === 'live'}
                onOrderClick={() => setShowOrderForm(true)}
            />

            {/* Chat Panel */}
            <ChatPanel
                messages={messages}
                sessionStatus={session.status}
                senderName={senderName}
                showNamePrompt={showNamePrompt}
                sending={sending}
                onSetName={setSenderName}
                onSendMessage={(text) => sendChatMessage(sessionId, text, addMessage, removeMessage)}
            />

            {/* Order Form Modal */}
            {showOrderForm && pinnedProduct && (
                <OrderForm
                    product={pinnedProduct}
                    sessionId={sessionId}
                    onSuccess={(order) => {
                        setShowOrderForm(false);
                        setCompletedOrder(order);
                    }}
                    onClose={() => setShowOrderForm(false)}
                />
            )}

            {/* Order Confirmation Modal */}
            {completedOrder && (
                <OrderConfirmation
                    order={completedOrder}
                    onClose={() => setCompletedOrder(null)}
                />
            )}
        </div>
    );
}
