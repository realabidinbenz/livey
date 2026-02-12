import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Cron Controller Tests
 * Tests for exponential backoff logic used in Sheets sync retry
 */

// Replicate the backoff function from cron.controller.js
const getBackoffSeconds = (retryCount) => {
  return 300 * Math.pow(3, retryCount);
};

const isRetryDue = (order) => {
  if (!order.updated_at) {
    return true;
  }
  const secondsSinceUpdate = (Date.now() - new Date(order.updated_at).getTime()) / 1000;
  const backoffSeconds = getBackoffSeconds(order.sync_retry_count || 0);
  return secondsSinceUpdate >= backoffSeconds;
};

describe('Exponential Backoff', () => {
  it('should calculate correct backoff delays', () => {
    // 300s * 3^0 = 300s = 5 min
    assert.strictEqual(getBackoffSeconds(0), 300);
    // 300s * 3^1 = 900s = 15 min
    assert.strictEqual(getBackoffSeconds(1), 900);
    // 300s * 3^2 = 2700s = 45 min
    assert.strictEqual(getBackoffSeconds(2), 2700);
    // 300s * 3^3 = 8100s = 2.25 hr
    assert.strictEqual(getBackoffSeconds(3), 8100);
  });

  it('should retry immediately if no previous attempt', () => {
    const order = { updated_at: null, sync_retry_count: 0 };
    assert.strictEqual(isRetryDue(order), true);
  });

  it('should not retry if backoff period has not elapsed', () => {
    // Order updated just now, retry count 0 → need 300s wait
    const order = {
      updated_at: new Date().toISOString(),
      sync_retry_count: 0
    };
    assert.strictEqual(isRetryDue(order), false);
  });

  it('should retry if enough time has passed', () => {
    // Order updated 6 minutes ago, retry count 0 → 5 min backoff elapsed
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const order = {
      updated_at: sixMinutesAgo,
      sync_retry_count: 0
    };
    assert.strictEqual(isRetryDue(order), true);
  });

  it('should respect higher backoff for higher retry counts', () => {
    // Order updated 10 minutes ago, retry count 1 → need 15 min wait
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const order = {
      updated_at: tenMinutesAgo,
      sync_retry_count: 1
    };
    assert.strictEqual(isRetryDue(order), false);
  });

  it('should handle missing sync_retry_count (defaults to 0)', () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const order = { updated_at: sixMinutesAgo };
    assert.strictEqual(isRetryDue(order), true);
  });
});
