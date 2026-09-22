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

const BASE = "/assets/highlights/school_week_five";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/96D93AFA-3B3B-4959-A75F-DD9624B41C29.JPG`,
    caption: "Primary students celebrating our first chicken eggs in the coop",
  },
  {
    src: `${BASE}/5246214C-00FC-4ED2-8369-7FD5DDCF29D3.JPG`,
    caption: "Upper elementary — multi-digit multiplication practice outdoors",
  },
  {
    src: `${BASE}/29AB0AD4-AEDD-4145-A6A9-5FA6D8FD605E.JPG`,
    caption: "Dot Day collaborative mural — a giant dot inspired by The Dot",
  },
  {
    src: `${BASE}/89C4E0CC-3A0E-479B-8DE9-2FA03D891A80.JPG`,
    caption: "Upper elementary — Kids Volcano Survival Guide research and design",
  },
  {
    src: `${BASE}/7A2E475F-76BD-4718-A484-854DA4FC48B5.JPG`,
    caption: "Lower elementary — number line addition with whiteboards",
  },
  {
    src: `${BASE}/FC66AAAA-7A33-4614-B36B-B553F5EAEF6D.JPG`,
    caption: "Watering seedlings in the raised garden bed",
  },
  {
    src: `${BASE}/9965B812-C19C-45DF-97DF-031DDDF9381E.JPG`,
    caption: "Dot Day plate art displayed beside The Dot book",
  },
  {
    src: `${BASE}/DEFE850C-99B6-4015-B419-89FDE3617DA0.JPG`,
    caption: "Desert Discovery Field Friday — dyed pasta for snake crafts",
  },
  {
    src: `${BASE}/4182F696-085D-47CB-9021-8F8F5DC1BD9D.JPG`,
    caption: "Primary science — researching what chickens need to lay eggs",
  },
  {
    src: `${BASE}/6F5B4460-BFF1-486C-9DAB-B7B1BB4C2FFD.JPG`,
    caption: "Building the chicken cam from recycled cardboard and materials",
  },
  {
    src: `${BASE}/1BDB4106-7495-45A8-9391-3BED523FA5C1.JPG`,
    caption: "Primary math — matching snap cubes to number cards",
  },
  {
    src: `${BASE}/F47AC380-A0C2-4C05-80B3-C3FC804976EF.JPG`,
    caption: "Collaborative engineering with recycled materials and rope",
  },
  {
    src: `${BASE}/F232DFAA-059D-4705-80AC-EDB763175364.JPG`,
    caption: "Upper elementary — highlighting key facts during volcano research",
  },
  {
    src: `${BASE}/F157BD53-B669-429C-8613-5634FA945599.JPG`,
    caption: "Desert Discovery Field Friday — painting pasta for snake crafts",
  },
  {
    src: `${BASE}/F855F2DE-4407-4A85-8F6A-52F5C8EAA910.JPG`,
    caption: "Primary students practicing writing on whiteboards",
  },
  {
    src: `${BASE}/03B0FFDA-ACC9-4F70-B82C-B16EBACD5636.JPG`,
    caption: "Friends together on the playground picnic table",
  },
  {
    src: `${BASE}/05A3BE7A-1DE2-4C9E-91EC-769F1888C0AD.JPG`,
    caption: "Outdoor community circle on the striped mat",
  },
  {
    src: `${BASE}/CCACC24E-0E7A-4442-99F4-F0596DCB4134.JPG`,
    caption: "Celebrating day 16 of school with tally marks outdoors",
  },
  {
    src: `${BASE}/BFF44DC7-3510-46E9-8D96-6DB9C96E90C5.JPG`,
    caption: "Persuasive writing practice outdoors under the trees",
  },
];

const CAROUSEL_COUNT = 8;

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🥚",
    label: "First Chicken Eggs",
    desc: "Student-led research on what chickens need — and our first eggs arrived",
  },
  {
    emoji: "📹",
    label: "Chicken Cam",
    desc: "Recycled-materials camera to observe coop behavior and gather evidence",
  },
  {
    emoji: "🐜",
    label: "Ant Investigation",
    desc: "Dot-art ants and new questions about where ants live and what they need",
  },
  {
    emoji: "🔢",
    label: "Counting Toward 100",
    desc: "Number recognition, writing bigger numbers, and math through observation",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➕",
    label: "Addition Practice",
    desc: "Two-digit plus single-digit numbers and addition with regrouping",
  },
  {
    emoji: "📖",
    label: "Sight Word Reading",
    desc: "Blending short vowels, consonants, and syllables while reading",
  },
  {
    emoji: "🗺️",
    label: "Map Skills Booklet",
    desc: "Interactive booklet breaking down continents, oceans, and map features",
  },
  {
    emoji: "🎨",
    label: "Color Theory & Dot Day",
    desc: "Color wheel lions, color mixing, and a collaborative Dot Day mural",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "✖️",
    label: "Multiplication Milestones",
    desc: "Facts for multiples 0–10 and multi-digit multiplication with regrouping",
  },
  {
    emoji: "🌋",
    label: "Volcano Science",
    desc: "Survival guides, town design, and eruption experiments with data collection",
  },
  {
    emoji: "✍️",
    label: "Persuasive Writing",
    desc: "Stating opinions with reasons, examples, and CUPS editing practice",
  },
  {
    emoji: "🍲",
    label: "Cooking & Nature Art",
    desc: "Potato and rice chicken bone broth soup and dried-flower creations",
  },
];

export default function SchoolYearWeekFivePage() {
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
            School Year 2026–27 · Week 5
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 5 Highlights
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            September 14–18, 2026
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
              School Year 2026–27 · Week 5
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 5 Highlights
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              September 14–18, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week five brought our first chicken eggs, a new ant investigation, and plenty of hands-on learning across every grade. From primary through upper elementary, students built chicken cams, strengthened addition and multiplication, researched volcanoes, celebrated Dot Day with a collaborative mural, enjoyed a special music visit, and closed the week with a Desert Discovery Field Friday.
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
              Eggs, Ants &amp; Desert Discovery Across Every Grade
            </h2>
            <p className="text-base text-gray-500 font-body">
              Primary, lower elementary, and upper elementary each followed their questions into science, math, art, and writing.
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
                  emoji: "🏜️",
                  title: "Field Day Friday: Desert Discovery",
                  desc: "Sunset desert cactus painting, desert-themed bingo, a stuffy scavenger hunt, and painted pasta snakes with googly eyes.",
                },
                {
                  emoji: "🎨",
                  title: "Dot Day Celebration",
                  desc: "A collaborative dot mural and plate art honoring creativity and self-expression inspired by The Dot.",
                },
                {
                  emoji: "🎵",
                  title: "Music & Garden Time",
                  desc: "A special music lesson with instruments, color theory through art, and watering seedlings in the garden.",
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
