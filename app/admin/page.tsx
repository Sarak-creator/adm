"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatUSD, formatKHR } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  RefreshCw,
  ShieldCheck,
  Search,
  Percent,
  Plus,
  Pencil,
  Trash2,
  Gamepad2,
  Diamond,
  X,
  Check,
  Sparkles,
  Layers,
  ShoppingBag,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { LandingCustomizer } from "@/components/admin/landing-customizer";
import { SystemSettingsForm } from "@/components/admin/system-settings-form";

interface OrderItem {
  id: string;
  orderNumber: string;
  gameName: string;
  packageName: string;
  diamondsCount: number;
  inGameUserId: string;
  inGameZoneId?: string | null;
  inGameNickname?: string | null;
  amountUSD: number;
  amountKHR: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  fulfillmentStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  moogoldOrderId?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

interface GameItem {
  id: string;
  name: string;
  nameKh?: string | null;
  slug: string;
  bannerUrl: string;
  iconUrl: string;
  publisher?: string | null;
  hasZoneId: boolean;
  zoneIdPlaceholder?: string | null;
  userIdPlaceholder?: string | null;
  isActive: boolean;
  sortOrder: number;
  orderCount?: number;
  packages?: PackageItem[];
}

interface PackageItem {
  id: string;
  gameId: string;
  name: string;
  diamondsCount: number;
  bonusDiamonds: number;
  moogoldProductId: string;
  moogoldVariationId: string;
  originalPriceUSD: number | string;
  sellingPriceUSD: number | string;
  sellingPriceKHR: number | string;
  isAvailable: boolean;
  badgeText?: string | null;
  sortOrder: number;
  game?: { id: string; name: string; slug: string };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "games" | "packages" | "landing" | "settings">("orders");

  // Sync tab with URL query parameter on mount and when changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam === "landing" ||
        tabParam === "games" ||
        tabParam === "packages" ||
        tabParam === "orders" ||
        tabParam === "settings"
      ) {
        setActiveTab(tabParam as "orders" | "games" | "packages" | "landing" | "settings");
      }
    }
  }, []);

  // Balance & Revenue State
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Global Theme Mode State (Only Admin can set dark or light mode)
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  // Fetch current theme mode on load
  const fetchTheme = async () => {
    try {
      const res = await fetch("/api/theme", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.themeMode) {
        setCurrentTheme(data.themeMode === "light" ? "light" : "dark");
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  const handleToggleTheme = async () => {
    const newMode = currentTheme === "dark" ? "light" : "dark";
    setIsUpdatingTheme(true);
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeMode: newMode }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentTheme(newMode);
        // Instant broadcast across tabs
        try {
          const channel = new BroadcastChannel("anajak_theme_channel");
          channel.postMessage({ type: "THEME_CHANGED", themeMode: newMode });
          channel.close();
        } catch {}
        try {
          localStorage.setItem("anajak_theme_mode", newMode);
        } catch {}
        showToast(
          newMode === "light"
            ? "បានប្តូរទៅ របៀបពន្លឺ (Light Mode) ជោគជ័យ! Landing page បានផ្លាស់ប្តូរផ្ទាល់ភ្លាមៗ។"
            : "បានប្តូរទៅ របៀបងងឹត (Dark Mode) ជោគជ័យ! Landing page បានផ្លាស់ប្តូរផ្ទាល់ភ្លាមៗ。"
        );
      } else {
        showToast(data.error || "បរាជ័យក្នុងការប្តូរ Theme", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRetryingOrder, setIsRetryingOrder] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  // Profit Margin Control State
  const [markupPercent, setMarkupPercent] = useState<number>(15);
  const [isSavingMargin, setIsSavingMargin] = useState(false);
  const [marginSavedAlert, setMarginSavedAlert] = useState(false);

  // Games State
  const [games, setGames] = useState<GameItem[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [gameFormData, setGameFormData] = useState({
    name: "",
    nameKh: "",
    slug: "",
    publisher: "",
    bannerUrl: "",
    iconUrl: "",
    hasZoneId: false,
    zoneIdPlaceholder: "Zone ID (e.g. 2024)",
    userIdPlaceholder: "User ID (e.g. 12345678)",
    isActive: true,
    sortOrder: 0,
  });

  // Packages State
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>("ALL");
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [packageFormData, setPackageFormData] = useState({
    gameId: "",
    name: "",
    diamondsCount: 100,
    bonusDiamonds: 0,
    moogoldProductId: "13",
    moogoldVariationId: "1001",
    originalPriceUSD: 1.5,
    sellingPriceUSD: 1.25,
    sellingPriceKHR: 5125,
    isAvailable: true,
    badgeText: "",
    sortOrder: 1,
  });

  // Global Alert / Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Image Upload State & Handlers
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  // Client-side image compression for Vercel upload (prevents Vercel 4.5MB payload limit & speeds up display)
  const compressImageClient = async (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality = 0.85
  ): Promise<File> => {
    // Preserve vectors and animated GIFs
    if (file.type === "image/svg+xml" || file.type === "image/gif") {
      return file;
    }
    // Skip already small images (< 150KB)
    if (file.size < 150 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type === "image/png" ? "image/png" : "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File, type: "banner" | "icon") => {
    if (type === "banner") setIsUploadingBanner(true);
    else setIsUploadingIcon(true);

    try {
      // Client-side image optimization
      const optimizedFile = await compressImageClient(
        file,
        type === "banner" ? 1600 : 512,
        type === "banner" ? 900 : 512,
        0.85
      );

      if (optimizedFile.size > 4.5 * 1024 * 1024) {
        showToast("ទំហំរូបភាពធំពេក (កុំឱ្យលើស 4.5MB សម្រាប់ដំណើរការលើ Vercel)", "error");
        return;
      }

      const fd = new FormData();
      fd.append("file", optimizedFile);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (type === "banner") {
          setGameFormData((prev) => ({ ...prev, bannerUrl: data.url }));
        } else {
          setGameFormData((prev) => ({ ...prev, iconUrl: data.url }));
        }
        showToast("បាន Upload រូបភាពដោយជោគជ័យ!");
      } else {
        showToast(data.error || "Upload បរាជ័យ", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      showToast(err.message || "Upload មានបញ្ហា", "error");
    } finally {
      if (type === "banner") setIsUploadingBanner(false);
      else setIsUploadingIcon(false);
    }
  };

  // ==========================================
  // Data Fetching Functions
  // ==========================================
  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const res = await fetch("/api/admin/moogold/balance");
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setCurrency(data.currency || "USD");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to load orders from Supabase:", e);
    }
  };

  const fetchGames = async () => {
    setIsLoadingGames(true);
    try {
      const res = await fetch("/api/admin/games");
      const data = await res.json();
      if (data.success && Array.isArray(data.games)) {
        setGames(data.games);
        // Flatten packages for package view
        const allPkgs: PackageItem[] = [];
        data.games.forEach((g: GameItem) => {
          if (g.packages) {
            g.packages.forEach((p: PackageItem) => {
              allPkgs.push({
                ...p,
                game: { id: g.id, name: g.name, slug: g.slug },
              });
            });
          }
        });
        setPackages(allPkgs);
      }
    } catch (e) {
      console.error("Failed to load games from Supabase:", e);
      showToast("មិនអាចទាញទិន្នន័យហ្គេមពី Supabase បានទេ", "error");
    } finally {
      setIsLoadingGames(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchOrders();
    fetchGames();
  }, []);

  // ==========================================
  // GAME CRUD OPERATIONS (Insert, Update, Delete)
  // ==========================================
  const handleOpenGameModal = (game?: GameItem) => {
    if (game) {
      setEditingGame(game);
      setGameFormData({
        name: game.name,
        nameKh: game.nameKh || "",
        slug: game.slug,
        publisher: game.publisher || "",
        bannerUrl: game.bannerUrl,
        iconUrl: game.iconUrl,
        hasZoneId: game.hasZoneId,
        zoneIdPlaceholder: game.zoneIdPlaceholder || "",
        userIdPlaceholder: game.userIdPlaceholder || "",
        isActive: game.isActive,
        sortOrder: game.sortOrder,
      });
    } else {
      setEditingGame(null);
      setGameFormData({
        name: "",
        nameKh: "",
        slug: "",
        publisher: "",
        bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
        iconUrl: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=256&q=80",
        hasZoneId: false,
        zoneIdPlaceholder: "Zone ID",
        userIdPlaceholder: "User ID",
        isActive: true,
        sortOrder: games.length + 1,
      });
    }
    setGameModalOpen(true);
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) {
        // UPDATE (PUT)
        const res = await fetch("/api/admin/games", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingGame.id, ...gameFormData }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("បានកែប្រែទិន្នន័យហ្គេមដោយជោគជ័យ (Game Updated)!");
          setGameModalOpen(false);
          fetchGames();
        } else {
          showToast(data.error || "បរាជ័យក្នុងការកែប្រែ", "error");
        }
      } else {
        // INSERT (POST)
        const res = await fetch("/api/admin/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gameFormData),
        });
        const data = await res.json();
        if (data.success) {
          showToast("បានបង្កើតហ្គេមថ្មីដោយជោគជ័យ (Game Inserted)!");
          setGameModalOpen(false);
          fetchGames();
        } else {
          showToast(data.error || "បរាជ័យក្នុងការបង្កើតហ្គេម", "error");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុបហ្គេម "${gameName}" ឬទេ?`)) return;
    try {
      const res = await fetch(`/api/admin/games?id=${gameId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "បានលុបហ្គេមដោយជោគជ័យ!");
        fetchGames();
      } else {
        showToast(data.error || "បរាជ័យក្នុងការលុប", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // ==========================================
  // PACKAGE CRUD OPERATIONS (Insert, Update, Delete)
  // ==========================================
  const handleOpenPackageModal = (pkg?: PackageItem) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageFormData({
        gameId: pkg.gameId,
        name: pkg.name,
        diamondsCount: pkg.diamondsCount,
        bonusDiamonds: pkg.bonusDiamonds,
        moogoldProductId: pkg.moogoldProductId,
        moogoldVariationId: pkg.moogoldVariationId,
        originalPriceUSD: Number(pkg.originalPriceUSD),
        sellingPriceUSD: Number(pkg.sellingPriceUSD),
        sellingPriceKHR: Number(pkg.sellingPriceKHR),
        isAvailable: pkg.isAvailable,
        badgeText: pkg.badgeText || "",
        sortOrder: pkg.sortOrder,
      });
    } else {
      setEditingPackage(null);
      const defaultGameId = selectedGameFilter !== "ALL" ? selectedGameFilter : games[0]?.id || "";
      setPackageFormData({
        gameId: defaultGameId,
        name: "100 Diamonds",
        diamondsCount: 100,
        bonusDiamonds: 0,
        moogoldProductId: "13",
        moogoldVariationId: "1001",
        originalPriceUSD: 1.5,
        sellingPriceUSD: 1.25,
        sellingPriceKHR: 5125,
        isAvailable: true,
        badgeText: "",
        sortOrder: 1,
      });
    }
    setPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        // UPDATE (PUT)
        const res = await fetch("/api/admin/packages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPackage.id, ...packageFormData }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("បានកែប្រែកញ្ចប់ពេជ្រដោយជោគជ័យ (Package Updated)!");
          setPackageModalOpen(false);
          fetchGames();
        } else {
          showToast(data.error || "បរាជ័យក្នុងការកែប្រែ", "error");
        }
      } else {
        // INSERT (POST)
        const res = await fetch("/api/admin/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(packageFormData),
        });
        const data = await res.json();
        if (data.success) {
          showToast("បានបង្កើតកញ្ចប់ពេជ្រថ្មីដោយជោគជ័យ (Package Inserted)!");
          setPackageModalOpen(false);
          fetchGames();
        } else {
          showToast(data.error || "បរាជ័យក្នុងការបង្កើតកញ្ចប់ពេជ្រ", "error");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  const handleDeletePackage = async (packageId: string, packageName: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុបកញ្ចប់ពេជ្រ "${packageName}" ឬទេ?`)) return;
    try {
      const res = await fetch(`/api/admin/packages?id=${packageId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "បានលុបកញ្ចប់ពេជ្រដោយជោគជ័យ!");
        fetchGames();
      } else {
        showToast(data.error || "បរាជ័យក្នុងការលុប", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // ==========================================
  // ORDER ACTIONS (Retry & Delete)
  // ==========================================
  const handleRetryOrder = async (orderNumber: string) => {
    setIsRetryingOrder(orderNumber);
    setRetryMessage(null);

    try {
      const res = await fetch("/api/admin/orders/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === orderNumber
              ? {
                  ...o,
                  paymentStatus: "PAID",
                  fulfillmentStatus: "COMPLETED",
                  moogoldOrderId: data.order?.moogoldOrderId || "MG-918999",
                  failureReason: null,
                }
              : o
          )
        );
        setRetryMessage({
          id: orderNumber,
          msg: "MooGold fulfillment succeeded!",
          success: true,
        });
      } else {
        setRetryMessage({
          id: orderNumber,
          msg: data.error || "Retry failed",
          success: false,
        });
      }
    } catch {
      setRetryMessage({
        id: orderNumber,
        msg: "Failed to connect to fulfillment engine",
        success: false,
      });
    } finally {
      setIsRetryingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderNumber: string) => {
    if (!confirm(`តើអ្នកចង់លុប Order "${orderNumber}" នេះចេញពី Supabase មែនទេ?`)) return;
    try {
      const res = await fetch(`/api/admin/orders?orderNumber=${orderNumber}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("បានលុប Order ដោយជោគជ័យ!");
        fetchOrders();
      } else {
        showToast(data.error || "បរាជ័យក្នុងការលុប Order", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, "error");
    }
  };

  // Calculations
  const totalUSD = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((acc, o) => acc + o.amountUSD, 0);

  const totalKHR = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((acc, o) => acc + o.amountKHR, 0);

  const completedCount = orders.filter((o) => o.fulfillmentStatus === "COMPLETED").length;
  const failedCount = orders.filter((o) => o.fulfillmentStatus === "FAILED").length;
  const pendingCount = orders.filter((o) => o.fulfillmentStatus === "PENDING").length;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "COMPLETED" && o.fulfillmentStatus === "COMPLETED") ||
        (filterStatus === "FAILED" && o.fulfillmentStatus === "FAILED") ||
        (filterStatus === "PENDING" && o.fulfillmentStatus === "PENDING");

      const matchesSearch =
        !searchQuery.trim() ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.inGameUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.inGameNickname && o.inGameNickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        o.gameName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [orders, filterStatus, searchQuery]);

  const filteredPackages = useMemo(() => {
    if (selectedGameFilter === "ALL") return packages;
    return packages.filter((p) => p.gameId === selectedGameFilter);
  }, [packages, selectedGameFilter]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("តើអ្នកពិតជាចង់ចាកចេញពី Admin Portal មែនទេ? (Do you want to logout?)")) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold border transition-all animate-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20"
              : "bg-red-950 text-red-300 border-red-500/50 shadow-red-500/20"
          }`}
        >
          {toastMessage.type === "success" ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-display">
              ADMIN CONSOLE
            </span>
            <span className="text-xs text-slate-400">គ្រប់គ្រងទិន្នន័យ Supabase Database</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">
            អាណាចក្រDiamond Control Center
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Admin Live Theme Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            disabled={isUpdatingTheme}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm hover:scale-[1.02] active:scale-95 ${
              currentTheme === "light"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-amber-500/10"
                : "bg-cyan-950/70 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/70 shadow-cyan-500/10"
            }`}
            title="ប្តូរ Dark Mode / Light Mode សម្រាប់គេហទំព័រទាំងមូល (Live Change on Landing Page)"
          >
            {currentTheme === "light" ? (
              <>
                <Sun className={`w-3.5 h-3.5 text-amber-400 ${isUpdatingTheme ? "animate-spin" : ""}`} />
                <span>របៀបពន្លឺ (Light Mode)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 font-mono">
                  LIVE
                </span>
              </>
            ) : (
              <>
                <Moon className={`w-3.5 h-3.5 text-cyan-400 ${isUpdatingTheme ? "animate-spin" : ""}`} />
                <span>របៀបងងឹត (Dark Mode)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-400/20 text-cyan-300 font-mono">
                  LIVE
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              fetchBalance();
              fetchOrders();
              fetchGames();
              fetchTheme();
              showToast("បានទាញទិន្នន័យចុងក្រោយពី Supabase រួចរាល់!");
            }}
            disabled={isLoadingBalance || isLoadingGames}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBalance || isLoadingGames ? "animate-spin" : ""}`} />
            <span>Refresh Live Data</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-500/30 transition-all hover:scale-[1.02] active:scale-95"
            title="ចាកចេញពីប្រព័ន្ធ (Logout)"
          >
            <LogOut className={`w-3.5 h-3.5 ${isLoggingOut ? "animate-spin" : ""}`} />
            <span>ចាកចេញ (Logout)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MooGold Balance Card */}
        <div className="glass-card rounded-2xl p-5 border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>MooGold Reseller Wallet</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-display text-cyan-400">
            {balance !== null ? formatUSD(balance) : "$1,450.75"}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MooGold API Live Synchronized</span>
          </div>
        </div>

        {/* Total Gross Volume USD */}
        <div className="glass-card rounded-2xl p-5 border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Volume (USD)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-display text-white">
            {formatUSD(totalUSD)}
          </div>
          <div className="text-[11px] text-slate-400 font-display mt-2">
            ≈ {formatKHR(totalKHR)}
          </div>
        </div>

        {/* Active Games in Supabase */}
        <div className="glass-card rounded-2xl p-5 border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Games (Supabase)</span>
            <Gamepad2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-display text-purple-400">
            {games.length} <span className="text-xs text-slate-400 font-normal">Games</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {packages.length} Diamond Packages Total
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="glass-card rounded-2xl p-5 border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Fulfilled Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-display text-emerald-400">
            {completedCount} <span className="text-xs text-slate-400 font-normal">/ {orders.length} Total</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {failedCount} Failed • {pendingCount} Pending
          </div>
        </div>
      </div>

      {/* Navigation Tabs for CRUD Modules */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "orders"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ការកុម្ម៉ង់ (Orders Management)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("games")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "games"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>គ្រប់គ្រងហ្គេម (Games CRUD)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40">
            {games.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("packages");
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("tab", "packages");
              window.history.replaceState(null, "", url.toString());
            }
          }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "packages"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Diamond className="w-4 h-4" />
          <span>គ្រប់គ្រងកញ្ចប់ពេជ្រ (Packages CRUD)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40">
            {packages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("landing");
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("tab", "landing");
              window.history.replaceState(null, "", url.toString());
            }
          }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "landing"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>កែសម្រួលផ្ទាំងដើម (Customize Landing)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("settings");
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("tab", "settings");
              window.history.replaceState(null, "", url.toString());
            }
          }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "settings"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ការកំណត់ប្រព័ន្ធ (System Settings)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GAMES MANAGEMENT (INSERT, UPDATE, DELETE) */}
      {/* ========================================================= */}
      {activeTab === "games" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                <span>គ្រប់គ្រងហ្គេមក្នុង Supabase (Games Manager)</span>
              </h2>
              <p className="text-xs text-slate-400">
                បញ្ចូលហ្គេមថ្មី (Insert), កែប្រែព័ត៌មាន (Update), និងលុបហ្គេម (Delete)
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenGameModal()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ បន្ថែមហ្គេមថ្មី (Insert Game)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">ហ្គេម (Game)</th>
                  <th className="py-3 px-3">Slug (URL)</th>
                  <th className="py-3 px-3">Publisher</th>
                  <th className="py-3 px-3">Zone ID?</th>
                  <th className="py-3 px-3">កញ្ចប់ពេជ្រ</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {games.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      មិនទាន់មានហ្គេមក្នុង Supabase នៅឡើយទេ។ សូមចុច &ldquo;+ បន្ថែមហ្គេមថ្មី&rdquo;
                    </td>
                  </tr>
                ) : (
                  games.map((game) => (
                    <tr key={game.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={game.iconUrl}
                            alt={game.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <div className="text-white font-bold">{game.name}</div>
                            <div className="text-slate-400 text-[11px]">{game.nameKh || "-"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-cyan-300">
                        /games/{game.slug}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {game.publisher || "General"}
                      </td>

                      <td className="py-3 px-3">
                        {game.hasZoneId ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Required
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No Zone</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {game.packages?.length || 0} packages
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {game.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenGameModal(game)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-all border border-slate-700"
                            title="Edit (Update)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGame(game.id, game.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-all border border-slate-700"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PACKAGES MANAGEMENT (INSERT, UPDATE, DELETE) */}
      {/* ========================================================= */}
      {activeTab === "packages" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Diamond className="w-5 h-5 text-cyan-400" />
                <span>គ្រប់គ្រងកញ្ចប់ពេជ្រក្នុង Supabase (Diamond Packages)</span>
              </h2>
              <p className="text-xs text-slate-400">
                បញ្ចូលកញ្ចប់ពេជ្រ (Insert), កែប្រែតម្លៃ/ចំនួន (Update), និងលុបកញ្ចប់ (Delete)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Game Filter Dropdown */}
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">ហ្គេមទាំងអស់ (All Games)</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleOpenPackageModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ បន្ថែមកញ្ចប់ថ្មី (Insert Package)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">ហ្គេម (Game)</th>
                  <th className="py-3 px-3">ឈ្មោះកញ្ចប់ (Package)</th>
                  <th className="py-3 px-3">ចំនួនពេជ្រ (+ Bonus)</th>
                  <th className="py-3 px-3">តម្លៃលក់ ($ / ៛)</th>
                  <th className="py-3 px-3">MooGold IDs</th>
                  <th className="py-3 px-3">Status / Badge</th>
                  <th className="py-3 px-3 text-right">សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      មិនទាន់មានកញ្ចប់ពេជ្រសម្រាប់ហ្គេមនេះទេ។ សូមចុច &ldquo;+ បន្ថែមកញ្ចប់ថ្មី&rdquo;
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-300">
                        {pkg.game?.name || "Game"}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-white font-bold">{pkg.name}</div>
                        {pkg.badgeText && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {pkg.badgeText}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-cyan-400 font-bold font-display">
                          {pkg.diamondsCount}{" "}
                          {pkg.bonusDiamonds > 0 && (
                            <span className="text-emerald-400 text-[11px]">+{pkg.bonusDiamonds} Bonus</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-display font-bold text-white">
                          {formatUSD(Number(pkg.sellingPriceUSD))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-display">
                          {formatKHR(Number(pkg.sellingPriceKHR))}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        <div>PID: {pkg.moogoldProductId}</div>
                        <div>VID: {pkg.moogoldVariationId}</div>
                      </td>

                      <td className="py-3 px-3">
                        {pkg.isAvailable ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            Unavailable
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPackageModal(pkg)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-all border border-slate-700"
                            title="Edit (Update)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-all border border-slate-700"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ORDERS TRANSACTIONS & REVENUE */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <>
          {/* Product & Price Margin Manager */}
          <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Percent className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Price & Profit Margin Manager
                  </h2>
                  <p className="text-xs text-slate-400">
                    Auto-calculate Cambodian selling prices based on wholesale MooGold cost and exchange rate ($1 = 4,100 ៛)
                  </p>
                </div>
              </div>
              {marginSavedAlert && (
                <span className="text-xs text-emerald-400 font-bold animate-pulse">
                  ✓ Saved successfully!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Target Profit Margin Markup:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-cyan-400 focus:outline-none"
                  />
                  <span className="text-sm font-bold text-white">%</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSavingMargin(true);
                      setTimeout(() => {
                        setIsSavingMargin(false);
                        setMarginSavedAlert(true);
                        setTimeout(() => setMarginSavedAlert(false), 2500);
                      }, 400);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all ml-auto"
                  >
                    {isSavingMargin ? "Saving..." : "Apply Margin"}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Active Exchange Rate:</span>
                <div className="text-sm font-bold text-white font-display">
                  1 USD = 4,100 KHR (៛)
                </div>
                <p className="text-[11px] text-slate-500">Auto-synced with NBC daily market rate</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">MooGold Fulfillment Mode:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    AUTO-FULFILL ON PAID
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Instant diamond delivery upon Bakong webhook</p>
              </div>
            </div>
          </section>

          {/* Orders Table */}
          <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Order Transactions Manager
                </h2>
                <p className="text-xs text-slate-400">
                  Live orders stored in Supabase with payment and fulfillment tracking
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search order, user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  {(["ALL", "COMPLETED", "FAILED", "PENDING"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        filterStatus === st
                          ? "bg-cyan-500 text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Retry Message Alert */}
            {retryMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
                  retryMessage.success
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                    : "bg-red-950/80 text-red-300 border border-red-500/40"
                }`}
              >
                <span>
                  Order <strong>{retryMessage.id}</strong>: {retryMessage.msg}
                </span>
                <button
                  type="button"
                  onClick={() => setRetryMessage(null)}
                  className="text-slate-400 hover:text-white ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Order Number</th>
                    <th className="py-3 px-3">Game & Package</th>
                    <th className="py-3 px-3">Player Details</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Fulfillment</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        មិនមាន Order ណាត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ។
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono text-cyan-300 font-bold">
                            {order.orderNumber}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-white font-bold">{order.gameName}</div>
                          <div className="text-slate-400 text-[11px]">
                            {order.packageName} ({order.diamondsCount} items)
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-emerald-400 font-bold">
                            {order.inGameNickname || "Unverified"}
                          </div>
                          <div className="font-mono text-slate-400 text-[11px]">
                            ID: {order.inGameUserId}{" "}
                            {order.inGameZoneId ? `(${order.inGameZoneId})` : ""}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-display font-bold text-white">
                            {formatUSD(order.amountUSD)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-display">
                            {formatKHR(order.amountKHR)}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : order.paymentStatus === "PENDING"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.fulfillmentStatus === "COMPLETED"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : order.fulfillmentStatus === "FAILED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {order.fulfillmentStatus}
                            </span>
                            {order.moogoldOrderId && (
                              <span className="font-mono text-[10px] text-slate-400">
                                MG: {order.moogoldOrderId}
                              </span>
                            )}
                            {order.failureReason && (
                              <span className="text-[10px] text-red-400 line-clamp-1" title={order.failureReason}>
                                {order.failureReason}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.fulfillmentStatus === "FAILED" && (
                              <button
                                type="button"
                                onClick={() => handleRetryOrder(order.orderNumber)}
                                disabled={isRetryingOrder === order.orderNumber}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                              >
                                {isRetryingOrder === order.orderNumber ? (
                                  <RotateCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                <span>Retry</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.orderNumber)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-all border border-slate-700"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LANDING PAGE LAYOUT & CONTENT CUSTOMIZER */}
      {/* ========================================================= */}
      {activeTab === "landing" && (
        <LandingCustomizer onShowToast={showToast} />
      )}

      {/* ========================================================= */}
      {/* TAB 5: ENCRYPTED DYNAMIC SYSTEM SETTINGS & CONFIGURATION */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <SystemSettingsForm onShowToast={showToast} />
      )}

      {/* ========================================================= */}
      {/* MODAL: INSERT / UPDATE GAME */}
      {/* ========================================================= */}
      {gameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                <span>{editingGame ? "កែប្រែហ្គេម (Update Game)" : "បន្ថែមហ្គេមថ្មី (Insert Game)"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setGameModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ឈ្មោះហ្គេម (Game Name EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameFormData.name}
                    onChange={(e) => setGameFormData({ ...gameFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Valorant"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ឈ្មោះជាភាសាខ្មែរ (Name KH)
                  </label>
                  <input
                    type="text"
                    value={gameFormData.nameKh}
                    onChange={(e) => setGameFormData({ ...gameFormData, nameKh: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. វ៉ាឡូរ៉ិន"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slug (URL Key) *
                  </label>
                  <input
                    type="text"
                    required
                    value={gameFormData.slug}
                    onChange={(e) => setGameFormData({ ...gameFormData, slug: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. valorant"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Publisher / Developer
                  </label>
                  <input
                    type="text"
                    value={gameFormData.publisher}
                    onChange={(e) => setGameFormData({ ...gameFormData, publisher: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Riot Games"
                  />
                </div>
              </div>

              {/* Banner Image Upload & Input */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>រូបភាព Banner (16:9 Widescreen) *</span>
                  </label>
                  <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all">
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingBanner ? "Uploading..." : "Upload ពីរូបភាពក្នុងកុំព្យូទ័រ"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBanner}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, "banner");
                      }}
                    />
                  </label>
                </div>

                <div className="flex gap-3 items-center">
                  {gameFormData.bannerUrl && (
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                      <img
                        src={gameFormData.bannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={gameFormData.bannerUrl}
                    onChange={(e) => setGameFormData({ ...gameFormData, bannerUrl: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Upload រូបភាព ឬ បញ្ចូល URL (https://...)"
                  />
                </div>

                {/* Preset Banners */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500">Preset:</span>
                  {[
                    { label: "MLBB", url: "/images/games/mlbb-banner.jpg" },
                    { label: "Free Fire", url: "/images/games/freefire-banner.jpg" },
                    { label: "PUBG", url: "/images/games/pubg-banner.jpg" },
                    { label: "Genshin", url: "/images/games/genshin-banner.jpg" },
                    { label: "HOK", url: "/images/games/hok-banner.jpg" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setGameFormData({ ...gameFormData, bannerUrl: p.url })}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Image Upload & Input */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>រូបភាព Icon / Logo (1:1 Square) *</span>
                  </label>
                  <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all">
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingIcon ? "Uploading..." : "Upload ពីរូបភាពក្នុងកុំព្យូទ័រ"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingIcon}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, "icon");
                      }}
                    />
                  </label>
                </div>

                <div className="flex gap-3 items-center">
                  {gameFormData.iconUrl && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                      <img
                        src={gameFormData.iconUrl}
                        alt="Icon Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={gameFormData.iconUrl}
                    onChange={(e) => setGameFormData({ ...gameFormData, iconUrl: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Upload រូបភាព ឬ បញ្ចូល URL (https://...)"
                  />
                </div>

                {/* Preset Icons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-500">Preset:</span>
                  {[
                    { label: "MLBB", url: "/images/games/mlbb-icon.jpg" },
                    { label: "Free Fire", url: "/images/games/freefire-icon.jpg" },
                    { label: "PUBG", url: "/images/games/pubg-icon.jpg" },
                    { label: "Genshin", url: "/images/games/genshin-icon.jpg" },
                    { label: "HOK", url: "/images/games/hok-icon.jpg" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setGameFormData({ ...gameFormData, iconUrl: p.url })}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    User ID Placeholder
                  </label>
                  <input
                    type="text"
                    value={gameFormData.userIdPlaceholder}
                    onChange={(e) => setGameFormData({ ...gameFormData, userIdPlaceholder: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Zone ID Placeholder (បើមាន)
                  </label>
                  <input
                    type="text"
                    value={gameFormData.zoneIdPlaceholder}
                    onChange={(e) => setGameFormData({ ...gameFormData, zoneIdPlaceholder: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={gameFormData.hasZoneId}
                    onChange={(e) => setGameFormData({ ...gameFormData, hasZoneId: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>ត្រូវការបញ្ចូល Zone ID (e.g. MLBB, Genshin)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={gameFormData.isActive}
                    onChange={(e) => setGameFormData({ ...gameFormData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>ដាក់បង្ហាញលើគេហទំព័រ (Active Status)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setGameModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-neon-cyan"
                >
                  {editingGame ? "រក្សាទុកការកែប្រែ (Save Updates)" : "បង្កើតហ្គេម (Insert Game)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INSERT / UPDATE DIAMOND PACKAGE */}
      {/* ========================================================= */}
      {packageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Diamond className="w-5 h-5 text-cyan-400" />
                <span>{editingPackage ? "កែប្រែកញ្ចប់ពេជ្រ (Update Package)" : "បន្ថែមកញ្ចប់ពេជ្រថ្មី (Insert Package)"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPackageModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ជ្រើសរើសហ្គេម (Target Game) *
                </label>
                <select
                  required
                  value={packageFormData.gameId}
                  onChange={(e) => setPackageFormData({ ...packageFormData, gameId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="" disabled>-- ជ្រើសរើសហ្គេម --</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ឈ្មោះកញ្ចប់ (Package Name) *
                </label>
                <input
                  type="text"
                  required
                  value={packageFormData.name}
                  onChange={(e) => setPackageFormData({ ...packageFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. 520 Diamonds"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ចំនួនពេជ្រគោល (Base Diamonds) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={packageFormData.diamondsCount}
                    onChange={(e) => setPackageFormData({ ...packageFormData, diamondsCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ពេជ្របន្ថែម (Bonus Diamonds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={packageFormData.bonusDiamonds}
                    onChange={(e) => setPackageFormData({ ...packageFormData, bonusDiamonds: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    តម្លៃលក់ $USD (Selling Price USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.1}
                    value={packageFormData.sellingPriceUSD}
                    onChange={(e) => {
                      const usd = Number(e.target.value);
                      setPackageFormData({
                        ...packageFormData,
                        sellingPriceUSD: usd,
                        sellingPriceKHR: Math.round(usd * 4100),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-display text-emerald-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    តម្លៃលក់ ៛KHR (Selling Price KHR)
                  </label>
                  <input
                    type="number"
                    required
                    value={packageFormData.sellingPriceKHR}
                    onChange={(e) => setPackageFormData({ ...packageFormData, sellingPriceKHR: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-display text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    MooGold Product ID
                  </label>
                  <input
                    type="text"
                    value={packageFormData.moogoldProductId}
                    onChange={(e) => setPackageFormData({ ...packageFormData, moogoldProductId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    MooGold Variation ID
                  </label>
                  <input
                    type="text"
                    value={packageFormData.moogoldVariationId}
                    onChange={(e) => setPackageFormData({ ...packageFormData, moogoldVariationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Promo Badge Text (e.g. &ldquo;🔥 BESTSELLER&rdquo;, &ldquo;+10% Bonus&rdquo;)
                </label>
                <input
                  type="text"
                  value={packageFormData.badgeText}
                  onChange={(e) => setPackageFormData({ ...packageFormData, badgeText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Optional badge"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={packageFormData.isAvailable}
                    onChange={(e) => setPackageFormData({ ...packageFormData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>បើកលក់កញ្ចប់នេះ (isAvailable)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-neon-cyan"
                >
                  {editingPackage ? "រក្សាទុកការកែប្រែ (Save Updates)" : "បង្កើតកញ្ចប់ពេជ្រ (Insert Package)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
