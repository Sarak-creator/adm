import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";
import { getConfig } from "@/lib/config-service";
import { generatePaywayHash, getPaywayReqTime } from "@/lib/aba-payway";

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await verifyAdminToken(token);
  return Boolean(payload && payload.role === "ADMIN");
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const merchantId =
      body.merchantId ||
      (await getConfig("ABA_PAYWAY_MERCHANT_ID")) ||
      process.env.ABA_PAYWAY_MERCHANT_ID ||
      "ec478611";
    const apiKey =
      body.apiKey ||
      (await getConfig("ABA_PAYWAY_API_KEY")) ||
      process.env.ABA_PAYWAY_API_KEY ||
      "743F9E262F9673DE1809CCE505BB4A4E6F15E7A6";
    const apiUrl =
      body.apiUrl ||
      (await getConfig("ABA_PAYWAY_API_URL")) ||
      process.env.ABA_PAYWAY_API_URL ||
      "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

    if (!merchantId || !apiKey) {
      return NextResponse.json({
        success: false,
        message: "ខ្វះ Merchant ID ឬ API Key",
      });
    }

    const testTranId = `TEST${Date.now().toString().slice(-8)}`;
    const reqTime = getPaywayReqTime();
    const amountStr = "1.00";
    const itemsBase64 = Buffer.from(
      JSON.stringify([{ name: "Test Item", quantity: 1, price: 1.0 }])
    ).toString("base64");
    const returnUrlBase64 = Buffer.from("https://anajakdiamond.com").toString("base64");

    const hash = generatePaywayHash(apiKey, {
      req_time: reqTime,
      merchant_id: merchantId,
      tran_id: testTranId,
      amount: amountStr,
      items: itemsBase64,
      shipping: "",
      firstname: "Test",
      lastname: "Admin",
      email: "test@anajakdiamond.com",
      phone: "012345678",
      type: "purchase",
      payment_option: "abapay_khqr",
      return_url: returnUrlBase64,
      cancel_url: returnUrlBase64,
      continue_success_url: "",
      return_deeplink: "",
      currency: "USD",
      custom_fields: "",
      return_params: "",
      payout: "",
      lifetime: "5",
      additional_params: "",
      google_pay_token: "",
      skip_success_page: "1",
    });

    const formData = new URLSearchParams();
    formData.append("req_time", reqTime);
    formData.append("merchant_id", merchantId);
    formData.append("tran_id", testTranId);
    formData.append("amount", amountStr);
    formData.append("items", itemsBase64);
    formData.append("firstname", "Test");
    formData.append("lastname", "Admin");
    formData.append("email", "test@anajakdiamond.com");
    formData.append("phone", "012345678");
    formData.append("type", "purchase");
    formData.append("payment_option", "abapay_khqr");
    formData.append("return_url", returnUrlBase64);
    formData.append("cancel_url", returnUrlBase64);
    formData.append("currency", "USD");
    formData.append("lifetime", "5");
    formData.append("skip_success_page", "1");
    formData.append("hash", hash);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status?.code === "00" || data.status?.code === 0 || data.code === "00" || data.code === 0) {
      const isLive = apiUrl.includes("checkout.payway.com.kh") && !apiUrl.includes("checkout-sandbox");
      return NextResponse.json({
        success: true,
        message: `ការតភ្ជាប់ជោគជ័យ 100%! ABA PayWay បានឆ្លើយតបកូដ "00" (Success)។ កំពុងស្ថិតក្នុងរបៀប: ${isLive ? "🔴 Live (Production)" : "🟢 Sandbox (Testing)"}`,
        mode: isLive ? "LIVE" : "SANDBOX",
        qrString: data.qrString || data.data?.qrString,
        tranId: testTranId,
      });
    }

    const errMsg =
      data.description ||
      data.status?.message ||
      data.message ||
      "បរាជ័យក្នុងការផ្ទៀងផ្ទាត់ ABA PayWay Credentials";

    return NextResponse.json({
      success: false,
      message: `ABA PayWay Error: ${errMsg}`,
      raw: data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({
      success: false,
      message: `Network Error: ${err.message}`,
    });
  }
}
