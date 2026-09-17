"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Diamond,
  Gamepad2,
  Zap,
  ShieldCheck,
  Menu,
  X,
  Flame,
  Headset,
  Home,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-purple-950/70 to-emerald-950/70 border-b border-cyan-500/20 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs text-center font-medium flex items-center justify-center gap-2 sm:gap-3">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="text-cyan-300 truncate">
          ⚡ ប្រព័ន្ធស្វ័យប្រវត្តិ 24/7 (Instant Bakong KHQR Fulfillment)
        </span>
        <span className="hidden sm:inline text-slate-500">|</span>
        <span className="hidden sm:inline text-amber-300 font-display">
          🇰🇭 $1 = 4,100 ៛
        </span>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN NAVBAR */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#070a14]/90 border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-amber-300 p-0.5 shadow-neon-cyan group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-[#090e1c] rounded-[10px] flex items-center justify-center">
                <Diamond className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400 group-hover:text-emerald-300 transition-colors animate-pulse-slow" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 tracking-tight leading-tight">
                  អាណាចក្រDiamond
                </span>
                <span className="px-1 py-0.2 text-[9px] sm:text-[10px] font-bold uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-display">
                  PRO
                </span>
              </div>
              <span className="text-[9px] sm:text-[11px] text-slate-400 font-display font-medium tracking-wider">
                DIAMOND KINGDOM KH
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`flex items-center gap-1.5 transition-colors ${
                pathname === "/" ? "text-cyan-400 font-bold" : "text-slate-300 hover:text-cyan-400"
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>បញ្ជីហ្គេម (Games)</span>
            </Link>
            <Link
              href="/games/mobile-legends"
              className={`transition-colors flex items-center gap-1 ${
                pathname === "/games/mobile-legends"
                  ? "text-emerald-400 font-bold"
                  : "text-slate-300 hover:text-emerald-400"
              }`}
            >
              <span>MLBB ពេជ្រ</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded border border-emerald-500/30">
                HOT
              </span>
            </Link>
            <Link
              href="/games/free-fire"
              className={`transition-colors text-xs ${
                pathname === "/games/free-fire" ? "text-amber-400 font-bold" : "text-slate-300 hover:text-amber-400"
              }`}
            >
              Free Fire
            </Link>
            <Link
              href="/games/pubg-mobile"
              className={`transition-colors text-xs ${
                pathname === "/games/pubg-mobile" ? "text-orange-400 font-bold" : "text-slate-300 hover:text-orange-400"
              }`}
            >
              PUBG UC
            </Link>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Partner API Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MooGold Partner API</span>
            </div>

            {/* Instant Top-Up CTA */}
            <Link
              href="/games/mobile-legends"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-lg font-medium text-xs group bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-neon-cyan hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="px-2.5 sm:px-4 py-1.5 rounded-[6px] bg-[#090e1c] group-hover:bg-transparent transition-colors flex items-center gap-1 sm:gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">បញ្ចូលពេជ្រឥឡូវនេះ</span>
                <span className="sm:hidden text-[11px]">បញ្ចូលពេជ្រ</span>
              </span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 3. MOBILE SLIDE-OUT DRAWER */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 bg-[#080d1a] border-t border-cyan-500/30 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white text-sm">ម៉ឺនុយរហ័ស (Quick Navigation)</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Game Top-up Links */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ហ្គេមពេញនិយម (Top Games)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/games/mobile-legends"
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 text-xs text-white font-medium flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>MLBB ពេជ្រ</span>
                  </div>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    HOT
                  </span>
                </Link>

                <Link
                  href="/games/free-fire"
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400 text-xs text-white font-medium flex items-center gap-2 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Free Fire</span>
                </Link>

                <Link
                  href="/games/pubg-mobile"
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400 text-xs text-white font-medium flex items-center gap-2 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>PUBG Mobile</span>
                </Link>

                <Link
                  href="/games/honor-of-kings"
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400 text-xs text-white font-medium flex items-center gap-2 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Honor of Kings</span>
                </Link>
              </div>
            </div>

            {/* General Navigation Links */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <Link
                href="/"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-900 text-xs text-slate-200 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>បញ្ជីហ្គេមទាំងអស់ (All Games Catalog)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Headset className="w-4 h-4" />
                  <span>ជំនួយ & ទំនាក់ទំនង (Customer Support)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Telegram: <strong className="text-white">@AnajakDiamondKH</strong> (បម្រើ 24/7)
                </p>
              </div>
            </div>

            {/* Trust & Status Badge */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bakong KHQR 100% ស្វ័យប្រវត្តិ</span>
              </span>
              <span className="font-display">v1.2 Mobile Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM APP BAR (Native App Feel on Phones) */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070a14]/95 backdrop-blur-xl border-t border-slate-800/90 py-1.5 px-4 flex items-center justify-around shadow-2xl">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            pathname === "/" ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">ទំព័រដើម</span>
        </Link>

        <Link
          href="/games/mobile-legends"
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            pathname.includes("/mobile-legends") ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px]">MLBB</span>
        </Link>

        <Link
          href="/#games"
          className="flex flex-col items-center gap-0.5 p-1 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="text-[10px]">ហ្គេម</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px]">ម៉ឺនុយ</span>
        </button>
      </nav>
    </>
  );
}
