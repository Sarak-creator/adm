"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { GameData } from "@/lib/catalog-data";
import { GamesCatalogConfig } from "@/lib/landing-config";
import { formatUSD, formatKHR } from "@/lib/utils";
import { Gamepad2, Flame, Zap, ArrowRight, Search, X } from "lucide-react";

interface CatalogGridProps {
  games: GameData[];
  config: GamesCatalogConfig;
}

export function CatalogGrid({ games, config }: CatalogGridProps) {
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase().trim();
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.nameKh && g.nameKh.toLowerCase().includes(q)) ||
        (g.publisher && g.publisher.toLowerCase().includes(q))
    );
  }, [games, search]);

  const gridColsClass = useMemo(() => {
    switch (config.columns) {
      case 2:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 3:
      default:
        return "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3";
    }
  }, [config.columns]);

  return (
    <section id="games" className="space-y-4 sm:space-y-6 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Gamepad2 className="w-4 h-4" />
            <span>{config.badge || "បញ្ជីហ្គេមទាំងអស់ (Game Catalogue)"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {config.title || "ជ្រើសរើសហ្គេមដែលអ្នកចង់បញ្ចូលពេជ្រ"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
            {config.subtitle || "គាំទ្រការទូទាត់តាម KHQR គ្រប់ហ្គេមទាំងអស់"}
          </p>
        </div>

        {/* Real-time Search Bar */}
        {config.showSearchBar && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="ស្វែងរកហ្គេម (Search game)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans shadow-sm dark:shadow-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {filteredGames.length === 0 ? (
        <div className="rounded-2xl p-8 sm:p-12 text-center bg-white dark:bg-[#0c101e] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
          <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            រកមិនឃើញហ្គេមដែលត្រូវនឹង &ldquo;{search}&rdquo; ទេ
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
          >
            សម្អាតការស្វែងរក (Clear search)
          </button>
        </div>
      ) : (
        <div className={`grid ${gridColsClass} gap-3 sm:gap-6`}>
          {filteredGames.map((game, idx) => {
            const minPricePkg =
              game.packages && game.packages.length > 0
                ? game.packages.reduce(
                    (min, p) => (p.sellingPriceUSD < min.sellingPriceUSD ? p : min),
                    game.packages[0]
                  )
                : null;

            return (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="group rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-[#0c101e] border border-slate-200 dark:border-slate-800 hover:border-cyan-500 transition-all shadow-sm hover:shadow-xl dark:hover:shadow-neon-cyan hover:-translate-y-0.5 sm:hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Game Card Header Image */}
                  <div className="relative h-28 sm:h-40 w-full overflow-hidden bg-slate-900">
                    <Image
                      src={game.bannerUrl}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                    {/* Popularity Badge */}
                    {idx === 0 && config.featuredBadgeText && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 font-display z-10">
                        <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{config.featuredBadgeText}</span>
                      </div>
                    )}

                    {/* Publisher Badge */}
                    {game.publisher && (
                      <div className="hidden sm:block absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 font-display z-10">
                        {game.publisher}
                      </div>
                    )}

                    {/* In-Game Icon Avatar - elevated with high z-index and clear visibility */}
                    <div className="absolute bottom-2 left-2.5 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-xl bg-slate-900 z-20 group-hover:scale-105 transition-transform">
                      <Image
                        src={game.iconUrl}
                        alt={game.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Card Body - clean spacing with no overlapping obstruction */}
                  <div className="p-2.5 sm:p-5 pt-3 sm:pt-4 space-y-1 sm:space-y-1.5">
                    <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {game.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                      {game.nameKh}
                    </p>

                    <div className="hidden sm:flex pt-1.5 items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">ផ្ទៀងផ្ទាត់ឈ្មោះស្វ័យប្រវត្ត & ចូលភ្លាមៗ</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Starting Price & Action */}
                <div className="p-2.5 sm:p-5 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0 bg-slate-50 dark:bg-slate-900/30">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                      ចាប់ពី:
                    </span>
                    <div className="text-xs sm:text-sm font-black text-cyan-600 dark:text-cyan-400 font-display">
                      {minPricePkg ? formatUSD(minPricePkg.sellingPriceUSD) : "$0.99"}{" "}
                      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal">
                        ({minPricePkg ? formatKHR(minPricePkg.sellingPriceKHR) : "4,100 ៛"})
                      </span>
                    </div>
                  </div>

                  <span className="w-full sm:w-auto justify-center px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-800 dark:text-slate-200 text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                    <span>បញ្ចូលពេជ្រ</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
