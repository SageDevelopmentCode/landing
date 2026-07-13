"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  HelpCircle,
  XCircle,
  Minus,
  Plus,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  CalendarClock,
  Home,
  School,
} from "lucide-react";
import { formatPhone } from "@/app/utils/formatPhone";

async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#f29a8f", "#7FA888", "#C8DFCB", "#FFB3BA", "#E0BBE4"],
    disableForReducedMotion: true,
  });
}

type Intent = "yes" | "maybe" | "no" | null;
type ContactMethod = "email" | "phone";

const intentOptions: {
  value: Intent;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  activeBorder: string;
  activeBg: string;
  dotBg: string;
}[] = [
  {
    value: "yes",
    label: "Yes, we're in!",
    sub: "We plan to continue into the school year",
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: "text-sage-600",
    activeBorder: "border-sage-500",
    activeBg: "bg-sage-50",
    dotBg: "bg-sage-500",
  },
  {
    value: "maybe",
    label: "We're still deciding",
    sub: "We're interested but haven't committed",
    icon: <HelpCircle className="w-5 h-5" />,
    color: "text-amber-500",
    activeBorder: "border-amber-400",
    activeBg: "bg-amber-50",
    dotBg: "bg-amber-400",
  },
  {
    value: "no",
    label: "Just summer for us",
    sub: "We're not planning on the school year",
    icon: <XCircle className="w-5 h-5" />,
    color: "text-rose-400",
    activeBorder: "border-rose-300",
    activeBg: "bg-rose-50",
    dotBg: "bg-rose-400",
  },
];

type ProgramType = "homeschool_dropin" | "full_time" | null;

const programOptions: {
  value: ProgramType;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "homeschool_dropin",
    label: "Homeschool Drop-In",
    sub: "1–3 days per week, flexible schedule",
    icon: <Home className="w-5 h-5" />,
  },
  {
    value: "full_time",
    label: "Full-Time Program",
    sub: "Monday–Thursday, our full school-year experience",
    icon: <School className="w-5 h-5" />,
  },
];

export default function SchoolYearCommitmentPage() {
  const [intent, setIntent] = useState<Intent>(null);
  const [children, setChildren] = useState<string[]>([""]);
  const [programType, setProgramType] = useState<ProgramType>(null);
  const [notes, setNotes] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showFollowUp = intent === "yes" || intent === "maybe";
  const contactFilled =
    contactMethod === "email"
      ? email.trim().length > 3
      : phone.replace(/\D/g, "").length >= 10;
  const canSubmit = intent !== null && contactFilled;

  function addChild() {
    setChildren((prev) => (prev.length < 6 ? [...prev, ""] : prev));
  }

  function removeChild() {
    setChildren((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function updateChildName(i: number, name: string) {
    setChildren((prev) => prev.map((n, idx) => (idx === i ? name : n)));
  }

  async function handleSubmit() {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/school-year-2026-commitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          children,
          programType,
          notes,
          contactMethod,
          email,
          phone,
          firstName,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      fireConfetti();
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-welcome-bg flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="text-center max-w-sm mx-auto"
        >
          <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-7 h-7 text-sage-600" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-sage-700 mb-3">
            Thank you, {firstName || "friend"}!
          </h2>
          <p className="font-body text-gray-600 leading-relaxed text-sm">
            We&apos;ve noted your interest for the 2026–2027 school year.
            Sabrina will be in touch as enrollment opens — we can&apos;t wait to
            keep growing with your family. 🌿
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-8 text-sm font-body font-semibold text-sage-700 hover:text-sage-800 transition-colors"
          >
            Back to Sage Field <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  const totalQuestions = showFollowUp ? 5 : 3;

  return (
    <div className="min-h-screen bg-welcome-bg">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 bg-welcome-bg/90 backdrop-blur-sm border-b border-sage-100/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/assets/Logo.png"
              alt="Sage Field logo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-heading font-bold text-sage-700 text-sm tracking-tight">
              Sage Field Private Microschool
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-sage-700 leading-tight mb-4">
            Are you joining us for the school year?
          </h1>
          <p className="font-body text-gray-600 text-sm leading-relaxed">
            We&apos;re planning our 2026–2027 school year and want to make sure
            we have a spot for every family who wants one.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-50 border border-amber-200">
            <CalendarClock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="font-body text-xs text-amber-700">
              Please respond by <span className="font-bold">July 17</span> — 1
              month before the first day of school
            </span>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-sage-100 shadow-sm overflow-hidden"
        >
          {/* Q1 — Intent */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
              Question 1 of {totalQuestions}
            </p>
            <p className="font-body font-semibold text-gray-800 text-base mb-4">
              What&apos;s your family&apos;s plan for the school year?
            </p>
            <div className="space-y-2.5">
              {intentOptions.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIntent(opt.value)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    intent === opt.value
                      ? `${opt.activeBorder} ${opt.activeBg}`
                      : "border-gray-200 bg-white hover:border-sage-200"
                  }`}
                >
                  <span className={`flex-shrink-0 ${opt.color}`}>
                    {opt.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block font-body font-semibold text-sm transition-colors ${
                        intent === opt.value ? "text-gray-800" : "text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="block font-body text-xs text-gray-500 mt-0.5">
                      {opt.sub}
                    </span>
                  </span>
                  {intent === opt.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 20,
                      }}
                      className={`w-5 h-5 rounded-full flex-shrink-0 ${opt.dotBg} flex items-center justify-center`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Q2 + Q3 — conditional follow-up */}
          <AnimatePresence>
            {showFollowUp && (
              <motion.div
                key="follow-up"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {/* Q2 — Child count + names */}
                <div className="p-6 border-b border-gray-100">
                  <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Question 2 of {totalQuestions}
                  </p>
                  <p className="font-body font-semibold text-gray-800 text-base mb-5">
                    How many children would be enrolling?
                  </p>
                  <div className="flex items-center gap-4 mb-5">
                    <button
                      onClick={removeChild}
                      disabled={children.length <= 1}
                      className="w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-sage-400 hover:text-sage-700 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <motion.span
                      key={children.length}
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="font-heading text-3xl font-bold text-sage-700 w-10 text-center"
                    >
                      {children.length}
                    </motion.span>
                    <button
                      onClick={addChild}
                      disabled={children.length >= 6}
                      className="w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-sage-400 hover:text-sage-700 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="font-body text-sm text-gray-500 ml-1">
                      {children.length === 1 ? "child" : "children"}
                    </span>
                  </div>

                  {/* Child name inputs */}
                  <div className="space-y-2.5">
                    <AnimatePresence initial={false}>
                      {children.map((name, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                        >
                          <input
                            type="text"
                            placeholder={`Child ${i + 1} name`}
                            value={name}
                            onChange={(e) => updateChildName(i, e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Q3 — Program type */}
                <div className="p-6 border-b border-gray-100">
                  <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Question 3 of {totalQuestions}
                  </p>
                  <p className="font-body font-semibold text-gray-800 text-base mb-3">
                    Which program are you interested in?
                  </p>
                  <p className="font-body text-xs text-sage-700 bg-sage-50 border border-sage-200 rounded-lg px-3 py-2 mb-4">
                    💡 Aftercare and Field Day Fridays are also available as
                    add-ons for both programs.
                  </p>
                  <div className="space-y-2.5">
                    {programOptions.map((opt) => {
                      const active = programType === opt.value;
                      return (
                        <motion.button
                          key={opt.value as string}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setProgramType(opt.value)}
                          className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                            active
                              ? "border-sage-500 bg-sage-50"
                              : "border-gray-200 bg-white hover:border-sage-200"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 ${active ? "text-sage-600" : "text-gray-400"}`}
                          >
                            {opt.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span
                              className={`block font-body font-semibold text-sm ${active ? "text-gray-800" : "text-gray-700"}`}
                            >
                              {opt.label}
                            </span>
                            <span className="block font-body text-xs text-gray-500 mt-0.5">
                              {opt.sub}
                            </span>
                          </span>
                          {active && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 20,
                              }}
                              className="w-5 h-5 rounded-full flex-shrink-0 bg-sage-500 flex items-center justify-center"
                            >
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Q4 — Contact */}
          <AnimatePresence>
            {intent !== null && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-6">
                  <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {showFollowUp
                      ? `Question 4 of ${totalQuestions}`
                      : `Question 2 of ${totalQuestions}`}
                  </p>

                  <p className="font-body font-semibold text-gray-800 text-base mb-4">
                    Where should we follow up with you?
                  </p>

                  {/* First name */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Contact method toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setContactMethod("email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-body font-semibold transition-all duration-150 cursor-pointer ${
                        contactMethod === "email"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      onClick={() => setContactMethod("phone")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-body font-semibold transition-all duration-150 cursor-pointer ${
                        contactMethod === "phone"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Phone
                    </button>
                  </div>

                  {/* Contact input */}
                  <AnimatePresence mode="wait">
                    {contactMethod === "email" ? (
                      <motion.input
                        key="email"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    ) : (
                      <motion.input
                        key="phone"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        type="tel"
                        placeholder="(512) 555-0123"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Q5 — Questions or concerns */}
                <div className="p-6 border-t border-gray-100">
                  <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {showFollowUp
                      ? `Question 5 of ${totalQuestions}`
                      : `Question 3 of ${totalQuestions}`}
                  </p>
                  <p className="font-body font-semibold text-gray-800 text-base mb-1.5">
                    Any questions or concerns?
                  </p>
                  <p className="font-body text-xs text-gray-500 mb-3">
                    Optional — share anything you&apos;d like us to know before
                    we reach out.
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Anything on your mind? We're happy to help."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400 resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 space-y-3"
        >
          <motion.button
            whileHover={canSubmit && !isLoading ? { scale: 1.01 } : {}}
            whileTap={canSubmit && !isLoading ? { scale: 0.98 } : {}}
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${
              canSubmit && !isLoading
                ? "bg-primary text-white hover:bg-primary-hover shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Submitting…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Submit My Interest
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
          {submitError && (
            <p className="text-center font-body text-xs text-rose-500">
              {submitError}
            </p>
          )}
          <p className="text-center font-body text-xs text-gray-400">
            No commitment required — just helping us plan 🌿
          </p>
        </motion.div>
      </main>
    </div>
  );
}
