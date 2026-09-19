"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { GameData, PackageData } from "@/lib/catalog-data";
import { formatUSD, formatKHR } from "@/lib/utils";
import {
  Diamond,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Zap,
  Clock,
  Copy,
  Check,
  RotateCw,
  QrCode,
  Sparkles,
  ArrowRight,
  UserCheck,
  Share2,
  Download,
  X,
  Smartphone,
  ExternalLink,
} from "lucide-react";

interface TopupFormProps {
  game: GameData;
}

export function TopupForm({ game }: TopupFormProps) {
  // Form State
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    game.packages[0]?.id || ""
  );
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Guide Modal State
  const [showIdGuide, setShowIdGuide] = useState(false);

  // Checkout & KHQR Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{
    orderNumber: string;
    amountUSD: number;
    amountKHR: number;
    currency: "USD" | "KHR";
    qrCodeDataUrl: string;
    qrExpiresAt: string;
    abapayDeeplink?: string | null;
    appCheckoutUrl?: string | null;
  } | null>(null);

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes in seconds
  const [isPolling, setIsPolling] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Success Modal State
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    inGameNickname?: string | null;
    inGameUserId: string;
    inGameZoneId?: string | null;
    diamondsCount: number;
    packageName: string;
    amountUSD: number;
    amountKHR: number;
    moogoldOrderId?: string | null;
    completedAt?: string;
  } | null>(null);

  // Copy Feedback State
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPackage = game.packages.find((p) => p.id === selectedPackageId);

  // Auto clear verified name if User ID changes
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
    setVerifiedName(null);
    setVerifyError(null);
  };

  const handleZoneIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoneId(e.target.value);
    setVerifiedName(null);
    setVerifyError(null);
  };

  // Step 1: Verify In-game ID
  const handleVerifyPlayerId = async () => {
    if (!userId.trim()) {
      setVerifyError("សូមបញ្ចូល User ID ជាមុនសិន");
      return;
    }
    if (game.hasZoneId && !zoneId.trim()) {
      setVerifyError("សូមបញ្ចូល Zone ID សម្រាប់ហ្គេមនេះ");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/games/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: game.slug,
          userId: userId.trim(),
          zoneId: game.hasZoneId ? zoneId.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.inGameName) {
        setVerifiedName(data.inGameName);
        setVerifyError(null);
      } else {
        setVerifiedName(null);
        setVerifyError(data.errorMessage || "រកមិនឃើញគណនីហ្គេមនេះទេ");
      }
    } catch {
      setVerifyError("មានបញ្ហាបច្ចេកទេសក្នុងការភ្ជាប់ទៅកាន់ Server");
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3 & 4: Initiate Order & Open KHQR Modal
  const handleOpenCheckout = async () => {
    if (!userId.trim()) {
      setVerifyError("សូមបញ្ចូល User ID របស់អ្នក");
      window.scrollTo({ top: 200, behavior: "smooth" });
      return;
    }
    if (game.hasZoneId && !zoneId.trim()) {
      setVerifyError("សូមបញ្ចូល Zone ID");
      window.scrollTo({ top: 200, behavior: "smooth" });
      return;
    }
    if (!selectedPackage) {
      alert("សូមជ្រើសរើសកញ្ចប់ពេជ្រ");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: game.slug,
          packageId: selectedPackage.id,
          inGameUserId: userId.trim(),
          inGameZoneId: game.hasZoneId ? zoneId.trim() : null,
          inGameNickname: verifiedName || null,
          currency,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder({
          orderNumber: data.order.orderNumber,
          amountUSD: data.order.amountUSD,
          amountKHR: data.order.amountKHR,
          currency,
          qrCodeDataUrl: data.order.qrCodeDataUrl,
          qrExpiresAt: data.order.qrExpiresAt,
          abapayDeeplink: data.order.abapayDeeplink,
          appCheckoutUrl: data.order.appCheckoutUrl,
        });
        setTimeLeft(180); // 3 minutes countdown
        setShowQRModal(true);
        setIsPolling(true);
      } else {
        alert(data.errorMessage || "បរាជ័យក្នុងការបង្កើតការបញ្ជាទិញ");
      }
    } catch {
      alert("មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer countdown effect for KHQR
  useEffect(() => {
    if (!showQRModal || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQRModal, timeLeft]);

  // Polling effect for payment status
  useEffect(() => {
    if (!isPolling || !activeOrder?.orderNumber) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrder.orderNumber}/status`);
        const data = await res.json();

        if (data.success && data.order) {
          const order = data.order;
          if (order.paymentStatus === "PAID" || order.fulfillmentStatus === "COMPLETED") {
            // Payment success!
            setIsPolling(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setShowQRModal(false);

            setCompletedOrder({
              orderNumber: order.orderNumber,
              inGameNickname: order.inGameNickname || verifiedName,
              inGameUserId: order.inGameUserId,
              inGameZoneId: order.inGameZoneId,
              diamondsCount: order.diamondsCount,
              packageName: order.packageName,
              amountUSD: order.amountUSD,
              amountKHR: order.amountKHR,
              moogoldOrderId: order.moogoldOrderId,
              completedAt: order.completedAt || new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isPolling, activeOrder, verifiedName]);

  // Simulated Instant Scan & Pay (Development & Testing Helper)
  const handleSimulatePayment = async () => {
    if (!activeOrder?.orderNumber) return;
    setIsSimulatingPayment(true);

    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: activeOrder.orderNumber }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setIsPolling(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setShowQRModal(false);

        setCompletedOrder({
          orderNumber: data.order.orderNumber,
          inGameNickname: data.order.inGameNickname || verifiedName,
          inGameUserId: data.order.inGameUserId,
          inGameZoneId: data.order.inGameZoneId,
          diamondsCount: data.order.diamondsCount,
          packageName: data.order.packageName,
          amountUSD: data.order.amountUSD,
          amountKHR: data.order.amountKHR,
          moogoldOrderId: data.order.moogoldOrderId,
          completedAt: data.order.completedAt || new Date().toISOString(),
        });
      }
    } catch {
      alert("Simulation failed");
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Currency Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">ជ្រើសរើសរូបិយប័ណ្ណទូទាត់ (Payment Currency):</span>
        </div>
        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              currency === "USD"
                ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            USD ($)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("KHR")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              currency === "KHR"
                ? "bg-emerald-500 text-slate-950 shadow-neon-emerald"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            KHR (៛)
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 1: Game Account Input & Real-time Verification */}
      {/* ========================================================= */}
      <section className="rounded-2xl p-4 sm:p-6 lg:p-7 relative overflow-hidden bg-white dark:bg-[#0c101e] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-display font-bold text-sm">
              1
            </span>
            <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>ព័ត៌មានគណនីហ្គេម (Game Account)</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowIdGuide(true)}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            <span>របៀបស្វែងរក ID (Guide)</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className={`grid grid-cols-1 ${game.hasZoneId ? "sm:grid-cols-3" : "grid-cols-1"} gap-4`}>
            {/* User ID Input */}
            <div className={game.hasZoneId ? "sm:col-span-2" : "col-span-1"}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {game.userIdPlaceholder || "User ID (លេខសម្គាល់គណនី)"}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userId}
                  onChange={handleUserIdChange}
                  placeholder={game.userIdPlaceholder || "ឧទាហរណ៍: 12345678"}
                  className="w-full bg-slate-50 dark:bg-[#0a0d18] border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-display"
                />
              </div>
            </div>

            {/* Zone ID Input (if applicable) */}
            {game.hasZoneId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {game.zoneIdPlaceholder || "Zone ID (លេខតំបន់)"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={zoneId}
                  onChange={handleZoneIdChange}
                  placeholder="ឧទាហរណ៍: 2024"
                  className="w-full bg-slate-50 dark:bg-[#0a0d18] border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-display"
                />
              </div>
            )}
          </div>

          {/* Action Row: Verify Button & Status Badge */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleVerifyPlayerId}
              disabled={isVerifying || !userId.trim()}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 border border-slate-300 dark:border-cyan-500/30 font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isVerifying ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span>កំពុងផ្ទៀងផ្ទាត់ឈ្មោះ...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>ផ្ទៀងផ្ទាត់ឈ្មោះ (Verify In-Game Name)</span>
                </>
              )}
            </button>

            {/* Verified Glowing Badge */}
            {verifiedName && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-sm dark:shadow-neon-emerald animate-glow-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-xs">
                  ឈ្មោះគណនី: <strong className="font-bold text-slate-900 dark:text-white text-sm ml-1">{verifiedName}</strong>
                </span>
              </div>
            )}

            {/* Error Message */}
            {verifyError && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* STEP 2: Denomination Selector (Diamond Packages) */}
      {/* ========================================================= */}
      <section className="rounded-2xl p-4 sm:p-6 lg:p-7 bg-white dark:bg-[#0c101e] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-display font-bold text-xs sm:text-sm flex-shrink-0">
              2
            </span>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
              ជ្រើសរើសចំនួនពេជ្រ (Select Diamonds)
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {game.packages.length} កញ្ចប់
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {game.packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between overflow-hidden border ${
                  isSelected
                    ? "bg-cyan-50/70 dark:bg-[#0f172a] border-cyan-500 dark:border-cyan-400 shadow-md dark:shadow-neon-cyan scale-[1.02]"
                    : "bg-slate-50 dark:bg-[#0a0e1a]/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#0e1322]"
                }`}
              >
                {/* Badge if available */}
                {pkg.badgeText && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-bold text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-bl-lg font-display uppercase tracking-wider">
                    {pkg.badgeText}
                  </div>
                )}

                <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40"
                        : "bg-white dark:bg-slate-800/80 text-slate-400 border border-slate-200 dark:border-transparent"
                    }`}
                  >
                    <Diamond className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-slow text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {pkg.name}
                    </h3>
                    {pkg.bonusDiamonds > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{pkg.bonusDiamonds} Bonus
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing Tags */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-display text-cyan-600 dark:text-cyan-400">
                      {currency === "USD"
                        ? formatUSD(pkg.sellingPriceUSD)
                        : formatKHR(pkg.sellingPriceKHR)}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-display">
                      {currency === "USD"
                        ? formatKHR(pkg.sellingPriceKHR)
                        : formatUSD(pkg.sellingPriceUSD)}
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ml-1 ${
                      isSelected
                        ? "border-cyan-500 dark:border-cyan-400 bg-cyan-500 dark:bg-cyan-400"
                        : "border-slate-300 dark:border-slate-600 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white dark:text-slate-950 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* STEP 3: Payment Method (Bakong KHQR) */}
      {/* ========================================================= */}
      <section className="rounded-2xl p-4 sm:p-6 lg:p-7 bg-white dark:bg-[#0c101e] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center font-display font-bold text-xs sm:text-sm flex-shrink-0">
              3
            </span>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white">
              វិធីសាស្ត្រទូទាត់ប្រាក់ (Payment Method)
            </h2>
          </div>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold">
            ភ្លាមៗ 100% ស្វ័យប្រវត្តិ
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-rose-50 to-white dark:from-[#0c1424] dark:to-[#0a0d18] border-2 border-red-400/50 dark:border-red-500/40 relative overflow-hidden shadow-sm dark:shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#c51f26] flex items-center justify-center text-white font-display font-black text-[10px] sm:text-xs shadow-md p-1 flex-shrink-0">
                <span className="tracking-tighter text-center leading-none">KHQR<br />BAKONG</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Bakong KHQR ស្វ័យប្រវត្តិ
                  </h3>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 font-bold">
                    Official NBC
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  ស្កេនបានគ្រប់ធនាគារទាំងអស់៖ ABA, ACLEDA, Wing, Canadia, Sathapana & More
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className="w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-white dark:text-slate-950 stroke-[3]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">បានជ្រើសរើស (Selected)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Checkout Summary & Action Button */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#0c1326] dark:via-[#101b34] dark:to-[#0c1326] border border-cyan-500/40 shadow-lg dark:shadow-neon-cyan flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">សរុបទឹកប្រាក់ត្រូវទូទាត់ (Total Amount):</div>
          <div className="flex items-baseline justify-center md:justify-start gap-2.5 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:to-emerald-300">
              {selectedPackage
                ? currency === "USD"
                  ? formatUSD(selectedPackage.sellingPriceUSD)
                  : formatKHR(selectedPackage.sellingPriceKHR)
                : "$0.00"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-display">
              {selectedPackage
                ? currency === "USD"
                  ? `≈ ${formatKHR(selectedPackage.sellingPriceKHR)}`
                  : `≈ ${formatUSD(selectedPackage.sellingPriceUSD)}`
                : ""}
            </span>
          </div>
          {verifiedName && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center md:justify-start gap-1 font-semibold pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>គណនីទទួលពេជ្រ: {verifiedName}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenCheckout}
          disabled={isSubmitting || !selectedPackage}
          className="w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-neon-cyan hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-slate-950 flex-shrink-0" />
              <span>កំពុងបង្កើត QR Code...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-slate-950 group-hover:animate-bounce flex-shrink-0" />
              <span>ទូទាត់ប្រាក់តាម KHQR (Pay with KHQR)</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: Guide "Where is my ID?" */}
      {/* ========================================================= */}
      {showIdGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <span>របៀបស្វែងរក ID ក្នុង {game.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIdGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-medium text-cyan-700 dark:text-cyan-300">{game.guideTextKh}</p>
                <p className="text-slate-500 dark:text-slate-400 italic">{game.guideTextEn}</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 text-slate-700 dark:text-slate-300">
                <h4 className="font-bold text-cyan-800 dark:text-cyan-300 mb-1">ឧទាហរណ៍ជាក់ស្តែង:</h4>
                <p>ប្រសិនបើក្នុងហ្គេមបង្ហាញ: <span className="font-mono text-slate-900 dark:text-white font-bold">User ID: 12345678 (2024)</span></p>
                <p className="mt-1">
                  👉 សូមបញ្ចូល <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">12345678</span> ក្នុងប្រអប់ User ID និង{" "}
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">2024</span> ក្នុងប្រអប់ Zone ID។
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIdGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors"
            >
              យល់ព្រម (Close)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Dynamic Bakong KHQR Modal with 3-Min Countdown */}
      {/* ========================================================= */}
      {showQRModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#0b101d] border border-cyan-500/40 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative space-y-4 sm:space-y-5 overflow-hidden max-h-[92vh] overflow-y-auto">
            {/* Top Red KHQR Banner */}
            <div className="relative -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 bg-[#d32f2f] text-white py-2.5 sm:py-3 px-4 sm:px-6 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-white flex-shrink-0" />
                <span className="font-display font-extrabold text-xs sm:text-sm tracking-wider uppercase">
                  Bakong KHQR
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowQRModal(false);
                  setIsPolling(false);
                }}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Countdown Alert */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
                <span>QR ផុតកំណត់ក្នុងរយៈពេល:</span>
              </div>
              <div className={`font-display font-black text-sm ${timeLeft < 30 ? "text-red-500 animate-bounce" : "text-amber-600 dark:text-amber-400"}`}>
                {formatTimer(timeLeft)}
              </div>
            </div>

            {/* QR Code Canvas / Image Display */}
            <div className="relative flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 dark:border-transparent shadow-inner mx-auto max-w-[280px]">
              {/* Bakong Logo Badge Overlay in center */}
              <div className="relative w-[230px] h-[230px]">
                <Image
                  src={activeOrder.qrCodeDataUrl}
                  alt="Bakong KHQR"
                  width={230}
                  height={230}
                  className="rounded-lg object-contain"
                  unoptimized
                />
              </div>
              <div className="text-[11px] font-bold text-slate-800 tracking-wider mt-2 font-display uppercase">
                ANAJAK DIAMOND • PHNOM PENH
              </div>
            </div>

            {/* Order Details & Copy Buttons */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">ចំនួនទឹកប្រាក់ (Amount):</span>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {activeOrder.currency === "USD"
                      ? formatUSD(activeOrder.amountUSD)
                      : formatKHR(activeOrder.amountKHR)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activeOrder.currency === "USD"
                          ? activeOrder.amountUSD.toString()
                          : activeOrder.amountKHR.toString(),
                        "amount"
                      )
                    }
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {copiedField === "amount" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">លេខកូដបញ្ជាទិញ (Order ID):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-700 dark:text-cyan-300 font-bold">
                    {activeOrder.orderNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeOrder.orderNumber, "orderId")}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {copiedField === "orderId" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Tap ABA Mobile App Button (if deeplink available) */}
            {activeOrder.abapayDeeplink && (
              <div className="space-y-1.5 pt-1">
                <a
                  href={activeOrder.abapayDeeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#005f82] hover:bg-[#004a66] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#005f82]/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Smartphone className="w-4 h-4 text-cyan-300 animate-pulse flex-shrink-0" />
                  <span>បើកក្នុងកម្មវិធី ABA Mobile (1-Tap Pay)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                </a>
                <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
                  📱 សម្រាប់អ្នកប្រើទូរស័ព្ទ៖ ចុចប៊ូតុងខាងលើដើម្បីបើកកម្មវិធី ABA Mobile បង់ភ្លាមៗ
                </p>
              </div>
            )}

            {/* Status Pulse Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 py-1 font-medium">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>កំពុងរង់ចាំការទូទាត់ប្រាក់ពីធនាគារ (Awaiting Payment)...</span>
            </div>

            {/* Simulation Button for Testing/Dev Evaluation */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulatingPayment}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-neon-emerald transition-all"
              >
                {isSimulatingPayment ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>កំពុងដំណើរការបំពេញពេជ្រ...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ សាកល្បងស្កេនបង់ប្រាក់ភ្លាមៗ (Simulate Scan & Pay)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1.5">
                (ចុចប៊ូតុងខាងលើដើម្បីសាកល្បងដំណើរការ Webhook និង MooGold Fulfillment)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Real-time Order Completion & Instant Delivery Receipt */}
      {/* ========================================================= */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#0b101f] border-2 border-emerald-500/50 rounded-3xl max-w-md w-full p-6 shadow-xl dark:shadow-neon-emerald space-y-5 text-center relative overflow-hidden">
            {/* Shimmer Ambient Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 dark:border-emerald-400 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-neon-emerald">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold font-display uppercase tracking-wider">
                COMPLETED & DELIVERED
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                បញ្ចូលពេជ្រជោគជ័យ!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ពេជ្ររបស់អ្នកត្រូវបានបញ្ជូនចូលក្នុងហ្គេមរួចរាល់ 100%
              </p>
            </div>

            {/* Receipt Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070c17] border border-slate-200 dark:border-slate-800 text-xs text-left space-y-2.5">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">ហ្គេម (Game):</span>
                <span className="font-bold text-slate-900 dark:text-white">{game.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">ឈ្មោះក្នុងហ្គេម (Player):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {completedOrder.inGameNickname || "ProSlayer_KH 🇰🇭"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">User ID:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {completedOrder.inGameUserId} {completedOrder.inGameZoneId ? `(${completedOrder.inGameZoneId})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">កញ្ចប់ពេជ្រ (Item):</span>
                <span className="font-bold text-cyan-700 dark:text-cyan-300">
                  {completedOrder.packageName} ({completedOrder.diamondsCount} ពេជ្រ)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">MooGold Order ID:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {completedOrder.moogoldOrderId || "MG-882391"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">លេខវិក្កយបត្រ (Ref):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{completedOrder.orderNumber}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert("វិក្កយបត្រត្រូវបានរក្សាទុកដោយជោគជ័យ!");
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-300 dark:border-slate-700 shadow-sm"
              >
                <Download className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>ទាញយកវិក្កយបត្រ (Save Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompletedOrder(null);
                  setActiveOrder(null);
                  setUserId("");
                  setZoneId("");
                  setVerifiedName(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-neon-cyan hover:scale-[1.01]"
              >
                ធ្វើការបញ្ជាទិញម្តងទៀត (Top-up More)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
