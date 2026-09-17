import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all packages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");

    const packages = await prisma.package.findMany({
      where: gameId ? { gameId } : undefined,
      include: {
        game: {
          select: { id: true, name: true, nameKh: true, slug: true },
        },
      },
      orderBy: [{ gameId: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ success: true, packages });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Insert a new diamond Package into Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gameId,
      name,
      diamondsCount,
      bonusDiamonds,
      moogoldProductId,
      moogoldVariationId,
      originalPriceUSD,
      sellingPriceUSD,
      sellingPriceKHR,
      isAvailable,
      badgeText,
      sortOrder,
    } = body;

    if (!gameId || !name || diamondsCount === undefined || !sellingPriceUSD) {
      return NextResponse.json(
        { success: false, error: "សូមជ្រើសរើសហ្គេម បញ្ចូលឈ្មោះកញ្ចប់ ចំនួនពេជ្រ និងតម្លៃ" },
        { status: 400 }
      );
    }

    // Default KHR calculation if missing (exchange rate 4100)
    const khrPrice = sellingPriceKHR
      ? Number(sellingPriceKHR)
      : Math.round(Number(sellingPriceUSD) * 4100);

    const newPackage = await prisma.package.create({
      data: {
        gameId,
        name,
        diamondsCount: Number(diamondsCount),
        bonusDiamonds: Number(bonusDiamonds) || 0,
        moogoldProductId: moogoldProductId ? String(moogoldProductId) : "13",
        moogoldVariationId: moogoldVariationId ? String(moogoldVariationId) : "1001",
        originalPriceUSD: Number(originalPriceUSD) || Number(sellingPriceUSD),
        sellingPriceUSD: Number(sellingPriceUSD),
        sellingPriceKHR: khrPrice,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        badgeText: badgeText || null,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, package: newPackage }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing Package in Supabase
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      diamondsCount,
      bonusDiamonds,
      moogoldProductId,
      moogoldVariationId,
      originalPriceUSD,
      sellingPriceUSD,
      sellingPriceKHR,
      isAvailable,
      badgeText,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Package ID" }, { status: 400 });
    }

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(diamondsCount !== undefined && { diamondsCount: Number(diamondsCount) }),
        ...(bonusDiamonds !== undefined && { bonusDiamonds: Number(bonusDiamonds) }),
        ...(moogoldProductId !== undefined && { moogoldProductId: String(moogoldProductId) }),
        ...(moogoldVariationId !== undefined && { moogoldVariationId: String(moogoldVariationId) }),
        ...(originalPriceUSD !== undefined && { originalPriceUSD: Number(originalPriceUSD) }),
        ...(sellingPriceUSD !== undefined && { sellingPriceUSD: Number(sellingPriceUSD) }),
        ...(sellingPriceKHR !== undefined && { sellingPriceKHR: Number(sellingPriceKHR) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        badgeText: badgeText !== undefined ? badgeText : undefined,
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json({ success: true, package: updatedPackage });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a Package from Supabase
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Package ID" }, { status: 400 });
    }

    // Check if there are orders referencing this package
    const ordersCount = await prisma.order.count({
      where: { packageId: id },
    });

    if (ordersCount > 0) {
      // If orders exist, deactivate to preserve order history
      await prisma.package.update({
        where: { id },
        data: { isAvailable: false },
      });
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `កញ្ចប់ពេជ្រនេះមានប្រវត្តិកុម្ម៉ង់ ${ordersCount} លើក ដូច្នេះត្រូវបានបិទការលក់ (isAvailable: false) ដើម្បីរក្សាប្រវត្តិទិន្នន័យ`,
      });
    }

    // Safe to hard delete
    await prisma.package.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "លុបកញ្ចប់ពេជ្រដោយជោគជ័យ" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
