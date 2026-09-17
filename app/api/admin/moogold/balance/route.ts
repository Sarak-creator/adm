import { NextResponse } from "next/server";
import { moogold } from "@/lib/moogold";

export async function GET() {
  try {
    const result = await moogold.getBalance();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, balance: 0, currency: "USD", errorMessage: err.message },
      { status: 500 }
    );
  }
}
