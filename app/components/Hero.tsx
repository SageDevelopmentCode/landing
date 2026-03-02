"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import WaitlistDialog from "./WaitlistDialog";

export default function Hero() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with scale */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ backgroundImage: "url(/assets/Hero.jpg)" }}
      />

      {/* Dark Tint Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content Container */}
      <div className="relative h-full w-full mx-auto px-8 sm:px-12 lg:px-12 flex items-end pb-12 md:pb-16 lg:pb-16">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left: Large Slogan */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white drop-shadow-lg max-w-sm font-heading leading-tight">
              Welcome to Sage Field!
            </h1>
          </motion.div>

          {/* Right: Description and Buttons */}
          <div className="text-center md:text-right space-y-6 max-w-2xl md:ml-auto">
            <motion.p
              className="text-base md:text-lg text-white font-semibold drop-shadow-md max-w-2xl font-body"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            >
              A homeschool learning community and enrichment program for
              lower‑elementary aged children offering intentional outdoor and
              movement first enrichment through co-creation with homeschool
              families. Personalised, hands-on learning that fosters curiosity,
              confidence, and wisdom.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            >
              {/* <button className="px-6 py-3 border-2 border-white bg-primary/20 backdrop-blur-md text-white font-semibold rounded-lg hover:bg-primary/30 transition-all duration-200 font-body">
                View Curriculum
              </button> */}
              <button
                onClick={() => setIsDialogOpen(true)}
                className="px-6 py-3 border-2 border-white bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer"
              >
                Interested in joining?
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Waitlist Dialog */}
      <WaitlistDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </section>
  );
}
