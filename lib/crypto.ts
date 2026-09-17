import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes

/**
 * Derives or validates the 32-byte master key from environment variables
 */
function getMasterEncryptionKey(): Buffer {
  const envKey = process.env.APP_MASTER_ENCRYPTION_KEY;

  if (!envKey || !envKey.trim()) {
    // If not set, generate deterministic fallback using ADMIN_SECRET
    const fallbackSecret = process.env.ADMIN_SECRET || "anajak_admin_2026_fallback_secret_key";
    return crypto.createHash("sha256").update(fallbackSecret).digest();
  }

  const cleanKey = envKey.trim();

  // If 64 hex characters (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    return Buffer.from(cleanKey, "hex");
  }

  // If 32 raw characters (32 bytes)
  if (Buffer.byteLength(cleanKey, "utf8") === 32) {
    return Buffer.from(cleanKey, "utf8");
  }

  // Otherwise, hash string to guaranteed 32 bytes
  return crypto.createHash("sha256").update(cleanKey).digest();
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex
 *
 * @param plainText Secret string to encrypt
 * @returns Serialized encrypted payload string
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";

  const key = getMasterEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload (iv:authTag:encryptedHex).
 * Validates GCM authentication tag to prevent tampering.
 *
 * @param encryptedPayload Serialized iv:authTag:encryptedHex
 * @returns Original decrypted plaintext
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return "";

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected 'iv:authTag:encryptedHex'");
  }

  const [ivHex, authTagHex, cipherHex] = parts;

  const key = getMasterEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes.`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid Auth Tag length. Expected ${AUTH_TAG_LENGTH} bytes.`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks a secret string for safe frontend display (e.g. ••••••••3821)
 */
export function maskSecretValue(value: string | null | undefined): string {
  if (!value) return "";
  const len = value.length;
  if (len <= 4) return "••••";
  const lastFour = value.slice(-4);
  return `••••••••••••${lastFour}`;
}

/**
 * Hashes a plaintext password using crypto.scryptSync with a 16-byte random salt.
 * Returns formatted saltHex:hashHex string.
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a stored saltHex:hashHex string.
 * Uses timingSafeEqual to protect against timing side-channel attacks.
 * Also supports legacy/plaintext fallback.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.includes(":")) {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    try {
      const keyBuffer = Buffer.from(key, "hex");
      const derivedKey = crypto.scryptSync(password, salt, 64);
      if (keyBuffer.length !== derivedKey.length) return false;
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }

  // Fallback direct comparison
  return password.trim() === storedHash.trim();
}

