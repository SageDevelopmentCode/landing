"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import WaitlistDialog from "./WaitlistDialog";

export default function EnrollmentCTASection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full text-center">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            Enrollment Open
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          Enrollment is Now Open!
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Join our community and give your child the gift of hands-on,
          wisdom-focused learning in a nurturing environment. We&apos;re excited
          to welcome new families to Sage Field.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDialogOpen(true)}
        >
          Enroll Your Child Today
        </motion.button>
      </div>

      {/* Waitlist Dialog */}
      <WaitlistDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </section>
  );
}
