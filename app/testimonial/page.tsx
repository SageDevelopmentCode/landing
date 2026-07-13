"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";

const PROMPTS = [
  "What I enjoyed most about Sage Field…",
  "How the program impacted our family…",
  "A moment that stood out for us…",
  "I would recommend Sage Field because…",
];

type FeatureConsent = "yes" | "ask" | null;

export default function TestimonialPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [featureConsent, setFeatureConsent] = useState<FeatureConsent>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);

  const canSubmit =
    firstName.trim().length > 0 &&
    email.trim().length > 3 &&
    testimonial.trim().length > 0;

  function handlePromptClick(index: number) {
    setActivePromptIndex(index);
    if (!testimonial.trim()) {
      setTestimonial(PROMPTS[index]);
    }
    textareaRef.current?.focus();
  }

  async function handleSubmit() {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setSubmitted(true);
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
            <Heart className="w-7 h-7 text-sage-600" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-sage-700 mb-3">
            Thank you, {firstName || "friend"}!
          </h2>
          <p className="font-body text-gray-600 leading-relaxed text-sm">
            Your story means so much to our community. We&apos;ll review it
            with care and reach out if we&apos;d love to feature it. 🌿
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-sage-700 leading-tight mb-3">
            Share your Sage Field experience.
          </h1>
          <p className="font-body text-gray-600 text-sm leading-relaxed">
            Your words help other families find us. Takes under 60 seconds.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-sage-100 shadow-sm overflow-hidden"
        >
          {/* Q1 — Your name */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
              Question 1 of 4
            </p>
            <p className="font-body font-semibold text-gray-800 text-base mb-4">
              Your name
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Q2 — Your email */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
              Question 2 of 4
            </p>
            <p className="font-body font-semibold text-gray-800 text-base mb-4">
              Your email
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* Q3 — Your story */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
              Question 3 of 4
            </p>
            <p className="font-body font-semibold text-gray-800 text-base mb-3">
              Your story
            </p>

            {/* Prompt chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePromptClick(i)}
                  className={`text-xs font-body font-medium px-3 py-1.5 rounded-full border transition-colors duration-150 cursor-pointer ${
                    activePromptIndex === i
                      ? "bg-sage-700 text-white border-sage-700"
                      : "bg-sage-50 text-sage-700 border-sage-200 hover:bg-sage-100"
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={5}
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="Share your Sage Field experience…"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors font-body text-sm text-gray-800 placeholder:text-gray-400 resize-none"
              />
              <span className="absolute bottom-3 right-3 text-xs text-gray-400 font-body">
                {testimonial.length} chars
              </span>
            </div>
          </div>

          {/* Q4 — May we feature this? */}
          <div className="p-6">
            <p className="text-[10px] font-body font-bold text-gray-400 uppercase tracking-widest mb-3">
              Question 4 of 4
            </p>
            <p className="font-body font-semibold text-gray-800 text-base mb-4">
              May we feature this?
            </p>
            <div className="space-y-2.5">
              {/* Yes option */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setFeatureConsent("yes")}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  featureConsent === "yes"
                    ? "border-sage-500 bg-sage-50"
                    : "border-gray-200 bg-white hover:border-sage-200"
                }`}
              >
                <span
                  className={`flex-shrink-0 ${featureConsent === "yes" ? "text-sage-600" : "text-gray-400"}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block font-body font-semibold text-sm transition-colors ${
                      featureConsent === "yes" ? "text-gray-800" : "text-gray-700"
                    }`}
                  >
                    Yes, feature it
                  </span>
                  <span className="block font-body text-xs text-gray-500 mt-0.5">
                    We&apos;d love to share your words
                  </span>
                </span>
                {featureConsent === "yes" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                    className="w-5 h-5 rounded-full flex-shrink-0 bg-sage-500 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </motion.div>
                )}
              </motion.button>

              {/* Ask first option */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setFeatureConsent("ask")}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  featureConsent === "ask"
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 bg-white hover:border-amber-200"
                }`}
              >
                <span
                  className={`flex-shrink-0 ${featureConsent === "ask" ? "text-amber-500" : "text-gray-400"}`}
                >
                  <HelpCircle className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block font-body font-semibold text-sm transition-colors ${
                      featureConsent === "ask" ? "text-gray-800" : "text-gray-700"
                    }`}
                  >
                    Ask me first
                  </span>
                  <span className="block font-body text-xs text-gray-500 mt-0.5">
                    We&apos;ll check before publishing
                  </span>
                </span>
                {featureConsent === "ask" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                    className="w-5 h-5 rounded-full flex-shrink-0 bg-amber-400 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </motion.div>
                )}
              </motion.button>
            </div>
            <p className="font-body text-xs text-gray-400 mt-3">
              We&apos;ll never publish your email.
            </p>
          </div>
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
                <Heart className="w-4 h-4" />
                Share My Story
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
          <p className="text-center font-body text-xs text-gray-400">
            Your story is yours — we only feature with permission 🌿
          </p>
        </motion.div>
      </main>
    </div>
  );
}
