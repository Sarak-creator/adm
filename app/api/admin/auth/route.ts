import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  validateAdminCredentials,
  signAdminToken,
  verifyAdminToken,
  signPending2FAToken,
  verifyPending2FAToken,
  validate2FACode,
  getClientIp,
  getAdminSecretPath,
  get2FAPin,
  DEFAULT_ADMIN_USERNAME,
} from "@/lib/admin-auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limiter";
import {
  sendLoginSuccessAlert,
  sendFailedAttemptAlert,
  sendLockoutAlert,
  sendTelegramOtpCode,
} from "@/lib/telegram-alert";

/**
 * GET: Check current admin authentication state & get secret portal path
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(sessionToken);
    const secretPath = await getAdminSecretPath();

    if (!payload) {
      return NextResponse.json(
        { authenticated: false, adminSecretPath: secretPath },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: payload.username,
        role: payload.role,
      },
      adminSecretPath: secretPath,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Authenticate admin credentials with Anti-Brute Force, 2FA, and Telegram Alerts
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "Unknown Browser";

  // 1. Anti-Brute Force Check
  const rateLimitStatus = checkRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    const lockoutMinutes = rateLimitStatus.retryAfterMinutes || 15;
    await sendLockoutAlert({ ip, userAgent, lockoutMinutes });
    return NextResponse.json(
      {
        success: false,
        error: `🚨 គណនីត្រូវបានចាក់សោបណ្តោះអាសន្ន! ដោយសារព្យាយាម Login ខុសលើស ៥ ដង។ សូមរង់ចាំ ${lockoutMinutes} នាទីទៀត។`,
        isLocked: true,
        retryAfterMinutes: lockoutMinutes,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { username, password, twoFactorCode, pendingToken, rememberMe } = body || {};

    // ========================================================
    // CASE A: Step 2 - Submitting 2FA Code with pendingToken
    // ========================================================
    if (pendingToken && twoFactorCode) {
      const verifiedPending = await verifyPending2FAToken(pendingToken);
      if (!verifiedPending) {
        return NextResponse.json(
          {
            success: false,
            error: "Session 2FA បានផុតកំណត់! សូម Login ឡើងវិញពីជំហានទី ១ (2FA session expired).",
          },
          { status: 400 }
        );
      }

      const is2FAValid = await validate2FACode(twoFactorCode, verifiedPending.username);
      if (!is2FAValid) {
        const failRecord = recordFailedAttempt(ip);
        await sendFailedAttemptAlert({
          ip,
          userAgent,
          username: verifiedPending.username,
          attemptsLeft: failRecord.remainingAttempts,
        });

        if (failRecord.isLocked) {
          await sendLockoutAlert({ ip, userAgent, lockoutMinutes: 15 });
          return NextResponse.json(
            {
              success: false,
              error: "🚨 លេខកូដ 2FA មិនត្រឹមត្រូវ! IP របស់អ្នកត្រូវបានចាក់សោបណ្តោះអាសន្ន ១៥ នាទី។",
              isLocked: true,
            },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: `លេខកូដ 2FA មិនត្រឹមត្រូវឡើយ! (Invalid 2FA Code) - នៅសល់ ${failRecord.remainingAttempts} ដងទៀត`,
            remainingAttempts: failRecord.remainingAttempts,
          },
          { status: 401 }
        );
      }

      // 2FA PASSED!
      resetRateLimit(ip);
      const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      const finalToken = await signAdminToken(verifiedPending.username, maxAgeSeconds);

      // Dispatch Telegram Login Alert
      await sendLoginSuccessAlert({
        ip,
        userAgent,
        username: verifiedPending.username,
      });

      const response = NextResponse.json({
        success: true,
        message: "ចូលប្រព័ន្ធដោយជោគជ័យ! (Logged in successfully with 2FA)",
        user: { username: verifiedPending.username, role: "ADMIN" },
        adminSecretPath: await getAdminSecretPath(),
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: finalToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAgeSeconds,
        path: "/",
      });

      return response;
    }

    // ========================================================
    // CASE B: Step 1 - Submitting Username & Password
    // ========================================================
    if (!password) {
      return NextResponse.json(
        { success: false, error: "សូមបញ្ចូលពាក្យសម្ងាត់ (Password is required)" },
        { status: 400 }
      );
    }

    const validationResult = await validateAdminCredentials(username, password);

    if (!validationResult.success) {
      const failRecord = recordFailedAttempt(ip);
      await sendFailedAttemptAlert({
        ip,
        userAgent,
        username: username || "unknown",
        attemptsLeft: failRecord.remainingAttempts,
      });

      if (failRecord.isLocked) {
        await sendLockoutAlert({ ip, userAgent, lockoutMinutes: 15 });
        return NextResponse.json(
          {
            success: false,
            error: "🚨 ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ! IP ត្រូវបានចាក់សោបណ្តោះអាសន្ន ១៥ នាទី។",
            isLocked: true,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ! នៅសល់ឱកាសសាកល្បង ${failRecord.remainingAttempts} ដងទៀត។`,
          remainingAttempts: failRecord.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Password is valid! Now require Step 2: 2FA Verification
    const adminUser = validationResult.user?.username || (username && username.trim()) || DEFAULT_ADMIN_USERNAME;

    // Check if 2FA code was sent together directly in one request
    if (twoFactorCode) {
      const is2FAValid = await validate2FACode(twoFactorCode, adminUser);
      if (is2FAValid) {
        resetRateLimit(ip);
        const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        const finalToken = await signAdminToken(adminUser, maxAgeSeconds);

        await sendLoginSuccessAlert({ ip, userAgent, username: adminUser });

        const response = NextResponse.json({
          success: true,
          message: "ចូលប្រព័ន្ធដោយជោគជ័យ!",
          user: { username: adminUser, role: "ADMIN" },
          adminSecretPath: await getAdminSecretPath(),
        });

        response.cookies.set({
          name: ADMIN_COOKIE_NAME,
          value: finalToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: maxAgeSeconds,
          path: "/",
        });

        return response;
      }
    }

    // Generate short-lived 2FA pending token
    const pendingTokenGenerated = await signPending2FAToken(adminUser);

    // Optionally broadcast 2FA code to Telegram bot
    const currentPin = await get2FAPin();
    await sendTelegramOtpCode(currentPin, ip);

    return NextResponse.json({
      success: true,
      require2FA: true,
      pendingToken: pendingTokenGenerated,
      message: "សូមបញ្ចូលលេខកូដសុវត្ថិភាព 2FA (Enter 6-digit 2FA Security Code)",
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Admin Logout - clears session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "បានចាកចេញដោយជោគជ័យ (Logged out successfully)",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
