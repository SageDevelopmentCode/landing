"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_six/1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
  "/assets/highlights/summer_week_six/1D47ADF7-BFF8-4E74-8A51-E0444E1E5AB2.JPG",
  "/assets/highlights/summer_week_six/337A7F28-CB3D-47AD-9B02-76706D3EC299.JPG",
  "/assets/highlights/summer_week_six/6015040C-CE16-4977-A8FF-8243A4968654.JPG",
  "/assets/highlights/summer_week_six/6ED6BA87-AB2C-42FA-97F4-57719463AB1A.JPG",
  "/assets/highlights/summer_week_six/IMG_9916.JPG",
  "/assets/highlights/summer_week_six/sagefield_1783398462180.jpg",
];

const PRIMARY_HIGHLIGHTS = [
  { emoji: "🍌", label: "Banana Oatmeal Pancakes", desc: "Made from scratch — food safety, careful movements, and real pride" },
  { emoji: "🍍", label: "Pineapple Popsicles", desc: "Cooking together was a highlight of the week" },
  { emoji: "📖", label: "Core Foundations", desc: "Reading and foundational skills continuing to grow" },
  { emoji: "💪", label: "Resilience & Growth", desc: "Stretching brains, becoming thoughtful students and kind friends" },
  { emoji: "🌱", label: "Hands-On Learning", desc: "Strong foundations give students freedom to explore through play" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "🧮", label: "Multi-Step Word Problems", desc: "Upper el: all four operations; lower el: two-step equations" },
  { emoji: "📚", label: "Comparing & Contrasting", desc: "Venn Diagrams to compare stories across texts" },
  { emoji: "🌋", label: "Natural Disaster Projects", desc: "Final drafts wrapping up, 3D shoe box models starting" },
  { emoji: "🎉", label: "Halfway Through Summer!", desc: "6 weeks of growth — students and families adjusting beautifully" },
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
            Week 6 Recap
          </span>
          <h2
            className={`text-3xl md:text-4xl font-bold font-heading mb-2 ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            See Week 6 of Our Summer Program
          </h2>
          <p className={`text-base font-body ${dark ? "text-slate-300" : "text-gray-500"}`}>
            Week 6 hit the halfway mark — and what a week it was. Here&apos;s a glimpse at what our students experienced.
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
                alt="Week 6 highlight"
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
            Week 6 marked the halfway point of summer — and it was full. Primary students made banana oatmeal pancakes and pineapple popsicles from scratch, practicing food safety and building real confidence in the kitchen. Foundational reading and math skills continued to deepen through hands-on play. Elementary students tackled multi-step word problems across all four operations, used Venn Diagrams to compare texts, wrapped up natural disaster research drafts, and started building 3D shoe box models. Six weeks in, students and families have found their rhythm — and the growth shows.
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
            href="/highlights/summer/week-6"
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm text-white ${
              dark
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            View Full Week 6 Recap →
          </Link>
        </div>
      </div>
    </section>
  );
}
