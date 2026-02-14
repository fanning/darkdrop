/**
 * DarkDrop Encryption at Rest
 * AES-256-GCM with per-account key derivation via PBKDF2
 *
 * Encrypted file format:
 *   [12 bytes IV] [16 bytes auth tag] [ciphertext...]
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;  // 128 bits
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32; // 256 bits for AES-256
const PBKDF2_DIGEST = 'sha512';

/**
 * Derive a per-account encryption key from the master key + account ID
 * @param {string} masterKeyHex - Master key in hex format
 * @param {string} accountId - Account identifier used as salt
 * @returns {Buffer} 32-byte derived key
 */
function deriveKey(masterKeyHex, accountId) {
    const masterKey = Buffer.from(masterKeyHex, 'hex');
    const salt = Buffer.from(`darkdrop:${accountId}`, 'utf8');
    return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST);
}

/**
 * Encrypt a buffer using AES-256-GCM
 * @param {Buffer} plaintext - Data to encrypt
 * @param {Buffer} key - 32-byte encryption key
 * @returns {Buffer} IV (12 bytes) + auth tag (16 bytes) + ciphertext
 */
function encrypt(plaintext, key) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    const encrypted = Buffer.concat([
        cipher.update(plaintext),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Format: [IV][AuthTag][Ciphertext]
    return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt a buffer encrypted with AES-256-GCM
 * @param {Buffer} encryptedData - IV (12 bytes) + auth tag (16 bytes) + ciphertext
 * @param {Buffer} key - 32-byte encryption key
 * @returns {Buffer} Decrypted plaintext
 */
function decrypt(encryptedData, key) {
    if (encryptedData.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error('Encrypted data is too short to contain IV and auth tag');
    }

    const iv = encryptedData.subarray(0, IV_LENGTH);
    const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]);
}

/**
 * Get the encryption key for an account
 * @param {string} accountId - Account identifier
 * @returns {Buffer|null} Derived key, or null if master key not configured
 */
function getAccountKey(accountId) {
    const masterKey = process.env.DARKDROP_MASTER_KEY;
    if (!masterKey) {
        console.warn('[Crypto] DARKDROP_MASTER_KEY not set - encryption disabled');
        return null;
    }
    return deriveKey(masterKey, accountId);
}

module.exports = {
    encrypt,
    decrypt,
    deriveKey,
    getAccountKey,
    IV_LENGTH,
    AUTH_TAG_LENGTH
};
