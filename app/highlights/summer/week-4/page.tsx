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
    src: "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
    caption: "New students, new friendships — Week 4 is off to a great start",
  },
  {
    src: "/assets/highlights/summer_week_four/4E560267-530C-43BF-BC4A-C586C9DBE40D.JPG",
    caption: "Welcoming new families into our Sage Field community",
  },
  {
    src: "/assets/highlights/summer_week_four/IMG_9586.JPG",
    caption: "Settling in and feeling at home",
  },
  {
    src: "/assets/highlights/summer_week_four/IMG_9531.JPG",
    caption: "Building connections on day one",
  },
  {
    src: "/assets/highlights/summer_week_four/C3E15299-9AB4-420A-BB46-2C998A4B1C38 2.JPG",
    caption: "Phonics work — letter sounds and CVC word building",
  },
  {
    src: "/assets/highlights/summer_week_four/1FEDBFAC-0CD4-4D95-8718-9F10D5531E71 2.JPG",
    caption: "Letter recognition practice in Primary",
  },
  {
    src: "/assets/highlights/summer_week_four/77A3BBA5-C885-4179-A944-6F9B005A6B0E.JPG",
    caption: "Early reading skills — blending sounds into words",
  },
  {
    src: "/assets/highlights/summer_week_four/8B8A8CAF-47F1-415E-B12D-0C1E2B5942FC.JPG",
    caption: "Addition and number sense exploration",
  },
  {
    src: "/assets/highlights/summer_week_four/6B6E75A3-57F1-4675-A79C-27A91E3CA8AE 2.JPG",
    caption: "Multi-digit multiplication with the area model",
  },
  {
    src: "/assets/highlights/summer_week_four/896A997D-C5D1-4443-9FAA-807FE4D6E7C4.JPG",
    caption: "Multiplication fact fluency — numbers 6 and up",
  },
  {
    src: "/assets/highlights/summer_week_four/EC369A3C-19C6-4263-BA9A-6586154D0990.JPG",
    caption: "Venn diagrams — comparing fiction and non-fiction texts",
  },
  {
    src: "/assets/highlights/summer_week_four/1276FB1A-AEEB-43D0-8028-E2419B2679AF.JPG",
    caption: "Summarizing passages — mastered by Thursday",
  },
  {
    src: "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
    caption: "Strawberry jam — maceration time!",
  },
  {
    src: "/assets/highlights/summer_week_four/27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG",
    caption: "Stirring and reducing on the stovetop",
  },
  {
    src: "/assets/highlights/summer_week_four/FF7095AC-1AFC-4011-9C27-8B2C0573121B 2.JPG",
    caption: "Our homemade strawberry jam — from scratch",
  },
  {
    src: "/assets/highlights/summer_week_four/FD2FCA61-D903-4059-B681-20AF2027754F.JPG",
    caption: "Tasting the results of our cooking class",
  },
  {
    src: "/assets/highlights/summer_week_four/5E38B790-B4AF-405D-BC71-0C6A367E4E57.JPG",
    caption: "STEM Friday — marshmallow and spaghetti tower structures",
  },
  {
    src: "/assets/highlights/summer_week_four/A4107889-4FC8-4F4F-BE2E-5F49868F3AA4 2.JPG",
    caption: "Baking soda volcanoes in action",
  },
  {
    src: "/assets/highlights/summer_week_four/EAFF91EE-8496-4132-AA3B-3587816CB2B8.JPG",
    caption: "Assembling take-home rockets",
  },
  {
    src: "/assets/highlights/summer_week_four/3F2A4707-D076-4AFE-9216-BD8EB3CAF5D9.JPG",
    caption: "STEM Adventure Friday energy — building and exploring",
  },
  {
    src: "/assets/highlights/summer_week_four/5D534B24-3173-420E-9800-FEB0454E3B43 2.JPG",
    caption: "Scientists at work",
  },
  {
    src: "/assets/highlights/summer_week_four/DFDDC9CF-2547-4219-9893-C3EB68F84E88 2.JPG",
    caption: "Week 4 memories at Sage Field",
  },
];

const CAROUSEL_COUNT = 8;

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "👋", label: "New Students & New Friendships", desc: "Week 4 brought new families into our community — welcomed with warmth and kindness by students and staff" },
  { emoji: "📖", label: "CVC Words & Early Reading", desc: "Phonics and early reading skills — letter recognition, letter sounds, and blending CVC words" },
  { emoji: "➕", label: "Addition & Number Sense", desc: "Hands-on addition practice alongside patterns and early math concepts" },
  { emoji: "🔢", label: "Patterns & Early Math", desc: "Identifying, extending, and creating patterns as a foundation for mathematical thinking" },
  { emoji: "🧹", label: "Life Skills & Independence", desc: "Practical life activities that build responsibility, coordination, and self-sufficiency" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "📚", label: "Summarizing Fiction & Non-Fiction", desc: "Reading passages and books, then summarizing key ideas — mastered by Thursday" },
  { emoji: "🔵", label: "Venn Diagrams: Compare & Contrast", desc: "Using Venn diagrams to compare fiction and non-fiction texts side by side" },
  { emoji: "✖️", label: "Multi-Digit Multiplication", desc: "Area model and standard algorithm for upper el; multiplication fact fluency (6+) for lower el" },
  { emoji: "🍓", label: "Strawberry Jam Cooking", desc: "Made jam from scratch — maceration, stovetop reduction, and a whole lot of pride" },
  { emoji: "🚀", label: "STEM Adventure Friday", desc: "Marshmallow-spaghetti towers, baking soda volcanoes, and take-home rockets" },
];

export default function SummerWeekFourPage() {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 px-12 lg:px-16 pb-12">
          <motion.span
            key={`badge-${activeSlide}`}
            className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full mb-3 font-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Summer 2026 · Week 4
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 4 Highlights ☀️
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Jun 15–19, 2026
          </motion.p>
        </div>

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

      {/* Intro text */}
      <section className="pt-8 sm:pt-10 pb-10 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="sm:hidden mb-4">
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-3 font-body">
              Summer 2026 · Week 4
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 4 Highlights ☀️
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              Jun 15–19, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week 4 at Sage Field brought new faces and new friendships alongside serious academic momentum. Primary students dove into CVC words, phonics, and early number sense while building the independence that defines our Montessori environment. Elementary students tackled multi-digit multiplication, compared fiction and non-fiction texts with Venn diagrams, cooked strawberry jam from scratch, and capped the week with STEM Adventure Friday — marshmallow towers, baking soda volcanoes, and take-home rockets.
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
              Both our primary and elementary groups had a full, purposeful week.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Primary card */}
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
                <h3 className="text-lg font-bold font-heading text-gray-800">Primary</h3>
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
                  emoji: "🍓",
                  title: "Strawberry Jam Cooking",
                  desc: "Students made jam from scratch — macerating strawberries, reducing on the stovetop, and tasting their creation.",
                },
                {
                  emoji: "🚀",
                  title: "STEM Adventure Friday",
                  desc: "Marshmallow and spaghetti tower structures, baking soda volcanoes, and take-home rockets to launch at home.",
                },
                {
                  emoji: "🌟",
                  title: "Welcoming New Families",
                  desc: "New students joined us this week — welcomed by returning students and teachers with open arms.",
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
              Want to join us this summer or next fall?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-7 max-w-md mx-auto">
              Spots are still available for Summer 2026 and enrollment is open for School Year 2026–2027. Come see the campus for yourself — we&apos;d love to meet your family.
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
