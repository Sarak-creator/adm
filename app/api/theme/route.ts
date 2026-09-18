import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth-edge";

// GET: Public endpoint to get the current global site theme mode
export async function GET() {
  try {
    const themeMode = await dbService.getThemeMode();
    return NextResponse.json(
      { success: true, themeMode },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message, themeMode: "dark" },
      { status: 500 }
    );
  }
}

// POST: Admin-only endpoint to change the theme mode
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Token (Only Admin can set dark or light mode)
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(token);

    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "សិទ្ធិមិនគ្រប់គ្រាន់: មានតែអ្នកគ្រប់គ្រង (Admin) ប៉ុណ្ណោះដែលអាចប្តូរ Dark/Light Mode បាន!",
        },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const mode = body?.themeMode === "light" ? "light" : "dark";

    // 3. Persist new theme mode
    const updatedMode = await dbService.setThemeMode(mode);

    return NextResponse.json({
      success: true,
      themeMode: updatedMode,
      message:
        updatedMode === "light"
          ? "បានប្តូរទៅ របៀបពន្លឺ (Light Mode) ជោគជ័យ!"
          : "បានប្តូរទៅ របៀបងងឹត (Dark Mode) ជោគជ័យ!",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
