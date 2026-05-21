"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Sparkles, Star, Loader2, CheckCircle2 } from "lucide-react";
import { submitParentFeedback } from "@/app/actions/submitParentFeedback";

const CATEGORIES = [
  "Home & Dashboard",
  "My Children",
  "Tuition & Billing",
  "Messages",
  "Calendar",
  "News Feed",
  "Enrollment",
  "Forms & Documents",
  "Volunteer",
  "Emergency Contacts",
  "Navigation & Layout",
  "Other",
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [allowFollowUp, setAllowFollowUp] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function handleClose() {
    setRating(0);
    setHovered(0);
    setCategories([]);
    setMessage("");
    setAllowFollowUp(false);
    setIsPending(false);
    setSubmitted(false);
    setSubmitError(null);
    onClose();
  }

  async function handleSubmit() {
    if (rating === 0 || isPending) return;
    setIsPending(true);
    setSubmitError(null);
    const result = await submitParentFeedback({ rating, categories, message, allowFollowUp });
    setIsPending(false);
    if ("error" in result) {
      setSubmitError(result.error);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div>
          <motion.div
            className="fixed inset-0 bg-black/60 z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-md z-70 bg-white flex flex-col shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4a7c59]" />
                <h2 className="text-base font-semibold text-gray-800 font-body">
                  Share Your Feedback
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success view */}
            {submitted && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#4a7c59]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#4a7c59]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-800 font-body">Thank you!</h3>
                  <p className="text-sm text-gray-500 font-body leading-relaxed max-w-xs">
                    Your feedback means a lot to us. We&apos;ll use it to keep making the portal better for every Sagefield family.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2 bg-[#4a7c59] text-white text-sm font-body rounded-lg hover:bg-[#3d6b4d] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Body */}
            {!submitted && (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
                {/* Blurb */}
                <div className="bg-[#4a7c59]/8 rounded-xl px-4 py-3">
                  <p className="text-sm text-[#4a7c59] font-body leading-relaxed">
                    Sagefield&apos;s parent portal is brand new, and your
                    experience matters to us. A few minutes of your honest
                    feedback helps us build something every family loves.
                  </p>
                </div>

                {/* Star rating */}
                <div>
                  <p className="text-sm font-medium text-gray-700 font-body mb-3">
                    Overall, how&apos;s your experience so far?
                  </p>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = n <= (hovered || rating);
                      return (
                        <button
                          key={n}
                          onMouseEnter={() => setHovered(n)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(n)}
                          className="cursor-pointer transition-transform hover:scale-110"
                          aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              filled
                                ? "fill-[#4a7c59] text-[#4a7c59]"
                                : "fill-transparent text-gray-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                    {rating > 0 && (
                      <span className="ml-2 text-xs text-gray-400 font-body">
                        {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category pills */}
                <div>
                  <p className="text-sm font-medium text-gray-700 font-body mb-3">
                    What area does your feedback relate to?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const active = categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors cursor-pointer ${
                            active
                              ? "bg-[#4a7c59] text-white"
                              : "border border-gray-200 text-gray-600 hover:border-[#4a7c59] hover:text-[#4a7c59]"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <p className="text-sm font-medium text-gray-700 font-body mb-2">
                    Tell us more{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's working well? What could be better?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/40 focus:border-[#4a7c59] transition-colors"
                  />
                </div>

                {/* Follow-up */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      allowFollowUp
                        ? "bg-[#4a7c59] border-[#4a7c59]"
                        : "border-gray-300 group-hover:border-[#4a7c59]"
                    }`}
                    onClick={() => setAllowFollowUp((v) => !v)}
                  >
                    {allowFollowUp && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 font-body leading-snug">
                    You&apos;re welcome to follow up with me about my feedback
                  </span>
                </label>
              </div>
            )}

            {/* Footer */}
            {!submitted && (
              <div className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4 space-y-2">
                {submitError && (
                  <p className="text-xs text-red-500 font-body text-right">{submitError}</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleClose}
                    className="text-sm text-gray-500 hover:text-gray-700 font-body transition-colors cursor-pointer"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isPending}
                    className="px-5 py-2 bg-[#4a7c59] text-white text-sm font-body rounded-lg hover:bg-[#3d6b4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
