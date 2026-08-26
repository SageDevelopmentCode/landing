"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  SCHOOL_YEAR_LATEST_LOWER,
  SCHOOL_YEAR_LATEST_PREVIEW_IMAGES,
  SCHOOL_YEAR_LATEST_PRIMARY,
  SCHOOL_YEAR_LATEST_RECAP,
  SCHOOL_YEAR_LATEST_UPPER,
} from "@/app/lib/highlights/school-year-latest-preview";

const GRADE_BANDS = [
  {
    title: "Primary",
    subtitle: "Pre-K & Kindergarten",
    emoji: "🌱",
    iconBg: (dark: boolean) => (dark ? "bg-violet-500/20" : "bg-primary/10"),
    highlights: SCHOOL_YEAR_LATEST_PRIMARY,
  },
  {
    title: "Lower Elementary",
    subtitle: "1st & 2nd Grade",
    emoji: "✨",
    iconBg: (dark: boolean) => (dark ? "bg-indigo-500/20" : "bg-sage-100"),
    highlights: SCHOOL_YEAR_LATEST_LOWER,
  },
  {
    title: "Upper Elementary",
    subtitle: "3rd & 4th Grade",
    emoji: "📐",
    iconBg: (dark: boolean) => (dark ? "bg-sky-500/20" : "bg-sky-100"),
    highlights: SCHOOL_YEAR_LATEST_UPPER,
  },
];

interface WeekRecapPreviewProps {
  className?: string;
  variant?: "light" | "dark";
}

export default function WeekRecapPreview({ className = "", variant = "light" }: WeekRecapPreviewProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const dark = variant === "dark";
  const recap = SCHOOL_YEAR_LATEST_RECAP;

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    let pos = 0;
    const tick = () => {
      if (el) {
        pos += 0.6;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className={`py-16 px-8 sm:px-12 lg:px-16 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span
            className={`inline-block px-5 py-1.5 text-sm font-semibold rounded-full mb-4 font-body ${
              dark ? "bg-white/10 text-violet-200" : "bg-badge-bg text-black"
            }`}
          >
            {recap.badge}
          </span>
          <h2
            className={`text-3xl md:text-4xl font-bold font-heading mb-2 ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            {recap.heading}
          </h2>
          <p className={`text-base font-body ${dark ? "text-slate-300" : "text-gray-500"}`}>
            {recap.subtitle}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] mb-8"
        >
          {[...SCHOOL_YEAR_LATEST_PREVIEW_IMAGES, ...SCHOOL_YEAR_LATEST_PREVIEW_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-64 flex-shrink-0 aspect-[4/3] rounded-xl overflow-hidden shadow-md"
            >
              <Image
                src={src}
                alt="School year week 1 highlight"
                fill
                className="object-cover"
                sizes="256px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className={`text-base font-body leading-relaxed ${dark ? "text-slate-300" : "text-gray-600"}`}>
            {recap.body}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {GRADE_BANDS.map((band) => (
              <div
                key={band.title}
                className={`rounded-xl p-4 shadow-sm border ${
                  dark
                    ? "bg-white/[0.07] backdrop-blur-sm border-white/10"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${band.iconBg(dark)}`}
                  >
                    <span className="text-sm">{band.emoji}</span>
                  </div>
                  <h4 className={`text-sm font-bold font-heading ${dark ? "text-white" : "text-gray-800"}`}>
                    {band.title}
                  </h4>
                </div>
                <p className={`text-[11px] font-body mb-3 ml-10 ${dark ? "text-slate-400" : "text-gray-400"}`}>
                  {band.subtitle}
                </p>
                <ul className="space-y-1.5">
                  {band.highlights.map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                      <div>
                        <p className={`text-xs font-bold font-body leading-tight ${dark ? "text-violet-100" : "text-gray-800"}`}>
                          {item.label}
                        </p>
                        <p className={`text-[11px] font-body ${dark ? "text-slate-400" : "text-gray-400"}`}>
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center mt-7">
          <Link
            href={recap.href}
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm text-white ${
              dark
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {recap.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
