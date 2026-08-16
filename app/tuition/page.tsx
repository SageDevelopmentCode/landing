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

export default function TuitionPage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 pt-36">
        <div className="max-w-7xl mx-auto w-full text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              TUITION
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Tuition &amp; Enrollment
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            We offer flexible enrollment options designed to support your
            family&apos;s needs and schedule.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="cursor-pointer px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
            >
              Interested in Joining?
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. Full Enrollment Section */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <FullEnrollmentCard
            onQuestionsClick={() => setIsWaitlistOpen(true)}
          />
        </div>
      </section>

      {/* 3. Extended Learning + Field Day Friday */}
      <section className="bg-white py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AfterCareCard />
            <FieldDayFridayCard />
          </div>
        </div>
      </section>

      {/* 4. Homeschool Drop-In Pricing */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Homeschool Drop-In
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-2">
              Flexible Enrollment Options
            </h2>
            <p className="text-lg font-semibold text-primary font-heading mb-8">
              Join our community 1-3 days/week
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 — Explorer Day Pass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: "easeOut" as const,
              }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col"
            >
              <h3 className="text-base font-bold text-black font-heading mb-1">
                1 Day / Week
              </h3>
              <p className="text-xs text-gray-400 font-body mb-4">Part-Time</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-600">2nd–4th</span>
                  <span className="font-semibold text-black">$440/mo</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-600">Pre-K–1st</span>
                  <span className="font-semibold text-black">$480/mo</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-body mt-auto">
                Attend one consistent day each week, paid monthly
              </p>
            </motion.div>

            {/* Card 2 — 2-Day/Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
            </motion.div>

            {/* Card 3 — 3-Day/Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
            </motion.div>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" as const }}
          >
            <button
              onClick={() => router.push("/apply")}
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push("/homeschool")}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
            >
              Learn More
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

      <WaitlistDialog
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
      <FloatingSMSButton />
    </div>
  );
}
