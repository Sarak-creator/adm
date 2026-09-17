import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await dbService.getAllOrders();
    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update Order payment or fulfillment status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, paymentStatus, fulfillmentStatus, failureReason } = body;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Missing orderNumber" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { orderNumber },
      data: {
        ...(paymentStatus && { paymentStatus }),
        ...(fulfillmentStatus && { fulfillmentStatus }),
        ...(failureReason !== undefined && { failureReason }),
        ...(paymentStatus === "PAID" && { paidAt: new Date() }),
        ...(fulfillmentStatus === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete Order
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Missing orderNumber" }, { status: 400 });
    }

    await prisma.order.delete({
      where: { orderNumber },
    });

    return NextResponse.json({ success: true, message: "លុប Order ដោយជោគជ័យ" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
