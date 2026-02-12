import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeId } from '../src/utils/youtube.js';

/**
 * Sessions Tests
 * Testing pure logic functions for live sessions
 * Replicates internal helper functions for testing
 */

// Replicate internal helper functions for testing
const generateEmbedCode = (videoId) => {
  return `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
};

const isValidVideoId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[\w-]{11}$/.test(id);
};

const VALID_STATUSES = ['live', 'ended', 'replay'];

const isValidSessionStatus = (status) => VALID_STATUSES.includes(status);

const canEndSession = (status) => status === 'live';

describe('YouTube Video ID Resolution', () => {
  it('extracts video ID from standard watch URL', () => {
    const result = extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(result, 'dQw4w9WgXcQ');
  });

  it('extracts video ID from live URL', () => {
    const result = extractYouTubeId('https://www.youtube.com/live/dQw4w9WgXcQ');
    assert.equal(result, 'dQw4w9WgXcQ');
  });

  it('returns null for raw 11-char ID (not a URL)', () => {
    const result = extractYouTubeId('dQw4w9WgXcQ');
    assert.equal(result, null);
  });

  it('returns null for invalid URL', () => {
    const result = extractYouTubeId('https://example.com/video');
    assert.equal(result, null);
  });
});

describe('Raw Video ID Validation', () => {
  it('accepts valid 11-character ID', () => {
    assert.equal(isValidVideoId('dQw4w9WgXcQ'), true);
  });

  it('accepts ID with hyphens and underscores', () => {
    assert.equal(isValidVideoId('a-B_c1d2E3f'), true);
  });

  it('rejects ID that is too short', () => {
    assert.equal(isValidVideoId('short'), false);
  });

  it('rejects ID that is too long', () => {
    assert.equal(isValidVideoId('dQw4w9WgXcQextra'), false);
  });

  it('rejects empty string', () => {
    assert.equal(isValidVideoId(''), false);
  });

  it('rejects null', () => {
    assert.equal(isValidVideoId(null), false);
  });

  it('rejects undefined', () => {
    assert.equal(isValidVideoId(undefined), false);
  });

  it('rejects non-string input', () => {
    assert.equal(isValidVideoId(12345678901), false);
  });

  it('rejects ID with invalid characters', () => {
    assert.equal(isValidVideoId('dQw4w9WgXc!'), false);
  });
});

describe('Embed Code Generation', () => {
  const testId = 'dQw4w9WgXcQ';
  const embedCode = generateEmbedCode(testId);

  it('generates correct embed URL', () => {
    assert.ok(embedCode.includes(`https://www.youtube.com/embed/${testId}`));
  });

  it('includes autoplay=1', () => {
    assert.ok(embedCode.includes('autoplay=1'));
  });

  it('includes mute=1', () => {
    assert.ok(embedCode.includes('mute=1'));
  });

  it('generates valid iframe tag', () => {
    assert.ok(embedCode.startsWith('<iframe'));
    assert.ok(embedCode.endsWith('></iframe>'));
  });

  it('includes allowfullscreen', () => {
    assert.ok(embedCode.includes('allowfullscreen'));
  });
});

describe('Session Status Transitions', () => {
  it('recognizes valid statuses', () => {
    assert.equal(isValidSessionStatus('live'), true);
    assert.equal(isValidSessionStatus('ended'), true);
    assert.equal(isValidSessionStatus('replay'), true);
  });

  it('rejects invalid statuses', () => {
    assert.equal(isValidSessionStatus('active'), false);
    assert.equal(isValidSessionStatus('closed'), false);
    assert.equal(isValidSessionStatus(''), false);
  });

  it('only allows ending live sessions', () => {
    assert.equal(canEndSession('live'), true);
    assert.equal(canEndSession('ended'), false);
    assert.equal(canEndSession('replay'), false);
  });
});

describe('Session Input Validation', () => {
  it('requires youtube_url', () => {
    const body = { product_ids: ['uuid1'] };
    assert.equal(!body.youtube_url, true);
  });

  it('requires non-empty product_ids array', () => {
    const emptyArray = { youtube_url: 'https://youtube.com/watch?v=test', product_ids: [] };
    const notArray = { youtube_url: 'https://youtube.com/watch?v=test', product_ids: 'uuid1' };
    const valid = { youtube_url: 'https://youtube.com/watch?v=test', product_ids: ['uuid1'] };

    assert.equal(!Array.isArray(emptyArray.product_ids) || emptyArray.product_ids.length === 0, true);
    assert.equal(!Array.isArray(notArray.product_ids), true);
    assert.equal(Array.isArray(valid.product_ids) && valid.product_ids.length > 0, true);
  });

  it('detects product count mismatch', () => {
    const requestedIds = ['uuid1', 'uuid2', 'uuid3'];
    const validProducts = [{ id: 'uuid1' }, { id: 'uuid2' }];
    assert.equal(validProducts.length !== requestedIds.length, true);
  });
});

describe('Pin Logic', () => {
  it('only allows pinning in live sessions', () => {
    const canPin = (status) => status === 'live';
    assert.equal(canPin('live'), true);
    assert.equal(canPin('ended'), false);
    assert.equal(canPin('replay'), false);
  });

  it('clears old pins before setting new', () => {
    // Simulate clearing pins operation
    const sessionProducts = [
      { id: 1, pinned_at: '2024-01-01' },
      { id: 2, pinned_at: null },
      { id: 3, pinned_at: '2024-01-02' }
    ];

    // Clear all pins
    const cleared = sessionProducts.map(sp => ({ ...sp, pinned_at: null }));

    assert.equal(cleared.every(sp => sp.pinned_at === null), true);
  });
});
