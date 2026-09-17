import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all games with packages from Supabase
export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        packages: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      games: games.map((g) => ({
        ...g,
        orderCount: g._count.orders,
      })),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Insert a new Game into Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      nameKh,
      slug,
      bannerUrl,
      iconUrl,
      publisher,
      hasZoneId,
      zoneIdPlaceholder,
      userIdPlaceholder,
      isActive,
      sortOrder,
    } = body;

    if (!name || !slug || !bannerUrl || !iconUrl) {
      return NextResponse.json(
        { success: false, error: "សូមបំពេញឈ្មោះហ្គេម, Slug, Banner URL, និង Icon URL" },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await prisma.game.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Slug "${slug}" មានរួចហើយ សូមជ្រើសរើស Slug ផ្សេង` },
        { status: 400 }
      );
    }

    const newGame = await prisma.game.create({
      data: {
        name,
        nameKh: nameKh || null,
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
        bannerUrl,
        iconUrl,
        publisher: publisher || null,
        hasZoneId: Boolean(hasZoneId),
        zoneIdPlaceholder: zoneIdPlaceholder || "Zone ID",
        userIdPlaceholder: userIdPlaceholder || "User ID",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, game: newGame }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing Game in Supabase
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      nameKh,
      slug,
      bannerUrl,
      iconUrl,
      publisher,
      hasZoneId,
      zoneIdPlaceholder,
      userIdPlaceholder,
      isActive,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Game ID" }, { status: 400 });
    }

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        ...(name && { name }),
        nameKh: nameKh !== undefined ? nameKh : undefined,
        ...(slug && { slug: slug.toLowerCase().trim().replace(/\s+/g, "-") }),
        ...(bannerUrl && { bannerUrl }),
        ...(iconUrl && { iconUrl }),
        publisher: publisher !== undefined ? publisher : undefined,
        hasZoneId: hasZoneId !== undefined ? Boolean(hasZoneId) : undefined,
        zoneIdPlaceholder: zoneIdPlaceholder !== undefined ? zoneIdPlaceholder : undefined,
        userIdPlaceholder: userIdPlaceholder !== undefined ? userIdPlaceholder : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    return NextResponse.json({ success: true, game: updatedGame });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a Game from Supabase
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Game ID" }, { status: 400 });
    }

    // Check if there are orders referencing this game
    const ordersCount = await prisma.order.count({
      where: { gameId: id },
    });

    if (ordersCount > 0) {
      // Instead of failing foreign key constraint, deactivate the game
      await prisma.game.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `ហ្គេមនេះមានប្រវត្តិកុម្ម៉ង់ ${ordersCount} លើក ដូច្នេះត្រូវបានបិទដំណើរការ (Deactivated) ដើម្បីរក្សាប្រវត្តិទិន្នន័យ`,
      });
    }

    // Otherwise safe to hard delete
    await prisma.game.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "លុបហ្គេមដោយជោគជ័យ" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
