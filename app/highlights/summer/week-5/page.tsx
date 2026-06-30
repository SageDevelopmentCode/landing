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
    src: "/assets/highlights/summer_week_five/077864BA-405A-4468-8A16-0FB0AFBC8CB0.JPG",
    caption: "New faces join our Sage Field family — Week 5 starts with warmth",
  },
  {
    src: "/assets/highlights/summer_week_five/09A31054-3A12-400F-90C1-316B224BD046.JPG",
    caption: "Sand delivered — the mud kitchen just doubled in size",
  },
  {
    src: "/assets/highlights/summer_week_five/0C6AE07E-0553-4A7F-A9F8-9D8B02C3803C.JPG",
    caption: "Digging, pouring, mixing — the mud kitchen in full swing",
  },
  {
    src: "/assets/highlights/summer_week_five/1802C959-7467-4519-9957-B9AE5C7F1393.JPG",
    caption: "Animal architects — how animals build homes for their needs",
  },
  {
    src: "/assets/highlights/summer_week_five/39A6CEAD-799A-4EC3-8F59-D95B4C419D9B.JPG",
    caption: "Snake deep dive — student questions and stories lead the way",
  },
  {
    src: "/assets/highlights/summer_week_five/3D4BE2DA-47EB-4EF3-9AF7-660E7EE9A6ED.JPG",
    caption: "Making inferences — reading between the lines with context clues",
  },
  {
    src: "/assets/highlights/summer_week_five/415DFBAE-BF6A-4FB1-89B5-A5434B03AE05.JPG",
    caption: "Division strategies — bins, marbles, and drawn circles",
  },
  {
    src: "/assets/highlights/summer_week_five/46641FC5-401F-462C-9179-CAE23ED1E2E8.JPG",
    caption: "Natural disaster research — each student chose their own topic",
  },
  {
    src: "/assets/highlights/summer_week_five/4A2A8F4A-28FE-40A0-BD40-738475BBE89D.JPG",
    caption: "Egg bites made from scratch — fine motor skills and real confidence",
  },
  {
    src: "/assets/highlights/summer_week_five/52339132-588B-4874-B472-7D82FADB4A80.JPG",
    caption: "Popsicles — students made their own from start to finish",
  },
  {
    src: "/assets/highlights/summer_week_five/526B75DD-0F8A-4738-BB05-D515A10954E0.JPG",
    caption: "Guided snake craft — multi-step directions, intentional materials",
  },
  {
    src: "/assets/highlights/summer_week_five/5699D771-70BC-4817-9D18-0919CD9103AA.JPG",
    caption: "CVC words and early reading — letter sounds click into place",
  },
  {
    src: "/assets/highlights/summer_week_five/5B271E59-1953-4AD5-B99A-C43078B1D231.JPG",
    caption: "Number sense and addition — hands-on math in Primary",
  },
  {
    src: "/assets/highlights/summer_week_five/61997CDB-20A1-4835-BE41-3ABB4BF37DEA.JPG",
    caption: "Safari Adventure Friday — animal masks and bingo begin",
  },
  {
    src: "/assets/highlights/summer_week_five/69BAEEC0-7C4B-4821-8595-02152DC7E7FB.JPG",
    caption: "The scavenger hunt is on — four hours of full Safari Adventure",
  },
  {
    src: "/assets/highlights/summer_week_five/7849AC4D-E6E4-4F8C-BEDC-56401FBAB1A7.JPG",
    caption: "Safari Bingo — matching animals and calling out clues",
  },
  {
    src: "/assets/highlights/summer_week_five/791F7E88-7FFD-4260-A2A4-0EB1FF5ECDB8.JPG",
    caption: "Handmade animal masks — creativity and craftsmanship on display",
  },
  {
    src: "/assets/highlights/summer_week_five/7C6EB16F-E2C4-4E57-AD15-CCE8220ADEA6.JPG",
    caption: "Outdoor scavenger hunt — teamwork and sharp eyes",
  },
  {
    src: "/assets/highlights/summer_week_five/7FA9F18E-93B8-4DE4-A2F8-E60DA49CDE61.JPG",
    caption: "Week 5 energy — busy, joyful, full of purpose",
  },
  {
    src: "/assets/highlights/summer_week_five/9190B0AA-8EB6-409D-ABC2-737B7BD129B0.JPG",
    caption: "Moments from our backyard — Week 5 at Sage Field",
  },
  {
    src: "/assets/highlights/summer_week_five/94206628-3DF5-459F-A2F8-B7B2CE156BE7.JPG",
    caption: "Research in progress — natural disaster dioramas coming next week",
  },
  {
    src: "/assets/highlights/summer_week_five/C07B0F61-E120-4F97-8370-7696ECFD136F.JPG",
    caption: "Multiplication number focus — lower el keeps the momentum going",
  },
  {
    src: "/assets/highlights/summer_week_five/C6728619-0B0A-4A7A-9F06-13A385B9B473.JPG",
    caption: "Snake exploration — curiosity-led learning at its best",
  },
  {
    src: "/assets/highlights/summer_week_five/CE853D29-EB16-4882-9C4D-2E19781DA71F.JPG",
    caption: "Primary students — building independence every single day",
  },
  {
    src: "/assets/highlights/summer_week_five/D08CDD06-DF61-4D1B-B1F4-CF3D9FB4D665.JPG",
    caption: "Mixing, pouring, imagining — the mud kitchen at peak creativity",
  },
  {
    src: "/assets/highlights/summer_week_five/D5C814F8-8BBF-48B5-8A7D-9C7C53512FAB.JPG",
    caption: "New families, fuller hearts — our community keeps growing",
  },
  {
    src: "/assets/highlights/summer_week_five/E3BD0EC6-88F5-48F2-B510-591805C426F8.JPG",
    caption: "Product art — snake crafts finished with care and intention",
  },
  {
    src: "/assets/highlights/summer_week_five/E9B6974E-3BB2-48F9-A4C3-D68892E40092.JPG",
    caption: "Inferences click — reading confidence growing week by week",
  },
  {
    src: "/assets/highlights/summer_week_five/E9CE7FD1-BA8F-440C-AB2E-37DF8EF56D0F.JPG",
    caption: "Division hands-on — upper el works it out with manipulatives",
  },
  {
    src: "/assets/highlights/summer_week_five/F262D857-0D3E-47F6-A8C2-4A0A0CC3529C.JPG",
    caption: "Week 5 — one for the books",
  },
];

const CAROUSEL_COUNT = 8;

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "🐍", label: "Animal Architects & Snakes", desc: "Discovered how animals build homes perfectly suited to their needs — then dove into snakes based on students' own questions and stories" },
  { emoji: "🍳", label: "Egg Bites & Popsicles", desc: "Students made their own food from start to finish — building fine motor skills, independence, and real confidence in the kitchen" },
  { emoji: "📖", label: "Core Skills — Reading & Math", desc: "Continued building letter recognition, CVC words, number association, counting, addition, and subtraction through playful, meaningful activities" },
  { emoji: "🎨", label: "Product Art: Snake Crafts", desc: "Followed multi-step directions to create guided snake crafts — manipulating materials with intention and working toward a finished goal" },
  { emoji: "🌿", label: "New Faces, Fuller Hearts", desc: "New families joined this week — and the warmth in our backyard grew right along with our circle" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "🧠", label: "Making Inferences", desc: "Used context clues to draw meaning beyond what's on the page — a skill built in Week 3 that clicked naturally and confidently this week" },
  { emoji: "➗", label: "Division Strategies", desc: "Upper el explored division with bins, marbles, and drawn circles. Lower el continued multiplication with a daily number focus" },
  { emoji: "🌋", label: "Natural Disaster Research", desc: "Each student chose their own natural disaster and spent the week gathering research and drafting findings — dioramas coming next week!" },
  { emoji: "🐍", label: "Snake Deep Dive", desc: "Student curiosity led the way — their own questions and stories sparked a full classroom exploration of snakes" },
  { emoji: "🦁", label: "Safari Adventure Friday", desc: "Four hours of wild fun — custom Safari Bingo, handmade animal masks, and a full outdoor scavenger hunt" },
];

export default function SummerWeekFivePage() {
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
            Summer 2026 · Week 5
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 5 Highlights ☀️
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Jun 22–26, 2026
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
              Summer 2026 · Week 5
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 5 Highlights ☀️
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              Jun 22–26, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week 5 at Sage Field was one for the books. New kids joined, sand was delivered, and the mud kitchen doubled in size. Primary students explored animal architects, dove deep into snakes (by student request), and made their own egg bites and popsicles. Elementary students worked on making inferences, tackled division strategies with hands-on manipulatives, launched into natural disaster research projects, and created guided snake craft art. And Friday? Four hours of full Safari Adventure — bingo, animal masks, and a scavenger hunt.
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
                  emoji: "🏖️",
                  title: "Sand Delivery & Mud Kitchen x2",
                  desc: "Our second sand delivery arrived and we doubled the mud kitchen area — more room to dig, pour, mix, and imagine.",
                },
                {
                  emoji: "🦁",
                  title: "Safari Adventure Friday",
                  desc: "Safari Bingo, animal mask crafts, and an outdoor animal scavenger hunt — four hours of adventure and play.",
                },
                {
                  emoji: "🍳",
                  title: "Egg Bites & Popsicles",
                  desc: "Students prepared their own food from scratch — fine motor skills, independence, and something delicious all in one.",
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
