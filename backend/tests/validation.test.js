import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validatePhone, validateEmail } from '../src/middleware/validation.middleware.js';

/**
 * Validation Middleware Tests
 * Tests for phone and email validation functions
 */

describe('Phone Validation', () => {
  it('should accept valid Algerian phone numbers', () => {
    assert.strictEqual(validatePhone('0551234567'), true);
    assert.strictEqual(validatePhone('0661234567'), true);
    assert.strictEqual(validatePhone('0771234567'), true);
  });

  it('should reject invalid phone numbers', () => {
    assert.strictEqual(validatePhone('0451234567'), false); // Invalid prefix
    assert.strictEqual(validatePhone('055123456'), false);  // Too short
    assert.strictEqual(validatePhone('05512345678'), false); // Too long
    assert.strictEqual(validatePhone('1234567890'), false); // Wrong format
    assert.strictEqual(validatePhone(''), false); // Empty
    assert.strictEqual(validatePhone('abcdefghij'), false); // Letters
  });
});

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    assert.strictEqual(validateEmail('seller@example.com'), true);
    assert.strictEqual(validateEmail('user+tag@domain.co.uk'), true);
    assert.strictEqual(validateEmail('test.email@subdomain.example.com'), true);
  });

  it('should reject invalid email addresses', () => {
    assert.strictEqual(validateEmail('notanemail'), false);
    assert.strictEqual(validateEmail('missing@domain'), false);
    assert.strictEqual(validateEmail('@nodomain.com'), false);
    assert.strictEqual(validateEmail('no space@example.com'), false);
    assert.strictEqual(validateEmail(''), false);
  });
});
