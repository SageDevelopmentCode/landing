"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_five/077864BA-405A-4468-8A16-0FB0AFBC8CB0.JPG",
  "/assets/highlights/summer_week_five/39A6CEAD-799A-4EC3-8F59-D95B4C419D9B.JPG",
  "/assets/highlights/summer_week_five/61997CDB-20A1-4835-BE41-3ABB4BF37DEA.JPG",
  "/assets/highlights/summer_week_five/7849AC4D-E6E4-4F8C-BEDC-56401FBAB1A7.JPG",
  "/assets/highlights/summer_week_five/E3BD0EC6-88F5-48F2-B510-591805C426F8.JPG",
  "/assets/highlights/summer_week_five/D08CDD06-DF61-4D1B-B1F4-CF3D9FB4D665.JPG",
  "/assets/highlights/summer_week_five/69BAEEC0-7C4B-4821-8595-02152DC7E7FB.JPG",
];

const PRIMARY_HIGHLIGHTS = [
  { emoji: "🐍", label: "Animal Architects & Snakes", desc: "Discovered how animals build homes — then dove into snakes by student request" },
  { emoji: "🍳", label: "Egg Bites & Popsicles", desc: "Made their own food from start to finish — fine motor skills and real confidence" },
  { emoji: "📖", label: "Core Skills — Reading & Math", desc: "Letter recognition, CVC words, counting, addition, and subtraction through play" },
  { emoji: "🎨", label: "Product Art: Snake Crafts", desc: "Multi-step guided snake crafts — intention, materials, and a finished goal" },
  { emoji: "🌿", label: "New Faces, Fuller Hearts", desc: "New families joined — and the warmth in our backyard grew right along with our circle" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "🧠", label: "Making Inferences", desc: "Context clues to draw meaning beyond the page — clicked naturally this week" },
  { emoji: "➗", label: "Division Strategies", desc: "Upper el: bins, marbles, drawn circles. Lower el: daily multiplication number focus" },
  { emoji: "🌋", label: "Natural Disaster Research", desc: "Each student chose their disaster — research drafted, dioramas coming next week" },
  { emoji: "🐍", label: "Snake Deep Dive", desc: "Student questions and stories sparked a full classroom exploration of snakes" },
  { emoji: "🦁", label: "Safari Adventure Friday", desc: "Four hours of Safari Bingo, handmade animal masks, and an outdoor scavenger hunt" },
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
            Week 5 Recap
          </span>
          <h2
            className={`text-3xl md:text-4xl font-bold font-heading mb-2 ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            See Week 5 of Our Summer Program
          </h2>
          <p className={`text-base font-body ${dark ? "text-slate-300" : "text-gray-500"}`}>
            Week 5 is complete — and it was one for the books. Here&apos;s a glimpse at what our students experienced.
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
                alt="Week 5 highlight"
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
            Week 5 was one for the books. New kids joined, sand was delivered, and the mud kitchen doubled in size. Primary students explored animal architects, dove into snakes by student request, and made their own egg bites and popsicles. Elementary students made inferences, tackled division with hands-on manipulatives, launched natural disaster research projects, and capped the week with four hours of full Safari Adventure — bingo, animal masks, and a scavenger hunt.
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
            href="/highlights/summer/week-5"
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm text-white ${
              dark
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            View Full Week 5 Recap →
          </Link>
        </div>
      </div>
    </section>
  );
}
