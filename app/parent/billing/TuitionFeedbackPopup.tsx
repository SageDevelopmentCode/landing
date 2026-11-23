"use client";

import { useId, useState } from "react";
import { GardenDialog } from "@/app/parent/_garden/sheet";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { Spinner, btnGhostSm, btnSageSm } from "@/app/parent/_garden/ui";
import { buildTuitionFeedback } from "./garden/payloads";

interface TuitionFeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; message: string }) => Promise<{ success: true } | { error: string }>;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function TuitionFeedbackPopup({ isOpen, onClose, onSubmit }: TuitionFeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = usePortalFeedback(false);
  const msgId = useId();

  function handleClose() {
    if (loading) return;
    setRating(0);
    setHovered(0);
    setMessage("");
    setSubmitted(false);
    onClose();
  }

  async function handleSubmit() {
    if (rating === 0 || loading) return;
    setLoading(true);
    let result: { success: true } | { error: string };
    try {
      result = await onSubmit(buildTuitionFeedback(rating, message));
    } catch {
      result = { error: "network" };
    }
    setLoading(false);
    if ("error" in result) {
      toast.show({
        tone: "error",
        title: "Couldn't send feedback",
        message: "Something went wrong. Please try again.",
        action: { label: "Try again", onClick: () => void handleSubmit() },
      });
    } else {
      setSubmitted(true);
      toast.show({ tone: "success", title: "Thank you!", message: "Your feedback helps us keep improving." });
      setTimeout(() => {
        setRating(0);
        setHovered(0);
        setMessage("");
        setSubmitted(false);
        onClose();
      }, 2000);
    }
  }

  return (
    <GardenDialog open={isOpen} onClose={handleClose} title={submitted ? "Thank you!" : "Quick question for you ✨"}>
      {submitted ? (
        <div className="mt-3 flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-4xl" aria-hidden="true">
            🌻
          </span>
          <p className="text-sm font-bold text-[var(--sf-soft)]">Your feedback helps us keep improving.</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          <p className="text-sm font-semibold leading-relaxed text-[var(--sf-soft)]">
            Our app is still in beta and improving every day. Your feedback (takes 10 seconds!) helps us make it better for every Sage Field family.
          </p>
          <div>
            <p className="mb-2 text-sm font-extrabold" id={`${msgId}-rate`}>
              How was the tuition payment experience?
            </p>
            <div role="radiogroup" aria-labelledby={`${msgId}-rate`} className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= (hovered || rating);
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}
                    data-autofocus={n === 1 ? true : undefined}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-3xl leading-none transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] motion-reduce:transition-none"
                  >
                    <span aria-hidden="true" className={filled ? "text-[var(--sf-butter)] drop-shadow-[0_1px_0_#c9a100]" : "text-[var(--sf-ink)]/15"}>
                      ★
                    </span>
                  </button>
                );
              })}
              {rating > 0 ? <span className="sf-hand ml-1 text-lg text-[var(--sf-sage-deep)]">{RATING_LABELS[rating]}</span> : null}
            </div>
          </div>
          <label htmlFor={msgId} className="sr-only">
            Anything about the payment flow? (optional)
          </label>
          <textarea
            id={msgId}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything about the payment flow? (optional)"
            className="h-24 w-full resize-none rounded-[18px] border-0 bg-white px-3 py-2.5 text-sm font-semibold ring-1 ring-[var(--sf-ink)]/10 placeholder:text-[var(--sf-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--sf-sage)]"
          />
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={handleClose} className={btnGhostSm}>
              Not now
            </button>
            <button type="button" onClick={handleSubmit} disabled={rating === 0 || loading} className={btnSageSm}>
              {loading ? <Spinner /> : null}
              Send Feedback
            </button>
          </div>
        </div>
      )}
    </GardenDialog>
  );
}
