import crypto from 'crypto';

/**
 * Encryption Utility for Google Refresh Tokens
 * Uses AES-256-GCM (authenticated encryption - tamper-proof)
 *
 * Format: iv:authTag:ciphertext (all hex)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 * @returns {Buffer} 32-byte key
 */
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Convert hex string to Buffer
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return keyBuffer;
};

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @returns {string} Encrypted string in format "iv:authTag:ciphertext"
 */
export const encrypt = (plaintext) => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return as "iv:authTag:ciphertext"
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} encryptedString - Encrypted string in format "iv:authTag:ciphertext"
 * @returns {string} Original plaintext
 */
export const decrypt = (encryptedString) => {
  if (!encryptedString || typeof encryptedString !== 'string') {
    throw new Error('Invalid encrypted string');
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected "iv:authTag:ciphertext"');
  }

  const [ivHex, authTagHex, ciphertext] = parts;

  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
