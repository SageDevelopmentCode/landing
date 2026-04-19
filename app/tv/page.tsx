"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Data ────────────────────────────────────────────────────────────────────

const summerDetails = [
  { label: "Dates", value: "May 26 – Aug 13, 2026" },
  { label: "Ages", value: "4–11 years" },
  { label: "Schedule", value: "Mon–Thu, ~6 hrs/day" },
  { label: "Group Size", value: "10 children" },
];

const summerWeeks = [
  { week: 1, dates: "May 26–29", theme: "Welcome to Camp" },
  { week: 2, dates: "Jun 1–4", theme: "Mystery Camp Escape Challenge" },
  { week: 3, dates: "Jun 8–11", theme: "Beach Day Bash" },
  { week: 4, dates: "Jun 15–18", theme: "Scientist & Space Engineering Lab" },
  { week: 5, dates: "Jun 22–25", theme: "Safari Escape" },
  { week: 6, dates: "Jun 29–Jul 2", theme: "Splash Into Summer" },
  { week: 7, dates: "Jul 6–9", theme: "Dino Hunt" },
  { week: 8, dates: "Jul 13–16", theme: "Pirate Adventure" },
  { week: 9, dates: "Jul 20–23", theme: "You are a Superhero!" },
  { week: 10, dates: "Jul 27–30", theme: "Space Explorers: Mission to the Stars" },
  { week: 11, dates: "Aug 3–6", theme: "Down on the Farm" },
  { week: 12, dates: "Aug 10–13", theme: "Finale of Camp" },
];

const schoolYearDetails = [
  { label: "Start Date", value: "August 17, 2026" },
  { label: "Ages", value: "4–11 years" },
  { label: "Schedule", value: "Up to 4 days/week" },
  { label: "Term", value: "6-month commitment" },
];

const schoolYearPillars = [
  { icon: "🌱", title: "Hands-on Learning", description: "Experiential activities that engage curiosity" },
  { icon: "🧘", title: "Emotional Regulation", description: "Mindfulness practices for students & educators" },
  { icon: "🎨", title: "Creative Expression", description: "Artistic and musical creativity flourish" },
  { icon: "🌳", title: "Movement & Nature", description: "Movement-based and outdoor education" },
];

const homeschoolTiers = [
  { days: "1x/week", title: "Light Touch", description: "A taste of microschool enrichment without disrupting your home rhythm." },
  { days: "2x/week", title: "Balanced Rhythm", description: "Two structured days create a consistent routine with plenty of flexibility." },
  { days: "3x/week", title: "Regular Learner", description: "Deep engagement with academics, enrichments, and peer connection each week." },
  { days: "4x/week", title: "Deep Immersion", description: "Near-full-week immersion with the freedom of homeschooling still intact." },
  { days: "5x/week", title: "Full Experience", description: "The complete Sage Field experience — every day, every enrichment." },
];

const homeschoolPillars = [
  { icon: "🎯", title: "Ability-Based Learning", description: "We group by ability and interest, not grade." },
  { icon: "👥", title: "Tiny Class Sizes", description: "~10 kids per class — real attention and genuine community." },
  { icon: "🌱", title: "Interest-Led Academics", description: "Curiosity drives the curriculum." },
  { icon: "🤝", title: "Real Socialization", description: "Mixed-age groups build authentic friendships." },
];

const teamMembers = [
  { name: "Sabrina Grace Obnamia", role: "Lead Teacher & Director", image: "/assets/Headshot.jpeg", objectPosition: "center 20%" },
  { name: "Paige Wood", role: "Primary Lead Teacher", image: "/assets/team/Paige.webp", objectPosition: "center 25%" },
  { name: "Zelinda Melo", role: "Teacher Aide", image: "/assets/team/Zelinda.webp", objectPosition: "center 25%" },
  { name: "Julius Cecilia", role: "Director of Operations & Technology", image: "/assets/team/JuliusC.jpg", objectPosition: "center 20%" },
];

const INTERVAL_MS = 18000;
const TOTAL_SLIDES = 6;

const enrollSteps = [
  { num: "1", icon: "📋", title: "Fill Out the Application", detail: "Visit sagefield.co/apply and complete the short application form." },
  { num: "2", icon: "💬", title: "Mutual-Fit Conversation", detail: "We'll reach out to schedule a quick call to make sure Sage Field is the right fit for your family." },
  { num: "3", icon: "✅", title: "Receive Your Offer", detail: "If it's a great match, you'll receive an enrollment offer with next steps." },
  { num: "4", icon: "🎉", title: "Confirm & Enroll", detail: "Submit your enrollment fee to secure your child's spot. Welcome to Sage Field!" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function QRCode({ url, label }: { url: string; label: string }) {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={apiUrl} alt={`QR code for ${label}`} width={220} height={220} className="rounded-lg" />
      </div>
      <p className="text-base font-semibold text-gray-500 font-body text-center">{label}</p>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1 font-body">{label}</p>
      <p className="text-xl font-bold text-gray-800 font-body">{value}</p>
    </div>
  );
}

// ── Slides ───────────────────────────────────────────────────────────────────

function Slide1Summer() {
  return (
    <div className="flex h-full gap-10">
      {/* Left */}
      <div className="flex-1 flex flex-col justify-center gap-10">
        <div>
          <span className="inline-block px-5 py-2 bg-badge-bg text-black text-base font-semibold rounded-full mb-5 font-body">
            Now Enrolling
          </span>
          <h1 className="text-8xl font-bold text-gray-800 font-heading leading-tight mb-5">
            Summer 2026
          </h1>
          <p className="text-3xl text-gray-500 font-body">
            May 26 – August 13, 2026 · 12 Weeks · Mon–Thu
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {summerDetails.map((d) => (
            <DetailCard key={d.label} label={d.label} value={d.value} />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {["Outdoor Adventures", "Daily Water Play", "Art & Music", "Nature Exploration", "Academic Enrichment", "Field Day Fridays"].map((tag) => (
            <span key={tag} className="px-5 py-2 bg-primary/10 text-primary font-semibold rounded-full font-body text-lg">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="w-72 flex flex-col items-center justify-center gap-5 shrink-0">
        <QRCode url="https://sagefield.co/apply" label="sagefield.co/apply" />
        <p className="text-xl font-bold text-primary font-heading text-center">Apply Now</p>
        <p className="text-base text-gray-400 font-body text-center">Spots are limited</p>
      </div>
    </div>
  );
}

function Slide2SchoolYear() {
  return (
    <div className="flex h-full gap-10">
      {/* Left */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        <div>
          <h1 className="text-7xl font-bold text-gray-800 font-heading leading-tight mb-4">
            School Year 2026–2027
          </h1>
          <p className="text-3xl text-gray-500 font-body">
            August 2026 – May 2027 · Ages 4–11 · Up to 4 Days/Week
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {schoolYearDetails.map((d) => (
            <DetailCard key={d.label} label={d.label} value={d.value} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {schoolYearPillars.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-center">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-3xl">{p.icon}</span>
              </div>
              <p className="text-xl font-semibold text-gray-800 font-heading">{p.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="w-64 flex flex-col items-center justify-center gap-6 shrink-0">
        <div className="rounded-2xl overflow-hidden shadow-md w-full" style={{ height: "40%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/After1.png" alt="School year program" className="w-full h-full object-cover" />
        </div>
        <QRCode url="https://sagefield.co/apply" label="sagefield.co/apply" />
        <p className="text-xl font-bold text-primary font-heading text-center">Apply Now</p>
      </div>
    </div>
  );
}

function Slide3Homeschool() {
  return (
    <div className="flex flex-col h-full justify-center gap-10">
      <div>
        <h1 className="text-7xl font-bold text-gray-800 font-heading leading-tight mb-4">
          Homeschool Drop-In
        </h1>
        <p className="text-3xl text-gray-500 font-body">
          1–5 Days/Week · Ages 4–11 · Fridays Are Field Days
        </p>
      </div>

      {/* Schedule tiers */}
      <div>
        <p className="text-xl font-semibold text-gray-400 mb-4 font-body uppercase tracking-wide">Choose Your Schedule</p>
        <div className="grid grid-cols-5 gap-4">
          {homeschoolTiers.map((t) => (
            <div key={t.days} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
              <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-base font-bold text-primary font-body self-start">
                {t.days}
              </span>
              <p className="text-xl font-semibold text-gray-800 font-heading">{t.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why pillars — icon + title only */}
      <div>
        <p className="text-xl font-semibold text-gray-400 mb-4 font-body uppercase tracking-wide">Why Sage Field?</p>
        <div className="grid grid-cols-4 gap-4">
          {homeschoolPillars.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-3xl">{p.icon}</span>
              </div>
              <p className="text-xl font-semibold text-gray-800 font-heading">{p.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide4Tuition() {
  return (
    <div className="flex h-full gap-10">
      {/* Left: pricing */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        <h1 className="text-7xl font-bold text-gray-800 font-heading leading-tight">
          Tuition &amp; Pricing
        </h1>

        {/* Summer */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-full font-body mb-4">
            ☀️ Summer 2026
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FFF9F5] rounded-xl p-4">
              <p className="text-base text-gray-500 font-body mb-1">Weekly · 2nd–4th</p>
              <p className="text-4xl font-bold text-primary font-heading">$350<span className="text-xl text-gray-400 font-normal">/wk</span></p>
              <p className="text-base text-gray-500 font-body mt-2">Primary</p>
              <p className="text-4xl font-bold text-primary font-heading">$375<span className="text-xl text-gray-400 font-normal">/wk</span></p>
            </div>
            <div className="bg-primary rounded-xl p-4 relative">
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-white text-primary text-sm font-bold rounded-full">Save 10%</span>
              <p className="text-base text-white/70 font-body mb-1">Full Summer · 2nd–4th</p>
              <p className="text-4xl font-bold text-white font-heading">$3,780</p>
              <p className="text-base text-white/70 font-body mt-2">Primary</p>
              <p className="text-4xl font-bold text-white font-heading">$4,050</p>
            </div>
          </div>
        </div>

        {/* School Year */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <span className="inline-block px-4 py-1.5 bg-lavender/40 text-purple-700 text-base font-semibold rounded-full font-body mb-4">
            📚 School Year 2026–2027
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FFF9F5] rounded-xl p-4">
              <p className="text-base text-gray-500 font-body mb-1">2nd–4th Grade</p>
              <p className="text-4xl font-bold text-primary font-heading">$1,095<span className="text-xl text-gray-400 font-normal">/mo</span></p>
            </div>
            <div className="bg-[#FFF9F5] rounded-xl p-4">
              <p className="text-base text-gray-500 font-body mb-1">Primary (Pre-K–1st)</p>
              <p className="text-4xl font-bold text-primary font-heading">$1,195<span className="text-xl text-gray-400 font-normal">/mo</span></p>
            </div>
          </div>
        </div>

        {/* Add-ons row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-3xl">🕒</span>
            <div>
              <p className="text-lg font-bold text-gray-800 font-heading">After Care</p>
              <p className="text-base text-primary font-semibold font-body">$35/day · $375/mo</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="text-lg font-bold text-gray-800 font-heading">Field Day Friday</p>
              <p className="text-base text-primary font-semibold font-body">$200/mo · $60 drop-in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: QR */}
      <div className="w-64 flex flex-col items-center justify-center gap-4 shrink-0">
        <QRCode url="https://sagefield.co/tuition" label="sagefield.co/tuition" />
        <p className="text-xl font-bold text-primary font-heading text-center">Full Pricing</p>
      </div>
    </div>
  );
}

function Slide5Team() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-7xl font-bold text-gray-800 font-heading leading-tight">
          Meet the Team
        </h1>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-5 flex-1 min-h-0">
        {teamMembers.map((member) => (
          <div key={member.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex gap-0 min-h-0">
            {/* Photo — fixed width, full height */}
            <div className="w-2/5 shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: member.objectPosition }}
              />
            </div>
            {/* Info */}
            <div className="flex-1 flex flex-col justify-center px-6 py-5">
              <p className="text-3xl font-bold text-gray-800 font-heading leading-tight">{member.name}</p>
              <span className="inline-block mt-3 px-4 py-2 bg-primary/10 text-primary text-lg font-semibold rounded-full font-body self-start">
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide6Apply() {
  return (
    <div className="flex h-full gap-10">
      {/* Left */}
      <div className="flex-1 flex flex-col justify-center gap-10">
        <div>
          <span className="inline-block px-5 py-2 bg-badge-bg text-black text-base font-semibold rounded-full mb-5 font-body">
            Enrollment Open
          </span>
          <h1 className="text-8xl font-bold text-gray-800 font-heading leading-tight mb-4">
            How to Enroll
          </h1>
          <p className="text-3xl text-gray-500 font-body">
            Four simple steps to join Sage Field
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {enrollSteps.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-5 items-start">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-3xl font-bold text-white font-heading">{step.num}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 font-heading mb-2">{step.title}</p>
                <p className="text-lg text-gray-500 font-body leading-snug">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="w-72 flex flex-col items-center justify-center gap-5 shrink-0">
        <QRCode url="https://sagefield.co/apply" label="sagefield.co/apply" />
        <p className="text-2xl font-bold text-primary font-heading text-center">Apply Today</p>
        <p className="text-lg text-gray-400 font-body text-center">Spots are limited</p>
        <div className="bg-primary/10 rounded-2xl px-6 py-4 text-center">
          <p className="text-lg font-semibold text-gray-700 font-body">Questions?</p>
          <p className="text-base text-primary font-semibold font-body mt-1">sabrina@sagefield.co</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const slides = [
  { id: "summer", label: "Summer 2026", component: <Slide1Summer /> },
  { id: "school-year", label: "School Year", component: <Slide2SchoolYear /> },
  { id: "homeschool", label: "Homeschool", component: <Slide3Homeschool /> },
  { id: "tuition", label: "Tuition", component: <Slide4Tuition /> },
  { id: "team", label: "Meet the Team", component: <Slide5Team /> },
  { id: "apply", label: "How to Enroll", component: <Slide6Apply /> },
];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function TVPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const currentRef = useRef(current);
  currentRef.current = current;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setDirection(1);
        setCurrent((c) => (c + 1) % TOTAL_SLIDES);
      }
    }, INTERVAL_MS);
  }, []);

  const advance = useCallback(() => {
    goTo((currentRef.current + 1) % TOTAL_SLIDES, 1);
  }, [goTo]);

  const retreat = useCallback(() => {
    goTo((currentRef.current - 1 + TOTAL_SLIDES) % TOTAL_SLIDES, -1);
  }, [goTo]);

  // Auto-advance
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setDirection(1);
        setCurrent((c) => (c + 1) % TOTAL_SLIDES);
      }
    }, INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft") retreat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, retreat]);

  return (
    <div
      className="w-screen h-screen bg-[#FFF9F5] overflow-hidden flex flex-col select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bar */}
      <div className="relative h-1.5 bg-gray-200 shrink-0">
        <motion.div
          key={`progress-${current}`}
          className="absolute top-0 left-0 h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: INTERVAL_MS / 1000, ease: "linear" as const }}
        />
      </div>

      {/* Top chrome */}
      <div className="flex items-center justify-between px-10 py-4 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/Logo.png" alt="Sage Field" className="h-12 object-contain" />
        <div className="flex items-center gap-3">
          <span className="px-5 py-2 bg-badge-bg text-black text-base font-semibold rounded-full font-body">
            {slides[current].label}
          </span>
          <span className="text-sm text-gray-400 font-body">{current + 1} / {TOTAL_SLIDES}</span>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 relative overflow-hidden px-10 pb-4">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0 px-10 pb-4 overflow-hidden"
          >
            {slides[current].component}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dot indicators + nav hint */}
      <div className="flex items-center justify-center gap-3 py-4 shrink-0">
        {/* Left arrow */}
        <button
          onClick={retreat}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:border-primary hover:text-primary transition-colors text-gray-400 cursor-pointer"
          aria-label="Previous slide"
        >
          ‹
        </button>

        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              i === current
                ? "bg-primary w-6 h-4"
                : "bg-gray-300 hover:bg-gray-400 w-3 h-3"
            }`}
            aria-label={`Go to ${s.label}`}
          />
        ))}

        {/* Right arrow */}
        <button
          onClick={advance}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:border-primary hover:text-primary transition-colors text-gray-400 cursor-pointer"
          aria-label="Next slide"
        >
          ›
        </button>
      </div>
    </div>
  );
}
