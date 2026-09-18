import Link from "next/link";
import Image from "next/image";
import { dbService } from "@/lib/db-service";
import { SectionId } from "@/lib/landing-config";
import { CatalogGrid } from "@/components/landing/catalog-grid";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import {
  Diamond,
  Zap,
  ShieldCheck,
  Flame,
  ArrowRight,
  Gamepad2,
  Sparkles,
  CreditCard,
  Headphones,
  Clock,
  CheckCircle2,
  Send,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to render icon by name
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "Zap":
      return <Zap className={className} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "CreditCard":
      return <CreditCard className={className} />;
    case "Gamepad2":
      return <Gamepad2 className={className} />;
    case "Diamond":
      return <Diamond className={className} />;
    case "Headphones":
      return <Headphones className={className} />;
    case "Clock":
      return <Clock className={className} />;
    case "CheckCircle2":
      return <CheckCircle2 className={className} />;
    case "Sparkles":
    default:
      return <Sparkles className={className} />;
  }
}

export default async function HomePage() {
  const [games, landingConfig] = await Promise.all([
    dbService.getGames(),
    dbService.getLandingConfig(),
  ]);

  // Theme styling helpers for Hero
  const getHeroThemeStyles = () => {
    switch (landingConfig.hero.themeColor) {
      case "emerald":
        return {
          border: "border-emerald-500/30",
          shadow: "shadow-emerald-500/20",
          gradientText: "from-emerald-400 via-cyan-300 to-amber-300",
          glow1: "bg-emerald-500/15",
          glow2: "bg-cyan-500/10",
          btnGradient: "from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300",
          badgeBorder: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
        };
      case "amber":
        return {
          border: "border-amber-500/30",
          shadow: "shadow-amber-500/20",
          gradientText: "from-amber-400 via-orange-300 to-yellow-200",
          glow1: "bg-amber-500/15",
          glow2: "bg-red-500/10",
          btnGradient: "from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300",
          badgeBorder: "border-amber-400/40 bg-amber-500/15 text-amber-300",
        };
      case "purple":
        return {
          border: "border-purple-500/30",
          shadow: "shadow-purple-500/20",
          gradientText: "from-purple-400 via-pink-300 to-cyan-300",
          glow1: "bg-purple-500/15",
          glow2: "bg-pink-500/10",
          btnGradient: "from-purple-500 to-pink-400 hover:from-purple-400 hover:to-pink-300",
          badgeBorder: "border-purple-400/40 bg-purple-500/15 text-purple-300",
        };
      case "cyan":
      default:
        return {
          border: "border-cyan-500/30",
          shadow: "shadow-neon-cyan",
          gradientText: "from-cyan-400 via-emerald-300 to-amber-300",
          glow1: "bg-cyan-500/15",
          glow2: "bg-purple-500/10",
          btnGradient: "from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300",
          badgeBorder: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
        };
    }
  };

  const theme = getHeroThemeStyles();

  // Section Renderers
  const renderSection = (sectionId: SectionId) => {
    if (!landingConfig.sectionsVisibility[sectionId]) return null;

    switch (sectionId) {
      // 1. Ticker Section
      case "ticker": {
        const items =
          landingConfig.ticker.customItems && landingConfig.ticker.customItems.length > 0
            ? landingConfig.ticker.customItems
            : [
                "ProSlayer_KH 🇰🇭 ទើបតែទិញ 706 Diamonds (MLBB) តាម Bakong KHQR",
                "Vannak_Ace 🔥 ទើបតែទិញ Weekly Diamond Pass",
                "Sokha_Sniper 🎯 ទើបតែទិញ 660 UC (PUBG Mobile)",
                "Dara_Mythic 👑 ទើបតែទិញ 520 Diamonds (Free Fire)",
              ];

        return (
          <div
            key="ticker"
            className="relative overflow-hidden rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/20 px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-bold flex-shrink-0">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
              <span className="hidden sm:inline">{landingConfig.ticker.label || "ការទិញចុងក្រោយ (Live Orders):"}</span>
              <span className="sm:hidden font-display">Live:</span>
            </div>
            <div className="flex-1 overflow-x-auto whitespace-nowrap text-slate-700 dark:text-slate-300 space-x-4 sm:space-x-6 scrollbar-none font-display">
              {items.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item}</span>
                  {idx < items.length - 1 && <span className="text-slate-300 dark:text-slate-600 ml-3 sm:ml-4">•</span>}
                </span>
              ))}
            </div>
          </div>
        );
      }

      // 2. Hero Section
      case "hero": {
        const hero = landingConfig.hero;
        const opacityPercent = typeof hero.bgOpacity === "number" ? hero.bgOpacity : 45;
        const imageOpacity = Math.min(Math.max(opacityPercent / 100, 0), 1);

        return (
          <div
            key="hero"
            className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border ${theme.border} bg-gradient-to-br from-sky-50/80 via-slate-50 to-emerald-50/70 dark:bg-[#070b16] p-5 sm:p-8 lg:p-14 ${theme.shadow} min-h-[360px] sm:min-h-[420px] flex items-center shadow-md dark:shadow-none`}
          >
            {/* Full-Bleed Background Image Layer with Admin-Controlled Opacity */}
            <div className="absolute inset-0 z-0">
              <Image
                src={hero.backgroundImageUrl || "/images/hero-bg.jpg"}
                alt="Hero Gaming Background"
                fill
                priority
                unoptimized
                style={{ opacity: imageOpacity }}
                className="object-cover object-right lg:object-center mix-blend-luminosity scale-105 transition-opacity duration-300"
              />
              {/* Gradients Overlay for Crystal Clear Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50/95 via-slate-50/85 to-slate-50/40 dark:from-[#070b16] dark:via-[#070b16]/95 sm:dark:via-[#070b16]/90 dark:to-[#070b16]/60 sm:dark:to-[#070b16]/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50/90 via-transparent to-slate-50/40 dark:from-[#070b16] dark:via-transparent dark:to-[#070b16]/50" />
            </div>

            {/* Ambient Glow Effects */}
            <div className={`absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 ${theme.glow1} rounded-full blur-3xl pointer-events-none`} />
            <div className={`absolute bottom-0 left-10 w-60 sm:w-80 h-60 sm:h-80 ${theme.glow2} rounded-full blur-3xl pointer-events-none`} />

            {/* Hero Content */}
            <div className="relative z-10 max-w-2xl space-y-4 sm:space-y-6">
              {hero.badgeText && (
                <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full ${theme.badgeBorder} text-[11px] sm:text-xs font-semibold backdrop-blur-md`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-300 flex-shrink-0" />
                  <span className="truncate">{hero.badgeText}</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.2] drop-shadow-sm">
                {hero.titlePrefix}{" "}
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>
                  {hero.titleHighlight}
                </span>{" "}
                {hero.titleSuffix}
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-slate-700 dark:text-slate-200 leading-relaxed max-w-xl font-medium">
                {hero.description}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href={hero.ctaLink || "/games/mobile-legends"}
                  className={`w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r ${theme.btnGradient} text-slate-950 font-bold text-xs sm:text-sm shadow-neon-cyan hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}
                >
                  <Zap className="w-4 h-4 fill-current flex-shrink-0" />
                  <span>{hero.ctaText || "បញ្ចូលពេជ្រ MLBB ឥឡូវនេះ"}</span>
                  <ArrowRight className="w-4 h-4 ml-1 flex-shrink-0" />
                </Link>

                {hero.secondaryBadgeText && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-sm dark:shadow-none">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <span>{hero.secondaryBadgeText}</span>
                  </div>
                )}
              </div>

              {/* Quick Trust Badges Strip */}
              {hero.trustBadges && hero.trustBadges.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-medium">
                  {hero.trustBadges.map((badge) => (
                    <span
                      key={badge.id}
                      className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm dark:shadow-none"
                    >
                      <DynamicIcon name={badge.icon} className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <span>{badge.text}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // 3. Games Catalog Section
      case "games_catalog":
        return (
          <CatalogGrid
            key="games_catalog"
            games={games}
            config={landingConfig.gamesCatalog}
          />
        );

      // 4. How It Works (Steps) Section
      case "how_it_works": {
        const how = landingConfig.howItWorks;
        if (!how.steps || how.steps.length === 0) return null;

        return (
          <section key="how_it_works" className="rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 shadow-sm dark:shadow-none">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 flex-shrink-0" />
                <span>{how.badge || "របៀបបញ្ចូលពេជ្រងាយៗ"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                {how.title}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400">
                  {how.titleHighlight}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{how.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {how.steps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="relative p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#090d1a] border border-slate-200 dark:border-slate-800 hover:border-cyan-500 hover:shadow-lg dark:hover:border-cyan-500/40 transition-all space-y-2.5 sm:space-y-3 group shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DynamicIcon name={step.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-300 dark:text-slate-800 group-hover:text-cyan-600/50 dark:group-hover:text-cyan-500/30 transition-colors font-display">
                      {step.stepNumber}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 5. Features / Why Choose Us Section
      case "features": {
        const why = landingConfig.whyChooseUs;
        if (!why.features || why.features.length === 0) return null;

        return (
          <section key="features" className="rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 shadow-sm dark:shadow-none">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                {why.title}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400">
                  {why.titleHighlight}
                </span>
                ?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{why.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {why.features.map((feat, idx) => (
                <div
                  key={feat.id || idx}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#090d1a] border border-slate-200 dark:border-slate-800 space-y-2.5 sm:space-y-3 hover:border-cyan-500 hover:shadow-lg dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <DynamicIcon name={feat.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 6. FAQ Section
      case "faq":
        return <FAQAccordion key="faq" config={landingConfig.faq} />;

      // 7. Support / Customer Service Banner
      case "support_banner": {
        const sup = landingConfig.supportBanner;
        return (
          <section
            key="support_banner"
            className="rounded-3xl relative overflow-hidden bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 dark:from-cyan-950/70 dark:via-[#0a1124] dark:to-purple-950/70 border border-cyan-400/40 dark:border-cyan-500/30 p-8 lg:p-12 shadow-xl dark:shadow-neon-cyan/20"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left max-w-2xl">
                {sup.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-cyan-500/20 text-white dark:text-cyan-300 text-xs font-semibold border border-white/30 dark:border-cyan-500/30">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{sup.badge}</span>
                  </span>
                )}
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {sup.title}
                </h2>
                <p className="text-xs sm:text-sm text-cyan-50 dark:text-slate-300 leading-relaxed">
                  {sup.description}
                </p>
                {sup.telegramUsername && (
                  <p className="text-xs font-mono text-cyan-100 dark:text-cyan-400">
                    Telegram: <strong className="text-white">{sup.telegramUsername}</strong>
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                <a
                  href={sup.telegramLink || "https://t.me/AnajakDiamondSupport"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-500 hover:bg-slate-100 dark:hover:from-cyan-400 dark:hover:to-blue-400 text-slate-950 font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all font-sans"
                >
                  <Send className="w-4 h-4 text-cyan-600 dark:text-current" />
                  <span>{sup.buttonText || "ឆាតទៅកាន់ Telegram Support"}</span>
                </a>
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      {landingConfig.sectionsOrder.map((sectionId) => renderSection(sectionId))}
    </div>
  );
}
