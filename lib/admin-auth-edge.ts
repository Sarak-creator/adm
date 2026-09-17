/**
 * Edge Runtime Safe Admin Authentication Utilities
 * Specifically designed for Next.js Middleware (Zero Node.js module dependencies)
 */

export const ADMIN_COOKIE_NAME = "anajak_admin_session";
export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_SECRET = "anajak_admin_2026";
export const DEFAULT_ADMIN_SECRET_PATH = "portal-anachak-9821";
export const DEFAULT_ADMIN_2FA_PIN = "982100";

export function getAdminSecretPathSync(): string {
  const path = process.env.ADMIN_SECRET_PATH || DEFAULT_ADMIN_SECRET_PATH;
  return path.replace(/^\/+|\/+$/g, "");
}

function getSecretKey(): string {
  return process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
}

// Convert string to Uint8Array
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Base64URL encoding
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Base64URL decoding
function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate an HMAC-SHA256 signature using standard Web Crypto
 */
async function generateHmac(message: string, secret: string): Promise<string> {
  const secretKeyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretKeyData as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const messageData = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign("HMAC", key, messageData as unknown as BufferSource);
  return base64UrlEncode(new Uint8Array(signature));
}

export interface AdminTokenPayload {
  username: string;
  role: "ADMIN";
  exp: number;
}

/**
 * Verify an admin session token (Web Crypto API)
 */
export async function verifyAdminToken(token: string | undefined | null): Promise<AdminTokenPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const secret = getSecretKey();

  try {
    const expectedSignature = await generateHmac(encodedPayload, secret);
    if (expectedSignature !== signature) {
      return null;
    }

    const payloadBytes = base64UrlDecode(encodedPayload);
    const decodedJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(decodedJson) as AdminTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract client IP from incoming request
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.split(",")[0].trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}

/**
 * Verify whether client IP is allowed by ADMIN_ALLOWED_IPS
 */
export function isIpAllowed(clientIp: string): boolean {
  const allowed = process.env.ADMIN_ALLOWED_IPS;
  if (!allowed || !allowed.trim()) {
    return true;
  }

  const cleanClient = clientIp.trim();
  const list = allowed.split(",").map((s) => s.trim()).filter(Boolean);

  for (const item of list) {
    if (item === "*" || item === cleanClient) return true;
    if (cleanClient === "127.0.0.1" || cleanClient === "::1" || cleanClient.startsWith("192.168.")) {
      if (item.includes("localhost") || item === "127.0.0.1" || item === "::1" || item.startsWith("192.168.")) {
        return true;
      }
    }
  }

  return false;
}
