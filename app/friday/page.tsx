"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Check, CheckCircle, PenLine, X } from "lucide-react";
import { Bebas_Neue, Dancing_Script, Rye } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import WeekRecapPreview from "../components/WeekRecapPreview";
import { formatPhone } from "../utils/formatPhone";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/shared/billing/school-year";

const FRIDAY_DROPIN_DOLLARS = FUN_FRIDAY_DROPIN_CENTS / 100;

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const rye = Rye({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rye",
});

const HERO_IMAGES = [
  "/assets/highlights/summer_week_three/4C53798C-920D-4497-B46C-1037E6FF21E4.JPG",
  "/assets/highlights/summer_week_five/0C6AE07E-0553-4A7F-A9F8-9D8B02C3803C.JPG",
  "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
];

const CAROUSEL_IMAGES = [
  "/assets/highlights/summer_week_three/5DD49FD0-D35F-4411-8171-65D816CA4934.JPG",
  "/assets/highlights/summer_week_five/9190B0AA-8EB6-409D-ABC2-737B7BD129B0.JPG",
  "/assets/highlights/summer_week_four/8B8A8CAF-47F1-415E-B12D-0C1E2B5942FC.JPG",
  "/assets/highlights/summer_week_three/B6F3BF45-573E-4C9E-90C7-DF0802E13E0E.JPG",
  "/assets/highlights/summer_week_five/D5C814F8-8BBF-48B5-8A7D-9C7C53512FAB.JPG",
  "/assets/highlights/summer_week_one/341400BF-486B-43A0-912E-84623B6299D6.JPG",
  "/assets/highlights/summer_week_four/27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG",
  "/assets/highlights/summer_week_three/4591E194-779B-46AC-A893-B9E75B6D64A7.JPG",
];

const WILD_WEST_ACTIVITIES = [
  {
    emoji: "📜",
    title: "Wanted Posters",
    desc: "Design your own old-west wanted poster — pick your outlaw alias, add your mugshot, and set the reward!",
    accent: "#f5e6c8",
    accentText: "#8b3a1a",
  },
  {
    emoji: "⭐",
    title: "Sheriff Badges",
    desc: "Craft and decorate a shiny sheriff badge, then pin it on for the rest of the day.",
    accent: "#fef3c7",
    accentText: "#c9a227",
  },
  {
    emoji: "🐴",
    title: "Stick Horses",
    desc: "Build and decorate stick horses, then gallop around the Sage Gulch range.",
    accent: "#fff7ed",
    accentText: "#6b3a2a",
  },
  {
    emoji: "💰",
    title: "The Great Robbery",
    desc: "Team game across the field — plan the heist, chase the bandits, and recover the treasure chest!",
    accent: "#f0f9ff",
    accentText: "#4a6741",
  },
];

const PACKING_LIST = [
  { emoji: "👢", item: "Closed-toe shoes or boots for ranch trails" },
  { emoji: "👕", item: "Old clothes + optional bandana" },
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🥪", item: "Snack + lunch from home" },
  { emoji: "🎒", item: "Small backpack for badge & creations" },
  { emoji: "🤠", item: "Optional cowboy hat" },
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
  "w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-[#c9a227] focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-400 bg-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-[#8b3a1a]/70 uppercase tracking-wider mt-6 mb-3 font-body">
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

  // Enhancement: sheriff badge tap
  const [badgePinned, setBadgePinned] = useState(false);
  // Enhancement: cursor trail
  const [cursorTrail, setCursorTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const cursorTrailId = useRef(0);
  // Enhancement: card shake
  const [shakingCards, setShakingCards] = useState<Set<number>>(new Set());
  // Enhancement: mesa scroll parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const mesaX = useTransform(scrollY, [0, 400], ["0%", "-60%"]);
  const mesaOpacity = useTransform(scrollY, [0, 300], [0.35, 0]);

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
    const target = new Date("2026-09-04T08:30:00-05:00");
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

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++cursorTrailId.current;
    setCursorTrail((prev) => [...prev.slice(-7), { id, x, y }]);
    setTimeout(() => {
      setCursorTrail((prev) => prev.filter((p) => p.id !== id));
    }, 1000);
  }, [isMobile]);

  const handleCardFlip = useCallback((i: number) => {
    toggleCard(i);
    setShakingCards((prev) => {
      const n = new Set(prev);
      n.add(i);
      return n;
    });
    setTimeout(() => {
      setShakingCards((prev) => {
        const n = new Set(prev);
        n.delete(i);
        return n;
      });
    }, 400);
  }, []);

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

  const totalBase = children.length * FRIDAY_DROPIN_DOLLARS;
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
        @keyframes tumbleweed-roll {
          0%, 100% { transform: rotate(-5deg) translateX(0); transform-origin: center center; }
          50%       { transform: rotate(5deg) translateX(12px); transform-origin: center center; }
        }
        @keyframes tumbleweed-roll-reverse {
          0%, 100% { transform: rotate(3deg) translateX(0); transform-origin: center center; }
          50%       { transform: rotate(-6deg) translateX(-10px); transform-origin: center center; }
        }
        @keyframes dust-drift {
          0%   { transform: translate(0, 0) scale(1);      opacity: 0.5; }
          25%  { transform: translate(8px, -18px) scale(1.1); opacity: 0.8; }
          50%  { transform: translate(-5px, -30px) scale(0.9); opacity: 0.3; }
          75%  { transform: translate(12px, -14px) scale(1.05); opacity: 0.7; }
          100% { transform: translate(0, 0) scale(1);      opacity: 0.5; }
        }
        @keyframes badge-gleam {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes letter-drop {
          0%   { opacity: 0; transform: translateY(-24px) scale(0.85); filter: blur(4px); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.04); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,162,39,0.6), 0 0 0 0 rgba(139,58,26,0.3); }
          50%       { box-shadow: 0 0 0 14px rgba(201,162,39,0.15), 0 0 0 28px rgba(139,58,26,0.06); }
        }
        @keyframes badge-bounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes stampede-rumble {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-2px); }
          40%  { transform: translateX(2px); }
          60%  { transform: translateX(-1px); }
          80%  { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
        .wanted-headline {
          color: #c9a227;
          -webkit-text-stroke: 2px #2d1b0e;
          paint-order: stroke fill;
          text-shadow:
            0 2px 0 #2d1b0e,
            0 0 24px rgba(201, 162, 39, 0.2);
        }
        @media (max-width: 640px) {
          .wanted-headline {
            -webkit-text-stroke: 1.5px #2d1b0e;
          }
        }
        .tumbleweed-roll         { animation: tumbleweed-roll 8s ease-in-out infinite; }
        .tumbleweed-roll-reverse { animation: tumbleweed-roll-reverse 9s ease-in-out infinite; }
        .dust-drift              { animation: dust-drift 5s ease-in-out infinite; }
        .badge-gleam             { animation: badge-gleam 1.2s ease-in-out infinite; }
        .badge-pulse             { animation: badge-pulse 3s ease-in-out infinite; }
        .badge-bounce            { animation: badge-bounce 2.5s ease-in-out infinite; }
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
        @keyframes horseshoe-stamp {
          from { opacity: 0; transform: scale(0) rotate(var(--rot)); }
          to   { opacity: 0.4; transform: scale(1) rotate(var(--rot)); }
        }
        @keyframes digit-pop {
          0%   { opacity: 0; transform: translateY(-10px) scale(0.8); }
          60%  { opacity: 1; transform: translateY(2px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes star-fade {
          0%   { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
        .digit-pop { animation: digit-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .parchment-texture {
          background-color: #f5e6c8;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(212,165,116,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(139,58,26,0.06) 0%, transparent 40%),
            linear-gradient(rgba(139,58,26,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,58,26,0.04) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
        }
        @media (prefers-reduced-motion: reduce) {
          .tumbleweed-roll,
          .tumbleweed-roll-reverse,
          .dust-drift,
          .badge-gleam,
          .badge-pulse,
          .badge-bounce,
          .letter-drop span { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className={`${bebasNeue.variable} ${rye.variable} min-h-screen bg-white overflow-x-hidden`}>
        <Navbar darkStyle={true} lightText={true} />

        {/* ─── HERO ─────────────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative pt-20 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #2d1b0e 0%, #5c3d2e 35%, #3d2914 65%, #2d1b0e 100%)",
          }}
          onMouseMove={handleHeroMouseMove}
        >
          {/* Left tumbleweed */}
          <div
            className="tumbleweed-roll absolute bottom-8 left-4 sm:left-12 w-10 sm:w-14 pointer-events-none opacity-50"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <circle cx="24" cy="24" r="14" fill="none" stroke="#8b6914" strokeWidth="2" />
              <line x1="24" y1="10" x2="24" y2="38" stroke="#8b6914" strokeWidth="1.5" />
              <line x1="10" y1="24" x2="38" y2="24" stroke="#8b6914" strokeWidth="1.5" />
              <line x1="14" y1="14" x2="34" y2="34" stroke="#8b6914" strokeWidth="1" />
              <line x1="34" y1="14" x2="14" y2="34" stroke="#8b6914" strokeWidth="1" />
            </svg>
          </div>

          {/* Right mesa silhouette — scroll parallax */}
          <motion.div
            className="absolute bottom-0 right-0 w-48 sm:w-72 pointer-events-none"
            style={{ zIndex: 1, x: mesaX, opacity: mesaOpacity }}
          >
            <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0,80 L0,55 L30,40 L55,50 L80,25 L110,35 L140,15 L170,30 L200,20 L200,80 Z" fill="#1a0f08" opacity="0.6" />
              <path d="M0,80 L0,60 L40,48 L70,55 L100,38 L130,45 L160,32 L200,40 L200,80 Z" fill="#2d1b0e" opacity="0.4" />
            </svg>
          </motion.div>

          {/* Desert dust particles */}
          {[
            { top: "20%", left: "8%",  right: undefined, size: 4, delay: "0s",   dur: "4.5s" },
            { top: "45%", left: "5%",  right: undefined, size: 3, delay: "1.2s", dur: "6s"   },
            { top: "30%", left: undefined, right: "12%", size: 4, delay: "0.5s", dur: "5s"   },
            { top: "65%", left: undefined, right: "8%",  size: 3, delay: "2s",   dur: "7s"   },
            { top: "15%", left: undefined, right: "20%", size: 3, delay: "3s",   dur: "5.5s" },
          ].map((f, i) => (
            <div
              key={i}
              className="dust-drift absolute rounded-full pointer-events-none"
              style={{
                top: f.top,
                left: f.left,
                right: f.right,
                width: f.size,
                height: f.size,
                background: "radial-gradient(circle, #d4a574 0%, #8b6914 60%, transparent 100%)",
                boxShadow: `0 0 ${f.size * 2}px rgba(212,165,116,0.5)`,
                animationDelay: f.delay,
                animationDuration: f.dur,
                zIndex: 1,
              }}
            />
          ))}

          {/* Rope border — top left */}
          <div
            className="absolute top-4 left-4 w-20 h-1 pointer-events-none opacity-40 rounded-full"
            style={{ background: "linear-gradient(90deg, #d4a574, #8b6914)", zIndex: 1 }}
          />

          {/* Horseshoe trail stamps */}
          {[
            { bottom: "12%", left: "8%",  rot: "-12deg", delay: "0.3s" },
            { bottom: "10%", left: "18%", rot: "8deg",   delay: "0.7s" },
            { bottom: "14%", left: "29%", rot: "-6deg",  delay: "1.1s" },
            { bottom: "9%",  left: "40%", rot: "10deg",  delay: "1.5s" },
            { bottom: "13%", left: "51%", rot: "-4deg",  delay: "1.9s" },
            { bottom: "10%", left: "62%", rot: "7deg",   delay: "2.3s" },
          ].map((fp, i) => (
            <div
              key={i}
              className="absolute pointer-events-none text-lg select-none"
              style={{
                bottom: fp.bottom,
                left: fp.left,
                ["--rot" as string]: fp.rot,
                opacity: 0,
                animation: `horseshoe-stamp 0.4s ease-out ${fp.delay} forwards`,
                zIndex: 1,
              }}
            >
              🐴
            </div>
          ))}

          {/* Star cursor trail */}
          {!isMobile && cursorTrail.map((pt) => (
            <div
              key={pt.id}
              className="absolute pointer-events-none text-sm select-none"
              style={{
                left: pt.x,
                top: pt.y,
                zIndex: 5,
                animation: "star-fade 1s ease-out forwards",
                transform: "translate(-50%, -50%)",
              }}
            >
              ⭐
            </div>
          ))}

          {/* Sheriff star badge — gleam pulse */}
          <div
            className="badge-pulse absolute top-12 right-8 sm:right-16 lg:right-24 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none flex items-center justify-center"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full badge-gleam">
              <polygon points="24,2 29,17 45,17 32,27 37,43 24,34 11,43 16,27 3,17 19,17" fill="#c9a227" stroke="#8b6914" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Cactus silhouette */}
          <div
            className="tumbleweed-roll-reverse absolute top-6 right-2 w-10 sm:w-12 pointer-events-none opacity-30"
            style={{ zIndex: 1 }}
          >
            <svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <rect x="16" y="20" width="8" height="35" rx="4" fill="#4a6741" />
              <rect x="8" y="28" width="8" height="6" rx="3" fill="#4a6741" />
              <rect x="6" y="22" width="6" height="14" rx="3" fill="#4a6741" />
              <rect x="24" y="32" width="8" height="6" rx="3" fill="#4a6741" />
              <rect x="28" y="26" width="6" height="14" rx="3" fill="#4a6741" />
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
                  className="block wanted-headline"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 5.5rem)",
                    fontFamily: "var(--font-bebas-neue), sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  Wild West
                </span>
                <span
                  className="letter-drop block"
                  style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
                >
                  {Array.from("Field Day 🤠").map((ch, i) => (
                    <span
                      key={i}
                      style={{
                        animationDelay: `${0.55 + i * 0.06}s`,
                        color: "#c9a227",
                      }}
                    >
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg text-stone-300 font-body leading-relaxed mb-7 max-w-md mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                One adventure-packed Friday at Sage Field. Design wanted posters, craft sheriff badges, build stick horses, and join The Great Robbery — a team game across the range!
              </motion.p>

              {/* Quick-detail pills */}
              <motion.div
                className="flex flex-wrap gap-2 justify-center lg:justify-start mb-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
              >
                {[
                  { icon: "📅", text: "Sept 4, 2026" },
                  { icon: "🕗", text: "Drop-off 8:30 AM" },
                  { icon: "🕒", text: "Pick-up 1:30 PM" },
                  { icon: "👧", text: "Ages 4–11" },
                  { icon: "💰", text: `$${FRIDAY_DROPIN_DOLLARS} per child` },
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
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={`${label}-${val}`}
                        className="text-xl font-bold text-white font-heading tabular-nums"
                        initial={{ opacity: 0, y: -10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {String(val).padStart(2, "0")}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[10px] text-[#d4a574] font-body uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
                <span className="text-xs text-[#d4a574] font-body pl-1">
                  until the wagon rolls out 🤠
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
                      "linear-gradient(135deg, #c9a227 0%, #8b3a1a 100%)",
                  }}
                >
                  🤠 Saddle Up & Reserve →
                </button>
                <a
                  href="#what-we-do"
                  className="px-7 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all duration-200 font-body text-sm text-center"
                >
                  See the Activities ↓
                </a>
              </motion.div>

              {/* Interactive sheriff badge */}
              <motion.div
                className="mt-6 flex flex-col items-center lg:items-start gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.45 }}
              >
                <button
                  onClick={() => setBadgePinned((v) => !v)}
                  className="relative text-5xl cursor-pointer select-none focus:outline-none"
                  style={{
                    animation: badgePinned ? "none" : "badge-bounce 2.5s ease-in-out infinite",
                    display: "inline-block",
                  }}
                  aria-label="Pin sheriff badge"
                >
                  {badgePinned ? "🤠" : "⭐"}
                </button>
                <AnimatePresence>
                  {badgePinned && (
                    <motion.span
                      className="text-sm font-bold text-[#c9a227] font-body"
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 12, stiffness: 200 } }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      You&apos;re the sheriff of Sage Gulch! ⭐
                    </motion.span>
                  )}
                </AnimatePresence>
                <p className="text-[11px] text-[#d4a574]/80 font-body">
                  {badgePinned ? "Badge pinned!" : "tap to pin your badge ⭐"}
                </p>
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
                  className="absolute w-44 sm:w-52 lg:w-56 bg-[#f5e6c8] p-2.5 pb-10 shadow-2xl rounded-sm"
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
                  className="absolute w-44 sm:w-52 lg:w-56 bg-[#f5e6c8] p-2.5 pb-10 shadow-2xl rounded-sm hover:-translate-y-2 hover:rotate-0 transition-all duration-300 cursor-pointer"
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
                  className="absolute w-44 sm:w-52 lg:w-56 bg-[#f5e6c8] p-2.5 pb-10 shadow-2xl rounded-sm hover:-translate-y-3 hover:rotate-0 transition-all duration-300 cursor-pointer"
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
                  <p className="text-center text-[10px] font-body text-[#8b3a1a] mt-1 tracking-wide uppercase">
                    Wild West ✦ Sept 4
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Wave divider at bottom of hero → white */}
          <WaveDivider fill="white" fromColor="#2d1b0e" />
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
          className="py-20 px-6 sm:px-12 lg:px-16 parchment-texture"
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
              <span
                className="inline-block px-5 py-2 bg-[#8b3a1a]/10 text-[#8b3a1a] text-sm font-bold rounded-full mb-5 font-body"
                style={{ fontFamily: "var(--font-rye), serif" }}
              >
                🤠 This Friday&apos;s Theme
              </span>
              <h2
                className="font-heading font-bold text-slate-800 mb-3 leading-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Five Hours in Sage Gulch
              </h2>
              <p className="text-base text-slate-500 font-body max-w-xl mx-auto">
                Wanted Posters · Sheriff Badges · Stick Horses · The Great Robbery
              </p>
            </motion.div>

            {/* Activity cards — flip on hover */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-12">
              {WILD_WEST_ACTIVITIES.map((activity, i) => (
                <motion.div
                  key={activity.title}
                  className="flip-card relative cursor-pointer"
                  style={{ perspective: "800px", minHeight: "180px" }}
                  initial={{ opacity: 0, y: 20, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.1 * i }}
                  whileTap={{ scale: [1, 1.08, 1] }}
                  onClick={() => handleCardFlip(i)}
                >
                  <div className={`flip-card-inner relative w-full h-full${flippedCards.has(i) ? " flipped" : ""}${shakingCards.has(i) ? " stampede-rumble" : ""}`} style={{ minHeight: "180px", animation: shakingCards.has(i) ? "stampede-rumble 0.4s ease" : undefined }}>
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
                      className="flip-back absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-6 text-center gap-3 border-2 border-[#8b6914]/30"
                      style={{ background: "#3d2914" }}
                    >
                      <span className="text-4xl">{activity.emoji}</span>
                      <h3 className="font-heading font-bold text-[#f5e6c8] text-base leading-tight">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-[#d4a574]/90 font-body leading-relaxed">
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
                background: "linear-gradient(135deg, #f5e6c8 0%, #fef3c7 100%)",
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {[
                { icon: "🕗", text: "Drop-off 8:30 AM" },
                { icon: "🕒", text: "Pick-up 1:30 PM" },
                { icon: "💰", text: `$${FRIDAY_DROPIN_DOLLARS} per child` },
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
        <div style={{ background: "#f5e6c8", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"
              fill="#2d1b0e"
            />
          </svg>
        </div>

        {/* ─── WEEK RECAP ───────────────────────────────────────────────────── */}
        <WeekRecapPreview className="bg-[#2d1b0e]" variant="dark" />

        {/* Wave out of recap */}
        <div style={{ background: "#2d1b0e", marginTop: "-1px", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,0 1080,40 1440,20 L1440,40 L0,40 Z"
              fill="#3d2914"
            />
          </svg>
        </div>

        {/* ─── REGISTRATION FORM ────────────────────────────────────────────── */}
        <section
          id="reserve"
          className="py-20 px-3 sm:px-12 lg:px-16"
          style={{
            background:
              "linear-gradient(180deg, #3d2914 0%, #5c3d2e 40%, #2d1b0e 100%)",
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
              <div className="text-5xl mb-3">🤠</div>
              <h2
                className="font-heading font-bold text-white mb-2"
                style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
              >
                Reserve Your Spot
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5e6c8] rounded-full mb-3">
                <span className="text-[#8b3a1a] font-bold font-body text-sm">
                  {`$${FRIDAY_DROPIN_DOLLARS} per child`}
                </span>
                <span className="text-[#c9a227]">·</span>
                <span className="text-[#6b3a2a] font-body text-sm">
                  No enrollment required
                </span>
                <span className="text-[#c9a227]">·</span>
                <span className="text-[#6b3a2a] font-body text-sm">
                  Limited spots
                </span>
              </div>
            </motion.div>

            <AnimatePresence>
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#f5e6c8]"
                  style={{ borderTop: "4px solid #c9a227" }}
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
                      {`$${FRIDAY_DROPIN_DOLLARS} per child`}
                    </span>
                  </SectionLabel>

                  <div className="space-y-4">
                    {children.map((child, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-[#8b3a1a]/70 font-body uppercase tracking-wide">
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
                      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-[#f5e6c8] rounded-xl">
                        <span className="text-sm font-bold text-[#8b3a1a] font-body">
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
                              ? "bg-[#c9a227] border-[#c9a227]"
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
                            ? "border-[#c9a227] bg-[#f5e6c8] text-[#8b3a1a]"
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
                            ? "border-[#c9a227] bg-[#f5e6c8] text-[#8b3a1a]"
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
                            ? "bg-[#c9a227] border-[#c9a227]"
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
                          <PenLine className="w-5 h-5 text-[#c9a227] flex-shrink-0" />
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
                          "linear-gradient(135deg, #c9a227 0%, #8b3a1a 100%)",
                      }}
                    >
                      {submitting
                        ? "Submitting…"
                        : `🤠 Pay $${(FRIDAY_DROPIN_DOLLARS + processingFee).toFixed(2)} & Reserve My Spot →`}
                    </button>
                  </motion.div>
                </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Wave before packing list */}
        <div style={{ background: "#2d1b0e", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z"
              fill="#3d2914"
            />
          </svg>
        </div>

        {/* ─── PACKING LIST ─────────────────────────────────────────────────── */}
        <section
          className="py-16 px-6 sm:px-12 lg:px-16"
          style={{ background: "#3d2914" }}
        >
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl mb-3">🤠</div>
              <h2
                className="font-heading font-bold text-white"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)" }}
              >
                Saddle Up Checklist
              </h2>
              <p className="text-sm text-[#d4a574]/70 font-body mt-1">
                Tap each item to check it off — don&apos;t forget anything for Wild West!
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
                        ? "bg-[#f5e6c8] border-[#c9a227] opacity-70"
                        : "bg-white border-[#f5e6c8] hover:shadow-md hover:-translate-y-0.5"
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
                          ? "#8b3a1a"
                          : i % 2 === 0
                          ? "#c9a227"
                          : "#8b6914",
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

            {/* Trail Readiness Progress Bar */}
            <div className="mt-6 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#d4a574] font-body uppercase tracking-wide">
                  Trail Readiness
                </span>
                <span className="text-xs text-[#d4a574]/60 font-body">
                  {packingChecked.size} / {PACKING_LIST.length} packed
                </span>
              </div>
              <div
                className="relative w-full h-5 rounded-full overflow-visible"
                style={{ background: "#2d1b0e" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(packingChecked.size / PACKING_LIST.length) * 100}%`,
                    background: "linear-gradient(90deg, #8b3a1a 0%, #c9a227 50%, #d4a574 100%)",
                    minWidth: packingChecked.size > 0 ? "20px" : "0px",
                  }}
                />
                {packingChecked.size > 0 && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-base pointer-events-none transition-all duration-500 ease-out"
                    style={{
                      left: `calc(${(packingChecked.size / PACKING_LIST.length) * 100}% - 12px)`,
                    }}
                  >
                    🤠
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence>
              {packingChecked.size === PACKING_LIST.length && (
                <motion.p
                  className="text-center text-[#d4a574] text-sm font-body mt-5 font-semibold"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  🤠 All saddled up! See you at high noon.
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-sm text-[#d4a574]/50 font-body text-center mt-6">
              Questions? Text or call us: (512) 677-5872
            </p>
          </div>
        </section>

        {/* Wave before bottom CTA */}
        <div style={{ background: "#3d2914", marginBottom: "-1px" }}>
          <svg
            viewBox="0 0 1440 40"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "40px", display: "block" }}
          >
            <path
              d="M0,20 C360,0 1080,40 1440,20 L1440,40 L0,40 Z"
              fill="#2d1b0e"
            />
          </svg>
        </div>

        {/* ─── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <section
          className="py-24 px-6 sm:px-12 lg:px-16 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #2d1b0e 0%, #3d2914 50%, #2d1b0e 100%)",
          }}
        >
          {/* Decorative dust particles */}
          {[
            { top: "15%", left: "10%",  right: undefined, size: 4, delay: "0s"   },
            { top: "70%", left: undefined, right: "12%",  size: 3, delay: "1.8s" },
            { top: "40%", left: "4%",   right: undefined, size: 3, delay: "0.8s" },
          ].map((f, i) => (
            <div
              key={i}
              className="dust-drift absolute rounded-full pointer-events-none"
              style={{
                top: f.top,
                left: f.left,
                right: f.right,
                width: f.size,
                height: f.size,
                background: "radial-gradient(circle, #d4a574 0%, #8b6914 60%, transparent 100%)",
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
              <div className="badge-gleam text-5xl mb-6 inline-block">🤠</div>
              <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full mb-6">
                <span className="text-white/90 text-xs font-semibold font-body uppercase tracking-wider">
                  This Friday Only · Sept 4
                </span>
              </div>
              <h2
                className="font-heading font-bold text-white mb-4 leading-tight"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
              >
                Don&apos;t miss Wild West.
              </h2>
              <p className="text-white/80 font-body text-base mb-8 leading-relaxed max-w-md mx-auto">
                September 4 is one day. Spots are limited. Reserve your child&apos;s
                spot now and join us for wanted posters, sheriff badges,
                stick horses, and The Great Robbery at Sage Field.
              </p>
              <button
                onClick={scrollToForm}
                className="px-10 py-4 bg-white text-[#8b3a1a] font-bold rounded-2xl hover:bg-[#f5e6c8] transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 font-body text-base cursor-pointer"
              >
                {`Reserve Spot · $${FRIDAY_DROPIN_DOLLARS} →`}
              </button>
              <p className="text-white/50 font-body text-xs mt-5">
                {`One Friday. $${FRIDAY_DROPIN_DOLLARS}. No commitment.`}
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
              background: "linear-gradient(135deg, #c9a227 0%, #8b3a1a 100%)",
            }}
          >
            <div>
              <p className="text-white font-heading font-bold text-sm leading-tight">
                🤠 Wild West · Sept 4
              </p>
              <p className="text-white/80 font-body text-xs">
                {`$${FRIDAY_DROPIN_DOLLARS} drop-in — limited spots`}
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="flex-shrink-0 bg-white text-[#8b3a1a] font-bold text-sm font-body px-4 py-2 rounded-xl hover:bg-[#f5e6c8] transition-colors duration-200 cursor-pointer"
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
                      Wild West Participant Agreement
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
                        Location: Round Rock, Texas · Wild West: September 4,
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
                        I understand that my child is participating in a Wild West
                        Field Day at an outdoor education program where
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
                        with my child&apos;s participation in the Wild West
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
                        Wild West Field Day, I release and hold harmless the
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                          <p className="text-xs font-semibold text-yellow-700 font-body mb-1">
                            Allergies, Medical Conditions, or Special Notes
                          </p>
                          <p className="text-sm text-yellow-800 font-body">
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
                      <PenLine className="w-4 h-4 text-[#c9a227]" />
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
