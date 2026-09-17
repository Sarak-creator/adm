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

export const metadata: Metadata = {
  title: "អាណាចក្រDiamond (Diamond Kingdom) | បញ្ចូលពេជ្រហ្គេមទាន់ចិត្ត Bakong KHQR",
  description: "វេទិកាបញ្ចូលពេជ្រហ្គេមផ្លូវការនៅកម្ពុជា Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact តាមរយៈ Bakong KHQR ស្វ័យប្រវត្តិកាត់ប្រាក់និងចូលពេជ្រភ្លាមៗក្នុងរយៈពេល 5 វិនាទី!",
  keywords: ["Top up MLBB Cambodia", "Bakong KHQR Diamond", "អាណាចក្រDiamond", "បញ្ចូលពេជ្រ MLBB", "MooGold Cambodia", "Free Fire Diamonds", "PUBG UC KHQR"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" className={`${kantumruy.variable} ${battambang.variable} ${outfit.variable}`}>
      <body className="bg-[#060913] text-slate-100 min-h-screen flex flex-col font-khmer antialiased">
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-purple-950/60 to-emerald-950/60 border-b border-cyan-500/20 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-cyan-300">⚡ ប្រព័ន្ធស្វ័យប្រវត្តិ 24/7 (Automatic Instant Fulfillment via Bakong KHQR)</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-amber-300 font-display">🇰🇭 អត្រាប្តូរប្រាក់ផ្លូវការ: $1 = 4,100 ៛</span>
        </div>

        {/* Cyberpunk Main Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-[#070a14]/90 border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-amber-300 p-0.5 shadow-neon-cyan group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#090e1c] rounded-[10px] flex items-center justify-center">
                  <Diamond className="w-6 h-6 text-cyan-400 group-hover:text-emerald-300 transition-colors animate-pulse-slow" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 tracking-tight">
                    អាណាចក្រDiamond
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-display">
                    PRO
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-display font-medium tracking-wider">
                  DIAMOND KINGDOM KH
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>បញ្ជីហ្គេម (Games)</span>
              </Link>
              <Link
                href="/games/mobile-legends"
                className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span>MLBB ពេជ្រ</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded border border-emerald-500/30">
                  HOT
                </span>
              </Link>
            </nav>

            {/* Quick Actions & Trust Status */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>MooGold Partner API</span>
              </div>
              <Link
                href="/games/mobile-legends"
                className="relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-lg font-medium text-xs group bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-neon-cyan hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="px-4 py-1.5 rounded-[6px] bg-[#090e1c] group-hover:bg-transparent transition-colors flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>បញ្ចូលពេជ្រឥឡូវនេះ</span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-800/80 bg-[#05070e] text-slate-400 text-sm py-12 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-cyan-400" />
                <span className="text-base font-bold text-white">អាណាចក្រDiamond (Diamond Kingdom)</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                សេវាកម្មបញ្ចូលពេជ្រហ្គេមអនឡាញឈានមុខគេនៅប្រទេសកម្ពុជា។ គាំទ្រការទូទាត់ប្រាក់ភ្លាមៗតាម Bakong KHQR, ABA Bank, ACLEDA, Wing, Canadia និងធនាគារទាំងអស់នៅកម្ពុជា 100% ស្វ័យប្រវត្តិ។
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-cyan-300">
                  🇰🇭 Bakong KHQR Official Standard
                </div>
                <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300">
                  🛡️ MooGold Reseller API
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">ហ្គេមពេញនិយម (Top Games)</h4>
              <ul className="space-y-1.5 text-xs">
                <li><Link href="/games/mobile-legends" className="hover:text-cyan-400 transition-colors">Mobile Legends: Bang Bang</Link></li>
                <li><Link href="/games/free-fire" className="hover:text-cyan-400 transition-colors">Free Fire Diamonds</Link></li>
                <li><Link href="/games/pubg-mobile" className="hover:text-cyan-400 transition-colors">PUBG Mobile UC</Link></li>
                <li><Link href="/games/honor-of-kings" className="hover:text-cyan-400 transition-colors">Honor of Kings Tokens</Link></li>
                <li><Link href="/games/genshin-impact" className="hover:text-cyan-400 transition-colors">Genshin Impact Genesis</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">ជំនួយ & ទំនាក់ទំនង (Support)</h4>
              <p className="text-xs text-slate-400">ក្រុមការងារជំនួយបម្រើអតិថិជន 24 ម៉ោងលើ 24 ម៉ោង 7 ថ្ងៃក្នុងមួយសប្តាហ៍</p>
              <div className="pt-2 flex items-center gap-2 text-xs text-cyan-400">
                <Headset className="w-4 h-4" />
                <span>Telegram Support: @AnajakDiamondKH</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              © 2026 អាណាចក្រDiamond. All Rights Reserved. Tailored for Cambodian Gamers.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="hover:text-amber-400 transition-colors">Admin Portal</Link>
              <span>•</span>
              <span className="text-emerald-500 font-display">System Status: All Systems Operational 🟢</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
