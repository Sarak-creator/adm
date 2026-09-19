import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbService } from "@/lib/db-service";
import { createDynamicKHQR } from "@/lib/bakong";
import { generateOrderNumber } from "@/lib/utils";

const createOrderSchema = z.object({
  gameSlug: z.string().min(1),
  packageId: z.string().min(1),
  inGameUserId: z.string().min(1, "សូមបញ្ចូល User ID"),
  inGameZoneId: z.string().optional().nullable(),
  inGameNickname: z.string().optional().nullable(),
  currency: z.enum(["USD", "KHR"]).default("USD"),
  paymentMethod: z.enum(["ABA", "BAKONG"]).default("ABA"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = createOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          errorMessage: parseResult.error.errors[0]?.message || "Invalid payload",
        },
        { status: 400 }
      );
    }

    const { gameSlug, packageId, inGameUserId, inGameZoneId, inGameNickname, currency, paymentMethod } =
      parseResult.data;

    // 1. Verify Game and Package exist in cached DB
    const game = await dbService.getGameBySlug(gameSlug);
    if (!game) {
      return NextResponse.json(
        { success: false, errorMessage: "រកមិនឃើញទិន្នន័យហ្គេម (Game Not Found)" },
        { status: 404 }
      );
    }

    const packageItem = game.packages.find((p) => p.id === packageId);
    if (!packageItem || !packageItem.isAvailable) {
      return NextResponse.json(
        { success: false, errorMessage: "កញ្ចប់ពេជ្រនេះមិនមានលក់ទេ (Package Unavailable)" },
        { status: 404 }
      );
    }

    // 2. Generate Unique Order Number
    const orderNumber = generateOrderNumber();

    // 3. Generate QR based on chosen paymentMethod
    let qrCodeString = "";
    let qrCodeDataUrl = "";
    let abapayDeeplink: string | undefined;
    let appCheckoutUrl: string | undefined;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (paymentMethod === "ABA") {
      try {
        const { createPaywayPurchase } = await import("@/lib/aba-payway");
        const paywayRes = await createPaywayPurchase({
          orderNumber,
          amountUSD: packageItem.sellingPriceUSD,
          items: [
            {
              name: `${game.name} - ${packageItem.name}`,
              quantity: 1,
              price: packageItem.sellingPriceUSD,
            },
          ],
        });

        if (paywayRes.success && paywayRes.qrString) {
          qrCodeString = paywayRes.qrString;
          qrCodeDataUrl = paywayRes.qrImage || "";
          abapayDeeplink = paywayRes.abapayDeeplink;
          appCheckoutUrl = paywayRes.appCheckoutUrl;
        }
      } catch (abaErr) {
        console.warn("ABA PayWay call failed, falling back to local Bakong KHQR:", abaErr);
      }
    }

    // If Bakong chosen or ABA PayWay fallback triggered:
    if (!qrCodeString || !qrCodeDataUrl) {
      const khqrResult = await createDynamicKHQR({
        orderNumber,
        amountUSD: packageItem.sellingPriceUSD,
        amountKHR: packageItem.sellingPriceKHR,
        currency,
        expiresInMinutes: 5,
      });
      qrCodeString = khqrResult.qrString;
      qrCodeDataUrl = khqrResult.qrDataUrl;
    }

    // 4. Save Pending Order to Database
    const order = await dbService.createOrder({
      orderNumber,
      game,
      packageItem,
      inGameUserId,
      inGameZoneId,
      inGameNickname,
      qrCodeString,
      qrCodeDataUrl,
      qrExpiresAt: expiresAt,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        gameName: order.gameName,
        packageName: order.packageName,
        diamondsCount: order.diamondsCount,
        inGameUserId: order.inGameUserId,
        inGameZoneId: order.inGameZoneId,
        inGameNickname: order.inGameNickname,
        amountUSD: order.amountUSD,
        amountKHR: order.amountKHR,
        currency,
        displayAmount: currency === "USD" ? order.amountUSD : order.amountKHR,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        qrCodeString,
        qrCodeDataUrl,
        qrExpiresAt: expiresAt.toISOString(),
        abapayDeeplink,
        appCheckoutUrl,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        errorMessage: err.message || "បរាជ័យក្នុងការបង្កើតការបញ្ជាទិញ (Failed to create order)",
      },
      { status: 500 }
    );
  }
}
