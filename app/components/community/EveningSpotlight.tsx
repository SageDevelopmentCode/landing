"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export type EveningActivity = {
  title: string;
  desc: string;
  detail: string;
  image: string;
};

type EveningSpotlightProps = {
  activities: EveningActivity[];
  onSaveTheDate: () => void;
};

export default function EveningSpotlight({
  activities,
  onSaveTheDate,
}: EveningSpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = activities[activeIndex];

  return (
    <section
      id="about-evening"
      className="py-20 px-8 sm:px-12 lg:px-16 bg-welcome-bg"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sage-600 font-body mb-3">
            Your Evening
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 leading-tight">
            A Cozy Evening Together
          </h2>
          <p className="text-base text-gray-500 font-body mt-3 leading-relaxed">
            Planting, painting, connecting, and creating — all in one beautiful
            evening outdoors.
          </p>
        </motion.div>

        {/* Tabs — desktop */}
        <div
          className="hidden sm:flex gap-8 border-b border-gray-200 mb-10"
          role="tablist"
          aria-label="Evening activities"
        >
          {activities.map((activity, i) => {
            const isActive = activeIndex === i;
            return (
              <button
                key={activity.title}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(i)}
                className={`relative pb-4 text-left transition-colors cursor-pointer ${
                  isActive ? "text-sage-800" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span
                  className={`block text-sm font-semibold font-body ${
                    isActive ? "text-sage-800" : ""
                  }`}
                >
                  {activity.title}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="evening-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-700"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tabs — mobile scroll */}
        <div
          className="sm:hidden flex gap-6 overflow-x-auto pb-3 mb-8 snap-x snap-mandatory border-b border-gray-200 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          role="tablist"
          aria-label="Evening activities"
        >
          {activities.map((activity, i) => {
            const isActive = activeIndex === i;
            return (
              <button
                key={activity.title}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(i)}
                className={`snap-start shrink-0 pb-3 text-left border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "border-sage-700 text-sage-800"
                    : "border-transparent text-gray-400"
                }`}
              >
                <span className="block text-sm font-semibold font-body">
                  {activity.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <Image
                  src={active.image}
                  alt={active.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={activeIndex === 0}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-4">
                  {active.title}
                </h3>
                <p className="text-base text-gray-600 font-body leading-relaxed mb-3">
                  {active.detail}
                </p>
                <p className="text-sm text-gray-400 font-body leading-relaxed">
                  {active.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-base text-gray-600 font-body">
            Four experiences, one evening — we&apos;d love to see your family
            there.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSaveTheDate}
            className="shrink-0 bg-primary hover:bg-primary-hover text-white font-semibold px-7 py-3.5 rounded-xl text-sm font-body shadow-md transition-colors cursor-pointer"
          >
            Save the Date →
          </motion.button>
        </div>
      </div>
    </section>
  );
}
