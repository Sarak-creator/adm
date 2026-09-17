import { prisma } from "./prisma";
import { INITIAL_GAMES, GameData, PackageData } from "./catalog-data";
import { moogold } from "./moogold";
import {
  LandingPageConfig,
  mergeLandingConfig,
  DEFAULT_LANDING_CONFIG,
} from "./landing-config";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string | null;
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  diamondsCount: number;
  inGameUserId: string;
  inGameZoneId?: string | null;
  inGameNickname?: string | null;
  amountUSD: number;
  amountKHR: number;
  paymentMethod: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  fulfillmentStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  moogoldOrderId?: string | null;
  moogoldResponse?: unknown;
  failureReason?: string | null;
  qrCodeString?: string | null;
  qrCodeDataUrl?: string | null;
  qrExpiresAt?: Date | null;
  paidAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory runtime store for development or when PostgreSQL connection is unavailable
const memoryOrders = new Map<string, OrderRecord>();
const memoryWebhookLogs: Array<{ id: string; orderId?: string; payload: unknown; status: string; createdAt: Date }> = [];
let memoryLandingConfig: LandingPageConfig = DEFAULT_LANDING_CONFIG;

export class DatabaseService {
  /**
   * Retrieves all active games with their packages
   */
  public async getGames(): Promise<GameData[]> {
    try {
      const dbGames = await prisma.game.findMany({
        where: { isActive: true },
        include: {
          packages: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      if (dbGames && dbGames.length > 0) {
        return dbGames.map((g) => ({
          id: g.id,
          name: g.name,
          nameKh: g.nameKh || g.name,
          slug: g.slug,
          bannerUrl: g.bannerUrl,
          iconUrl: g.iconUrl,
          publisher: g.publisher || "",
          hasZoneId: g.hasZoneId,
          zoneIdPlaceholder: g.zoneIdPlaceholder || "",
          userIdPlaceholder: g.userIdPlaceholder || "",
          guideTextKh: "សូមពិនិត្យមើល ID ក្នុងហ្គេមរបស់អ្នក",
          guideTextEn: "Check your in-game profile for your ID",
          isActive: g.isActive,
          sortOrder: g.sortOrder,
          packages: g.packages.map((p) => ({
            id: p.id,
            gameId: p.gameId,
            name: p.name,
            diamondsCount: p.diamondsCount,
            bonusDiamonds: p.bonusDiamonds,
            moogoldProductId: p.moogoldProductId,
            moogoldVariationId: p.moogoldVariationId,
            originalPriceUSD: Number(p.originalPriceUSD),
            sellingPriceUSD: Number(p.sellingPriceUSD),
            sellingPriceKHR: Number(p.sellingPriceKHR),
            isAvailable: p.isAvailable,
            badgeText: p.badgeText || undefined,
            sortOrder: p.sortOrder,
          })),
        }));
      }
    } catch {
      // Fallback to cached catalog data
    }
    return INITIAL_GAMES;
  }

  /**
   * Get single game by slug
   */
  public async getGameBySlug(slug: string): Promise<GameData | null> {
    try {
      const dbGame = await prisma.game.findUnique({
        where: { slug },
        include: {
          packages: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (dbGame) {
        return {
          id: dbGame.id,
          name: dbGame.name,
          nameKh: dbGame.nameKh || dbGame.name,
          slug: dbGame.slug,
          bannerUrl: dbGame.bannerUrl,
          iconUrl: dbGame.iconUrl,
          publisher: dbGame.publisher || "",
          hasZoneId: dbGame.hasZoneId,
          zoneIdPlaceholder: dbGame.zoneIdPlaceholder || "",
          userIdPlaceholder: dbGame.userIdPlaceholder || "",
          guideTextKh: "សូមពិនិត្យមើល ID ក្នុងហ្គេមរបស់អ្នក",
          guideTextEn: "Check your in-game profile for your ID",
          isActive: dbGame.isActive,
          sortOrder: dbGame.sortOrder,
          packages: dbGame.packages.map((p) => ({
            id: p.id,
            gameId: p.gameId,
            name: p.name,
            diamondsCount: p.diamondsCount,
            bonusDiamonds: p.bonusDiamonds,
            moogoldProductId: p.moogoldProductId,
            moogoldVariationId: p.moogoldVariationId,
            originalPriceUSD: Number(p.originalPriceUSD),
            sellingPriceUSD: Number(p.sellingPriceUSD),
            sellingPriceKHR: Number(p.sellingPriceKHR),
            isAvailable: p.isAvailable,
            badgeText: p.badgeText || undefined,
            sortOrder: p.sortOrder,
          })),
        };
      }
    } catch {
      // Fallback
    }

    const fallback = INITIAL_GAMES.find((g) => g.slug === slug);
    return fallback || null;
  }

  /**
   * Find package by ID - pulls directly from Supabase DB
   */
  public async getPackageById(packageId: string): Promise<PackageData | null> {
    try {
      const dbPkg = await prisma.package.findUnique({
        where: { id: packageId },
      });
      if (dbPkg) {
        return {
          id: dbPkg.id,
          gameId: dbPkg.gameId,
          name: dbPkg.name,
          diamondsCount: dbPkg.diamondsCount,
          bonusDiamonds: dbPkg.bonusDiamonds,
          moogoldProductId: dbPkg.moogoldProductId,
          moogoldVariationId: dbPkg.moogoldVariationId,
          originalPriceUSD: Number(dbPkg.originalPriceUSD),
          sellingPriceUSD: Number(dbPkg.sellingPriceUSD),
          sellingPriceKHR: Number(dbPkg.sellingPriceKHR),
          isAvailable: dbPkg.isAvailable,
          badgeText: dbPkg.badgeText || undefined,
          sortOrder: dbPkg.sortOrder,
        };
      }
    } catch (e) {
      console.warn("Could not query package from Supabase, checking fallback:", e);
    }

    for (const game of INITIAL_GAMES) {
      const pkg = game.packages.find((p) => p.id === packageId);
      if (pkg) return pkg;
    }
    return null;
  }

  /**
   * Create new pending order
   */
  public async createOrder(data: {
    orderNumber: string;
    game: GameData;
    packageItem: PackageData;
    inGameUserId: string;
    inGameZoneId?: string | null;
    inGameNickname?: string | null;
    qrCodeString?: string;
    qrCodeDataUrl?: string;
    qrExpiresAt?: Date;
  }): Promise<OrderRecord> {
    let createdRecordId = `ord_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Create directly in Supabase PostgreSQL
    try {
      const dbOrder = await prisma.order.create({
        data: {
          orderNumber: data.orderNumber,
          gameId: data.game.id,
          packageId: data.packageItem.id,
          inGameUserId: data.inGameUserId,
          inGameZoneId: data.inGameZoneId,
          inGameNickname: data.inGameNickname,
          amountUSD: data.packageItem.sellingPriceUSD,
          amountKHR: data.packageItem.sellingPriceKHR,
          paymentMethod: "KHQR",
          paymentStatus: "PENDING",
          fulfillmentStatus: "PENDING",
          qrCodeString: data.qrCodeString,
          qrExpiresAt: data.qrExpiresAt,
        },
      });
      createdRecordId = dbOrder.id;
    } catch (dbErr) {
      console.warn("Prisma order.create fallback to memory:", dbErr);
    }

    const orderRecord: OrderRecord = {
      id: createdRecordId,
      orderNumber: data.orderNumber,
      gameId: data.game.id,
      gameName: data.game.name,
      packageId: data.packageItem.id,
      packageName: data.packageItem.name,
      diamondsCount: data.packageItem.diamondsCount + data.packageItem.bonusDiamonds,
      inGameUserId: data.inGameUserId,
      inGameZoneId: data.inGameZoneId || null,
      inGameNickname: data.inGameNickname || null,
      amountUSD: data.packageItem.sellingPriceUSD,
      amountKHR: data.packageItem.sellingPriceKHR,
      paymentMethod: "KHQR",
      paymentStatus: "PENDING",
      fulfillmentStatus: "PENDING",
      qrCodeString: data.qrCodeString || null,
      qrCodeDataUrl: data.qrCodeDataUrl || null,
      qrExpiresAt: data.qrExpiresAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in memory cache as well
    memoryOrders.set(data.orderNumber, orderRecord);

    return orderRecord;
  }

  /**
   * Find order by unique order number - queries Supabase first
   */
  public async getOrderByNumber(orderNumber: string): Promise<OrderRecord | null> {
    try {
      const dbOrder = await prisma.order.findUnique({
        where: { orderNumber },
        include: { game: true, package: true },
      });
      if (dbOrder) {
        const orderData: OrderRecord = {
          id: dbOrder.id,
          orderNumber: dbOrder.orderNumber,
          userId: dbOrder.userId,
          gameId: dbOrder.gameId,
          gameName: dbOrder.game.name,
          packageId: dbOrder.packageId,
          packageName: dbOrder.package.name,
          diamondsCount: dbOrder.package.diamondsCount + dbOrder.package.bonusDiamonds,
          inGameUserId: dbOrder.inGameUserId,
          inGameZoneId: dbOrder.inGameZoneId,
          inGameNickname: dbOrder.inGameNickname,
          amountUSD: Number(dbOrder.amountUSD),
          amountKHR: Number(dbOrder.amountKHR),
          paymentMethod: dbOrder.paymentMethod,
          paymentStatus: dbOrder.paymentStatus,
          fulfillmentStatus: dbOrder.fulfillmentStatus,
          moogoldOrderId: dbOrder.moogoldOrderId,
          moogoldResponse: dbOrder.moogoldResponse,
          failureReason: dbOrder.failureReason,
          qrCodeString: dbOrder.qrCodeString,
          qrExpiresAt: dbOrder.qrExpiresAt,
          paidAt: dbOrder.paidAt,
          completedAt: dbOrder.completedAt,
          createdAt: dbOrder.createdAt,
          updatedAt: dbOrder.updatedAt,
        };
        // Update memory cache
        memoryOrders.set(orderNumber, orderData);
        return orderData;
      }
    } catch (err) {
      console.warn("Failed to get order from Supabase:", err);
    }

    const memOrder = memoryOrders.get(orderNumber);
    if (memOrder) return memOrder;

    return null;
  }

  /**
   * Process payment confirmation and trigger automated MooGold fulfillment
   */
  public async processPaymentAndFulfill(orderNumber: string): Promise<{
    success: boolean;
    order: OrderRecord;
    error?: string;
  }> {
    const order = await this.getOrderByNumber(orderNumber);
    if (!order) {
      throw new Error(`Order ${orderNumber} not found`);
    }

    // Prevent double payment execution
    if (order.paymentStatus === "PAID" && order.fulfillmentStatus === "COMPLETED") {
      return { success: true, order };
    }

    // 1. Mark as PAID
    order.paymentStatus = "PAID";
    order.paidAt = new Date();
    order.fulfillmentStatus = "PROCESSING";
    order.updatedAt = new Date();
    memoryOrders.set(orderNumber, order);

    try {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: "PAID",
          paidAt: order.paidAt,
          fulfillmentStatus: "PROCESSING",
        },
      });
    } catch {
      // DB error caught, continue memory fulfillment
    }

    // 2. Fetch package info for MooGold IDs
    const pkg = await this.getPackageById(order.packageId);
    const productId = pkg?.moogoldProductId || "13";
    const variationId = pkg?.moogoldVariationId || "1001";

    // 3. Automated MooGold top-up execution
    try {
      const fulfillResult = await moogold.createTopupOrder(
        order.orderNumber,
        productId,
        variationId,
        order.inGameUserId,
        order.inGameZoneId || undefined
      );

      if (fulfillResult.success && fulfillResult.orderId) {
        order.fulfillmentStatus = "COMPLETED";
        order.moogoldOrderId = fulfillResult.orderId;
        order.moogoldResponse = fulfillResult.raw;
        order.completedAt = new Date();
        order.updatedAt = new Date();
        memoryOrders.set(orderNumber, order);

        try {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              fulfillmentStatus: "COMPLETED",
              moogoldOrderId: fulfillResult.orderId,
              moogoldResponse: fulfillResult.raw as object,
              completedAt: order.completedAt,
            },
          });
        } catch {
          // OK
        }

        return { success: true, order };
      } else {
        order.fulfillmentStatus = "FAILED";
        order.failureReason = fulfillResult.errorMessage || "MooGold fulfillment returned failure";
        order.moogoldResponse = fulfillResult.raw;
        order.updatedAt = new Date();
        memoryOrders.set(orderNumber, order);

        try {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              fulfillmentStatus: "FAILED",
              failureReason: order.failureReason,
            },
          });
        } catch {
          // OK
        }

        return { success: false, order, error: order.failureReason || undefined };
      }
    } catch (err: unknown) {
      const error = err as Error;
      order.fulfillmentStatus = "FAILED";
      order.failureReason = error.message;
      order.updatedAt = new Date();
      memoryOrders.set(orderNumber, order);

      return { success: false, order, error: error.message };
    }
  }

  /**
   * Manual admin retry for failed fulfillment
   */
  public async retryFulfillment(orderNumber: string): Promise<{ success: boolean; order: OrderRecord; error?: string }> {
    const order = await this.getOrderByNumber(orderNumber);
    if (!order) throw new Error("Order not found");

    const pkg = await this.getPackageById(order.packageId);
    const productId = pkg?.moogoldProductId || "13";
    const variationId = pkg?.moogoldVariationId || "1001";

    const fulfillResult = await moogold.createTopupOrder(
      order.orderNumber,
      productId,
      variationId,
      order.inGameUserId,
      order.inGameZoneId || undefined
    );

    if (fulfillResult.success && fulfillResult.orderId) {
      order.fulfillmentStatus = "COMPLETED";
      order.moogoldOrderId = fulfillResult.orderId;
      order.moogoldResponse = fulfillResult.raw;
      order.failureReason = null;
      order.completedAt = new Date();
      order.updatedAt = new Date();
      memoryOrders.set(orderNumber, order);

      return { success: true, order };
    } else {
      order.fulfillmentStatus = "FAILED";
      order.failureReason = fulfillResult.errorMessage || "Retry failed";
      order.updatedAt = new Date();
      memoryOrders.set(orderNumber, order);
      return { success: false, order, error: order.failureReason || undefined };
    }
  }

  /**
   * List all orders (for Admin dashboard)
   */
  public async getAllOrders(): Promise<OrderRecord[]> {
    try {
      const dbOrders = await prisma.order.findMany({
        include: { game: true, package: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      if (dbOrders && dbOrders.length > 0) {
        return dbOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          userId: o.userId,
          gameId: o.gameId,
          gameName: o.game.name,
          packageId: o.packageId,
          packageName: o.package.name,
          diamondsCount: o.package.diamondsCount + o.package.bonusDiamonds,
          inGameUserId: o.inGameUserId,
          inGameZoneId: o.inGameZoneId,
          inGameNickname: o.inGameNickname,
          amountUSD: Number(o.amountUSD),
          amountKHR: Number(o.amountKHR),
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          fulfillmentStatus: o.fulfillmentStatus,
          moogoldOrderId: o.moogoldOrderId,
          moogoldResponse: o.moogoldResponse,
          failureReason: o.failureReason,
          qrCodeString: o.qrCodeString,
          qrExpiresAt: o.qrExpiresAt,
          paidAt: o.paidAt,
          completedAt: o.completedAt,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        }));
      }
    } catch {
      // Use memory orders
    }

    return Array.from(memoryOrders.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Log payment webhook payload
   */
  public async logWebhook(data: { orderId?: string; payload: unknown; status: string; signature?: string; ip?: string }) {
    memoryWebhookLogs.push({
      id: `log_${Date.now()}`,
      orderId: data.orderId,
      payload: data.payload,
      status: data.status,
      createdAt: new Date(),
    });

    try {
      await prisma.paymentWebhookLog.create({
        data: {
          orderId: data.orderId,
          payload: data.payload as object,
          status: data.status,
          signature: data.signature,
          ipAddress: data.ip,
        },
      });
    } catch {
      // Ignored for memory fallback
    }
  }

  /**
   * Fetch landing page layout and content configuration
   */
  public async getLandingConfig(): Promise<LandingPageConfig> {
    try {
      const setting = await prisma.adminSetting.findUnique({
        where: { key: "landing_page_config" },
      });

      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        const merged = mergeLandingConfig(parsed);
        memoryLandingConfig = merged;
        return merged;
      }
    } catch (e) {
      console.warn("Could not load landing_page_config from database, using memory/default:", e);
    }

    return memoryLandingConfig || DEFAULT_LANDING_CONFIG;
  }

  /**
   * Save landing page layout and content configuration
   */
  public async saveLandingConfig(config: LandingPageConfig): Promise<LandingPageConfig> {
    const merged = mergeLandingConfig(config);
    memoryLandingConfig = merged;

    try {
      await prisma.adminSetting.upsert({
        where: { key: "landing_page_config" },
        create: {
          key: "landing_page_config",
          value: JSON.stringify(merged),
          description: "Landing page layout order, section visibility, and customizable content",
        },
        update: {
          value: JSON.stringify(merged),
          description: "Landing page layout order, section visibility, and customizable content",
        },
      });
    } catch (e) {
      console.error("Failed to upsert landing_page_config in database, stored in memory cache:", e);
    }

    return merged;
  }

  /**
   * Reset landing page configuration to default factory state
   */
  public async resetLandingConfig(): Promise<LandingPageConfig> {
    return this.saveLandingConfig(DEFAULT_LANDING_CONFIG);
  }
}

export const dbService = new DatabaseService();
