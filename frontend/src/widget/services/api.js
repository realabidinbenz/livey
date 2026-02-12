import ky from 'ky';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = ky.create({
    prefixUrl: API_URL,
    timeout: 10000,
    retry: {
        limit: 2,
        methods: ['get']
    }
});

/**
 * Handle API errors consistently
 * @param {Error} error - The error from ky
 * @returns {Promise<never>} - Always throws
 */
async function handleError(error) {
    if (error.response) {
        let message = 'Request failed';
        try {
            const body = await error.response.json();
            message = body.error?.message || message;
        } catch {
            // JSON parse failed — keep default message
        }
        throw new Error(message);
    }
    throw new Error('Network error. Please check your connection.');
}

/**
 * Fetch widget data for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<{session, products, pinned_product, messages}>}
 * @throws {Error} On 404 (session not found) or network error
 */
export async function fetchWidgetData(sessionId) {
    try {
        return await api.get(`api/widget/${sessionId}`).json();
    } catch (error) {
        return handleError(error);
    }
}

/**
 * Fetch messages for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<{messages: Array}>}
 */
export async function fetchMessages(sessionId) {
    try {
        return await api.get(`api/chat/${sessionId}/messages`).json();
    } catch (error) {
        return handleError(error);
    }
}

/**
 * Send a message in a session
 * @param {string} sessionId - The session ID
 * @param {Object} data - Message data
 * @param {string} data.sender_name - Name of the sender
 * @param {string} data.message - Message content
 * @returns {Promise<{message: Object}>}
 * @throws {Error} On 400 (validation), 429 (rate limited)
 */
export async function sendMessage(sessionId, { sender_name, message }) {
    try {
        return await api
            .post(`api/chat/${sessionId}/messages`, {
                json: { sender_name, message }
            })
            .json();
    } catch (error) {
        return handleError(error);
    }
}

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {string} orderData.product_id - Product ID
 * @param {string} orderData.session_id - Session ID
 * @param {string} orderData.customer_name - Customer name
 * @param {string} orderData.customer_phone - Customer phone
 * @param {string} orderData.customer_address - Customer address
 * @param {number} orderData.quantity - Quantity
 * @returns {Promise<{order: Object}>}
 * @throws {Error} On 400 (validation), 404 (product not found), 429 (rate limited)
 */
export async function createOrder(orderData) {
    try {
        return await api
            .post('api/orders', {
                json: orderData
            })
            .json();
    } catch (error) {
        return handleError(error);
    }
}

export default api;
