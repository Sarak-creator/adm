import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#070913",
        foreground: "#f1f5f9",
        card: {
          DEFAULT: "#0d111e",
          foreground: "#f1f5f9",
          border: "#1b233a",
        },
        brand: {
          cyan: "#00f0ff",
          emerald: "#10b981",
          gold: "#f59e0b",
          purple: "#8b5cf6",
          blue: "#3b82f6",
        },
      },
      fontFamily: {
        khmer: ["var(--font-kantumruy)", "sans-serif"],
        display: ["var(--font-outfit)", "var(--font-kantumruy)", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan": "0 0 15px -2px rgba(0, 240, 255, 0.4), 0 0 30px -4px rgba(0, 240, 255, 0.2)",
        "neon-emerald": "0 0 15px -2px rgba(16, 185, 129, 0.4), 0 0 30px -4px rgba(16, 185, 129, 0.2)",
        "neon-gold": "0 0 15px -2px rgba(245, 158, 11, 0.4), 0 0 30px -4px rgba(245, 158, 11, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 240, 255, 0.4)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.8), 0 0 30px rgba(16, 185, 129, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
