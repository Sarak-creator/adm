/**
 * Admin Authentication & Security Utilities
 * Authenticates Admin Users and Configurations directly from Supabase PostgreSQL
 */

import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { getConfig } from "@/lib/config-service";

export const ADMIN_COOKIE_NAME = "anajak_admin_session";
export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_SECRET = "anajak_admin_2026";
export const DEFAULT_ADMIN_SECRET_PATH = "portal-anachak-9821";
export const DEFAULT_ADMIN_2FA_PIN = "982100";

/**
 * Ensures at least one master ADMIN user exists in Supabase PostgreSQL
 */
export async function ensureDefaultAdminUser(): Promise<void> {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: DEFAULT_ADMIN_USERNAME,
          email: "admin@anajakdiamond.com",
          name: "អាណាចក្រDiamond Master Admin",
          passwordHash: hashPassword(DEFAULT_ADMIN_SECRET),
          twoFactorPin: DEFAULT_ADMIN_2FA_PIN,
          role: "ADMIN",
          isActive: true,
        },
      });
      console.log("✅ Initialized default Admin user in Supabase 'users' table.");
    }
  } catch (err) {
    console.warn("Could not check/seed default admin user in Supabase:", err);
  }
}

/**
 * Returns the secret admin path dynamically from Supabase
 */
export async function getAdminSecretPath(): Promise<string> {
  const dbPath = await getConfig("ADMIN_SECRET_PATH");
  const path = dbPath || process.env.ADMIN_SECRET_PATH || DEFAULT_ADMIN_SECRET_PATH;
  return path.replace(/^\/+|\/+$/g, "");
}

/**
 * Synchronous secret path getter for edge/middleware context
 */
export function getAdminSecretPathSync(): string {
  const path = process.env.ADMIN_SECRET_PATH || DEFAULT_ADMIN_SECRET_PATH;
  return path.replace(/^\/+|\/+$/g, "");
}

function getSecretKey(): string {
  return process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
}

export async function get2FAPin(): Promise<string> {
  const dbPin = await getConfig("ADMIN_2FA_PIN");
  return dbPin || process.env.ADMIN_2FA_PIN || DEFAULT_ADMIN_2FA_PIN;
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
 * Generate an HMAC-SHA256 signature
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

/**
 * Sign an admin session token
 * @param username Admin username
 * @param maxAgeSeconds Expiration duration in seconds (default 7 days)
 */
export async function signAdminToken(
  username: string = DEFAULT_ADMIN_USERNAME,
  maxAgeSeconds: number = 7 * 24 * 60 * 60
): Promise<string> {
  const secret = getSecretKey();
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = JSON.stringify({
    username,
    role: "ADMIN",
    exp,
  });

  const encodedPayload = base64UrlEncode(stringToBuffer(payload));
  const signature = await generateHmac(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export interface AdminTokenPayload {
  username: string;
  role: "ADMIN";
  exp: number;
}

/**
 * Verify an admin session token
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

    // Check expiration
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
 * Temporary token for 2FA verification step (expires in 5 minutes)
 */
export async function signPending2FAToken(username: string): Promise<string> {
  const secret = getSecretKey();
  const exp = Math.floor(Date.now() / 1000) + 5 * 60; // 5 mins
  const payload = JSON.stringify({
    username,
    stage: "2FA_PENDING",
    exp,
  });

  const encoded = base64UrlEncode(stringToBuffer(payload));
  const signature = await generateHmac(encoded, secret);
  return `${encoded}.${signature}`;
}

export async function verifyPending2FAToken(token: string | undefined | null): Promise<{ username: string } | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const secret = getSecretKey();

  try {
    const expected = await generateHmac(encoded, secret);
    if (expected !== signature) return null;

    const decodedJson = new TextDecoder().decode(base64UrlDecode(encoded));
    const data = JSON.parse(decodedJson);

    if (data.stage !== "2FA_PENDING") return null;
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;

    return { username: data.username };
  } catch {
    return null;
  }
}

export interface AdminValidationResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  };
}

/**
 * Validates admin credentials directly from Supabase PostgreSQL database ('users' table)
 */
export async function validateAdminCredentials(
  identifier?: string,
  password?: string
): Promise<AdminValidationResult> {
  if (!password) return { success: false };

  // Ensure default admin exists if DB is completely fresh
  await ensureDefaultAdminUser();

  const cleanId = (identifier || DEFAULT_ADMIN_USERNAME).trim();

  try {
    // 1. Query Supabase for active Admin user by username or email
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanId, mode: "insensitive" } },
          { email: { equals: cleanId, mode: "insensitive" } },
        ],
        role: "ADMIN",
        isActive: true,
      },
    });

    if (adminUser && adminUser.passwordHash) {
      const isMatch = verifyPassword(password, adminUser.passwordHash);
      if (isMatch) {
        return {
          success: true,
          user: {
            id: adminUser.id,
            username: adminUser.username || DEFAULT_ADMIN_USERNAME,
            email: adminUser.email,
            name: adminUser.name,
          },
        };
      }
    }
  } catch (err) {
    console.error("Supabase admin query failed:", err);
  }

  // 2. Fallback check for single master secret match with default admin
  const expectedSecret = getSecretKey();
  if (password.trim() === expectedSecret.trim()) {
    return {
      success: true,
      user: {
        id: "default-admin",
        username: cleanId || DEFAULT_ADMIN_USERNAME,
        email: "admin@anajakdiamond.com",
        name: "Master Admin",
      },
    };
  }

  return { success: false };
}

/**
 * Validates 2FA Security PIN against Supabase user record and Supabase system_settings
 */
export async function validate2FACode(code?: string, username?: string): Promise<boolean> {
  if (!code) return false;
  const cleanCode = code.trim().replace(/\s+/g, "");

  // 1. Check user-specific PIN from Supabase 'users' table
  if (username) {
    try {
      const admin = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: "insensitive" } },
            { email: { equals: username, mode: "insensitive" } },
          ],
          role: "ADMIN",
        },
      });
      if (admin && admin.twoFactorPin && cleanCode === admin.twoFactorPin.trim()) {
        return true;
      }
    } catch (e) {
      console.warn("Could not query user-specific 2FA pin from Supabase:", e);
    }
  }

  // 2. Check system-wide 2FA PIN from Supabase 'system_settings' table
  const dbSystemPin = await get2FAPin();
  if (dbSystemPin && cleanCode === dbSystemPin.trim()) {
    return true;
  }

  return false;
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
    // If not set, allow all (default for dynamic IPs / local dev)
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
