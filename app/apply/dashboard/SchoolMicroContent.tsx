"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const QUOTES = [
  {
    text: "Every child learns differently. Our job is to meet them where they are.",
    attr: "Sage Field Philosophy",
  },
  {
    text: "We believe curiosity is the foundation of every great education.",
    attr: "Sage Field Mission",
  },
  {
    text: "Small class sizes mean every child is truly seen, heard, and supported.",
    attr: "Sage Field Approach",
  },
  {
    text: "Learning happens best when children feel safe enough to take risks.",
    attr: "Sage Field Values",
  },
];

function getQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export default function SchoolMicroContent() {
  const quote = getQuote();

  return (
    <motion.div
      className="bg-[#F5F9F5] border border-[#D4E6D0] rounded-2xl px-6 py-5 mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl leading-none text-[#2C5F2E]/30 font-heading select-none mt-0.5">
          &ldquo;
        </span>
        <div>
          <p className="text-sm text-gray-700 font-body italic leading-relaxed">
            {quote.text}
          </p>
          <p className="text-xs text-gray-400 font-body mt-1.5">— {quote.attr}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-[#D4E6D0]">
        <Link
          href="/programs"
          className="text-xs font-semibold text-[#2C5F2E] font-body hover:underline underline-offset-2 transition-colors"
        >
          Explore our programs →
        </Link>
        <span className="text-gray-300 text-xs">·</span>
        <Link
          href="/#faq"
          className="text-xs font-semibold text-[#2C5F2E] font-body hover:underline underline-offset-2 transition-colors"
        >
          Read the FAQ →
        </Link>
        <span className="text-gray-300 text-xs">·</span>
        <Link
          href="/"
          className="text-xs font-semibold text-[#2C5F2E] font-body hover:underline underline-offset-2 transition-colors"
        >
          About Sage Field →
        </Link>
      </div>
    </motion.div>
  );
}
