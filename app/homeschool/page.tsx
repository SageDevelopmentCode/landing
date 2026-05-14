"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";
import ContactDialog from "../components/ContactDialog";
import FloatingSMSButton from "../components/FloatingSMSButton";

const details = [
  { label: "Schedule", value: "1–5 Days/Week" },
  { label: "Ages", value: "4–11 Years" },
  { label: "Fridays", value: "Field Days" },
  { label: "Class Size", value: "~10 Kids" },
];

const scheduleTiers = [
  {
    days: "1x/week",
    title: "Light Touch",
    description:
      "Perfect for families who want a taste of microschool enrichment without disrupting your home rhythm.",
  },
  {
    days: "2x/week",
    title: "Balanced Rhythm",
    description:
      "Two structured days create a consistent routine while leaving plenty of flexibility for family-led learning.",
  },
  {
    days: "3x/week",
    title: "Regular Learner",
    description:
      "Three days offers deep engagement with academics, enrichments, and peer connection each week.",
  },
  {
    days: "4x/week",
    title: "Deep Immersion",
    description:
      "Near-full-week immersion with the freedom and control of homeschooling still fully intact.",
  },
  {
    days: "5x/week",
    title: "Full Experience",
    description:
      "The complete Sage Field experience — every day, every enrichment, including Friday Field Days.",
  },
];

const pillars = [
  {
    icon: "🎯",
    title: "Ability-Based Learning",
    description:
      "We group by ability and interest, not grade. Each child progresses at their own pace.",
  },
  {
    icon: "👥",
    title: "Tiny Class Sizes",
    description:
      "With ~10 kids per class, every child gets real attention and a genuine community.",
  },
  {
    icon: "🌱",
    title: "Interest-Led Academics",
    description:
      "Curiosity drives the curriculum. Kids learn more when they care about the subject.",
  },
  {
    icon: "🤝",
    title: "Real Socialization",
    description:
      "Mixed-age groups and collaborative projects build authentic friendships and social skills.",
  },
];

const programs = [
  {
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
    title: "School Year 2026–2027",
    dates: "August 17, 2026 – March 2027",
    details: [
      "Ages 4–11",
      "Mon-Thu",
      "6-month commitment",
      "~10 children per class",
      "Field Fridays",
      "Aftercare available",
    ],
    description:
      "A full school-year microschool experience blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics.",
    href: "/school-year-2026-2027",
    image: "/assets/ImageTwo.jpg",
    dateBg: "bg-lavender/40",
    dateText: "text-purple-700",
  },
];

export default function HomeschoolDropInPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<
    "summer" | "school-year"
  >("summer");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Homeschool Drop-In
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Homeschool Drop-In Program
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            1–5 Days/Week · Ages 4–11 · Fridays Are Field Days
          </motion.p>
        </div>
      </section>

      {/* Program Summary */}
      <section className="pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
            className="space-y-4 mb-10"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Sage Field&apos;s Homeschool Drop-In Program is built for families
              who want flexible, enriching academic support without a long-term
              commitment. Choose 1 to 5 days per week — and adjust as your
              family&apos;s schedule evolves.
            </p>
          </motion.div>

          {/* Key Details Cards */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
          >
            {details.map((detail) => (
              <div
                key={detail.label}
                className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 font-body">
                  {detail.label}
                </p>
                <p className="text-sm font-bold text-gray-800 font-body">
                  {detail.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Description */}
      <section className="pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
            className="bg-white rounded-2xl p-8 shadow-sm space-y-4"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Unlike traditional schools that group children by grade, Sage
              Field uses{" "}
              <span className="text-primary font-semibold">
                ability-based and interest-led grouping
              </span>
              . Every child gets individualized academic support in literacy and
              numeracy — exactly where they are, not where their birthday says
              they should be.
            </p>
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Every child who attends — whether 1 day or 5 days a week — joins
              all enrichments: arts, music, movement, science, and
              social-emotional learning. No child misses out because of their
              schedule.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg mb-3">
              <img
                src="/assets/After1.png"
                alt="Homeschool drop-in program photo"
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/ImageTen.jpg"
                  alt="Homeschool drop-in program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/ImageFive.jpg"
                  alt="Homeschool drop-in program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/After4.png"
                  alt="Homeschool drop-in program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/After3.png"
                  alt="Homeschool drop-in program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flexible Scheduling */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Flexible Scheduling
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
              Choose Your Schedule
            </h2>
            <p className="text-lg font-semibold text-primary font-heading mb-8">
              From one day a week to five — you decide
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {scheduleTiers.map((tier, index) => (
              <motion.div
                key={index}
                className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + index * 0.1,
                  ease: "easeOut" as const,
                }}
              >
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full mb-3">
                  <span className="text-xs font-bold text-primary font-body">
                    {tier.days}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-black mb-1 font-heading">
                  {tier.title}
                </h3>
                <p className="text-sm text-text-gray font-body">
                  {tier.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Friday Field Days */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4">
              Every Friday
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4">
              <span className="text-primary">Field Day</span> Fridays
            </h2>
            <p className="text-gray-500 font-body text-base mb-8 max-w-xl mx-auto">
              Every Friday is a unique, themed adventure — included for all
              families who attend on Fridays. No two Fridays are ever the same.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
          >
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🌿</span>
              <span className="text-sm font-semibold text-primary font-body">
                Outdoor &amp; Nature
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🎉</span>
              <span className="text-sm font-semibold text-primary font-body">
                Unique Every Friday
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🧒</span>
              <span className="text-sm font-semibold text-primary font-body">
                All Ages Welcome
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🎨</span>
              <span className="text-sm font-semibold text-primary font-body">
                Themed Adventures
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Microschool */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Why Sage Field?
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
              Why Microschool for Homeschoolers?
            </h2>
            <p className="text-lg font-semibold text-primary font-heading mb-6">
              The best of both worlds
            </p>

            <p className="text-base text-text-gray mb-8 leading-relaxed font-body">
              Sage Field is a microschool built specifically for flexibility.
              With tiny class sizes and a family-centered approach, you get the
              structure and socialization of school — while your family keeps
              full control of the learning journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, index) => (
              <motion.div
                key={index}
                className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + index * 0.1,
                  ease: "easeOut" as const,
                }}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors duration-200">
                  <span className="text-2xl">{pillar.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-black mb-1 font-heading">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-gray font-body">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Programs */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Our Programs
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
              Drop-In Available for Both Programs
            </h2>
            <p className="text-base text-text-gray mb-8 leading-relaxed font-body">
              The Homeschool Drop-In option is available across both of our
              current programs — choose the season that fits your family.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <div className="relative h-48 w-full">
                    <Image
                      src={program.image}
                      alt={program.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <Link
                      href="/apply"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full self-start mb-3 hover:bg-green-200 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Enrollment is now open
                      <span>→</span>
                    </Link>
                    <h3 className="text-xl font-bold text-black font-heading mb-3">
                      {program.title}
                    </h3>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${program.dateBg} ${program.dateText} text-xs font-semibold mb-4 self-start`}
                    >
                      📅 {program.dates}
                    </div>
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
                    <p className="text-sm text-text-gray font-body leading-relaxed mb-4 flex-1">
                      {program.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <Link
                        href={program.href}
                        className="text-primary font-semibold text-sm hover:underline"
                      >
                        Learn More
                      </Link>
                      <button
                        onClick={() => setWaitlistOpen(true)}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        Interest Form
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Pricing
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-2">
              Flexible Enrollment Options
            </h2>
            <p className="text-lg font-semibold text-primary font-heading mb-8">
              Join our community 1–3 days/week
            </p>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setActivePricingTab("summer")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  activePricingTab === "summer"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Summer
              </button>
              <button
                onClick={() => setActivePricingTab("school-year")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  activePricingTab === "school-year"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                School Year
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 — Explorer Day Pass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut" as const,
              }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col"
            >
              <h3 className="text-base font-bold text-black font-heading mb-1">
                Explorer Day Pass
              </h3>
              <p className="text-xs text-gray-400 font-body mb-4">Drop-In</p>
              {activePricingTab === "summer" ? (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$95/day</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Pre-K–1st</span>
                    <span className="font-semibold text-black">$100/day</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$110/day</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Pre-K–1st</span>
                    <span className="font-semibold text-black">$120/day</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 font-body mt-auto">
                {activePricingTab === "summer"
                  ? "Perfect for trying it out or occasional days"
                  : "Great for trying the program or occasional days"}
              </p>
            </motion.div>

            {/* Card 2 — 2-Day/Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: "easeOut" as const,
              }}
              className="bg-white rounded-xl p-6 shadow-sm border border-primary/30 flex flex-col relative"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                Most Popular
              </span>
              <h3 className="text-base font-bold text-black font-heading mb-1">
                2-Day/Week
              </h3>
              <p className="text-xs text-gray-400 font-body mb-4">
                Part-Time
              </p>
              {activePricingTab === "summer" ? (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$170/wk</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Pre-K–1st</span>
                    <span className="font-semibold text-black">$180/wk</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$520/mo</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Pre-K–1st</span>
                    <span className="font-semibold text-black">$560/mo</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Card 3 — 3-Day/Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: "easeOut" as const,
              }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col"
            >
              <h3 className="text-base font-bold text-black font-heading mb-1">
                3-Day/Week
              </h3>
              <p className="text-xs text-gray-400 font-body mb-4">
                Part-Time
              </p>
              {activePricingTab === "summer" ? (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$240/wk</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Pre-K–1st</span>
                    <span className="font-semibold text-black">$255/wk</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$720/mo</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Pre-K–1st</span>
                    <span className="font-semibold text-black">$780/mo</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <h2 className="text-2xl font-bold text-gray-800 font-heading mb-2">
              Ready to drop in?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-6">
              Spots are limited — reach out to find the right schedule for your
              family.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setWaitlistOpen(true)}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Interest Form
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WaitlistDialog
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
      <ContactDialog
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
      <FloatingSMSButton />
    </div>
  );
}
