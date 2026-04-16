"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import WaitlistDialog from "../components/WaitlistDialog";
import EnrollmentCTASection from "../components/EnrollmentCTASection";

const programs = [
  {
    badge: "Summer 2026",
    badgeColor: "bg-badge-bg",
    title: "Summer 2026 Program",
    dates: "May 26 – Aug 13, 2026",
    details: [
      "Ages 4–11",
      "Mon–Thu",
      "12 Weeks",
      "~10 children per class",
      "Field Fridays",
    ],
    description:
      "Twelve weeks of themed adventures, hands-on projects, nature play, art, and academic enrichment in a small, nurturing group.",
    href: "/summer-2026",
    image: "/assets/ImageFive.jpg",
    dateBg: "bg-primary/10",
    dateText: "text-primary",
  },
  {
    badge: "School Year",
    badgeColor: "bg-primary/10",
    title: "School Year 2026–2027",
    dates: "August 17, 2026 – March 2027",
    details: [
      "Ages 4–11",
      "Mon-Thu",
      "6-month commitment",
      "~10 children per class",
      "Field Fridays",
      "Aftercare",
    ],
    description:
      "A full school-year microschool experience blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics.",
    href: "/school-year-2026-2027",
    image: "/assets/ImageTwo.jpg",
    dateBg: "bg-lavender/40",
    dateText: "text-purple-700",
  },
  {
    badge: "Homeschool",
    badgeColor: "bg-emerald-100",
    title: "Homeschool Drop-In",
    dates: "Available for Both Programs",
    details: [
      "Ages 4–11",
      "1–5 Days/Week",
      "Field Fridays",
      "Flexible Scheduling",
    ],
    description:
      "Flexible drop-in program for homeschool families — choose 1 to 5 days per week with ability-based learning, enrichments, and Friday Field Days.",
    href: "/homeschool",
    image: "/assets/After1.png",
    dateBg: "bg-emerald-50",
    dateText: "text-emerald-700",
    ctaLabel: "Request Info",
  },
];

export default function ProgramsPage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 pb-8 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Our Programs
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Explore Our Programs
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 mb-8 font-body max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            Find the right program for your child — from summer adventures to a
            full school year of outdoor, hands-on learning.
          </motion.p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program, index) => (
              <motion.div
                key={program.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 + index * 0.15,
                  ease: "easeOut" as const,
                }}
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                  {/* Banner image */}
                  <div className="relative h-48 w-full">
                    <Image
                      src={program.image}
                      alt={program.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Content area */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Enrollment badge */}
                    <Link
                      href="/apply"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full self-start mb-3 hover:bg-green-200 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Enrollment is now open
                      <span>→</span>
                    </Link>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-black font-heading mb-3">
                      {program.title}
                    </h3>

                    {/* Dates — highlighted pill */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${program.dateBg} ${program.dateText} text-xs font-semibold mb-4 self-start`}
                    >
                      📅 {program.dates}
                    </div>

                    {/* Detail chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {program.details.map((detail) => (
                        <span
                          key={detail}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-text-gray font-body leading-relaxed mb-4 flex-1">
                      {program.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <Link
                        href={program.href}
                        className="text-primary font-semibold text-sm hover:underline"
                      >
                        Learn More
                      </Link>
                      {program.ctaLabel ? (
                        <button
                          onClick={() => setIsWaitlistOpen(true)}
                          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          {program.ctaLabel}
                        </button>
                      ) : (
                        <Link
                          href="/apply"
                          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Enroll Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <EnrollmentCTASection />

      <Footer />
      <FloatingSMSButton />
      <WaitlistDialog
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </div>
  );
}
