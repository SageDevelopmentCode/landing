"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EnrollmentAnnouncementPopup() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const dismiss = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            className={
              isMobile
                ? "fixed z-[90] bottom-0 left-0 right-0 w-full rounded-t-2xl overflow-hidden shadow-2xl"
                : "fixed z-[90] max-w-lg w-full mx-4 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden shadow-2xl"
            }
            initial={
              isMobile ? { y: "100%" } : { opacity: 0, scale: 0.85, y: 20 }
            }
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top image zone */}
            <div className="relative w-full h-48 overflow-hidden">
              <Image
                src="/assets/ImageNine.jpg"
                alt="Child playing outdoors"
                fill
                className="object-cover object-top"
                priority
              />
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/20" />
              {/* Close button overlaid on image */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              {/* Drag handle (mobile only) */}
              {isMobile && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/60 rounded-full" />
              )}
            </div>

            {/* Bottom content zone */}
            <div className="bg-white px-8 py-8">
              <h2 className="text-3xl font-heading font-bold text-gray-800 mb-3">
                Summer Enrollment is Open!
              </h2>

              <p className="text-gray-600 font-body mb-1">
                Limited spots! Apply today for our 2026 Summer Program.
              </p>
              <p className="text-gray-400 text-sm font-body mb-7">
                Outdoor-centered. Small groups. Real learning.
              </p>

              {/* CTA button */}
              <Link
                href="/apply"
                onClick={dismiss}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white
                           font-semibold rounded-xl hover:bg-primary-hover transition-colors duration-200
                           shadow-md hover:shadow-lg font-body"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Dismiss link */}
              <div className="flex justify-center mt-4">
                <Link
                  href="/summer-2026"
                  onClick={dismiss}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-body"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
