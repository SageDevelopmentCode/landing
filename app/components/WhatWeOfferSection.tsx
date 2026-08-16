"use client";

import WeeklySchedule from "./WeeklySchedule";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const programs = [
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
    ctaHref: "/apply?tab=school-year",
  },
  {
    badge: "Homeschool",
    badgeColor: "bg-emerald-100",
    title: "Homeschool Drop-In",
    dates: "Available for Both Programs",
    details: [
      "Ages 4–11",
      "1–3 Days/Week",
      "Field Fridays",
      "Flexible Scheduling",
    ],
    description:
      "Flexible drop-in program for homeschool families — choose 1 to 3 days per week with ability-based learning, enrichments, and Friday Field Days.",
    href: "/homeschool",
    image: "/assets/After1.png",
    dateBg: "bg-emerald-50",
    dateText: "text-emerald-700",
    ctaHref: "/apply?tab=homeschool",
  },
];

export default function WhatWeOfferSection() {
  return (
    <section
      id="what-we-offer"
      className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex items-center justify-center"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* What We Offer Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            What We Offer
          </span>
        </motion.div>

        {/* Two Column Layout - Reversed from WelcomeSection */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column: Weekly Schedule */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            <WeeklySchedule />
          </motion.div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            {/* Title */}
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: "easeOut" as const,
              }}
            >
              What We Offer
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut" as const,
              }}
            >
              Education Through Connection and Exploration
            </motion.p>

            {/* Description Paragraphs */}
            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut" as const,
              }}
            >
              Sage Field operates as a private microschool, not a child-care or
              daycare center. We focus on{" "}
              <span className="text-primary font-semibold">
                whole-child growth
              </span>
              ,{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              ,{" "}
              <span className="text-primary font-semibold">
                social development
              </span>
              , and{" "}
              <span className="text-primary font-semibold">
                hands-on experiences
              </span>{" "}
              that promote creativity and curiosity.
            </motion.p>

            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.4,
                ease: "easeOut" as const,
              }}
            >
              Our days are designed around{" "}
              <span className="text-primary font-semibold">movement</span>,{" "}
              <span className="text-primary font-semibold">
                outdoor exploration
              </span>
              , and{" "}
              <span className="text-primary font-semibold">
                project-based learning
              </span>
              , with minimal worksheets and a focus on real-world engagement.
              This structure supports emotional stability and helps children
              feel confident and connected each day.
            </motion.p>
          </div>
        </div>

        {/* Our Programs Subsection */}
        <div className="mt-20">
          {/* Badge */}
          <motion.div
            className="flex justify-start mb-4"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Our Programs
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-black font-heading mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Explore Our Programs
          </motion.h2>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {programs.map((program, index) => (
              <motion.div
                key={program.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
                      <Link
                        href={program.ctaHref ?? "/apply"}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
