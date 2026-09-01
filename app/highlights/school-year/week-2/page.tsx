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

const BASE = "/assets/highlights/school_week_two";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/C789A2F8-D5D0-48AE-9C6C-153410CB374F.JPG`,
    caption: "Community garden event — families planting herbs and vegetables together",
  },
  {
    src: `${BASE}/IMG_1992.JPG`,
    caption: "Construction Zone Field Friday — digging through oobleck cement for 3D-printed blocks",
  },
  {
    src: `${BASE}/026E8AEA-C44F-4246-A9F9-AF45B8C3289B.JPG`,
    caption: "Hard-hat builders at the LEGO construction station",
  },
  {
    src: `${BASE}/C2440A5D-713E-44B4-82D6-A59AC8EDB294.JPG`,
    caption: "Outdoor directed writing — \"The Magic Pencil\" at the picnic table",
  },
  {
    src: `${BASE}/3BAB944C-5EBB-4147-BA3B-BA7EE61079C8.JPG`,
    caption: "Jungle Movement — parkour jumps onto the landing mat",
  },
  {
    src: `${BASE}/82794259-4C23-43AE-8706-E5EDF34F05FA.JPG`,
    caption: "Making pizza together — measuring, spreading sauce, and choosing toppings",
  },
  {
    src: `${BASE}/E4BE89E9-7A5D-4DE4-A445-39DC1DDC0C9B.JPG`,
    caption: "Nature-inspired garden paintings drying on the patio table",
  },
  {
    src: `${BASE}/B8409633-2A82-4A18-95FF-7BC65FDA8898.JPG`,
    caption: "Preparing fresh watermelon for the community garden event",
  },
  {
    src: `${BASE}/74160CB8-12DB-49C1-BF5D-873BECCA182C.JPG`,
    caption: "Primary students exploring a wooden clock puzzle together",
  },
  {
    src: `${BASE}/0692B9CB-AF89-4CC3-99C9-C3797795D04A.JPG`,
    caption: "Outdoor addition practice with linking cubes on the striped mat",
  },
  {
    src: `${BASE}/074E1AE7-4DA4-4D03-935C-47E4AEF7B279.JPG`,
    caption: "Garden-inspired canvas painting on the outdoor art table",
  },
  {
    src: `${BASE}/09FAA73A-CA85-4102-80F9-46B1C37D95C8.JPG`,
    caption: "Nature scavenger hunt — recording observations near the garden beds",
  },
  {
    src: `${BASE}/21B55D40-53C5-4106-99A1-8E71CA1B6875.JPG`,
    caption: "Name tracing and alphabet practice on dry-erase sleeves",
  },
  {
    src: `${BASE}/28DE4C5C-2A83-44E2-80A5-EFF344A8F277.JPG`,
    caption: "Proud artists showing their collaborative outdoor painting",
  },
  {
    src: `${BASE}/384DD291-FF63-42C8-BA02-404BD4F4A920.JPG`,
    caption: "Construction Zone Friday — decorating hard hats with gems and paint markers",
  },
  {
    src: `${BASE}/50FE921A-9B54-4862-8B27-6719EC23FA1E.JPG`,
    caption: "Sensory play with foam at the outdoor picnic table",
  },
  {
    src: `${BASE}/5C76F9A0-69BB-459A-A74E-3F3ABE317D3D.JPG`,
    caption: "Lower elementary — building numbers with popsicle-stick tens and gem ones",
  },
  {
    src: `${BASE}/7A908B6B-CBDD-4FD5-B452-DDE91EB07BA5.JPG`,
    caption: "Creative writing outdoors — \"I woke up on the moon\"",
  },
  {
    src: `${BASE}/80E5673A-9F91-449A-900C-4D3A86B7B4E7.JPG`,
    caption: "Linking cubes scattered across the outdoor lunch blanket",
  },
  {
    src: `${BASE}/95C71CF1-9A7A-4D73-A80E-981044348D01.JPG`,
    caption: "Shaded outdoor writing under the big tree",
  },
  {
    src: `${BASE}/A791AF61-0CB3-4287-9132-177755B18010.JPG`,
    caption: "Sensory letter practice pressed into kinetic sand trays",
  },
  {
    src: `${BASE}/B348E338-44E0-44AC-842F-DBED49294864.JPG`,
    caption: "Partner work at the raised garden beds during the community event",
  },
  {
    src: `${BASE}/B7149464-D795-4207-94FB-74F90D319DC4.JPG`,
    caption: "Place value matching — connecting numbers to base-ten representations",
  },
  {
    src: `${BASE}/C27EE9B7-D9A8-4DC6-8127-682E6DEB16F3.JPG`,
    caption: "Name tracing practice at the outdoor picnic table",
  },
  {
    src: `${BASE}/D69B578C-7F6B-4F85-A7AB-C86C0BE8BD33.JPG`,
    caption: "Drawing on whiteboards in the shade of the big tree",
  },
  {
    src: `${BASE}/D7EC0B6B-4515-4C88-BBEE-447FB46572B3.JPG`,
    caption: "Studying seeds and building a bird's nest from natural materials",
  },
  {
    src: `${BASE}/DD50BC8D-7A05-4C98-B0EE-FCD27061FEBC.JPG`,
    caption: "Upper elementary on a partner nature scavenger hunt",
  },
  {
    src: `${BASE}/F221FC0F-31C1-45DB-846D-7286FE7CC199.JPG`,
    caption: "Life-cycle sequencing cards beside a bowl of harvested grasses",
  },
  {
    src: `${BASE}/IMG_1991.JPG`,
    caption: "Construction Zone play table — foam blocks, toy trucks, and building toys",
  },
];

const CAROUSEL_COUNT = 8;

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🌱",
    label: "Gardening & Growing",
    desc: "Studying seeds, exploring how plants grow, and caring for living things",
  },
  {
    emoji: "🔟",
    label: "Groups of 10",
    desc: "Building sets of ten with blocks, sticks, buttons, and rocks",
  },
  {
    emoji: "🧱",
    label: "Fine Motor & Perseverance",
    desc: "Block building through frustration to creative solutions",
  },
  {
    emoji: "🪴",
    label: "Community Garden",
    desc: "Caring for new plants students will watch grow all year",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🔢",
    label: "Place Value Foundations",
    desc: "Standard and expanded form with base-10 models and popsicle-stick tens",
  },
  {
    emoji: "📖",
    label: "UFLI & Reading Foundations",
    desc: "Sight words, letter-sound relationships, and phonological awareness",
  },
  {
    emoji: "🔬",
    label: "Science Kickoff",
    desc: "Safety rules and a scientific method foldable for future labs",
  },
  {
    emoji: "🚧",
    label: "Construction Zone Friday",
    desc: "Hard-hat decorating, oobleck digs, and LEGO building",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🔢",
    label: "Place Value & Rounding",
    desc: "Expanded and word form through the hundred thousands place",
  },
  {
    emoji: "📚",
    label: "The Wild Robot",
    desc: "Continued read-aloud building comprehension and deeper connections",
  },
  {
    emoji: "✍️",
    label: "CUPS Writing",
    desc: "Directed prompts with capitalization, understanding, punctuation, and spelling",
  },
  {
    emoji: "🌿",
    label: "Nature & Movement",
    desc: "Jungle Movement, partner scavenger hunts, and garden-inspired art",
  },
  {
    emoji: "🍕",
    label: "Cooking & Garden Prep",
    desc: "Pizza together and watermelon for the community garden event",
  },
];

export default function SchoolYearWeekTwoPage() {
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
            School Year 2026–27 · Week 2
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 2 Highlights
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            August 24–28, 2026
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
              School Year 2026–27 · Week 2
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 2 Highlights
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              August 24–28, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week two brought gardening, growing, and a joyful community garden event. From primary through upper elementary, students dug into place value, science foundations, nature art, cooking, and a Construction Zone Field Friday.
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
              Growing Together Across Every Grade
            </h2>
            <p className="text-base text-gray-500 font-body">
              Primary, lower elementary, and upper elementary each dug into purposeful, hands-on learning.
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
                  emoji: "🚧",
                  title: "Field Day Friday: Construction Zone",
                  desc: "Oobleck cement digs for 3D-printed blocks, hard-hat decorating, and LEGO building stations.",
                },
                {
                  emoji: "🪴",
                  title: "Community Garden Event",
                  desc: "Families planted herbs and vegetables together — building the garden students will care for all year.",
                },
                {
                  emoji: "🌳",
                  title: "Movement, Cooking & Nature",
                  desc: "Parkour, partner scavenger hunts, pizza making, and learning that extends far beyond the desk.",
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
