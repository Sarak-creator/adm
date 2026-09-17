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
        return "grid-cols-1 sm:grid-cols-2";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 3:
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  }, [config.columns]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Gamepad2 className="w-4 h-4" />
            <span>{config.badge || "បញ្ជីហ្គេមទាំងអស់ (Game Catalogue)"}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            {config.title || "ជ្រើសរើសហ្គេមដែលអ្នកចង់បញ្ចូលពេជ្រ"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {config.subtitle || "គាំទ្រការទូទាត់តាម KHQR គ្រប់ហ្គេមទាំងអស់"}
          </p>
        </div>

        {/* Real-time Search Bar */}
        {config.showSearchBar && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ស្វែងរកហ្គេម (Search game)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {filteredGames.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border-slate-800 space-y-3">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            រកមិនឃើញហ្គេមដែលត្រូវនឹង &ldquo;{search}&rdquo; ទេ
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs text-cyan-400 hover:underline"
          >
            សម្អាតការស្វែងរក (Clear search)
          </button>
        </div>
      ) : (
        <div className={`grid ${gridColsClass} gap-6`}>
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
                className="group glass-card rounded-2xl overflow-hidden border-slate-800 hover:border-cyan-500/50 transition-all hover:shadow-neon-cyan hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Game Card Header Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <Image
                      src={game.bannerUrl}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d111e] via-[#0d111e]/40 to-transparent" />

                    {/* Popularity Badge */}
                    {idx === 0 && config.featuredBadgeText && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 font-display">
                        <Flame className="w-3 h-3" />
                        <span>{config.featuredBadgeText}</span>
                      </div>
                    )}

                    {/* Publisher Badge */}
                    {game.publisher && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 font-display">
                        {game.publisher}
                      </div>
                    )}

                    {/* In-Game Icon Avatar */}
                    <div className="absolute -bottom-3 left-4 w-14 h-14 rounded-xl overflow-hidden border-2 border-cyan-400 shadow-lg bg-slate-900">
                      <Image
                        src={game.iconUrl}
                        alt={game.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 pt-6 space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {game.nameKh}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
                      <Zap className="w-3.5 h-3.5" />
                      <span>ផ្ទៀងផ្ទាត់ឈ្មោះស្វ័យប្រវត្ត & ចូលភ្លាមៗ</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Starting Price & Action */}
                <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/30">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">ចាប់ពី (Starting from):</span>
                    <div className="text-sm font-black text-cyan-400 font-display">
                      {minPricePkg ? formatUSD(minPricePkg.sellingPriceUSD) : "$0.99"}{" "}
                      <span className="text-xs text-slate-400 font-normal">
                        ({minPricePkg ? formatKHR(minPricePkg.sellingPriceKHR) : "4,100 ៛"})
                      </span>
                    </div>
                  </div>

                  <span className="px-3.5 py-2 rounded-xl bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1">
                    <span>បញ្ចូលពេជ្រ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
