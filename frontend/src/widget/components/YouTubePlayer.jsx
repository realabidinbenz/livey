import { useEffect, useRef, useState } from 'react';

/**
 * YouTubePlayer Component
 * Embeds a YouTube video with live/replay badges and handles YouTube IFrame API
 * 
 * @param {Object} props
 * @param {string} props.videoId - YouTube video ID
 * @param {boolean} props.isLive - Whether this is a live stream
 * @param {Function} props.onVideoEnd - Callback when video ends (for live streams)
 */
export function YouTubePlayer({ videoId, isLive, onVideoEnd }) {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            // Check if script tag already exists
            const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');

            if (!existingScript) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }
        }

        // Chain onto any existing callback to avoid overwriting other widgets
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (prevCallback) prevCallback();
            createPlayer();
        };

        // If API is already loaded, create player immediately
        if (window.YT && window.YT.Player) {
            createPlayer();
        }

        return () => {
            // Cleanup player on unmount
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId]);

    const createPlayer = () => {
        if (!containerRef.current || !window.YT || !window.YT.Player) return;

        // Destroy existing player if any
        if (playerRef.current) {
            playerRef.current.destroy();
        }

        try {
            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId: videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 1,
                    mute: 1,              // Auto-play requires muted (browser policy)
                    modestbranding: 1,
                    rel: 0,               // Don't show related videos
                    playsinline: 1,       // Inline on mobile (not fullscreen)
                    loop: isLive ? 0 : 1, // Loop in replay mode
                    playlist: isLive ? undefined : videoId // Required for loop
                },
                events: {
                    onReady: () => setIsReady(true),
                    onStateChange: handleStateChange,
                    onError: handleError
                }
            });
        } catch (err) {
            console.error('Error creating YouTube player:', err);
            setError('Failed to load video player');
        }
    };

    const handleStateChange = (event) => {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0 && isLive && onVideoEnd) {
            onVideoEnd();
        }
    };

    const handleError = (event) => {
        console.error('YouTube player error:', event.data);
        let errorMessage = 'Video unavailable';

        // YouTube error codes: https://developers.google.com/youtube/iframe_api_reference#onError
        switch (event.data) {
            case 2:
                errorMessage = 'Invalid video ID';
                break;
            case 5:
                errorMessage = 'HTML5 player error';
                break;
            case 100:
                errorMessage = 'Video not found or removed';
                break;
            case 101:
            case 150:
                errorMessage = 'Video is private or embed disabled';
                break;
            default:
                errorMessage = 'Video unavailable';
        }

        setError(errorMessage);
    };

    return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {/* Video container */}
            <div ref={containerRef} className="absolute inset-0 bg-black" />

            {/* Error overlay */}
            {error && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-center p-4">
                        <svg
                            className="w-12 h-12 text-gray-500 mx-auto mb-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <p className="text-white text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* REPLAY badge (if not live) */}
            {!isLive && (
                <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
                    REPLAY
                </span>
            )}

            {/* LIVE badge (if live) */}
            {isLive && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                </span>
            )}
        </div>
    );
}

export default YouTubePlayer;
