import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

export async function POST(req: NextRequest) {
  try {
    const { orderNumber } = await req.json();
    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Missing orderNumber" }, { status: 400 });
    }

    const result = await dbService.retryFulfillment(orderNumber);

    return NextResponse.json({
      success: result.success,
      order: result.order,
      error: result.error,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
