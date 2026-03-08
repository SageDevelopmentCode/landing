"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import DonationsSection from "../components/DonationsSection";
import MeetTheTeamSection from "../components/MeetTheTeamSection";
import ContactUsSection from "../components/ContactUsSection";
import Footer from "../components/Footer";

export default function AboutPage() {
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
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              About Us
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            About Sage Field Private School
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 mb-8 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Learn more about our private microschool, our mission, and the team
            behind Sage Field
          </motion.p>

          <motion.blockquote
            className="text-center text-xl md:text-2xl font-semibold italic text-primary border-l-4 border-primary pl-6 mx-auto max-w-2xl mb-12 font-body text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            &ldquo;Children are not meant to rot in classrooms! Choose outdoor
            learning!&rdquo;
          </motion.blockquote>
        </div>
      </section>

      {/* Content Sections */}
      <WelcomeSection />
      <DonationsSection />
      <MeetTheTeamSection />
      <ContactUsSection />
      <Footer />
    </div>
  );
}
