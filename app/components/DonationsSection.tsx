"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import WaitlistDialog from "./WaitlistDialog";
import AfterCareCard from "./AfterCareCard";
import FieldDayFridayCard from "./FieldDayFridayCard";

const DonationsSection = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <>
      <section className="relative bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16 min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              TUITION
            </span>
          </motion.div>

          {/* Main Content */}
          <div className="w-full">
            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: "easeOut" as const,
              }}
              className="text-4xl md:text-5xl font-bold text-black mb-4 font-heading text-center"
            >
              Tuition & Enrollment
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut" as const,
              }}
              className="text-base md:text-lg text-text-gray leading-relaxed mb-12 font-body text-center max-w-3xl mx-auto"
            >
              We offer flexible enrollment options designed to support your
              family&apos;s needs and schedule.
            </motion.p>

            {/* Featured Core Membership */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut" as const,
              }}
              className="mb-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary shadow-lg overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-[40vh] md:h-[50vh]">
                <Image
                  src="/assets/Stock7.jpg"
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
                    <h3 className="text-2xl md:text-3xl font-bold text-black mb-3 font-heading">
                      Full Enrollment
                    </h3>
                    <p className="text-lg md:text-xl text-text-gray mb-6 font-body">
                      Monday – Thursday, 9:00am – 3:00pm
                    </p>

                    {/* Tuition Tiers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="px-6 py-4 bg-white rounded-lg shadow-md">
                        <p className="text-sm font-semibold text-text-gray font-body mb-1">
                          2nd – 4th Grade
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
                          Pre-K–1st Grade
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
                      First-time registration $500 · Re-registration $300 ·
                      Annual supply fee $300
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setIsWaitlistOpen(true)}
                        className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 font-body cursor-pointer text-sm"
                      >
                        Interested in joining?
                      </button>
                      <Link
                        href="/apply"
                        className="px-6 py-3 bg-white text-primary border border-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors duration-200 font-body text-sm"
                      >
                        Enroll Now →
                      </Link>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>

            {/* Package Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <AfterCareCard />
              <FieldDayFridayCard />
            </div>

            {/* Homeschool Drop-In Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut" as const,
              }}
              className="max-w-4xl mx-auto"
            >
              <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                Homeschool Drop-In
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-black font-heading mb-2">
                Flexible Enrollment Options
              </h3>
              <p className="text-lg font-semibold text-primary font-heading mb-8">
                Join our community 1-3 days/week
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
                  <h4 className="text-base font-bold text-black font-heading mb-1">
                    1 Day / Week
                  </h4>
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
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
                  <h4 className="text-base font-bold text-black font-heading mb-1">
                    2-Day/Week
                  </h4>
                  <p className="text-xs text-gray-400 font-body mb-4">Part-Time</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">2nd–4th</span>
                      <span className="font-semibold text-black">$600/mo</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">Pre-K–1st</span>
                      <span className="font-semibold text-black">$640/mo</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
                  <h4 className="text-base font-bold text-black font-heading mb-1">
                    3-Day/Week
                  </h4>
                  <p className="text-xs text-gray-400 font-body mb-4">Part-Time</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">2nd–4th</span>
                      <span className="font-semibold text-black">$850/mo</span>
                    </div>
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-gray-600">Pre-K–1st</span>
                      <span className="font-semibold text-black">$920/mo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
                <Link
                  href="/apply"
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-center"
                >
                  Get Started
                </Link>
                <Link
                  href="/homeschool"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body text-center"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <WaitlistDialog
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </>
  );
};

export default DonationsSection;
