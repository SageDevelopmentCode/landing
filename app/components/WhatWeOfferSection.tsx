"use client";

import WeeklySchedule from "./WeeklySchedule";
import { motion } from "framer-motion";

export default function WhatWeOfferSection() {
  return (
    <section id="what-we-offer" className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        {/* What We Offer Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            What We Offer
          </span>
        </motion.div>

        {/* Two Column Layout - Reversed from WelcomeSection */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column: Weekly Schedule */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <WeeklySchedule />
          </motion.div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            {/* Title */}
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              What We Offer
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Enrichment Through Connection and Exploration
            </motion.p>

            {/* Description Paragraphs */}
            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Sage Field operates as a tutoring and enrichment program, not a
              traditional school. We focus on{" "}
              <span className="text-primary font-semibold">
                whole-child growth
              </span>
              ,{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              ,{" "}
              <span className="text-primary font-semibold">
                social development
              </span>
              , and{" "}
              <span className="text-primary font-semibold">
                hands-on experiences
              </span>{" "}
              that promote creativity and curiosity.
            </motion.p>

            <motion.p
              className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              Our days are designed around{" "}
              <span className="text-primary font-semibold">movement</span>,{" "}
              <span className="text-primary font-semibold">
                outdoor exploration
              </span>
              , and{" "}
              <span className="text-primary font-semibold">
                project-based learning
              </span>
              , with minimal worksheets and a focus on real-world engagement.
              This structure supports emotional stability and helps children
              feel confident and connected each day.
            </motion.p>

            {/* Trial Session Note */}
            <motion.div
              className="mt-8 p-4 bg-primary/10 rounded-lg border-l-4 border-primary"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <p className="text-base md:text-lg text-text-gray font-body">
                A trial session will run during{" "}
                <span className="text-primary font-semibold">Summer 2026</span>,
                depending on student interest.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
