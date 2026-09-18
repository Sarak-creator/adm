"use client";

import React, { useState } from "react";
import { FAQConfig } from "@/lib/landing-config";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQAccordionProps {
  config: FAQConfig;
}

export function FAQAccordion({ config }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(
    config.items && config.items.length > 0 ? config.items[0].id : null
  );

  const toggle = (id: string) => {
    setOpenId((curr) => (curr === id ? null : id));
  };

  if (!config.items || config.items.length === 0) return null;

  return (
    <section className="rounded-3xl bg-slate-100/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 shadow-sm dark:shadow-none">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{config.badge || "សំណួរ-ចម្លើយ"}</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
          {config.title || "សំណួរដែលសួរញឹកញាប់"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {config.subtitle || "ស្វែងយល់បន្ថែមអំពីសេវាកម្ម និងរបៀបដោះស្រាយបញ្ហាផ្សេងៗ"}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {config.items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? "bg-white dark:bg-[#090d1a] border-cyan-500 shadow-md dark:shadow-neon-cyan/20"
                  : "bg-white dark:bg-[#070b16]/80 border-slate-200 dark:border-slate-800 hover:border-cyan-400/60 dark:hover:border-slate-700 shadow-sm dark:shadow-none"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-500 dark:text-cyan-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 font-medium">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
