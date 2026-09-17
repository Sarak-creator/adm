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
