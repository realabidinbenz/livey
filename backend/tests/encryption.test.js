import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('Encryption Utility', () => {
  before(() => {
    // Set a test encryption key (32 bytes = 64 hex chars)
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('should encrypt and decrypt a string correctly', async () => {
    const { encrypt, decrypt } = await import('../src/utils/encryption.js');
    const original = 'test-refresh-token-12345';
    const encrypted = encrypt(original);

    // Should not be plaintext
    assert.notStrictEqual(encrypted, original);

    // Should decrypt back to original
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, original);
  });

  it('should produce different ciphertext for same input (random IV)', async () => {
    const { encrypt } = await import('../src/utils/encryption.js');
    const text = 'same-input';

    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    // Different IVs should produce different ciphertexts
    assert.notStrictEqual(enc1, enc2);
  });

  it('should fail to decrypt tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('../src/utils/encryption.js');
    const encrypted = encrypt('test');

    // Tamper with the ciphertext (change last 2 chars)
    const tampered = encrypted.slice(0, -2) + 'ff';

    // Should throw error due to auth tag mismatch
    assert.throws(() => decrypt(tampered), {
      name: 'Error'
    });
  });

  it('should fail with invalid encrypted format', async () => {
    const { decrypt } = await import('../src/utils/encryption.js');

    // Missing colons
    assert.throws(() => decrypt('not-valid-format'), {
      message: /Invalid encrypted format/
    });

    // Only 2 parts instead of 3
    assert.throws(() => decrypt('part1:part2'), {
      message: /Invalid encrypted format/
    });
  });

  it('should handle empty string', async () => {
    const { encrypt, decrypt } = await import('../src/utils/encryption.js');
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);

    assert.strictEqual(decrypted, '');
  });

  it('should handle long strings (token-length)', async () => {
    const { encrypt, decrypt } = await import('../src/utils/encryption.js');

    // Refresh tokens can be very long
    const longToken = 'a'.repeat(2000);
    const encrypted = encrypt(longToken);
    const decrypted = decrypt(encrypted);

    assert.strictEqual(decrypted, longToken);
  });

  it('should throw error if ENCRYPTION_KEY is missing', async () => {
    // Save original key
    const originalKey = process.env.ENCRYPTION_KEY;

    // Remove key
    delete process.env.ENCRYPTION_KEY;

    // Dynamic import with cache busting to test fresh module
    const { encrypt } = await import('../src/utils/encryption.js?t=' + Date.now());

    // Should throw error
    assert.throws(() => encrypt('test'), {
      message: /ENCRYPTION_KEY environment variable is not set/
    });

    // Restore key
    process.env.ENCRYPTION_KEY = originalKey;
  });
});
