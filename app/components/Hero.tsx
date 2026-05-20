"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WaitlistDialog from "./WaitlistDialog";

const slides = [
  {
    image: "/assets/Stock1.jpg",
    title: "Welcome to Sage Field!",
    description:
      "A small, outdoor-focused private microschool in Round Rock, Texas.",
    buttonLabel: "Interested in Joining?",
    buttonAction: "waitlist" as const,
  },
  {
    image: "/assets/Stock3.jpg",
    title: "Summer 2026 Program",
    description:
      "12 weeks of themed adventures, nature play, art, and academic enrichment — May 26 to August 13.",
    buttonLabel: "Explore Summer 2026",
    buttonHref: "/summer-2026",
  },
  {
    image: "/assets/Stock4.jpg",
    title: "School Year 2026–2027",
    description:
      "Up to 4 days a week of enriched, Montessori-inspired learning for ages 4–11 starting August 17.",
    buttonLabel: "See the School Year",
    buttonHref: "/school-year-2026-2027",
  },
  {
    image: "/assets/Stock6.jpg",
    title: "Apply to Sage Field",
    description:
      "Spots are limited. Apply early to secure your child's place in our Summer or School Year program.",
    buttonLabel: "Apply Now",
    buttonHref: "/apply",
  },
  {
    image: "/assets/Stock7.jpg",
    title: "Book a Private Tour",
    description:
      "Walk the campus, meet Ms. Sabrina, and see Sage Field in person — free, private, 45 minutes.",
    buttonLabel: "Schedule a Tour",
    buttonHref: "/tour",
  },
  {
    image: "/assets/Stock8.jpg",
    title: "Homeschool Drop-In",
    description:
      "1 to 5 days a week of flexible enrichment — academics, art, music, and Friday Field Days.",
    buttonLabel: "Learn More",
    buttonHref: "/homeschool",
  },
  {
    image: "/assets/Stock11.jpg",
    title: "Our Educational Philosophy",
    description:
      "Montessori, Waldorf, and Reggio Emilia methods woven together with TEKS-aligned academics.",
    buttonLabel: "Our Philosophy",
    buttonHref: "/educational-philosophy",
  },
  {
    image: "/assets/Kid1.png",
    title: "Our Vision",
    description:
      "We've secured our LLC and our property. Come see what we're building for the children of Round Rock.",
    buttonLabel: "See Our Vision",
    buttonHref: "/vision",
  },
  {
    image: "/assets/Kid2.jpg",
    title: "Our Story",
    description:
      "Sage Field was born from a belief that children deserve to learn through movement, wonder, and joy.",
    buttonLabel: "Read Our Story",
    buttonHref: "/our-story",
  },
];

export default function Hero() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
    startInterval();
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
    startInterval();
  };

  const currentSlide = slides[activeSlide];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image Slideshow */}
      <AnimatePresence mode="sync">
        <motion.img
          key={activeSlide}
          src={currentSlide.image}
          alt="Sage Field"
          className="absolute inset-0 w-full h-full object-cover scale-110"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-sm text-white text-2xl font-bold hover:bg-white/50 transition-all duration-200 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-sm text-white text-2xl font-bold hover:bg-white/50 transition-all duration-200 cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom Content Bar */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-8 sm:px-12 lg:px-16 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white drop-shadow-lg font-heading leading-tight mb-3">
              {currentSlide.title}
            </h1>
            <p className="text-base md:text-lg text-white/90 font-semibold drop-shadow-md font-body mb-6">
              {currentSlide.description}
            </p>
            {currentSlide.buttonAction === "waitlist" ? (
              <button
                onClick={() => setIsDialogOpen(true)}
                className="px-6 py-3 border-2 border-white bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer"
              >
                {currentSlide.buttonLabel}
              </button>
            ) : (
              <Link
                href={currentSlide.buttonHref!}
                className="inline-block px-6 py-3 border-2 border-white bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 font-body cursor-pointer"
              >
                {currentSlide.buttonLabel}
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dot Indicators */}
        <div className="flex gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveSlide(i);
                startInterval();
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                i === activeSlide ? "bg-white w-6" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
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
