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

const BASE = "/assets/highlights/school_week_six";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/CFFE7C16-F58B-4392-A325-165B53D36776.JPG`,
    caption: "Primary — storytime circle with picture books across the classroom",
  },
  {
    src: `${BASE}/9D2AC2BE-C4FB-4EA2-A3F3-50070DF3D6F6.JPG`,
    caption: "Primary — classroom Marketplace play inspired by the Sage Field Store",
  },
  {
    src: `${BASE}/E8A37B1E-B2E0-4459-935A-9F12BAB7ABA7.JPG`,
    caption: "Lower elementary — sink-or-float science outdoors with hypothesis charts",
  },
  {
    src: `${BASE}/A308BD2F-F8A5-4AC4-92B0-B4594010A2DA.JPG`,
    caption: "Lower elementary — double-digit addition with dry-erase math games",
  },
  {
    src: `${BASE}/56E3D25A-E7EB-4736-9481-33A016535AB4.JPG`,
    caption: "Primary — sequencing an ant picture puzzle during life-cycle study",
  },
  {
    src: `${BASE}/ADB81CFB-428A-4757-8B3D-EBAF8C6FC2E3.JPG`,
    caption: "Upper elementary — collaborative writing and drawing at the communal table",
  },
  {
    src: `${BASE}/1B03EB34-69A5-4D58-BBA8-5DEE9BC3AFEF.JPG`,
    caption: "Upper elementary — chopping harvest veggies for quinoa bowls in cooking",
  },
  {
    src: `${BASE}/D829EEC5-6E49-4EAF-8511-1A69149F8C29.JPG`,
    caption: "Field Friday — outdoor read-aloud before At the Zoo adventures",
  },
  {
    src: `${BASE}/D6E9103F-BB41-4498-B0A7-6179DE557DE3.JPG`,
    caption: "Cross-grade community circle — mixed ages learning together",
  },
  {
    src: `${BASE}/B0C1EC95-E5E6-428B-8FE6-685DFA48CED0.JPG`,
    caption: "Primary — ant tracing for fine motor practice and letter paths",
  },
  {
    src: `${BASE}/BB3406ED-E09C-4A77-93D6-CAFF3BAF4C19.JPG`,
    caption: "Lower elementary — number line and domino addition on write-and-wipe boards",
  },
  {
    src: `${BASE}/5187D3A3-90D3-49D4-B2F8-21A8CC91E646.JPG`,
    caption: "Lower elementary — proud moment after a double-digit addition challenge",
  },
  {
    src: `${BASE}/E4B434B6-5A11-4535-B4B4-5911AA09A99D.JPG`,
    caption: "Outdoor movement and teamwork on the basketball court",
  },
  {
    src: `${BASE}/1830BD01-9BFC-48C1-9E0D-6C5F53275E8A.JPG`,
    caption: "Lower elementary — two-digit addition with base-ten models on dry-erase sleeves",
  },
  {
    src: `${BASE}/3DE8BC89-5565-4251-916E-BA3C9D51D427.JPG`,
    caption: "Primary — pattern-building with colorful pebbles and wooden slices",
  },
  {
    src: `${BASE}/39E6D96A-BBC6-4EE9-BF83-1D10B336F641.JPG`,
    caption: "Lower elementary — moveable alphabet and ten-frame tokens for word building",
  },
  {
    src: `${BASE}/785EB6A4-5380-4D9F-9765-9CC4AA352181.JPG`,
    caption: "Reading buddies — The Biggest Pumpkin Ever and fall observations",
  },
  {
    src: `${BASE}/7B07976E-6BD7-4C60-A4F6-1DB68D77BBAD.JPG`,
    caption: "Primary — Curious George read-aloud on floor cushions",
  },
  {
    src: `${BASE}/84CC6B05-620A-41AD-A6E4-4899811A2F7F.JPG`,
    caption: "Friends sharing a picture book during quiet reading time",
  },
  {
    src: `${BASE}/9CBBE4DE-6DBC-473C-82D1-A55ECD8040AF.JPG`,
    caption: "Upper elementary — focused vocabulary writing with headphones on",
  },
  {
    src: `${BASE}/AAF4728D-B1F7-446F-9218-C6BCBEB5A2C2.JPG`,
    caption: "Collaborative search-and-find reading at the table",
  },
  {
    src: `${BASE}/C50A3C70-B9BC-44F6-B142-54718431E8F7.JPG`,
    caption: "Music circle with rhythm sticks during our ant investigation theme",
  },
  {
    src: `${BASE}/1F6084C2-6094-442D-81D1-AC9C3563ADAC.JPG`,
    caption: "Quiet reading spread across the primary classroom",
  },
  {
    src: `${BASE}/1D7D6AFE-DC1B-47A9-A062-263F421B93DC.JPG`,
    caption: "Primary — hands-on mixing during a science exploration",
  },
  {
    src: `${BASE}/A61A1CA3-C251-4DE9-9E1A-99B025791D3A.JPG`,
    caption: "Primary — marketplace writing with life-cycle vocabulary cards",
  },
];

const CAROUSEL_COUNT = 8;

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🍂",
    label: "Fall Nature Walks",
    desc: "Collecting leaves and sticks while counting by 5s and noticing patterns outdoors",
  },
  {
    emoji: "🐜",
    label: "Ant Life Cycle",
    desc: "Puzzles, tracing, and big questions about why ants matter in our ecosystem",
  },
  {
    emoji: "🎃",
    label: "Pumpkin Decomposition",
    desc: "Observing mold, compost, and what happens when we care for our environment",
  },
  {
    emoji: "🏪",
    label: "Classroom Marketplace",
    desc: "Store play tied to costs, buying, and reusing materials like the Sage Field Store",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➕",
    label: "Addition Strategies",
    desc: "Counting on, number lines, and two-digit regrouping with manipulatives",
  },
  {
    emoji: "📖",
    label: "Phonics & Sight Words",
    desc: "Short vowels, consonant sounds, and encoding words in daily reading",
  },
  {
    emoji: "💧",
    label: "States of Matter",
    desc: "Particle models plus sink-or-float tests with real hypotheses outdoors",
  },
  {
    emoji: "🎨",
    label: "Complementary Colors",
    desc: "Ocean-and-sun sketches for a color-wheel art project, plus end-of-week music",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➗",
    label: "Division Foundations",
    desc: "Groups-of thinking with cubes — connecting division back to multiplication",
  },
  {
    emoji: "✏️",
    label: "Story Craft & How-To Writing",
    desc: "Literary elements and procedural PB&J directions with clear steps for readers",
  },
  {
    emoji: "🫖",
    label: "Clay & Buddy Learning",
    desc: "First clay exploration plus cross-grade buddy time with primary students",
  },
  {
    emoji: "🥗",
    label: "Harvest Quinoa Bowls",
    desc: "Cooking together — sequencing, measuring, and teamwork from prep to plate",
  },
];

export default function SchoolYearWeekSixPage() {
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
            School Year 2026–27 · Week 6
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 6 Highlights
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            September 21–25, 2026
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

      <section className="pt-8 sm:pt-10 pb-10 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="sm:hidden mb-4">
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-3 font-body">
              School Year 2026–27 · Week 6
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 6 Highlights
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              September 21–25, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week six brought a grounded rhythm — friendships growing, routines solid, and curiosity leading the way. From primary through upper elementary, students explored fall nature walks and ant investigations, strengthened addition and division, tested sink-or-float hypotheses, launched procedural writing, enjoyed music and buddy learning across grades, and closed the week with an At the Zoo Field Friday.
          </motion.p>
        </div>
      </section>

      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
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
              Fall Wonder &amp; At the Zoo Across Every Grade
            </h2>
            <p className="text-base text-gray-500 font-body">
              Primary, lower elementary, and upper elementary each followed fall observations into science, math, writing, and outdoor play.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
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
              <p className="text-xs text-gray-400 font-body mb-4">Pre-K &amp; Kindergarten</p>
              <ul className="space-y-3">
                {PRIMARY_HIGHLIGHTS.map((item) => (
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

            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✨</span>
                </div>
                <h3 className="text-lg font-bold font-heading text-gray-800">Lower Elementary</h3>
              </div>
              <p className="text-xs text-gray-400 font-body mb-4">1st &amp; 2nd Grade</p>
              <ul className="space-y-3">
                {LOWER_ELEMENTARY_HIGHLIGHTS.map((item) => (
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

            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📐</span>
                </div>
                <h3 className="text-lg font-bold font-heading text-gray-800">Upper Elementary</h3>
              </div>
              <p className="text-xs text-gray-400 font-body mb-4">3rd &amp; 4th Grade</p>
              <ul className="space-y-3">
                {UPPER_ELEMENTARY_HIGHLIGHTS.map((item) => (
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
                  emoji: "🦁",
                  title: "Field Day Friday: At the Zoo",
                  desc: "Lion read-alouds, zoo animal painting, zoo bingo, and a zookeeper riddle hunt to return escaped animal stuffies to their habitats.",
                },
                {
                  emoji: "🤝",
                  title: "Buddy Learning Across Grades",
                  desc: "Upper elementary paired with primary for shared lessons — leadership, patience, and learning side by side.",
                },
                {
                  emoji: "🎵",
                  title: "Music & Community Circles",
                  desc: "Rhythm sticks and songs during ant investigations, plus storytime and reading circles that build belonging.",
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
              Interested in Sage Field for your family?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-7 max-w-md mx-auto">
              Enrollment is open for School Year 2026–2027. Come see the campus for yourself — we&apos;d love to meet your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/apply?tab=school-year")}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Enroll Now →
              </button>
              <button
                onClick={() => router.push("/tour")}
                className="px-8 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                Tour the Campus
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
