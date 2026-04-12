"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import ContactDialog from "../components/ContactDialog";
import InfoSessionRSVPForm from "../components/InfoSessionRSVPForm";

const eventDetails = [
  { icon: "📅", label: "Date", value: "Saturday, April 18, 2026" },
  { icon: "⏰", label: "Time", value: "11:00 AM CST" },
  { icon: "💻", label: "Format", value: "Virtual via Zoom" },
  { icon: "🎯", label: "Who It's For", value: "New & enrolled families" },
];

const agendaItems = [
  {
    icon: "🏫",
    title: "Overview of Sage Field",
    description:
      "Learn about who we are — a small outdoor microschool in Round Rock, TX, built for curious kids ages 4–11.",
  },
  {
    icon: "📚",
    title: "Programs Breakdown",
    description:
      "We'll walk through Summer 2026, School Year 2026–2027, and our flexible Homeschool Drop-In option.",
  },
  {
    icon: "🌿",
    title: "Educational Philosophy",
    description:
      "How we blend Montessori, Waldorf, and Reggio Emilia methods with TEKS-aligned academics in a real-world setting.",
  },
  {
    icon: "🗓️",
    title: "Daily Life at Sage Field",
    description:
      "A peek into a typical school day — movement, art, music, literacy, math, outdoor exploration, and more.",
  },
  {
    icon: "💰",
    title: "Pricing & Enrollment",
    description:
      "Transparent breakdown of tuition, fees, and how to get started with the enrollment process.",
  },
  {
    icon: "🙋",
    title: "Live Q&A",
    description:
      "Bring your questions! We'll leave plenty of time to answer anything on your mind.",
  },
];

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

const highlights = [
  { icon: "🌳", text: "Outdoor learning in a small microschool setting" },
  { icon: "🎨", text: "Art, music, and creative expression every day" },
  { icon: "📖", text: "Literacy, math & writing in short, engaging blocks" },
  { icon: "💛", text: "Emotional regulation & social-emotional education" },
  { icon: "🏃", text: "Movement, nature walks, and free exploration" },
  { icon: "👧", text: "~10 children per class — truly individualized care" },
];

export default function InfoSessionPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        {/* Background image */}
        <img
          src="/assets/After1.png"
          alt="Sage Field"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

        {/* Content */}
        <div
          className="relative z-10 h-full flex flex-col items-center justify-end pb-16
         px-8 sm:px-12 lg:px-16 text-center"
        >
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
              Virtual Info Session
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading mb-4 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Parent Info Session
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-white/90 font-body mb-6 max-w-2xl drop-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            Join us on Zoom to learn all about Sage Field — our programs,
            philosophy, and what makes our school unique. Ask us anything!
          </motion.p>

          {/* Date/time pill */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <div className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold font-body shadow-md text-sm">
              <span>📅</span>
              <span>Saturday, April 18, 2026 · 11:00 AM CST · Zoom</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Event Details Cards */}
      <section className="pt-12 pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
          >
            {eventDetails.map((detail) => (
              <div
                key={detail.label}
                className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100"
              >
                <div className="text-2xl mb-2">{detail.icon}</div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 font-body">
                  {detail.label}
                </p>
                <p className="text-sm font-bold text-gray-800 font-body leading-snug">
                  {detail.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What We'll Cover */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Session Agenda
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading">
              What We&apos;ll Cover
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agendaItems.map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: "easeOut" as const,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 font-heading mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-body leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Our School — Quick Snapshot */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <div className="p-8 md:p-10">
              <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                About Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4">
                A Little About <span className="text-primary">Sage Field</span>
              </h2>
              <p className="text-gray-600 font-body text-base leading-relaxed mb-8">
                Sage Field is a small private microschool in Round Rock, TX for
                children ages 4–11. We blend the best of Montessori, Waldorf,
                and Reggio Emilia methods with TEKS-aligned academics — all
                delivered through hands-on, outdoor, and movement-based
                learning. Our focus is the whole child: academics, creativity,
                emotional growth, and the pure joy of childhood.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlights.map((h, i) => (
                  <motion.div
                    key={h.text}
                    className="flex items-center gap-3 p-3 rounded-lg bg-welcome-bg"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.07,
                      ease: "easeOut" as const,
                    }}
                  >
                    <span className="text-lg flex-shrink-0">{h.icon}</span>
                    <span className="text-sm text-gray-700 font-body font-medium">
                      {h.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Programs Snapshot */}
      <section className="pb-16 px-6 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
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

          <motion.h2
            className="text-3xl md:text-4xl font-bold text-black font-heading mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Explore Our Programs
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                    {/* Dates pill */}
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
                          onClick={() => setContactOpen(true)}
                          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
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

      {/* RSVP Form */}
      <InfoSessionRSVPForm />

      {/* Contact nudge */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            className="text-gray-500 font-body text-sm"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
          >
            Have a question before the session?{" "}
            <button
              onClick={() => setContactOpen(true)}
              className="text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
            >
              Contact us directly
            </button>
          </motion.p>
        </div>
      </section>

      <Footer />
      <FloatingSMSButton />

      <ContactDialog
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
