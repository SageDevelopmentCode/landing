"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  "/assets/highlights/summer_week_three/IMG_9313.JPG",
  "/assets/highlights/summer_week_three/4C53798C-920D-4497-B46C-1037E6FF21E4.JPG",
  "/assets/highlights/summer_week_three/ED35AB4E-8E56-43C6-ADA7-A7D9CDE3C95C.jpeg",
  "/assets/highlights/summer_week_three/4591E194-779B-46AC-A893-B9E75B6D64A7.JPG",
  "/assets/highlights/summer_week_three/8CE3DD93-63A1-4FD4-A81C-B4949CA60664.JPG",
  "/assets/highlights/summer_week_three/IMG_9275.jpg",
  "/assets/highlights/summer_week_three/3F03181F-5761-416B-8C7D-003DA143D804.JPG",
];

const PRIMARY_HIGHLIGHTS = [
  { emoji: "🧠", label: "Montessori Independence", desc: "Choosing between phonics, math, writing, life skills, and art at their own pace" },
  { emoji: "📖", label: "Phonics: CVC, Blends & Magic E", desc: "Letter identification through digraphs and Magic E — many blending independently" },
  { emoji: "🍌", label: "Banana Bread Muffins & Popsicles", desc: "Banana bread chocolate chip muffins and banana yogurt popsicles — a big hit" },
  { emoji: "👨‍👩‍👧", label: "Lunch with a Loved One", desc: "A joyful family event celebrating the community we're building" },
  { emoji: "🌊", label: "Beach Bash Field Friday", desc: "Water slide, ocean-themed slime, ice cream bar, and painted sea shells" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "📝", label: "Context Clues & Vocabulary", desc: "Using context in passages; charades game to act out vocabulary words" },
  { emoji: "✖️", label: "Multiplication Fluency", desc: "Arrays for lower el; 2-digit × 1-digit for upper el — facts 6–12" },
  { emoji: "📐", label: "Area & Perimeter Zoo Project", desc: "Two multiplication facts + a zoo animal → find area/perimeter, draw the enclosure, build a class zoo" },
  { emoji: "🍽️", label: "Life Skills: Dishwashing", desc: "Each child responsible for two dishes — real soap, sponge, and water" },
  { emoji: "👨‍👩‍👧", label: "Lunch with a Loved One", desc: "First family event — families got a peek into a day at Sage Field" },
];

interface WeekRecapPreviewProps {
  className?: string;
}

export default function WeekRecapPreview({ className = "" }: WeekRecapPreviewProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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
          <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
            Week 3 Recap
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
            See Week 3 of Our Summer Program
          </h2>
          <p className="text-base text-gray-500 font-body">
            Week 3 is complete — and it&apos;s been our biggest week yet. Here&apos;s a glimpse at what our students experienced.
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
                alt="Week 3 highlight"
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
          <p className="text-base text-gray-600 font-body leading-relaxed">
            Week 3 was all about independence and community. Primary students embraced Montessori work cycles, made breakthroughs in phonics, and cooked banana bread muffins and banana yogurt popsicles. Elementary students dove into context clues, multiplication fluency, an area and perimeter zoo project, and a life skills dishwashing lesson. Both groups celebrated with a joyful Lunch with a Loved One family event and a splashy Beach Bash Field Friday.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🌱</span>
                </div>
                <h4 className="text-sm font-bold font-heading text-gray-800">Primary</h4>
              </div>
              <ul className="space-y-1.5">
                {PRIMARY_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-[11px] text-gray-400 font-body">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">📐</span>
                </div>
                <h4 className="text-sm font-bold font-heading text-gray-800">Elementary</h4>
              </div>
              <ul className="space-y-1.5">
                {ELEMENTARY_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-[11px] text-gray-400 font-body">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center mt-7">
          <Link
            href="/highlights/summer/week-3"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
          >
            View Full Week 3 Recap →
          </Link>
        </div>
      </div>
    </section>
  );
}
