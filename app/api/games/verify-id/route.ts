import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { moogold } from "@/lib/moogold";

const verifyIdSchema = z.object({
  gameSlug: z.string().min(1, "Game slug is required"),
  userId: z.string().min(1, "សូមបញ្ចូល User ID / Player ID"),
  zoneId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = verifyIdSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "ទិន្នន័យមិនត្រឹមត្រូវ";
      return NextResponse.json(
        { success: false, errorMessage: errorMsg },
        { status: 400 }
      );
    }

    const { gameSlug, userId, zoneId } = parseResult.data;

    const result = await moogold.validatePlayerId(
      gameSlug,
      userId,
      zoneId || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errorMessage: result.errorMessage || "រកមិនឃើញគណនីហ្គេមនេះទេ (Player Not Found)",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      inGameName: result.inGameName,
      userId,
      zoneId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        errorMessage: err.message || "មានបញ្ហាបច្ចេកទេសក្នុងការផ្ទៀងផ្ទាត់គណនី",
      },
      { status: 500 }
    );
  }
}
