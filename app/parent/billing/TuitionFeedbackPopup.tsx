"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X, Star, CheckCircle2, Loader2 } from "lucide-react";

interface TuitionFeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; message: string }) => Promise<{ success: true } | { error: string }>;
}

export default function TuitionFeedbackPopup({
  isOpen,
  onClose,
  onSubmit,
}: TuitionFeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setRating(0);
    setHovered(0);
    setMessage("");
    setSubmitted(false);
    setLoading(false);
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (rating === 0 || loading) return;
    setLoading(true);
    setError(null);
    const result = await onSubmit({ rating, message });
    setLoading(false);
    if ("error" in result) {
      setError("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
      setTimeout(() => handleClose(), 2000);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed z-[90] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-[#4a7c59]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#4a7c59]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-800 font-body">
                    Thank you!
                  </p>
                  <p className="text-sm text-gray-500 font-body">
                    Your feedback helps us keep improving.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <p className="text-sm font-semibold text-gray-800 font-body">
                    Quick question for you ✨
                  </p>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-5 space-y-4">
                  <p className="text-xs text-gray-500 font-body leading-relaxed">
                    Our app is still in beta and improving every day. Your
                    feedback (takes 10 seconds!) helps us make it better for
                    every Sage Field family.
                  </p>

                  {/* Star rating */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 font-body">
                      How was the tuition payment experience?
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
                        <span className="ml-1 text-xs text-gray-400 font-body">
                          {
                            ["", "Poor", "Fair", "Good", "Great", "Excellent"][
                              rating
                            ]
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Optional textarea */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Anything about the payment flow? (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/40 focus:border-[#4a7c59] transition-colors"
                  />

                  {error && (
                    <p className="text-xs text-red-500 font-body">{error}</p>
                  )}

                  {/* Footer buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleClose}
                      className="text-sm text-gray-400 hover:text-gray-600 font-body transition-colors cursor-pointer"
                    >
                      Not now
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={rating === 0 || loading}
                      className="px-5 py-2 bg-[#4a7c59] text-white text-sm font-body rounded-lg hover:bg-[#3d6b4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Send Feedback
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
