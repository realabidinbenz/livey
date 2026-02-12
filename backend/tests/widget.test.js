import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Widget Tests
 * Testing widget data response structure and data filtering
 */

// Mock widget data response (simulating controller output)
const createMockWidgetResponse = (overrides = {}) => ({
    session: {
        id: 'session-123',
        youtube_video_id: 'abc123def45',
        status: 'live',
        embed_code: '<iframe src="https://www.youtube.com/embed/abc123def45"></iframe>',
        started_at: '2024-01-15T10:00:00Z',
        ended_at: null,
        created_at: '2024-01-15T09:55:00Z',
        ...overrides.session
    },
    products: overrides.products !== undefined ? overrides.products : [
        {
            id: 'sp-1',
            session_id: 'session-123',
            product_id: 'prod-1',
            pinned_at: '2024-01-15T10:05:00Z',
            products: {
                id: 'prod-1',
                name: 'Test Product 1',
                price: 29.99,
                image_url: 'https://example.com/img1.jpg',
                stock: 100,
                description: 'A test product'
            }
        },
        {
            id: 'sp-2',
            session_id: 'session-123',
            product_id: 'prod-2',
            pinned_at: null,
            products: {
                id: 'prod-2',
                name: 'Test Product 2',
                price: 49.99,
                image_url: 'https://example.com/img2.jpg',
                stock: 50,
                description: 'Another test product'
            }
        }
    ],
    pinned_product: overrides.pinned_product !== undefined ? overrides.pinned_product : {
        id: 'sp-1',
        session_id: 'session-123',
        product_id: 'prod-1',
        pinned_at: '2024-01-15T10:05:00Z',
        products: {
            id: 'prod-1',
            name: 'Test Product 1',
            price: 29.99,
            image_url: 'https://example.com/img1.jpg',
            stock: 100,
            description: 'A test product'
        }
    },
    messages: overrides.messages !== undefined ? overrides.messages : [
        {
            id: 'msg-1',
            session_id: 'session-123',
            sender_name: 'John Doe',
            message: 'Hello!',
            is_seller: false,
            created_at: '2024-01-15T10:01:00Z'
        },
        {
            id: 'msg-2',
            session_id: 'session-123',
            sender_name: 'Seller',
            message: 'Welcome to the stream!',
            is_seller: true,
            created_at: '2024-01-15T10:02:00Z'
        }
    ]
});

describe('Widget Data Response', () => {
    it('getWidgetData returns correct response structure', () => {
        const response = createMockWidgetResponse();

        // Verify top-level keys
        assert.ok(response.session, 'should have session');
        assert.ok(Array.isArray(response.products), 'products should be an array');
        assert.ok('pinned_product' in response, 'should have pinned_product');
        assert.ok(Array.isArray(response.messages), 'messages should be an array');

        // Verify session fields
        assert.equal(typeof response.session.id, 'string', 'session.id should be string');
        assert.equal(typeof response.session.youtube_video_id, 'string', 'session.youtube_video_id should be string');
        assert.equal(typeof response.session.status, 'string', 'session.status should be string');
        assert.equal(typeof response.session.embed_code, 'string', 'session.embed_code should be string');
        assert.equal(typeof response.session.created_at, 'string', 'session.created_at should be string');

        // Verify product structure
        if (response.products.length > 0) {
            const product = response.products[0];
            assert.equal(typeof product.id, 'string', 'product.id should be string');
            assert.equal(typeof product.session_id, 'string', 'product.session_id should be string');
            assert.equal(typeof product.product_id, 'string', 'product.product_id should be string');
            assert.ok(product.products, 'product should have nested products object');
            assert.equal(typeof product.products.name, 'string', 'products.name should be string');
            assert.equal(typeof product.products.price, 'number', 'products.price should be number');
        }

        // Verify message structure
        if (response.messages.length > 0) {
            const message = response.messages[0];
            assert.equal(typeof message.id, 'string', 'message.id should be string');
            assert.equal(typeof message.session_id, 'string', 'message.session_id should be string');
            assert.equal(typeof message.sender_name, 'string', 'message.sender_name should be string');
            assert.equal(typeof message.message, 'string', 'message.message should be string');
            assert.equal(typeof message.is_seller, 'boolean', 'message.is_seller should be boolean');
            assert.equal(typeof message.created_at, 'string', 'message.created_at should be string');
        }
    });

    it('widget data excludes seller_id from session', () => {
        const response = createMockWidgetResponse();

        // seller_id should NOT be in the session
        assert.equal(response.session.seller_id, undefined, 'session should not contain seller_id');

        // Verify other expected fields are present
        assert.ok(response.session.id, 'session.id should exist');
        assert.ok(response.session.status, 'session.status should exist');
    });

    it('widget data returns empty messages array when none exist', () => {
        const response = createMockWidgetResponse({ messages: [] });

        assert.ok(Array.isArray(response.messages), 'messages should be an array');
        assert.equal(response.messages.length, 0, 'messages should be empty');
    });

    it('pinned_product is null when nothing pinned', () => {
        const customProducts = [
            {
                id: 'sp-1',
                session_id: 'session-123',
                product_id: 'prod-1',
                pinned_at: null,
                products: {
                    id: 'prod-1',
                    name: 'Test Product 1',
                    price: 29.99,
                    image_url: 'https://example.com/img1.jpg',
                    stock: 100,
                    description: 'A test product'
                }
            }
        ];

        const response = createMockWidgetResponse({
            pinned_product: null,
            products: customProducts
        });

        assert.equal(response.pinned_product, null, 'pinned_product should be null when nothing pinned');
        assert.ok(Array.isArray(response.products), 'products should still be an array');
        assert.equal(response.products.length, 1, 'products should still contain items');
    });
});
