import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";
import { DEFAULT_LANDING_CONFIG, LandingPageConfig, mergeLandingConfig } from "@/lib/landing-config";

// GET: Retrieve current landing page configuration
export async function GET() {
  try {
    const config = await dbService.getLandingConfig();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message, config: DEFAULT_LANDING_CONFIG },
      { status: 500 }
    );
  }
}

// POST: Save updated landing page layout and content configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "ទិន្នន័យកំណត់រចនាសម្ព័ន្ធមិនត្រឹមត្រូវ (Invalid config payload)" },
        { status: 400 }
      );
    }

    const merged = mergeLandingConfig(body as Partial<LandingPageConfig>);
    const saved = await dbService.saveLandingConfig(merged);

    return NextResponse.json({
      success: true,
      config: saved,
      message: "បានរក្សាទុកការកែសម្រួលផ្ទាំងដើមដោយជោគជ័យ!",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Reset configuration to default factory state
export async function DELETE() {
  try {
    const reset = await dbService.resetLandingConfig();
    return NextResponse.json({
      success: true,
      config: reset,
      message: "បានកំណត់ការរៀបចំផ្ទាំងដើមមកកាន់ទម្រង់ដើមវិញរួចរាល់!",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
