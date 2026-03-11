"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, PartyPopper, Sun } from "lucide-react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";

export default function TuitionPage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

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
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              TUITION
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Tuition &amp; Enrollment
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-text-gray leading-relaxed font-body max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            We offer flexible enrollment options designed to support your
            family&apos;s needs and schedule.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary shadow-lg overflow-hidden"
          >
            {/* Image */}
            <div className="relative h-[40vh] md:h-[50vh]">
              <Image
                src="/assets/ImageNine.jpg"
                alt="Summer Program"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Icon */}
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Sun className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 font-heading">
                    Summer Program
                  </h2>
                  <p className="text-lg md:text-xl text-text-gray mb-6 font-body">
                    Monday – Thursday, 9:00am – 3:00pm · Priced per week
                  </p>

                  {/* Summer Tuition Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Weekly */}
                    <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-gray font-body mb-3">
                        Weekly
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-text-gray font-body">
                            1st – 4th Grade
                          </p>
                          <p className="text-2xl font-bold text-primary font-heading">
                            $350
                            <span className="text-sm text-text-gray font-normal">
                              /wk
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-gray font-body">
                            Primary (Pre-K – K)
                          </p>
                          <p className="text-2xl font-bold text-primary font-heading">
                            $375
                            <span className="text-sm text-text-gray font-normal">
                              /wk
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Full Summer */}
                    <div className="relative px-6 py-4 bg-primary rounded-lg shadow-md overflow-hidden">
                      <div className="absolute top-3 right-3 bg-white text-primary text-xs font-bold px-2 py-1 rounded-full font-body">
                        Save 10%
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80 font-body mb-3">
                        Full Summer · 12 Weeks
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-white/70 font-body">
                            1st – 4th Grade
                          </p>
                          <p className="text-2xl font-bold text-white font-heading">
                            $4,095
                          </p>
                          <p className="text-xs text-white/60 font-body">
                            <span className="line-through">$4,550</span>
                            <span className="ml-1 text-white/80">
                              · $455 off
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/70 font-body">
                            Primary (Pre-K – K)
                          </p>
                          <p className="text-2xl font-bold text-white font-heading">
                            $4,388
                          </p>
                          <p className="text-xs text-white/60 font-body">
                            <span className="line-through">$4,875</span>
                            <span className="ml-1 text-white/80">
                              · $487 off
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-text-gray font-body mb-4">
                    <span className="font-semibold text-black">
                      Registration fee:
                    </span>{" "}
                    Summer school registration $75 · One-time fee
                  </p>

                  <button
                    onClick={() => setIsWaitlistOpen(true)}
                    className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body cursor-pointer text-sm"
                  >
                    Interested in joining?
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Full Enrollment Section */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary shadow-lg overflow-hidden"
          >
            {/* Image */}
            <div className="relative h-[40vh] md:h-[50vh]">
              <Image
                src="/assets/ImageTen.jpg"
                alt="Full Enrollment"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>

            {/* Content */}
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                {/* Icon */}
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-3 font-heading">
                    Full Enrollment
                  </h2>
                  <p className="text-lg md:text-xl text-text-gray mb-6 font-body">
                    Monday – Thursday, 9:00am – 3:00pm
                  </p>

                  {/* Tuition Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                      <p className="text-sm font-semibold text-text-gray font-body mb-1">
                        1st – 4th Grade
                      </p>
                      <p className="text-3xl font-bold text-primary font-heading">
                        $1,095
                        <span className="text-lg text-text-gray font-normal">
                          /mo
                        </span>
                      </p>
                      <p className="text-xs text-text-gray mt-1 font-body">
                        School year
                      </p>
                    </div>
                    <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                      <p className="text-sm font-semibold text-text-gray font-body mb-1">
                        Primary (Pre-K – Kindergarten)
                      </p>
                      <p className="text-3xl font-bold text-primary font-heading">
                        $1,195
                        <span className="text-lg text-text-gray font-normal">
                          /mo
                        </span>
                      </p>
                      <p className="text-xs text-text-gray mt-1 font-body">
                        School year
                      </p>
                    </div>
                  </div>

                  {/* Fees */}
                  <p className="text-xs text-text-gray font-body mb-4">
                    <span className="font-semibold text-black">
                      Enrollment fees:
                    </span>{" "}
                    First-time registration $500 · Re-registration $300 · Annual
                    supply fee $300
                  </p>

                  <button
                    onClick={() => setIsWaitlistOpen(true)}
                    className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body cursor-pointer text-sm"
                  >
                    Interested in joining?
                  </button>

                  <p className="text-xs text-text-gray italic font-body mt-3">
                    For drop-in options, please email us at{" "}
                    <a
                      href="mailto:sabrina@sagefield.co"
                      className="text-primary hover:underline"
                    >
                      sabrina@sagefield.co
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. After Care + Field Day Friday */}
      <section className="bg-white py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* After Care Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-[30vh] md:h-[35vh]">
                <Image
                  src="/assets/ImageSeven.jpg"
                  alt="After Care Program"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-black mb-2 font-heading">
                  After Care
                </h3>
                <p className="text-base text-text-gray mb-6 font-body">
                  3:00pm - 6:00pm
                </p>

                {/* Pricing Options */}
                <div className="space-y-4">
                  {/* Drop-in */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Drop-In
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $35
                      <span className="text-base text-text-gray font-normal">
                        /daily
                      </span>
                    </p>
                  </div>

                  {/* Member Monthly */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Monthly (Enrolled Student)
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $375
                      <span className="text-base text-text-gray font-normal">
                        /month
                      </span>
                    </p>
                    <p className="text-xs text-text-gray mt-1 font-body">
                      $23 per day per student
                    </p>
                  </div>

                  {/* Non-Member Monthly */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Monthly (After Care Only)
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $475
                      <span className="text-base text-text-gray font-normal">
                        /month
                      </span>
                    </p>
                    <p className="text-xs text-text-gray mt-1 font-body">
                      $10/hour - Cheaper than a babysitter!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Field Day Friday Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-[30vh] md:h-[35vh]">
                <Image
                  src="/assets/ImageEight.jpg"
                  alt="Fun Friday Activities"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <PartyPopper className="w-8 h-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-black mb-2 font-heading">
                  Field Day Friday
                </h3>
                <p className="text-base text-text-gray mb-6 font-body">
                  9:00am - 1:00pm
                </p>

                {/* Pricing Options */}
                <div className="space-y-4">
                  {/* Package of 4 */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Package of 4
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $200
                      <span className="text-base text-text-gray font-normal">
                        /month
                      </span>
                    </p>
                    <p className="text-xs text-text-gray mt-1 font-body">
                      $50 per session • Expires monthly
                    </p>
                  </div>

                  {/* Drop-in */}
                  <div className="p-4 bg-welcome-bg rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-black mb-1 font-heading">
                      Drop-In
                    </p>
                    <p className="text-2xl font-bold text-primary font-heading">
                      $60
                      <span className="text-base text-text-gray font-normal">
                        /session
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />

      <WaitlistDialog
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </div>
  );
}
