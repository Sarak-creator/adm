import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret, maskSecretValue } from "@/lib/crypto";

interface CacheEntry {
  value: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60-second TTL
const memoryCache = new Map<string, CacheEntry>();

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  isEncrypted: boolean;
  description: string | null;
  updatedAt: Date;
}

/**
 * Retrieves a configuration value dynamically.
 * 1. Checks in-memory cache (60s TTL)
 * 2. On cache miss, queries database (Prisma SystemSetting)
 * 3. Decrypts value if isEncrypted === true
 * 4. Fallback to process.env if not in database
 * 5. Updates in-memory cache
 */
export async function getConfig(key: string): Promise<string | null> {
  const now = Date.now();
  const cached = memoryCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (record) {
      let resolvedValue: string | null = record.value;
      if (record.isEncrypted && record.value) {
        try {
          resolvedValue = decryptSecret(record.value);
        } catch (err) {
          console.error(`Failed to decrypt configuration key '${key}':`, err);
          resolvedValue = null;
        }
      }

      memoryCache.set(key, {
        value: resolvedValue,
        expiresAt: now + CACHE_TTL_MS,
      });

      return resolvedValue;
    }
  } catch (dbErr) {
    console.warn(`Database query failed for setting '${key}', falling back to process.env:`, dbErr);
  }

const STATIC_DEFAULTS: Record<string, string> = {
  MOOGOLD_BASE_URL: "https://moogold.com/wp-json/v1/api",
  MOOGOLD_SANDBOX_MODE: "true",
  BAKONG_ACCOUNT_ID: "anajak_diamond@aclb",
  BAKONG_MERCHANT_NAME: "ANAJAK DIAMOND",
  BAKONG_MERCHANT_CITY: "Phnom Penh",
  BAKONG_WEBHOOK_SECRET: "khqr_secret_token_cam_2026",
  ABA_PAYWAY_MERCHANT_ID: "ec478611",
  ABA_PAYWAY_API_KEY: "743F9E262F9673DE1809CCE505BB4A4E6F15E7A6",
  ABA_PAYWAY_API_URL: "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  ABA_PAYWAY_CHECK_URL: "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2",
  EXCHANGE_RATE_USD_KHR: "4100",
  ADMIN_SECRET_PATH: "portal-anachak-9821",
  ADMIN_2FA_PIN: "982100",
};

  // Fallback to process.env or static defaults if not configured in database
  const envFallback = process.env[key] || STATIC_DEFAULTS[key] || null;
  memoryCache.set(key, {
    value: envFallback,
    expiresAt: now + CACHE_TTL_MS,
  });

  return envFallback;
}

/**
 * Persists a dynamic system setting into database.
 * Encrypts sensitive values via AES-256-GCM if isEncrypted is true.
 * Immediately invalidates memory cache for zero-downtime propagation.
 */
export async function setConfig(
  key: string,
  value: string,
  isEncrypted: boolean = false,
  description?: string
): Promise<SettingItem> {
  const valueToStore = isEncrypted && value ? encryptSecret(value) : value;

  const record = await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: valueToStore,
      isEncrypted,
      description: description || null,
    },
    update: {
      value: valueToStore,
      isEncrypted,
      ...(description !== undefined ? { description } : {}),
    },
  });

  // Immediate Cache Invalidation
  memoryCache.delete(key);

  return record;
}

/**
 * Ensures all default system configurations exist in Supabase database.
 * Seeds them into the system_settings table if missing.
 */
export async function ensureDefaultSystemSettings(): Promise<void> {
  const defaults = [
    { key: "MOOGOLD_PARTNER_ID", value: process.env.MOOGOLD_PARTNER_ID || "", isEncrypted: false, description: "MooGold Reseller Partner ID" },
    { key: "MOOGOLD_SECRET_KEY", value: process.env.MOOGOLD_SECRET_KEY || "", isEncrypted: true, description: "MooGold Reseller API Secret Key (AES-256-GCM)" },
    { key: "MOOGOLD_BASE_URL", value: process.env.MOOGOLD_BASE_URL || "https://moogold.com/wp-json/v1/api", isEncrypted: false, description: "MooGold API Base URL" },
    { key: "MOOGOLD_SANDBOX_MODE", value: process.env.MOOGOLD_SANDBOX_MODE || "true", isEncrypted: false, description: "MooGold Sandbox Simulation Mode" },
    { key: "BAKONG_ACCOUNT_ID", value: process.env.BAKONG_ACCOUNT_ID || "anajak_diamond@aclb", isEncrypted: false, description: "Bakong KHQR Merchant Account ID" },
    { key: "BAKONG_MERCHANT_NAME", value: process.env.BAKONG_MERCHANT_NAME || "ANAJAK DIAMOND", isEncrypted: false, description: "Bakong Merchant Display Name" },
    { key: "BAKONG_MERCHANT_CITY", value: process.env.BAKONG_MERCHANT_CITY || "Phnom Penh", isEncrypted: false, description: "Bakong Merchant City" },
    { key: "BAKONG_WEBHOOK_SECRET", value: process.env.BAKONG_WEBHOOK_SECRET || "khqr_secret_token_cam_2026", isEncrypted: true, description: "Bakong Webhook Signature Secret (AES-256-GCM)" },
    { key: "ABA_PAYWAY_MERCHANT_ID", value: process.env.ABA_PAYWAY_MERCHANT_ID || "ec478611", isEncrypted: false, description: "ABA PayWay Merchant ID" },
    { key: "ABA_PAYWAY_API_KEY", value: process.env.ABA_PAYWAY_API_KEY || "743F9E262F9673DE1809CCE505BB4A4E6F15E7A6", isEncrypted: true, description: "ABA PayWay Public/API Key (AES-256-GCM)" },
    { key: "ABA_PAYWAY_API_URL", value: process.env.ABA_PAYWAY_API_URL || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase", isEncrypted: false, description: "ABA PayWay Purchase API Endpoint" },
    { key: "ABA_PAYWAY_CHECK_URL", value: process.env.ABA_PAYWAY_CHECK_URL || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2", isEncrypted: false, description: "ABA PayWay Check Transaction API Endpoint" },
    { key: "EXCHANGE_RATE_USD_KHR", value: process.env.EXCHANGE_RATE_USD_KHR || "4100", isEncrypted: false, description: "Currency Exchange Rate (1 USD in KHR)" },
    { key: "ADMIN_SECRET_PATH", value: process.env.ADMIN_SECRET_PATH || "portal-anachak-9821", isEncrypted: false, description: "Obscured Admin Portal URL Route" },
    { key: "ADMIN_2FA_PIN", value: process.env.ADMIN_2FA_PIN || "982100", isEncrypted: false, description: "Master 2FA Verification Security PIN" },
    { key: "ADMIN_ALLOWED_IPS", value: process.env.ADMIN_ALLOWED_IPS || "", isEncrypted: false, description: "IP Whitelist for Admin Portal access (empty = all allowed)" },
    { key: "MAINTENANCE_MODE", value: "false", isEncrypted: false, description: "System Maintenance Mode Toggle" },
    { key: "SERVICE_FEE_PERCENT", value: "15", isEncrypted: false, description: "Markup / Profit Margin percentage" },
    { key: "TELEGRAM_BOT_TOKEN", value: process.env.TELEGRAM_BOT_TOKEN || "", isEncrypted: true, description: "Telegram Bot Token for alerts & OTP" },
    { key: "TELEGRAM_ADMIN_CHAT_ID", value: process.env.TELEGRAM_ADMIN_CHAT_ID || "", isEncrypted: false, description: "Telegram Admin Chat ID" },
  ];

  try {
    for (const item of defaults) {
      const existing = await prisma.systemSetting.findUnique({ where: { key: item.key } });
      if (!existing) {
        const storedValue = item.isEncrypted && item.value ? encryptSecret(item.value) : item.value;
        await prisma.systemSetting.create({
          data: {
            key: item.key,
            value: storedValue,
            isEncrypted: item.isEncrypted,
            description: item.description,
          },
        });
      }
    }
  } catch (err) {
    console.warn("Could not seed default system settings in Supabase:", err);
  }
}

/**
 * Deletes a setting and clears its cache entry
 */
export async function deleteConfig(key: string): Promise<void> {
  try {
    await prisma.systemSetting.delete({
      where: { key },
    });
  } catch {
    // Ignore if not exists
  }
  memoryCache.delete(key);
}

/**
 * Clears the entire in-memory configuration cache
 */
export function invalidateAllConfigCache(): void {
  memoryCache.clear();
}

/**
 * Retrieves all settings with sensitive values safely masked for Admin UI display.
 */
export async function getAllMaskedSettings(): Promise<SettingItem[]> {
  try {
    const all = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });

    return all.map((item) => {
      let displayValue = item.value;

      if (item.isEncrypted && item.value) {
        try {
          const decrypted = decryptSecret(item.value);
          displayValue = maskSecretValue(decrypted);
        } catch {
          displayValue = "••••••••••••••••";
        }
      }

      return {
        id: item.id,
        key: item.key,
        value: displayValue,
        isEncrypted: item.isEncrypted,
        description: item.description,
        updatedAt: item.updatedAt,
      };
    });
  } catch (err) {
    console.error("Failed to query all system settings:", err);
    return [];
  }
}
