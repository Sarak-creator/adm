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

    const { gameSlug, packageId, inGameUserId, inGameZoneId, inGameNickname, currency } =
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

    // 3. Generate dynamic Bakong KHQR payload with 5-minute countdown
    const khqrResult = await createDynamicKHQR({
      orderNumber,
      amountUSD: packageItem.sellingPriceUSD,
      amountKHR: packageItem.sellingPriceKHR,
      currency,
      expiresInMinutes: 5,
    });

    // 4. Save Pending Order to Database
    const order = await dbService.createOrder({
      orderNumber,
      game,
      packageItem,
      inGameUserId,
      inGameZoneId,
      inGameNickname,
      qrCodeString: khqrResult.qrString,
      qrCodeDataUrl: khqrResult.qrDataUrl,
      qrExpiresAt: khqrResult.expiresAt,
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
        qrCodeString: khqrResult.qrString,
        qrCodeDataUrl: khqrResult.qrDataUrl,
        qrExpiresAt: khqrResult.expiresAt.toISOString(),
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
