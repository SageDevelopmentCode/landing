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
      <div className="relative h-full w-full mx-auto px-8 sm:px-12 lg:px-12 flex items-center md:items-end pb-12 md:pb-16 lg:pb-16">
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
            <motion.p
              className="mt-4 text-lg md:text-xl text-white font-semibold italic drop-shadow-md font-body max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            >
              Children are not meant to rot in classrooms. Choose outdoor
              learning.
            </motion.p>
          </motion.div>

          {/* Right: Description and Buttons */}
          <div className="text-center md:text-right flex flex-col justify-end space-y-6 max-w-2xl md:ml-auto">
            <motion.p
              className="text-base md:text-lg text-white font-semibold drop-shadow-md max-w-2xl font-body"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            >
              Sage Field Private School is an outdoor-focused private
              microschool in Round Rock, Texas. We are a small, intentional
              learning community where outdoor exploration, hands-on academics,
              and child-led inquiry come together.
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
