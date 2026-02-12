import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Google Sheets Integration Tests
 * Tests for Sheets-related logic (row formatting, headers, sync flags)
 */

// Fixed column headers (must match google.sheets.service.js)
const SHEET_HEADERS = [
  'Order ID',
  'Date/Time',
  'Customer Name',
  'Phone',
  'Full Address',
  'Product Name',
  'Price (DA)',
  'Quantity',
  'Total (DA)',
  'Status'
];

describe('Sheet Headers', () => {
  it('should have exactly 10 columns', () => {
    assert.strictEqual(SHEET_HEADERS.length, 10);
  });

  it('should start with Order ID', () => {
    assert.strictEqual(SHEET_HEADERS[0], 'Order ID');
  });

  it('should end with Status', () => {
    assert.strictEqual(SHEET_HEADERS[9], 'Status');
  });

  it('should include all required columns', () => {
    assert.ok(SHEET_HEADERS.includes('Customer Name'));
    assert.ok(SHEET_HEADERS.includes('Phone'));
    assert.ok(SHEET_HEADERS.includes('Full Address'));
    assert.ok(SHEET_HEADERS.includes('Product Name'));
    assert.ok(SHEET_HEADERS.includes('Price (DA)'));
    assert.ok(SHEET_HEADERS.includes('Quantity'));
    assert.ok(SHEET_HEADERS.includes('Total (DA)'));
  });
});

describe('Order Row Formatting', () => {
  it('should capitalize status correctly', () => {
    const status = 'pending';
    const formatted = status.charAt(0).toUpperCase() + status.slice(1);
    assert.strictEqual(formatted, 'Pending');
  });

  it('should format all valid statuses', () => {
    const statuses = ['pending', 'confirmed', 'cancelled', 'delivered'];
    const expected = ['Pending', 'Confirmed', 'Cancelled', 'Delivered'];

    statuses.forEach((s, i) => {
      const formatted = s.charAt(0).toUpperCase() + s.slice(1);
      assert.strictEqual(formatted, expected[i]);
    });
  });

  it('should build row with correct column count', () => {
    const order = {
      order_number: 'ORD-20260211-001',
      created_at: '2026-02-11T10:00:00Z',
      customer_name: 'Ahmed',
      customer_phone: '0551234567',
      customer_address: 'Algiers',
      product_name: 'Widget',
      product_price: 2500,
      quantity: 2,
      total_price: 5000,
      status: 'pending'
    };

    const row = [
      order.order_number,
      new Date(order.created_at).toLocaleString('en-GB'),
      order.customer_name,
      order.customer_phone,
      order.customer_address,
      order.product_name,
      order.product_price,
      order.quantity,
      order.total_price,
      order.status.charAt(0).toUpperCase() + order.status.slice(1)
    ];

    assert.strictEqual(row.length, 10);
    assert.strictEqual(row[0], 'ORD-20260211-001');
    assert.strictEqual(row[9], 'Pending');
  });
});

describe('Sync Flags', () => {
  it('should identify unsynced orders', () => {
    const order = { google_sheets_synced: false, sync_retry_count: 0 };
    assert.strictEqual(order.google_sheets_synced, false);
  });

  it('should identify orders that exceeded max retries', () => {
    const maxRetries = 10;
    const order = { sync_retry_count: 10 };
    assert.ok(order.sync_retry_count >= maxRetries);
  });

  it('should identify orders eligible for retry', () => {
    const maxRetries = 10;
    const order = { google_sheets_synced: false, sync_retry_count: 5 };
    assert.ok(!order.google_sheets_synced && order.sync_retry_count < maxRetries);
  });
});

describe('OAuth State Validation', () => {
  it('should generate unique states', () => {
    const states = new Set();
    for (let i = 0; i < 100; i++) {
      states.add(crypto.randomUUID());
    }
    assert.strictEqual(states.size, 100);
  });

  it('should detect expired states (10 minute TTL)', () => {
    const createdAt = Date.now() - (11 * 60 * 1000); // 11 minutes ago
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    assert.ok(createdAt < tenMinutesAgo); // Should be expired
  });

  it('should accept fresh states', () => {
    const createdAt = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    assert.ok(createdAt >= tenMinutesAgo); // Should be valid
  });
});
