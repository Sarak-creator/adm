import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaywayPurchase } from "@/lib/aba-payway";

const paywayCreateSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  firstname: z.string().optional().default("Customer"),
  lastname: z.string().optional().default("Diamond"),
  email: z.string().email().optional().default("support@anajakdiamond.com"),
  phone: z.string().optional().default("012345678"),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().default(1),
        price: z.number(),
      })
    )
    .optional(),
  returnUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = paywayCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid payload",
        },
        { status: 400 }
      );
    }

    const { orderNumber, amount, firstname, lastname, email, phone, items, returnUrl, cancelUrl } =
      parseResult.data;

    const result = await createPaywayPurchase({
      orderNumber,
      amountUSD: amount,
      firstname,
      lastname,
      email,
      phone,
      items,
      returnUrl,
      cancelUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || "Failed to create ABA PayWay purchase",
          raw: result.raw,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tranId: result.tranId,
      qrString: result.qrString,
      qrImage: result.qrImage,
      abapayDeeplink: result.abapayDeeplink,
      appCheckoutUrl: result.appCheckoutUrl,
      status: "PENDING",
      purchaseEndpoint:
        process.env.ABA_PAYWAY_API_URL ||
        "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal server error creating ABA PayWay transaction",
      },
      { status: 500 }
    );
  }
}
