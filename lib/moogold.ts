import crypto from "crypto";
import { getConfig } from "./config-service";

export interface MooGoldValidationResult {
  success: boolean;
  inGameName?: string;
  errorMessage?: string;
  raw?: unknown;
}

export interface MooGoldOrderResult {
  success: boolean;
  orderId?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  raw?: unknown;
  errorMessage?: string;
}

export interface MooGoldBalanceResult {
  success: boolean;
  balance: number;
  currency: string;
  raw?: unknown;
  errorMessage?: string;
}

export interface MooGoldOrderStatusResult {
  success: boolean;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  orderId: string;
  raw?: unknown;
  errorMessage?: string;
}

interface MooGoldCredentials {
  partnerId: string;
  secretKey: string;
  baseUrl: string;
  isSandbox: boolean;
}

class MooGoldClient {
  /**
   * Resolves MooGold credentials dynamically from the encrypted database config
   * with fallback to process.env variables.
   */
  public async getCredentials(): Promise<MooGoldCredentials> {
    const partnerId =
      (await getConfig("MOOGOLD_PARTNER_ID")) || process.env.MOOGOLD_PARTNER_ID || "";
    const secretKey =
      (await getConfig("MOOGOLD_SECRET_KEY")) || process.env.MOOGOLD_SECRET_KEY || "";
    const baseUrl =
      (await getConfig("MOOGOLD_BASE_URL")) ||
      process.env.MOOGOLD_BASE_URL ||
      "https://moogold.com/wp-json/v1/api";
    const sandboxConfig =
      (await getConfig("MOOGOLD_SANDBOX_MODE")) || process.env.MOOGOLD_SANDBOX_MODE;

    const isSandbox =
      sandboxConfig === "true" ||
      !partnerId ||
      !secretKey ||
      partnerId === "your_partner_id_here";

    return {
      partnerId,
      secretKey,
      baseUrl,
      isSandbox,
    };
  }

  /**
   * Generates HMAC-SHA256 signature as specified by doc.moogold.com
   * Signature formula: hash_hmac('sha256', payloadString + timestamp + path, secretKey)
   */
  private generateSignature(
    path: string,
    payloadString: string,
    timestamp: number,
    secretKey: string
  ): string {
    const stringToSign = `${payloadString}${timestamp}${path}`;
    return crypto.createHmac("sha256", secretKey).update(stringToSign).digest("hex");
  }

  /**
   * Sends authenticated POST request with exponential backoff retry and timeout
   */
  private async postWithRetry<T>(
    path: string,
    payload: Record<string, unknown>,
    creds: MooGoldCredentials,
    idempotencyKey?: string,
    maxRetries = 3
  ): Promise<T> {
    const url = `${creds.baseUrl}/${path}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadWithAuth = {
      path,
      partner_id: creds.partnerId,
      ...payload,
    };
    const payloadString = JSON.stringify(payloadWithAuth);
    const signature = this.generateSignature(path, payloadString, timestamp, creds.secretKey);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "timestamp": timestamp.toString(),
      "auth": signature,
      "Authorization": `Basic ${Buffer.from(`${creds.partnerId}:${creds.secretKey}`).toString("base64")}`,
    };

    if (idempotencyKey) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }

    let lastError: Error | null = null;
    let delay = 600; // start 600ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`MooGold API HTTP ${response.status}: ${errText}`);
        }

        const data = (await response.json()) as T;
        return data;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const error = err as Error;
        lastError = error;

        // If not network/timeout error or last attempt, don't retry 4xx errors
        if (attempt === maxRetries || (error.message && error.message.includes("HTTP 4"))) {
          break;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw lastError || new Error("MooGold API request failed");
  }

  /**
   * 1. Validate In-game User ID and Zone ID
   */
  public async validatePlayerId(
    gameSlug: string,
    userId: string,
    zoneId?: string
  ): Promise<MooGoldValidationResult> {
    const cleanUserId = userId.trim();
    const cleanZoneId = zoneId ? zoneId.trim() : undefined;

    if (!cleanUserId) {
      return { success: false, errorMessage: "សូមបញ្ចូល User ID របស់អ្នក (Please enter User ID)" };
    }

    const creds = await this.getCredentials();

    // Sandbox Simulation Mode
    if (creds.isSandbox) {
      // Provide deterministic, realistic Cambodian gamer nicknames
      const khmerGamers = [
        "ProSlayer_KH 🇰🇭",
        "Dara_Mythic 👑",
        "AngkorWarrior99 ⚡",
        "Sokha_Sniper 🎯",
        "Vannak_Ace 🔥",
        "Rithy_Legend 🏆",
        "Kosal_Striker 💥",
        "Bona_Cambodia 🐉",
      ];
      // Pick based on user ID digits
      const numSum = cleanUserId
        .split("")
        .reduce((acc, char) => acc + (char.charCodeAt(0) || 0), 0);
      const chosenName = khmerGamers[numSum % khmerGamers.length];

      // Simulated network latency
      await new Promise((res) => setTimeout(res, 450));

      return {
        success: true,
        inGameName: chosenName,
        raw: { sandbox: true, userId: cleanUserId, zoneId: cleanZoneId, username: chosenName },
      };
    }

    // Live API Call
    try {
      const payload: Record<string, unknown> = {
        category: gameSlug,
        "User ID": cleanUserId,
      };
      if (cleanZoneId) {
        payload["Zone ID"] = cleanZoneId;
        payload["Server"] = cleanZoneId;
      }

      interface MooGoldValidationResponse {
        status?: boolean | number | string;
        username?: string;
        data?: { username?: string; name?: string };
        err_code?: string;
        message?: string;
      }

      const res = await this.postWithRetry<MooGoldValidationResponse>(
        "product/user_validation",
        payload,
        creds
      );

      const username = res.username || res.data?.username || res.data?.name;
      if (username) {
        return {
          success: true,
          inGameName: username,
          raw: res,
        };
      }

      return {
        success: false,
        errorMessage: res.message || "រកមិនឃើញគណនីហ្គេមនេះទេ (Game Account Not Found)",
        raw: res,
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        errorMessage: err.message || "បរាជ័យក្នុងការផ្ទៀងផ្ទាត់ (Verification Failed)",
      };
    }
  }

  /**
   * 2. Create Top-up Order on MooGold
   */
  public async createTopupOrder(
    partnerOrderId: string,
    productId: string,
    variationId: string,
    userId: string,
    zoneId?: string
  ): Promise<MooGoldOrderResult> {
    const creds = await this.getCredentials();

    // Sandbox Simulation Mode
    if (creds.isSandbox) {
      await new Promise((res) => setTimeout(res, 750));
      const mockMooGoldId = `MG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      return {
        success: true,
        orderId: mockMooGoldId,
        status: "COMPLETED",
        raw: {
          sandbox: true,
          partner_order_id: partnerOrderId,
          moogold_order_id: mockMooGoldId,
          status: "completed",
          delivered_at: new Date().toISOString(),
        },
      };
    }

    // Live API Call
    try {
      const payload: Record<string, unknown> = {
        category: productId,
        product_id: productId,
        variation_id: variationId,
        partner_order_id: partnerOrderId,
        "User ID": userId.trim(),
      };
      if (zoneId) {
        payload["Zone ID"] = zoneId.trim();
        payload["Server"] = zoneId.trim();
      }

      interface MooGoldOrderResponse {
        status?: boolean | number | string;
        order_id?: string | number;
        message?: string;
        data?: { order_id?: string | number; status?: string };
      }

      const res = await this.postWithRetry<MooGoldOrderResponse>(
        "order/create_order",
        payload,
        creds,
        partnerOrderId // Idempotency key
      );

      const mgOrderId = String(res.order_id || res.data?.order_id || "");
      if (mgOrderId) {
        return {
          success: true,
          orderId: mgOrderId,
          status: "COMPLETED",
          raw: res,
        };
      }

      return {
        success: false,
        status: "FAILED",
        errorMessage: res.message || "បរាជ័យក្នុងការបញ្ជាទិញពេជ្រពី MooGold (MooGold Order Placement Failed)",
        raw: res,
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        status: "FAILED",
        errorMessage: err.message,
      };
    }
  }

  /**
   * 3. Check Order Status
   */
  public async checkOrderStatus(moogoldOrderId: string): Promise<MooGoldOrderStatusResult> {
    const creds = await this.getCredentials();

    if (creds.isSandbox) {
      return {
        success: true,
        status: "COMPLETED",
        orderId: moogoldOrderId,
        raw: { sandbox: true, status: "completed" },
      };
    }

    try {
      interface MooGoldDetailResponse {
        status?: string;
        order_id?: string | number;
        data?: { status?: string };
      }

      const res = await this.postWithRetry<MooGoldDetailResponse>(
        "order/order_detail",
        { order_id: moogoldOrderId },
        creds
      );

      const statusStr = (res.status || res.data?.status || "").toLowerCase();
      let mappedStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" = "PROCESSING";

      if (statusStr.includes("complete") || statusStr.includes("success")) {
        mappedStatus = "COMPLETED";
      } else if (statusStr.includes("fail") || statusStr.includes("cancel")) {
        mappedStatus = "FAILED";
      }

      return {
        success: true,
        status: mappedStatus,
        orderId: moogoldOrderId,
        raw: res,
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        status: "FAILED",
        orderId: moogoldOrderId,
        errorMessage: err.message,
      };
    }
  }

  /**
   * 4. Reseller Balance Query
   */
  public async getBalance(): Promise<MooGoldBalanceResult> {
    const creds = await this.getCredentials();

    if (creds.isSandbox) {
      return {
        success: true,
        balance: 1450.75,
        currency: "USD",
        raw: { sandbox: true, balance: "1450.75", currency: "USD" },
      };
    }

    try {
      interface MooGoldBalanceResponse {
        balance?: number | string;
        currency?: string;
        data?: { balance?: number | string; currency?: string };
      }

      const res = await this.postWithRetry<MooGoldBalanceResponse>(
        "user/balance",
        {},
        creds
      );
      const balanceVal = parseFloat(
        String(res.balance || res.data?.balance || "0")
      );

      return {
        success: true,
        balance: balanceVal,
        currency: res.currency || res.data?.currency || "USD",
        raw: res,
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        balance: 0,
        currency: "USD",
        errorMessage: err.message,
      };
    }
  }
}

export const moogold = new MooGoldClient();
