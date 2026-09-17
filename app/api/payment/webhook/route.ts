import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const signature = req.headers.get("x-bakong-signature") || req.headers.get("authorization");

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract order number from webhook payload
  // Bakong / payment gateways usually pass external reference or bill number in payload
  let orderNumber = "";
  if (typeof payload.orderNumber === "string") {
    orderNumber = payload.orderNumber;
  } else if (typeof payload.externalRef === "string") {
    orderNumber = payload.externalRef;
  } else if (typeof payload.billNumber === "string") {
    orderNumber = payload.billNumber;
  } else if (typeof payload.bill_number === "string") {
    orderNumber = payload.bill_number;
  } else if (
    typeof payload.data === "object" &&
    payload.data !== null &&
    typeof (payload.data as Record<string, unknown>).orderNumber === "string"
  ) {
    orderNumber = (payload.data as Record<string, unknown>).orderNumber as string;
  }
  orderNumber = orderNumber.trim();

  if (!orderNumber) {
    await dbService.logWebhook({
      payload,
      status: "REJECTED_MISSING_ORDER_NUMBER",
      signature: signature || undefined,
      ip,
    });
    return NextResponse.json(
      { error: "Missing orderNumber or externalRef" },
      { status: 400 }
    );
  }

  // Record incoming webhook
  await dbService.logWebhook({
    orderId: orderNumber,
    payload,
    status: "RECEIVED",
    signature: signature || undefined,
    ip,
  });

  try {
    const order = await dbService.getOrderByNumber(orderNumber);
    if (!order) {
      await dbService.logWebhook({
        orderId: orderNumber,
        payload,
        status: "ORDER_NOT_FOUND",
        ip,
      });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Guard against race conditions & double-spend
    if (order.paymentStatus === "PAID" && order.fulfillmentStatus === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Order already completed and fulfilled",
        orderNumber,
      });
    }

    // Process payment status and immediately fulfill with MooGold
    const fulfillmentResult = await dbService.processPaymentAndFulfill(orderNumber);

    if (fulfillmentResult.success) {
      return NextResponse.json({
        success: true,
        message: "Payment verified and diamonds successfully delivered via MooGold",
        orderNumber,
        fulfillmentStatus: "COMPLETED",
        moogoldOrderId: fulfillmentResult.order.moogoldOrderId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Payment received, but automated MooGold fulfillment failed - queued for admin retry",
          orderNumber,
          fulfillmentStatus: "FAILED",
          error: fulfillmentResult.error,
        },
        { status: 200 } // Return 200 to acknowledge payment received by webhook provider
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    await dbService.logWebhook({
      orderId: orderNumber,
      payload,
      status: `ERROR: ${err.message}`,
      ip,
    });

    return NextResponse.json(
      { error: "Internal processing error", message: err.message },
      { status: 500 }
    );
  }
}
