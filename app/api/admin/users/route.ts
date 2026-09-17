import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/crypto";

/**
 * GET: List all admin users from Supabase
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(sessionToken);

    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorPin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Mask the 2FA pin so only last 2 digits show or return boolean
    const sanitized = adminUsers.map((u) => ({
      id: u.id,
      username: u.username || "admin",
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      twoFactorPin: u.twoFactorPin ? `••••${u.twoFactorPin.slice(-2)}` : null,
      has2FA: Boolean(u.twoFactorPin),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({ success: true, users: sanitized });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Create or Update an admin user in Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(sessionToken);

    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, username, email, name, password, twoFactorPin, isActive } = body || {};

    if (!id && (!username || !password)) {
      return NextResponse.json(
        { success: false, error: "សូមបញ្ចូល Username និង Password (Username and Password are required)" },
        { status: 400 }
      );
    }

    const cleanUsername = username?.trim().toLowerCase();

    // UPDATE EXISTING ADMIN USER
    if (id) {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (cleanUsername) updateData.username = cleanUsername;
      if (email !== undefined) updateData.email = email ? email.trim() : null;
      if (name !== undefined) updateData.name = name ? name.trim() : null;
      if (typeof isActive === "boolean") updateData.isActive = isActive;
      if (password && password.trim()) {
        updateData.passwordHash = hashPassword(password.trim());
      }
      if (twoFactorPin !== undefined && !twoFactorPin.includes("•")) {
        updateData.twoFactorPin = twoFactorPin ? twoFactorPin.trim() : null;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `បានកែប្រែព័ត៌មាន Admin "${updated.username}" ដោយជោគជ័យ!`,
        user: {
          id: updated.id,
          username: updated.username,
          email: updated.email,
          name: updated.name,
        },
      });
    }

    // CREATE NEW ADMIN USER
    // Check if username already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: "insensitive" as const } },
          ...(email ? [{ email: { equals: email.trim(), mode: "insensitive" as const } }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username ឬ Email នេះមានរួចហើយក្នុងប្រព័ន្ធ!" },
        { status: 400 }
      );
    }

    const newAdmin = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: email ? email.trim() : null,
        name: name ? name.trim() : "Admin User",
        passwordHash: hashPassword(password.trim()),
        twoFactorPin: twoFactorPin ? twoFactorPin.trim() : "982100",
        role: "ADMIN",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `បានបង្កើត Admin User "${newAdmin.username}" ក្នុង Supabase ដោយជោគជ័យ!`,
      user: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Delete or deactivate an admin user from Supabase
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const payload = await verifyAdminToken(sessionToken);

    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing admin user id" }, { status: 400 });
    }

    // Check count of admin users
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { success: false, error: "មិនអាចលុប Admin ចុងក្រោយគេបានទេ! ត្រូវរក្សាទុកយ៉ាងហោច ១ គណនី។" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "បានលុប Admin User ចេញពី Supabase ដោយជោគជ័យ!",
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
