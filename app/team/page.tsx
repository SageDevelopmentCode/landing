"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import MeetTheTeamSection from "../components/MeetTheTeamSection";
import ContactUsSection from "../components/ContactUsSection";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";

export default function TeamPage() {
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
              Our Team
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Meet the Team
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 mb-8 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            The passionate educators and staff dedicated to nurturing every
            child at Sage Field Private School
          </motion.p>
        </div>
      </section>

      <MeetTheTeamSection />
      <ContactUsSection />
      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
