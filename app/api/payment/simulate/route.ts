import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export async function POST(req: NextRequest) {
  try {
    const { orderNumber } = await req.json();
    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Missing orderNumber" }, { status: 400 });
    }

    const order = await dbService.getOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Call webhook fulfillment logic internally
    const result = await dbService.processPaymentAndFulfill(orderNumber);

    return NextResponse.json({
      success: true,
      message: "Simulated payment successful! MooGold fulfillment executed.",
      order: result.order,
      fulfillmentResult: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
