/**
 * Encryption utilities for secure API key storage
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

export interface EncryptedData {
  encrypted: string; // base64
  iv: string;        // base64
  tag: string;       // base64
}

/**
 * Gets the encryption key from environment variable
 * Key must be a 32-byte (64 character) hex string
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET environment variable is not set.\n' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Validate hex string length (32 bytes = 64 hex chars)
  if (secret.length !== 64 || !/^[0-9a-fA-F]+$/.test(secret)) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes).\n' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  return Buffer.from(secret, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Encrypted data with IV and auth tag (all base64 encoded)
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypts encrypted data using AES-256-GCM
 * @param data - The encrypted data object
 * @returns Decrypted plaintext string
 */
export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, 'base64');
  const tag = Buffer.from(data.tag, 'base64');
  const encrypted = Buffer.from(data.encrypted, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Masks an API key for display purposes
 * Shows first 3 chars and last 6 chars
 * @param apiKey - The full API key
 * @returns Masked key like "sk-...abc123"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return '***';
  }

  const prefix = apiKey.slice(0, 3);
  const suffix = apiKey.slice(-6);

  return `${prefix}...${suffix}`;
}

/**
 * Validates OpenAI API key format
 * @param apiKey - The API key to validate
 * @returns true if valid format, false otherwise
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // OpenAI keys start with "sk-" and are at least 20 characters
  return apiKey.startsWith('sk-') && apiKey.length >= 20;
}
