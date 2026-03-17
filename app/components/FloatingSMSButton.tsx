"use client";

import { motion } from "framer-motion";

export default function FloatingSMSButton() {
  return (
    <motion.a
      href={`sms:+15126775872?body=${encodeURIComponent("Hi! I'm interested in learning more about Sage Field for my child—could I ask a few quick questions?")}`}
      className="fixed bottom-6 right-6 z-40 flex flex-col overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header band — accent color */}
      <div className="bg-sage-600 px-5 py-2 text-center">
        <span className="text-sm font-bold uppercase tracking-widest text-white">
          Questions?
        </span>
      </div>

      {/* Body */}
      <div className="bg-sage-500 px-5 py-3 flex flex-col items-center gap-0.5">
        <span className="text-sm text-white/90">Text or Call us any time:</span>
        <span className="text-lg font-bold text-white">(512) 677-5872</span>
      </div>
    </motion.a>
  );
}
