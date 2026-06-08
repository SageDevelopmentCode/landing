"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CheckCircle,
  PenLine,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  Leaf,
  Shield,
  Heart,
} from "lucide-react";
import { Dancing_Script } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import { formatPhone } from "../utils/formatPhone";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

// ─── Image Arrays ─────────────────────────────────────────────────────────────

const WEEK1_IMAGES = [
  "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  "/assets/highlights/summer_week_one/79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG",
  "/assets/highlights/summer_week_one/2B9964FA-0047-4590-880C-095C315B7DE8.JPG",
  "/assets/highlights/summer_week_one/AB176A40-3DE2-4856-8E87-2D169FB3F41A.JPG",
  "/assets/highlights/summer_week_one/341400BF-486B-43A0-912E-84623B6299D6.JPG",
  "/assets/highlights/summer_week_one/DDDA3AA2-CDF9-42CF-B8FF-AD61CED60065 2.JPG",
  "/assets/highlights/summer_week_one/1D2BF4A6-5081-4D51-B1E8-F6E0E3D820B3.JPG",
  "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2.JPG",
  "/assets/highlights/summer_week_one/8018F647-AC55-4EE0-9D25-0F326D805ED8 4.jpg",
  "/assets/highlights/summer_week_one/58982292-CDE7-4E77-B528-0F01DB604DF7 2.JPG",
  "/assets/highlights/summer_week_one/E96A3688-D421-43A9-B8CA-93D6B881E555.JPG",
];

const WEEK2_IMAGES = [
  "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  "/assets/highlights/summer_week_two/24E4F2AF-5C30-4C23-9B09-8EA71093A1FD.JPG",
  "/assets/highlights/summer_week_two/570FEA28-D009-4038-B966-EAF9E0C9EE73.JPG",
  "/assets/highlights/summer_week_two/6B95C9E4-E145-49CA-8818-7AFC9B3B8353.JPG",
  "/assets/highlights/summer_week_two/E3AE964D-CC01-41A0-B040-35DCCB27CD4C.JPG",
  "/assets/highlights/summer_week_two/8DC65D50-316D-44DA-88AA-128F72DF019B.JPG",
  "/assets/highlights/summer_week_two/DC1D10EF-768E-48E1-AFA9-B935172FA14B.JPG",
  "/assets/highlights/summer_week_two/5B961697-D097-476C-9D47-09F547042841.JPG",
];

const CAROUSEL_IMAGES = [...WEEK1_IMAGES, ...WEEK2_IMAGES];
const GALLERY_INITIAL_COUNT = 9;

// ─── Week 2 Highlights ────────────────────────────────────────────────────────

const WEEK2_PRIMARY_HIGHLIGHTS = [
  {
    emoji: "📖",
    label: "CVC Words & Phonemic Awareness",
    desc: "Listening for sounds, identifying letters, building emerging reader confidence",
  },
  {
    emoji: "🔠",
    label: "Capital & Lowercase Letters",
    desc: "Practicing letter associations and recognition every day",
  },
  {
    emoji: "➕",
    label: "Addition: Counting On",
    desc: "Hands-on games and group work to build number sense",
  },
  {
    emoji: "🎨",
    label: "Color Mixing & Sensory Art",
    desc: "Mud kitchen experiments exploring what happens when colors combine",
  },
  {
    emoji: "🍝",
    label: "Homemade Pasta",
    desc: "Measuring, mixing, and learning from a beautifully flopped batch",
  },
  {
    emoji: "🧃",
    label: "Strawberry Limeade Popsicles",
    desc: "Experimenting with flavors and taking pride in the result",
  },
  {
    emoji: "🌱",
    label: "Growing Independence",
    desc: "More initiative and confidence than Week 1",
  },
];

const WEEK2_ELEM_HIGHLIGHTS = [
  {
    emoji: "➕",
    label: "Addition & Subtraction with Regrouping",
    desc: "Carrying over and borrowing across multiple digits",
  },
  {
    emoji: "📝",
    label: "Main Idea & Supporting Details",
    desc: "Cone = main idea, ice cream scoops = supporting details",
  },
  {
    emoji: "🦁",
    label: "Animal Research Project",
    desc: "National Geographic books → rough draft → revised banner",
  },
  {
    emoji: "✏️",
    label: "Revise & Edit",
    desc: "Rough draft Tuesday, revised and transferred to banner Thursday",
  },
  {
    emoji: "📚",
    label: "Differentiated Groups",
    desc: "Same focus, split by academic level to meet each learner's needs",
  },
];

// ─── Who It's For ─────────────────────────────────────────────────────────────

const WHO_ITS_FOR = [
  {
    icon: BookOpen,
    headline: "Switching from traditional school",
    body: "If your child has been in conventional classrooms and you're wondering what else is possible, a shadow day makes the contrast unmistakable.",
  },
  {
    icon: Leaf,
    headline: "Curious about Montessori or Waldorf",
    body: "You've read about child-led learning. Now your child can actually live a day of it and tell you if it fits them.",
  },
  {
    icon: Users,
    headline: "Looking for the right community",
    body: "Small classes mean every child is known by name. Come see whether Sage Field's families and values feel like home.",
  },
  {
    icon: Heart,
    headline: "Your child needs something different",
    body: "If traditional school hasn't been the right fit — whether for learning style, pace, or simply joy — this day exists for you.",
  },
];

// ─── Packing List ─────────────────────────────────────────────────────────────

const PACKING_LIST = [
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "🩱", item: "Swimsuit + towel" },
  { emoji: "👕", item: "Change of clothes" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🦟", item: "Bug spray" },
  { emoji: "🥪", item: "Snack + lunch from home" },
];

// ─── Week 1 Highlights ────────────────────────────────────────────────────────

const WEEK1_EARLY_HIGHLIGHTS = [
  {
    emoji: "📖",
    label: "Letter Sounds & CVC Reading",
    desc: "Building phonics foundations through hands-on practice",
  },
  {
    emoji: "✏️",
    label: "Handwriting & Number Sense",
    desc: "Fine motor skills and early numeracy side by side",
  },
  {
    emoji: "➕",
    label: "Early Addition",
    desc: "Introducing addition concepts through play and manipulatives",
  },
  {
    emoji: "💧",
    label: "Water Cycle & Filtration",
    desc: "Science exploration that sparked curiosity all week",
  },
  {
    emoji: "🎨",
    label: "Art Creation",
    desc: "Self-expression through color, texture, and imagination",
  },
  {
    emoji: "🐥",
    label: "Caring for Our Chicks",
    desc: "Responsibility and empathy through animal care",
  },
  {
    emoji: "🎵",
    label: "Rhythm & Note Recognition",
    desc: "Music foundations woven into every morning",
  },
];

const WEEK1_ELEM_HIGHLIGHTS = [
  {
    emoji: "🔢",
    label: "Place Value Mastery",
    desc: "Expanded, word, and model forms — plus comparing numbers",
  },
  {
    emoji: "🎲",
    label: "Collaborative Math Game",
    desc: "Wrapped up the week by applying what we learned together",
  },
  {
    emoji: "📚",
    label: "SWBST Comprehension",
    desc: "Somebody, Wanted, But, So, Then — a framework for deep reading",
  },
  {
    emoji: "✍️",
    label: "Vocabulary & Sentence Structure",
    desc: "Building strong writing skills from the ground up",
  },
  {
    emoji: "🔄",
    label: "Synonyms & Antonyms",
    desc: "Expanding word knowledge through exploration",
  },
  {
    emoji: "📝",
    label: "Recipe Card Writing",
    desc: "Real experiences turned into structured, creative writing",
  },
];

// ─── Activities & Risks (for Agreement) ──────────────────────────────────────

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

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const SHADOW_FAQS = [
  {
    question: "Why does a shadow day cost $20?",
    answer:
      "The $20 fee ensures we can give every visiting child real teacher attention, materials, and a full outdoor experience — not a rushed tour. It also means we can keep the class environment exactly as it would be on any normal school day.",
    highlight: true,
  },
  {
    question:
      "What happens to the enrollment fee if we enroll after the shadow day?",
    answer:
      "Enrollment at Sage Field is $500 (the school year enrollment fee) — and if you submit an enrollment application within 5 days of your child's shadow day, we waive it entirely. You pay nothing to enroll. No codes. No forms. We just honor it.",
    highlight: false,
  },
  {
    question: "What should my child bring?",
    answer:
      "Comfortable clothes they can get dirty in, closed-toe shoes (they'll be outdoors), a swimsuit and towel, a water bottle, a packed lunch, sunscreen already applied, and bug spray. We'll confirm specifics when we confirm your booking.",
    highlight: false,
  },
  {
    question: "What ages and grades can shadow?",
    answer:
      "Shadow days are open to children ages 4–11 (Pre-K through roughly 5th grade). Each child spends the day with their closest age group at Sage Field.",
    highlight: false,
  },
  {
    question: "What if the day doesn't feel like a fit?",
    answer:
      "That's completely fine. Ms. Sabrina will still spend time with you at pickup sharing honest observations about what she noticed and where your child might thrive. There's no pressure — just a real conversation.",
    highlight: false,
  },
];

// ─── Calendar Constants & Helpers ─────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CALENDAR_TODAY = new Date();
CALENDAR_TODAY.setHours(0, 0, 0, 0);

const CAL_MAX_DATE = new Date(2026, 7, 13);
CAL_MAX_DATE.setHours(0, 0, 0, 0);
const CAL_MAX_MONTH = 7;
const CAL_MAX_YEAR = 2026;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isAvailableDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 4;
}

function isPastCalDate(date: Date): boolean {
  return date < CALENDAR_TODAY || date > CAL_MAX_DATE;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isDateSelected(date: Date, selected: Date | null): boolean {
  return selected !== null && date.toDateString() === selected.toDateString();
}

function isCalToday(date: Date): boolean {
  return date.toDateString() === CALENDAR_TODAY.toDateString();
}

// ─── CalendarGrid ─────────────────────────────────────────────────────────────

function CalendarGrid({
  selectedDate,
  onSelectDate,
  calendarMonth,
  calendarYear,
  onPrevMonth,
  onNextMonth,
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  calendarMonth: number;
  calendarYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const startOffset = getFirstDayOfMonth(calendarYear, calendarMonth);
  const isPrevDisabled =
    calendarYear === CALENDAR_TODAY.getFullYear() &&
    calendarMonth <= CALENDAR_TODAY.getMonth();
  const isNextDisabled =
    calendarYear === CAL_MAX_YEAR && calendarMonth >= CAL_MAX_MONTH;

  const totalCells = startOffset + daysInMonth;
  const paddedCells = Math.ceil(totalCells / 7) * 7;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={isPrevDisabled}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-base font-bold font-heading text-gray-800">
          {MONTHS[calendarMonth]} {calendarYear}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={isNextDisabled}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-xs font-semibold text-gray-400 uppercase text-center py-1 font-body"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: paddedCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > daysInMonth) {
            return <div key={idx} />;
          }
          const date = new Date(calendarYear, calendarMonth, dayNum);
          const past = isPastCalDate(date);
          const available = isAvailableDay(date) && !past;
          const selected = isDateSelected(date, selectedDate);
          const todayCell = isCalToday(date);

          return (
            <button
              type="button"
              key={idx}
              onClick={() => available && onSelectDate(date)}
              disabled={!available}
              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-body transition-all duration-150 ${
                selected
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : available
                    ? todayCell
                      ? "text-primary font-semibold ring-2 ring-primary/30 hover:bg-primary/10"
                      : "text-gray-700 hover:bg-primary/10 hover:text-primary cursor-pointer"
                    : "text-gray-300 cursor-not-allowed"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SelectedDayChip ──────────────────────────────────────────────────────────

function SelectedDayChip({ date }: { date: Date | null }) {
  return (
    <AnimatePresence>
      {date && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-4 flex items-center gap-3 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3"
        >
          <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-sage-700 font-body">
            {formatShortDate(date)} · Full Day · 9:00 AM – 3:00 PM
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-gray-900 placeholder:text-gray-500 bg-white";

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3 font-body">
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShadowPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [sigPrintedName, setSigPrintedName] = useState("");
  const [sigValue, setSigValue] = useState("");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    childName: "",
    childAge: "",
    referralSource: "",
    notes: "",
    emergencyName: "",
    emergencyPhone: "",
    consentOutdoor: false,
    consentPhoto: false,
    interestedInEnrollment: false,
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(CALENDAR_TODAY.getMonth());
  const [calendarYear, setCalendarYear] = useState(
    CALENDAR_TODAY.getFullYear(),
  );

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (calendarYear === CAL_MAX_YEAR && calendarMonth >= CAL_MAX_MONTH) return;
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

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

  const isFormValid =
    !!formData.parentName.trim() &&
    !!formData.email.trim() &&
    !!formData.childName.trim() &&
    !!formData.childAge &&
    formData.consentOutdoor &&
    selectedDate !== null;

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
      const res = await fetch("/api/shadow-day-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          childName: formData.childName,
          childAge: Number(formData.childAge),
          selectedDate: selectedDate!.toISOString().split("T")[0],
          referralSource: formData.referralSource,
          notes: formData.notes,
          emergencyName: formData.emergencyName,
          emergencyPhone: formData.emergencyPhone,
          consentOutdoor: formData.consentOutdoor,
          consentPhoto: formData.consentPhoto,
          interestedInEnrollment: formData.interestedInEnrollment,
          signatureName: sigPrintedName,
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
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = formData.childName;
  const guardianName = formData.parentName;
  const notesForAgreement = formData.notes;
  const photoConsent = formData.consentPhoto;
  const emergencyName = formData.emergencyName;
  const emergencyPhone = formData.emergencyPhone;

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkStyle={true} />

      {/* ── Hero ── */}
      <section className="bg-sage-50 pt-20">
        <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-14 lg:py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left — content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-4">
              Let Your Child{" "}
              <span className="text-primary">Live a Day Here.</span>
            </h1>

            <p className="text-lg text-gray-500 font-body leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
              Your child deserves to feel what learning can feel like. A Shadow
              Day is a full school day at Sage Field — real lessons, real
              outdoor time, real lunch with classmates. Not a tour. An
              experience.
            </p>

            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
              {[
                { icon: "📅", text: "Mon–Thu Only" },
                { icon: "🕗", text: "Full Day 9AM–3PM" },
                { icon: "👧", text: "Ages 4–11" },
                { icon: "💰", text: "$20 Shadow Day" },
                { icon: "📍", text: "Round Rock TX" },
              ].map((pill) => (
                <span
                  key={pill.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-sage-200 rounded-full text-xs font-semibold text-gray-700 font-body shadow-sm"
                >
                  {pill.icon} {pill.text}
                </span>
              ))}
            </div>

            <div className="flex flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={scrollToForm}
                className="whitespace-nowrap px-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer text-sm"
              >
                Book Your Shadow Day →
              </button>
              <a
                href="#timeline"
                className="whitespace-nowrap px-6 py-3.5 border-2 border-sage-300 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body text-sm"
              >
                See What a Day Looks Like
              </a>
            </div>

            {/* Early-bird teaser */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex justify-center lg:justify-start mt-5"
            >
              <div className="inline-flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-base">🎁</span>
                <p className="text-xs text-amber-800 font-body leading-snug">
                  Shadow families who enroll within 5 days get the{" "}
                  <span className="font-bold text-amber-900">
                    $500 enrollment fee fully waived.
                  </span>
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — photo mosaic */}
          <motion.div
            className="w-full lg:w-auto lg:flex-1 max-w-sm sm:max-w-md lg:max-w-none"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/assets/highlights/summer_week_two/570FEA28-D009-4038-B966-EAF9E0C9EE73.JPG"
                  alt="Students at Sage Field"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 300px"
                  priority
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src="/assets/highlights/summer_week_one/79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG"
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 200px"
                    priority
                  />
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src="/assets/highlights/summer_week_one/58982292-CDE7-4E77-B528-0F01DB604DF7 2.JPG"
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 200px"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Photo Strip Carousel ── */}
      <div className="bg-sage-50">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-72 flex-shrink-0 aspect-[4/3] overflow-hidden"
            >
              <Image
                src={src}
                alt="Students at Sage Field"
                fill
                className="object-cover"
                sizes="288px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Combined W1 + W2 Recap ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Weeks 1 &amp; 2 in Review
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              A Glimpse of What Kids Do Here
            </h2>
            <p className="text-base text-gray-500 font-body leading-relaxed max-w-2xl">
              Two weeks in — here&apos;s a real look at what your child would
              experience at Sage Field. Real academics, real cooking, real
              community.
            </p>
          </motion.div>
        </div>

        {/* Static photo gallery with See More toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="max-w-4xl mx-auto mb-10"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {CAROUSEL_IMAGES.slice(0, GALLERY_INITIAL_COUNT).map((src) => (
              <div
                key={src}
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm"
              >
                <Image
                  src={src}
                  alt="Students at Sage Field"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <AnimatePresence>
            {galleryExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-2 sm:mt-3">
                {CAROUSEL_IMAGES.slice(GALLERY_INITIAL_COUNT).map((src, i) => (
                  <motion.div
                    key={src}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                  >
                    <Image
                      src={src}
                      alt="Students at Sage Field"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="mt-4 text-center">
            <button
              onClick={() => setGalleryExpanded((prev) => !prev)}
              className="text-sm text-primary font-semibold underline-offset-2 hover:underline transition-colors duration-150 font-body"
            >
              {galleryExpanded
                ? "Show fewer photos"
                : `See all ${CAROUSEL_IMAGES.length} photos →`}
            </button>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            {/* Left panel — Primary / Early Learners */}
            <div className="bg-sage-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">🌱</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-gray-800 leading-tight">
                    Primary / Early Learners
                  </h3>
                  <p className="text-[11px] text-gray-400 font-body">
                    Ages 4–7
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Week 1 — Early Learners */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full font-body">
                      Week 1
                    </span>
                  </div>
                  <h4 className="text-xs font-bold font-heading text-gray-700 mb-2">
                    Early Learners
                  </h4>
                  <ul className="space-y-1.5">
                    {WEEK1_EARLY_HIGHLIGHTS.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5 flex-shrink-0">
                          {item.emoji}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-800 font-body leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-gray-400 font-body">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Week 2 — Primary */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-sage-100 text-sage-700 text-[10px] font-bold rounded-full font-body">
                      Week 2
                    </span>
                  </div>
                  <h4 className="text-xs font-bold font-heading text-gray-700 mb-2">
                    Primary
                  </h4>
                  <ul className="space-y-1.5">
                    {WEEK2_PRIMARY_HIGHLIGHTS.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5 flex-shrink-0">
                          {item.emoji}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-800 font-body leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-gray-400 font-body">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right panel — Elementary */}
            <div className="bg-sage-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">📐</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-gray-800 leading-tight">
                    Elementary
                  </h3>
                  <p className="text-[11px] text-gray-400 font-body">
                    Ages 8–11
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Week 1 — Elementary */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full font-body">
                      Week 1
                    </span>
                  </div>
                  <h4 className="text-xs font-bold font-heading text-gray-700 mb-2">
                    Elementary
                  </h4>
                  <ul className="space-y-1.5">
                    {WEEK1_ELEM_HIGHLIGHTS.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5 flex-shrink-0">
                          {item.emoji}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-800 font-body leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-gray-400 font-body">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Week 2 — Elementary */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-sage-100 text-sage-700 text-[10px] font-bold rounded-full font-body">
                      Week 2
                    </span>
                  </div>
                  <h4 className="text-xs font-bold font-heading text-gray-700 mb-2">
                    Elementary
                  </h4>
                  <ul className="space-y-1.5">
                    {WEEK2_ELEM_HIGHLIGHTS.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <span className="text-sm leading-none mt-0.5 flex-shrink-0">
                          {item.emoji}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-800 font-body leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-gray-400 font-body">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <Link
              href="/highlights/summer/week-1"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
            >
              View Full Week 1 Recap →
            </Link>
            <Link
              href="/highlights/summer/week-2"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg border border-gray-200 hover:bg-sage-50 transition-colors duration-200 shadow-sm hover:shadow-md font-body text-sm"
            >
              View Full Week 2 Recap →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Who This Is For ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Is This Right for Us?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              Shadow Days Are Made for These Families
            </h2>
            <p className="text-base text-gray-500 font-body">
              You don&apos;t need to be sold. You need to see it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHO_ITS_FOR.map(({ icon: Icon, headline, body }, i) => (
              <motion.div
                key={headline}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white border border-sage-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-sage-50 rounded-xl border border-sage-200 flex items-center justify-center mb-4 shadow-sm">
                  <Icon className="w-5 h-5 text-sage-600" />
                </div>
                <h4 className="text-base font-bold font-heading text-gray-800 mb-2">
                  {headline}
                </h4>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Early-Bird Enrollment Fee Block ── */}
      <section className="py-20 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="relative bg-white rounded-3xl shadow-xl border-2 border-sage-200 overflow-hidden"
          >
            {/* Left accent stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-sage-500" />

            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Left panel */}
              <div className="md:col-span-3 p-8 md:p-10 pl-10 md:pl-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-sage-50 border border-sage-200 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-sage-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-sage-600 font-body">
                    Early-Bird Offer
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold font-heading text-gray-800 leading-tight mb-5">
                  Enroll Within 5 Days of Your Shadow Day — Your $500 Enrollment
                  Fee Is Waived.
                </h3>
                <p className="text-base text-gray-600 font-body leading-relaxed mb-6">
                  Enrollment at Sage Field is $500 — the school year enrollment
                  fee. Shadow families who decide quickly get that fee waived
                  entirely — a thank-you for choosing Sage Field without
                  hesitation. You already saw it. You already felt it. This is
                  just our way of honoring that. No codes. No forms. We apply it
                  automatically.
                </p>
                <div className="flex items-start gap-3 bg-sage-50 border border-sage-200 rounded-xl p-4">
                  <Shield className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 font-body leading-relaxed">
                    No enrollment pressure. If your child loves what they
                    experience and you&apos;re ready within 5 days, we simply
                    waive the enrollment fee entirely.
                  </p>
                </div>
              </div>

              {/* Right panel */}
              <div className="md:col-span-2 bg-sage-50 border-t-2 md:border-t-0 md:border-l-2 border-sage-200 p-8 md:p-10 flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wide text-gray-400 font-body mb-5">
                  Enrollment Fee
                </p>

                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-4xl font-bold font-heading text-gray-300 line-through decoration-red-300">
                    $500
                  </span>
                  <span className="text-sage-400 text-2xl">→</span>
                  <span className="text-5xl font-bold font-heading text-emerald-600">
                    $0
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-body mb-8">
                  if you enroll within 5 days of your shadow day
                </p>

                <div className="bg-white rounded-xl border border-sage-200 p-4">
                  <div className="flex items-start justify-between gap-1">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                      <div className="w-7 h-7 rounded-full bg-sage-100 border border-sage-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-sage-700 font-body">
                          1
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 font-body leading-tight">
                        Shadow Day
                      </p>
                      <p className="text-[10px] text-gray-400 font-body">
                        $20 fee
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center pt-2 flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-sage-300" />
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                      <div className="w-7 h-7 rounded-full bg-sage-100 border border-sage-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-sage-700 font-body">
                          2
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 font-body leading-tight">
                        Enroll within
                      </p>
                      <p className="text-[10px] text-gray-400 font-body">
                        5 days
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center pt-2 flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-sage-300" />
                    </div>

                    {/* Step 3 — highlighted */}
                    <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-white font-body">
                          3
                        </span>
                      </div>
                      <p className="text-xs font-bold text-primary font-body leading-tight">
                        $0 Enrollment
                      </p>
                      <p className="text-[10px] text-gray-400 font-body">
                        fee fully waived
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Registration Form ── */}
      <section id="reserve" className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div ref={formRef} className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4 font-body">
              Reserve Your Spot
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              Book Your Shadow Day
            </h2>
            <p className="text-gray-500 font-body text-base">
              Takes 60 seconds. $20 holds your spot. Waived if you enroll.
            </p>
          </motion.div>

          <AnimatePresence>
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="sm:bg-white sm:rounded-2xl sm:p-8 sm:shadow-sm sm:border sm:border-gray-100"
              >
                <SectionLabel>Your Info</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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

                <SectionLabel>Your Child</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Child&apos;s name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="childName"
                      value={formData.childName}
                      onChange={handleChange}
                      placeholder="First and last name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                      Child&apos;s age <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="childAge"
                      value={formData.childAge}
                      onChange={handleChange}
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

                <SectionLabel>Preferred Shadow Day</SectionLabel>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <CalendarGrid
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    calendarMonth={calendarMonth}
                    calendarYear={calendarYear}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                  />
                  <SelectedDayChip date={selectedDate} />
                </div>

                <SectionLabel>A Bit More</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                        "I'm okay with photos of my child being taken and shared on Sage Field's social media",
                    },
                    {
                      name: "interestedInEnrollment" as const,
                      checked: formData.interestedInEnrollment,
                      label:
                        "I'd love to learn more about joining Sage Field regularly",
                    },
                  ].map(({ name, checked, label }) => (
                    <label
                      key={name}
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 flex-shrink-0 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                          checked
                            ? "bg-primary border-primary"
                            : "border-gray-300 bg-white"
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
                      <span className="text-sm text-gray-600 font-body leading-snug">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Agreement + Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-6 space-y-3"
                >
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                      agreementSigned
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-dashed border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {agreementSigned ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <PenLine className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-bold font-heading text-gray-800">
                          Shadow Day Agreement
                        </p>
                        <p className="text-xs text-gray-400 font-body">
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
                      className="text-xs font-semibold text-primary font-body hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ml-2"
                    >
                      {agreementSigned ? "View" : "Review & Sign →"}
                    </button>
                  </div>
                  {!isFormValid && !agreementSigned && (
                    <p className="text-xs text-gray-400 font-body text-center">
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
                    className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer shadow-md hover:shadow-lg text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {submitting ? "Submitting…" : "Book My Shadow Day — $20 →"}
                  </button>
                </motion.div>
              </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Packing List ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50/40">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Day-of Checklist
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading">
              What to Pack for Your Shadow Day
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACKING_LIST.map((item, i) => (
              <motion.div
                key={item.item}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                <span className="text-sm font-body text-gray-700 font-semibold">
                  {item.item}
                </span>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-gray-400 font-body text-center mt-6">
            Questions? Text or call us: (512) 677-5872
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-sage-50 border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-4 font-body">
              Common Questions
            </span>
            <h2 className="text-3xl font-bold font-heading text-gray-800 mb-3">
              Before You Book
            </h2>
            <p className="text-gray-500 font-body">
              Everything families ask before their child&apos;s shadow day.
            </p>
          </motion.div>

          <div className="space-y-3">
            {SHADOW_FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
                  faq.highlight ? "border-amber-200" : "border-gray-100"
                }`}
              >
                <button
                  onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer focus:outline-none"
                >
                  <span className="text-sm font-semibold text-gray-800 font-body pr-4">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: faqOpenIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-primary" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {faqOpenIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.28,
                        ease: "easeInOut" as const,
                      }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-gray-600 font-body leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Shadow Day · $20
            </span>
            <h2 className="font-heading text-3xl font-bold text-gray-800 mb-3">
              Ready to see if this is the right fit?
            </h2>
            <p className="text-gray-500 font-body mb-8 leading-relaxed">
              Let your child be the judge. Book a shadow day and see what
              learning feels like when it&apos;s built around how they actually
              think.
            </p>
            <button
              onClick={scrollToForm}
              className="px-10 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg font-body text-base cursor-pointer"
            >
              Book Your Shadow Day — $20 →
            </button>
            <p className="text-xs text-gray-400 font-body mt-4">
              $20 shadow day fee · Enroll within 5 days and your $500 enrollment
              fee is fully waived.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ── Mobile sticky bottom bar ── */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" as const }}
      >
        <div className="bg-primary rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">
              Shadow Day · $20
            </p>
            <p className="text-white/80 font-body text-xs">
              Mon–Thu · 9 AM–3 PM
            </p>
          </div>
          <button
            onClick={scrollToForm}
            className="flex-shrink-0 bg-white text-primary font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-welcome-bg transition-colors duration-200 cursor-pointer"
          >
            Book Now →
          </button>
        </div>
      </motion.div>

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

      {/* ── Shadow Day Agreement Drawer ── */}
      <AnimatePresence>
        {agreementOpen && (
          <div className={dancingScript.variable}>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAgreementOpen(false)}
            />

            {/* Drawer */}
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
                    Shadow Day Participant Agreement
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
                  {/* School info header */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold font-heading text-gray-800">
                      Sage Field Private Microschool
                    </p>
                    <p className="text-xs text-gray-500 font-body">
                      Location: Round Rock, Texas · Shadow Day Date: Mon–Thu by
                      appointment
                    </p>
                  </div>

                  {/* Pre-filled participant info */}
                  <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { label: "Student Name", value: studentName || "—" },
                        {
                          label: "Parent / Guardian",
                          value: guardianName || "—",
                        },
                        {
                          label: "Emergency Contact",
                          value: emergencyName
                            ? `${emergencyName}${emergencyPhone ? ` · ${emergencyPhone}` : ""}`
                            : "—",
                        },
                        {
                          label: "Photo Consent",
                          value: photoConsent
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
                    {notesForAgreement && (
                      <div className="border-t border-gray-200 pt-3 mt-1">
                        <p className="text-xs font-semibold text-gray-400 font-body mb-1">
                          Medical / Notes
                        </p>
                        <p className="text-sm text-gray-700 font-body leading-relaxed">
                          {notesForAgreement}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 1. Acknowledgment of Program Activities */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="1. Acknowledgment of Program Activities" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I understand that my child is participating in a Shadow
                      Day at an outdoor education program where children learn
                      through active exploration, hands-on experiences, and
                      supervised outdoor activities. Activities may include, but
                      are not limited to:
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
                      I understand that these activities involve inherent risks
                      that cannot be completely eliminated while preserving the
                      educational and developmental benefits of participation.
                    </p>
                  </div>

                  {/* 2. Assumption of Risk */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="2. Assumption of Risk" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I knowingly and voluntarily assume all risks associated
                      with my child&apos;s participation in the Shadow Day,
                      including but not limited to:
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

                  {/* 3. Release of Liability */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="3. Release of Liability" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      In consideration of my child&apos;s participation in the
                      Shadow Day, I release and hold harmless the School, its
                      owners, directors, employees, contractors, volunteers,
                      agents, and representatives from any claims, demands,
                      causes of action, damages, losses, costs, or expenses
                      arising out of or related to my child&apos;s
                      participation.
                    </p>
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      This release applies to all claims based upon ordinary
                      negligence but does not apply to claims arising from gross
                      negligence, reckless conduct, or intentional misconduct.
                    </p>
                  </div>

                  {/* 4. Medical Authorization */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="4. Medical Authorization" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      I authorize school personnel to obtain emergency medical
                      treatment for my child if I cannot be reached promptly. I
                      understand that:
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
                    {notesForAgreement && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-amber-700 font-body mb-1">
                          Allergies, Medical Conditions, or Special Notes
                        </p>
                        <p className="text-sm text-amber-800 font-body">
                          {notesForAgreement}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Photography and Media Release */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="5. Photography and Media Release" />
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                        photoConsent
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span className="text-lg">
                        {photoConsent ? "✅" : "🚫"}
                      </span>
                      <p className="text-sm font-body text-gray-700">
                        {photoConsent
                          ? "I authorize the School to photograph and/or record my child and use such images or recordings for educational, promotional, website, social media, and marketing purposes."
                          : "I do not authorize the School to use photographs or recordings of my child."}
                      </p>
                    </div>
                  </div>

                  {/* 6. Emergency Contact */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="6. Emergency Contact Authorization" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      If the parent or guardian cannot be reached, the following
                      individual is authorized to make emergency decisions
                      regarding the child:
                    </p>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 font-body">
                            Name
                          </p>
                          <p className="text-sm text-gray-800 font-body">
                            {emergencyName || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 font-body">
                            Phone
                          </p>
                          <p className="text-sm text-gray-800 font-body">
                            {emergencyPhone || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Parent Acknowledgment & Signature */}
                  <div className="flex flex-col gap-4">
                    <AgreementSectionHeader title="7. Parent Acknowledgment & Signature" />
                    <p className="text-sm text-gray-600 font-body leading-relaxed">
                      By signing below, I confirm that I have read this
                      Agreement in its entirety and understand its contents. I
                      understand that participation in outdoor educational
                      activities involves inherent risks and that I am
                      voluntarily permitting my child to participate. I certify
                      that I am the parent or legal guardian of the child named
                      above and have authority to execute this Agreement.
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
                            onChange={(e) => setSigPrintedName(e.target.value)}
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
  );
}
