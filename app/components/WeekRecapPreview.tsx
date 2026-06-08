"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  "/assets/highlights/summer_week_two/570FEA28-D009-4038-B966-EAF9E0C9EE73.JPG",
  "/assets/highlights/summer_week_two/6B95C9E4-E145-49CA-8818-7AFC9B3B8353.JPG",
  "/assets/highlights/summer_week_two/E3AE964D-CC01-41A0-B040-35DCCB27CD4C.JPG",
  "/assets/highlights/summer_week_two/8DC65D50-316D-44DA-88AA-128F72DF019B.JPG",
  "/assets/highlights/summer_week_two/24E4F2AF-5C30-4C23-9B09-8EA71093A1FD.JPG",
  "/assets/highlights/summer_week_two/DC1D10EF-768E-48E1-AFA9-B935172FA14B.JPG",
  "/assets/highlights/summer_week_two/5B961697-D097-476C-9D47-09F547042841.JPG",
];

const PRIMARY_HIGHLIGHTS = [
  { emoji: "📖", label: "CVC Words & Phonemic Awareness", desc: "Listening for sounds, identifying letters, building emerging reader confidence" },
  { emoji: "🔠", label: "Capital & Lowercase Letters", desc: "Practicing letter associations and recognition every day" },
  { emoji: "➕", label: "Addition: Counting On", desc: "Hands-on games and group work to build number sense" },
  { emoji: "🎨", label: "Color Mixing & Sensory Art", desc: "Mud kitchen experiments exploring what happens when colors combine" },
  { emoji: "🍝", label: "Homemade Pasta", desc: "Measuring, mixing, and learning from a beautifully flopped batch" },
  { emoji: "🧃", label: "Strawberry Limeade Popsicles", desc: "Experimenting with flavors and taking pride in the result" },
  { emoji: "🌱", label: "Growing Independence", desc: "More initiative and confidence than Week 1" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "➕", label: "Addition & Subtraction with Regrouping", desc: "Carrying over and borrowing across multiple digits" },
  { emoji: "📝", label: "Main Idea & Supporting Details", desc: "Cone = main idea, ice cream scoops = supporting details" },
  { emoji: "🦁", label: "Animal Research Project", desc: "National Geographic books → rough draft → revised banner" },
  { emoji: "✏️", label: "Revise & Edit", desc: "Rough draft Tuesday, revised and transferred to banner Thursday" },
  { emoji: "📚", label: "Differentiated Groups", desc: "Same focus, split by academic level to meet each learner's needs" },
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
            Week 2 Recap
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
            See Week 2 of Our Summer Program
          </h2>
          <p className="text-base text-gray-500 font-body">
            Week 2 is complete — and the growth has been incredible. Here&apos;s a glimpse at what our students experienced.
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
                alt="Week 2 highlight"
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
            Students continued building their literacy and math foundations, explored color mixing and sensory art in the mud kitchen, and made homemade pasta (that gloriously flopped!) plus strawberry limeade popsicles. Elementary students dove into regrouping, main idea, and a full animal research project.
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
            href="/highlights/summer/week-2"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
          >
            View Full Week 2 Recap →
          </Link>
        </div>
      </div>
    </section>
  );
}
