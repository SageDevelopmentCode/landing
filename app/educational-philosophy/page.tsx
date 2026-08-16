"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import EducationalPhilosophySection from "../components/EducationalPhilosophySection";
import PhilosophyApproachesSection from "../components/PhilosophyApproachesSection";
import ContactUsSection from "../components/ContactUsSection";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";

export default function EducationalPhilosophyPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Educational Philosophy
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Our Educational Philosophy
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 mb-8 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            Learn about the guiding principles and beliefs that shape how we
            teach and nurture every student at Sage Field.
          </motion.p>
        </div>
      </section>

      <EducationalPhilosophySection />
      <PhilosophyApproachesSection />
      <ContactUsSection />
      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
