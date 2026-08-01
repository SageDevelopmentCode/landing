"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from "framer-motion";
import {
  Star,
  ChevronDown,
  Instagram,
  Facebook,
  Sprout,
  Heart,
  Palette,
  TreePine,
  ArrowRight,
  Leaf,
} from "lucide-react";

// ─── Static Data ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "Ages 4–11", label: "All Elementary Ages" },
  { value: "12 Max", label: "Students Per Class" },
  { value: "3 Methods", label: "Montessori · Waldorf · Reggio" },
  { value: "5 Days", label: "Per Week Available" },
];

const PROGRAMS = [
  {
    badge: "Summer Program",
    title: "Summer Adventures",
    teaser: "12 weeks of outdoor projects & enrichment",
    desc: "Twelve weeks of themed adventures, hands-on projects, nature play, art, and academic enrichment in a small, nurturing group. Every day feels like a discovery.",
    details: ["Ages 4–11", "Mon–Thu", "12 Weeks", "Max 12 Kids"],
    image: "/assets/ImageFive.jpg",
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
  },
  {
    badge: "School Year",
    title: "Full School Year",
    teaser: "A complete microschool year, ability-paced",
    desc: "A full microschool year blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics. Individualized pacing. Genuine community.",
    details: ["Ages 4–11", "Mon–Fri", "6-Month Term", "Max 12 Kids"],
    image: "/assets/ImageTwo.jpg",
    accent: "text-sage-700",
    accentBg: "bg-sage-50",
  },
  {
    badge: "Homeschool",
    title: "Homeschool Drop-In",
    teaser: "1–5 flexible days for homeschool families",
    desc: "Flexible enrichment for families who want structure without losing autonomy. Choose 1 to 5 days — adjust as your family's rhythm evolves. All enrichments included.",
    details: ["Ages 4–11", "1–5 Days/Wk", "Flexible", "Max 12 Kids"],
    image: "/assets/Homeschool3.jpg",
    accent: "text-emerald-700",
    accentBg: "bg-emerald-50",
  },
];

const MARQUEE_ITEMS = [
  "Montessori",
  "Waldorf",
  "Reggio Emilia",
  "Outdoor Learning",
  "TEKS-Aligned",
  "Small Groups",
  "Nature Play",
  "Hands-On Art",
  "Emotional Regulation",
  "Mixed Ages",
  "Portfolio-Based",
  "Ability-Paced",
];

const TIMELINE = [
  {
    time: "8:30 AM",
    activity: "Morning Circle",
    desc: "Grounding songs, weather, setting intentions — the nervous system settles before learning begins.",
    image: "/assets/ImageEleven.jpg",
  },
  {
    time: "9:00 AM",
    activity: "Core Academics",
    desc: "Reading, writing, and math — at each child's exact ability level, not where their birthday says they should be.",
    image: "/assets/ImageTwo.jpg",
  },
  {
    time: "10:30 AM",
    activity: "Outdoor Exploration",
    desc: "Nature walks, gardening, science observation. The outdoors is a classroom, not a break from one.",
    image: "/assets/ImageFour.jpg",
  },
  {
    time: "12:00 PM",
    activity: "Lunch & Rest",
    desc: "Family-style eating, quiet reading, restorative downtime. Rest is part of the curriculum.",
    image: "/assets/Homeschool3.jpg",
  },
  {
    time: "1:00 PM",
    activity: "Creative Projects",
    desc: "Art, music, collaborative builds, maker-space. The afternoon belongs to curiosity and expression.",
    image: "/assets/ImageFive.jpg",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "My daughter was anxious about school until she found a place this small and warm. She asks to go on weekends now.",
    name: "Rachel M.",
    detail: "Parent of a 7-year-old",
    stars: 5,
    avatar: "/assets/ImageSix.jpg",
  },
  {
    quote:
      "The teachers actually know my son — not just his name, but his learning style, what frustrates him, what sparks him.",
    name: "David K.",
    detail: "Parent of a 9-year-old",
    stars: 5,
    avatar: "/assets/ImageSeven.jpg",
  },
  {
    quote:
      "We tried three schools before this one. Nothing compared to the calm, intentional pace of a true microschool.",
    name: "Priya S.",
    detail: "Parent of twin 6-year-olds",
    stars: 5,
    avatar: "/assets/ImageEight.jpg",
  },
];

const PILLARS = [
  {
    icon: Sprout,
    title: "Hands-On Learning",
    desc: "Experiential projects that connect academic skills to real-world discovery and wonder.",
  },
  {
    icon: Heart,
    title: "Emotional Safety",
    desc: "A regulated, relationship-first environment where every child feels seen and genuinely known.",
  },
  {
    icon: Palette,
    title: "Creative Expression",
    desc: "Daily art, music, and maker-space time that builds confidence and divergent thinking.",
  },
  {
    icon: TreePine,
    title: "Nature & Movement",
    desc: "Outdoor learning woven into every day — a core curriculum pillar, not a recess afterthought.",
  },
];

const FAQS = [
  {
    q: "What is a microschool?",
    a: "A microschool is a small, independent private school — typically under 15 students — that prioritizes personalized pacing, mixed-age groups, and innovative approaches to learning over traditional one-size-fits-all schooling.",
  },
  {
    q: "What ages and group sizes do you serve?",
    a: "We serve children ages 4–11. Classes are intentionally capped at 12 students so every child receives genuine attention, and educators can stay closely attuned to individual needs.",
  },
  {
    q: "What does a typical day look like?",
    a: "Mornings focus on individualized academics — reading, writing, and math at each child's ability level. Afternoons shift into nature exploration, art, music, movement, and social-emotional learning. The rhythm is calm, predictable, and alive with curiosity.",
  },
  {
    q: "Do you follow a standard curriculum?",
    a: "We draw from Montessori, Waldorf, and Reggio Emilia methods with broadly TEKS-aligned academics. Learning is comprehensive and structured — we are a school, not a childcare center.",
  },
  {
    q: "How do I get started?",
    a: "Fill out the interest form below. We'll reach out within 48 hours to schedule a private tour. Spots are limited each semester — early applications receive priority.",
  },
];

const STRIP_IMAGES = [
  "/assets/ImageEleven.jpg",
  "/assets/ImageTwelve.jpg",
  "/assets/ImageThirteen.jpg",
  "/assets/ImageFourteen.jpg",
  "/assets/ImageNine.jpg",
  "/assets/ImageTen.jpg",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineStep({
  step,
  index,
  isActive,
  onClick,
}: {
  step: (typeof TIMELINE)[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-30% 0px -50% 0px" });

  useEffect(() => {
    if (inView) onClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="flex gap-6 relative cursor-pointer group"
    >
      {index < TIMELINE.length - 1 && (
        <div className="absolute left-5 top-10 w-px h-full bg-gray-200 z-0" />
      )}
      <div
        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold font-body text-sm flex-shrink-0 shadow-sm transition-all duration-300 ${
          isActive
            ? "bg-sage-800 text-white scale-110"
            : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-sage-400 group-hover:text-sage-600"
        }`}
      >
        {index + 1}
      </div>
      <div className="pb-10">
        <p
          className={`text-xs font-body font-semibold uppercase tracking-widest mb-1 transition-colors duration-300 ${isActive ? "text-primary" : "text-gray-400"}`}
        >
          {step.time}
        </p>
        <h4
          className={`text-lg font-bold font-heading mb-1.5 transition-colors duration-300 ${isActive ? "text-sage-900" : "text-gray-500"}`}
        >
          {step.activity}
        </h4>
        <p
          className={`text-sm font-body leading-relaxed transition-all duration-300 ${isActive ? "text-text-gray max-h-24 opacity-100" : "text-transparent max-h-0 opacity-0 overflow-hidden"}`}
        >
          {step.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomeDemoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", program: "" });
  const [formSuccess, setFormSuccess] = useState(false);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [activeProgram, setActiveProgram] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Hero parallax
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(heroScroll, [0, 1], ["0%", "28%"]);
  const heroContentOpacity = useTransform(heroScroll, [0, 0.65], [1, 0]);

  // Full-bleed band parallax
  const bandRef = useRef(null);
  const { scrollYProgress: bandScroll } = useScroll({
    target: bandRef,
    offset: ["start end", "end start"],
  });
  const bandImgY = useTransform(bandScroll, [0, 1], ["-12%", "12%"]);

  // Stats in-view
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(true);
  };

  return (
    <div className="overflow-x-hidden bg-white">
      {/* ─── 1. HERO — Parallax photo, Z-pattern ──────────────────────────── */}
      <section
        ref={heroRef}
        className="relative h-screen overflow-hidden"
      >
        {/* Parallax image layer */}
        <motion.div
          style={{ y: heroImgY }}
          className="absolute inset-0 scale-[1.15]"
        >
          <Image
            src="/assets/ImageOne.jpg"
            fill
            className="object-cover"
            alt="Children learning outdoors"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75" />
        </motion.div>

        {/* Floating photo card — top right */}
        <motion.div
          className="absolute top-24 right-6 md:right-16 w-40 md:w-52 h-52 md:h-72 rounded-2xl overflow-hidden shadow-2xl hidden sm:block"
          style={{ rotate: 3 }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" as const }}
        >
          <Image
            src="/assets/Homeschool2.jpg"
            fill
            className="object-cover"
            alt=""
          />
          <div className="absolute inset-0 ring-1 ring-white/20 rounded-2xl" />
        </motion.div>

        {/* Second floating card */}
        <motion.div
          className="absolute top-52 right-40 md:right-64 w-28 md:w-36 h-36 md:h-44 rounded-xl overflow-hidden shadow-xl hidden md:block"
          style={{ rotate: -2 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4, duration: 0.7, ease: "easeOut" as const }}
        >
          <Image
            src="/assets/ImageThree.jpg"
            fill
            className="object-cover"
            alt=""
          />
        </motion.div>

        {/* Navbar */}
        <div className="relative z-20 flex items-center justify-between px-8 sm:px-12 pt-7">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="text-white font-heading font-bold text-lg tracking-tight">
              Greenbrook Academy
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Programs", "Philosophy", "Team", "FAQ"].map((item) => (
              <button
                key={item}
                className="text-white/65 hover:text-white font-body text-sm font-semibold transition-colors duration-200 cursor-pointer"
              >
                {item}
              </button>
            ))}
          </nav>
          <button className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg font-body transition-all duration-200 shadow-lg cursor-pointer">
            Enroll Now
          </button>
        </div>

        {/* Hero text — bottom-left (Z diagonal eye flow) */}
        <motion.div
          style={{ opacity: heroContentOpacity }}
          className="absolute bottom-0 left-0 z-10 px-8 sm:px-14 pb-20 max-w-2xl"
        >
          <motion.span
            className="inline-block px-5 py-2 bg-white/15 backdrop-blur-sm text-white text-sm font-semibold rounded-full font-body mb-6 border border-white/25"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" as const }}
          >
            Now Enrolling — Fall 2026
          </motion.span>

          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white font-heading leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.85, ease: "easeOut" as const }}
          >
            Where Children
            <br />
            <span className="text-primary">Grow Wise.</span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-white/70 font-body leading-relaxed mb-9 max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7, ease: "easeOut" as const }}
          >
            A small, outdoor-focused private microschool for ages 4–11. Up to
            12 students. Montessori, Waldorf, and Reggio Emilia — woven together.
          </motion.p>

          <motion.div
            className="flex items-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" as const }}
          >
            <button className="px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg font-body transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer">
              Apply for a Spot
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg font-body transition-all duration-200 border border-white/25 backdrop-blur-sm cursor-pointer">
              See Our Programs
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.7 }}
        >
          <span className="text-white/40 font-body text-xs uppercase tracking-widest">
            scroll
          </span>
          <ChevronDown className="w-5 h-5 text-white/40" />
        </motion.div>
      </section>

      {/* ─── 2. STAT BAND — Animated reveal ───────────────────────────────── */}
      <section ref={statsRef} className="bg-sage-50 border-b border-sage-100 py-12 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.value}
              className="text-center px-4 md:px-8 border-r border-sage-200 last:border-0 py-4"
              initial={{ opacity: 0, y: 18 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" as const }}
            >
              <p className="text-2xl md:text-3xl font-bold text-sage-900 font-heading mb-1.5">
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-sage-500 font-body uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── 3. WELCOME — F-pattern, real photos with depth ───────────────── */}
      <section className="bg-white py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left 5/12 */}
          <motion.div
            className="w-full lg:w-5/12"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body mb-7 uppercase tracking-wider">
              Our Mission
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading mb-5 leading-tight">
              Learning that
              <br />
              <em className="text-primary not-italic">feels like living.</em>
            </h2>
            <p className="text-base text-gray-600 leading-relaxed font-body mb-5">
              We believe children thrive when they&apos;re trusted, known, and given
              room to wonder. Greenbrook Academy is built on the idea that the
              best education doesn&apos;t separate curiosity from content — it weaves
              them together.
            </p>
            <p className="text-base text-gray-600 leading-relaxed font-body mb-8">
              Every child here is more than a grade level. They&apos;re a whole
              person with a unique rhythm — and our role is to meet them exactly
              where they are.
            </p>
            <div className="p-6 bg-sage-50 rounded-2xl border-l-4 border-sage-400">
              <p className="text-sm font-medium text-sage-800 font-body leading-relaxed">
                &ldquo;Wisdom is knowledge transformed by experience — and that
                transformation is what we&apos;re here to nurture.&rdquo;
              </p>
              <p className="text-xs text-sage-400 font-body mt-3 uppercase tracking-wider">
                — School Founder
              </p>
            </div>
          </motion.div>

          {/* Right 7/12 — stacked photos with depth */}
          <motion.div
            className="w-full lg:w-7/12 relative overflow-hidden lg:overflow-visible"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" as const }}
          >
            {/* Main photo */}
            <div className="relative h-[460px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/assets/ImageThree.jpg"
                fill
                className="object-cover"
                alt="Children exploring outdoors"
              />
            </div>

            {/* Overlapping photo — bottom-left, rotated */}
            <motion.div
              className="absolute -bottom-8 -left-6 w-44 h-52 rounded-2xl overflow-hidden shadow-xl border-4 border-white z-10"
              style={{ rotate: -4 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" as const }}
            >
              <Image
                src="/assets/ImageFour.jpg"
                fill
                className="object-cover"
                alt="Students learning"
              />
            </motion.div>

            {/* Stat pill — top right */}
            <div className="absolute top-7 right-7 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg z-10">
              <p className="text-2xl font-bold text-sage-900 font-heading leading-none">
                98%
              </p>
              <p className="text-xs text-sage-500 font-body font-semibold uppercase tracking-wider mt-1">
                Parent Satisfaction
              </p>
            </div>

            {/* Bottom badge pill */}
            <div className="absolute bottom-5 right-6 bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3.5 shadow-lg z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-4 h-4 text-sage-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-sage-900 font-heading leading-none">
                  12 students max
                </p>
                <p className="text-xs text-sage-400 font-body mt-0.5">
                  Always. No exceptions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 4. MARQUEE — Kinetic strip ────────────────────────────────────── */}
      <section className="bg-sage-100 py-4 overflow-hidden border-y border-sage-200">
        <style>{`
          @keyframes marquee-demo {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: "marquee-demo 38s linear infinite",
            animationPlayState: marqueePaused ? "paused" : "running",
          }}
          onMouseEnter={() => setMarqueePaused(true)}
          onMouseLeave={() => setMarqueePaused(false)}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 mx-7 text-sage-700 font-semibold font-body text-sm uppercase tracking-wider"
            >
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-sage-300 flex-shrink-0" />
            </span>
          ))}
        </div>
      </section>

      {/* ─── 5. PROGRAMS — Interactive tab switcher ────────────────────────── */}
      <section className="bg-white py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body mb-5 uppercase tracking-wider">
              What We Offer
            </span>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading leading-tight">
                A program for every family
              </h2>
              <p className="text-gray-500 font-body text-base max-w-sm md:text-right">
                Click each program to explore what a semester looks like.
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Tab list — left */}
            <div className="w-full lg:w-[340px] flex flex-col sm:grid sm:grid-cols-3 lg:flex lg:flex-col gap-3 flex-shrink-0">
              {PROGRAMS.map((p, i) => (
                <button
                  key={p.title}
                  onClick={() => setActiveProgram(i)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-250 cursor-pointer ${
                    activeProgram === i
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider font-body block mb-2 ${activeProgram === i ? "text-primary" : "text-gray-400"}`}
                  >
                    {p.badge}
                  </span>
                  <p className="text-base font-bold text-gray-900 font-heading leading-tight mb-1">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-500 font-body">{p.teaser}</p>
                </button>
              ))}
            </div>

            {/* Active panel — right */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProgram}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                >
                  {/* Photo */}
                  <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-7 shadow-lg">
                    <Image
                      src={PROGRAMS[activeProgram].image}
                      fill
                      className="object-cover"
                      alt={PROGRAMS[activeProgram].title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span
                      className={`absolute top-5 left-5 px-4 py-1.5 text-xs font-bold rounded-full font-body ${PROGRAMS[activeProgram].accentBg} ${PROGRAMS[activeProgram].accent}`}
                    >
                      {PROGRAMS[activeProgram].badge}
                    </span>
                  </div>

                  {/* Details */}
                  <h3 className="text-3xl font-bold text-gray-900 font-heading mb-4">
                    {PROGRAMS[activeProgram].title}
                  </h3>
                  <p className="text-base text-gray-600 font-body leading-relaxed mb-6">
                    {PROGRAMS[activeProgram].desc}
                  </p>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2 mb-7">
                    {PROGRAMS[activeProgram].details.map((d) => (
                      <span
                        key={d}
                        className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold font-body"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <button className="px-8 py-3.5 bg-sage-900 hover:bg-sage-800 text-white rounded-xl font-semibold font-body transition-colors duration-200 flex items-center gap-2 cursor-pointer">
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. PHOTO MOSAIC — Visual storytelling, no text ───────────────── */}
      <section className="bg-white px-4 pb-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-3 h-[280px] sm:h-[340px] md:h-[480px]">
          <motion.div
            className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
          >
            <Image
              src="/assets/ImageSix.jpg"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              alt="School life"
            />
          </motion.div>
          <motion.div
            className="col-span-1 md:col-span-2 row-span-1 relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" as const }}
          >
            <Image
              src="/assets/ImageSeven.jpg"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              alt="Children learning"
            />
          </motion.div>
          <motion.div
            className="col-span-1 md:col-span-2 row-span-1 relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" as const }}
          >
            <Image
              src="/assets/ImageEight.jpg"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              alt="Outdoor activities"
            />
          </motion.div>
        </div>
      </section>

      {/* ─── 7. PHILOSOPHY QUOTE — Photo backdrop, editorial feel ─────────── */}
      <section className="relative py-28 px-8 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/ImageNine.jpg"
            fill
            className="object-cover"
            alt=""
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" as const }}
          >
            <span className="block text-7xl md:text-8xl text-primary/25 font-heading leading-none mb-2 select-none">
              &ldquo;
            </span>
            <blockquote className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 leading-tight italic mb-10">
              The child is not a vessel to be filled,
              <br />
              but a fire to be kindled.
            </blockquote>
            <p className="text-sm text-gray-400 font-body uppercase tracking-widest mb-8">
              François Rabelais · Our guiding belief
            </p>
            <div className="mx-auto w-20 h-1 bg-primary rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ─── 8. HORIZONTAL PHOTO STRIP — Auto-scrolling film strip ───────── */}
      <section className="bg-sage-50 py-10 overflow-hidden border-t border-sage-100">
        <style>{`
          @keyframes strip-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div
          className="flex gap-4 items-center"
          style={{
            animation: "strip-scroll 22s linear infinite",
            width: "max-content",
          }}
        >
          {[...STRIP_IMAGES, ...STRIP_IMAGES].map((src, i) => (
            <motion.div
              key={i}
              className="relative w-48 sm:w-64 h-36 sm:h-44 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src={src}
                fill
                className="object-cover"
                alt=""
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── 9. DAY IN LIFE — Interactive timeline, photo switches ────────── */}
      <section className="bg-white py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
          {/* Left 7/12 — Timeline */}
          <div className="w-full lg:w-7/12">
            <motion.span
              className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body mb-7 uppercase tracking-wider"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" as const }}
            >
              A Day at Greenbrook
            </motion.span>

            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900 font-heading mb-10 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
            >
              Calm. Structured.
              <br />
              <span className="text-sage-500">Alive with curiosity.</span>
            </motion.h2>

            <div className="relative">
              {TIMELINE.map((step, i) => (
                <TimelineStep
                  key={step.time}
                  step={step}
                  index={i}
                  isActive={activeStep === i}
                  onClick={() => setActiveStep(i)}
                />
              ))}
            </div>
          </div>

          {/* Right 5/12 — Sticky photo that changes with active step */}
          <div className="w-full lg:w-5/12 lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: "easeOut" as const }}
                className="relative h-[280px] sm:h-[420px] md:h-[520px] rounded-3xl overflow-hidden shadow-2xl"
              >
                <Image
                  src={TIMELINE[activeStep].image}
                  fill
                  className="object-cover"
                  alt={TIMELINE[activeStep].activity}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="text-primary font-body text-xs font-semibold uppercase tracking-widest mb-1.5">
                    {TIMELINE[activeStep].time}
                  </p>
                  <p className="text-white font-heading font-bold text-xl">
                    {TIMELINE[activeStep].activity}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Step dots */}
            <div className="flex justify-center gap-2 mt-5">
              {TIMELINE.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    activeStep === i
                      ? "w-6 h-2 bg-sage-800"
                      : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. TESTIMONIALS — 3-col with real photo avatars ─────────────── */}
      <section className="bg-sage-50 py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body mb-5 uppercase tracking-wider">
              Parent Stories
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading mb-4">
              Families who found their fit
            </h2>
            <p className="text-gray-500 font-body text-lg max-w-lg mx-auto">
              From anxious starters to thriving explorers — one semester changed everything.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" as const }}
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-base text-gray-700 font-body leading-relaxed italic mb-7 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-sage-100">
                    <Image
                      src={t.avatar}
                      fill
                      className="object-cover"
                      alt=""
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 font-heading">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400 font-body">{t.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 11. TEACHING TEAM — Real photo, Split 5/7 ────────────────────── */}
      <section className="bg-white py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          {/* Left 5/12 — Real photo with overlays */}
          <motion.div
            className="w-full lg:w-5/12"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
          >
            <div className="relative h-[380px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/assets/ImageTen.jpg"
                fill
                className="object-cover"
                alt="Lead Teacher"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              {/* Credential badge */}
              <div className="absolute top-7 right-7 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs text-gray-400 font-body font-semibold uppercase tracking-wider">
                  Certified
                </p>
                <p className="text-sm font-bold text-gray-900 font-heading mt-0.5">
                  Montessori AMI
                </p>
              </div>
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 pt-16">
                <p className="text-white font-heading font-bold text-xl">
                  Sarah Chen
                </p>
                <p className="text-white/60 font-body text-sm mt-1">
                  Lead Teacher & School Director
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right 7/12 */}
          <motion.div
            className="w-full lg:w-7/12 space-y-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body uppercase tracking-wider">
              Meet the Team
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading leading-tight">
              Teachers who actually
              <br />
              <em className="text-primary not-italic">know your child.</em>
            </h2>
            <p className="text-base text-gray-600 leading-relaxed font-body">
              Sarah holds an AMI Montessori certification and has spent 11 years
              in mixed-age classrooms. She founded Greenbrook after watching
              bright children wilt under the pressure of traditional schooling.
            </p>
            <p className="text-base text-gray-600 leading-relaxed font-body">
              Our teacher-to-student ratio never exceeds 1:6. Every adult in
              the building knows every child — their interests, their
              frustrations, their spark.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                "AMI Montessori Certified",
                "Waldorf Foundation Training",
                "Trauma-Informed Care",
                "11 Years Experience",
              ].map((cred) => (
                <span
                  key={cred}
                  className="bg-sage-50 text-sage-700 px-4 py-2 rounded-full text-sm font-semibold font-body border border-sage-100"
                >
                  {cred}
                </span>
              ))}
            </div>
            <div className="bg-primary/8 rounded-2xl border-l-4 border-primary p-6">
              <p className="text-sm text-gray-700 font-body leading-relaxed">
                &ldquo;I don&apos;t teach subjects. I teach children. The
                subjects are just the vehicle.&rdquo;
              </p>
              <p className="text-xs text-gray-400 font-body mt-2 uppercase tracking-wider">
                — Sarah Chen, Director
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 12. FULL-BLEED PARALLAX BAND — Cinematic ─────────────────────── */}
      <section
        ref={bandRef}
        className="relative min-h-[75vh] flex items-center justify-center overflow-hidden"
      >
        <motion.div
          style={{ y: bandImgY }}
          className="absolute inset-0 scale-[1.15]"
        >
          <Image
            src="/assets/ImageNine.jpg"
            fill
            className="object-cover"
            alt=""
          />
          <div className="absolute inset-0 bg-sage-900/75" />
        </motion.div>

        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto px-8"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
        >
          <p className="text-primary/80 font-semibold text-xs uppercase tracking-widest font-body mb-7">
            Our Vision
          </p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-8">
            Where Children Grow
            <br />
            Into Their Wisest Selves
          </h2>
          <p className="text-lg text-white/55 font-body max-w-2xl mx-auto mb-12 leading-relaxed">
            Every child arrives as a seed of endless possibility. We are the
            field — the safe, nourishing ground where they root, reach, and bloom.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl font-body transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer">
              Schedule a Tour
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/18 text-white font-semibold rounded-xl font-body transition-all duration-200 border border-white/25 cursor-pointer">
              Read Our Philosophy
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── 13. CURRICULUM PILLARS — 2×2 grid ────────────────────────────── */}
      <section className="bg-sage-50 py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body mb-5 uppercase tracking-wider">
              Our Curriculum
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading mb-4">
              Four pillars. One whole child.
            </h2>
            <p className="text-gray-500 font-body text-lg max-w-xl mx-auto">
              We take what works best from each method — and weave it into a
              coherent, joyful day.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 group cursor-default"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" as const }}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.07)" }}
              >
                <div className="w-12 h-12 rounded-xl bg-sage-100 group-hover:bg-sage-200 transition-colors flex items-center justify-center mb-6">
                  <pillar.icon className="w-6 h-6 text-sage-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-heading mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-gray-500 font-body leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 14. ENROLLMENT — Split: photo quote + form ────────────────────── */}
      <section className="bg-sage-900 py-0 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
          {/* Left — photo with quote overlay */}
          <motion.div
            className="hidden lg:block lg:w-1/2 relative min-h-[640px]"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
          >
            <Image
              src="/assets/ImageThree.jpg"
              fill
              className="object-cover"
              alt=""
            />
            <div className="absolute inset-0 bg-sage-900/60" />
            <div className="absolute inset-0 flex items-center justify-center p-14">
              <div className="text-center">
                <span className="block text-5xl text-primary/40 font-heading mb-4 select-none">
                  &ldquo;
                </span>
                <p className="text-white text-2xl md:text-3xl font-heading font-bold leading-snug italic">
                  Every child deserves to be known — not just numbered.
                </p>
                <div className="w-12 h-0.5 bg-primary/50 mx-auto mt-6" />
              </div>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            className="w-full lg:w-1/2 px-8 sm:px-12 py-20 flex flex-col justify-center"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-primary/20 text-primary text-xs font-semibold rounded-full font-body mb-7 uppercase tracking-wider self-start">
              Enrollment Open
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-heading mb-4 leading-tight">
              Claim your child&apos;s spot.
            </h2>
            <p className="text-white/55 font-body text-base mb-10 leading-relaxed">
              We keep classes at 12 students maximum. Fill out the form — we
              respond within 48 hours to schedule your private tour.
            </p>

            <AnimatePresence mode="wait">
              {formSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-10"
                >
                  <div className="text-5xl mb-5">🌱</div>
                  <p className="text-white text-2xl font-heading font-bold mb-3">
                    We&apos;ll be in touch!
                  </p>
                  <p className="text-white/50 font-body">
                    Expect a reply within 48 hours to schedule your tour.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                  onSubmit={handleSubmit}
                >
                  <input
                    type="text"
                    placeholder="Parent / Guardian Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                    className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/30 font-body focus:outline-none focus:border-primary transition-colors duration-200 text-base"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                    className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/30 font-body focus:outline-none focus:border-primary transition-colors duration-200 text-base"
                  />
                  <select
                    value={formData.program}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, program: e.target.value }))
                    }
                    required
                    className="w-full px-5 py-4 rounded-xl bg-sage-800 border border-white/15 text-white font-body focus:outline-none focus:border-primary transition-colors duration-200 appearance-none cursor-pointer text-base"
                  >
                    <option value="" disabled>
                      Select a program...
                    </option>
                    <option value="summer">Summer Program</option>
                    <option value="school-year">School Year 2026–2027</option>
                    <option value="homeschool">Homeschool Drop-In</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl font-body transition-all duration-200 shadow-xl hover:shadow-2xl text-base cursor-pointer mt-2"
                  >
                    Submit Interest Form
                  </button>
                  <p className="text-center text-white/25 font-body text-xs pt-1">
                    No commitment. We&apos;ll reach out within 48 hours.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ─── 15. FAQ — F-pattern, left-aligned ────────────────────────────── */}
      <section className="bg-white py-24 px-8 sm:px-12 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-xs font-semibold rounded-full font-body mb-5 uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading mb-4">
              Questions parents ask
            </h2>
            <p className="text-gray-500 font-body text-lg max-w-lg">
              Considering microschool for the first time? These are the most
              common things families want to know.
            </p>
          </motion.div>

          <div>
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                className="border-b border-gray-100 last:border-0"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" as const }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full flex items-center justify-between py-6 text-left group cursor-pointer transition-colors duration-200 ${
                    openFaq === i ? "text-sage-800" : "text-gray-700 hover:text-sage-700"
                  }`}
                >
                  <span className="text-base md:text-lg font-semibold font-heading pr-6">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`text-2xl font-light flex-shrink-0 w-7 text-center leading-none transition-colors ${
                      openFaq === i ? "text-primary" : "text-gray-300"
                    }`}
                  >
                    +
                  </motion.span>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" as const }}
                      className="overflow-hidden"
                    >
                      <p className="pb-7 text-gray-500 font-body text-base leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 16. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-sage-900 text-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-primary" />
              <span className="font-heading font-bold text-xl tracking-tight">
                Greenbrook Academy
              </span>
            </div>
            <p className="text-white/35 font-body text-sm">
              A microschool for curious, growing minds.
            </p>
          </div>

          <div className="w-14 h-px bg-white/10 mx-auto mb-8" />

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8">
            {["Programs", "Our Philosophy", "The Team", "FAQ", "Enroll"].map(
              (link) => (
                <button
                  key={link}
                  className="text-white/40 hover:text-white font-body text-sm transition-colors duration-200 cursor-pointer"
                >
                  {link}
                </button>
              )
            )}
          </div>

          <div className="flex justify-center gap-5 mb-10">
            <button className="text-white/30 hover:text-white transition-colors duration-200 cursor-pointer">
              <Instagram className="w-5 h-5" />
            </button>
            <button className="text-white/30 hover:text-white transition-colors duration-200 cursor-pointer">
              <Facebook className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-white/20 font-body text-xs">
            © 2026 Greenbrook Academy Demo &nbsp;·&nbsp; Template by Your Company Name
          </p>
        </div>
      </footer>
    </div>
  );
}
