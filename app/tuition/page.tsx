"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";
import FloatingSMSButton from "../components/FloatingSMSButton";
import SummerProgramCard from "../components/SummerProgramCard";
import FullEnrollmentCard from "../components/FullEnrollmentCard";
import AfterCareCard from "../components/AfterCareCard";
import FieldDayFridayCard from "../components/FieldDayFridayCard";

export default function TuitionPage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<"summer" | "school-year">("summer");
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

      {/* 2. Summer Program Section */}
      <section className="bg-white py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <SummerProgramCard onQuestionsClick={() => setIsWaitlistOpen(true)} />
        </div>
      </section>

      {/* 3. Full Enrollment Section */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <FullEnrollmentCard onQuestionsClick={() => setIsWaitlistOpen(true)} />
        </div>
      </section>

      {/* 4. Extended Learning + Field Day Friday */}
      <section className="bg-white py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AfterCareCard />
            <FieldDayFridayCard />
          </div>
        </div>
      </section>

      {/* 5. Homeschool Drop-In Pricing */}
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
              Join our community 2–5 days/week
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
            {/* Tier 1 — Explorer Day Pass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col"
            >
              <h3 className="text-base font-bold text-black font-heading mb-1">Explorer Day Pass</h3>
              <p className="text-xs text-gray-400 font-body mb-4">Drop-In</p>
              {activePricingTab === "summer" ? (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$95/day</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Primary</span>
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
                    <span className="text-gray-600">Primary</span>
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

            {/* Tier 2 — Part-Time Memberships */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
              className="bg-white rounded-xl p-6 shadow-sm border border-primary/30 flex flex-col relative"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                Most Popular
              </span>
              <h3 className="text-base font-bold text-black font-heading mb-1">Part-Time Memberships</h3>
              <p className="text-xs text-gray-400 font-body mb-4">2-Day &amp; 3-Day</p>
              {activePricingTab === "summer" ? (
                <div className="space-y-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5 font-body">2-Day/Week</p>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">2nd–4th</span>
                      <span className="font-semibold text-black">$170/wk</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">Primary</span>
                      <span className="font-semibold text-black">$180/wk</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5 font-body">3-Day/Week</p>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">2nd–4th</span>
                      <span className="font-semibold text-black">$240/wk</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">Primary</span>
                      <span className="font-semibold text-black">$255/wk</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5 font-body">2-Day/Week</p>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">2nd–4th</span>
                      <span className="font-semibold text-black">$520/mo</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">Primary</span>
                      <span className="font-semibold text-black">$560/mo</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5 font-body">3-Day/Week</p>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">2nd–4th</span>
                      <span className="font-semibold text-black">$720/mo</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">Primary</span>
                      <span className="font-semibold text-black">$780/mo</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Tier 3 — Full-Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col relative"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                Best Value
              </span>
              <h3 className="text-base font-bold text-black font-heading mb-1">Full-Time</h3>
              <p className="text-xs text-gray-400 font-body mb-4">5 Days/Week</p>
              {activePricingTab === "summer" ? (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$350/wk</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Primary</span>
                    <span className="font-semibold text-black">$375/wk</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">2nd–4th</span>
                    <span className="font-semibold text-black">$1,095/mo</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-600">Primary</span>
                    <span className="font-semibold text-black">$1,195/mo</span>
                  </div>
                </div>
              )}
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
