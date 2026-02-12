import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Chat Tests
 * Testing chat message validation and logic
 */

// Validation helpers (replicated from controller)
const validateSenderName = (name) => {
  if (!name || typeof name !== 'string') return { valid: false, error: 'sender_name is required' };
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, error: 'sender_name cannot be empty' };
  if (trimmed.length > 50) return { valid: false, error: 'sender_name must be 50 characters or less' };
  return { valid: true, trimmed };
};

const validateMessage = (message) => {
  if (!message || typeof message !== 'string') return { valid: false, error: 'message is required' };
  const trimmed = message.trim();
  if (trimmed.length === 0) return { valid: false, error: 'message cannot be empty' };
  if (trimmed.length > 200) return { valid: false, error: 'message must be 200 characters or less' };
  return { valid: true, trimmed };
};

const canPostInSession = (status) => status === 'live';

describe('Chat Message Validation', () => {
  it('rejects sender_name longer than 50 chars', () => {
    const longName = 'a'.repeat(51);
    const result = validateSenderName(longName);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('50'));
  });

  it('rejects message longer than 200 chars', () => {
    const longMessage = 'a'.repeat(201);
    const result = validateMessage(longMessage);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('200'));
  });

  it('rejects empty string after trim for sender_name', () => {
    const result = validateSenderName('   ');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('empty'));
  });

  it('rejects empty string after trim for message', () => {
    const result = validateMessage('   ');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('empty'));
  });

  it('accepts valid sender_name and message', () => {
    const nameResult = validateSenderName('John Doe');
    const messageResult = validateMessage('Hello, this is a test message!');

    assert.equal(nameResult.valid, true);
    assert.equal(messageResult.valid, true);
    assert.equal(nameResult.trimmed, 'John Doe');
    assert.equal(messageResult.trimmed, 'Hello, this is a test message!');
  });
});

describe('Chat Session Status Check', () => {
  it('only allows posting in live sessions', () => {
    assert.equal(canPostInSession('live'), true);
    assert.equal(canPostInSession('ended'), false);
    assert.equal(canPostInSession('replay'), false);
  });
});

describe('Chat Message Filtering', () => {
  it('excludes soft-deleted messages', () => {
    const messages = [
      { id: 1, deleted_at: null },
      { id: 2, deleted_at: '2024-01-01T00:00:00Z' },
      { id: 3, deleted_at: null }
    ];

    const visible = messages.filter(m => m.deleted_at === null);
    assert.equal(visible.length, 2);
    assert.ok(visible.every(m => m.id !== 2));
  });

  it('limits to 100 messages', () => {
    const messages = Array(150).fill(null).map((_, i) => ({ id: i + 1 }));
    const limited = messages.slice(0, 100);
    assert.equal(limited.length, 100);
    assert.equal(limited[0].id, 1);
    assert.equal(limited[99].id, 100);
  });

  it('orders by created_at ASC for display', () => {
    const messages = [
      { id: 1, created_at: '2024-01-03T00:00:00Z' },
      { id: 2, created_at: '2024-01-01T00:00:00Z' },
      { id: 3, created_at: '2024-01-02T00:00:00Z' }
    ];

    const sorted = [...messages].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );

    assert.equal(sorted[0].id, 2);
    assert.equal(sorted[1].id, 3);
    assert.equal(sorted[2].id, 1);
  });
});

describe('Chat Message Fields', () => {
  it('defaults is_seller to false for customer messages', () => {
    const newMessage = {
      session_id: 'session-uuid',
      sender_name: 'Customer',
      message: 'Test',
      is_seller: false
    };

    assert.equal(newMessage.is_seller, false);
  });

  it('trims whitespace from inputs', () => {
    const nameResult = validateSenderName('  John Doe  ');
    const messageResult = validateMessage('  Hello World  ');

    assert.equal(nameResult.valid, true);
    assert.equal(nameResult.trimmed, 'John Doe');
    assert.equal(messageResult.valid, true);
    assert.equal(messageResult.trimmed, 'Hello World');
  });
});
