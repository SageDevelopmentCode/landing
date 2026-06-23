"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Check, CheckCircle, PenLine, X } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import WeekRecapPreview from "../components/WeekRecapPreview";
import { formatPhone } from "../utils/formatPhone";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const HERO_IMAGES = [
  "/assets/highlights/summer_week_two/0E23519F-0846-4BB8-9795-BC26B412E702 2.JPG",
  "/assets/highlights/summer_week_one/66719803-D874-46B5-9B16-C4F79A865A85 2.JPG",
  "/assets/highlights/summer_week_two/4D005FA0-C22C-4DE9-B589-8130BBB7723A.JPG",
];

const CAROUSEL_IMAGES = [
  "/assets/highlights/summer_week_two/08BB87B0-E53E-4981-9741-8F0AC0C32238.JPG",
  "/assets/highlights/summer_week_two/0E23519F-0846-4BB8-9795-BC26B412E702 2.JPG",
  "/assets/highlights/summer_week_two/17C0053A-E948-49DC-8D32-58D6D753C37D.JPG",
  "/assets/highlights/summer_week_two/24E4F2AF-5C30-4C23-9B09-8EA71093A1FD.JPG",
  "/assets/highlights/summer_week_two/2B58FEC3-CD58-40D9-93C5-A83D7DBB5A21.JPG",
  "/assets/highlights/summer_week_two/2CDB3506-F666-4787-ACCB-97B3A945C6EE.JPG",
  "/assets/highlights/summer_week_two/2D39D0C0-64E9-4355-A719-248000AD4077.JPG",
  "/assets/highlights/summer_week_two/2F8E12CF-285F-4629-A621-7DA20ED68F65.JPG",
];

const SAFARI_ACTIVITIES = [
  {
    emoji: "🦁",
    title: "Safari Bingo",
    desc: "Spot the animals with our custom safari bingo cards and win prizes — a wild adventure in observation and fun!",
    accent: "#fef3c7",
    accentText: "#b45309",
  },
  {
    emoji: "🦒",
    title: "Animal Masks",
    desc: "Craft your own wild animal mask from real materials to take home as a keepsake — lions, zebras, giraffes and more!",
    accent: "#dcfce7",
    accentText: "#15803d",
  },
  {
    emoji: "🔍",
    title: "Animal Scavenger Hunt",
    desc: "Track down hidden animals across our outdoor safari grounds using clues, binoculars, and sharp eyes!",
    accent: "#fed7aa",
    accentText: "#c2410c",
  },
];

const PACKING_LIST = [
  { emoji: "👟", item: "Closed-toe shoes (no sandals or flip-flops)" },
  { emoji: "👕", item: "Old clothes they can get messy in" },
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🥪", item: "Snack + lunch from home" },
  { emoji: "🎒", item: "Small backpack for their animal mask" },
  { emoji: "🔭", item: "Binoculars (optional but great for the scavenger hunt!)" },
  { emoji: "🏖️", item: "Towel" },
];

const ACTIVITIES = [
  "Climbing trees, logs, rocks, play structures, and natural features",
  "Running, balancing, jumping, hiking, and exploring uneven terrain",
  "Outdoor games and physical activities",
  "Gardening and nature-based activities",
  "Interaction with insects, wildlife, plants, and natural materials",
  "Cooking and food preparation activities",
  "Use of age-appropriate tools, utensils, and equipment under supervision",
  "Water play activities",
  "Animal interactions",
  "Arts, crafts, building projects, and other hands-on learning experiences",
];

const RISKS = [
  "Slips, trips, falls, and collisions",
  "Cuts, scrapes, bruises, splinters, burns, and minor injuries",
  "Sprains, fractures, and other physical injuries",
  "Exposure to weather conditions including heat, cold, rain, wind, and sun",
  "Exposure to insects, including bees, wasps, mosquitoes, ants, ticks, and chiggers",
  "Contact with plants, soil, mud, and natural environments",
  "Allergic reactions",
  "Risks associated with cooking activities and use of cooking equipment",
  "Risks associated with supervised use of tools and equipment",
  "Risks associated with interactions with animals",
  "Risks arising from participation in active outdoor play and exploration",
];

const inputClass =
  "w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-amber-300 focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-400 bg-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mt-6 mb-3 font-body">
      {children}
    </p>
  );
}

function AgreementSectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

function WaveDivider({
  fill = "white",
  fromColor = "transparent",
}: {
  fill?: string;
  fromColor?: string;
}) {
  return (
    <div
      className="overflow-hidden leading-none"
      style={{ background: fromColor }}
    >
      <svg
        viewBox="0 0 1440 56"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: "56px" }}
      >
        <path
          d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

export default function FieldDayFridayPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [sigPrintedName, setSigPrintedName] = useState("");
  const [sigValue, setSigValue] = useState("");
  const [packingChecked, setPackingChecked] = useState<Set<number>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const toggleCard = (i: number) =>
    setFlippedCards((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0 });

  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    referralSource: "",
    notes: "",
    emergencyName: "",
    emergencyPhone: "",
    consentOutdoor: false,
    consentPhoto: false,
  });

  const [children, setChildren] = useState([{ name: "", age: "" }]);

  const addChild = () => setChildren((prev) => [...prev, { name: "", age: "" }]);
  const removeChild = (i: number) =>
    setChildren((prev) => prev.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: "name" | "age", value: string) =>
    setChildren((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );

  const togglePacking = (i: number) =>
    setPackingChecked((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const target = new Date("2026-06-26T08:30:00-05:00");
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (agreementOpen) {
      document.body.style.overflow = "hidden";
      if (formData.parentName && !sigPrintedName)
        setSigPrintedName(formData.parentName);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementOpen]);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name.toLowerCase().includes("phone")
            ? formatPhone(value)
            : value,
    }));
  };

  const totalBase = children.length * 60;
  const cardFee = Math.round((totalBase * 0.029 + 0.3) * 100) / 100;
  const achFee = Math.min(Math.round(totalBase * 0.008 * 100) / 100, 5.0);
  const processingFee = paymentMethod === "card" ? cardFee : achFee;

  const isFormValid =
    !!formData.parentName.trim() &&
    !!formData.email.trim() &&
    children.length > 0 &&
    children.every((c) => !!c.name.trim() && !!c.age) &&
    formData.consentOutdoor &&
    coverFees;

  const handleSaveSignature = () => {
    if (!sigPrintedName.trim() || !sigValue.trim()) return;
    setAgreementSigned(true);
    setAgreementOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid || !agreementSigned || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/friday-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          children: children.map((c) => ({ name: c.name, age: Number(c.age) })),
          referralSource: formData.referralSource,
          notes: formData.notes,
          emergencyName: formData.emergencyName,
          emergencyPhone: formData.emergencyPhone,
          consentOutdoor: formData.consentOutdoor,
          consentPhoto: formData.consentPhoto,
          signatureName: sigPrintedName,
          paymentMethod,
          coverFees,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setSubmitError("Unexpected response. Please try again.");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes jungle-sway {
          0%, 100% { transform: rotate(-4deg); transform-origin: bottom center; }
          50%       { transform: rotate(4deg);  transform-origin: bottom center; }
        }
        @keyframes jungle-sway-reverse {
          0%, 100% { transform: rotate(3deg);  transform-origin: bottom center; }
          50%       { transform: rotate(-5deg); transform-origin: bottom center; }
        }
        @keyframes firefly-float {
          0%   { transform: translate(0, 0) scale(1);      opacity: 0.8; }
          25%  { transform: translate(12px, -18px) scale(1.3); opacity: 1; }
          50%  { transform: translate(-8px, -30px) scale(0.8); opacity: 0.5; }
          75%  { transform: translate(16px, -14px) scale(1.1); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1);      opacity: 0.8; }
        }
        @keyframes animal-peek {
          0%, 100% { transform: translateY(0px) scale(1); }
          40%       { transform: translateY(-10px) scale(1.04); }
          70%       { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes safari-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes golden-glow {
          0%, 100% { text-shadow: 0 2px 16px rgba(245,158,11,0.4), 0 0 0px rgba(251,191,36,0); }
          50%       { text-shadow: 0 2px 32px rgba(245,158,11,0.75), 0 0 40px rgba(251,191,36,0.35); }
        }
        @keyframes letter-drop {
          0%   { opacity: 0; transform: translateY(-24px) scale(0.85); filter: blur(4px); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.04); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes sun-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5), 0 0 0 0 rgba(251,191,36,0.25); }
          50%       { box-shadow: 0 0 0 18px rgba(245,158,11,0.15), 0 0 0 36px rgba(251,191,36,0.06); }
        }
        .safari-shimmer-text {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 20%, #fde68a 45%, #fbbf24 70%, #f59e0b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: safari-shimmer 4s linear infinite, golden-glow 3s ease-in-out infinite;
        }
        .jungle-sway         { animation: jungle-sway 4s ease-in-out infinite; }
        .jungle-sway-reverse { animation: jungle-sway-reverse 5s ease-in-out infinite; }
        .firefly-float       { animation: firefly-float 5s ease-in-out infinite; }
        .animal-peek         { animation: animal-peek 3.5s ease-in-out infinite; }
        .sun-pulse           { animation: sun-pulse 3s ease-in-out infinite; }
        .letter-drop span {
          display: inline-block;
          opacity: 0;
          animation: letter-drop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        /* Flip card */
        .flip-card-inner { transform-style: preserve-3d; transition: transform 0.55s cubic-bezier(0.4,0,0.2,1); }
        .flip-card:hover .flip-card-inner,
        .flip-card-inner.flipped { transform: rotateY(180deg); }
        .flip-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .flip-back { transform: rotateY(180deg); backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>

      <div className="min-h-screen bg-white overflow-x-hidden">
        <Navbar darkStyle={true} lightText={true} />

        {/* ─── HERO ─────────────────────────────────────────────────────────── */}
        <section
          className="relative pt-20 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #0a1a0c 0%, #132a14 30%, #1c3a1e 60%, #0f2410 100%)",
          }}
        >
          {/* Left jungle palm — sways gently */}
          <div
            className="jungle-sway absolute bottom-0 left-0 w-20 sm:w-28 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 80 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto opacity-60">
              <path d="M40 200 Q38 160 36 120 Q34 80 40 20" stroke="#2d5a1b" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <path d="M40 20 Q10 -5 0 30" stroke="#3d7a26" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M40 20 Q70 -5 80 25" stroke="#3d7a26" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M40 20 Q5 40 0 65" stroke="#2d5a1b" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M40 20 Q75 40 80 60" stroke="#2d5a1b" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M40 30 Q25 50 15 80" stroke="#4a8f30" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M40 30 Q55 50 65 75" stroke="#4a8f30" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Right jungle vine — reversed sway */}
          <div
            className="jungle-sway-reverse absolute bottom-0 right-0 w-16 sm:w-24 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 70 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto opacity-50">
              <path d="M35 180 Q33 140 30 100 Q28 60 35 10" stroke="#2d5a1b" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M35 10 Q5 -5 0 20" stroke="#3d7a26" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M35 10 Q65 0 70 25" stroke="#3d7a26" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M35 20 Q10 45 5 70" stroke="#2d5a1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M35 20 Q60 40 70 60" stroke="#2d5a1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Firefly particles */}
          {[
            { top: "20%", left: "8%",  right: undefined, size: 5, delay: "0s",   dur: "4.5s" },
            { top: "45%", left: "5%",  right: undefined, size: 3, delay: "1.2s", dur: "6s"   },
            { top: "30%", left: undefined, right: "12%", size: 4, delay: "0.5s", dur: "5s"   },
            { top: "65%", left: undefined, right: "8%",  size: 3, delay: "2s",   dur: "7s"   },
            { top: "15%", left: undefined, right: "20%", size: 3, delay: "3s",   dur: "5.5s" },
          ].map((f, i) => (
            <div
              key={i}
              className="firefly-float absolute rounded-full pointer-events-none"
              style={{
                top: f.top,
                left: f.left,
                right: f.right,
                width: f.size,
                height: f.size,
                background: "radial-gradient(circle, #fde68a 0%, #f59e0b 60%, transparent 100%)",
                boxShadow: `0 0 ${f.size * 2}px rgba(251,191,36,0.9)`,
                animationDelay: f.delay,
                animationDuration: f.dur,
                zIndex: 1,
              }}
            />
          ))}

          {/* Decorative sun orb (replaces planet) */}
          <div
            className="sun-pulse absolute top-12 right-8 sm:right-16 lg:right-24 w-20 h-20 sm:w-28 sm:h-28 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 35% 35%, #fde68a 0%, #f59e0b 50%, #d97706 100%)",
              zIndex: 1,
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.30) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* Giraffe silhouette peek */}
          <div
            className="animal-peek absolute top-6 right-0 w-16 sm:w-20 pointer-events-none opacity-20"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 100 Q28 70 25 50 Q22 30 28 10 Q30 2 35 5 Q40 2 42 10 Q48 30 45 50 Q42 70 40 100" fill="#92400e"/>
              <ellipse cx="35" cy="8" rx="10" ry="7" fill="#92400e"/>
              <line x1="30" y1="3" x2="28" y2="-4" stroke="#92400e" strokeWidth="2.5"/>
              <line x1="40" y1="3" x2="42" y2="-4" stroke="#92400e" strokeWidth="2.5"/>
            </svg>
          </div>

          <div
            className="relative max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16"
            style={{ zIndex: 2 }}
          >
            {/* Left — content */}
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Headline */}
              <motion.h1
                className="font-heading font-bold leading-[1.05] mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.55 }}
              >
                <span
                  className="block italic safari-shimmer-text"
                  style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
                >
                  Safari Escape
                </span>
                <span
                  className="letter-drop block"
                  style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
                >
                  {Array.from("Field Day 🦁").map((ch, i) => (
                    <span
                      key={i}
                      style={{
                        animationDelay: `${0.55 + i * 0.06}s`,
                        color: "#fbbf24",
                      }}
                    >
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg text-amber-100 font-body leading-relaxed mb-7 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                One wild Friday at Sage Field. Play safari bingo, craft your own
                animal mask, and track down animals on a scavenger hunt!
              </motion.p>

              {/* Quick-detail pills */}
              <motion.div
                className="flex flex-wrap gap-2 justify-center lg:justify-start mb-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
              >
                {[
                  { icon: "📅", text: "Jun 26, 2026" },
                  { icon: "🕗", text: "Drop-off 8:30 AM" },
                  { icon: "🕒", text: "Pick-up 1:30 PM" },
                  { icon: "👧", text: "Ages 4–11" },
                  { icon: "💰", text: "$60 per child" },
                ].map((pill) => (
                  <span
                    key={pill.text}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-semibold text-white/90 font-body shadow-sm"
                  >
                    {pill.icon} {pill.text}
                  </span>
                ))}
              </motion.div>

              {/* Countdown timer */}
              <motion.div
                className="flex gap-2 justify-center lg:justify-start mb-8 items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
              >
                {[
                  { val: countdown.days, label: "days" },
                  { val: countdown.hours, label: "hrs" },
                  { val: countdown.mins, label: "min" },
                ].map(({ val, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl min-w-[48px]"
                  >
                    <span className="text-xl font-bold text-white font-heading tabular-nums">
                      {String(val).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-amber-300 font-body uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
                <span className="text-xs text-amber-300 font-body pl-1">
                  until safari day 🦁
                </span>
              </motion.div>

              {/* CTAs */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.45 }}
              >
                <button
                  onClick={scrollToForm}
                  className="px-7 py-4 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-body cursor-pointer text-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
                  }}
                >
                  🦁 Reserve Your Spot →
                </button>
                <a
                  href="#what-we-do"
                  className="px-7 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all duration-200 font-body text-sm text-center"
                >
                  See the Activities ↓
                </a>
              </motion.div>
            </motion.div>

            {/* Right — Polaroid-style stacked photos */}
            <motion.div
              className="w-full lg:w-auto flex-1 max-w-xs sm:max-w-sm lg:max-w-none relative"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
            >
              <div className="relative h-72 sm:h-80 lg:h-96 flex items-center justify-center">
                {/* Back photo */}
                <div
                  className="absolute w-44 sm:w-52 lg:w-56 bg-white p-2.5 pb-10 shadow-2xl rounded-sm"
                  style={{
                    transform:
                      "rotate(10deg) translateX(110px) translateY(-10px)",
                    zIndex: 1,
                  }}
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={HERO_IMAGES[2]}
                      alt="Students at Sage Field"
                      fill
                      className="object-cover"
                      sizes="256px"
                      loading="lazy"
                    />
                  </div>
                </div>
                {/* Mid photo */}
                <div
                  className="absolute w-44 sm:w-52 lg:w-56 bg-white p-2.5 pb-10 shadow-2xl rounded-sm hover:-translate-y-2 hover:rotate-0 transition-all duration-300 cursor-pointer"
                  style={{
                    transform:
                      "rotate(-8deg) translateX(-110px) translateY(8px)",
                    zIndex: 2,
                  }}
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={HERO_IMAGES[1]}
                      alt="Students at Sage Field"
                      fill
                      className="object-cover"
                      sizes="256px"
                      priority
                    />
                  </div>
                </div>
                {/* Front photo */}
                <div
                  className="absolute w-44 sm:w-52 lg:w-56 bg-white p-2.5 pb-10 shadow-2xl rounded-sm hover:-translate-y-3 hover:rotate-0 transition-all duration-300 cursor-pointer"
                  style={{ transform: "rotate(2deg)", zIndex: 3 }}
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={HERO_IMAGES[0]}
                      alt="Students at Sage Field"
                      fill
                      className="object-cover"
                      sizes="256px"
                      priority
                    />
                  </div>
                  <p className="text-center text-[10px] font-body text-gray-400 mt-1 tracking-wide uppercase">
                    Safari Escape ✦ Jun 26
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Wave divider at bottom of hero → white */}
          <WaveDivider fill="white" fromColor="#0f2410" />
        </section>

        {/* ─── PHOTO STRIP ──────────────────────────────────────────────────── */}
        <div className="bg-white pb-2">
          <div
            ref={galleryRef}
            className="overflow-x-auto flex gap-3 px-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] py-4"
          >
            {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((src, i) => (
              <div
                key={i}
                className="relative w-56 sm:w-64 flex-shrink-0 aspect-[4/3] rounded-2xl overflow-hidden shadow-md"
              >
                <Image
                  src={src}
                  alt="Students at Sage Field"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  sizes="256px"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ─── WHAT'S HAPPENING ─────────────────────────────────────────────── */}
        <section
          id="what-we-do"
          className="py-20 px-6 sm:px-12 lg:px-16"
          style={{ background: "#fffbeb" }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-5 py-2 bg-amber-100 text-amber-800 text-sm font-bold rounded-full mb-5 font-body">
                🦁 This Friday&apos;s Theme
              </span>
              <h2
                className="font-heading font-bold text-slate-800 mb-3 leading-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Four Hours of Safari Adventure
              </h2>
              <p className="text-base text-slate-500 font-body max-w-xl mx-auto">
                Safari Bingo · Animal Masks · Animal Scavenger Hunt
              </p>
            </motion.div>

            {/* Activity cards — flip on hover */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
              {SAFARI_ACTIVITIES.map((activity, i) => (
                <motion.div
                  key={activity.title}
                  className="flip-card relative cursor-pointer"
                  style={{ perspective: "800px", minHeight: "180px" }}
                  initial={{ opacity: 0, y: 20, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.1 * i }}
                  onClick={() => toggleCard(i)}
                >
                  <div className={`flip-card-inner relative w-full h-full${flippedCards.has(i) ? " flipped" : ""}`} style={{ minHeight: "180px" }}>
                    {/* Front face */}
                    <div
                      className="flip-face absolute inset-0 bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 flex flex-col"
                    >
                      <div className="h-2 w-full" style={{ background: activity.accentText }} />
                      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm"
                          style={{ background: activity.accent }}
                        >
                          {activity.emoji}
                        </div>
                        <h3 className="font-heading font-bold text-slate-800 text-base leading-tight">
                          {activity.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-body">tap to learn more ✦</p>
                      </div>
                    </div>
                    {/* Back face */}
                    <div
                      className="flip-back absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-6 text-center gap-3"
                      style={{ background: activity.accentText }}
                    >
                      <span className="text-4xl">{activity.emoji}</span>
                      <h3 className="font-heading font-bold text-white text-base leading-tight">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-white/85 font-body leading-relaxed">
                        {activity.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Logistics strip */}
            <motion.div
              className="rounded-3xl p-6 flex flex-wrap gap-4 justify-center"
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #dcfce7 100%)",
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {[
                { icon: "🕗", text: "Drop-off 8:30 AM" },
                { icon: "🕒", text: "Pick-up 1:30 PM" },
                { icon: "💰", text: "$60 per child" },
                { icon: "👧", text: "Ages 4–11" },
                { icon: "📍", text: "2760 Gattis School Rd, Round Rock TX" },
              ].map((pill) => (
                <span
                  key={pill.text}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-2xl text-sm font-semibold text-slate-700 font-body shadow-sm border border-white/70"
                >
                  {pill.icon} {pill.text}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Wave into recap */}
        <div style={{ background: "#fffbeb", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"
              fill="#071a09"
            />
          </svg>
        </div>

        {/* ─── WEEK RECAP ───────────────────────────────────────────────────── */}
        <WeekRecapPreview className="bg-[#071a09]" variant="dark" />

        {/* Wave out of recap */}
        <div style={{ background: "#071a09", marginTop: "-1px", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,0 1080,40 1440,20 L1440,40 L0,40 Z"
              fill="#0f2410"
            />
          </svg>
        </div>

        {/* ─── REGISTRATION FORM ────────────────────────────────────────────── */}
        <section
          id="reserve"
          className="py-20 px-6 sm:px-12 lg:px-16"
          style={{
            background:
              "linear-gradient(180deg, #0f2410 0%, #132a14 40%, #0a1a0c 100%)",
          }}
        >
          <div ref={formRef} className="max-w-xl mx-auto">
            {/* Section header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-5xl mb-3">🦁</div>
              <h2
                className="font-heading font-bold text-white mb-2"
                style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
              >
                Reserve Your Spot
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full mb-3">
                <span className="text-amber-800 font-bold font-body text-sm">
                  $60 per child
                </span>
                <span className="text-amber-400">·</span>
                <span className="text-amber-700 font-body text-sm">
                  No enrollment required
                </span>
                <span className="text-amber-400">·</span>
                <span className="text-amber-700 font-body text-sm">
                  Limited spots
                </span>
              </div>
            </motion.div>

            <AnimatePresence>
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-100"
                  style={{ borderTop: "4px solid #f59e0b" }}
                >
                  <SectionLabel>Your Info</SectionLabel>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        Parent / guardian name{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(512) 000-0000"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <SectionLabel>
                    Your Child{children.length > 1 ? "ren" : ""}{" "}
                    <span className="text-stone-400 normal-case font-normal text-[10px] ml-1">
                      $60 per child
                    </span>
                  </SectionLabel>

                  <div className="space-y-4">
                    {children.map((child, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-amber-700/70 font-body uppercase tracking-wide">
                            Child {i + 1}
                          </p>
                          {children.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChild(i)}
                              className="text-xs text-slate-400 hover:text-red-400 font-body transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                            Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={child.name}
                            onChange={(e) => updateChild(i, "name", e.target.value)}
                            placeholder="First and last name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                            Age <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={child.age}
                            onChange={(e) => updateChild(i, "age", e.target.value)}
                            className={`${inputClass} cursor-pointer`}
                          >
                            <option value="">Select age</option>
                            {[4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                              <option key={age} value={age}>
                                {age} years old
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addChild}
                      className="w-full py-2.5 border-2 border-dashed border-stone-300 rounded-xl text-sm font-semibold text-stone-500 hover:border-stone-400 hover:bg-stone-50 transition-all duration-200 font-body cursor-pointer"
                    >
                      + Add Another Child
                    </button>

                    {children.length > 1 && (
                      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-100 rounded-xl">
                        <span className="text-sm font-bold text-amber-800 font-body">
                          {children.length} children · ${totalBase} total
                        </span>
                      </div>
                    )}
                  </div>

                  <SectionLabel>A Bit More</SectionLabel>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        How did you hear about us?
                      </label>
                      <select
                        name="referralSource"
                        value={formData.referralSource}
                        onChange={handleChange}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Select one</option>
                        <option value="friend">Friend / Word of Mouth</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="google">Google</option>
                        <option value="nextdoor">Nextdoor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        Anything we should know?
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Allergies, medical needs, sensitivities, or anything that helps us take great care of your child"
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>

                  <SectionLabel>Emergency Contact</SectionLabel>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        Emergency contact name
                      </label>
                      <input
                        type="text"
                        name="emergencyName"
                        value={formData.emergencyName}
                        onChange={handleChange}
                        placeholder="Name if you can't be reached"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 font-body">
                        Emergency contact phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        placeholder="(512) 000-0000"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <SectionLabel>Before we confirm your spot</SectionLabel>
                  <div className="space-y-3">
                    {[
                      {
                        name: "consentOutdoor" as const,
                        checked: formData.consentOutdoor,
                        label: (
                          <>
                            I give permission for my child to participate in
                            outdoor activities and to have sunscreen applied if
                            needed <span className="text-red-400">*</span>
                          </>
                        ),
                      },
                      {
                        name: "consentPhoto" as const,
                        checked: formData.consentPhoto,
                        label:
                          "I'm okay with photos of my child being taken and shared on Sage Field's social media (we cover all kids' faces for privacy)",
                      },
                    ].map(({ name, checked, label }) => (
                      <label
                        key={name}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 flex-shrink-0 rounded-md border-2 mt-0.5 flex items-center justify-center transition-all ${
                            checked
                              ? "bg-amber-500 border-amber-500"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {checked && (
                            <Check
                              className="w-3 h-3 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          name={name}
                          checked={checked}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-sm text-slate-600 font-body leading-snug">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Payment Method */}
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-slate-700 font-body mb-2">
                      How will you be paying?
                    </p>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold font-body border-2 transition-colors cursor-pointer ${
                          paymentMethod === "card"
                            ? "border-amber-400 bg-amber-50 text-amber-800"
                            : "border-stone-200 text-slate-600 hover:bg-stone-50"
                        }`}
                      >
                        Credit / Debit Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("ach")}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold font-body border-2 transition-colors cursor-pointer ${
                          paymentMethod === "ach"
                            ? "border-amber-400 bg-amber-50 text-amber-800"
                            : "border-stone-200 text-slate-600 hover:bg-stone-50"
                        }`}
                      >
                        ACH / US bank account
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 font-body mb-3">
                      {paymentMethod === "card"
                        ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
                        : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        className={`w-5 h-5 flex-shrink-0 rounded-md border-2 mt-0.5 flex items-center justify-center transition-all ${
                          coverFees
                            ? "bg-amber-500 border-amber-500"
                            : "border-stone-300 bg-white"
                        }`}
                        onClick={() => setCoverFees((v) => !v)}
                      >
                        {coverFees && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={coverFees}
                        onChange={(e) => setCoverFees(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-sm text-slate-600 font-body leading-snug">
                        I agree to pay the processing fee so Sage Field receives the full amount{" "}
                        <span className="text-red-400">*</span>
                      </span>
                    </label>
                  </div>

                  {/* Agreement + Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-6 space-y-3"
                  >
                    <div
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${
                        agreementSigned
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-dashed border-stone-300 bg-stone-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {agreementSigned ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <PenLine className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-bold font-heading text-slate-800">
                            Participant Agreement
                          </p>
                          <p className="text-xs text-slate-400 font-body">
                            {agreementSigned
                              ? "Signed — ready to submit"
                              : "Required before submitting"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAgreementOpen(true)}
                        disabled={!isFormValid}
                        className="text-xs font-semibold text-stone-500 font-body hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ml-2"
                      >
                        {agreementSigned ? "View" : "Review & Sign →"}
                      </button>
                    </div>
                    {!isFormValid && !agreementSigned && (
                      <p className="text-xs text-slate-400 font-body text-center">
                        Fill in required fields above to unlock the agreement
                      </p>
                    )}
                    {submitError && (
                      <p className="text-sm text-red-500 font-body text-center">
                        {submitError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isFormValid || !agreementSigned || submitting}
                      className="w-full px-6 py-4 text-white font-bold rounded-2xl transition-all duration-200 font-body cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
                      }}
                    >
                      {submitting
                        ? "Submitting…"
                        : `🦁 Pay $${(60 + processingFee).toFixed(2)} & Reserve My Spot →`}
                    </button>
                  </motion.div>
                </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Wave before packing list */}
        <div style={{ background: "#0a1a0c", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z"
              fill="#1a3a1e"
            />
          </svg>
        </div>

        {/* ─── PACKING LIST ─────────────────────────────────────────────────── */}
        <section
          className="py-16 px-6 sm:px-12 lg:px-16"
          style={{ background: "#1a3a1e" }}
        >
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl mb-3">🎒</div>
              <h2
                className="font-heading font-bold text-white"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
              >
                Pack Your Safari Bag
              </h2>
              <p className="text-sm text-amber-200/70 font-body mt-1">
                Tap each item to check it off — don&apos;t forget anything for Safari Escape!
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PACKING_LIST.map((item, i) => {
                const isChecked = packingChecked.has(i);
                return (
                  <motion.div
                    key={item.item}
                    layout
                    onClick={() => togglePacking(i)}
                    className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm border transition-all duration-200 cursor-pointer select-none ${
                      isChecked
                        ? "bg-amber-50 border-amber-300 opacity-70"
                        : "bg-white border-amber-100 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Left color accent bar */}
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0 transition-all duration-300"
                      style={{
                        background: isChecked
                          ? "#d97706"
                          : i % 2 === 0
                          ? "#15803d"
                          : "#b45309",
                      }}
                    />
                    <span className="text-2xl flex-shrink-0 transition-all duration-200">
                      {isChecked ? "✅" : item.emoji}
                    </span>
                    <span
                      className={`text-sm font-body text-slate-700 font-semibold transition-all duration-200 ${
                        isChecked ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {item.item}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {packingChecked.size === PACKING_LIST.length && (
                <motion.p
                  className="text-center text-amber-300 text-sm font-body mt-5 font-semibold"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  🦁 All packed! Ready for the safari.
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-sm text-amber-200/50 font-body text-center mt-6">
              Questions? Text or call us: (512) 677-5872
            </p>
          </div>
        </section>

        {/* Wave before bottom CTA */}
        <div style={{ background: "#1a3a1e", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,0 1080,40 1440,20 L1440,40 L0,40 Z"
              fill="#0a1f0e"
            />
          </svg>
        </div>

        {/* ─── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <section
          className="py-24 px-6 sm:px-12 lg:px-16 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #0a1f0e 0%, #1a3a1e 50%, #0d2b10 100%)",
          }}
        >
          {/* Decorative fireflies */}
          {[
            { top: "15%", left: "10%",  right: undefined, size: 5, delay: "0s"   },
            { top: "70%", left: undefined, right: "12%",  size: 4, delay: "1.8s" },
            { top: "40%", left: "4%",   right: undefined, size: 3, delay: "0.8s" },
          ].map((f, i) => (
            <div
              key={i}
              className="firefly-float absolute rounded-full pointer-events-none"
              style={{
                top: f.top,
                left: f.left,
                right: f.right,
                width: f.size,
                height: f.size,
                background: "radial-gradient(circle, #fde68a 0%, #f59e0b 60%, transparent 100%)",
                boxShadow: `0 0 ${f.size * 2}px rgba(251,191,36,0.9)`,
                animationDelay: f.delay,
              }}
            />
          ))}

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="animal-peek text-5xl mb-6 inline-block">🦁</div>
              <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full mb-6">
                <span className="text-white/90 text-xs font-semibold font-body uppercase tracking-wider">
                  This Friday Only · Jun 26
                </span>
              </div>
              <h2
                className="font-heading font-bold text-white mb-4 leading-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Don&apos;t miss Safari Escape.
              </h2>
              <p className="text-white/80 font-body text-base mb-8 leading-relaxed max-w-md mx-auto">
                June 26 is one day. Spots are limited. Reserve your child&apos;s
                spot now and join us for a day of animal bingo, mask-making,
                and an outdoor scavenger hunt at Sage Field.
              </p>
              <button
                onClick={scrollToForm}
                className="px-10 py-4 bg-white text-amber-800 font-bold rounded-2xl hover:bg-amber-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 font-body text-base cursor-pointer"
              >
                Reserve Spot · $60 →
              </button>
              <p className="text-white/50 font-body text-xs mt-5">
                One Friday. $60. No commitment.
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />

        {/* ─── MOBILE STICKY BAR ────────────────────────────────────────────── */}
        <motion.div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4, ease: "easeOut" as const }}
        >
          <div
            className="rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3"
            style={{
              background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
            }}
          >
            <div>
              <p className="text-white font-heading font-bold text-sm leading-tight">
                🦁 Safari Escape · Jun 26
              </p>
              <p className="text-white/80 font-body text-xs">
                $60 drop-in — limited spots
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="flex-shrink-0 bg-white text-amber-800 font-bold text-sm font-body px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors duration-200 cursor-pointer"
            >
              Reserve →
            </button>
          </div>
        </motion.div>

        <div className="hidden lg:block">
          <FloatingSMSButton />
        </div>

        {/* ─── AGREEMENT DRAWER ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {agreementOpen && (
            <div className={dancingScript.variable}>
              <motion.div
                className="fixed inset-0 bg-black/60 z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAgreementOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 right-0 w-full max-w-3xl z-[70] bg-white flex flex-col shadow-2xl"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sticky Header */}
                <div className="flex-shrink-0 sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-base font-bold font-heading text-gray-800">
                      Safari Escape Participant Agreement
                    </h2>
                    <p className="text-xs text-gray-400 font-body mt-0.5">
                      {agreementSigned ? "1" : "0"} of 1 sections signed
                    </p>
                  </div>
                  <button
                    onClick={() => setAgreementOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold font-heading text-gray-800">
                        Sage Field Private Microschool
                      </p>
                      <p className="text-xs text-gray-500 font-body">
                        Location: Round Rock, Texas · Safari Escape: June 26,
                        2026
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                          {
                            label: children.length > 1 ? "Children" : "Student Name",
                            value: children.map((c) => c.name).filter(Boolean).join(", ") || "—",
                          },
                          {
                            label: "Parent / Guardian",
                            value: formData.parentName || "—",
                          },
                          {
                            label: "Emergency Contact",
                            value: formData.emergencyName
                              ? `${formData.emergencyName}${formData.emergencyPhone ? ` · ${formData.emergencyPhone}` : ""}`
                              : "—",
                          },
                          {
                            label: "Photo Consent",
                            value: formData.consentPhoto
                              ? "✓ Authorized"
                              : "✗ Not authorized",
                          },
                        ].map((row) => (
                          <div key={row.label}>
                            <p className="text-xs font-semibold text-gray-400 font-body">
                              {row.label}
                            </p>
                            <p className="text-sm text-gray-800 font-body">
                              {row.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      {formData.notes && (
                        <div className="border-t border-gray-200 pt-3 mt-1">
                          <p className="text-xs font-semibold text-gray-400 font-body mb-1">
                            Medical / Notes
                          </p>
                          <p className="text-sm text-gray-700 font-body leading-relaxed">
                            {formData.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <AgreementSectionHeader title="1. Acknowledgment of Program Activities" />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        I understand that my child is participating in a Safari
                        Escape Field Day at an outdoor education program where
                        children learn through active exploration, hands-on
                        experiences, and supervised outdoor activities.
                        Activities may include, but are not limited to:
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {ACTIVITIES.map((a) => (
                          <li
                            key={a}
                            className="flex gap-2 text-sm text-gray-600 font-body"
                          >
                            <span className="text-primary mt-0.5 flex-shrink-0">
                              •
                            </span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        I understand that these activities involve inherent
                        risks that cannot be completely eliminated while
                        preserving the educational and developmental benefits of
                        participation.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <AgreementSectionHeader title="2. Assumption of Risk" />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        I knowingly and voluntarily assume all risks associated
                        with my child&apos;s participation in the Safari Escape
                        Field Day, including but not limited to:
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {RISKS.map((r) => (
                          <li
                            key={r}
                            className="flex gap-2 text-sm text-gray-600 font-body"
                          >
                            <span className="text-primary mt-0.5 flex-shrink-0">
                              •
                            </span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        I understand that injury may occur despite reasonable
                        supervision and safety precautions.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <AgreementSectionHeader title="3. Release of Liability" />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        In consideration of my child&apos;s participation in the
                        Safari Escape Field Day, I release and hold harmless the
                        School, its owners, directors, employees, contractors,
                        volunteers, agents, and representatives from any claims,
                        demands, causes of action, damages, losses, costs, or
                        expenses arising out of or related to my child&apos;s
                        participation.
                      </p>
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        This release applies to all claims based upon ordinary
                        negligence but does not apply to claims arising from
                        gross negligence, reckless conduct, or intentional
                        misconduct.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <AgreementSectionHeader title="4. Medical Authorization" />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        I authorize school personnel to obtain emergency medical
                        treatment for my child if I cannot be reached promptly.
                        I understand that:
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {[
                          "Emergency medical services may be contacted when deemed necessary.",
                          "I am responsible for all medical expenses incurred on behalf of my child.",
                          "School personnel may administer basic first aid as appropriate.",
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-gray-600 font-body"
                          >
                            <span className="text-primary mt-0.5 flex-shrink-0">
                              •
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {formData.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                          <p className="text-xs font-semibold text-amber-700 font-body mb-1">
                            Allergies, Medical Conditions, or Special Notes
                          </p>
                          <p className="text-sm text-amber-800 font-body">
                            {formData.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <AgreementSectionHeader title="5. Photography and Media Release" />
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                          formData.consentPhoto
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <span className="text-lg">
                          {formData.consentPhoto ? "✅" : "🚫"}
                        </span>
                        <p className="text-sm font-body text-gray-700">
                          {formData.consentPhoto
                            ? "I authorize the School to photograph and/or record my child and use such images or recordings for educational, promotional, website, social media, and marketing purposes."
                            : "I do not authorize the School to use photographs or recordings of my child."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <AgreementSectionHeader title="6. Emergency Contact Authorization" />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        If the parent or guardian cannot be reached, the
                        following individual is authorized to make emergency
                        decisions regarding the child:
                      </p>
                      <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 font-body">
                              Name
                            </p>
                            <p className="text-sm text-gray-800 font-body">
                              {formData.emergencyName || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 font-body">
                              Phone
                            </p>
                            <p className="text-sm text-gray-800 font-body">
                              {formData.emergencyPhone || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <AgreementSectionHeader title="7. Parent Acknowledgment & Signature" />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        By signing below, I confirm that I have read this
                        Agreement in its entirety and understand its contents. I
                        certify that I am the parent or legal guardian of the
                        child named above and have authority to execute this
                        Agreement.
                      </p>

                      {agreementSigned ? (
                        <div className="mt-2 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <p
                              className="text-2xl text-gray-700 truncate"
                              style={{
                                fontFamily: "var(--font-dancing-script)",
                              }}
                            >
                              {sigValue}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAgreementSigned(false);
                              setSigValue("");
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                            Sign this section
                          </p>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
                              Full name{" "}
                              <span className="font-normal text-gray-400">
                                (print)
                              </span>
                            </label>
                            <input
                              type="text"
                              value={sigPrintedName}
                              onChange={(e) =>
                                setSigPrintedName(e.target.value)
                              }
                              placeholder="Your full legal name"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
                              Signature
                            </label>
                            {sigValue ? (
                              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-white">
                                <p
                                  className="text-2xl text-gray-700 flex-1"
                                  style={{
                                    fontFamily: "var(--font-dancing-script)",
                                  }}
                                >
                                  {sigValue}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSigValue("")}
                                  className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSigValue(sigPrintedName)}
                                disabled={!sigPrintedName.trim()}
                                className="cursor-pointer w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-body text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                              >
                                Click to sign
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSaveSignature}
                              disabled={!sigValue.trim()}
                              className="px-4 py-2 bg-primary text-white text-xs font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Save signature
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div
                  className={`flex-shrink-0 border-t px-6 py-4 flex items-center justify-between ${
                    agreementSigned
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-gray-100"
                  }`}
                >
                  {agreementSigned ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700 font-body">
                        Agreement signed — you&apos;re all set
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-gray-500 font-body">
                        Signature required to continue
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setAgreementOpen(false)}
                    className="px-4 py-2 text-xs font-semibold font-body text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
