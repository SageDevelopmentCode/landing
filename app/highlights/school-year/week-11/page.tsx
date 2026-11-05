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

const BASE = "/assets/highlights/school_week_eleven";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/2D1BA87C-3BA1-4596-857A-D62FFFD3AEF6.JPG`,
    caption: "Field Friday — witches’ brew eruptions from mini cauldrons on the picnic table",
  },
  {
    src: `${BASE}/06323F77-4E26-4A28-AC58-36B018A0831D.JPG`,
    caption: "Morning circle — stories and songs on the outdoor rug under the pecan tree",
  },
  {
    src: `${BASE}/A27CDDBC-D55F-4D28-B423-25A007194873.JPG`,
    caption: "Field Friday — superhero costumes and imaginative play on the schoolyard",
  },
  {
    src: `${BASE}/CFCC1BF1-A38B-494A-A5CC-EEFB52A70DCF.JPG`,
    caption: "Science — elephant-toothpaste foam spilling from carved mini pumpkins",
  },
  {
    src: `${BASE}/1D2A5D92-CD84-4A03-BE62-245B61BBAB7C.JPG`,
    caption: "Field Friday — a row of bubbling cauldrons along the harvest table",
  },
  {
    src: `${BASE}/55E07E7B-A294-4309-BD0D-0A6F80407C09.JPG`,
    caption: "Changes in matter — colorful foam erupting from hollowed pumpkins",
  },
  {
    src: `${BASE}/BB5BE812-A57A-479A-9518-EA35163807C1.JPG`,
    caption: "Outdoor play — rope-course hangs and upside-down challenges between the trees",
  },
  {
    src: `${BASE}/84536C72-8BDE-4317-BC8D-DBF847371B06.JPG`,
    caption: "Primary — papier-mâché globes drying after Halloween creativity",
  },
  {
    src: `${BASE}/12AA3FB4-39F5-4C0F-AE00-9333FA3F0C51.JPG`,
    caption: "Science prep — carving and scooping mini pumpkins before the big reaction",
  },
  {
    src: `${BASE}/2556ABDA-EB7C-4195-91C4-02B8ADFDFDDD.JPG`,
    caption: "Field Friday — pumpkin painting and slime stations around the picnic table",
  },
  {
    src: `${BASE}/284E3969-ABB3-4FE9-8058-77EC8EF3EBCE.JPG`,
    caption: "Social studies — White House facts researched on clipboards in the sunshine",
  },
  {
    src: `${BASE}/4730BACD-4FC9-43B0-91CB-9B8B291DA3EF.JPG`,
    caption: "Cooking — peeling apples for mini pies on the covered porch",
  },
  {
    src: `${BASE}/4C5C311E-D73B-4828-B490-D5B89A4EEA4E.JPG`,
    caption: "Field Friday — painted pumpkins lined up for Halloween take-home art",
  },
  {
    src: `${BASE}/57847C9B-0702-4522-A6A4-7D8505A532D4.JPG`,
    caption: "Upper elementary — Greek and Latin prefix study at the whiteboard",
  },
  {
    src: `${BASE}/59C54FC7-BC37-44F1-8A21-BA69BFAC9332.JPG`,
    caption: "Writing outdoors — friendly letters and apple-pie recipe notes at lunch tables",
  },
  {
    src: `${BASE}/5E2F84E7-04BA-4559-B923-E80B20E89938.JPG`,
    caption: "Upper elementary — fraction division rewritten as multiplication on whiteboards",
  },
  {
    src: `${BASE}/5FBD2189-56B1-4A9A-87CF-8C71AF4D892A.JPG`,
    caption: "Math outdoors — mixed numbers and improper fractions on handheld boards",
  },
  {
    src: `${BASE}/61B5F293-E511-4D59-9E3E-9B91175A283F.JPG`,
    caption: "Seasonal making — decorated gingerbread-style house with frosting and sprinkles",
  },
  {
    src: `${BASE}/98947A25-7134-47E8-91AB-7159066B8AC2.JPG`,
    caption: "Research writing — solar-system diagrams beside reference books",
  },
  {
    src: `${BASE}/A64B6AD5-4EDE-455D-B908-F3B7CBAD96A5.JPG`,
    caption: "Pumpkin engineering — hammer-and-peg patterns before the science pour-in",
  },
  {
    src: `${BASE}/CFAA206B-D9A7-4A14-B1DD-85361140163B.JPG`,
    caption: "Campus lunch — picnic blankets and costumes on a crisp October afternoon",
  },
  {
    src: `${BASE}/D210D1F5-2433-42D7-B9CD-13A91277D0B0.JPG`,
    caption: "Notebooking — research sketches with headphones and colored pencils",
  },
  {
    src: `${BASE}/D5140BFA-7ABC-4F92-96A7-8CCB732C546A.JPG`,
    caption: "Community — friends together on the field under autumn skies",
  },
  {
    src: `${BASE}/D785E404-2B65-43B0-BB5E-567E14434AD7.JPG`,
    caption: "Small-group literacy — spider research and illustrated notebook pages",
  },
  {
    src: `${BASE}/DB2777F7-2C5A-4DCB-9E13-8E339309622E.JPG`,
    caption: "Lower elementary — two-digit subtraction with regrouping on dry-erase sleeves",
  },
  {
    src: `${BASE}/E7C3B417-1770-412A-BF5A-5C5DEE0AB62B.JPG`,
    caption: "Whole-group math — subtraction review at the whiteboard before October wrap-up",
  },
  {
    src: `${BASE}/E85EDE1E-ADFE-4F0D-861C-1427EB58E8AB.JPG`,
    caption: "Primary — Play-Doh letters and alphabet cards at the learning table",
  },
];

const CAROUSEL_COUNT = 8;

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🏎️",
    label: "F1 Speed Recap",
    desc: "Lap counting, stopwatch timing, and speedometer talk after the racing inquiry",
  },
  {
    emoji: "🍧",
    label: "Juice-Pop Plans",
    desc: "Young entrepreneurs mapped steps and pricing questions for a product idea",
  },
  {
    emoji: "🎃",
    label: "Papier-Mâché",
    desc: "Halloween hands-on building with newspaper, paste, and imagination",
  },
  {
    emoji: "🚗",
    label: "Future Transport",
    desc: "Flying-car sketches sparked big questions about how cities might move",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➖",
    label: "Subtraction Review",
    desc: "Math games and a brain check closed out October number work",
  },
  {
    emoji: "🔤",
    label: "CVC Wrap-Up",
    desc: "Building, spelling, and reading consonant-vowel-consonant words all week",
  },
  {
    emoji: "🧪",
    label: "Pumpkin Science",
    desc: "Carved mini pumpkins powered elephant-toothpaste eruptions outdoors",
  },
  {
    emoji: "👻",
    label: "Halloween Field Friday",
    desc: "Pumpkin paint, spooky slime, witches’ brew, and yard games before pick-up",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Fluency",
    desc: "Like and unlike denominators, multiplication, equivalents, and ordering",
  },
  {
    emoji: "📓",
    label: "Notebooking",
    desc: "I Think, I Notice, I Wonder responses turned reading into research",
  },
  {
    emoji: "🔤",
    label: "Word Study",
    desc: "Compound words plus in-, im-, and dis- prefixes in vocabulary work",
  },
  {
    emoji: "🥧",
    label: "Pies & Dot Art",
    desc: "Mini apple pies, spiral dot drawings, music, and a classroom celebration",
  },
];

export default function SchoolYearWeekElevenPage() {
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
            School Year 2026–27 · Week 11
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 11 Highlights
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            October 26–30, 2026
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
              School Year 2026–27 · Week 11
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 11 Highlights
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              October 26–30, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week eleven closed October with unit wrap-ups, real cooking, and Halloween creativity across campus. Primary revisited F1 speed and juice-pop entrepreneurship before papier-mâché making; lower elementary reviewed subtraction and CVC words, finished American symbols, and erupted elephant toothpaste from mini pumpkins before Halloween Field Friday; upper elementary pushed fraction operations, notebooking, and word study — plus mini apple pies, spiral dot art, and a joyful classroom celebration.
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
              October Wrap-Up &amp; Halloween Across Every Grade
            </h2>
            <p className="text-base text-gray-500 font-body">
              Primary, lower elementary, and upper elementary each tied entrepreneurship, symbols, fractions, cooking, and Field Friday festivities to joyful outdoor learning.
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
                  emoji: "👻",
                  title: "Field Friday: Halloween",
                  desc: "Pumpkin painting, spooky slime, witches’ brew eruptions, and yard games with a huge community turnout.",
                },
                {
                  emoji: "🥧",
                  title: "Mini Apple Pies",
                  desc: "Peeling, measuring, and baking together — a sweet way to wrap up October cooking.",
                },
                {
                  emoji: "🎃",
                  title: "October Art & Science",
                  desc: "Symmetrical Halloween masterpieces and elephant-toothpaste pumpkins capped changes-in-matter study.",
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
