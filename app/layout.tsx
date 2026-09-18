import type { Metadata } from "next";
import { Kantumruy_Pro, Battambang, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ShieldCheck, Zap, Diamond, Headset, Gamepad2 } from "lucide-react";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kantumruy",
  display: "swap",
});

const battambang = Battambang({
  subsets: ["khmer"],
  weight: ["400", "700"],
  variable: "--font-battambang",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

import { Navbar } from "@/components/navbar";
import { dbService } from "@/lib/db-service";
import { ThemeListener } from "@/components/theme-listener";

export const metadata: Metadata = {
  title: "អាណាចក្រDiamond (Diamond Kingdom) | បញ្ចូលពេជ្រហ្គេមទាន់ចិត្ត Bakong KHQR",
  description: "វេទិកាបញ្ចូលពេជ្រហ្គេមផ្លូវការនៅកម្ពុជា Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact តាមរយៈ Bakong KHQR ស្វ័យប្រវត្តិកាត់ប្រាក់និងចូលពេជ្រភ្លាមៗក្នុងរយៈពេល 5 វិនាទី!",
  keywords: ["Top up MLBB Cambodia", "Bakong KHQR Diamond", "អាណាចក្រDiamond", "បញ្ចូលពេជ្រ MLBB", "MooGold Cambodia", "Free Fire Diamonds", "PUBG UC KHQR"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeMode = await dbService.getThemeMode();

  return (
    <html
      lang="km"
      className={`${themeMode} ${kantumruy.variable} ${battambang.variable} ${outfit.variable}`}
      data-theme={themeMode}
    >
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col font-khmer antialiased selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300">
        <ThemeListener initialTheme={themeMode} />
        {/* Mobile & Desktop Universal Responsive Header */}
        <Navbar />

        {/* Main Content Area with Mobile Safe-area Clearance */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-8">
          {children}
        </main>

        {/* Footer with Mobile Navigation Clearance */}
        <footer className="mt-12 sm:mt-16 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-[#05070e] text-slate-600 dark:text-slate-400 text-sm py-10 pb-28 md:pb-12 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-base font-bold text-slate-900 dark:text-white">អាណាចក្រDiamond (Diamond Kingdom)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                សេវាកម្មបញ្ចូលពេជ្រហ្គេមអនឡាញឈានមុខគេនៅប្រទេសកម្ពុជា។ គាំទ្រការទូទាត់ប្រាក់ភ្លាមៗតាម Bakong KHQR, ABA Bank, ACLEDA, Wing, Canadia និងធនាគារទាំងអស់នៅកម្ពុជា 100% ស្វ័យប្រវត្តិ។
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-cyan-700 dark:text-cyan-300 shadow-sm">
                  🇰🇭 Bakong KHQR Official Standard
                </div>
                <div className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-300 shadow-sm">
                  🛡️ MooGold Reseller API
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">ហ្គេមពេញនិយម (Top Games)</h4>
              <ul className="space-y-1.5 text-xs">
                <li><Link href="/games/mobile-legends" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Mobile Legends: Bang Bang</Link></li>
                <li><Link href="/games/free-fire" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Free Fire Diamonds</Link></li>
                <li><Link href="/games/pubg-mobile" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">PUBG Mobile UC</Link></li>
                <li><Link href="/games/honor-of-kings" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Honor of Kings Tokens</Link></li>
                <li><Link href="/games/genshin-impact" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Genshin Impact Genesis</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">ជំនួយ & ទំនាក់ទំនង (Support)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">ក្រុមការងារជំនួយបម្រើអតិថិជន 24 ម៉ោងលើ 24 ម៉ោង 7 ថ្ងៃក្នុងមួយសប្តាហ៍</p>
              <div className="pt-2 flex items-center gap-2 text-xs text-cyan-700 dark:text-cyan-400 font-medium">
                <Headset className="w-4 h-4" />
                <span>Telegram Support: @AnajakDiamondKH</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              © 2026 អាណាចក្រDiamond. All Rights Reserved. Tailored for Cambodian Gamers.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">Admin Portal</Link>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-500 font-display">System Status: All Systems Operational 🟢</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
