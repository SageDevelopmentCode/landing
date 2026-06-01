"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";

const ImageLightbox = dynamic(() => import("@/app/components/ImageLightbox"), {
  ssr: false,
});

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
    caption: "Kicking off Week 1 together",
  },
  {
    src: "/assets/highlights/summer_week_one/79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG",
    caption: "Letter sounds and early literacy",
  },
  {
    src: "/assets/highlights/summer_week_one/2B9964FA-0047-4590-880C-095C315B7DE8.JPG",
    caption: "Hands-on number sense activities",
  },
  {
    src: "/assets/highlights/summer_week_one/AB176A40-3DE2-4856-8E87-2D169FB3F41A.JPG",
    caption: "Exploring the water cycle",
  },
  {
    src: "/assets/highlights/summer_week_one/341400BF-486B-43A0-912E-84623B6299D6.JPG",
    caption: "Water filtration experiment",
  },
  {
    src: "/assets/highlights/summer_week_one/DDDA3AA2-CDF9-42CF-B8FF-AD61CED60065 2.JPG",
    caption: "Art time with the early learners",
  },
  {
    src: "/assets/highlights/summer_week_one/1D2BF4A6-5081-4D51-B1E8-F6E0E3D820B3.JPG",
    caption: "Getting to know our chicks",
  },
  {
    src: "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2.JPG",
    caption: "Morning music and rhythm",
  },
  {
    src: "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2 2.JPG",
    caption: "Note recognition in action",
  },
  {
    src: "/assets/highlights/summer_week_one/1A5F716C-6189-450B-8F8C-61E71621C2B9.JPG",
    caption: "Place value: expanded and word form",
  },
  {
    src: "/assets/highlights/summer_week_one/48A7CEB7-3F5C-422A-9C1B-8BBFDE5CCF4D 2.JPG",
    caption: "Comparing numbers with partners",
  },
  {
    src: "/assets/highlights/summer_week_one/58982292-CDE7-4E77-B528-0F01DB604DF7 2.JPG",
    caption: "Collaborative math game wrap-up",
  },
  {
    src: "/assets/highlights/summer_week_one/715F7B95-10E1-456B-864E-20E2E0C20569.JPG",
    caption: "SWBST reading comprehension",
  },
  {
    src: "/assets/highlights/summer_week_one/A932DC39-8100-43C7-A2AE-45C2DC8AC9EA.JPG",
    caption: "Writing: synonyms and antonyms",
  },
  {
    src: "/assets/highlights/summer_week_one/9E82F217-AF40-48F7-8860-906092304251.JPG",
    caption: "Turning experiences into recipe cards",
  },
  {
    src: "/assets/highlights/summer_week_one/C7665CCD-EB43-429C-AB7F-BA19FF9AE4A6.JPG",
    caption: "Cooking class: homemade pizza",
  },
  {
    src: "/assets/highlights/summer_week_one/FullSizeRender 4.jpg",
    caption: "Strawberry ice cream from scratch",
  },
  {
    src: "/assets/highlights/summer_week_one/412BC6B4-B894-46FF-A09D-318C09C1251A.JPG",
    caption: "Popsicle-making teamwork",
  },
  {
    src: "/assets/highlights/summer_week_one/2DE620A5-86E3-4A0D-8579-721D97615159.JPG",
    caption: "Learning Spanish naturally",
  },
  {
    src: "/assets/highlights/summer_week_one/FullSizeRender 5.jpg",
    caption: "Outdoor exploration time",
  },
  {
    src: "/assets/highlights/summer_week_one/E96A3688-D421-43A9-B8CA-93D6B881E555.JPG",
    caption: "Building independence and confidence",
  },
  {
    src: "/assets/highlights/summer_week_one/37F2A2AD-33E5-4FC8-A423-6CE04787FC4C.JPG",
    caption: "Accountable decision-making in the kitchen",
  },
  {
    src: "/assets/highlights/summer_week_one/8018F647-AC55-4EE0-9D25-0F326D805ED8 4.jpg",
    caption: "Caring for our animal friends",
  },
  {
    src: "/assets/highlights/summer_week_one/B3645828-BB39-41B0-A309-E9D7DBBFFEAF.JPG",
    caption: "Students deep in conversation",
  },
  {
    src: "/assets/highlights/summer_week_one/IMG_8915.jpg",
    caption: "A great week at Sage Field",
  },
  {
    src: "/assets/highlights/summer_week_one/66719803-D874-46B5-9B16-C4F79A865A85 2.JPG",
    caption: "Community and connection",
  },
  {
    src: "/assets/highlights/summer_week_one/0D75EB5E-FE8D-405E-AF5D-6457DDF7473A.JPG",
    caption: "Week 1 memories",
  },
];

// First 8 images used for the desktop hero carousel
const CAROUSEL_COUNT = 8;

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "📖", label: "Letter Sounds & CVC Reading", desc: "Building phonics foundations through hands-on practice" },
  { emoji: "✏️", label: "Handwriting & Number Sense", desc: "Fine motor skills and early numeracy side by side" },
  { emoji: "➕", label: "Early Addition", desc: "Introducing addition concepts through play and manipulatives" },
  { emoji: "💧", label: "Water Cycle & Filtration", desc: "Science exploration that sparked curiosity all week" },
  { emoji: "🎨", label: "Art Creation", desc: "Self-expression through color, texture, and imagination" },
  { emoji: "🐥", label: "Caring for Our Chicks", desc: "Responsibility and empathy through animal care" },
  { emoji: "🎵", label: "Rhythm & Note Recognition", desc: "Music foundations woven into every morning" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "🔢", label: "Place Value Mastery", desc: "Expanded, word, and model forms — plus comparing numbers" },
  { emoji: "🎲", label: "Collaborative Math Game", desc: "Wrapped up the week by applying what we learned together" },
  { emoji: "📚", label: "SWBST Comprehension", desc: "Somebody, Wanted, But, So, Then — a framework for deep reading" },
  { emoji: "✍️", label: "Vocabulary & Sentence Structure", desc: "Building strong writing skills from the ground up" },
  { emoji: "🔄", label: "Synonyms & Antonyms", desc: "Expanding word knowledge through exploration" },
  { emoji: "📝", label: "Recipe Card Writing", desc: "Real experiences turned into structured, creative writing" },
];

export default function SummerWeekOnePage() {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Desktop hero carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveSlide((s) => (s + 1) % CAROUSEL_COUNT);
    }, 5000);
  }, []);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
    startInterval();
  };

  const goPrev = () => goToSlide((activeSlide - 1 + CAROUSEL_COUNT) % CAROUSEL_COUNT);
  const goNext = () => goToSlide((activeSlide + 1) % CAROUSEL_COUNT);

  // Mobile auto-scroll gallery
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;

    let pos = el.scrollLeft;
    const tick = () => {
      if (!isPausedRef.current && el) {
        pos += 0.5;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleGalleryInteractionStart = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleGalleryInteractionEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2500);
  };

  const lightboxImages = WEEK_IMAGES.map((img) => ({
    src: img.src,
    alt: img.caption,
  }));

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* ── Desktop Hero Carousel ── (hidden on mobile) */}
      <div className="hidden sm:block relative w-full h-[75vh] min-h-[560px] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeSlide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <Image
              src={WEEK_IMAGES[activeSlide].src}
              alt={WEEK_IMAGES[activeSlide].caption}
              fill
              className="object-cover"
              sizes="100vw"
              priority={activeSlide === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Dark gradient overlay — bottom half */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Text overlay — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 px-12 lg:px-16 pb-12">
          <motion.span
            key={`badge-${activeSlide}`}
            className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full mb-3 font-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Summer 2026 · Week 1
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 1 Highlights ☀️
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            May 26–29, 2026
          </motion.p>
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 right-12 lg:right-16 flex gap-1.5">
          {Array.from({ length: CAROUSEL_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === activeSlide ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile hero gallery ── (hidden on sm+) */}
      <div className="sm:hidden pt-20">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onTouchStart={handleGalleryInteractionStart}
          onTouchEnd={handleGalleryInteractionEnd}
          onMouseDown={handleGalleryInteractionStart}
          onMouseUp={handleGalleryInteractionEnd}
        >
          {[...WEEK_IMAGES, ...WEEK_IMAGES].map((img, i) => (
            <div
              key={i}
              className="relative w-[88%] flex-shrink-0 aspect-square overflow-hidden"
            >
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Intro text — mobile badge + paragraph, desktop paragraph only (heading is in carousel) */}
      <section className="pt-8 sm:pt-10 pb-10 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-only badge + heading */}
          <div className="sm:hidden mb-4">
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-3 font-body">
              Summer 2026 · Week 1
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 1 Highlights ☀️
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              May 26–29, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week 1 at Sage Field&apos;s Summer Program is complete, and what an incredible start! Students spent the week learning by doing — building foundations in literacy and math, exploring science, expressing themselves through art, and growing into a real community together.
          </motion.p>
        </div>
      </section>

      {/* What We Learned */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              What We Learned
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-800 mb-2">
              A Week of Discovery
            </h2>
            <p className="text-base text-gray-500 font-body">
              Both our early learner and elementary groups had a full, purposeful week.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Early Learners card */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🌱</span>
                </div>
                <h3 className="text-lg font-bold font-heading text-gray-800">Early Learners</h3>
              </div>
              <ul className="space-y-3">
                {EARLY_LEARNER_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-xs text-gray-500 font-body mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Elementary card */}
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📐</span>
                </div>
                <h3 className="text-lg font-bold font-heading text-gray-800">Elementary</h3>
              </div>
              <ul className="space-y-3">
                {ELEMENTARY_HIGHLIGHTS.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 font-body leading-tight">{item.label}</p>
                      <p className="text-xs text-gray-500 font-body mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Beyond Academics strip */}
          <motion.div
            className="bg-primary/5 rounded-2xl p-6 border border-primary/15"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-sm font-bold text-gray-500 font-body uppercase tracking-wide mb-4">
              Beyond Academics
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  emoji: "🍕",
                  title: "Cooking Together",
                  desc: "Students made pizzas, strawberry ice cream, and popsicles — practicing teamwork, accountability, and real decision-making.",
                },
                {
                  emoji: "🗣️",
                  title: "Spanish Conversations",
                  desc: "They began learning Spanish and were already using it naturally in daily conversations by the end of the week.",
                },
                {
                  emoji: "🤝",
                  title: "Community Building",
                  desc: "Confidence, communication, and independence grew every single day. A real community took shape.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-2xl leading-none flex-shrink-0">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800 font-body leading-tight mb-1">{item.title}</p>
                    <p className="text-xs text-gray-600 font-body leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Photo Highlights */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Photo Highlights
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-800 mb-2">
              Moments from the Week
            </h2>
            <p className="text-sm text-gray-500 font-body">
              Click any photo to open the full gallery.
            </p>
          </motion.div>

          {/* Mobile: horizontal snap scroll */}
          <div className="sm:hidden overflow-x-auto flex snap-x snap-mandatory gap-3 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {WEEK_IMAGES.map((img, i) => (
              <motion.button
                key={i}
                className="relative w-[78%] flex-shrink-0 snap-start aspect-[4/3] rounded-xl overflow-hidden shadow-md cursor-pointer"
                onClick={() => setLightboxIndex(i)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
              >
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  className="object-cover"
                  sizes="78vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 to-transparent" />
                <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold font-body leading-tight line-clamp-2">
                  {img.caption}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden sm:grid grid-cols-3 gap-3">
            {WEEK_IMAGES.map((img, i) => (
              <motion.button
                key={i}
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md cursor-pointer group"
                onClick={() => setLightboxIndex(i)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
              >
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(max-width: 1280px) 33vw, 400px"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold font-body leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.caption}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Join Us
            </span>
            <h2 className="text-2xl font-bold font-heading text-gray-800 mb-2">
              Ready to be part of Week 2?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-7 max-w-md mx-auto">
              Spots are still available for Summer 2026. Enroll now or come see the campus for yourself — we&apos;d love to meet your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/apply")}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Enroll Now →
              </button>
              <button
                onClick={() => router.push("/tour")}
                className="px-8 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                🏡 Tour the Campus
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
