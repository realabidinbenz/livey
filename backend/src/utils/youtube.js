/**
 * YouTube URL Utility
 * Extracts video IDs from all common YouTube URL formats.
 *
 * No npm package needed — the popular ones (get-youtube-id, get-video-id)
 * are unmaintained (2-7 years old). This 15-line regex handles everything.
 *
 * Supported formats:
 *   youtube.com/watch?v=ID
 *   youtube.com/live/ID
 *   youtube.com/embed/ID
 *   youtube.com/shorts/ID
 *   youtu.be/ID
 *   youtube.com/v/ID
 */

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?.*v=|live\/|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/;

/**
 * Extract YouTube video ID from a URL
 * @param {string} url - YouTube URL in any common format
 * @returns {string|null} 11-character video ID, or null if invalid
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Check if a string is a valid YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  return extractYouTubeId(url) !== null;
}
