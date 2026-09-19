"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCw,
  Server,
  Zap,
  CreditCard,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Layers,
  Users,
  UserCheck,
  Pencil,
  X,
  Check,
} from "lucide-react";

interface MaskedSetting {
  id: string;
  key: string;
  value: string;
  isEncrypted: boolean;
  description: string | null;
  updatedAt: string;
}

interface AdminUserItem {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  twoFactorPin: string | null;
  has2FA: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemSettingsFormProps {
  onShowToast?: (msg: string, type?: "success" | "error") => void;
}

export function SystemSettingsForm({ onShowToast }: SystemSettingsFormProps) {
  const [settings, setSettings] = useState<MaskedSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"moogold" | "payway" | "bakong" | "operations" | "custom" | "admins">("moogold");

  // Admin Users state
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserItem | null>(null);
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    twoFactorPin: "982100",
    isActive: true,
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  // MooGold local state
  const [mgPartnerId, setMgPartnerId] = useState("");
  const [mgSecretKey, setMgSecretKey] = useState("");
  const [mgBaseUrl, setMgBaseUrl] = useState("https://moogold.com/wp-json/v1/api");
  const [mgSandboxMode, setMgSandboxMode] = useState(false);
  const [mgEncryptSecret, setMgEncryptSecret] = useState(true);
  const [showMgSecret, setShowMgSecret] = useState(false);
  const [isTestingMg, setIsTestingMg] = useState(false);
  const [mgTestResult, setMgTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // ABA PayWay local state
  const [abaMerchantId, setAbaMerchantId] = useState("ec478611");
  const [abaApiKey, setAbaApiKey] = useState("");
  const [abaApiUrl, setAbaApiUrl] = useState("https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase");
  const [abaCheckUrl, setAbaCheckUrl] = useState("https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2");
  const [abaMode, setAbaMode] = useState<"sandbox" | "live">("sandbox");
  const [abaEncryptKey, setAbaEncryptKey] = useState(true);
  const [showAbaApiKey, setShowAbaApiKey] = useState(false);
  const [isTestingAba, setIsTestingAba] = useState(false);
  const [abaTestResult, setAbaTestResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);

  // Bakong local state
  const [bakongAccountId, setBakongAccountId] = useState("");
  const [bakongApiToken, setBakongApiToken] = useState("");
  const [bakongMerchantName, setBakongMerchantName] = useState("");
  const [bakongEncryptToken, setBakongEncryptToken] = useState(true);
  const [showBakongToken, setShowBakongToken] = useState(false);

  // Operational local state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [serviceFeePercent, setServiceFeePercent] = useState("15");
  const [exchangeRateKhr, setExchangeRateKhr] = useState("4100");

  // Custom key-value local state
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customEncrypted, setCustomEncrypted] = useState(false);

  // Saving states
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isSavingSection, setIsSavingSection] = useState(false);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  }, [onShowToast]);

  // Load settings from backend
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings/system");
      const data = await res.json();
      if (data.success && Array.isArray(data.settings)) {
        setSettings(data.settings);

        // Populate dedicated form fields
        const map = new Map<string, MaskedSetting>();
        data.settings.forEach((s: MaskedSetting) => map.set(s.key, s));

        if (map.has("MOOGOLD_PARTNER_ID")) setMgPartnerId(map.get("MOOGOLD_PARTNER_ID")!.value);
        if (map.has("MOOGOLD_SECRET_KEY")) setMgSecretKey(map.get("MOOGOLD_SECRET_KEY")!.value);
        if (map.has("MOOGOLD_BASE_URL")) setMgBaseUrl(map.get("MOOGOLD_BASE_URL")!.value);
        if (map.has("MOOGOLD_SANDBOX_MODE")) {
          setMgSandboxMode(map.get("MOOGOLD_SANDBOX_MODE")!.value === "true");
        }

        if (map.has("BAKONG_ACCOUNT_ID")) setBakongAccountId(map.get("BAKONG_ACCOUNT_ID")!.value);
        if (map.has("BAKONG_API_TOKEN")) setBakongApiToken(map.get("BAKONG_API_TOKEN")!.value);
        if (map.has("BAKONG_MERCHANT_NAME")) setBakongMerchantName(map.get("BAKONG_MERCHANT_NAME")!.value);

        if (map.has("ABA_PAYWAY_MERCHANT_ID")) setAbaMerchantId(map.get("ABA_PAYWAY_MERCHANT_ID")!.value);
        if (map.has("ABA_PAYWAY_API_KEY")) setAbaApiKey(map.get("ABA_PAYWAY_API_KEY")!.value);
        if (map.has("ABA_PAYWAY_API_URL")) {
          const url = map.get("ABA_PAYWAY_API_URL")!.value;
          setAbaApiUrl(url);
          setAbaMode(url.includes("checkout-sandbox") ? "sandbox" : "live");
        }
        if (map.has("ABA_PAYWAY_CHECK_URL")) setAbaCheckUrl(map.get("ABA_PAYWAY_CHECK_URL")!.value);

        if (map.has("MAINTENANCE_MODE")) {
          setMaintenanceMode(map.get("MAINTENANCE_MODE")!.value === "true");
        }
        if (map.has("SERVICE_FEE_PERCENT")) setServiceFeePercent(map.get("SERVICE_FEE_PERCENT")!.value);
        if (map.has("EXCHANGE_RATE_KHR")) setExchangeRateKhr(map.get("EXCHANGE_RATE_KHR")!.value);
      } else {
        toast(data.error || "បរាជ័យក្នុងការទាញយក Settings", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load Admin Users from Supabase
  const fetchAdminUsers = useCallback(async () => {
    setIsLoadingAdmins(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setAdminUsers(data.users);
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast(err.message, "error");
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
    fetchAdminUsers();
  }, [fetchSettings, fetchAdminUsers]);

  // Save a single setting
  const saveSingleSetting = async (
    key: string,
    value: string,
    isEncrypted: boolean,
    description?: string
  ) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, isEncrypted, description }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`បានរក្សាទុក "${key}" ដោយជោគជ័យ!`);
        await fetchSettings();
        return true;
      } else {
        toast(data.error || `បរាជ័យក្នុងការរក្សាទុក "${key}"`, "error");
        return false;
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast(err.message, "error");
      return false;
    } finally {
      setSavingKey(null);
    }
  };

  // Delete a setting
  const deleteSetting = async (key: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុប Config "${key}" ឬទេ? (Do you want to delete this setting?)`)) return;
    try {
      const res = await fetch(`/api/admin/settings/system?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast(`បានលុប "${key}" ដោយជោគជ័យ!`);
        await fetchSettings();
      } else {
        toast(data.error || "បរាជ័យក្នុងការលុប", "error");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast(err.message, "error");
    }
  };

  // Save entire MooGold Section
  const handleSaveMooGold = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSection(true);
    try {
      const secretIsMasked = mgSecretKey.includes("••••");

      await saveSingleSetting("MOOGOLD_PARTNER_ID", mgPartnerId, false, "MooGold Partner ID");
      if (!secretIsMasked && mgSecretKey.trim()) {
        await saveSingleSetting("MOOGOLD_SECRET_KEY", mgSecretKey, mgEncryptSecret, "MooGold API Secret Key (AES-256-GCM)");
      }
      await saveSingleSetting("MOOGOLD_BASE_URL", mgBaseUrl, false, "MooGold API Base URL");
      await saveSingleSetting("MOOGOLD_SANDBOX_MODE", String(mgSandboxMode), false, "MooGold Sandbox/Mock Mode Toggle");

      toast("បានរក្សាទុកការកំណត់ MooGold API ក្នុង Supabase ដោយជោគជ័យ!");
    } finally {
      setIsSavingSection(false);
    }
  };

  // ABA Mode switcher
  const handleAbaModeChange = (mode: "sandbox" | "live") => {
    setAbaMode(mode);
    if (mode === "sandbox") {
      setAbaApiUrl("https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase");
      setAbaCheckUrl("https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2");
    } else {
      setAbaApiUrl("https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase");
      setAbaCheckUrl("https://checkout.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2");
    }
  };

  // Save ABA PayWay Section
  const handleSaveAbaPayway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSection(true);
    try {
      const keyIsMasked = abaApiKey.includes("••••");

      await saveSingleSetting("ABA_PAYWAY_MERCHANT_ID", abaMerchantId.trim(), false, "ABA PayWay Merchant ID");
      if (!keyIsMasked && abaApiKey.trim()) {
        await saveSingleSetting("ABA_PAYWAY_API_KEY", abaApiKey.trim(), abaEncryptKey, "ABA PayWay Public/API Key (AES-256-GCM)");
      }
      await saveSingleSetting("ABA_PAYWAY_API_URL", abaApiUrl.trim(), false, "ABA PayWay Purchase API Endpoint");
      await saveSingleSetting("ABA_PAYWAY_CHECK_URL", abaCheckUrl.trim(), false, "ABA PayWay Check Transaction API Endpoint");

      toast("បានរក្សាទុកការកំណត់ ABA PayWay ក្នុង Supabase ដោយជោគជ័យ!");
    } finally {
      setIsSavingSection(false);
    }
  };

  // Test live connection to ABA PayWay
  const handleTestAbaPaywayConnection = async () => {
    setIsTestingAba(true);
    setAbaTestResult(null);
    try {
      const keyIsMasked = abaApiKey.includes("••••");
      const res = await fetch("/api/admin/payway/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: abaMerchantId.trim(),
          apiKey: keyIsMasked ? undefined : abaApiKey.trim(),
          apiUrl: abaApiUrl.trim(),
        }),
      });
      const data = await res.json();
      setAbaTestResult({
        success: Boolean(data.success),
        message: data.message || (data.success ? "ការតភ្ជាប់ជោគជ័យ!" : "បរាជ័យ"),
        mode: data.mode,
      });
    } catch (e: unknown) {
      const err = e as Error;
      setAbaTestResult({
        success: false,
        message: err.message || "Network error: មិនអាចតភ្ជាប់ទៅ ABA PayWay បានទេ",
      });
    } finally {
      setIsTestingAba(false);
    }
  };

  // Save Bakong Section
  const handleSaveBakong = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSection(true);
    try {
      const tokenIsMasked = bakongApiToken.includes("••••");

      await saveSingleSetting("BAKONG_ACCOUNT_ID", bakongAccountId, false, "Bakong KHQR Merchant Account ID");
      if (!tokenIsMasked && bakongApiToken.trim()) {
        await saveSingleSetting("BAKONG_API_TOKEN", bakongApiToken, bakongEncryptToken, "Bakong Payment API JWT/Token");
      }
      await saveSingleSetting("BAKONG_MERCHANT_NAME", bakongMerchantName, false, "Bakong Merchant Display Name");

      toast("បានរក្សាទុកការកំណត់ Bakong Payment ក្នុង Supabase ដោយជោគជ័យ!");
    } finally {
      setIsSavingSection(false);
    }
  };

  // Save Operations Section
  const handleSaveOperations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSection(true);
    try {
      await saveSingleSetting("MAINTENANCE_MODE", String(maintenanceMode), false, "System Maintenance Mode Toggle");
      await saveSingleSetting("SERVICE_FEE_PERCENT", serviceFeePercent, false, "Service Fee / Profit Margin Markup %");
      await saveSingleSetting("EXCHANGE_RATE_KHR", exchangeRateKhr, false, "USD to KHR Currency Exchange Rate");

      toast("បានរក្សាទុកការកំណត់ប្រតិបត្តិការទូទៅក្នុង Supabase ដោយជោគជ័យ!");
    } finally {
      setIsSavingSection(false);
    }
  };

  // Add Custom Setting
  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim() || !customValue.trim()) return;

    const formattedKey = customKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const ok = await saveSingleSetting(formattedKey, customValue.trim(), customEncrypted, customDesc.trim() || undefined);
    if (ok) {
      setCustomKey("");
      setCustomValue("");
      setCustomDesc("");
      setCustomEncrypted(false);
    }
  };

  // Open Admin User Modal
  const handleOpenAdminModal = (admin?: AdminUserItem) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminFormData({
        username: admin.username,
        email: admin.email || "",
        name: admin.name || "",
        password: "", // blank means don't change
        twoFactorPin: "982100",
        isActive: admin.isActive,
      });
    } else {
      setEditingAdmin(null);
      setAdminFormData({
        username: "",
        email: "",
        name: "",
        password: "",
        twoFactorPin: "982100",
        isActive: true,
      });
    }
    setShowAdminPassword(false);
    setAdminModalOpen(true);
  };

  // Save Admin User in Supabase
  const handleSaveAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdmin(true);
    try {
      const payload: Record<string, unknown> = {
        username: adminFormData.username.trim(),
        email: adminFormData.email.trim() || null,
        name: adminFormData.name.trim() || null,
        twoFactorPin: adminFormData.twoFactorPin.trim() || null,
        isActive: adminFormData.isActive,
      };

      if (editingAdmin) {
        payload.id = editingAdmin.id;
        if (adminFormData.password.trim()) {
          payload.password = adminFormData.password.trim();
        }
      } else {
        payload.password = adminFormData.password.trim();
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast(data.message || "បានរក្សាទុកព័ត៌មាន Admin ក្នុង Supabase ដោយជោគជ័យ!");
        setAdminModalOpen(false);
        fetchAdminUsers();
      } else {
        toast(data.error || "បរាជ័យក្នុងការរក្សាទុក Admin User", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast(error.message, "error");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // Delete Admin User from Supabase
  const handleDeleteAdminUser = async (user: AdminUserItem) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុប Admin "${user.username}" ចេញពី Supabase ឬទេ?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast(data.message || "បានលុប Admin ដោយជោគជ័យ!");
        fetchAdminUsers();
      } else {
        toast(data.error || "បរាជ័យក្នុងការលុប Admin", "error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast(error.message, "error");
    }
  };

  // Test live connection to MooGold
  const handleTestMooGoldConnection = async () => {
    setIsTestingMg(true);
    setMgTestResult(null);
    try {
      const res = await fetch("/api/admin/moogold/balance");
      const data = await res.json();
      if (data.success) {
        setMgTestResult({
          success: true,
          message: `ការតភ្ជាប់ជោគជ័យ! សមតុល្យបច្ចុប្បន្ន: $${Number(data.balance).toFixed(2)} ${data.currency || "USD"}${data.raw?.sandbox ? " (Simulation Sandbox Mode)" : " (Live Production)"}`,
        });
      } else {
        setMgTestResult({
          success: false,
          message: data.errorMessage || data.error || "បរាជ័យក្នុងការតភ្ជាប់ទៅកាន់ MooGold API",
        });
      }
    } catch (e: unknown) {
      const err = e as Error;
      setMgTestResult({
        success: false,
        message: err.message || "Network Error: មិនអាចតភ្ជាប់ទៅ Server បានទេ",
      });
    } finally {
      setIsTestingMg(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Security Specs */}
      <div className="glass-card rounded-2xl p-6 border-slate-800 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold font-display flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SUPABASE POSTGRESQL + AES-256-GCM</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">100% Data from Supabase</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-cyan-400" />
              <span>ការកំណត់ប្រព័ន្ធ និង គណនី Admin (Supabase Engine)</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              ទិន្នន័យទាំងអស់រួមទាំង <strong>គណនី Admin (Admin Users)</strong>, <strong>MooGold Credentials</strong>, <strong>Bakong Payment</strong>,
              និងការកំណត់ប្រតិបត្តិការត្រូវបានទាញយក និងរក្សាទុកដោយផ្ទាល់ក្នុង <strong>Supabase Database</strong> ដោយសុវត្ថិភាព។
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchSettings();
                fetchAdminUsers();
                toast("បានទាញយកទិន្នន័យចុងក្រោយពី Supabase រួចរាល់!");
              }}
              disabled={isLoading || isLoadingAdmins}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading || isLoadingAdmins ? "animate-spin" : ""}`} />
              <span>Refresh Supabase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtabs for Setting Categories */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none flex-nowrap -mx-2 px-2 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveSubTab("moogold")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "moogold"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>MooGold Reseller API</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("payway")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "payway"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#005f82] dark:text-cyan-400" />
          <span>ABA PayWay Gateway</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#005f82]/30 text-cyan-300 border border-[#005f82]/50">
            {abaMode === "live" ? "LIVE" : "SANDBOX"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("bakong")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "bakong"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bakong KHQR Payment</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("operations")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "operations"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Operational Controls</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab("admins");
            fetchAdminUsers();
          }}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "admins"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>គណនី Admin (Supabase Users)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 font-mono">
            {adminUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("custom")}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === "custom"
              ? "bg-cyan-500 text-slate-950 shadow-neon-cyan"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Custom Configuration</span>
        </button>
      </div>

      {/* SUBTAB: ADMIN USERS MANAGEMENT (DIRECT FROM SUPABASE) */}
      {activeSubTab === "admins" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span>គ្រប់គ្រងគណនី Admin ក្នុង Supabase Database</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Live Supabase
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  រាល់ការ Login ទាំងអស់ត្រូវផ្ទៀងផ្ទាត់ដោយផ្ទាល់ជាមួយតារាង <code>users</code> ក្នុង Supabase ដោយប្រើ Hash សម្ងាត់ (scrypt + 16-byte random salt)
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAdminModal()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ បង្កើត Admin ថ្មី (New Admin)</span>
              </button>
            </div>

            {/* Admin Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Display Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">2FA Security PIN</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        មិនទាន់មាន Admin User ក្នុង Supabase នៅឡើយទេ
                      </td>
                    </tr>
                  ) : (
                    adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{u.username}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {u.name || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {u.email || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>{u.twoFactorPin || "982100"}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAdminModal(u)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            >
                              <Pencil className="w-3 h-3 text-cyan-400" />
                              <span>កែប្រែ / ប្តូរ Password</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdminUser(u)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                              title={`Delete Admin ${u.username}`}
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
          </div>
        </div>
      )}

      {/* SUBTAB 1: MOOGOLD RESELLER API */}
      {activeSubTab === "moogold" && (
        <form onSubmit={handleSaveMooGold} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  <span>MooGold Reseller API Configuration (Stored in Supabase)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  គ្រប់គ្រងព័ត៌មាន Partner ID និង Secret Key សម្រាប់ Top-up ពេជ្រស្វ័យប្រវត្តិ
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestMooGoldConnection}
                disabled={isTestingMg}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isTestingMg ? "animate-pulse" : ""}`} />
                <span>{isTestingMg ? "កំពុងតេស្ត..." : "Test Connection & Balance"}</span>
              </button>
            </div>

            {/* Test Result Message */}
            {mgTestResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
                  mgTestResult.success
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : "bg-red-950/60 text-red-300 border-red-500/40"
                }`}
              >
                {mgTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{mgTestResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Partner ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  MooGold Partner ID (Public Key / ID)
                </label>
                <input
                  type="text"
                  value={mgPartnerId}
                  onChange={(e) => setMgPartnerId(e.target.value)}
                  placeholder="e.g. your_partner_id_here"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>MOOGOLD_PARTNER_ID</code> (in Supabase)</p>
              </div>

              {/* Secret Key with encryption toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>MooGold Secret Key</span>
                    {mgEncryptSecret ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> AES-256 Encrypted
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/40">
                        Plaintext
                      </span>
                    )}
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mgEncryptSecret}
                      onChange={(e) => setMgEncryptSecret(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-950 border-slate-700"
                    />
                    <span>ការពារដោយ Encryption</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showMgSecret ? "text" : "password"}
                    value={mgSecretKey}
                    onChange={(e) => setMgSecretKey(e.target.value)}
                    placeholder="បញ្ចូល Secret Key ថ្មីដើម្បីកែប្រែ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMgSecret(!showMgSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showMgSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>MOOGOLD_SECRET_KEY</code> (Encrypted in Supabase)</p>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Base URL Endpoint
                </label>
                <input
                  type="text"
                  value={mgBaseUrl}
                  onChange={(e) => setMgBaseUrl(e.target.value)}
                  placeholder="https://moogold.com/wp-json/v1/api"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Default: <code>https://moogold.com/wp-json/v1/api</code></p>
              </div>

              {/* Sandbox Mode Toggle */}
              <div className="flex flex-col justify-center">
                <label className="text-xs font-semibold text-slate-300 mb-2">
                  របៀប Sandbox Simulation (Sandbox Mode)
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={mgSandboxMode}
                    onChange={(e) => setMgSandboxMode(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {mgSandboxMode ? "🟢 កំពុងប្រើ Simulation Sandbox" : "🔴 កំពុងប្រើ Live Real API"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {mgSandboxMode
                        ? "មិនកាត់ប្រាក់ពិតក្នុង MooGold ទេ (ល្អសម្រាប់តេស្ត Order & Player ID)"
                        : "រាល់ Order នឹងបញ្ជូនទៅ MooGold ពិតប្រាកដ និងកាត់សមតុល្យ Reseller Wallet"}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingSection}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSection ? "កំពុងរក្សាទុក..." : "រក្សាទុកក្នុង Supabase"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB: ABA PAYWAY GATEWAY */}
      {activeSubTab === "payway" && (
        <form onSubmit={handleSaveAbaPayway} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-[#005f82] text-white flex items-center justify-center font-black text-[10px] shadow-md">
                    ABA
                  </span>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>ABA PayWay Payment Gateway (Stored in Supabase)</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  កំណត់ Merchant ID, API Key, និងប្តូររវាង Sandbox (Testing) ឬ Production (Live Real Money)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestAbaPaywayConnection}
                  disabled={isTestingAba}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isTestingAba ? "animate-pulse" : ""}`} />
                  <span>{isTestingAba ? "កំពុងតេស្ត..." : "តេស្តតភ្ជាប់ ABA PayWay"}</span>
                </button>
              </div>
            </div>

            {/* Test Result Message */}
            {abaTestResult && (
              <div
                className={`p-4 rounded-xl text-xs font-medium flex items-start gap-3 border ${
                  abaTestResult.success
                    ? "bg-emerald-950/60 text-emerald-200 border-emerald-500/40"
                    : "bg-red-950/60 text-red-200 border-red-500/40"
                }`}
              >
                {abaTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold text-sm">{abaTestResult.success ? "ការតភ្ជាប់ជោគជ័យ!" : "ការតភ្ជាប់បរាជ័យ"}</p>
                  <p className="text-xs opacity-90 leading-relaxed">{abaTestResult.message}</p>
                </div>
              </div>
            )}

            {/* Mode Switcher: Sandbox vs Live */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-200 block">
                របៀបដំណើរការ ABA PayWay (Environment Mode)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAbaModeChange("sandbox")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    abaMode === "sandbox"
                      ? "bg-cyan-500/10 border-cyan-500 text-white shadow-md"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${abaMode === "sandbox" ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-slate-600"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">🟢 Sandbox Mode (តេស្តសាកល្បង)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      ប្រើ Endpoint <code>checkout-sandbox.payway.com.kh</code> សម្រាប់តេស្ត (មិនកាត់ប្រាក់ពិតប្រាកដ)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAbaModeChange("live")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    abaMode === "live"
                      ? "bg-red-500/10 border-red-500 text-white shadow-md"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${abaMode === "live" ? "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-slate-600"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">🔴 Live Production (កាត់ប្រាក់ពិត)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      ប្រើ Endpoint <code>checkout.payway.com.kh</code> សម្រាប់ឱ្យអតិថិជនស្កេនតាម App ABA Mobile ពិតប្រាកដ
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Merchant ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ABA PayWay Merchant ID
                </label>
                <input
                  type="text"
                  value={abaMerchantId}
                  onChange={(e) => setAbaMerchantId(e.target.value)}
                  placeholder="e.g. ec478611"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>ABA_PAYWAY_MERCHANT_ID</code> (ក្នុង Supabase)</p>
              </div>

              {/* API Key / Secret with encryption toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>ABA PayWay API Key (Public/Secret Key)</span>
                    {abaEncryptKey ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> AES-256 Encrypted
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/40">
                        Plaintext
                      </span>
                    )}
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={abaEncryptKey}
                      onChange={(e) => setAbaEncryptKey(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-950 border-slate-700"
                    />
                    <span>ការពារដោយ Encryption</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showAbaApiKey ? "text" : "password"}
                    value={abaApiKey}
                    onChange={(e) => setAbaApiKey(e.target.value)}
                    placeholder="បញ្ចូល API Key ថ្មីដើម្បីកែប្រែ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAbaApiKey(!showAbaApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showAbaApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>ABA_PAYWAY_API_KEY</code></p>
              </div>

              {/* API Purchase URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ABA Purchase API Endpoint
                </label>
                <input
                  type="text"
                  value={abaApiUrl}
                  onChange={(e) => setAbaApiUrl(e.target.value)}
                  placeholder="https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>ABA_PAYWAY_API_URL</code></p>
              </div>

              {/* Check Transaction URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ABA Check Transaction API Endpoint
                </label>
                <input
                  type="text"
                  value={abaCheckUrl}
                  onChange={(e) => setAbaCheckUrl(e.target.value)}
                  placeholder="https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>ABA_PAYWAY_CHECK_URL</code></p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingSection}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSection ? "កំពុងរក្សាទុក..." : "រក្សាទុកក្នុង Supabase"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 2: BAKONG KHQR PAYMENT */}
      {activeSubTab === "bakong" && (
        <form onSubmit={handleSaveBakong} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span>Bakong KHQR Payment Gateway Credentials (Stored in Supabase)</span>
              </h3>
              <p className="text-xs text-slate-400">
                កំណត់ Merchant Account ID និង API Token សម្រាប់ទទួលការទូទាត់ប្រាក់រៀល/ដុល្លារតាម KHQR
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Account ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bakong Account ID (Merchant ID)
                </label>
                <input
                  type="text"
                  value={bakongAccountId}
                  onChange={(e) => setBakongAccountId(e.target.value)}
                  placeholder="e.g. anajak_diamond@aclb"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>BAKONG_ACCOUNT_ID</code></p>
              </div>

              {/* Merchant Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Merchant Display Name
                </label>
                <input
                  type="text"
                  value={bakongMerchantName}
                  onChange={(e) => setBakongMerchantName(e.target.value)}
                  placeholder="e.g. ANAJAK DIAMOND CO., LTD"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>BAKONG_MERCHANT_NAME</code></p>
              </div>

              {/* API Token / Secret */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Bakong Developer API Token / Webhook Secret</span>
                    {bakongEncryptToken ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> AES-256 Encrypted
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/40">
                        Plaintext
                      </span>
                    )}
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bakongEncryptToken}
                      onChange={(e) => setBakongEncryptToken(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-950 border-slate-700"
                    />
                    <span>ការពារដោយ Encryption</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showBakongToken ? "text" : "password"}
                    value={bakongApiToken}
                    onChange={(e) => setBakongApiToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBakongToken(!showBakongToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showBakongToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>BAKONG_API_TOKEN</code> (Encrypted in Supabase)</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingSection}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSection ? "កំពុងរក្សាទុក..." : "រក្សាទុកក្នុង Supabase"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 3: OPERATIONAL CONTROLS */}
      {activeSubTab === "operations" && (
        <form onSubmit={handleSaveOperations} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Operational & Business Controls (Stored in Supabase)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ការគ្រប់គ្រងមុខងារថែទាំប្រព័ន្ធ (Maintenance Mode) និងអត្រាប្រាក់ចំណេញ
              </p>
            </div>

            <div className="space-y-5">
              {/* Maintenance Mode */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {maintenanceMode ? "🚨 កំពុងបើក Maintenance Mode" : "✅ ប្រព័ន្ធដំណើរការធម្មតា (Normal Mode)"}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    នៅពេលបើក Maintenance Mode អតិថិជននឹងឃើញផ្ទាំងជូនដំណឹងផ្អាកការទិញពេជ្រជាបណ្តោះអាសន្ន
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Profit Margin / Service Fee % */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service Fee / Profit Markup (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={serviceFeePercent}
                      onChange={(e) => setServiceFeePercent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-display text-emerald-400 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>SERVICE_FEE_PERCENT</code></p>
                </div>

                {/* Exchange Rate KHR */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    អត្រាប្តូរប្រាក់ 1 USD ទៅ ៛KHR (Exchange Rate)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10"
                      min="3500"
                      max="4500"
                      value={exchangeRateKhr}
                      onChange={(e) => setExchangeRateKhr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-display text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ៛ / $
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Config Key: <code>EXCHANGE_RATE_KHR</code></p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingSection}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSection ? "កំពុងរក្សាទុក..." : "រក្សាទុកក្នុង Supabase"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 4: CUSTOM CONFIGURATION */}
      {activeSubTab === "custom" && (
        <div className="space-y-6">
          <form onSubmit={handleAddCustom} className="glass-card rounded-2xl p-6 border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>បន្ថែម Dynamic Key-Value ថ្មីក្នុង Supabase (Custom Setting)</span>
              </h3>
              <p className="text-xs text-slate-400">
                បញ្ចូល Config Key ថ្មីដែល Web App ឬ Service ផ្សេងៗអាចអានបានតាមរយៈ <code>await getConfig(&apos;KEY&apos;)</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Config Key (UPPERCASE_SNAKE_CASE) *
                </label>
                <input
                  type="text"
                  required
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="e.g. TELEGRAM_BOT_TOKEN"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / សេចក្តីពន្យល់
                </label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Value *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Enter value..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={customEncrypted}
                    onChange={(e) => setCustomEncrypted(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                  />
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Encrypt with AES-256-GCM before saving to Supabase</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={savingKey === customKey}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-neon-cyan transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingKey === customKey ? "កំពុងបន្ថែម..." : "បន្ថែមទៅក្នុង Supabase"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ALL REGISTERED CONFIGURATIONS TABLE */}
      <div className="glass-card rounded-2xl p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>ទិន្នន័យ Config ក្នុង Supabase Database ({settings.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              បញ្ជីការកំណត់ទាំងអស់ដែលកំពុងសកម្ម។ តម្លៃសម្ងាត់ត្រូវបាន Mask ដើម្បីកុំឱ្យលេចធ្លាយលើ Frontend
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Config Key</th>
                <th className="py-3 px-4">Masked Value</th>
                <th className="py-3 px-4">Encryption</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    មិនទាន់មាន Config ក្នុង Database នៅឡើយទេ
                  </td>
                </tr>
              ) : (
                settings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      {s.key}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 max-w-xs truncate">
                      {s.value}
                    </td>
                    <td className="py-3 px-4">
                      {s.isEncrypted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <Lock className="w-2.5 h-2.5" /> Encrypted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Unlock className="w-2.5 h-2.5" /> Plaintext
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {s.description || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(s.updatedAt).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteSetting(s.key)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                        title={`Delete ${s.key}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CREATE / UPDATE ADMIN USER IN SUPABASE */}
      {/* ========================================================= */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <span>
                  {editingAdmin ? `កែប្រែគណនី Admin "${editingAdmin.username}"` : "បង្កើត Admin User ថ្មីក្នុង Supabase"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Username (ឈ្មោះប្រើប្រាស់ Login) *
                </label>
                <input
                  type="text"
                  required
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. superadmin"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ឈ្មោះសម្គាល់ (Display Name)
                  </label>
                  <input
                    type="text"
                    value={adminFormData.name}
                    onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Sokha Admin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (សម្រាប់ Login ផងដែរ)
                  </label>
                  <input
                    type="email"
                    value={adminFormData.email}
                    onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="admin@anajakdiamond.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingAdmin ? "ពាក្យសម្ងាត់ថ្មី (Password) - ទុកទទេបើមិនចង់ប្តូរ" : "ពាក្យសម្ងាត់ (Password) *"}
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required={!editingAdmin}
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    placeholder={editingAdmin ? "•••••••• (ទុកទទេដើម្បីរក្សាទុកដដែល)" : "បញ្ចូល Password..."}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  លេខកូដសុវត្ថិភាព 2FA Security PIN (6-Digit) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={adminFormData.twoFactorPin}
                  onChange={(e) => setAdminFormData({ ...adminFormData, twoFactorPin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. 982100"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  លេខកូដសម្ងាត់សម្រាប់ផ្ទៀងផ្ទាត់ជំហានទី ២ នៅពេល Login
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={adminFormData.isActive}
                    onChange={(e) => setAdminFormData({ ...adminFormData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                  />
                  <span>គណនីមានសិទ្ធិចូលប្រព័ន្ធ (Active Status)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdmin}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-neon-cyan flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAdmin ? "កំពុងរក្សាទុក..." : "រក្សាទុកក្នុង Supabase"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
