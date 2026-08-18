"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_twelve/8C3B1791-0B49-4B7E-B069-C746C7CF6F65.JPG",
  "/assets/highlights/summer_week_twelve/D3FA9EEC-F140-4CE7-9B2F-65B3BAE014E0.JPG",
  "/assets/highlights/summer_week_twelve/44B158CD-2668-4877-85F0-A45D4F56F958.JPG",
  "/assets/highlights/summer_week_twelve/9CB7AFC5-A7A7-49C1-8417-5C17358D88AF.JPG",
  "/assets/highlights/summer_week_twelve/7FC17749-C35E-47DB-8B80-2BC59AFB8E19.JPG",
  "/assets/highlights/summer_week_twelve/C87A6102-AD14-40A3-A0DE-8474C4FD0026.JPG",
  "/assets/highlights/summer_week_eleven/86334E46-E95A-4381-9DA4-1E01CEA619E7.JPG",
];

const PRIMARY_HIGHLIGHTS = [
  { emoji: "💛", label: "Meet Miss Joy", desc: "A very special new friend — last week of camp, filled with joy" },
  { emoji: "🤝", label: "Friendship Building", desc: "Communicate, share feelings, and appreciate the relationships we've built" },
  { emoji: "🏡", label: "Classroom Redesign", desc: "Students designed and decorated a space that feels like home" },
  { emoji: "📸", label: "Family Photos", desc: "Bring a family photo so the classroom feels warm and connected" },
  { emoji: "🌅", label: "A Joyful Close", desc: "Learning, laughing, growing, and connecting — a beautiful end to summer" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "☀️", label: "12 Weeks in Review", desc: "Mud, rain, sandcastles, water slides, costumes, popsicles, and new friends" },
  { emoji: "🧮", label: "Math Review", desc: "Place value, word problems, data, fractions, time, and multiplication" },
  { emoji: "📚", label: "ELA Review", desc: "Fiction vs nonfiction, comprehension, spelling, grammar, and writing" },
  { emoji: "🍪", label: "Chocolate Chip Cookies", desc: "Last cooking activity — personal dough, mixed as a class, baked one cookie each" },
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
            Week 12 Recap
          </span>
          <h2
            className={`text-3xl md:text-4xl font-bold font-heading mb-2 ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            See Week 12 of Our Summer Program
          </h2>
          <p className={`text-base font-body ${dark ? "text-slate-300" : "text-gray-500"}`}>
            The last week of camp — Miss Joy, friendship, cookies, and a 12-week summer in review.
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
                alt="Week 12 highlight"
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
            Week 12 closed summer camp. Primary students met Miss Joy, practiced friendship and communication, and helped redesign the classroom so it feels like a home away from home. Elementary students wrapped 12 weeks of play with a full math and ELA review — then baked their own chocolate chip cookies. Bittersweet, joyful, and a beautiful way to begin the school year.
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
            href="/highlights/summer/week-12"
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm text-white ${
              dark
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            View Full Week 12 Recap →
          </Link>
        </div>
      </div>
    </section>
  );
}
