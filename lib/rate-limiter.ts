/**
 * In-Memory Anti-Brute Force Rate Limiter
 * Limits failed login attempts to 5 per 15 minutes per IP address.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

const ipRecords = new Map<string, RateLimitRecord>();

// Clean up stale records periodically (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  ipRecords.forEach((record, ip) => {
    if (record.lockedUntil && record.lockedUntil < now) {
      ipRecords.delete(ip);
    } else if (!record.lockedUntil && now - record.firstAttemptAt > WINDOW_MS) {
      ipRecords.delete(ip);
    }
  });
}, 30 * 60 * 1000);

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
} {
  const cleanIp = ip || "unknown";
  const now = Date.now();
  const record = ipRecords.get(cleanIp);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // If currently locked out
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const retryAfterMinutes = Math.ceil((record.lockedUntil - now) / (60 * 1000));
      return { allowed: false, remainingAttempts: 0, retryAfterMinutes };
    } else {
      // Lockout has expired, reset
      ipRecords.delete(cleanIp);
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }
  }

  // If window has passed, reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    ipRecords.delete(cleanIp);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { allowed: remainingAttempts > 0, remainingAttempts };
}

export function recordFailedAttempt(ip: string): {
  remainingAttempts: number;
  isLocked: boolean;
  retryAfterMinutes?: number;
} {
  const cleanIp = ip || "unknown";
  const now = Date.now();
  let record = ipRecords.get(cleanIp);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    ipRecords.set(cleanIp, record);
    return {
      remainingAttempts: 0,
      isLocked: true,
      retryAfterMinutes: Math.ceil(LOCKOUT_MS / (60 * 1000)),
    };
  }

  ipRecords.set(cleanIp, record);
  return {
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
    isLocked: false,
  };
}

export function resetRateLimit(ip: string): void {
  const cleanIp = ip || "unknown";
  ipRecords.delete(cleanIp);
}
