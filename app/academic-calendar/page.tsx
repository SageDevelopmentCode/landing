"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactDialog from "../components/ContactDialog";
import WaitlistDialog from "../components/WaitlistDialog";

// ── Season pill colors ────────────────────────────────────────────────────────

const seasonStyles: Record<string, { bg: string; text: string; dot: string }> =
  {
    summer: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    fall: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
    winter: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-400" },
    spring: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  };

function SeasonBadge({ season }: { season: keyof typeof seasonStyles }) {
  const s = seasonStyles[season];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${s.bg} ${s.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {season}
    </span>
  );
}

// ── Holiday data ──────────────────────────────────────────────────────────────

const holidays = [
  {
    name: "Labor Day",
    dates: "September 7, 2026",
    season: "fall" as const,
    note: "School closed",
  },
  {
    name: "Thanksgiving Break",
    dates: "November 23–27, 2026",
    season: "fall" as const,
    note: "School closed",
  },
  {
    name: "Winter Break",
    dates: "December 21, 2026 – January 1, 2027",
    season: "winter" as const,
    note: "School closed",
  },
  {
    name: "MLK Jr. Day",
    dates: "January 18, 2027",
    season: "winter" as const,
    note: "School closed",
  },
  {
    name: "President's Day",
    dates: "February 15, 2027",
    season: "winter" as const,
    note: "School closed",
  },
  {
    name: "Spring Break",
    dates: "March 15–19, 2027",
    season: "spring" as const,
    note: "School closed",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function AcademicCalendarPage() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* ── Hero / Header ─────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Academic Calendar
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 font-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            2026–2027 Student Calendar
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Sage Field Private School · Round Rock, Texas
          </motion.p>
        </div>
      </section>

      {/* ── Key Dates ─────────────────────────────────────────────────────── */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-8 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Key School Year Dates
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* First Day */}
            <motion.div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body mt-1">
                First Day of School
              </p>
              <p className="text-3xl font-bold text-gray-800 font-heading leading-tight">
                August 17,
                <br />
                2026
              </p>
            </motion.div>

            {/* Last Day */}
            <motion.div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body mt-1">
                Last Day of School
              </p>
              <p className="text-3xl font-bold text-gray-800 font-heading leading-tight">
                May 31,
                <br />
                2027
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Summer Program ────────────────────────────────────────────────── */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-8 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Summer Program 2026
          </motion.h2>

          <motion.div
            className="bg-primary/10 border border-primary/20 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <SeasonBadge season="summer" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary font-body">
                  Coming Up First
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 font-heading mb-2">
                May 26 – August 13, 2026
              </h3>
              <p className="text-gray-600 font-body leading-relaxed">
                Our summer program runs before the school year begins. An
                immersive outdoor experience focused on exploration, nature
                study, and hands-on learning. Enrollment is now open.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => setIsWaitlistDialogOpen(true)}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer whitespace-nowrap"
              >
                Enroll Now
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Holiday Schedule ──────────────────────────────────────────────── */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-2 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Holiday & Break Schedule
          </motion.h2>
          <motion.p
            className="text-gray-500 font-body mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
          >
            School is closed on the following dates.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map((h, i) => (
              <motion.div
                key={h.name}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
              >
                <SeasonBadge season={h.season} />
                <div>
                  <h3 className="text-lg font-bold text-gray-800 font-heading mb-1">
                    {h.name}
                  </h3>
                  <p className="text-gray-500 text-sm font-body">{h.dates}</p>
                </div>
                <span className="self-start text-xs font-medium text-gray-400 font-body border border-gray-200 rounded-full px-3 py-0.5">
                  {h.note}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading text-gray-800">
            Ready to join us?
          </h2>
          <p className="text-lg text-gray-600 mb-8 font-body">
            Enrollment for Summer 2026 and School Year 2026–2027 is now open.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsWaitlistDialogOpen(true)}
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
            >
              Enroll Now
            </button>
            <button
              onClick={() => setIsContactDialogOpen(true)}
              className="px-8 py-4 border-2 border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 font-body cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />

      <ContactDialog
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      <WaitlistDialog
        isOpen={isWaitlistDialogOpen}
        onClose={() => setIsWaitlistDialogOpen(false)}
      />
    </div>
  );
}
