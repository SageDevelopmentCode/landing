"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { WeekEntry } from "@/app/lib/highlights/weeks";

export default function WeekCardsGrid({
  weeks,
  sectionKey,
}: {
  weeks: WeekEntry[];
  sectionKey: string;
}) {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {weeks.map((entry, i) => {
        const isLive = !!entry.href;

        const cardInner = (
          <motion.div
            className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 ${
              isLive
                ? "hover:shadow-md hover:scale-[1.02] cursor-pointer"
                : "opacity-70"
            }`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
          >
            <div className="relative w-full aspect-[4/3] bg-gray-100">
              {isLive && entry.coverImage ? (
                <Image
                  src={entry.coverImage}
                  alt={`Week ${entry.week} — ${entry.theme}`}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">📅</span>
                  <span className="text-xs font-semibold text-gray-400 font-body">
                    Coming Soon
                  </span>
                </div>
              )}

              <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-full font-body shadow-sm">
                Week {entry.week}
              </span>

              {isLive && (
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-sage-700 text-xs font-bold rounded-full font-body shadow-sm">
                  ✓ Live
                </span>
              )}
            </div>

            <div className="p-5">
              <p className="text-xs text-gray-400 font-body mb-1">{entry.dates}</p>
              <h3 className="text-base font-bold font-heading text-gray-800 mb-3 leading-snug">
                {isLive ? entry.theme : "Coming Soon"}
              </h3>
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary font-body group-hover:underline">
                  View Highlights →
                </span>
              ) : (
                <span className="text-xs text-gray-400 font-body italic">
                  Recap will be posted after the week ends
                </span>
              )}
            </div>
          </motion.div>
        );

        return isLive ? (
          <Link key={`${sectionKey}-${entry.week}`} href={entry.href!} className="block">
            {cardInner}
          </Link>
        ) : (
          <div key={`${sectionKey}-${entry.week}`}>{cardInner}</div>
        );
      })}
    </div>
  );
}
