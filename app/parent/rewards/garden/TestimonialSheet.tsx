"use client";

import { useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { TextArea } from "@/app/parent/_garden/fields";
import { celebrate, usePortalFeedback } from "@/app/parent/_garden/feedback";
import { CheckIcon, Spinner, btnGhostSm, btnSheetPrimary } from "@/app/parent/_garden/ui";
import { submitTestimonial } from "@/app/actions/submitTestimonial";

const MAX_LENGTH = 2000;

/** Testimonial form for the $15 Starbucks reward. Can't close mid-submit; thanks the parent once sent. */
export default function TestimonialSheet({
  open,
  onClose,
  studentFirstName,
  submitted,
  onSubmitted,
  readOnlyPreview,
}: {
  open: boolean;
  onClose: () => void;
  studentFirstName: string;
  submitted: boolean;
  onSubmitted: () => void;
  readOnlyPreview?: boolean;
}) {
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trimmed = text.trim();

  function close() {
    if (submitting) return;
    onClose();
  }

  async function submit() {
    if (!trimmed || submitting) return;
    const testimonial = trimmed;
    setSubmitting(true);
    let ok = false;
    try {
      ok = await runSave({
        successTitle: "Testimonial sent",
        successMessage: "We'll be in touch about your gift card soon.",
        errorTitle: "Couldn't send your testimonial",
        retry: () => void submit(),
        fn: async () => {
          const res = await submitTestimonial({ testimonial, childName: studentFirstName });
          return { ok: res.success, error: res.error };
        },
      });
    } finally {
      setSubmitting(false);
    }
    if (!ok) return;
    setText("");
    onSubmitted();
    void celebrate();
  }

  const prompts = [
    `What has ${studentFirstName} enjoyed most at Sage Field?`,
    "How has the program impacted your family?",
    "Is there a moment or experience that stood out?",
    "Would you recommend Sage Field to another family?",
  ];

  return (
    <GardenSheet
      open={open}
      onClose={close}
      title="Share Your Experience"
      icon="☕"
      note="$15 Starbucks gift card — coffee on us"
      footer={
        submitted ? (
          <button type="button" onClick={close} className={`${btnGhostSm} w-full min-h-[52px]`} data-autofocus>
            Close
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <button type="button" className={btnSheetPrimary} onClick={() => void submit()} disabled={!trimmed || submitting} aria-busy={submitting || undefined}>
              {submitting ? <Spinner /> : <span aria-hidden="true">☕</span>}
              {submitting ? "Submitting…" : "Submit testimonial"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-[var(--sf-soft)] transition hover:text-[var(--sf-ink)] focus-visible:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:opacity-50 cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        )
      }
    >
      <p className="text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">
        A few honest sentences from the heart is more than enough. Here are some prompts to get you started:
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {prompts.map((prompt) => (
          <li key={prompt} className="flex items-start gap-2.5 rounded-[16px] bg-[var(--sf-butter)]/50 px-4 py-2.5 text-sm font-bold leading-snug">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a0784a]" aria-hidden="true" />
            {prompt}
          </li>
        ))}
      </ul>

      {submitted ? (
        <div role="status" className="mt-6 flex flex-col items-center gap-2 rounded-[24px] bg-[var(--sf-mint)]/80 px-6 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--sf-sage-deep)]" aria-hidden="true">
            <CheckIcon className="h-6 w-6" />
          </span>
          <p className="sf-display text-2xl leading-tight">Thank you so much!</p>
          <p className="text-sm font-semibold text-[var(--sf-sage-deep)]">We&apos;ll be in touch about your gift card soon.</p>
        </div>
      ) : (
        <div className="mt-6">
          <TextArea
            label="Your testimonial"
            value={text}
            onChange={setText}
            placeholder="Share your experience here…"
            rows={5}
            maxLength={MAX_LENGTH}
            disabled={submitting}
            hint={trimmed ? null : "A few sentences is perfect."}
          />
        </div>
      )}
    </GardenSheet>
  );
}
