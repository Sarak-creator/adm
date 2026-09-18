"use client";

import React, { useState, useEffect } from "react";
import {
  LandingPageConfig,
  SectionId,
  ALL_SECTION_METADATA,
  DEFAULT_LANDING_CONFIG,
} from "@/lib/landing-config";
import {
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Flame,
  Zap,
  ShieldCheck,
  CreditCard,
  Gamepad2,
  Diamond,
  Headphones,
  Plus,
  Trash2,
  HelpCircle,
  Layers,
  Palette,
  LayoutGrid,
  Send,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";

interface LandingCustomizerProps {
  onShowToast: (msg: string, type?: "success" | "error") => void;
}

export function LandingCustomizer({ onShowToast }: LandingCustomizerProps) {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    "theme" | "sections" | "hero" | "ticker" | "catalog" | "how_it_works" | "features" | "faq" | "support"
  >("theme");

  // File upload state for Hero background
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // Fetch current configuration
  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings/landing");
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error(e);
      onShowToast("មិនអាចទាញទិន្នន័យ Layout បានទេ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save updated configuration
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(data.message || "បានរក្សាទុកការកែសម្រួលផ្ទាំងដើមដោយជោគជ័យ!", "success");
        if (data.config) setConfig(data.config);
      } else {
        onShowToast(data.error || "បរាជ័យក្នុងការរក្សាទុក", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      onShowToast(err.message || "Error saving config", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle live theme change
  const handleApplyTheme = async (mode: "dark" | "light") => {
    setConfig((prev) => ({ ...prev, themeMode: mode }));
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeMode: mode }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          const channel = new BroadcastChannel("anajak_theme_channel");
          channel.postMessage({ type: "THEME_CHANGED", themeMode: mode });
          channel.close();
        } catch {}
        try {
          localStorage.setItem("anajak_theme_mode", mode);
        } catch {}
        onShowToast(
          mode === "light"
            ? "បានប្តូរទៅ របៀបពន្លឺ (Light Mode) ជោគជ័យ! Landing page បានផ្លាស់ប្តូរផ្ទាល់ភ្លាមៗ។"
            : "បានប្តូរទៅ របៀបងងឹត (Dark Mode) ជោគជ័យ! Landing page បានផ្លាស់ប្តូរផ្ទាល់ភ្លាមៗ。",
          "success"
        );
      } else {
        onShowToast(data.error || "បរាជ័យក្នុងការប្តូរ Theme", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      onShowToast(err.message, "error");
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (
      !confirm(
        "តើអ្នកពិតជាចង់កំណត់ទម្រង់ផ្ទាំងដើម (Landing Layout) មកកាន់ទម្រង់ដើមដូចរោងចក្រ (Default Factory Settings) វិញមែនទេ?"
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/settings/landing", { method: "DELETE" });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        onShowToast("បានកំណត់ទម្រង់ដើមវិញរួចរាល់!", "success");
      } else {
        onShowToast(data.error || "បរាជ័យក្នុងការកំណត់ឡើងវិញ", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      onShowToast(err.message, "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Move section in order
  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.sectionsOrder.length) return;

    const newOrder = [...config.sectionsOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setConfig((prev) => ({
      ...prev,
      sectionsOrder: newOrder,
    }));
  };

  // Toggle section visibility
  const toggleVisibility = (id: SectionId) => {
    setConfig((prev) => ({
      ...prev,
      sectionsVisibility: {
        ...prev.sectionsVisibility,
        [id]: !prev.sectionsVisibility[id],
      },
    }));
  };

  // Upload hero background image
  const handleBgUpload = async (file: File) => {
    setIsUploadingBg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setConfig((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            backgroundImageUrl: data.url,
          },
        }));
        onShowToast("បាន Upload រូបភាព Hero Background រួចរាល់!");
      } else {
        onShowToast(data.error || "Upload បរាជ័យ", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      onShowToast(err.message, "error");
    } finally {
      setIsUploadingBg(false);
    }
  };

  // Ticker item helpers
  const handleAddTickerItem = () => {
    setConfig((prev) => ({
      ...prev,
      ticker: {
        ...prev.ticker,
        customItems: [
          ...prev.ticker.customItems,
          "Gamer_Pro 🇰🇭 ទើបតែទិញ 296 Diamonds (MLBB) តាម Bakong KHQR",
        ],
      },
    }));
  };

  const handleUpdateTickerItem = (idx: number, val: string) => {
    const next = [...config.ticker.customItems];
    next[idx] = val;
    setConfig((prev) => ({
      ...prev,
      ticker: { ...prev.ticker, customItems: next },
    }));
  };

  const handleDeleteTickerItem = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      ticker: {
        ...prev.ticker,
        customItems: prev.ticker.customItems.filter((_, i) => i !== idx),
      },
    }));
  };

  // FAQ item helpers
  const handleAddFAQ = () => {
    const newId = `faq-${Date.now()}`;
    setConfig((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [
          ...prev.faq.items,
          {
            id: newId,
            question: "សំណួរថ្មីអំពីការបញ្ចូលពេជ្រ?",
            answer: "ចម្លើយលម្អិតសម្រាប់អតិថិជន...",
          },
        ],
      },
    }));
  };

  const handleUpdateFAQ = (id: string, field: "question" | "answer", val: string) => {
    setConfig((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((item) =>
          item.id === id ? { ...item, [field]: val } : item
        ),
      },
    }));
  };

  const handleDeleteFAQ = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.filter((item) => item.id !== id),
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border-slate-800 space-y-3">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
        <p className="text-xs text-slate-400">កំពុងទាញទិន្នន័យ Landing Page Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="glass-card rounded-2xl p-4 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              កែសម្រួលផ្ទាំងដើម (Landing Page Layout & Content)
            </h2>
            <p className="text-xs text-slate-400">
              រៀបចំលំដាប់ផ្នែក (Section Ordering), បើក/បិទផ្នែក, និងកែប្រែអត្ថបទ/រូបភាពផ្ទាល់
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
            title="Open Landing Page in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>មើលផ្ទាំងដើម (Live Preview)</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>កំណត់ដើមវិញ (Reset)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុក (Save Changes)"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: "theme", label: "ម៉ូដពន្លឺ/ងងឹត (Theme Mode)", icon: Sun },
          { id: "sections", label: "លំដាប់ផ្នែក & បើក/បិទ (Sections Order)", icon: Layers },
          { id: "hero", label: "ផ្ទាំងធំ (Hero Banner)", icon: Sparkles },
          { id: "ticker", label: "របាររំកិល (Live Ticker)", icon: Flame },
          { id: "catalog", label: "បញ្ជីហ្គេម (Catalog Grid)", icon: LayoutGrid },
          { id: "how_it_works", label: "3 ជំហាន (How It Works)", icon: Zap },
          { id: "features", label: "ហេតុអ្វីជ្រើសរើស (Features)", icon: ShieldCheck },
          { id: "faq", label: "សំណួរ-ចម្លើយ (FAQ)", icon: HelpCircle },
          { id: "support", label: "ជំនួយអតិថិជន (Support)", icon: Headphones },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 0. THEME MODE (DARK / LIGHT) LIVE SWITCHER               */}
      {/* ========================================================= */}
      {activeSubTab === "theme" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold font-mono uppercase">
                  ADMIN ONLY CONTROL
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>ការកំណត់ Theme Mode (Dark Mode & Light Mode)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                មានតែអ្នកគ្រប់គ្រង (Admin) ប៉ុណ្ណោះដែលអាចកំណត់ Dark ឬ Light Mode បាន។ នៅពេលលោកអ្នកចុចជ្រើសរើស គេហទំព័រ Landing Page និងទំព័រទាំងអស់នឹងផ្លាស់ប្តូរផ្ទាល់ភ្លាមៗ (Real-time Live Change) ដោយមិនបាច់ Refresh ឡើយ!
              </p>
            </div>

            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-display bg-slate-900 border-slate-700 text-slate-200">
                <span>Current Mode:</span>
                <span className={config.themeMode === "light" ? "text-amber-400 uppercase" : "text-cyan-400 uppercase"}>
                  {config.themeMode === "light" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Dark Mode */}
            <div
              onClick={() => handleApplyTheme("dark")}
              className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                config.themeMode === "dark"
                  ? "bg-[#090e1c] border-cyan-400 shadow-neon-cyan scale-[1.01]"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Selected Badge */}
              {config.themeMode === "dark" && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold shadow-md">
                  <Check className="w-3 h-3" />
                  <span>កំពុងប្រើ (Active)</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>របៀបងងឹត (Dark Mode)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">Cyberpunk Gaming Theme</p>
                </div>
              </div>

              {/* Visual Mini Mockup Preview */}
              <div className="mt-4 rounded-xl bg-[#060913] border border-slate-800 p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="h-2 w-16 bg-cyan-500/60 rounded" />
                  <div className="h-2 w-8 bg-emerald-500/60 rounded" />
                </div>
                <div className="h-8 rounded-lg bg-slate-900/90 border border-cyan-500/20 flex items-center px-2">
                  <div className="h-2 w-24 bg-slate-400 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="h-6 rounded bg-[#0d111e] border border-slate-800" />
                  <div className="h-6 rounded bg-[#0d111e] border border-slate-800" />
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✓</span>
                  <span>ផ្ទៃខាងក្រោយពណ៌ខ្មៅរលោង Cyberpunk Space Navy</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✓</span>
                  <span>ពន្លឺ Neon Glow ពណ៌ Cyan, Emerald និង Gold</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✓</span>
                  <span>ស័ក្តិសមបំផុតសម្រាប់ការលេងហ្គេម និងកាត់បន្ថយការចាំងភ្នែក</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyTheme("dark");
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    config.themeMode === "dark"
                      ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{config.themeMode === "dark" ? "កំពុងបើកដំណើរការ (Active)" : "ប្តូរទៅ Dark Mode"}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Light Mode */}
            <div
              onClick={() => handleApplyTheme("light")}
              className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                config.themeMode === "light"
                  ? "bg-slate-900 border-amber-400 shadow-amber-500/20 scale-[1.01]"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Selected Badge */}
              {config.themeMode === "light" && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold shadow-md">
                  <Check className="w-3 h-3" />
                  <span>កំពុងប្រើ (Active)</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>របៀបពន្លឺ (Light Mode)</span>
                  </h4>
                  <p className="text-[11px] text-amber-300 font-mono">Clean Modern Gaming Theme</p>
                </div>
              </div>

              {/* Visual Mini Mockup Preview */}
              <div className="mt-4 rounded-xl bg-[#f8fafc] border border-slate-300 p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="h-2 w-16 bg-cyan-600 rounded" />
                  <div className="h-2 w-8 bg-emerald-600 rounded" />
                </div>
                <div className="h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center px-2">
                  <div className="h-2 w-24 bg-slate-700 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="h-6 rounded bg-white border border-slate-200 shadow-sm" />
                  <div className="h-6 rounded bg-white border border-slate-200 shadow-sm" />
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✓</span>
                  <span>ផ្ទៃខាងក្រោយពណ៌សភ្លឺស្អាត Crisp Slate-50 & Clean White</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✓</span>
                  <span>អក្សរដិតស្រឡះភ្នែក Slate-900 និងកាត Elevate ទាន់សម័យ</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✓</span>
                  <span>ស័ក្តិសមសម្រាប់អ្នកចូលចិត្តទិញពេជ្រពេលថ្ងៃ ស្រឡះភ្នែក និងស្អាតប្លែក</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyTheme("light");
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    config.themeMode === "light"
                      ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{config.themeMode === "light" ? "កំពុងបើកដំណើរការ (Active)" : "ប្តូរទៅ Light Mode"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 1. SECTIONS ORDER & VISIBILITY MANAGER */}
      {/* ========================================================= */}
      {activeSubTab === "sections" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>រៀបចំលំដាប់ផ្នែកនៅលើផ្ទាំងដើម (Section Order & Visibility)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ចុចប៊ូតុង &ldquo;ឡើងលើ&rdquo; ឬ &ldquo;ចុះក្រោម&rdquo; ដើម្បីផ្លាស់ប្តូរទីតាំងផ្នែក និងចុចរូបភ្នែកដើម្បីបង្ហាញ ឬលាក់
            </p>
          </div>

          <div className="space-y-2.5">
            {config.sectionsOrder.map((sectionId, idx) => {
              const meta = ALL_SECTION_METADATA.find((m) => m.id === sectionId);
              const isVisible = config.sectionsVisibility[sectionId] !== false;

              return (
                <div
                  key={sectionId}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isVisible
                      ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/60 border-slate-900 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-mono font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {meta?.nameKh || sectionId}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({sectionId})
                        </span>
                        {!isVisible && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950 text-red-400 border border-red-800">
                            លាក់ (Hidden)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {meta?.descKh || meta?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, "up")}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === config.sectionsOrder.length - 1}
                      onClick={() => moveSection(idx, "down")}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleVisibility(sectionId)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isVisible
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>បង្ហាញ (Shown)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>លាក់ (Hidden)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 2. HERO BANNER CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "hero" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>កែសម្រួលផ្ទាំងធំ (Hero Banner Configuration)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ប្តូរចំណងជើង, Background Image, CTA Button, និង Color Theme
            </p>
          </div>

          {/* Theme Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Color Theme Accent (ពណ៌ពន្លឺនៃ Hero Banner)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "cyan", name: "Cyan Neon (លំនាំដើម)", color: "from-cyan-500 to-emerald-400" },
                { id: "emerald", name: "Emerald Glow", color: "from-emerald-500 to-cyan-400" },
                { id: "amber", name: "Royal Amber/Gold", color: "from-amber-500 to-orange-400" },
                { id: "purple", name: "Deep Violet Neon", color: "from-purple-500 to-pink-400" },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, themeColor: th.id as typeof prev.hero.themeColor },
                    }))
                  }
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    config.hero.themeColor === th.id
                      ? "bg-slate-900 border-cyan-400 shadow-neon-cyan/20 ring-1 ring-cyan-400"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${th.color} shadow`} />
                  <span className="text-xs font-bold text-white">{th.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Titles & Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើងខាងដើម (Title Prefix)
              </label>
              <input
                type="text"
                value={config.hero.titlePrefix}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, titlePrefix: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="អាណាចក្រ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ពាក្យបំភ្លឺពណ៌ (Highlighted Word) *
              </label>
              <input
                type="text"
                value={config.hero.titleHighlight}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, titleHighlight: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-bold focus:outline-none focus:border-cyan-400"
                placeholder="Diamond"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើងចុងក្រោយ (Title Suffix)
              </label>
              <input
                type="text"
                value={config.hero.titleSuffix}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, titleSuffix: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="កម្ពុជា"
              />
            </div>
          </div>

          {/* Badge & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                អត្ថបទផ្លាកខាងលើ (Badge Pill Text)
              </label>
              <input
                type="text"
                value={config.hero.badgeText}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, badgeText: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="វេទិកាបញ្ចូលពេជ្រហ្គេមស្វ័យប្រវត្តិកំពូលនៅកម្ពុជា"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                អត្ថបទពិពណ៌នា (Hero Subtitle / Description)
              </label>
              <textarea
                rows={3}
                value={config.hero.description}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, description: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ប៊ូតុងបញ្ជាទិញ (CTA Button Text)
              </label>
              <input
                type="text"
                value={config.hero.ctaText}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, ctaText: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="បញ្ចូលពេជ្រ MLBB ឥឡូវនេះ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link ប៊ូតុង (CTA Link URL)
              </label>
              <input
                type="text"
                value={config.hero.ctaLink}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, ctaLink: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                placeholder="/games/mobile-legends"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ផ្លាកសម្ព័ន្ធដៃគូ (Secondary Badge)
              </label>
              <input
                type="text"
                value={config.hero.secondaryBadgeText}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, secondaryBadgeText: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="MooGold Live Reseller API"
              />
            </div>
          </div>

          {/* Background Image Upload & URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Hero Background Image Art (រូបភាពផ្ទៃខាងក្រោយ Hero)
              </label>
              <label className="cursor-pointer px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/30 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingBg ? "កំពុង Upload..." : "Upload រូបភាពថ្មី"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingBg}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleBgUpload(f);
                  }}
                />
              </label>
            </div>

            <div className="flex gap-3 items-center">
              {config.hero.backgroundImageUrl && (
                <div className="relative w-28 h-16 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                  <img
                    src={config.hero.backgroundImageUrl}
                    alt="Hero Preview"
                    className="w-full h-full object-cover"
                    style={{ opacity: (config.hero.bgOpacity ?? 45) / 100 }}
                  />
                </div>
              )}
              <input
                type="text"
                value={config.hero.backgroundImageUrl}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, backgroundImageUrl: e.target.value },
                  }))
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                placeholder="e.g. /images/hero-bg.jpg or https://..."
              />
            </div>

            {/* Hero Card Opacity Slider Control */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>កម្រិតពន្លឺថ្លាផ្ទៃ Hero Card (Hero Card Opacity)</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    កំណត់កម្រិតភាពច្បាស់នៃរូបភាពផ្ទៃខាងក្រោយ Hero Banner (0% = ងងឹតសុទ្ធ / 100% = ភ្លឺពេញលេញ)
                  </p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs">
                  {config.hero.bgOpacity ?? 45}%
                </div>
              </div>

              {/* Range Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-mono">0%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={config.hero.bgOpacity ?? 45}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: {
                        ...prev.hero,
                        bgOpacity: parseInt(e.target.value, 10),
                      },
                    }))
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[11px] text-slate-500 font-mono">100%</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Presets:</span>
                {[
                  { label: "ស្រអាប់ទន់ (20%)", val: 20 },
                  { label: "លំនាំដើម (35%)", val: 35 },
                  { label: "មធ្យម (50%)", val: 50 },
                  { label: "ច្បាស់ (70%)", val: 70 },
                  { label: "ភ្លឺខ្លាំង (100%)", val: 100 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: {
                          ...prev.hero,
                          bgOpacity: preset.val,
                        },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      (config.hero.bgOpacity ?? 45) === preset.val
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm"
                        : "bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. LIVE TICKER CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "ticker" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>កែសម្រួលរបាររំកិលការទិញចុងក្រោយ (Live Orders Ticker)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              កែសម្រួលសារ និងព័ត៌មានដែលរំកិលបង្ហាញនៅលើកំពូលនៃផ្ទាំងដើម
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">
                បើកដំណើរការ Live Orders Ticker
              </span>
              <span className="text-[11px] text-slate-400">
                បង្ហាញរបាររំកិលការទិញចុងក្រោយភ្លាមៗ
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.ticker.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    ticker: { ...prev.ticker, enabled: e.target.checked },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ស្លាកចំណងជើងរបារ (Ticker Heading Label)
            </label>
            <input
              type="text"
              value={config.ticker.label}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  ticker: { ...prev.ticker, label: e.target.value },
                }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              placeholder="ការទិញចុងក្រោយ (Live Orders):"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                បញ្ជីសាររំកិល (Ticker Message Items)
              </label>
              <button
                type="button"
                onClick={handleAddTickerItem}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ បន្ថែមសារថ្មី</span>
              </button>
            </div>

            <div className="space-y-2">
              {config.ticker.customItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-mono text-slate-500">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateTickerItem(idx, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteTickerItem(idx)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-red-400 transition-colors border border-slate-700"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. GAMES CATALOG GRID CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "catalog" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>កែសម្រួលតារាងកាតហ្គេម (Catalog Grid Configuration)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ជ្រើសរើសចំនួនជួរឈរ (Columns), បើក/បិទ Search Bar, និងចំណងជើងផ្នែក
            </p>
          </div>

          {/* Columns Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              ចំនួនជួរឈរនៅលើកុំព្យូទ័រ (Desktop Grid Columns)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      gamesCatalog: {
                        ...prev.gamesCatalog,
                        columns: col as 2 | 3 | 4,
                      },
                    }))
                  }
                  className={`p-4 rounded-xl border text-center transition-all ${
                    config.gamesCatalog.columns === col
                      ? "bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 text-white shadow-neon-cyan/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-lg font-black font-display block">
                    {col} Columns
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {col === 2
                      ? "កាតទំហំធំ (Large Cards)"
                      : col === 3
                      ? "ស្តង់ដារ (Standard / Recommended)"
                      : "កាតទំហំតូចបង្រួម (Compact 4-Cols)"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search bar toggle */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">
                បើកប្រអប់ស្វែងរកហ្គេម (Search Bar on Catalog)
              </span>
              <span className="text-[11px] text-slate-400">
                អនុញ្ញាតឱ្យអ្នកប្រើប្រាស់វាយឈ្មោះហ្គេមដើម្បីស្វែងរកភ្លាមៗ
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.gamesCatalog.showSearchBar}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    gamesCatalog: {
                      ...prev.gamesCatalog,
                      showSearchBar: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
            </label>
          </div>

          {/* Headings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ផ្លាកខាងលើ (Section Badge)
              </label>
              <input
                type="text"
                value={config.gamesCatalog.badge}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    gamesCatalog: { ...prev.gamesCatalog, badge: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ស្លាកពេញនិយម (Featured Game Badge)
              </label>
              <input
                type="text"
                value={config.gamesCatalog.featuredBadgeText}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    gamesCatalog: {
                      ...prev.gamesCatalog,
                      featuredBadgeText: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="ពេញនិយមបំផុត (Top 1)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើងធំ (Catalog Heading)
              </label>
              <input
                type="text"
                value={config.gamesCatalog.title}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    gamesCatalog: { ...prev.gamesCatalog, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើងរង (Catalog Subtitle)
              </label>
              <input
                type="text"
                value={config.gamesCatalog.subtitle}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    gamesCatalog: { ...prev.gamesCatalog, subtitle: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. HOW IT WORKS (3 STEPS) CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "how_it_works" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>កែសម្រួលផ្នែក 3 ជំហាន (How It Works Steps)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ការណែនាំពីរបៀបបញ្ចូលពេជ្រងាយៗសម្រាប់អតិថិជន
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ផ្លាកខាងលើ (Badge)
              </label>
              <input
                type="text"
                value={config.howItWorks.badge}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    howItWorks: { ...prev.howItWorks, badge: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើង (Title)
              </label>
              <input
                type="text"
                value={config.howItWorks.title}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    howItWorks: { ...prev.howItWorks, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ពាក្យបំភ្លឺពណ៌ (Title Highlight)
              </label>
              <input
                type="text"
                value={config.howItWorks.titleHighlight}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    howItWorks: { ...prev.howItWorks, titleHighlight: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {config.howItWorks.steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">
                    ជំហាន {step.stepNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Icon: {step.icon}</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ចំណងជើងជំហាន (Step Title)
                  </label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => {
                      const next = [...config.howItWorks.steps];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setConfig((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, steps: next },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ការពិពណ៌នា (Step Description)
                  </label>
                  <textarea
                    rows={3}
                    value={step.description}
                    onChange={(e) => {
                      const next = [...config.howItWorks.steps];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setConfig((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, steps: next },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 6. WHY CHOOSE US (FEATURES) CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "features" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>កែសម្រួលផ្នែក &ldquo;ហេតុអ្វីជ្រើសរើសយើងខ្ញុំ&rdquo; (Why Choose Us)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ចំណុចលេចធ្លោ សុវត្ថិភាព និងភាពរហ័សរហួននៃសេវាកម្ម
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើង (Title)
              </label>
              <input
                type="text"
                value={config.whyChooseUs.title}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    whyChooseUs: { ...prev.whyChooseUs, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ពាក្យបំភ្លឺពណ៌ (Title Highlight)
              </label>
              <input
                type="text"
                value={config.whyChooseUs.titleHighlight}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    whyChooseUs: { ...prev.whyChooseUs, titleHighlight: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Features Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {config.whyChooseUs.features.map((feat, idx) => (
              <div
                key={feat.id || idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    ចំណុច {idx + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Icon: {feat.icon}</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ចំណងជើង (Feature Title)
                  </label>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => {
                      const next = [...config.whyChooseUs.features];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setConfig((prev) => ({
                        ...prev,
                        whyChooseUs: { ...prev.whyChooseUs, features: next },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ការពិពណ៌នា (Description)
                  </label>
                  <textarea
                    rows={4}
                    value={feat.description}
                    onChange={(e) => {
                      const next = [...config.whyChooseUs.features];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setConfig((prev) => ({
                        ...prev,
                        whyChooseUs: { ...prev.whyChooseUs, features: next },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 7. FAQ CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "faq" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>កែសម្រួលសំណួរ-ចម្លើយ (FAQ Questions & Answers)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                បន្ថែម កែប្រែ ឬលុបសំណួរដែលសួរញឹកញាប់នៅលើផ្ទាំងដើម
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFAQ}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-neon-cyan transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ បន្ថែមសំណួរថ្មី</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើងធំ (FAQ Title)
              </label>
              <input
                type="text"
                value={config.faq.title}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    faq: { ...prev.faq, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើងរង (FAQ Subtitle)
              </label>
              <input
                type="text"
                value={config.faq.subtitle}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    faq: { ...prev.faq, subtitle: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {config.faq.items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">
                    សំណួរ #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFAQ(item.id)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-red-950/60 text-red-400 border border-slate-700 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    សំណួរ (Question)
                  </label>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => handleUpdateFAQ(item.id, "question", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ចម្លើយ (Answer)
                  </label>
                  <textarea
                    rows={3}
                    value={item.answer}
                    onChange={(e) => handleUpdateFAQ(item.id, "answer", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 8. SUPPORT / CONTACT BANNER CUSTOMIZER */}
      {/* ========================================================= */}
      {activeSubTab === "support" && (
        <section className="glass-card rounded-2xl p-6 border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span>កែសម្រួលផ្ទាំងជំនួយអតិថិជន (Support & Contact Banner)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ព័ត៌មានទាក់ទងមកកាន់ Telegram Support 24/7
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ផ្លាកសម្គាល់ (Badge)
              </label>
              <input
                type="text"
                value={config.supportBanner.badge}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportBanner: { ...prev.supportBanner, badge: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ចំណងជើង (Banner Title)
              </label>
              <input
                type="text"
                value={config.supportBanner.title}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportBanner: { ...prev.supportBanner, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ការពិពណ៌នា (Description)
              </label>
              <textarea
                rows={2}
                value={config.supportBanner.description}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportBanner: { ...prev.supportBanner, description: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telegram Username
              </label>
              <input
                type="text"
                value={config.supportBanner.telegramUsername}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportBanner: { ...prev.supportBanner, telegramUsername: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                placeholder="@AnajakDiamondSupport"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telegram Direct Link
              </label>
              <input
                type="text"
                value={config.supportBanner.telegramLink}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportBanner: { ...prev.supportBanner, telegramLink: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                placeholder="https://t.me/AnajakDiamondSupport"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                អត្ថបទប៊ូតុង (Button Text)
              </label>
              <input
                type="text"
                value={config.supportBanner.buttonText}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportBanner: { ...prev.supportBanner, buttonText: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
