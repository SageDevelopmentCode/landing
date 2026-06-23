"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  "/assets/highlights/summer_week_four/IMG_9586.JPG",
  "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
  "/assets/highlights/summer_week_four/27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG",
  "/assets/highlights/summer_week_four/5E38B790-B4AF-405D-BC71-0C6A367E4E57.JPG",
  "/assets/highlights/summer_week_four/A4107889-4FC8-4F4F-BE2E-5F49868F3AA4 2.JPG",
  "/assets/highlights/summer_week_four/EAFF91EE-8496-4132-AA3B-3587816CB2B8.JPG",
  "/assets/highlights/summer_week_four/DFDDC9CF-2547-4219-9893-C3EB68F84E88 2.JPG",
];

const PRIMARY_HIGHLIGHTS = [
  { emoji: "👋", label: "New Students & New Friendships", desc: "Week 4 brought new families — welcomed with warmth and kindness" },
  { emoji: "📖", label: "CVC Words & Early Reading", desc: "Letter recognition, letter sounds, and blending CVC words" },
  { emoji: "➕", label: "Addition & Number Sense", desc: "Hands-on addition practice alongside patterns and early math concepts" },
  { emoji: "🔢", label: "Patterns & Early Math", desc: "Identifying and extending patterns as a foundation for mathematical thinking" },
  { emoji: "🧹", label: "Life Skills & Independence", desc: "Practical life activities building responsibility and self-sufficiency" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "📚", label: "Summarizing Fiction & Non-Fiction", desc: "Reading passages and books, summarizing key ideas — mastered by Thursday" },
  { emoji: "🔵", label: "Venn Diagrams: Compare & Contrast", desc: "Using Venn diagrams to compare fiction and non-fiction texts" },
  { emoji: "✖️", label: "Multi-Digit Multiplication", desc: "Area model + standard algorithm for upper el; fact fluency (6+) for lower el" },
  { emoji: "🍓", label: "Strawberry Jam Cooking", desc: "Made jam from scratch — maceration, stovetop reduction, and tasting" },
  { emoji: "🚀", label: "STEM Adventure Friday", desc: "Marshmallow-spaghetti towers, baking soda volcanoes, take-home rockets" },
];

interface WeekRecapPreviewProps {
  className?: string;
  variant?: "light" | "dark";
}

export default function WeekRecapPreview({ className = "", variant = "light" }: WeekRecapPreviewProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const dark = variant === "dark";

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
            Week 4 Recap
          </span>
          <h2
            className={`text-3xl md:text-4xl font-bold font-heading mb-2 ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            See Week 4 of Our Summer Program
          </h2>
          <p className={`text-base font-body ${dark ? "text-slate-300" : "text-gray-500"}`}>
            Week 4 is complete — and it was packed with learning and adventure. Here&apos;s a glimpse at what our students experienced.
          </p>
        </motion.div>
      </div>

      {/* Auto-scroll photo strip */}
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
          {[...PREVIEW_IMAGES, ...PREVIEW_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-64 flex-shrink-0 aspect-[4/3] rounded-xl overflow-hidden shadow-md"
            >
              <Image
                src={src}
                alt="Week 4 highlight"
                fill
                className="object-cover"
                sizes="256px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className={`text-base font-body leading-relaxed ${dark ? "text-slate-300" : "text-gray-600"}`}>
            Week 4 brought new faces and serious academic momentum. Primary students dove into CVC words, phonics, early number sense, and the independence that defines our Montessori environment. Elementary students tackled multi-digit multiplication, compared fiction and non-fiction with Venn diagrams, made strawberry jam from scratch, and capped the week with STEM Adventure Friday — marshmallow towers, baking soda volcanoes, and take-home rockets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {/* Primary card */}
            <div
              className={`rounded-xl p-4 shadow-sm border ${
                dark
                  ? "bg-white/[0.07] backdrop-blur-sm border-white/10"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    dark ? "bg-violet-500/20" : "bg-primary/10"
                  }`}
                >
                  <span className="text-sm">🌱</span>
                </div>
                <h4 className={`text-sm font-bold font-heading ${dark ? "text-white" : "text-gray-800"}`}>
                  Primary
                </h4>
              </div>
              <ul className="space-y-1.5">
                {PRIMARY_HIGHLIGHTS.map((item) => (
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

            {/* Elementary card */}
            <div
              className={`rounded-xl p-4 shadow-sm border ${
                dark
                  ? "bg-white/[0.07] backdrop-blur-sm border-white/10"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    dark ? "bg-indigo-500/20" : "bg-sage-100"
                  }`}
                >
                  <span className="text-sm">📐</span>
                </div>
                <h4 className={`text-sm font-bold font-heading ${dark ? "text-white" : "text-gray-800"}`}>
                  Elementary
                </h4>
              </div>
              <ul className="space-y-1.5">
                {ELEMENTARY_HIGHLIGHTS.map((item) => (
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
          </div>
        </motion.div>

        <div className="flex justify-center mt-7">
          <Link
            href="/highlights/summer/week-4"
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm text-white ${
              dark
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            View Full Week 4 Recap →
          </Link>
        </div>
      </div>
    </section>
  );
}
