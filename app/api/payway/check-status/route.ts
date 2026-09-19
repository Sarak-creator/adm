import { NextRequest, NextResponse } from "next/server";
import { checkPaywayTransaction } from "@/lib/aba-payway";
import { dbService } from "@/lib/db-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tranId = body.tranId || body.tran_id || body.orderNumber;

    if (!tranId || typeof tranId !== "string") {
      return NextResponse.json(
        { success: false, error: "សូមបញ្ជាក់លេខ Tran ID (tranId is required)" },
        { status: 400 }
      );
    }

    // Call ABA PayWay check-transaction-2 API
    const checkResult = await checkPaywayTransaction(tranId);

    if (!checkResult.success) {
      return NextResponse.json(
        {
          success: false,
          paid: false,
          message: checkResult.errorMessage || "រកមិនឃើញទិន្នន័យប្រតិបត្តិការនេះទេ",
          raw: checkResult.raw,
        },
        { status: 400 }
      );
    }

    // Status 0 represents APPROVED / PAID in PayWay v1 & v2
    const isApproved =
      checkResult.status === 0 ||
      checkResult.status === "0" ||
      (checkResult.raw as { data?: { payment_status?: string } })?.data?.payment_status === "APPROVED";

    if (isApproved) {
      // Look up order by number and trigger MooGold fulfillment
      let order = await dbService.getOrderByNumber(tranId);

      // If tranId has prefix or truncation, search order
      if (!order) {
        // Try searching in memory or DB
        const allOrders = await dbService.getAllOrders();
        const match = allOrders.find(
          (o: { orderNumber: string }) =>
            o.orderNumber === tranId ||
            o.orderNumber.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) === tranId
        );
        if (match) {
          order = match;
        }
      }

      if (order && order.paymentStatus !== "PAID") {
        try {
          const fulfillment = await dbService.processPaymentAndFulfill(order.orderNumber);
          if (fulfillment.order) {
            order = fulfillment.order;
          }
        } catch (fulfillErr) {
          console.error("MooGold automated fulfillment error:", fulfillErr);
        }
      }

      return NextResponse.json({
        success: true,
        paid: true,
        paymentStatus: "APPROVED",
        message: "ការបង់ប្រាក់ទទួលបានជោគជ័យ! (Payment Approved)",
        orderNumber: order?.orderNumber || tranId,
        fulfillmentStatus: order?.fulfillmentStatus || "PROCESSING",
        data: checkResult.raw,
      });
    }

    // If still pending
    const paymentStatusDesc =
      (checkResult.raw as { data?: { payment_status?: string } })?.data?.payment_status || "PENDING";

    return NextResponse.json({
      success: true,
      paid: false,
      paymentStatus: paymentStatusDesc,
      message: "ប្រតិបត្តិការកំពុងរង់ចាំការទូទាត់ (Pending payment)",
      data: checkResult.raw,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal server error checking transaction status",
      },
      { status: 500 }
    );
  }
}
