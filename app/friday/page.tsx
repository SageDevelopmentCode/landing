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

const DINO_ACTIVITIES = [
  {
    emoji: "🦴",
    title: "Dino Dig",
    desc: "Excavate real fossils from the dig pit using brushes and tools — take your discovery home!",
    accent: "#fef3c7",
    accentText: "#92400e",
  },
  {
    emoji: "🎨",
    title: "Dino Painting",
    desc: "Paint your own life-size dinosaur silhouette on canvas with prehistoric colors and textures!",
    accent: "#ecfdf5",
    accentText: "#065f46",
  },
  {
    emoji: "🪨",
    title: "Fossil Making",
    desc: "Press, mold, and cast your own dino fossil to keep — a real paleontologist's keepsake!",
    accent: "#eff6ff",
    accentText: "#1d4ed8",
  },
  {
    emoji: "🥚",
    title: "Dino Egg Hunt",
    desc: "Race to find hidden dino eggs across the field and crack them open to reveal surprises inside!",
    accent: "#fdf4ff",
    accentText: "#7c3aed",
  },
];

const PACKING_LIST = [
  { emoji: "👟", item: "Closed-toe shoes — you'll be digging!" },
  { emoji: "👕", item: "Old clothes or a painting shirt" },
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🥪", item: "Snack + lunch from home" },
  { emoji: "🎒", item: "Small backpack for your fossil & dino creation" },
  { emoji: "🦺", item: "An apron or smock (we'll have some too)" },
  { emoji: "🏖️", item: "Towel (for messy hands!)" },
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
    const target = new Date("2026-07-10T08:30:00-05:00");
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
        @keyframes dino-stomp {
          0%, 100% { transform: rotate(-4deg) translateY(0px); transform-origin: bottom center; }
          30%       { transform: rotate(3deg) translateY(-3px); transform-origin: bottom center; }
          60%       { transform: rotate(-2deg) translateY(2px); transform-origin: bottom center; }
        }
        @keyframes dino-stomp-reverse {
          0%, 100% { transform: rotate(3deg) translateY(0px);  transform-origin: bottom center; }
          30%       { transform: rotate(-4deg) translateY(-2px); transform-origin: bottom center; }
          60%       { transform: rotate(2deg) translateY(3px); transform-origin: bottom center; }
        }
        @keyframes spore-float {
          0%   { transform: translate(0, 0) scale(1);      opacity: 0.7; }
          25%  { transform: translate(10px, -20px) scale(1.2); opacity: 1; }
          50%  { transform: translate(-6px, -35px) scale(0.8); opacity: 0.4; }
          75%  { transform: translate(14px, -16px) scale(1.1); opacity: 0.85; }
          100% { transform: translate(0, 0) scale(1);      opacity: 0.7; }
        }
        @keyframes dino-roar {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          30%       { transform: translateY(-12px) scale(1.06) rotate(-3deg); }
          60%       { transform: translateY(-7px) scale(1.03) rotate(2deg); }
        }
        @keyframes lava-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lava-glow {
          0%, 100% { text-shadow: 0 2px 16px rgba(234,88,12,0.5), 0 0 0px rgba(220,38,38,0); }
          50%       { text-shadow: 0 2px 32px rgba(234,88,12,0.85), 0 0 40px rgba(220,38,38,0.4); }
        }
        @keyframes letter-drop {
          0%   { opacity: 0; transform: translateY(-24px) scale(0.85); filter: blur(4px); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.04); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes volcano-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.6), 0 0 0 0 rgba(220,38,38,0.3); }
          50%       { box-shadow: 0 0 0 18px rgba(234,88,12,0.18), 0 0 0 36px rgba(220,38,38,0.08); }
        }
        @keyframes egg-wobble {
          0%, 100% { transform: rotate(-4deg); }
          50%       { transform: rotate(4deg); }
        }
        @keyframes ground-shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-2px); }
          40%  { transform: translateX(2px); }
          60%  { transform: translateX(-1px); }
          80%  { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
        .lava-shimmer-text {
          background: linear-gradient(90deg, #ea580c 0%, #f59e0b 20%, #fde68a 45%, #f59e0b 70%, #ea580c 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: lava-shimmer 4s linear infinite, lava-glow 3s ease-in-out infinite;
        }
        .dino-stomp         { animation: dino-stomp 4s ease-in-out infinite; }
        .dino-stomp-reverse { animation: dino-stomp-reverse 5s ease-in-out infinite; }
        .spore-float        { animation: spore-float 5s ease-in-out infinite; }
        .dino-roar          { animation: dino-roar 3.5s ease-in-out infinite; }
        .volcano-pulse      { animation: volcano-pulse 3s ease-in-out infinite; }
        .egg-wobble         { animation: egg-wobble 2.5s ease-in-out infinite; }
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
              "linear-gradient(180deg, #1a0a00 0%, #2d1500 30%, #3d1a00 60%, #1a0800 100%)",
          }}
        >
          {/* Left prehistoric fern — dino stomp sway */}
          <div
            className="dino-stomp absolute bottom-0 left-0 w-20 sm:w-28 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 80 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto opacity-60">
              <path d="M40 200 Q38 160 36 120 Q34 80 40 20" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <path d="M40 20 Q5 0 0 35" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M40 20 Q75 0 80 30" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M40 30 Q0 55 0 80" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M40 30 Q80 55 80 75" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M40 50 Q10 70 5 100" stroke="#a35a10" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M40 50 Q70 70 75 95" stroke="#a35a10" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M40 80 Q15 100 10 130" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M40 80 Q65 100 70 125" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Right pterodactyl silhouette — reversed stomp glide */}
          <div
            className="dino-stomp-reverse absolute top-16 right-0 w-20 sm:w-28 pointer-events-none opacity-30"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M50 30 Q20 5 0 15 Q20 25 35 28 Q20 35 0 45 Q20 38 35 32 Q42 40 50 30Z" fill="#d97706"/>
              <path d="M50 30 Q80 5 100 15 Q80 25 65 28 Q80 35 100 45 Q80 38 65 32 Q58 40 50 30Z" fill="#d97706"/>
              <ellipse cx="50" cy="26" rx="6" ry="8" fill="#b45309"/>
              <path d="M50 18 L54 10 L56 18" fill="#b45309"/>
            </svg>
          </div>

          {/* Prehistoric spore particles */}
          {[
            { top: "20%", left: "8%",  right: undefined, size: 5, delay: "0s",   dur: "4.5s" },
            { top: "45%", left: "5%",  right: undefined, size: 3, delay: "1.2s", dur: "6s"   },
            { top: "30%", left: undefined, right: "12%", size: 4, delay: "0.5s", dur: "5s"   },
            { top: "65%", left: undefined, right: "8%",  size: 3, delay: "2s",   dur: "7s"   },
            { top: "15%", left: undefined, right: "20%", size: 3, delay: "3s",   dur: "5.5s" },
          ].map((f, i) => (
            <div
              key={i}
              className="spore-float absolute rounded-full pointer-events-none"
              style={{
                top: f.top,
                left: f.left,
                right: f.right,
                width: f.size,
                height: f.size,
                background: "radial-gradient(circle, #fbbf24 0%, #ea580c 60%, transparent 100%)",
                boxShadow: `0 0 ${f.size * 2}px rgba(234,88,12,0.9)`,
                animationDelay: f.delay,
                animationDuration: f.dur,
                zIndex: 1,
              }}
            />
          ))}

          {/* Volcano orb — lava pulse */}
          <div
            className="volcano-pulse absolute top-12 right-8 sm:right-16 lg:right-24 w-20 h-20 sm:w-28 sm:h-28 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle at 35% 35%, #fbbf24 0%, #ea580c 45%, #dc2626 80%, #7f1d1d 100%)",
              zIndex: 1,
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.25) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* T-Rex silhouette peek */}
          <div
            className="dino-roar absolute top-6 right-0 w-16 sm:w-20 pointer-events-none opacity-25"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 100 Q22 75 24 55 Q26 40 28 28 Q30 18 36 12 Q42 6 48 10 Q54 14 52 22 Q50 30 44 32 Q50 34 52 40 Q54 46 50 50 Q46 54 40 52 Q38 62 36 75 Q34 88 32 100" fill="#92400e"/>
              <ellipse cx="44" cy="16" rx="10" ry="7" fill="#92400e"/>
              <path d="M44 9 L42 3 L46 3 L44 9" fill="#92400e"/>
              <circle cx="48" cy="14" r="1.5" fill="#1a0a00"/>
              <path d="M36 22 L30 18 L32 26" fill="#78350f"/>
              <path d="M20 100 L24 88 L18 85 L14 100" fill="#92400e"/>
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
                  className="block italic lava-shimmer-text"
                  style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
                >
                  Dino Hunt
                </span>
                <span
                  className="letter-drop block"
                  style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
                >
                  {Array.from("Field Day 🦕").map((ch, i) => (
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
                One wild Friday at Sage Field. Dig for dino bones, paint your own dinosaur, make a real fossil, and hunt for dino eggs!
              </motion.p>

              {/* Quick-detail pills */}
              <motion.div
                className="flex flex-wrap gap-2 justify-center lg:justify-start mb-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
              >
                {[
                  { icon: "📅", text: "Jul 10, 2026" },
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
                  until dino day 🦕
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
                  🦕 Reserve Your Spot →
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
                    Dino Hunt ✦ Jul 10
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Wave divider at bottom of hero → white */}
          <WaveDivider fill="white" fromColor="#1a0800" />
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
                🦕 This Friday&apos;s Theme
              </span>
              <h2
                className="font-heading font-bold text-slate-800 mb-3 leading-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Five Hours of Prehistoric Fun
              </h2>
              <p className="text-base text-slate-500 font-body max-w-xl mx-auto">
                Dino Dig · Dino Painting · Fossil Making · Dino Egg Hunt
              </p>
            </motion.div>

            {/* Activity cards — flip on hover */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-12">
              {DINO_ACTIVITIES.map((activity, i) => (
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
              fill="#1a0a00"
            />
          </svg>
        </div>

        {/* ─── WEEK RECAP ───────────────────────────────────────────────────── */}
        <WeekRecapPreview className="bg-[#1a0a00]" variant="dark" />

        {/* Wave out of recap */}
        <div style={{ background: "#1a0a00", marginTop: "-1px", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,0 1080,40 1440,20 L1440,40 L0,40 Z"
              fill="#2d0f00"
            />
          </svg>
        </div>

        {/* ─── REGISTRATION FORM ────────────────────────────────────────────── */}
        <section
          id="reserve"
          className="py-20 px-6 sm:px-12 lg:px-16"
          style={{
            background:
              "linear-gradient(180deg, #2d0f00 0%, #3d1a00 40%, #1a0500 100%)",
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
              <div className="text-5xl mb-3">🦕</div>
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
                        : `🦕 Pay $${(60 + processingFee).toFixed(2)} & Reserve My Spot →`}
                    </button>
                  </motion.div>
                </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Wave before packing list */}
        <div style={{ background: "#1a0500", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z"
              fill="#2d0f00"
            />
          </svg>
        </div>

        {/* ─── PACKING LIST ─────────────────────────────────────────────────── */}
        <section
          className="py-16 px-6 sm:px-12 lg:px-16"
          style={{ background: "#2d0f00" }}
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
                Pack Your Dino Pack
              </h2>
              <p className="text-sm text-amber-200/70 font-body mt-1">
                Tap each item to check it off — don&apos;t forget anything for Dino Hunt!
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
                          ? "#ea580c"
                          : "#ca8a04",
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
                  🦕 All packed! Ready for the dino hunt.
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-sm text-amber-200/50 font-body text-center mt-6">
              Questions? Text or call us: (512) 677-5872
            </p>
          </div>
        </section>

        {/* Wave before bottom CTA */}
        <div style={{ background: "#2d0f00", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,0 1080,40 1440,20 L1440,40 L0,40 Z"
              fill="#1a0500"
            />
          </svg>
        </div>

        {/* ─── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <section
          className="py-24 px-6 sm:px-12 lg:px-16 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #1a0500 0%, #2d0f00 50%, #1a0a00 100%)",
          }}
        >
          {/* Decorative spores */}
          {[
            { top: "15%", left: "10%",  right: undefined, size: 5, delay: "0s"   },
            { top: "70%", left: undefined, right: "12%",  size: 4, delay: "1.8s" },
            { top: "40%", left: "4%",   right: undefined, size: 3, delay: "0.8s" },
          ].map((f, i) => (
            <div
              key={i}
              className="spore-float absolute rounded-full pointer-events-none"
              style={{
                top: f.top,
                left: f.left,
                right: f.right,
                width: f.size,
                height: f.size,
                background: "radial-gradient(circle, #fbbf24 0%, #ea580c 60%, transparent 100%)",
                boxShadow: `0 0 ${f.size * 2}px rgba(234,88,12,0.9)`,
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
              <div className="dino-roar text-5xl mb-6 inline-block">🦕</div>
              <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full mb-6">
                <span className="text-white/90 text-xs font-semibold font-body uppercase tracking-wider">
                  This Friday Only · Jul 10
                </span>
              </div>
              <h2
                className="font-heading font-bold text-white mb-4 leading-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Don&apos;t miss Dino Hunt.
              </h2>
              <p className="text-white/80 font-body text-base mb-8 leading-relaxed max-w-md mx-auto">
                July 10 is one day. Spots are limited. Reserve your child&apos;s
                spot now and join us for a day of fossil digging, dino painting,
                and a dino egg hunt at Sage Field.
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
                🦕 Dino Hunt · Jul 10
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
                      Dino Hunt Participant Agreement
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
                        Location: Round Rock, Texas · Dino Hunt: July 10,
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
                        I understand that my child is participating in a Dino
                        Hunt Field Day at an outdoor education program where
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
                        with my child&apos;s participation in the Dino Hunt
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
                        Dino Hunt Field Day, I release and hold harmless the
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
