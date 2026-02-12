import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../../utils/formatters';

/**
 * ChatPanel Component
 * Real-time chat display with name prompt and message input
 * 
 * @param {Object} props
 * @param {Array} props.messages - Array of chat messages
 * @param {string} props.sessionStatus - 'live' or 'ended'
 * @param {string} props.senderName - Current user's sender name
 * @param {boolean} props.showNamePrompt - Whether to show name input prompt
 * @param {boolean} props.sending - Whether a message is being sent
 * @param {Function} props.onSetName - Callback to set sender name
 * @param {Function} props.onSendMessage - Callback to send message
 */
export function ChatPanel({
    messages,
    sessionStatus,
    senderName,
    showNamePrompt,
    sending,
    onSetName,
    onSendMessage
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [nameInputValue, setNameInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const isLive = sessionStatus === 'live';

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    // On desktop, auto-expand; on mobile, collapsed by default
    useEffect(() => {
        const checkMobile = () => {
            setIsExpanded(window.innerWidth >= 640);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        // If name prompt is showing, don't send until name is set
        if (showNamePrompt) return;

        onSendMessage(inputValue.trim());
        setInputValue('');
    };

    const handleSetName = (e) => {
        e.preventDefault();

        const trimmedName = nameInputValue.trim();
        if (!trimmedName) return;
        if (trimmedName.length > 50) return;

        onSetName(trimmedName);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with collapse toggle */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer sm:cursor-default"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <span className="font-semibold text-sm text-gray-700">Live Chat</span>
                    {isLive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                </div>
                <button className="sm:hidden text-gray-400">
                    <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
            </div>

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[300px]' : 'max-h-0 sm:max-h-[300px]'
                    }`}
            >
                <div className="flex-1 overflow-y-auto space-y-2 p-3" style={{ maxHeight: '300px' }}>
                    {messages.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">
                            No messages yet. Be the first to chat!
                        </p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.is_seller ? 'justify-start' : 'justify-start'}`}
                            >
                                <div
                                    className={`rounded-lg px-3 py-1.5 max-w-[85%] ${msg.is_seller
                                            ? 'bg-livey-seller/10 border border-livey-seller/20'
                                            : 'bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-xs font-semibold ${msg.is_seller ? 'text-livey-seller' : 'text-gray-700'
                                            }`}>
                                            {msg.sender_name}
                                        </span>
                                        {msg.is_seller && (
                                            <span className="text-[10px] bg-livey-seller text-white px-1.5 py-0.5 rounded font-medium">
                                                SELLER
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 ml-auto">
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800 break-words mt-0.5">
                                        {msg.message}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Name Prompt */}
            {showNamePrompt && isExpanded && (
                <div className="px-3 py-2 bg-blue-50 border-t border-blue-100">
                    <p className="text-xs text-blue-700 mb-2">Enter your name to join the chat</p>
                    <form onSubmit={handleSetName} className="flex gap-2">
                        <input
                            type="text"
                            value={nameInputValue}
                            onChange={(e) => setNameInputValue(e.target.value)}
                            placeholder="Your name"
                            maxLength={50}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-livey-primary focus:border-transparent"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!nameInputValue.trim() || nameInputValue.trim().length > 50}
                            className="px-3 py-1.5 bg-livey-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Join Chat
                        </button>
                    </form>
                </div>
            )}

            {/* Input area */}
            {isExpanded && (
                <div className="border-t border-gray-200">
                    {isLive ? (
                        <form onSubmit={handleSendMessage} className="flex gap-2 p-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={senderName ? "Type a message..." : "Enter your name first..."}
                                disabled={!senderName || sending}
                                maxLength={500}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-livey-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || !senderName || sending}
                                className="px-4 py-2 bg-livey-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                {sending ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12" cy="12" r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                        Send
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="px-3 py-2 bg-gray-50 text-center">
                            <p className="text-xs text-gray-500">
                                Chat is view-only in replay mode
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ChatPanel;
