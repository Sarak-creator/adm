import QRCode from "qrcode";
import { getConfig } from "./config-service";

export interface KHQRParams {
  orderNumber: string;
  amountUSD: number;
  amountKHR: number;
  currency: "USD" | "KHR";
  merchantName?: string;
  merchantAccountId?: string;
  merchantCity?: string;
  expiresInMinutes?: number;
}

export interface GeneratedKHQR {
  qrString: string;
  qrDataUrl: string;
  orderNumber: string;
  amount: number;
  currency: "USD" | "KHR";
  expiresAt: Date;
  md5Hash: string;
}

/**
 * Calculates CRC-16/CCITT-FALSE (Polynomial: 0x1021, Initial: 0xFFFF)
 * Required for EMVCo Tag 63 standard compliance
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Generates an EMVCo compliant Bakong KHQR dynamic string
 */
export function buildBakongKHQRString(params: {
  accountId: string;
  merchantName: string;
  merchantCity: string;
  currency: "USD" | "KHR";
  amount: number;
  orderNumber: string;
}): string {
  const { accountId, merchantName, merchantCity, currency, amount, orderNumber } = params;

  // Tag 00: Format Indicator "01"
  let payload = formatTag("00", "01");

  // Tag 01: Initiation method "12" (Dynamic QR)
  payload += formatTag("01", "12");

  // Tag 29: Merchant Account Information
  // Subtag 00: Bakong identifier
  // Subtag 01: Merchant Bakong Account ID
  const subtag00 = formatTag("00", "bakong@nbc.gov.kh");
  const subtag01 = formatTag("01", accountId);
  const tag29Value = `${subtag00}${subtag01}`;
  payload += formatTag("29", tag29Value);

  // Tag 52: Merchant Category Code (General Merchandise / Digital Goods)
  payload += formatTag("52", "5816");

  // Tag 53: Transaction Currency (840 = USD, 116 = KHR)
  const currencyCode = currency === "USD" ? "840" : "116";
  payload += formatTag("53", currencyCode);

  // Tag 54: Transaction Amount
  const amountStr = currency === "USD" ? amount.toFixed(2) : Math.round(amount).toString();
  payload += formatTag("54", amountStr);

  // Tag 58: Country Code ("KH")
  payload += formatTag("58", "KH");

  // Tag 59: Merchant Name
  payload += formatTag("59", merchantName.slice(0, 25));

  // Tag 60: Merchant City
  payload += formatTag("60", merchantCity.slice(0, 15));

  // Tag 62: Additional Data Field (Order Number / Bill ID)
  const subtag01Bill = formatTag("01", orderNumber);
  const tag62Value = `${subtag01Bill}`;
  payload += formatTag("62", tag62Value);

  // Tag 63: CRC Checksum
  // Prefix "6304" then append the calculated CRC16
  const toComputeCRC = `${payload}6304`;
  const checksum = calculateCRC16(toComputeCRC);

  return `${toComputeCRC}${checksum}`;
}

/**
 * High-level dynamic KHQR generator with QR image output and expiration
 */
export async function createDynamicKHQR(params: KHQRParams): Promise<GeneratedKHQR> {
  const accountId =
    params.merchantAccountId ||
    (await getConfig("BAKONG_ACCOUNT_ID")) ||
    process.env.BAKONG_ACCOUNT_ID ||
    "anajak_diamond@aclb";
  const merchantName =
    params.merchantName ||
    (await getConfig("BAKONG_MERCHANT_NAME")) ||
    process.env.BAKONG_MERCHANT_NAME ||
    "ANAJAK DIAMOND";
  const merchantCity =
    params.merchantCity ||
    (await getConfig("BAKONG_MERCHANT_CITY")) ||
    process.env.BAKONG_MERCHANT_CITY ||
    "Phnom Penh";
  const expiresInMin = params.expiresInMinutes || 5;

  const amount = params.currency === "USD" ? params.amountUSD : params.amountKHR;

  const qrString = buildBakongKHQRString({
    accountId,
    merchantName,
    merchantCity,
    currency: params.currency,
    amount,
    orderNumber: params.orderNumber,
  });

  // Render high-resolution stylized QR code data URL
  const qrDataUrl = await QRCode.toDataURL(qrString, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 380,
    color: {
      dark: "#0a1128", // Deep luxury navy/dark
      light: "#ffffff",
    },
  });

  const expiresAt = new Date(Date.now() + expiresInMin * 60 * 1000);

  // Simple pseudo hash identifier
  const md5Hash = Buffer.from(`${params.orderNumber}:${amount}:${qrString.slice(-8)}`).toString("hex");

  return {
    qrString,
    qrDataUrl,
    orderNumber: params.orderNumber,
    amount,
    currency: params.currency,
    expiresAt,
    md5Hash,
  };
}
