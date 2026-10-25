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
import {
  isShadowDayBookable,
  SHADOW_CAL_MAX,
  SHADOW_CAL_MIN,
} from "@/app/lib/academic-calendar-data";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

// ─── Image Arrays ─────────────────────────────────────────────────────────────

const WEEK8_IMAGES = [
  "/assets/highlights/school_week_eight/55472D86-11D0-4665-9263-D88E6DD8BCC0.JPG",
  "/assets/highlights/school_week_eight/75DB2D5E-0D14-4F2B-9A8E-F3BB46011A8C.JPG",
  "/assets/highlights/school_week_eight/2313D82D-FDDB-405E-B126-A3D2F8535C14.JPG",
  "/assets/highlights/school_week_eight/12BA5C32-5A55-4546-9780-936ADFE81CD4.JPG",
  "/assets/highlights/school_week_eight/62F3ACE5-FB5D-433D-9A38-C65CED1FDD7C.JPG",
  "/assets/highlights/school_week_eight/C56A5ED2-BB79-43B6-A073-A8CA5E12BDFF.JPG",
  "/assets/highlights/school_week_eight/A74450BE-1E7C-40C1-8E90-4791D847F939.JPG",
  "/assets/highlights/school_week_eight/E0C8FFD0-A9C1-4C3F-95A2-5CAC259400EC.JPG",
  "/assets/highlights/school_week_eight/014C2A1B-4E36-4A24-93A7-29854C856E90.JPG",
  "/assets/highlights/school_week_eight/1ACD0A6E-BE06-48C6-9925-D9CA75E4D31B.JPG",
  "/assets/highlights/school_week_eight/3381E67D-508A-4516-887C-279A6A615851.JPG",
  "/assets/highlights/school_week_eight/3CFF9370-8290-47DA-AB68-AAE4C80DEDD4.JPG",
  "/assets/highlights/school_week_eight/3FCF48F8-2E23-4B9B-8B40-24ED8C0C2757.JPG",
  "/assets/highlights/school_week_eight/4DB07FA9-6E6E-46DA-A885-884969440DD2.JPG",
  "/assets/highlights/school_week_eight/8617B92B-591B-410F-B3A0-E2767B7458B5.JPG",
  "/assets/highlights/school_week_eight/90907B25-7288-4882-A6C6-5CC0891CD672.JPG",
  "/assets/highlights/school_week_eight/9FABA5E8-0D39-483F-B621-6FDB461DBA44.JPG",
  "/assets/highlights/school_week_eight/A5DE52D7-4673-4447-BC64-8DD00521AFF4.JPG",
  "/assets/highlights/school_week_eight/D52D07CB-9A24-4231-B7D6-924F9DE1958A.JPG",
  "/assets/highlights/school_week_eight/E7405D91-8984-4818-804C-3E00CA19D87D.JPG",
];

const WEEK9_IMAGES = [
  "/assets/highlights/school_week_nine/EF809D8C-9404-455C-B3B8-5EBCEBC0C6E4.JPG",
  "/assets/highlights/school_week_nine/5B61166D-C91A-4B79-ADD8-FF06B9A30B0F.JPG",
  "/assets/highlights/school_week_nine/6B50348E-40ED-4F55-B432-7FF6D9CA7C78.JPG",
  "/assets/highlights/school_week_nine/1F53EF70-F050-4AC6-A304-822E5EE2EDFF.JPG",
  "/assets/highlights/school_week_nine/11366F5C-7187-4C36-AD89-0687FBD291F0.JPG",
  "/assets/highlights/school_week_nine/F32080E0-3521-4AFF-A57D-54150F08E7B3.JPG",
  "/assets/highlights/school_week_nine/4D18C974-C767-4B38-82A3-5789268778A9.JPG",
  "/assets/highlights/school_week_nine/C86640D6-7F20-421C-89B3-6775099A18B3.JPG",
  "/assets/highlights/school_week_nine/1DF11F47-FF45-4C6C-ACBF-8FA1737F6448.JPG",
  "/assets/highlights/school_week_nine/23D69F7B-0A07-4C1F-A85B-881631471A46.JPG",
  "/assets/highlights/school_week_nine/3C9B5D66-E3A1-4F28-BE70-4524DB18BD5D.JPG",
  "/assets/highlights/school_week_nine/5AFDF08A-7240-47DD-B624-BB700019463A.JPG",
  "/assets/highlights/school_week_nine/8349A5F5-F987-4F93-A954-E193A45B76ED.JPG",
  "/assets/highlights/school_week_nine/A4819157-73A1-4806-A16B-B3B8BF7B24E0.JPG",
  "/assets/highlights/school_week_nine/A8D2814B-BFF0-4078-ADB0-1269ACDB72B5.JPG",
  "/assets/highlights/school_week_nine/B983A704-FB05-4F6D-B8BF-B27961F5D816.JPG",
  "/assets/highlights/school_week_nine/E6076A38-FD2A-4161-BB15-DAEDBC9F368B.JPG",
];

const CAROUSEL_IMAGES = [...WEEK8_IMAGES, ...WEEK9_IMAGES];

const GALLERY_INITIAL_COUNT = 9;

// ─── Week 9 Highlights ────────────────────────────────────────────────────────

const WEEK9_PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🚛",
    label: "Force & Motion",
    desc: "Garbage trucks, speed, and community helpers who keep neighborhoods clean",
  },
  {
    emoji: "♻️",
    label: "Recycling & Literacy",
    desc: "Counting, number recognition, and CVC spelling tied to real-world inquiry",
  },
  {
    emoji: "👀",
    label: "Skid-Mark Science",
    desc: "Noticing pavement marks sparked talk about fast and slow movement",
  },
  {
    emoji: "🎵",
    label: "Music & Movement",
    desc: "Songs on log cushions and joyful rhythm in the Primary space",
  },
];

const WEEK9_LOWER_ELEM_HIGHLIGHTS = [
  {
    emoji: "🎃",
    label: "Summerween",
    desc: "Pumpkin muffins in the morning and one last sunny water day",
  },
  {
    emoji: "➖",
    label: "Subtraction Stories",
    desc: "Word problems with pictures, expanded form, and standard subtraction",
  },
  {
    emoji: "🇺🇸",
    label: "American Symbols",
    desc: "Statue of Liberty and the bald eagle on currency, seals, and documents",
  },
  {
    emoji: "⚗️",
    label: "Matter Changes",
    desc: "Physical vs. chemical change with real-life examples",
  },
];

const WEEK9_UPPER_ELEM_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Stations",
    desc: "Small-group lessons and review with hands-on fraction tools",
  },
  {
    emoji: "✍️",
    label: "Persuasive Writing",
    desc: "Convincing paragraphs with reasons — creative Halloween opinions",
  },
  {
    emoji: "💤",
    label: "Why We Dream",
    desc: "Reading comprehension with highlighted key details on anchor charts",
  },
  {
    emoji: "🎨",
    label: "Clay & Music",
    desc: "Sculpting in art and live guitar songs during music time",
  },
];

// ─── Week 8 Highlights ────────────────────────────────────────────────────────

const WEEK8_PRIMARY_HIGHLIGHTS = [
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

const WEEK8_LOWER_ELEM_HIGHLIGHTS = [
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

const WEEK8_UPPER_ELEM_HIGHLIGHTS = [
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

// ─── Who It's For ─────────────────────────────────────────────────────────────

const WHO_ITS_FOR = [
  {
    icon: BookOpen,
    headline: "Your child sits in a classroom all day",
    body: "At Sage Field, mornings are real academics — reading, writing, and math at your child's actual level. Afternoons are nature, cooking, animals, and art. It's a full school day, just built differently.",
  },
  {
    icon: Leaf,
    headline: "You want real learning, not just busy work",
    body: "We teach by ability, not grade. A 7-year-old and a 9-year-old can sit together and each work at the level where they actually are. No one gets left behind. No one gets bored waiting.",
  },
  {
    icon: Users,
    headline: "You want your child to actually be known",
    body: "With about 10 kids per class and mixed ages, there's no hiding. Every child has a name, a role, and a relationship with the teacher. Come see what that actually looks like in a day.",
  },
  {
    icon: Heart,
    headline: "Traditional school hasn't felt right",
    body: "Whether it's the pace, the structure, the size, or just the feeling — if your child hasn't thrived yet, a shadow day will tell you more than any website can.",
  },
];

// ─── Packing List ─────────────────────────────────────────────────────────────

const PACKING_LIST = [
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "👕", item: "Change of clothes" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🦟", item: "Bug spray" },
  { emoji: "🥪", item: "Snack + lunch from home" },
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
    question: "What should my child bring?",
    answer:
      "Comfortable clothes they can get dirty in, closed-toe shoes (they'll be outdoors), a water bottle, a packed lunch, sunscreen already applied, and bug spray. We'll confirm specifics when we confirm your booking.",
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

const CAL_MIN_YEAR = SHADOW_CAL_MIN.getFullYear();
const CAL_MIN_MONTH = SHADOW_CAL_MIN.getMonth();
const CAL_MAX_YEAR = SHADOW_CAL_MAX.getFullYear();
const CAL_MAX_MONTH = SHADOW_CAL_MAX.getMonth();

function getMinCalendarMonth(): { year: number; month: number } {
  if (CALENDAR_TODAY < SHADOW_CAL_MIN) {
    return { year: CAL_MIN_YEAR, month: CAL_MIN_MONTH };
  }
  if (CALENDAR_TODAY > SHADOW_CAL_MAX) {
    return { year: CAL_MAX_YEAR, month: CAL_MAX_MONTH };
  }
  return {
    year: CALENDAR_TODAY.getFullYear(),
    month: CALENDAR_TODAY.getMonth(),
  };
}

function getInitialCalendarMonth(): { year: number; month: number } {
  return getMinCalendarMonth();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isCalToday(date: Date): boolean {
  return date.toDateString() === CALENDAR_TODAY.toDateString();
}

function isCalendarMonthAtMin(year: number, month: number): boolean {
  const min = getMinCalendarMonth();
  return year < min.year || (year === min.year && month <= min.month);
}

function isCalendarMonthAtMax(year: number, month: number): boolean {
  return (
    year > CAL_MAX_YEAR ||
    (year === CAL_MAX_YEAR && month >= CAL_MAX_MONTH)
  );
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
  const isPrevDisabled = isCalendarMonthAtMin(calendarYear, calendarMonth);
  const isNextDisabled = isCalendarMonthAtMax(calendarYear, calendarMonth);

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

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase text-center py-1 font-body"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: paddedCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > daysInMonth) {
            return <div key={idx} />;
          }
          const date = new Date(calendarYear, calendarMonth, dayNum);
          const available = isShadowDayBookable(date, CALENDAR_TODAY);
          const selected = isDateSelected(date, selectedDate);
          const todayCell = isCalToday(date);

          return (
            <button
              type="button"
              key={idx}
              onClick={() => available && onSelectDate(date)}
              disabled={!available}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs sm:text-sm font-body transition-all duration-150 ${
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
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-base text-gray-900 placeholder:text-gray-500 bg-white";

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
    referralSource: "",
    notes: "",
    emergencyName: "",
    emergencyPhone: "",
    consentOutdoor: false,
    consentPhoto: false,
    interestedInEnrollment: false,
  });

  const [children, setChildren] = useState([{ name: "", age: "" }]);

  const addChild = () => setChildren((prev) => [...prev, { name: "", age: "" }]);
  const removeChild = (i: number) =>
    setChildren((prev) => prev.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: "name" | "age", value: string) =>
    setChildren((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );

  const totalBase = children.length * 20;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const initialCalendar = getInitialCalendarMonth();
  const [calendarMonth, setCalendarMonth] = useState(initialCalendar.month);
  const [calendarYear, setCalendarYear] = useState(initialCalendar.year);

  useEffect(() => {
    if (selectedDate && !isShadowDayBookable(selectedDate, CALENDAR_TODAY)) {
      setSelectedDate(null);
    }
  }, [selectedDate]);

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (isCalendarMonthAtMax(calendarYear, calendarMonth)) return;
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  const galleryRef = useRef<HTMLDivElement>(null);
  const desktopGalleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs = [galleryRef, desktopGalleryRef];
    refs.forEach((r) => {
      if (r.current) r.current.scrollLeft = 0;
    });
    let pos = 0;
    const tick = () => {
      pos += 0.6;
      refs.forEach((r) => {
        const el = r.current;
        if (el) {
          el.scrollLeft = Math.round(pos);
        }
      });
      const activeEl = refs
        .map((r) => r.current)
        .find((el) => el && el.scrollWidth > el.clientWidth);
      if (activeEl && activeEl.scrollLeft >= activeEl.scrollWidth / 2) {
        pos = 0;
        refs.forEach((r) => {
          if (r.current) r.current.scrollLeft = 0;
        });
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
    children.length > 0 &&
    children.every((c) => !!c.name.trim() && !!c.age) &&
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
          children: children.map((c) => ({ name: c.name, age: Number(c.age) })),
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

  const guardianName = formData.parentName;
  const notesForAgreement = formData.notes;
  const photoConsent = formData.consentPhoto;
  const emergencyName = formData.emergencyName;
  const emergencyPhone = formData.emergencyPhone;

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkStyle={true} />

      {/* ── Mobile-only carousel — above heading ── */}
      <div className="sm:hidden pt-20 bg-sage-50">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-[88%] shrink-0 aspect-[4/3] overflow-hidden"
            >
              <Image
                src={src}
                alt="Students at Sage Field"
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="bg-sage-50 sm:pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-10 lg:py-20 flex flex-col lg:flex-row items-center gap-6 lg:gap-16">
          {/* Left — content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-4">
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

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={scrollToForm}
                className="w-full sm:w-auto whitespace-nowrap text-center px-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer text-sm"
              >
                Book a Shadow Day →
              </button>
              <a
                href="#timeline"
                className="w-full sm:w-auto whitespace-nowrap text-center px-6 py-3.5 border-2 border-sage-300 text-gray-600 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body text-sm"
              >
                See a Day in Action
              </a>
            </div>

          </motion.div>

          {/* Right — photo mosaic (desktop only) */}
          <motion.div
            className="hidden lg:block lg:flex-1"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="/assets/highlights/school_week_nine/EF809D8C-9404-455C-B3B8-5EBCEBC0C6E4.JPG"
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
                    src="/assets/highlights/school_week_eight/55472D86-11D0-4665-9263-D88E6DD8BCC0.JPG"
                    alt="Students at Sage Field"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 200px"
                    priority
                  />
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src="/assets/highlights/school_week_nine/5B61166D-C91A-4B79-ADD8-FF06B9A30B0F.JPG"
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

      {/* ── Photo Strip Carousel (desktop only — mobile gets the carousel above the heading) ── */}
      <div className="hidden sm:block bg-sage-50">
        <div
          ref={desktopGalleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((src, i) => (
            <div
              key={i}
              className="relative w-52 sm:w-64 lg:w-72 shrink-0 aspect-[4/3] overflow-hidden"
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
      <section className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Weeks 8 &amp; 9 in Review
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              A Glimpse of What Kids Do Here
            </h2>
            <p className="text-base text-gray-500 font-body leading-relaxed max-w-2xl">
              Weeks eight and nine — here&apos;s a real look at what your child
              would experience at Sage Field. Real academics, real cooking, real
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

        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            {[
              {
                emoji: "🌱",
                title: "Primary",
                subtitle: "Pre-K & Kindergarten",
                iconBg: "bg-primary/10",
                week8: WEEK8_PRIMARY_HIGHLIGHTS,
                week9: WEEK9_PRIMARY_HIGHLIGHTS,
              },
              {
                emoji: "✨",
                title: "Lower Elementary",
                subtitle: "1st & 2nd Grade",
                iconBg: "bg-sage-100",
                week8: WEEK8_LOWER_ELEM_HIGHLIGHTS,
                week9: WEEK9_LOWER_ELEM_HIGHLIGHTS,
              },
              {
                emoji: "📐",
                title: "Upper Elementary",
                subtitle: "3rd & 4th Grade",
                iconBg: "bg-sky-100",
                week8: WEEK8_UPPER_ELEM_HIGHLIGHTS,
                week9: WEEK9_UPPER_ELEM_HIGHLIGHTS,
              },
            ].map((band) => (
              <div key={band.title} className="bg-sage-50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-7 h-7 ${band.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-xs">{band.emoji}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-heading text-gray-800 leading-tight">
                      {band.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-body">
                      {band.subtitle}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full font-body">
                        Week 8
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {band.week8.map((item) => (
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
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 bg-sage-100 text-sage-700 text-[10px] font-bold rounded-full font-body">
                        Week 9
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {band.week9.map((item) => (
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
            ))}
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <Link
              href="/highlights/school-year/week-8"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
            >
              View Full Week 8 Recap →
            </Link>
            <Link
              href="/highlights/school-year/week-9"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg border border-gray-200 hover:bg-sage-50 transition-colors duration-200 shadow-sm hover:shadow-md font-body text-sm"
            >
              View Full Week 9 Recap →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Who This Is For ── */}
      <section className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-sage-50">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
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

      {/* ── Registration Form ── */}
      <section id="reserve" className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-sage-50">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              Book Your Shadow Day
            </h2>
            <p className="text-gray-500 font-body text-base">
              Takes 60 seconds. $20 holds your spot.
            </p>
          </motion.div>

          <AnimatePresence>
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sm:p-8"
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

                <SectionLabel>
                  Your Child{children.length > 1 ? "ren" : ""}{" "}
                  <span className="text-gray-400 normal-case font-normal text-[10px] ml-1">
                    $20 per child
                  </span>
                </SectionLabel>
                <div className="space-y-4">
                  {children.map((child, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-400 font-body uppercase tracking-wide">
                          Child {i + 1}
                        </p>
                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(i)}
                            className="text-xs text-gray-400 hover:text-red-400 font-body transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
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
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-body cursor-pointer"
                  >
                    + Add Another Child
                  </button>

                  {children.length > 1 && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 rounded-xl">
                      <span className="text-sm font-bold text-primary font-body">
                        {children.length} children · ${totalBase} total
                      </span>
                    </div>
                  )}
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
                    {submitting ? "Submitting…" : `Book My Shadow Day — $${totalBase} →`}
                  </button>
                </motion.div>
              </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Packing List ── */}
      <section className="py-12 px-4 sm:py-16 sm:px-8 lg:px-16 bg-sage-50/40">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 font-heading">
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
      <section className="py-12 px-4 sm:py-20 sm:px-8 lg:px-16 bg-white">
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
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-gray-800 mb-3">
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
      <section className="py-12 px-4 sm:py-20 sm:px-8 lg:px-16 bg-sage-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Shadow Day · $20
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
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
              $20 shadow day fee
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ── Mobile sticky bottom bar ── */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
            className="shrink-0 bg-white text-primary font-semibold text-sm font-body px-5 py-3 rounded-xl hover:bg-welcome-bg transition-colors duration-200 cursor-pointer"
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
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
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
                  <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-4 py-4 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        {
                          label: children.length > 1 ? "Children" : "Student Name",
                          value: children.map((c) => c.name).filter(Boolean).join(", ") || "—",
                        },
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-base text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
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
                              className="cursor-pointer w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-base font-body text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
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
                            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
