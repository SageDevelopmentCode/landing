"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

const AndroidDownloadSheet = dynamic(
  () => import("../components/AndroidDownloadSheet"),
  { ssr: false },
);

const SLIDES = [
  "/assets/Stock1.jpg",
  "/assets/Stock2.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
  "/assets/Stock11.jpg",
];

export default function DownloadPage() {
  const [current, setCurrent] = useState(0);
  const [androidSheetOpen, setAndroidSheetOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((i) => (i + 1) % SLIDES.length),
      6000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 pb-16">
      {/* Slideshow background */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <Image
              src={SLIDES[current]}
              alt=""
              fill
              className="object-cover"
              priority={current === 0}
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Header */}
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Link href="/">
            <div className="w-20 h-20 relative mb-4">
              <Image
                src="/assets/Logo.png"
                alt="Sage Field Private School"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-xl font-bold font-heading text-white text-center">
            Sage Field Private Microschool
          </h1>
          <p className="text-sm font-body text-white/70 mt-1 text-center">
            Round Rock, TX · Ages 4–11
          </p>
        </motion.div>

        {/* Download section */}
        <motion.div
          className="flex flex-col items-center gap-3 w-full max-w-xs"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <p className="text-xs font-semibold font-body text-white/50 uppercase tracking-widest mb-1">
            Download the App
          </p>

          <a
            href="https://apps.apple.com/us/app/sage-field/id6763985375"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Image
              src="/assets/AppStore.png"
              alt="Download on the App Store"
              width={200}
              height={60}
              className="shadow-lg"
            />
          </a>

          <button
            onClick={() => setAndroidSheetOpen(true)}
            className="transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <Image
              src="/assets/GooglePlay.png"
              alt="Get it on Google Play"
              width={200}
              height={60}
              className="shadow-lg"
            />
          </button>

        </motion.div>

      </div>

      {/* Floating footer CTA */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 flex justify-center"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
      >
        <div className="w-full sm:max-w-sm bg-sage-700 rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">
              Interested in Sage Field?
            </p>
            <p className="text-white/75 font-body text-xs">
              Apply for a spot today
            </p>
          </div>
          <Link
            href="/apply"
            className="flex-shrink-0 bg-white text-sage-700 font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >
            Apply Now →
          </Link>
        </div>
      </motion.div>

      <AndroidDownloadSheet
        isOpen={androidSheetOpen}
        onClose={() => setAndroidSheetOpen(false)}
      />
    </div>
  );
}
