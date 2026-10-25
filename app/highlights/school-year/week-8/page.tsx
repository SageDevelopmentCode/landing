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

const BASE = "/assets/highlights/school_week_eight";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/55472D86-11D0-4665-9263-D88E6DD8BCC0.JPG`,
    caption: "Field Friday — Wizard Academy hats and robes before pickup",
  },
  {
    src: `${BASE}/75DB2D5E-0D14-4F2B-9A8E-F3BB46011A8C.JPG`,
    caption: "Tree climbing and confidence-building across the schoolyard",
  },
  {
    src: `${BASE}/2313D82D-FDDB-405E-B126-A3D2F8535C14.JPG`,
    caption: "Upper elementary — flag football huddle on the open field",
  },
  {
    src: `${BASE}/12BA5C32-5A55-4546-9780-936ADFE81CD4.JPG`,
    caption: "Primary — ant maze worksheets during ecosystem inquiry",
  },
  {
    src: `${BASE}/62F3ACE5-FB5D-433D-9A38-C65CED1FDD7C.JPG`,
    caption: "Clay sculpting during a senior-partner community lesson",
  },
  {
    src: `${BASE}/C56A5ED2-BB79-43B6-A073-A8CA5E12BDFF.JPG`,
    caption: "Upper elementary — collaborative writing around the communal table",
  },
  {
    src: `${BASE}/A74450BE-1E7C-40C1-8E90-4791D847F939.JPG`,
    caption: "Outdoor play — perched high in a campus climbing tree",
  },
  {
    src: `${BASE}/E0C8FFD0-A9C1-4C3F-95A2-5CAC259400EC.JPG`,
    caption: "Primary — gentle hands-on time with a campus chicken",
  },
  {
    src: `${BASE}/014C2A1B-4E36-4A24-93A7-29854C856E90.JPG`,
    caption: "Outdoor circle — shared snack and conversation under the trees",
  },
  {
    src: `${BASE}/1ACD0A6E-BE06-48C6-9925-D9CA75E4D31B.JPG`,
    caption: "PE on the field — listening for the next drill under open sky",
  },
  {
    src: `${BASE}/3381E67D-508A-4516-887C-279A6A615851.JPG`,
    caption: "Lower elementary — small-group literacy at the wooden table",
  },
  {
    src: `${BASE}/3CFF9370-8290-47DA-AB68-AAE4C80DEDD4.JPG`,
    caption: "Lower elementary — CVC word building with letter tiles on the rug",
  },
  {
    src: `${BASE}/3FCF48F8-2E23-4B9B-8B40-24ED8C0C2757.JPG`,
    caption: "Flag football practice with cones across the campus field",
  },
  {
    src: `${BASE}/4DB07FA9-6E6E-46DA-A885-884969440DD2.JPG`,
    caption: "One-on-one reading with a National Geographic Kids book outdoors",
  },
  {
    src: `${BASE}/8617B92B-591B-410F-B3A0-E2767B7458B5.JPG`,
    caption: "Independent reading — Weird Sea Creatures at the picnic table",
  },
  {
    src: `${BASE}/90907B25-7288-4882-A6C6-5CC0891CD672.JPG`,
    caption: "Primary partners tracing paths on an ant maze worksheet",
  },
  {
    src: `${BASE}/9FABA5E8-0D39-483F-B621-6FDB461DBA44.JPG`,
    caption: "Lower elementary — build-and-subtract with cubes and dry-erase mats",
  },
  {
    src: `${BASE}/A5DE52D7-4673-4447-BC64-8DD00521AFF4.JPG`,
    caption: "Outdoor subtraction — cookie-themed word problems at the picnic table",
  },
  {
    src: `${BASE}/D52D07CB-9A24-4231-B7D6-924F9DE1958A.JPG`,
    caption: "Fish-bowl subtraction with manipulatives on a sunny outdoor table",
  },
  {
    src: `${BASE}/E7405D91-8984-4818-804C-3E00CA19D87D.JPG`,
    caption: "Two-digit subtraction practice in dry-erase sleeves outdoors",
  },
];

const CAROUSEL_COUNT = 8;

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "♻️",
    label: "Recycling & Earth Care",
    desc: "Plastic, glass, metal, and food scraps — what can be made new again",
  },
  {
    emoji: "🐜",
    label: "Ants & Ecosystems",
    desc: "What would the world look like without ants? Inquiry into roles in nature",
  },
  {
    emoji: "🍰",
    label: "Fractions Begin",
    desc: "Dividing and sharing quantities into equal parts through ant study",
  },
  {
    emoji: "🌳",
    label: "Outdoor Classrooms",
    desc: "Crisp mornings moved reading, math, and play into fresh air",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➖",
    label: "Subtraction Units",
    desc: "Number bonds, manipulatives, and two-digit subtraction without regrouping",
  },
  {
    emoji: "📖",
    label: "CVC & Blending",
    desc: "Stretching sounds and building consonant-vowel-consonant words",
  },
  {
    emoji: "🇺🇸",
    label: "Flag & Matter",
    desc: "What the U.S. flag represents plus physical changes in materials",
  },
  {
    emoji: "🎨",
    label: "Shape & Color",
    desc: "Geometric and organic shapes painted so overlaps mix new hues",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Deep Dive",
    desc: "Equivalence, number lines, and fraction blocks for parts of a whole",
  },
  {
    emoji: "✨",
    label: "Similes & Long-O",
    desc: "Creative comparisons plus Definition Detective spelling routines",
  },
  {
    emoji: "🖼️",
    label: "Symmetry Portraits",
    desc: "Warm or cool backgrounds paired with half-photo, half-drawn faces",
  },
  {
    emoji: "🏈",
    label: "Chili & Flag Football",
    desc: "Hearty cooking lab and organized movement on the field",
  },
];

export default function SchoolYearWeekEightPage() {
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
            School Year 2026–27 · Week 8
          </motion.span>
          <motion.h1
            key={`heading-${activeSlide}`}
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Week 8 Highlights
          </motion.h1>
          <motion.p
            key={`date-${activeSlide}`}
            className="text-white/80 font-body text-sm font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            October 5–9, 2026
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
              School Year 2026–27 · Week 8
            </span>
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-1">
              Week 8 Highlights
            </h1>
            <p className="text-sm font-semibold text-primary font-body mb-4">
              October 5–9, 2026
            </p>
          </div>

          <motion.p
            className="text-lg text-gray-600 font-body leading-relaxed max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Week eight followed curiosity about the living world. Primary explored recycling, decomposition, and ants — with early fractions woven into equal sharing; lower elementary opened October units in subtraction, phonics, flag symbolism, and shape painting; upper elementary stretched fractions, similes, and symmetry portraits — then the whole school closed with Wizard Academy Field Friday and a hearty chili cook-along.
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
              Recycling, Fractions &amp; Wizard Academy Across Every Grade
            </h2>
            <p className="text-base text-gray-500 font-body">
              Primary, lower elementary, and upper elementary each turned Earth-care questions into math, literacy, art, cooking, and community connections.
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
                  emoji: "🧙",
                  title: "Field Day Friday: Wizard Academy",
                  desc: "Painted wands, glitter potion necklaces, decorated wizard hats, spell practice, and a closing potion experiment.",
                },
                {
                  emoji: "🌶️",
                  title: "Little Chefs: Chili",
                  desc: "Chopped peppers and onions, opened cans of beans, simmered with broth and spices, then topped bowls with cheese and Fritos.",
                },
                {
                  emoji: "🤝",
                  title: "Intergenerational Clay",
                  desc: "Clay lesson with senior living partners — sculpting side by side and building community beyond campus.",
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
