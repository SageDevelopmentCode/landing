"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Info,
  BookOpen,
  Users,
  HelpCircle,
  Eye,
  Sparkles,
  GraduationCap,
  Sun,
  School,
  Home,
  DollarSign,
  ClipboardList,
  Heart,
  ArrowRight,
  BookMarked,
  CalendarDays,
  MapPin,
  User,
  Mail,
  Handshake,
} from "lucide-react";
import ContactDialog from "./ContactDialog";
import WaitlistDialog from "./WaitlistDialog";

// ─── Data model ────────────────────────────────────────────────────────────

type NavAction =
  | { kind: "link"; href: string }
  | { kind: "smooth-scroll"; href: string }
  | { kind: "dialog"; target: "waitlist" | "contact" }
  | { kind: "disabled" };

interface NavLeaf {
  label: string;
  action: NavAction;
  badge?: "Coming Soon" | "Apr 18" | "New!";
  colorClass?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}

type NavTab =
  | {
      kind: "single";
      label: string;
      action: NavAction;
      highlight?: boolean;
      badge?: string;
    }
  | { kind: "dropdown"; label: string; items: NavLeaf[] };

const NAV_TABS: NavTab[] = [
  {
    kind: "dropdown",
    label: "About Us",
    items: [
      {
        label: "About Us",
        action: { kind: "link", href: "/about" },
        icon: Info,
        iconClass: "text-sky-500",
      },
      {
        label: "Our Story",
        action: { kind: "link", href: "/our-story" },
        icon: BookOpen,
        iconClass: "text-amber-500",
      },
      {
        label: "Our Team",
        action: { kind: "link", href: "/team" },
        icon: Users,
        iconClass: "text-violet-500",
      },
      {
        label: "Partnerships",
        action: { kind: "link", href: "/partnerships" },
        icon: Handshake,
        iconClass: "text-emerald-600",
      },
      {
        label: "FAQ",
        action: { kind: "link", href: "/faq" },
        icon: HelpCircle,
        iconClass: "text-slate-400",
      },
      {
        label: "Our Vision",
        action: { kind: "link", href: "/vision" },
        icon: Eye,
        iconClass: "text-teal-500",
      },
      {
        label: "What We Offer",
        action: { kind: "link", href: "/what-we-offer" },
        icon: Sparkles,
        iconClass: "text-pink-400",
      },
      {
        label: "Educational Philosophy",
        action: { kind: "link", href: "/educational-philosophy" },
        icon: GraduationCap,
        iconClass: "text-indigo-500",
      },
    ],
  },
  {
    kind: "dropdown",
    label: "Programs & Tuition",
    items: [
      {
        label: "Summer Program 2026",
        action: { kind: "link", href: "/summer-2026" },
        icon: Sun,
        iconClass: "text-yellow-400",
      },
      {
        label: "School Year 2026-2027",
        action: { kind: "link", href: "/school-year-2026-2027" },
        icon: School,
        iconClass: "text-blue-500",
      },
      {
        label: "Homeschool Drop-In",
        action: { kind: "link", href: "/homeschool" },
        icon: Home,
        iconClass: "text-green-500",
      },
      {
        label: "Tuition",
        action: { kind: "link", href: "/tuition" },
        icon: DollarSign,
        iconClass: "text-emerald-500",
      },
      {
        label: "Highlights",
        action: { kind: "link", href: "/highlights" },
        icon: Sparkles,
        iconClass: "text-primary",
      },
    ],
  },
  {
    kind: "dropdown",
    label: "Apply",
    items: [
      {
        label: "Apply for a Program",
        action: { kind: "link", href: "/apply" },
        icon: ClipboardList,
        iconClass: "text-orange-500",
      },
      {
        label: "Interest Form",
        action: { kind: "dialog", target: "waitlist" },
        icon: Heart,
        iconClass: "text-rose-400",
      },
      {
        label: "Continue Application",
        action: { kind: "link", href: "/apply/start" },
        icon: ArrowRight,
        iconClass: "text-indigo-400",
      },
    ],
  },
  {
    kind: "dropdown",
    label: "Resources & Login",
    items: [
      // {
      //   label: "Community & Education Resources",
      //   action: { kind: "disabled" },
      //   badge: "Coming Soon",
      //   icon: BookMarked,
      // },
      {
        label: "Academic Calendar",
        action: { kind: "link", href: "/academic-calendar" },
        icon: CalendarDays,
        iconClass: "text-blue-400",
      },
      {
        label: "Tour",
        action: { kind: "link", href: "/tour" },
        badge: "New!",
        icon: MapPin,
        iconClass: "text-rose-500",
      },
      {
        label: "Shadow Day",
        action: { kind: "link", href: "/shadow-tour" },
        badge: "New!",
        icon: CalendarDays,
        iconClass: "text-purple-500",
      },
      {
        label: "FAQ",
        action: { kind: "link", href: "/faq" },
        icon: HelpCircle,
        iconClass: "text-slate-400",
      },
      {
        label: "Contact",
        action: { kind: "link", href: "/contact" },
        icon: Mail,
        iconClass: "text-emerald-500",
      },
      {
        label: "Donate",
        action: { kind: "link", href: "/donate" },
        icon: Heart,
        iconClass: "text-red-400",
      },
      {
        label: "Parent Login",
        action: { kind: "link", href: "/login" },
        colorClass: "bg-blue-50 text-blue-700 hover:bg-blue-100",
        icon: User,
        iconClass: "text-blue-500",
      },
      {
        label: "Teacher Login",
        action: { kind: "link", href: "/login" },
        colorClass: "bg-amber-50 text-amber-700 hover:bg-amber-100",
        icon: GraduationCap,
        iconClass: "text-amber-500",
      },
    ],
  },
  // {
  //   kind: "single",
  //   label: "Open House",
  //   action: { kind: "link", href: "/rsvp" },
  //   badge: "RSVP!",
  // },
  {
    kind: "single",
    label: "Contact",
    action: { kind: "dialog", target: "contact" },
  },
  // {
  //   kind: "single",
  //   label: "Join Us 4/25",
  //   action: { kind: "link", href: "/rsvp" },
  //   highlight: true,
  // },
];

// ─── Announcement data ───────────────────────────────────────────────────────

const ANNOUNCEMENTS = [
  {
    short: "🌟 Week 1 Highlights are live!",
    full: "🌟 Week 1 of our Summer Program is complete — see the highlights!",
    buttonLabel: "View Recap",
    href: "/highlights/summer/week-1",
  },
  {
    short: "🗺️ Book a Private Tour!",
    full: "🗺️ Schedule a tour of our campus!",
    buttonLabel: "Book a Tour",
    href: "/tour",
  },
  {
    short: "☀️ Join our Summer Program!",
    full: "☀️ Join us for our 12-week Summer Program!",
    buttonLabel: "Apply Today!",
    href: "/apply",
  },
  {
    short: "📚 Enroll for School Year '26-'27!",
    full: "📚 Enroll for the upcoming 2026–2027 school year!",
    buttonLabel: "Apply Today!",
    href: "/apply",
  },
  {
    short: "🏠 Homeschool Drop-Ins Available!",
    full: "🏠 Homeschool families — flexible drop-ins available for all programs!",
    buttonLabel: "Learn More",
    href: "/homeschool",
  },
  {
    short: "📖 View all our Programs!",
    full: "📖 Explore all of our programs — Summer, School Year, and Homeschool Drop-In!",
    buttonLabel: "View Programs",
    href: "/programs",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function Navbar({ darkStyle }: { darkStyle?: boolean } = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementDirection, setAnnouncementDirection] = useState(1);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(
    null,
  );

  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setAnnouncementDirection(1);
      setAnnouncementIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const useDarkStyle =
    darkStyle ??
    (pathname === "/faq" ||
      pathname === "/about" ||
      pathname === "/apply" ||
      pathname === "/donate" ||
      pathname === "/donate/success" ||
      pathname === "/team" ||
      pathname === "/tuition" ||
      pathname === "/academic-calendar" ||
      pathname === "/summer-2026" ||
      pathname === "/school-year-2026-2027" ||
      pathname === "/homeschool" ||
      pathname === "/rsvp" ||
      pathname === "/our-story" ||
      pathname === "/what-we-offer" ||
      pathname === "/educational-philosophy" ||
      pathname === "/tour" ||
      pathname === "/programs" ||
      pathname === "/contact" ||
      pathname === "/privacy" ||
      pathname === "/terms" ||
      pathname === "/partnerships");

  // Close everything on route change
  useEffect(() => {
    const t = setTimeout(() => {
      setOpenDropdown(null);
      setOpenMobileSection(null);
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Click-outside: close desktop dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // ── Leaf action handler ──────────────────────────────────────────────────

  function handleLeafAction(action: NavAction) {
    if (action.kind === "disabled") return;

    if (action.kind === "dialog") {
      if (action.target === "waitlist") setWaitlistDialogOpen(true);
      if (action.target === "contact") setContactDialogOpen(true);
      setMobileMenuOpen(false);
      setOpenDropdown(null);
      return;
    }

    if (action.kind === "smooth-scroll") {
      const id = action.href.replace("/#", "");
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setMobileMenuOpen(false);
      setOpenDropdown(null);
      return;
    }

    // link — Next.js <Link> handles it; just close nav
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }

  // ── Leaf renderer ────────────────────────────────────────────────────────

  function renderLeaf(leaf: NavLeaf, mobile = false) {
    const base = mobile
      ? "flex items-center justify-between w-full text-left py-3 px-2 rounded-lg text-sm font-medium"
      : "flex items-center justify-between w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors duration-150";

    const colorClass = leaf.colorClass
      ? leaf.colorClass
      : mobile
        ? "text-white/80 hover:bg-white/10 hover:text-white"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900";

    const badge = leaf.badge ? (
      <span
        className={`ml-2 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 shrink-0 ${
          leaf.badge === "Coming Soon"
            ? "bg-gray-100 text-gray-400"
            : leaf.badge === "New!"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
        }`}
      >
        {leaf.badge}
      </span>
    ) : null;

    const arrow = mobile ? (
      <ChevronRight
        className="w-4 h-4 opacity-50 shrink-0 ml-1"
        strokeWidth={2}
      />
    ) : null;

    const iconEl = leaf.icon ? (
      <leaf.icon
        className={`w-4 h-4 shrink-0 ${leaf.iconClass ?? "opacity-60"}`}
      />
    ) : null;

    if (leaf.action.kind === "disabled") {
      return (
        <span
          key={leaf.label}
          className={`${base} text-gray-400 opacity-50 cursor-not-allowed select-none`}
        >
          <span className="flex items-center gap-2">
            {iconEl}
            {leaf.label}
          </span>
          {badge}
        </span>
      );
    }

    if (leaf.action.kind === "link") {
      return (
        <Link
          key={leaf.label}
          href={leaf.action.href}
          onClick={() => handleLeafAction(leaf.action)}
          className={`${base} ${colorClass}`}
        >
          <span className="flex items-center gap-2">
            {iconEl}
            {leaf.label}
          </span>
          <span className="flex items-center gap-1">
            {badge}
            {arrow}
          </span>
        </Link>
      );
    }

    // smooth-scroll or dialog
    return (
      <button
        key={leaf.label}
        onClick={() => handleLeafAction(leaf.action)}
        className={`${base} ${colorClass} cursor-pointer`}
      >
        <span className="flex items-center gap-2">
          {iconEl}
          {leaf.label}
        </span>
        <span className="flex items-center gap-1">
          {badge}
          {arrow}
        </span>
      </button>
    );
  }

  // ── Trigger text color ───────────────────────────────────────────────────

  const triggerClass =
    useDarkStyle || scrolled
      ? "text-gray-800/90 hover:text-gray-800"
      : "text-white/90 hover:text-white";

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm rounded-b-[28px]"
          : ""
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
      ref={navRef}
    >
      {/* Announcement Bar */}
      <div className="hidden sm:block w-full bg-[#4a7c59] text-white text-sm py-1.5 px-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={announcementDirection}>
          <motion.div
            key={announcementIndex}
            custom={announcementDirection}
            variants={{
              enter: (dir: number) => ({ opacity: 0, y: dir * 16 }),
              center: { opacity: 1, y: 0 },
              exit: (dir: number) => ({ opacity: 0, y: dir * -16 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" as const }}
            className="flex items-center justify-center gap-3"
          >
            <span className="sm:hidden">
              {ANNOUNCEMENTS[announcementIndex].short}
            </span>
            <span className="hidden sm:inline">
              {ANNOUNCEMENTS[announcementIndex].full}
            </span>
            <Link
              href={ANNOUNCEMENTS[announcementIndex].href}
              className="shrink-0 bg-white text-[#4a7c59] font-semibold text-xs px-3 py-1 rounded-full hover:bg-welcome-bg transition-colors"
            >
              {ANNOUNCEMENTS[announcementIndex].buttonLabel}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 mx-auto">
        <div className="flex items-center justify-between h-20 relative">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            <Link href="/">
              <img
                src="/assets/Logo.png"
                alt="SageField logo"
                className="h-12 cursor-pointer"
              />
            </Link>
          </motion.div>

          {/* Desktop Nav — Center */}
          <motion.div
            className="hidden lg:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
          >
            {NAV_TABS.map((tab) => {
              if (tab.kind === "single") {
                const isDisabled = tab.action.kind === "disabled";
                if (isDisabled) {
                  return (
                    <span
                      key={tab.label}
                      className="px-3 py-2 font-semibold text-sm text-gray-400/60 cursor-not-allowed select-none"
                    >
                      {tab.label}
                    </span>
                  );
                }
                if (tab.highlight && tab.action.kind === "link") {
                  return (
                    <Link
                      key={tab.label}
                      href={tab.action.href}
                      className="bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-indigo-600 transition-colors duration-200 focus:outline-none shadow-md"
                    >
                      {tab.label}
                    </Link>
                  );
                }
                if (tab.action.kind === "link") {
                  return (
                    <Link
                      key={tab.label}
                      href={tab.action.href}
                      className={`flex items-center gap-1.5 px-3 py-2 font-semibold text-sm transition-colors duration-200 ${triggerClass} focus:outline-none`}
                    >
                      {tab.label}
                      {tab.badge && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5">
                          {tab.badge}
                        </span>
                      )}
                    </Link>
                  );
                }
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleLeafAction(tab.action)}
                    className={`flex items-center gap-1.5 px-3 py-2 font-semibold text-sm transition-colors duration-200 ${triggerClass} cursor-pointer focus:outline-none`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              }

              // dropdown
              const isOpen = openDropdown === tab.label;
              return (
                <div
                  key={tab.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(tab.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-2 font-semibold text-sm transition-colors duration-200 ${triggerClass} cursor-pointer focus:outline-none`}
                  >
                    {tab.label}
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{
                          duration: 0.15,
                          ease: "easeOut" as const,
                        }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                      >
                        <div className="px-2 py-1 flex flex-col gap-0.5">
                          {tab.items.map((leaf) => renderLeaf(leaf))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="hidden lg:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <button
              onClick={() => setWaitlistDialogOpen(true)}
              className="border-2 border-white bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2 rounded-lg transition-all duration-250 cursor-pointer shadow-lg"
            >
              Open for Enrollment!
            </button>
          </motion.div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${pathname === "/" && !scrolled ? "text-white" : "text-gray-900"} focus:outline-none cursor-pointer`}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile CTA strip — slides in when scrolled */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-200 px-4 flex gap-2 ${scrolled ? "max-h-20 opacity-100 pb-3" : "max-h-0 opacity-0"}`}
      >
        <Link
          href="/apply"
          className="flex-1 flex items-center justify-center px-4 py-2.5 bg-sage-600 text-white text-sm font-semibold rounded-2xl"
        >
          Enroll Today!
        </Link>
        <Link
          href="/tour"
          className="flex-1 flex items-center justify-center px-3 py-2.5 bg-indigo-500 text-white text-sm font-semibold rounded-2xl"
        >
          Schedule a Tour
        </Link>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" as const }}
          >
            <motion.div
              className="px-5 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {/* Accordion sections */}
              <div className="space-y-1 mb-4">
                {NAV_TABS.map((tab) => {
                  const mobileTextBase = "text-white";

                  if (tab.kind === "single") {
                    const isDisabled = tab.action.kind === "disabled";
                    if (isDisabled) {
                      return (
                        <div key={tab.label} className="py-2">
                          <span className="block font-semibold text-sm text-gray-400/60 cursor-not-allowed select-none">
                            {tab.label}
                          </span>
                        </div>
                      );
                    }
                    if (tab.highlight && tab.action.kind === "link") {
                      return (
                        <div key={tab.label} className="py-2">
                          <Link
                            href={tab.action.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full bg-indigo-500 text-white text-center font-semibold text-sm py-3 px-4 rounded-full hover:bg-indigo-600 transition-colors duration-200 shadow-md"
                          >
                            {tab.label}
                          </Link>
                        </div>
                      );
                    }
                    if (tab.action.kind === "link") {
                      return (
                        <div key={tab.label} className="py-2">
                          <Link
                            href={tab.action.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`w-full flex items-center justify-between py-3 font-semibold text-sm ${mobileTextBase} focus:outline-none`}
                          >
                            <span className="flex items-center gap-2">
                              {tab.label}
                              {tab.badge && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5">
                                  {tab.badge}
                                </span>
                              )}
                            </span>
                            <ChevronRight
                              className="w-4 h-4 opacity-50"
                              strokeWidth={2}
                            />
                          </Link>
                        </div>
                      );
                    }
                    return (
                      <div key={tab.label} className="py-2">
                        <button
                          onClick={() => handleLeafAction(tab.action)}
                          className={`w-full flex items-center justify-between py-3 font-semibold text-sm ${mobileTextBase} cursor-pointer focus:outline-none`}
                        >
                          <span className="flex items-center gap-2">
                            {tab.label}
                            {tab.badge && (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5">
                                {tab.badge}
                              </span>
                            )}
                          </span>
                          <ChevronRight
                            className="w-4 h-4 opacity-50"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    );
                  }

                  const isExpanded = openMobileSection === tab.label;

                  return (
                    <div key={tab.label}>
                      <button
                        onClick={() =>
                          setOpenMobileSection(isExpanded ? null : tab.label)
                        }
                        className={`w-full flex items-center justify-between py-2.5 font-semibold text-sm ${mobileTextBase} focus:outline-none cursor-pointer`}
                      >
                        {tab.label}
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center"
                        >
                          <ChevronDown
                            className="w-4 h-4 opacity-70"
                            strokeWidth={2.5}
                          />
                        </motion.span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.25,
                              ease: "easeInOut" as const,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="border-l-2 border-primary/30 pl-4 pb-2 flex flex-col gap-0.5">
                              {tab.items.map((leaf) => renderLeaf(leaf, true))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Mobile action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-2"
              >
                <Link
                  href="/apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full border-2 border-white bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-250"
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  Open for Enrollment!
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="mb-2"
              >
                <Link
                  href="/tour"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full border-2 border-white bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-250"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  Schedule a Tour
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full border-2 border-white text-white hover:bg-white/10 bg-transparent font-semibold px-6 py-3 rounded-lg transition-all duration-250"
                >
                  <User className="w-4 h-4 shrink-0" />
                  Parent Login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <ContactDialog
        isOpen={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
      />
      <WaitlistDialog
        isOpen={waitlistDialogOpen}
        onClose={() => setWaitlistDialogOpen(false)}
      />
    </motion.nav>
  );
}
