"use client";

import { motion } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";
import WeekCardsGrid from "@/app/components/WeekCardsGrid";
import {
  LIVE_SUMMER_WEEKS,
  SCHOOL_YEAR_WEEKS,
} from "@/app/lib/highlights/weeks";

export default function HighlightsIndexPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Highlights
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-bold font-heading text-gray-800 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Program Highlights
          </motion.h1>
          <motion.p
            className="text-lg text-gray-500 font-body max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A look back at each week of our school year and summer programs —
            photos, lessons, and memories.
          </motion.p>
        </div>
      </section>

      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold font-heading text-gray-800 mb-1">
            School Year 2026–27
          </h2>
          <p className="text-sm text-gray-500 font-body">
            Weekly recaps from our school year program.
          </p>
        </div>
        <WeekCardsGrid weeks={SCHOOL_YEAR_WEEKS} sectionKey="school-year" />
      </section>

      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold font-heading text-gray-800 mb-1">
            Summer 2026
          </h2>
          <p className="text-sm text-gray-500 font-body">
            Weekly recaps from our summer program.
          </p>
        </div>
        <WeekCardsGrid weeks={LIVE_SUMMER_WEEKS} sectionKey="summer" />
      </section>

      <Footer />

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>
    </div>
  );
}
