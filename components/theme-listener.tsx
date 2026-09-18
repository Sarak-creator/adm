"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface ThemeListenerProps {
  initialTheme?: "dark" | "light";
}

export function ThemeListener({ initialTheme = "dark" }: ThemeListenerProps) {
  const [theme, setTheme] = useState<"dark" | "light">(initialTheme);
  const currentThemeRef = useRef<"dark" | "light">(initialTheme);

  // Helper to apply theme to document root
  const applyTheme = useCallback((newTheme: "dark" | "light") => {
    if (typeof document === "undefined") return;

    currentThemeRef.current = newTheme;
    setTheme(newTheme);

    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(newTheme);
    root.dataset.theme = newTheme;
    root.style.colorScheme = newTheme;

    try {
      localStorage.setItem("anajak_theme_mode", newTheme);
    } catch {
      // Ignore localStorage restrictions if private browsing
    }

    // Dispatch global event for other components if needed
    window.dispatchEvent(
      new CustomEvent("anajak_theme_change", { detail: { theme: newTheme } })
    );
  }, []);

  // Sync initial theme on mount
  useEffect(() => {
    applyTheme(initialTheme);
  }, [initialTheme, applyTheme]);

  // Real-time listener: BroadcastChannel, Storage Events & Fast Polling
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. BroadcastChannel for instant 0ms cross-tab live synchronization
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("anajak_theme_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "THEME_CHANGED" && event.data?.themeMode) {
          const incoming = event.data.themeMode === "light" ? "light" : "dark";
          if (incoming !== currentThemeRef.current) {
            applyTheme(incoming);
          }
        }
      };
    } catch {
      // BroadcastChannel might not be supported in older webviews
    }

    // 2. Storage event listener fallback across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "anajak_theme_mode" && e.newValue) {
        const incoming = e.newValue === "light" ? "light" : "dark";
        if (incoming !== currentThemeRef.current) {
          applyTheme(incoming);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Fast Polling to fetch global theme set by Admin in DB
    const checkServerTheme = async () => {
      try {
        const res = await fetch("/api/theme", {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.themeMode) {
            const serverMode = data.themeMode === "light" ? "light" : "dark";
            if (serverMode !== currentThemeRef.current) {
              applyTheme(serverMode);
            }
          }
        }
      } catch {
        // Silently catch network glitches during background polling
      }
    };

    // Poll every 2.5 seconds
    const intervalId = setInterval(checkServerTheme, 2500);

    // Check immediately when tab becomes visible or focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkServerTheme();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkServerTheme);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkServerTheme);
    };
  }, [applyTheme]);

  return null;
}
