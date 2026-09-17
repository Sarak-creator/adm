"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { SystemSettingsForm } from "@/components/admin/system-settings-form";

export default function AdminSettingsPage() {
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង (Return to Admin Console)</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-display flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SECURITY PORTAL</span>
            </span>
          </div>
        </div>

        {/* System Settings Form */}
        <SystemSettingsForm onShowToast={showToast} />
      </div>
    </div>
  );
}
