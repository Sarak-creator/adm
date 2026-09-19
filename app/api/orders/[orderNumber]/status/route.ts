import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const order = await dbService.getOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { success: false, errorMessage: "Order not found" },
        { status: 404 }
      );
    }

    // If order is PENDING, check status with ABA PayWay in real-time
    if (order.paymentStatus === "PENDING") {
      try {
        const { checkPaywayTransaction } = await import("@/lib/aba-payway");
        const paywayCheck = await checkPaywayTransaction(order.orderNumber);

        // status 0 or "0" means Approved / Paid
        if (paywayCheck.success && (paywayCheck.status === 0 || paywayCheck.status === "0")) {
          const fulfillResult = await dbService.processPaymentAndFulfill(order.orderNumber);
          if (fulfillResult.order) {
            order.paymentStatus = fulfillResult.order.paymentStatus;
            order.fulfillmentStatus = fulfillResult.order.fulfillmentStatus;
            order.moogoldOrderId = fulfillResult.order.moogoldOrderId;
            order.paidAt = fulfillResult.order.paidAt;
            order.completedAt = fulfillResult.order.completedAt;
          }
        }
      } catch (checkErr) {
        console.warn("ABA PayWay status check error:", checkErr);
      }
    }

    // Check if expired
    if (order.paymentStatus === "PENDING" && order.qrExpiresAt) {
      const now = new Date();
      if (now > new Date(order.qrExpiresAt)) {
        order.paymentStatus = "EXPIRED";
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        gameName: order.gameName,
        packageName: order.packageName,
        diamondsCount: order.diamondsCount,
        inGameUserId: order.inGameUserId,
        inGameZoneId: order.inGameZoneId,
        inGameNickname: order.inGameNickname,
        amountUSD: order.amountUSD,
        amountKHR: order.amountKHR,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        moogoldOrderId: order.moogoldOrderId,
        failureReason: order.failureReason,
        paidAt: order.paidAt?.toISOString(),
        completedAt: order.completedAt?.toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, errorMessage: err.message },
      { status: 500 }
    );
  }
}
