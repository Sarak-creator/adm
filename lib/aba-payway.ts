import crypto from "crypto";
import { getConfig } from "./config-service";

export interface CreatePaywayPurchaseParams {
  orderNumber: string;
  amountUSD: number;
  items?: Array<{ name: string; quantity: number; price: number }>;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaywayPurchaseResult {
  success: boolean;
  tranId: string;
  qrString?: string;
  qrImage?: string; // base64 PNG data URL or raw base64
  abapayDeeplink?: string;
  appCheckoutUrl?: string;
  raw?: unknown;
  errorMessage?: string;
}

export interface PaywayCheckTransactionResult {
  success: boolean;
  status: number | string; // 0 = approved, 1 = pending, 2 = cancelled/failed
  tranId: string;
  raw?: unknown;
  errorMessage?: string;
}

/**
 * Format current UTC time as YYYYMMDDHHmmss required by ABA PayWay
 */
export function getPaywayReqTime(): string {
  const now = new Date();
  const YYYY = now.getUTCFullYear().toString();
  const MM = String(now.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(now.getUTCDate()).padStart(2, "0");
  const HH = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

/**
 * ABA PayWay v1 HMAC-SHA512 Signature generator
 * Strictly concatenates 24 fields in exact required order
 */
export function generatePaywayHash(
  apiKey: string,
  params: {
    req_time: string;
    merchant_id: string;
    tran_id: string;
    amount: string;
    items: string;
    shipping?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    type?: string;
    payment_option?: string;
    return_url?: string;
    cancel_url?: string;
    continue_success_url?: string;
    return_deeplink?: string;
    currency?: string;
    custom_fields?: string;
    return_params?: string;
    payout?: string;
    lifetime?: string;
    additional_params?: string;
    google_pay_token?: string;
    skip_success_page?: string;
  }
): string {
  const rawStr =
    (params.req_time || "") +
    (params.merchant_id || "") +
    (params.tran_id || "") +
    (params.amount || "") +
    (params.items || "") +
    (params.shipping || "") +
    (params.firstname || "") +
    (params.lastname || "") +
    (params.email || "") +
    (params.phone || "") +
    (params.type || "") +
    (params.payment_option || "") +
    (params.return_url || "") +
    (params.cancel_url || "") +
    (params.continue_success_url || "") +
    (params.return_deeplink || "") +
    (params.currency || "") +
    (params.custom_fields || "") +
    (params.return_params || "") +
    (params.payout || "") +
    (params.lifetime || "") +
    (params.additional_params || "") +
    (params.google_pay_token || "") +
    (params.skip_success_page || "");

  return crypto.createHmac("sha512", apiKey).update(rawStr).digest("base64");
}

/**
 * ABA PayWay check-transaction-2 Hash generator
 * Format: req_time + merchant_id + tran_id
 */
export function generateCheckTransactionHash(
  apiKey: string,
  reqTime: string,
  merchantId: string,
  tranId: string
): string {
  const rawStr = `${reqTime}${merchantId}${tranId}`;
  return crypto.createHmac("sha512", apiKey).update(rawStr).digest("base64");
}

/**
 * Calls ABA PayWay purchase API to generate dynamic KHQR, QR Image, and ABA Mobile Deeplink
 */
export async function createPaywayPurchase(
  params: CreatePaywayPurchaseParams
): Promise<PaywayPurchaseResult> {
  const merchantId = (await getConfig("ABA_PAYWAY_MERCHANT_ID")) || process.env.ABA_PAYWAY_MERCHANT_ID || "ec478611";
  const apiKey = (await getConfig("ABA_PAYWAY_API_KEY")) || process.env.ABA_PAYWAY_API_KEY || "743F9E262F9673DE1809CCE505BB4A4E6F15E7A6";
  const apiUrl =
    (await getConfig("ABA_PAYWAY_API_URL")) ||
    process.env.ABA_PAYWAY_API_URL ||
    "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

  if (!merchantId || !apiKey) {
    return {
      success: false,
      tranId: params.orderNumber,
      errorMessage: "ABA PayWay credentials not configured",
    };
  }

  // PayWay tran_id must be alphanumeric string, max 20 chars
  // Replace hyphens/special chars and take up to 20 chars
  const cleanTranId = params.orderNumber.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const reqTime = getPaywayReqTime();

  // Note: Merchant ec478611 uses USD settlement account
  const amountStr = params.amountUSD.toFixed(2);
  const currencyStr = "USD";

  const itemsList = params.items && params.items.length > 0
    ? params.items
    : [{ name: `Diamond Topup ${params.orderNumber}`, quantity: 1, price: params.amountUSD }];
  const itemsBase64 = Buffer.from(JSON.stringify(itemsList)).toString("base64");

  const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://anajakdiamond.com";
  const returnUrlBase64 = Buffer.from(params.returnUrl || `${defaultAppUrl}/order/${params.orderNumber}`).toString("base64");
  const cancelUrlBase64 = Buffer.from(params.cancelUrl || `${defaultAppUrl}/`).toString("base64");

  const hash = generatePaywayHash(apiKey, {
    req_time: reqTime,
    merchant_id: merchantId,
    tran_id: cleanTranId,
    amount: amountStr,
    items: itemsBase64,
    shipping: "",
    firstname: params.firstname || "Customer",
    lastname: params.lastname || "Diamond",
    email: params.email || "support@anajakdiamond.com",
    phone: params.phone || "012345678",
    type: "purchase",
    payment_option: "abapay_khqr",
    return_url: returnUrlBase64,
    cancel_url: cancelUrlBase64,
    continue_success_url: "",
    return_deeplink: "",
    currency: currencyStr,
    custom_fields: "",
    return_params: "",
    payout: "",
    lifetime: "5", // 5 minutes valid
    additional_params: "",
    google_pay_token: "",
    skip_success_page: "1",
  });

  const formData = new URLSearchParams();
  formData.append("req_time", reqTime);
  formData.append("merchant_id", merchantId);
  formData.append("tran_id", cleanTranId);
  formData.append("amount", amountStr);
  formData.append("items", itemsBase64);
  formData.append("firstname", params.firstname || "Customer");
  formData.append("lastname", params.lastname || "Diamond");
  formData.append("email", params.email || "support@anajakdiamond.com");
  formData.append("phone", params.phone || "012345678");
  formData.append("type", "purchase");
  formData.append("payment_option", "abapay_khqr");
  formData.append("return_url", returnUrlBase64);
  formData.append("cancel_url", cancelUrlBase64);
  formData.append("currency", currencyStr);
  formData.append("lifetime", "5");
  formData.append("skip_success_page", "1");
  formData.append("hash", hash);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // Check code === "00" or code === 0
    if (data.status?.code === "00" || data.status?.code === 0 || data.code === "00" || data.code === 0) {
      const qrString = data.qrString || data.data?.qrString;
      let qrImage = data.qrImage || data.data?.qrImage;
      if (qrImage && !qrImage.startsWith("data:image/")) {
        qrImage = `data:image/png;base64,${qrImage}`;
      }
      const abapayDeeplink = data.abapay_deeplink || data.data?.abapay_deeplink;
      const appCheckoutUrl = data.app_checkout_url || data.data?.app_checkout_url;

      return {
        success: true,
        tranId: cleanTranId,
        qrString,
        qrImage,
        abapayDeeplink,
        appCheckoutUrl,
        raw: data,
      };
    }

    const errMsg = data.description || data.status?.message || data.message || "Failed to create PayWay purchase";
    return {
      success: false,
      tranId: cleanTranId,
      errorMessage: errMsg,
      raw: data,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      tranId: cleanTranId,
      errorMessage: err.message || "Network error contacting ABA PayWay",
    };
  }
}

/**
 * Checks transaction status with ABA PayWay (/check-transaction-2)
 * status: 0 = Approved/Paid, 1 = Pending, 2 = Cancelled/Declined
 */
export async function checkPaywayTransaction(
  tranId: string
): Promise<PaywayCheckTransactionResult> {
  const merchantId = (await getConfig("ABA_PAYWAY_MERCHANT_ID")) || process.env.ABA_PAYWAY_MERCHANT_ID || "ec478611";
  const apiKey = (await getConfig("ABA_PAYWAY_API_KEY")) || process.env.ABA_PAYWAY_API_KEY || "743F9E262F9673DE1809CCE505BB4A4E6F15E7A6";
  const checkUrl =
    (await getConfig("ABA_PAYWAY_CHECK_URL")) ||
    process.env.ABA_PAYWAY_CHECK_URL ||
    "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2";

  if (!merchantId || !apiKey) {
    return {
      success: false,
      status: "unconfigured",
      tranId,
      errorMessage: "ABA PayWay credentials not configured",
    };
  }

  const cleanTranId = tranId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const reqTime = getPaywayReqTime();
  const hash = generateCheckTransactionHash(apiKey, reqTime, merchantId, cleanTranId);

  const formData = new URLSearchParams();
  formData.append("req_time", reqTime);
  formData.append("merchant_id", merchantId);
  formData.append("tran_id", cleanTranId);
  formData.append("hash", hash);

  try {
    const response = await fetch(checkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // Check-transaction-2 response format:
    // { data: { payment_status_code: 0 (APPROVED) / 2 (PENDING), payment_status: "APPROVED" | "PENDING", ... }, status: { code: "00", message: "Success!" } }
    // Or sometimes direct status field: { status: 0, payment_status: 'APPROVED' }
    let paymentStatusCode: number | string = "unknown";
    if (data.data?.payment_status_code !== undefined) {
      paymentStatusCode = data.data.payment_status_code; // 0 = approved, 2 = pending
    } else if (data.data?.payment_status !== undefined) {
      paymentStatusCode = data.data.payment_status === "APPROVED" ? 0 : data.data.payment_status;
    } else if (data.status !== undefined && typeof data.status === "number") {
      paymentStatusCode = data.status;
    }

    const isApproved =
      paymentStatusCode === 0 ||
      paymentStatusCode === "0" ||
      data.data?.payment_status === "APPROVED" ||
      data.payment_status === "APPROVED";

    return {
      success: true,
      status: isApproved ? 0 : paymentStatusCode,
      tranId: cleanTranId,
      raw: data,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      status: "error",
      tranId: cleanTranId,
      errorMessage: err.message,
    };
  }
}
