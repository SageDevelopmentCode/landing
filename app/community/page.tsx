"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import WeekRecapPreview from "../components/WeekRecapPreview";
import WaitlistDialog from "../components/WaitlistDialog";
import EveningSpotlight from "../components/community/EveningSpotlight";
import PlantCatalog from "../components/community/PlantCatalog";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const HERO_IMAGES = [
  {
    src: "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
    caption: "Strawberry jam — from our garden to the stovetop",
  },
  {
    src: "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
    caption: "New friendships blooming at Sage Field",
  },
  {
    src: "/assets/ImageSeven.jpg",
    caption: "Nature is woven into every part of our day",
  },
  {
    src: "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
    caption: "Welcome to summer at Sage Field",
  },
  {
    src: "/assets/highlights/summer_week_four/FF7095AC-1AFC-4011-9C27-8B2C0573121B 2.JPG",
    caption: "Homemade strawberry jam — from scratch",
  },
  {
    src: "/assets/Stock3.jpg",
    caption: "Hands-on learning in the great outdoors",
  },
  {
    src: "/assets/ImageOne.jpg",
    caption: "Growing together as a community",
  },
  {
    src: "/assets/highlights/summer_week_four/FD2FCA61-D903-4059-B681-20AF2027754F.JPG",
    caption: "Tasting the fruits of our cooking class",
  },
];

const CAROUSEL_COUNT = 8;

const GALLERY_IMAGES = [
  "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
  "/assets/highlights/summer_week_four/27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG",
  "/assets/highlights/summer_week_four/FF7095AC-1AFC-4011-9C27-8B2C0573121B 2.JPG",
  "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  "/assets/highlights/summer_week_one/66719803-D874-46B5-9B16-C4F79A865A85 2.JPG",
  "/assets/ImageSeven.jpg",
  "/assets/Stock3.jpg",
  "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
];

const EVENING_ACTIVITIES = [
  {
    title: "Planting",
    desc: "Help our community garden grow — every plant becomes part of something lasting.",
    detail:
      "Dig in alongside neighbors and leave a living mark on Sage Field. Every flower, herb, and vegetable planted becomes part of a garden built with love.",
    image:
      "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
  },
  {
    title: "Painting",
    desc: "Creative garden markers and art that make our space even more beautiful.",
    detail:
      "Paint garden markers, signs, and outdoor art with your family. Creative touches that make our shared space feel even more welcoming.",
    image:
      "/assets/highlights/summer_week_four/C3E15299-9AB4-420A-BB46-2C998A4B1C38 2.JPG",
  },
  {
    title: "Connecting",
    desc: "Meet Sage Field families and visiting friends over a cozy evening outdoors.",
    detail:
      "Share a snack, swap stories, and meet families who call Sage Field home — and friends who are discovering us for the first time.",
    image:
      "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  },
  {
    title: "Creating",
    desc: "Memories that bloom for years — built together, rooted in community.",
    detail:
      "From first plantings to painted markers, this evening is about making memories our children will carry for years — rooted in community.",
    image: "/assets/ImageSeven.jpg",
  },
];

const PLANT_CATEGORIES = [
  {
    id: "herbs",
    label: "Herbs",
    plants: [
      "Basil",
      "Rosemary",
      "Thyme",
      "Sage",
      "Parsley",
      "Chives",
      "Oregano",
    ],
  },
  {
    id: "fruits",
    label: "Fruits",
    plants: ["Strawberries", "Blackberries", "Blueberries"],
  },
  {
    id: "vegetables",
    label: "Vegetables",
    plants: [
      "Cherry Tomatoes",
      "Bell Peppers",
      "Cucumbers",
      "Bush Beans",
      "Okra",
      "Swiss Chard",
      "Kale",
    ],
  },
  {
    id: "flowers",
    label: "Flowers",
    plants: [
      "Zinnias",
      "Marigolds",
      "Sunflowers",
      "Coneflowers",
      "Black-eyed Susans",
      "Salvia",
      "Lantana",
      "Pentas",
    ],
  },
];

const PREVIEW_WEEKS = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Summer",
    href: "/highlights/summer/week-1",
    coverImage:
      "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  },
  {
    week: 2,
    dates: "Jun 1–4",
    theme: "Mystery Camp Escape Challenge",
    href: "/highlights/summer/week-2",
    coverImage:
      "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  },
  {
    week: 3,
    dates: "Jun 9–13",
    theme: "Beach Day Bash",
    href: "/highlights/summer/week-3",
    coverImage:
      "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  },
  {
    week: 4,
    dates: "Jun 15–19",
    theme: "STEM Adventure & Strawberry Jam",
    href: "/highlights/summer/week-4",
    coverImage:
      "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  },
  {
    week: 5,
    dates: "Jun 22–26",
    theme: "Safari Adventure & Snake Deep Dive",
    href: "/highlights/summer/week-5",
    coverImage:
      "/assets/highlights/summer_week_five/69BAEEC0-7C4B-4821-8595-02152DC7E7FB.JPG",
  },
  {
    week: 6,
    dates: "Jun 29–Jul 2",
    theme: "Cooking from Scratch & Halfway There",
    href: "/highlights/summer/week-6",
    coverImage:
      "/assets/highlights/summer_week_six/1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
  },
];

const PHILOSOPHY_PILLARS = [
  {
    icon: "🌱",
    title: "Hands-on Learning",
    desc: "Children learn best by doing — building, growing, experimenting.",
    image: "/assets/ImageOne.jpg",
  },
  {
    icon: "🌳",
    title: "Movement & Nature",
    desc: "Outside is a classroom. Daily outdoor time is non-negotiable.",
    image: "/assets/ImageSeven.jpg",
  },
  {
    icon: "🎨",
    title: "Creative Expression",
    desc: "Art, storytelling, and music are core — not extras.",
    image: "/assets/ImageEleven.jpg",
  },
  {
    icon: "🏠",
    title: "Family Partnership",
    desc: "School, student, and family grow together — rooted in trust.",
    image: "/assets/Stock3.jpg",
  },
];

const inputClass =
  "border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function CommunityGardenPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [pickedPlants, setPickedPlants] = useState<Set<string>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const mobileRafRef = useRef<number | null>(null);

  const prefersReducedMotion = usePrefersReducedMotion();

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveSlide((s) => (s + 1) % CAROUSEL_COUNT);
    }, 5000);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval, prefersReducedMotion]);

  useEffect(() => {
    const target = new Date("2026-08-27T17:30:00-05:00");
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const setupAutoScroll = useCallback(
    (
      el: HTMLDivElement | null,
      rafRef: { current: number | null },
    ) => {
      if (!el || prefersReducedMotion) return;
      el.scrollLeft = 0;
      let pos = 0;
      const tick = () => {
        if (el) {
          pos += 0.6;
          el.scrollLeft = Math.round(pos);
          if (el.scrollLeft >= el.scrollWidth / 2) {
            pos = 0;
            el.scrollLeft = 0;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [prefersReducedMotion],
  );

  useEffect(() => {
    setupAutoScroll(mobileGalleryRef.current, mobileRafRef);
    return () => {
      if (mobileRafRef.current) cancelAnimationFrame(mobileRafRef.current);
    };
  }, [setupAutoScroll]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
    if (!prefersReducedMotion) startInterval();
  };

  const goPrev = () =>
    goToSlide((activeSlide - 1 + CAROUSEL_COUNT) % CAROUSEL_COUNT);
  const goNext = () => goToSlide((activeSlide + 1) % CAROUSEL_COUNT);

  const scrollToRSVP = () =>
    document
      .getElementById("rsvp-section")
      ?.scrollIntoView({ behavior: "smooth" });

  const scrollToEvening = () =>
    document
      .getElementById("about-evening")
      ?.scrollIntoView({ behavior: "smooth" });

  const togglePickedPlant = (plant: string) => {
    setPickedPlants((prev) => {
      const next = new Set(prev);
      if (next.has(plant)) next.delete(plant);
      else next.add(plant);
      return next;
    });
  };

  return (
    <div className={`min-h-screen bg-white ${dancingScript.variable}`}>
      <Navbar darkStyle />

      {/* ── HERO ── */}
      <section
        className="bg-welcome-bg pt-28 sm:pt-32 pb-8 px-8 sm:px-12 lg:px-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-10">
            {/* Mobile auto-scroll strip */}
            <div className="sm:hidden -mx-2">
              <div
                ref={mobileGalleryRef}
                className="overflow-x-auto flex gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
              >
                {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((src, i) => (
                  <div
                    key={i}
                    className="relative w-[72vw] flex-shrink-0 aspect-[4/3] rounded-xl overflow-hidden shadow-md"
                  >
                    <Image
                      src={src}
                      alt="Sage Field community"
                      fill
                      className="object-cover"
                      sizes="72vw"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-text-gray font-heading leading-tight">
                Sage Field{" "}
                <span className="text-sage-700">Community Garden Day</span>
              </h1>
              <p className="text-lg text-gray-600 font-body leading-relaxed max-w-xl">
                The most beautiful things grow when a community grows together.
                Join us for a cozy evening of planting, painting, connecting, and
                creating a garden that will bloom with memories for years to
                come.
              </p>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "📅", label: "Thursday, August 27, 2026" },
                  { icon: "🕔", label: "5:30–7:00 PM" },
                  {
                    icon: "📍",
                    label: "2760 Gattis School Rd, Round Rock, TX 78664",
                  },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-text-gray font-body shadow-sm"
                  >
                    <span>{pill.icon}</span>
                    {pill.label}
                  </span>
                ))}
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-4 pt-1">
                {[
                  { label: "Days", value: countdown.days },
                  { label: "Hours", value: countdown.hours },
                  { label: "Mins", value: countdown.mins },
                  { label: "Secs", value: countdown.secs },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="bg-white rounded-xl border border-sage-100 px-4 py-3 text-center shadow-sm min-w-[4.5rem]"
                  >
                    <p className="text-2xl font-bold font-heading text-sage-700">
                      {d.value}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 font-body uppercase tracking-wide">
                      {d.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={scrollToRSVP}
                  className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-xl text-base font-body shadow-lg transition-colors duration-200 cursor-pointer"
                >
                  Save the Date →
                </motion.button>
                <button
                  type="button"
                  onClick={scrollToEvening}
                  className="text-sm text-text-gray underline underline-offset-2 font-body hover:text-primary transition-colors cursor-pointer"
                >
                  See what&apos;s planned ↓
                </button>
              </div>
            </motion.div>

            {/* Desktop carousel */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden sm:block relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-sage-100"
            >
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
                    src={HERO_IMAGES[activeSlide].src}
                    alt={HERO_IMAGES[activeSlide].caption}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 40vw"
                    priority={activeSlide === 0}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <motion.p
                key={`cap-${activeSlide}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 text-white text-sm font-body drop-shadow-md"
              >
                {HERO_IMAGES[activeSlide].caption}
              </motion.p>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                {Array.from({ length: CAROUSEL_COUNT }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 cursor-pointer ${
                      i === activeSlide ? "bg-white" : "bg-white/40"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VISION / STORY ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-base md:text-lg text-gray-600 font-body leading-relaxed"
          >
            <p>
              At Sage Field, we believe the most beautiful things grow when a
              community grows together. Our hope is that every family leaves
              feeling even more connected to nature, to our school, and to one
              another.
            </p>
            <p>
              We kindly invite each family to bring at least one plant to help
              our community garden grow! Every flower, herb, fruit, or vegetable
              planted will become part of a garden built with love by our Sage
              Field families.
            </p>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-10 p-6 sm:p-8 rounded-2xl border-2 border-sage-200 bg-sage-50/50"
          >
            <p className="text-lg sm:text-xl text-gray-700 font-body leading-relaxed">
              Every time our children harvest a tomato, smell fresh basil, or
              pick a flower, they&apos;ll remember that this garden was{" "}
              <span
                className={`${dancingScript.className} text-2xl sm:text-3xl text-sage-700`}
              >
                built with love by the families who call Sage Field home.
              </span>
            </p>
          </motion.blockquote>
        </div>
      </section>

      <EveningSpotlight
        activities={EVENING_ACTIVITIES}
        onSaveTheDate={scrollToRSVP}
      />

      <PlantCatalog
        categories={PLANT_CATEGORIES}
        pickedPlants={pickedPlants}
        onTogglePlant={togglePickedPlant}
        onSaveTheDate={scrollToRSVP}
        prefersReducedMotion={prefersReducedMotion}
      />

      <WeekRecapPreview className="bg-welcome-bg" />

      {/* ── SUMMER HIGHLIGHTS ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-5 font-body">
              Summer 2026
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              See What Life at Sage Field Looks Like
            </h2>
            <p className="text-base text-gray-500 font-body max-w-xl mx-auto">
              12 weeks of outdoor learning, real academics, and joy — a glimpse
              into our community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {PREVIEW_WEEKS.map((week, i) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link
                  href={week.href}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image
                      src={week.coverImage}
                      alt={`Week ${week.week} — ${week.theme}`}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full font-body shadow-sm">
                      Week {week.week}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 font-body mb-1">
                      {week.dates}
                    </p>
                    <h3 className="text-sm font-bold font-heading text-gray-800 leading-snug mb-2">
                      {week.theme}
                    </h3>
                    <span className="text-xs font-semibold text-primary font-body group-hover:underline">
                      View Recap →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/highlights"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              See All Highlights →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── WHO WE ARE ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-block bg-badge-bg px-5 py-2 rounded-full text-sm font-semibold text-text-gray font-body mb-4">
              Who We Are
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-gray font-heading">
              Rooted in Nature, Growing Together
            </h2>
            <p className="text-base text-gray-500 font-body mt-3 max-w-xl mx-auto">
              Sage Field is a nature-centered school where children learn by
              doing — outdoors, with their families beside them.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {PHILOSOPHY_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="bg-welcome-bg rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xl">{pillar.icon}</p>
                  <p className="text-sm font-bold text-text-gray font-heading">
                    {pillar.title}
                  </p>
                  <p className="text-xs text-gray-500 font-body leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RSVP PLACEHOLDER ── */}
      <section
        id="rsvp-section"
        className="py-20 px-8 sm:px-12 lg:px-16 bg-welcome-bg"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-8"
          >
            <span className="inline-block bg-sage-100 text-sage-800 px-5 py-2 rounded-full text-sm font-semibold font-body">
              You&apos;re Invited
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-gray">
              RSVP for Garden Day
            </h2>
            <p className="text-lg text-gray-500 font-body leading-relaxed">
              Sage Field families and visiting families are welcome. Reserve your
              spot for a beautiful evening together.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 rounded-xl bg-sage-700 text-white px-5 py-4 text-center font-body text-sm font-semibold shadow-md"
          >
            RSVP opens soon — save the date! The form below previews what
            we&apos;ll ask when registration is live.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: "📅", label: "Thursday, August 27" },
              { icon: "🕔", label: "5:30–7:00 PM" },
              { icon: "📍", label: "2760 Gattis School Rd" },
            ].map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-text-gray font-body shadow-sm"
              >
                <span>{pill.icon}</span>
                {pill.label}
              </span>
            ))}
          </motion.div>

          <div
            className="text-left space-y-5 bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-100"
            aria-disabled="true"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-gray font-body">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  disabled
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-gray font-body">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  disabled
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-gray font-body">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="(512) 555-0100"
                  disabled
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-gray font-body">
                  Child&apos;s Name
                </label>
                <input
                  type="text"
                  placeholder="Alex Smith"
                  disabled
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-gray font-body">
                  Child&apos;s Age
                </label>
                <input
                  type="number"
                  placeholder="4"
                  disabled
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-gray font-body">
                  Adults Attending
                </label>
                <input
                  type="text"
                  placeholder="2 adults"
                  disabled
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-gray font-body">
                Are you currently a Sage Field family?
              </label>
              <div className="flex flex-wrap gap-2">
                {["Yes", "No", "Interested in learning more"].map((opt) => (
                  <span
                    key={opt}
                    className="px-4 py-2 rounded-full bg-gray-100 text-sm font-body text-gray-500 border border-gray-200"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-gray font-body">
                Notes (Optional)
              </label>
              <textarea
                placeholder="What plant are you planning to bring? Any questions?"
                rows={3}
                disabled
                className={inputClass}
              />
            </div>

            <button
              type="button"
              disabled
              className="w-full bg-gray-300 text-gray-500 font-semibold px-8 py-4 rounded-xl text-base font-body cursor-not-allowed"
            >
              RSVP Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* ── SECONDARY CTAs ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-800">
              New to Sage Field?
            </h2>
            <p className="text-gray-500 font-body mt-2">
              We&apos;d love to welcome your family into our community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                emoji: "🗓️",
                title: "Schedule a Tour",
                desc: "See our campus and meet our team — free, no pressure.",
                href: "/tour",
                cta: "Book a Tour →",
              },
              {
                emoji: "📋",
                title: "Apply for Enrollment",
                desc: "Summer 2026 and School Year 2026–2027 are open.",
                href: "/apply",
                cta: "Start Application →",
              },
              {
                emoji: "📖",
                title: "Our Story",
                desc: "Learn who we are and what makes Sage Field special.",
                href: "/our-story",
                cta: "Read Our Story →",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={card.href}
                  className="block bg-welcome-bg rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 h-full"
                >
                  <span className="text-3xl">{card.emoji}</span>
                  <h3 className="text-lg font-bold font-heading text-gray-800 mt-3 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-body leading-relaxed mb-4">
                    {card.desc}
                  </p>
                  <span className="text-sm font-semibold text-primary font-body">
                    {card.cta}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className="text-sm font-semibold text-sage-700 font-body underline underline-offset-2 hover:text-primary transition-colors cursor-pointer"
            >
              Join our waitlist for future programs →
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Floating footer CTA — mobile only */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" as const }}
      >
        <div className="bg-sage-700 rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white font-heading font-bold text-sm leading-tight whitespace-nowrap">
              Community Garden Day
            </p>
            <p className="text-white/75 font-body text-xs">
              Reserve your spot today
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToRSVP}
            className="flex-shrink-0 bg-white text-sage-700 font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            RSVP Now →
          </button>
        </div>
      </motion.div>

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

      <WaitlistDialog
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
    </div>
  );
}
