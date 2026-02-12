import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { normalizePhone, validatePhone } from '../src/middleware/validation.middleware.js';
import { sanitizeMiddleware } from '../src/middleware/sanitize.middleware.js';
import { sellerQuery, sellerSelect } from '../src/utils/query.js';

/**
 * Security & Hardening Tests
 * Tests for rate limiting config, input sanitization, phone normalization, order numbers
 */

describe('Phone Normalization', () => {
  it('should strip spaces from phone numbers', () => {
    assert.strictEqual(normalizePhone('0551 23 45 67'), '0551234567');
  });

  it('should strip dashes from phone numbers', () => {
    assert.strictEqual(normalizePhone('055-123-4567'), '0551234567');
  });

  it('should strip dots from phone numbers', () => {
    assert.strictEqual(normalizePhone('0551.23.45.67'), '0551234567');
  });

  it('should strip parentheses from phone numbers', () => {
    assert.strictEqual(normalizePhone('(055)1234567'), '0551234567');
  });

  it('should convert +213 prefix to 0', () => {
    assert.strictEqual(normalizePhone('+213551234567'), '0551234567');
  });

  it('should convert 213 prefix (without +) to 0', () => {
    assert.strictEqual(normalizePhone('213551234567'), '0551234567');
  });

  it('should handle +213 with spaces', () => {
    assert.strictEqual(normalizePhone('+213 551 234 567'), '0551234567');
  });

  it('should leave already-normalized numbers unchanged', () => {
    assert.strictEqual(normalizePhone('0551234567'), '0551234567');
  });

  it('should handle non-string input gracefully', () => {
    assert.strictEqual(normalizePhone(null), '');
    assert.strictEqual(normalizePhone(undefined), '');
    assert.strictEqual(normalizePhone(123), '');
  });
});

describe('Phone Validation After Normalization', () => {
  it('should accept normalized +213 numbers', () => {
    const normalized = normalizePhone('+213551234567');
    assert.ok(validatePhone(normalized));
  });

  it('should accept normalized spaced numbers', () => {
    const normalized = normalizePhone('06 61 23 45 67');
    assert.ok(validatePhone(normalized));
  });

  it('should reject invalid numbers even after normalization', () => {
    const normalized = normalizePhone('+33612345678');
    assert.ok(!validatePhone(normalized));
  });

  it('should reject too-short numbers', () => {
    const normalized = normalizePhone('055123');
    assert.ok(!validatePhone(normalized));
  });
});

describe('Input Sanitization', () => {
  it('should strip script tags from input', () => {
    const req = { body: { name: '<script>alert("xss")</script>John' }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.strictEqual(req.body.name, 'John');
  });

  it('should strip HTML tags from input', () => {
    const req = { body: { name: '<b>Bold</b> text' }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.strictEqual(req.body.name, 'Bold text');
  });

  it('should strip javascript: protocols', () => {
    const req = { body: { url: 'javascript:alert(1)' }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.strictEqual(req.body.url, 'alert(1)');
  });

  it('should strip event handlers (onclick, onerror, etc)', () => {
    const req = { body: { text: 'hello onclick= test' }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.strictEqual(req.body.text, 'hello  test');
  });

  it('should handle nested objects', () => {
    const req = { body: { customer: { name: '<script>x</script>Ali' } }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.strictEqual(req.body.customer.name, 'Ali');
  });

  it('should preserve non-string values', () => {
    const req = { body: { price: 2500, inStock: true, tags: null }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.strictEqual(req.body.price, 2500);
    assert.strictEqual(req.body.inStock, true);
    assert.strictEqual(req.body.tags, null);
  });

  it('should sanitize query params', () => {
    const req = { body: {}, query: { search: '<img src=x onerror=alert(1)>' }, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.ok(!req.query.search.includes('<'));
  });

  it('should sanitize arrays', () => {
    const req = { body: { items: ['<b>one</b>', 'hello<b>world</b>'] }, query: {}, params: {} };
    const res = {};
    sanitizeMiddleware(req, res, () => {});
    assert.deepStrictEqual(req.body.items, ['one', 'helloworld']);
  });
});

describe('Order Number Format (Random Hex)', () => {
  it('should match ORD-YYYYMMDD-XXXX format (4 hex chars)', () => {
    const regex = /^ORD-\d{8}-[0-9a-f]{4}$/;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(2).toString('hex');
    const orderNumber = `ORD-${today}-${random}`;
    assert.match(orderNumber, regex);
  });

  it('should generate unique numbers on consecutive calls', () => {
    const numbers = new Set();
    for (let i = 0; i < 100; i++) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = crypto.randomBytes(2).toString('hex');
      numbers.add(`ORD-${today}-${random}`);
    }
    // With 4 hex chars (65536 possibilities), 100 should all be unique
    assert.strictEqual(numbers.size, 100);
  });
});

describe('sellerQuery Helper', () => {
  it('should throw if sellerId is missing', () => {
    assert.throws(() => sellerQuery('products', null), /sellerId is required/);
    assert.throws(() => sellerQuery('products', ''), /sellerId is required/);
    assert.throws(() => sellerQuery('products', undefined), /sellerId is required/);
  });

  it('should throw from sellerSelect if sellerId is missing', () => {
    assert.throws(() => sellerSelect('orders', null), /sellerId is required/);
    assert.throws(() => sellerSelect('orders', ''), /sellerId is required/);
  });
});
