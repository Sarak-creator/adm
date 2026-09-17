import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";
import { setConfig, getAllMaskedSettings, deleteConfig } from "@/lib/config-service";

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await verifyAdminToken(token);
  return Boolean(payload && payload.role === "ADMIN");
}

export async function GET(req: NextRequest) {
  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAllMaskedSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { key, value, isEncrypted, description } = body || {};

    if (!key || typeof key !== "string") {
      return NextResponse.json({ success: false, error: "Setting key is required" }, { status: 400 });
    }

    const saved = await setConfig(key.trim(), String(value ?? ""), Boolean(isEncrypted), description);

    return NextResponse.json({
      success: true,
      message: `បានរក្សាទុក ${key} ដោយជោគជ័យ!`,
      setting: {
        id: saved.id,
        key: saved.key,
        isEncrypted: saved.isEncrypted,
        description: saved.description,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ success: false, error: "Key parameter is required" }, { status: 400 });
  }

  await deleteConfig(key);
  return NextResponse.json({ success: true, message: `បានលុប ${key} រួចរាល់!` });
}
