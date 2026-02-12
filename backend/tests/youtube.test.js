import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeId, isYouTubeUrl } from '../src/utils/youtube.js';

describe('extractYouTubeId', () => {
  it('extracts from standard watch URL', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from watch URL with extra params', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s'), 'dQw4w9WgXcQ');
  });

  it('extracts from watch URL with params before v', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/watch?list=PLtest&v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from short URL (youtu.be)', () => {
    assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from live URL', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/live/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from embed URL', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from shorts URL', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from /v/ URL', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/v/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts without www', () => {
    assert.equal(extractYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('extracts from http (not https)', () => {
    assert.equal(extractYouTubeId('http://youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('handles ID with hyphens and underscores', () => {
    assert.equal(extractYouTubeId('https://youtu.be/a-B_c1d2E3f'), 'a-B_c1d2E3f');
  });

  it('returns null for empty input', () => {
    assert.equal(extractYouTubeId(''), null);
  });

  it('returns null for null input', () => {
    assert.equal(extractYouTubeId(null), null);
  });

  it('returns null for undefined input', () => {
    assert.equal(extractYouTubeId(undefined), null);
  });

  it('returns null for non-string input', () => {
    assert.equal(extractYouTubeId(12345), null);
  });

  it('returns null for non-YouTube URL', () => {
    assert.equal(extractYouTubeId('https://vimeo.com/123456'), null);
  });

  it('returns null for random string', () => {
    assert.equal(extractYouTubeId('not a url at all'), null);
  });

  it('returns null for YouTube URL without video ID', () => {
    assert.equal(extractYouTubeId('https://www.youtube.com/'), null);
  });

  it('returns null for ID that is too short', () => {
    assert.equal(extractYouTubeId('https://youtu.be/short'), null);
  });
});

describe('isYouTubeUrl', () => {
  it('returns true for valid YouTube URL', () => {
    assert.equal(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);
  });

  it('returns true for youtu.be URL', () => {
    assert.equal(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), true);
  });

  it('returns false for non-YouTube URL', () => {
    assert.equal(isYouTubeUrl('https://vimeo.com/123456'), false);
  });

  it('returns false for null', () => {
    assert.equal(isYouTubeUrl(null), false);
  });
});
