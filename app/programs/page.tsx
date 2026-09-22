"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import EnrollmentCTASection from "../components/EnrollmentCTASection";
import ExploreOurProgramsSection from "../components/ExploreOurProgramsSection";

export default function ProgramsPage() {
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

      <ExploreOurProgramsSection
        cardsOnly
        className="py-12 px-8 sm:px-12 lg:px-16"
        containerClassName="max-w-7xl mx-auto"
      />

      <EnrollmentCTASection />

      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
