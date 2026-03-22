"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";
import FloatingSMSButton from "../components/FloatingSMSButton";
import FullEnrollmentCard from "../components/FullEnrollmentCard";
import AfterCareCard from "../components/AfterCareCard";
import FieldDayFridayCard from "../components/FieldDayFridayCard";

const details = [
  { label: "Start Date", value: "August 17, 2026" },
  { label: "Ages", value: "4–11 years" },
  { label: "Schedule", value: "Up to 4 days/week" },
  { label: "Term", value: "6-month commitment" },
];

const pillars = [
  {
    icon: "🌱",
    title: "Hands-on Learning",
    description: "Experiential activities that engage curiosity",
  },
  {
    icon: "🧘",
    title: "Emotional Regulation",
    description: "Mindfulness practices for students & educators",
  },
  {
    icon: "🎨",
    title: "Creative Expression",
    description: "Artistic and musical creativity flourish",
  },
  {
    icon: "🌳",
    title: "Movement & Nature",
    description: "Movement-based and outdoor education",
  },
];

export default function SchoolYear20262027Page() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
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
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              School Year 2026–2027
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            School Year 2026–2027
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            August 2026 – May 2027 · Up to 4 Days/Week · Ages 4–11
          </motion.p>
        </div>
      </section>

      {/* Program Summary */}
      <section className="pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="space-y-4 mb-10"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Sage Field is a small outdoor learning microschool located in
              Round Rock, TX. We blend elements of Montessori, Waldorf, and
              Reggio Emilia philosophies with TEKS-aligned academics to create a
              nurturing, nature-connected learning environment where children
              are always wondering, exploring, and growing.
            </p>
          </motion.div>

          {/* Key Details Cards */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
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
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              The School Year 2026–2027 program runs as a six-month commitment,
              offering up to four days per week of enriched learning for
              children ages 4–11. Students receive individualized support in
              literacy and numeracy alongside science, art, movement, and
              social-emotional learning.
            </p>
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Enrollment is limited to preserve the small-group environment that
              makes Sage Field special. Families begin with an application and a
              mutual-fit conversation to ensure the program is the right match
              for your child.
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
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg mb-3">
              <img
                src="/assets/After1.png"
                alt="School year program photo"
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/After2.png"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/After3.png"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Educational Philosophy */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              How We Learn
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
              How We Learn
            </h2>
            <p className="text-lg font-semibold text-primary font-heading mb-6">
              Educational Philosophy
            </p>

            <p className="text-base text-text-gray mb-4 leading-relaxed font-body">
              Our approach integrates elements of{" "}
              <span className="text-primary font-semibold">Montessori</span>,{" "}
              <span className="text-primary font-semibold">Waldorf</span>, and{" "}
              <span className="text-primary font-semibold">Reggio Emilia</span>{" "}
              methods with{" "}
              <span className="text-primary font-semibold">
                TEKS-aligned academics
              </span>
              . We enrich learning with social-emotional education, arts, music,
              and creative problem-solving.
            </p>

            <p className="text-base text-text-gray mb-8 leading-relaxed font-body">
              We value{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              , both for students and educators. A calm, connected teacher
              creates a community where children thrive.
            </p>
          </motion.div>

          {/* Pillar Cards */}
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
                  ease: "easeOut",
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

      {/* Full Enrollment Tuition */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Tuition &amp; Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading">
              School Year Pricing
            </h2>
          </motion.div>

          <div className="mb-8">
            <FullEnrollmentCard onCtaClick={() => setWaitlistOpen(true)} />
          </div>

          {/* After Care + Field Day Friday */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AfterCareCard />
            <FieldDayFridayCard />
          </div>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-bold text-gray-800 font-heading mb-2">
              Ready to apply?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-6">
              Spots are limited — apply early to secure your child&apos;s place
              in the School Year 2026–2027 program.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/apply/start")}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Start Application
              </button>
              <button
                onClick={() => setWaitlistOpen(true)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                Interest Form
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
      <FloatingSMSButton />
    </div>
  );
}
