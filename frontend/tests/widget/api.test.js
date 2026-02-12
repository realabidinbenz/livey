import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mocks with vi.hoisted so they exist before module evaluation
const { mockGet, mockPost } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn()
}));

// Mock ky before api.js imports it — the factory returns the hoisted mocks
vi.mock('ky', () => ({
    default: {
        create: vi.fn(() => ({
            get: mockGet,
            post: mockPost
        }))
    }
}));

import { fetchWidgetData, createOrder, fetchMessages, sendMessage } from '../../src/widget/services/api';

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchWidgetData', () => {
        it('calls correct URL with sessionId', async () => {
            const mockResponse = { session: {}, products: [] };
            // ky.get() returns an object with .json() method (not a promise)
            mockGet.mockReturnValue({
                json: () => Promise.resolve(mockResponse)
            });

            await fetchWidgetData('test-session-id');

            expect(mockGet).toHaveBeenCalledWith('api/widget/test-session-id');
        });

        it('returns widget data on success', async () => {
            const mockData = {
                session: { id: '123', status: 'live' },
                products: [],
                pinned_product: null,
                messages: []
            };
            mockGet.mockReturnValue({
                json: () => Promise.resolve(mockData)
            });

            const result = await fetchWidgetData('test-session');
            expect(result).toEqual(mockData);
        });
    });

    describe('createOrder', () => {
        it('sends correct body to orders endpoint', async () => {
            const orderData = {
                product_id: 'prod-123',
                session_id: 'sess-456',
                customer_name: 'Ahmed Benali',
                customer_phone: '0551234567',
                customer_address: 'Alger Centre',
                quantity: 2
            };
            const mockResponse = { order: { id: 'order-789' } };
            mockPost.mockReturnValue({
                json: () => Promise.resolve(mockResponse)
            });

            await createOrder(orderData);

            expect(mockPost).toHaveBeenCalledWith('api/orders', {
                json: orderData
            });
        });

        it('returns order data on success', async () => {
            const mockResponse = { order: { id: 'order-123', order_number: 'ORD-001' } };
            mockPost.mockReturnValue({
                json: () => Promise.resolve(mockResponse)
            });

            const result = await createOrder({ product_id: '123' });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('error handling', () => {
        it('handles 429 rate limit error with specific message', async () => {
            const error = new Error('Rate limit exceeded');
            error.response = {
                json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } })
            };
            // ky's .json() rejects when response is non-2xx
            mockGet.mockReturnValue({
                json: () => Promise.reject(error)
            });

            await expect(fetchWidgetData('test')).rejects.toThrow('Rate limit exceeded');
        });

        it('extracts specific error message from API response', async () => {
            const error = new Error();
            error.response = {
                json: () => Promise.resolve({ error: { message: 'Product out of stock' } })
            };
            mockGet.mockReturnValue({
                json: () => Promise.reject(error)
            });

            await expect(fetchWidgetData('test')).rejects.toThrow('Product out of stock');
        });

        it('handles network errors gracefully', async () => {
            const error = new Error('Network error');
            mockGet.mockReturnValue({
                json: () => Promise.reject(error)
            });

            await expect(fetchWidgetData('test')).rejects.toThrow('Network error. Please check your connection.');
        });

        it('handles generic request failure', async () => {
            const error = new Error('Request failed');
            error.response = {
                json: () => Promise.reject(new Error('Parse error'))
            };
            mockGet.mockReturnValue({
                json: () => Promise.reject(error)
            });

            await expect(fetchWidgetData('test')).rejects.toThrow('Request failed');
        });
    });

    describe('fetchMessages', () => {
        it('calls correct URL with sessionId', async () => {
            const mockResponse = { messages: [] };
            mockGet.mockReturnValue({
                json: () => Promise.resolve(mockResponse)
            });

            await fetchMessages('test-session');

            expect(mockGet).toHaveBeenCalledWith('api/chat/test-session/messages');
        });
    });

    describe('sendMessage', () => {
        it('sends correct body to messages endpoint', async () => {
            const messageData = { sender_name: 'Ahmed', message: 'Hello!' };
            const mockResponse = { message: { id: 'msg-123' } };
            mockPost.mockReturnValue({
                json: () => Promise.resolve(mockResponse)
            });

            await sendMessage('test-session', messageData);

            expect(mockPost).toHaveBeenCalledWith('api/chat/test-session/messages', {
                json: messageData
            });
        });
    });
});
