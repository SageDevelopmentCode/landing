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
    src: "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
    caption: "Kicking off Week 2 together",
  },
  {
    src: "/assets/highlights/summer_week_two/570FEA28-D009-4038-B966-EAF9E0C9EE73.JPG",
    caption: "Phonics practice and letter work",
  },
  {
    src: "/assets/highlights/summer_week_two/6B95C9E4-E145-49CA-8818-7AFC9B3B8353.JPG",
    caption: "Counting on strategy in math",
  },
  {
    src: "/assets/highlights/summer_week_two/E3AE964D-CC01-41A0-B040-35DCCB27CD4C.JPG",
    caption: "Hands-on addition activities",
  },
  {
    src: "/assets/highlights/summer_week_two/8DC65D50-316D-44DA-88AA-128F72DF019B.JPG",
    caption: "Color mixing in the mud kitchen",
  },
  {
    src: "/assets/highlights/summer_week_two/D3319D8D-EE61-43C4-93E5-54AEB0A5B58C.JPG",
    caption: "Exploring what happens when colors combine",
  },
  {
    src: "/assets/highlights/summer_week_two/EE67A184-15E0-425D-BBFB-26891F754F4C.JPG",
    caption: "Sensory play with water and tools",
  },
  {
    src: "/assets/highlights/summer_week_two/3B7A8137-E253-4E45-B71D-AD5325A5460A.JPG",
    caption: "Creative exploration in the mud kitchen",
  },
  {
    src: "/assets/highlights/summer_week_two/17C0053A-E948-49DC-8D32-58D6D753C37D.JPG",
    caption: "Homemade pasta day — measuring and mixing",
  },
  {
    src: "/assets/highlights/summer_week_two/CB84AC72-2A28-4712-B2E9-C9DF08E4D7CD.JPG",
    caption: "Pasta making in action",
  },
  {
    src: "/assets/highlights/summer_week_two/2D39D0C0-64E9-4355-A719-248000AD4077.JPG",
    caption: "Learning from a delicious flop",
  },
  {
    src: "/assets/highlights/summer_week_two/0E23519F-0846-4BB8-9795-BC26B412E702 2.JPG",
    caption: "Strawberry limeade popsicle making",
  },
  {
    src: "/assets/highlights/summer_week_two/9511C4BC-5E44-4FCF-9DC6-EE386F2060DA.JPG",
    caption: "Experimenting with popsicle flavors",
  },
  {
    src: "/assets/highlights/summer_week_two/E9BB9AFF-C176-409F-ADF7-226F63526D77.JPG",
    caption: "Teamwork in the kitchen",
  },
  {
    src: "/assets/highlights/summer_week_two/BF26943C-5BF7-40CD-9686-D57805D57453.JPG",
    caption: "Addition and subtraction with regrouping",
  },
  {
    src: "/assets/highlights/summer_week_two/703B0F21-5D8C-4862-9E8C-4B22981768EC 2.JPG",
    caption: "Main idea and supporting details",
  },
  {
    src: "/assets/highlights/summer_week_two/2F8E12CF-285F-4629-A621-7DA20ED68F65.JPG",
    caption: "Animal research project in progress",
  },
  {
    src: "/assets/highlights/summer_week_two/510F5647-307C-447A-95AE-8713B309CA94.JPG",
    caption: "Reading National Geographic books",
  },
  {
    src: "/assets/highlights/summer_week_two/08BB87B0-E53E-4981-9741-8F0AC0C32238.JPG",
    caption: "Recording animal facts on rough draft",
  },
  {
    src: "/assets/highlights/summer_week_two/71493760-06B5-4E8A-9340-8DD3B32571CD.JPG",
    caption: "Revising and editing our research",
  },
  {
    src: "/assets/highlights/summer_week_two/84E07202-6127-4142-9312-22A8665F8333 2.JPG",
    caption: "Final animal report banners",
  },
  {
    src: "/assets/highlights/summer_week_two/572C0FD1-F9A7-4058-B77A-B2544F8ABF04.JPG",
    caption: "Proud animal experts presenting their work",
  },
  {
    src: "/assets/highlights/summer_week_two/A36A20F2-7144-4BA4-AF29-70965A386A1A.JPG",
    caption: "Building confidence every day",
  },
  {
    src: "/assets/highlights/summer_week_two/C25BBF44-8B2C-436E-9432-F742D840A201.JPG",
    caption: "Friendships forming at Sage Field",
  },
  {
    src: "/assets/highlights/summer_week_two/CA435D3C-71BD-433F-A75E-E4CA02BC3897 2.JPG",
    caption: "Independent work time",
  },
  {
    src: "/assets/highlights/summer_week_two/9CFCA632-25EE-4EAF-89B4-CCC1F01E215D.JPG",
    caption: "Collaborative group activities",
  },
  {
    src: "/assets/highlights/summer_week_two/2CDB3506-F666-4787-ACCB-97B3A945C6EE.JPG",
    caption: "Students deep in their learning",
  },
  {
    src: "/assets/highlights/summer_week_two/B8D13E63-C11A-4934-A926-6921DC948109.JPG",
    caption: "Taking pride in their contributions",
  },
  {
    src: "/assets/highlights/summer_week_two/4D005FA0-C22C-4DE9-B589-8130BBB7723A.JPG",
    caption: "A week full of discovery",
  },
  {
    src: "/assets/highlights/summer_week_two/IMG_8889.JPG",
    caption: "A great week at Sage Field",
  },
  {
    src: "/assets/highlights/summer_week_two/A6B134A3-5B8E-4A1F-AF66-5AC22A504C9E.JPG",
    caption: "Community and connection growing",
  },
  {
    src: "/assets/highlights/summer_week_two/D9F6F89E-CFCA-4738-B3D6-78A3DACF9636.JPG",
    caption: "Week 2 memories",
  },
  {
    src: "/assets/highlights/summer_week_two/24E4F2AF-5C30-4C23-9B09-8EA71093A1FD.JPG",
    caption: "Hands-on learning in action",
  },
  {
    src: "/assets/highlights/summer_week_two/9AF86705-559C-4F6C-ADC9-4F144413EC9C.JPG",
    caption: "Curiosity and exploration every day",
  },
  {
    src: "/assets/highlights/summer_week_two/DC1D10EF-768E-48E1-AFA9-B935172FA14B.JPG",
    caption: "Students engaged and thriving",
  },
  {
    src: "/assets/highlights/summer_week_two/5B961697-D097-476C-9D47-09F547042841.JPG",
    caption: "Creative energy at Sage Field",
  },
  {
    src: "/assets/highlights/summer_week_two/5490D879-F69D-40E0-B2E7-FAD64DE100D9.JPG",
    caption: "Learning through doing",
  },
  {
    src: "/assets/highlights/summer_week_two/2B58FEC3-CD58-40D9-93C5-A83D7DBB5A21.JPG",
    caption: "Every moment is a learning moment",
  },
  {
    src: "/assets/highlights/summer_week_two/3E22E13E-859C-427A-9FA3-73F11B989B65.JPG",
    caption: "Week 2 was full of joy",
  },
];

const CAROUSEL_COUNT = 8;

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "📖", label: "CVC Words & Phonemic Awareness", desc: "Listening for sounds in words, identifying letters, and building emerging reader confidence" },
  { emoji: "🔠", label: "Capital & Lowercase Letters", desc: "Practicing letter associations and recognition every single day" },
  { emoji: "➕", label: "Addition: Counting On", desc: "Hands-on games and group work to build number sense and confidence" },
  { emoji: "🎨", label: "Color Mixing & Sensory Art", desc: "Mud kitchen experiments exploring what happens when colors combine" },
  { emoji: "🍝", label: "Homemade Pasta", desc: "Measuring, mixing, and observing — even when the flour-to-egg ratio gloriously flopped" },
  { emoji: "🧃", label: "Strawberry Limeade Popsicles", desc: "Experimenting with flavors and taking pride in the finished result" },
  { emoji: "🌱", label: "Growing Independence", desc: "Students showed noticeably more initiative and confidence compared to Week 1" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "➕", label: "Addition & Subtraction with Regrouping", desc: "Carrying over and borrowing across multiple digits" },
  { emoji: "📝", label: "Main Idea & Supporting Details", desc: "Cone = main idea (first/last sentence), ice cream scoops = supporting details" },
  { emoji: "🦁", label: "Animal Research Project", desc: "Students chose a National Geographic book and researched an animal over two days" },
  { emoji: "✏️", label: "Revise & Edit", desc: "Rough draft on Tuesday → revised and transferred to a banner as the final report" },
  { emoji: "📚", label: "Differentiated Groups", desc: "Same focus, split by academic level to meet each learner's needs" },
];

export default function SummerWeekTwoPage() {
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
            Summer 2026 · Week 2
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 2 Highlights ☀️
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Jun 1–4, 2026
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
              Summer 2026 · Week 2
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 2 Highlights ☀️
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              Jun 1–4, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week 2 at Sage Field&apos;s Summer Program is complete, and it has been so exciting to watch our students continue to grow and settle into our routines. Each day they are becoming more confident, independent, and comfortable trying new things — friendships are forming and enthusiasm for learning is shining through.
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
                  emoji: "🍝",
                  title: "Cooking Adventures",
                  desc: "Pasta that gloriously flopped (wrong flour-to-egg ratio!) plus strawberry limeade popsicles — measuring, mixing, teamwork, and learning from failure.",
                },
                {
                  emoji: "🎨",
                  title: "Color Mixing Exploration",
                  desc: "Mud kitchen experiments with colored water and a variety of tools, sparking curiosity and open-ended problem-solving through sensory play.",
                },
                {
                  emoji: "🌱",
                  title: "Growing Confidence",
                  desc: "Students are more independent, more willing to take initiative, and more connected to each other than Week 1 — the community is taking shape.",
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
