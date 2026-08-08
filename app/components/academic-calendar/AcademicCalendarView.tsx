"use client";

import { motion } from "framer-motion";
import {
  ACADEMIC_YEAR_LABEL,
  HOLIDAYS,
  KEY_DATES,
  seasonStyles,
  type AcademicSeason,
} from "@/app/lib/academic-calendar-data";

function SeasonBadge({ season }: { season: AcademicSeason }) {
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

type AcademicCalendarViewProps = {
  variant: "public" | "parent";
  onEnroll?: () => void;
  onContact?: () => void;
};

export default function AcademicCalendarView({
  variant,
  onEnroll,
  onContact,
}: AcademicCalendarViewProps) {
  const isPublic = variant === "public";
  const sectionPadding = isPublic ? "px-8 sm:px-12 lg:px-16" : "";
  const contentMaxWidth = isPublic ? "max-w-4xl mx-auto" : "";

  return (
    <>
      {/* Hero / Header */}
      <section
        className={
          isPublic
            ? `pt-32 pb-16 ${sectionPadding}`
            : "mb-8"
        }
      >
        <div className={isPublic ? `${contentMaxWidth} text-center` : ""}>
          {isPublic ? (
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" as const }}
            >
              <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
                Academic Calendar
              </span>
            </motion.div>
          ) : (
            <p className="text-sm font-semibold uppercase tracking-widest text-primary font-body mb-2">
              Academic Calendar
            </p>
          )}

          <motion.h1
            className={
              isPublic
                ? "text-4xl md:text-5xl font-bold text-gray-800 mb-4 font-heading"
                : "text-3xl font-bold text-gray-800 mb-2 font-heading"
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: isPublic ? 0.1 : 0,
              ease: "easeOut" as const,
            }}
          >
            {ACADEMIC_YEAR_LABEL} Student Calendar
          </motion.h1>

          <motion.p
            className={
              isPublic
                ? "text-lg md:text-xl text-gray-600 font-body"
                : "text-gray-500 font-body"
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: isPublic ? 0.2 : 0.05,
              ease: "easeOut" as const,
            }}
          >
            Sage Field Private School · Round Rock, Texas
          </motion.p>
        </div>
      </section>

      {/* Key Dates */}
      <section className={isPublic ? `pb-16 ${sectionPadding}` : "mb-10"}>
        <div className={contentMaxWidth}>
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-8 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            Key School Year Dates
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body mt-1">
                {KEY_DATES.firstDay.label}
              </p>
              <p className="text-3xl font-bold text-gray-800 font-heading leading-tight">
                {KEY_DATES.firstDay.monthDay}
                <br />
                {KEY_DATES.firstDay.year}
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut" as const,
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 font-body mt-1">
                {KEY_DATES.lastDay.label}
              </p>
              <p className="text-3xl font-bold text-gray-800 font-heading leading-tight">
                {KEY_DATES.lastDay.monthDay}
                <br />
                {KEY_DATES.lastDay.year}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Holiday Schedule */}
      <section className={isPublic ? `pb-16 ${sectionPadding}` : ""}>
        <div className={contentMaxWidth}>
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-2 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            Holiday & Break Schedule
          </motion.h2>
          <motion.p
            className="text-gray-500 font-body mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: 0.05,
              ease: "easeOut" as const,
            }}
          >
            School is closed on the following dates.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOLIDAYS.map((h, i) => (
              <motion.div
                key={h.name}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: "easeOut" as const,
                }}
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

      {/* CTA — public only */}
      {isPublic && onEnroll && onContact && (
        <section className={`py-16 ${sectionPadding} bg-white`}>
          <motion.div
            className={`${contentMaxWidth} text-center`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading text-gray-800">
              Ready to join us?
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-body">
              Enrollment for School Year {ACADEMIC_YEAR_LABEL} is now open.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onEnroll}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Enroll Now
              </button>
              <button
                onClick={onContact}
                className="px-8 py-4 border-2 border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 font-body cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </section>
      )}
    </>
  );
}
