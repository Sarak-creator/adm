/**
 * Telegram Security Alert & OTP Dispatcher
 * Sends instant notifications to Admin Telegram Bot for:
 * 1. Admin Login Success (Time, IP, Device)
 * 2. Suspicious Failed Login Attempts
 * 3. IP Lockout Warnings (Anti-Brute Force Triggered)
 * 4. Dynamic Two-Factor OTP Codes
 */

import { getConfig } from "./config-service";

interface TelegramAlertOptions {
  ip: string;
  userAgent?: string;
  username?: string;
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = (await getConfig("TELEGRAM_BOT_TOKEN")) || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = (await getConfig("TELEGRAM_ADMIN_CHAT_ID")) || process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    // If not configured, log for local dev awareness
    console.log("[Telegram Alert (Disabled)]: ", text.replace(/<[^>]*>/g, ""));
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (e) {
    console.warn("Failed to dispatch Telegram security alert:", e);
    return false;
  }
}

/**
 * Send alert on successful admin login
 */
export async function sendLoginSuccessAlert(opts: TelegramAlertOptions): Promise<void> {
  const timeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" });
  const message = [
    `🛡️ <b>[អាណាចក្រDiamond] ADMIN LOGIN ជោគជ័យ</b>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>គណនី:</b> <code>${opts.username || "admin"}</code>`,
    `🌐 <b>IP Address:</b> <code>${opts.ip}</code>`,
    `🕒 <b>ពេលវេលា:</b> ${timeStr} (ICT/Phnom Penh)`,
    `📱 <b>Device:</b> <i>${opts.userAgent || "Unknown Browser"}</i>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `✅ <i>ប្រសិនបើនេះជាអ្នក សូមកុំបារម្ភ។ បើមិនមែនទេ សូមប្តូរ ADMIN_SECRET ជាបន្ទាន់!</i>`,
  ].join("\n");

  await sendTelegramMessage(message);
}

/**
 * Send alert on suspicious failed attempt
 */
export async function sendFailedAttemptAlert(opts: TelegramAlertOptions & { attemptsLeft: number }): Promise<void> {
  const timeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" });
  const message = [
    `⚠️ <b>[អាណាចក្រDiamond] ការប៉ុនប៉ង LOGIN បរាជ័យ!</b>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Username វាយចូល:</b> <code>${opts.username || "unknown"}</code>`,
    `🌐 <b>IP Address:</b> <code>${opts.ip}</code>`,
    `🕒 <b>ពេលវេលា:</b> ${timeStr}`,
    `🔢 <b>ឱកាសសល់:</b> ${opts.attemptsLeft} ដង`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🚨 <i>មាននរណាម្នាក់កំពុងព្យាយាមចូល Admin Portal របស់អ្នក!</i>`,
  ].join("\n");

  await sendTelegramMessage(message);
}

/**
 * Send alert when IP is blocked by Anti-Brute Force
 */
export async function sendLockoutAlert(opts: TelegramAlertOptions & { lockoutMinutes: number }): Promise<void> {
  const timeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" });
  const message = [
    `🚨 <b>[អាណាចក្រDiamond] IP ត្រូវបានចាក់សោ (LOCKED)!</b>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🌐 <b>Blocked IP:</b> <code>${opts.ip}</code>`,
    `🕒 <b>ពេលវេលា:</b> ${timeStr}`,
    `⏳ <b>រយៈពេលចាក់សោ:</b> ${opts.lockoutMinutes} នាទី`,
    `━━━━━━━━━━━━━━━━━━━`,
    `⛔ <i>IP នេះត្រូវបានរារាំងដោយស្វ័យប្រវត្តិនឹងមិនអាច Login បានទេក្នុងរយៈពេល ${opts.lockoutMinutes} នាទី។</i>`,
  ].join("\n");

  await sendTelegramMessage(message);
}

/**
 * Broadcast dynamic 2FA OTP code to Telegram
 */
export async function sendTelegramOtpCode(otp: string, ip: string): Promise<boolean> {
  const timeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" });
  const message = [
    `🔐 <b>[អាណាចក្រDiamond] លេខកូដសុវត្ថិភាព 2FA OTP</b>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🔑 <b>លេខកូដសម្ងាត់:</b> <code>${otp}</code>`,
    `⏳ <b>សុពលភាព:</b> ៥ នាទី`,
    `🌐 <b>ស្នើសុំពី IP:</b> <code>${ip}</code>`,
    `🕒 <b>ម៉ោង:</b> ${timeStr}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `⚠️ <i>ដាច់ខាតកុំចែករំលែកលេខកូដនេះឱ្យអ្នកដទៃដឹងឡើយ!</i>`,
  ].join("\n");

  return sendTelegramMessage(message);
}
