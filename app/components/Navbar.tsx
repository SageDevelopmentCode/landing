"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
  badge?: "Coming Soon";
}

type NavTab =
  | { kind: "single"; label: string; action: NavAction }
  | { kind: "dropdown"; label: string; items: NavLeaf[] };

const NAV_TABS: NavTab[] = [
  {
    kind: "dropdown",
    label: "About Us",
    items: [
      { label: "About Us", action: { kind: "link", href: "/about" } },
      { label: "Our Team", action: { kind: "link", href: "/team" } },
      { label: "FAQ", action: { kind: "link", href: "/faq" } },
      { label: "Our Vision", action: { kind: "link", href: "/vision" } },
      {
        label: "What We Offer",
        action: { kind: "smooth-scroll", href: "/#what-we-offer" },
      },
      {
        label: "Educational Philosophy",
        action: { kind: "smooth-scroll", href: "/#educational-philosophy" },
      },
    ],
  },
  {
    kind: "dropdown",
    label: "Programs & Tuition",
    items: [
      {
        label: "Summer Program 2026",
        action: { kind: "disabled" },
        badge: "Coming Soon",
      },
      {
        label: "School Year 2026-2027",
        action: { kind: "disabled" },
        badge: "Coming Soon",
      },
      { label: "Tuition", action: { kind: "link", href: "/tuition" } },
    ],
  },
  {
    kind: "dropdown",
    label: "Apply",
    items: [
      {
        label: "Apply for a Program",
        action: { kind: "link", href: "/apply" },
      },
      {
        label: "Interest Form",
        action: { kind: "dialog", target: "waitlist" },
      },
    ],
  },
  {
    kind: "dropdown",
    label: "Resources & Support",
    items: [
      {
        label: "Community & Education Resources",
        action: { kind: "disabled" },
        badge: "Coming Soon",
      },
      {
        label: "Academic Calendar",
        action: { kind: "disabled" },
        badge: "Coming Soon",
      },
      { label: "FAQ", action: { kind: "link", href: "/faq" } },
      { label: "Donate", action: { kind: "link", href: "/donate" } },
    ],
  },
  {
    kind: "single",
    label: "Contact",
    action: { kind: "dialog", target: "contact" },
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(
    null,
  );

  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const useDarkStyle =
    pathname === "/faq" ||
    pathname === "/about" ||
    pathname === "/apply" ||
    pathname === "/donate" ||
    pathname === "/donate/success" ||
    pathname === "/team" ||
    pathname === "/tuition";

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
      ? "flex items-center justify-between w-full text-left py-2 px-1 rounded-lg text-sm font-medium"
      : "flex items-center justify-between w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors duration-150";

    const badge = leaf.badge ? (
      <span className="ml-2 text-[10px] font-semibold uppercase bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 shrink-0">
        {leaf.badge}
      </span>
    ) : null;

    if (leaf.action.kind === "disabled") {
      return (
        <span
          key={leaf.label}
          className={`${base} text-gray-400 opacity-50 cursor-not-allowed select-none`}
        >
          <span>{leaf.label}</span>
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
          className={`${base} text-gray-700 hover:bg-gray-50 hover:text-gray-900`}
        >
          <span>{leaf.label}</span>
          {badge}
        </Link>
      );
    }

    // smooth-scroll or dialog
    return (
      <button
        key={leaf.label}
        onClick={() => handleLeafAction(leaf.action)}
        className={`${base} text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer`}
      >
        <span>{leaf.label}</span>
        {badge}
      </button>
    );
  }

  // ── Trigger text color ───────────────────────────────────────────────────

  const triggerClass = useDarkStyle
    ? "text-gray-800/90 hover:text-gray-800"
    : "text-white/90 hover:text-white";

  return (
    <motion.nav
      className="absolute top-0 left-0 right-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      ref={navRef}
    >
      <div className="px-12 mx-auto">
        <div className="flex items-center justify-between h-20 relative">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
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
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
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
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleLeafAction(tab.action)}
                    className={`px-3 py-2 font-semibold text-sm transition-colors duration-200 ${triggerClass} cursor-pointer focus:outline-none`}
                  >
                    {tab.label}
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
                        transition={{ duration: 0.15, ease: "easeOut" }}
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
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <button
              onClick={() => setContactDialogOpen(true)}
              className={`border-2 ${
                useDarkStyle
                  ? "border-gray-800 text-gray-800 hover:bg-gray-100"
                  : "border-white text-white hover:bg-white/10"
              } bg-transparent font-semibold px-6 py-2 rounded-lg transition-all duration-250 cursor-pointer`}
            >
              Contact Us
            </button>
            <button
              onClick={() => setWaitlistDialogOpen(true)}
              className="border-2 border-white bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2 rounded-lg transition-all duration-250 cursor-pointer shadow-lg"
            >
              Now Open for Enrollment
            </button>
          </motion.div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${
                useDarkStyle ? "text-gray-800" : "text-white"
              } focus:outline-none cursor-pointer`}
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={`lg:hidden ${
              useDarkStyle ? "bg-white/95" : "bg-black/80"
            } backdrop-blur-md`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
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
                  const mobileTextBase = useDarkStyle
                    ? "text-gray-800"
                    : "text-white";

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
                    return (
                      <div key={tab.label} className="py-2">
                        <button
                          onClick={() => handleLeafAction(tab.action)}
                          className={`block font-semibold text-sm ${mobileTextBase} cursor-pointer focus:outline-none`}
                        >
                          {tab.label}
                        </button>
                      </div>
                    );
                  }

                  const isExpanded = openMobileSection === tab.label;

                  return (
                    <div key={tab.label}>
                      <button
                        onClick={() =>
                          setOpenMobileSection(
                            isExpanded ? null : tab.label,
                          )
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
                            transition={{ duration: 0.25, ease: "easeInOut" }}
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
              <motion.button
                onClick={() => {
                  setWaitlistDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full border-2 border-white bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-250 cursor-pointer mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                Now Open for Enrollment
              </motion.button>

              <motion.button
                onClick={() => {
                  setContactDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
                className={`w-full border-2 ${
                  useDarkStyle
                    ? "border-gray-800 text-gray-800 hover:bg-gray-100"
                    : "border-white text-white hover:bg-white/10"
                } bg-transparent font-semibold px-6 py-3 rounded-lg transition-all duration-250 cursor-pointer`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                Contact Us
              </motion.button>
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
