"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Diamond,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  ShieldAlert,
  Smartphone,
  RefreshCw,
} from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from");

  // Step state: 1 = Username & Password, 2 = 2FA Code
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authenticated) {
          const destination = fromPath || (data.adminSecretPath ? `/${data.adminSecretPath}` : "/admin");
          router.replace(destination);
        }
      } catch {
        // Not authenticated
      }
    }
    checkAuth();
  }, [fromPath, router]);

  // Handle Step 1: Submit Credentials
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          rememberMe,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setIsLocked(true);
        setRemainingMinutes(data.retryAfterMinutes || 15);
        setErrorMessage(data.error);
        return;
      }

      if (data.success) {
        if (data.require2FA && data.pendingToken) {
          // Transition to Step 2: 2FA Verification
          setPendingToken(data.pendingToken);
          setStep(2);
          setErrorMessage(null);
        } else {
          // Direct login success
          const destination = fromPath || (data.adminSecretPath ? `/${data.adminSecretPath}` : "/admin");
          router.push(destination);
          router.refresh();
        }
      } else {
        setErrorMessage(data.error || "ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើបានទេ");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Submit 2FA Code
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      setErrorMessage("សូមបញ្ចូលលេខកូដសុវត្ថិភាព 2FA (Enter 2FA Code)");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingToken,
          twoFactorCode: twoFactorCode.trim(),
          rememberMe,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setIsLocked(true);
        setRemainingMinutes(data.retryAfterMinutes || 15);
        setErrorMessage(data.error);
        return;
      }

      if (data.success) {
        const destination = fromPath || (data.adminSecretPath ? `/${data.adminSecretPath}` : "/admin");
        router.push(destination);
        router.refresh();
      } else {
        setErrorMessage(data.error || "លេខកូដ 2FA មិនត្រឹមត្រូវ!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "ការផ្ទៀងផ្ទាត់ 2FA បរាជ័យ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      {/* Ambient Cyberpunk Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ត្រឡប់ទៅកាន់ទំព័រដើម (Back to Store)</span>
          </Link>

          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
            PORTAL-SECURE
          </span>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-[#090e1c]/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden">
          {/* Top Decorative Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-300" />

          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-amber-300 p-0.5 shadow-neon-cyan flex items-center justify-center">
              <div className="w-full h-full bg-[#070b16] rounded-[14px] flex items-center justify-center">
                <Diamond className="w-8 h-8 text-cyan-400 animate-pulse-slow" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold tracking-wide uppercase mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enterprise 2FA Protection</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {step === 1 ? "ចូលប្រព័ន្ធគ្រប់គ្រង" : "ផ្ទៀងផ្ទាត់ ២ ជាន់ (2FA)"}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {step === 1
                  ? "អាណាចក្រDiamond • Control Center Authentication"
                  : "បញ្ចូលលេខកូដសុវត្ថិភាព 6 ខ្ទង់ ដើម្បីបញ្ជាក់អត្តសញ្ញាណ"}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              {isLocked ? (
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: Username and Password */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  ឈ្មោះគណនី (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isLocked || isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    ពាក្យសម្ងាត់ (Password / Secret Key)
                  </label>
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    <span>ADMIN_SECRET</span>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLocked || isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>ចងចាំការ Login រយៈពេល 30 ថ្ងៃ</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-neon-cyan transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed pt-3 mt-2"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>កំពុងផ្ទៀងផ្ទាត់... (Verifying)</span>
                  </>
                ) : (
                  <>
                    <span>បន្តទៅកាន់ជំហាន 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 2FA Security Code Verification */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-200">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Two-Factor Authentication (2FA)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  សូមបញ្ចូលលេខកូដសុវត្ថិភាព ៦ ខ្ទង់របស់អ្នក (Security PIN / Telegram OTP)។
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 text-center">
                  លេខកូដ 2FA (6-Digit Security PIN)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="982100"
                  className="w-full py-3 text-center tracking-[0.6em] text-xl font-mono font-black rounded-xl bg-slate-950 border-2 border-cyan-500/60 text-cyan-300 placeholder-slate-700 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                />
              </div>

              {/* Submit 2FA */}
              <button
                type="submit"
                disabled={isLoading || twoFactorCode.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-neon-cyan transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>កំពុងផ្ទៀងផ្ទាត់ 2FA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ផ្ទៀងផ្ទាត់ និងចូល Dashboard</span>
                  </>
                )}
              </button>

              {/* Back to Step 1 */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setTwoFactorCode("");
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← ត្រឡប់ទៅកែ Username & Password
                </button>
              </div>
            </form>
          )}

          {/* Quick Helper Notice */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1 text-center">
            <p>
              លំនាំដើម: Username: <strong className="text-cyan-300">admin</strong> • 2FA: <strong className="text-cyan-300">982100</strong>
            </p>
            <p className="text-[10px] text-slate-500">
              (គ្រប់គ្រងសុវត្ថិភាពតាមរយៈ <code>ADMIN_SECRET</code>, <code>ADMIN_SECRET_PATH</code>, និង <code>ADMIN_2FA_PIN</code> ក្នុង <code>.env</code>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Loading secure portal...</span>
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
