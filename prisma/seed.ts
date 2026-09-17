import { PrismaClient } from "@prisma/client";
import { INITIAL_GAMES } from "../lib/catalog-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding games and packages for អាណាចក្រDiamond (Diamond Kingdom)...");

  for (const game of INITIAL_GAMES) {
    const upsertedGame = await prisma.game.upsert({
      where: { slug: game.slug },
      update: {
        name: game.name,
        nameKh: game.nameKh,
        bannerUrl: game.bannerUrl,
        iconUrl: game.iconUrl,
        publisher: game.publisher,
        hasZoneId: game.hasZoneId,
        zoneIdPlaceholder: game.zoneIdPlaceholder,
        userIdPlaceholder: game.userIdPlaceholder,
        isActive: game.isActive,
        sortOrder: game.sortOrder,
      },
      create: {
        id: game.id,
        name: game.name,
        nameKh: game.nameKh,
        slug: game.slug,
        bannerUrl: game.bannerUrl,
        iconUrl: game.iconUrl,
        publisher: game.publisher,
        hasZoneId: game.hasZoneId,
        zoneIdPlaceholder: game.zoneIdPlaceholder,
        userIdPlaceholder: game.userIdPlaceholder,
        isActive: game.isActive,
        sortOrder: game.sortOrder,
      },
    });

    for (const pkg of game.packages) {
      await prisma.package.upsert({
        where: { id: pkg.id },
        update: {
          name: pkg.name,
          diamondsCount: pkg.diamondsCount,
          bonusDiamonds: pkg.bonusDiamonds,
          moogoldProductId: pkg.moogoldProductId,
          moogoldVariationId: pkg.moogoldVariationId,
          originalPriceUSD: pkg.originalPriceUSD,
          sellingPriceUSD: pkg.sellingPriceUSD,
          sellingPriceKHR: pkg.sellingPriceKHR,
          isAvailable: pkg.isAvailable,
          badgeText: pkg.badgeText,
          sortOrder: pkg.sortOrder,
        },
        create: {
          id: pkg.id,
          gameId: upsertedGame.id,
          name: pkg.name,
          diamondsCount: pkg.diamondsCount,
          bonusDiamonds: pkg.bonusDiamonds,
          moogoldProductId: pkg.moogoldProductId,
          moogoldVariationId: pkg.moogoldVariationId,
          originalPriceUSD: pkg.originalPriceUSD,
          sellingPriceUSD: pkg.sellingPriceUSD,
          sellingPriceKHR: pkg.sellingPriceKHR,
          isAvailable: pkg.isAvailable,
          badgeText: pkg.badgeText,
          sortOrder: pkg.sortOrder,
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
