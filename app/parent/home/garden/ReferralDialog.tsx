"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Copy } from "lucide-react";
import { useToast } from "@/app/_garden/toast";
import { GardenDialog } from "@/app/parent/_garden/sheet";
import { CheckIcon } from "@/app/parent/_garden/ui";

export default function ReferralDialog({
  open,
  onClose,
  referralLink,
}: {
  open: boolean;
  onClose: () => void;
  referralLink: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetRef.current) clearTimeout(resetRef.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.show({ tone: "success", title: "Link copied", message: "Paste it in a text or email to a friend." });
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
      toast.show({
        tone: "error",
        title: "Couldn't copy automatically",
        message: "The link is selected — copy it with Ctrl/⌘ + C.",
      });
    }
  }

  return (
    <GardenDialog
      open={open}
      onClose={onClose}
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          Refer a Family
          <span className="rounded-full bg-[var(--sf-butter)] px-3 py-1 text-sm font-extrabold tracking-normal text-[#5c4400]" style={{ fontFamily: "var(--font-sf-body)" }}>
            $500 gift card
          </span>
        </span>
      }
      media={
        <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-44">
          <Image src="/assets/Kid1.png" alt="" fill sizes="512px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-cream)] via-transparent to-transparent" />
          <span className="sf-hand absolute bottom-3 left-6 rounded-md bg-white/90 px-2.5 py-0.5 text-lg text-[var(--sf-sage-deep)]" style={{ rotate: "-2deg" }} aria-hidden="true">
            share the love 💌
          </span>
        </div>
      }
    >
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--sf-soft)]">
        Know a family who&apos;d be a great fit for Sage Field? Share your link — when they enroll and pay their
        registration fee, you&apos;ll receive a{" "}
        <strong className="font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]">$500 gift card</strong> of
        your choice. If sharing the link isn&apos;t convenient, just let them know to{" "}
        <strong className="font-extrabold text-[var(--sf-ink)]">mention your name when they apply!</strong>
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="referral-link">
          Your referral link
        </label>
        <input
          id="referral-link"
          ref={inputRef}
          readOnly
          value={referralLink}
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-12 w-full min-w-0 flex-1 rounded-2xl border-2 border-dashed border-[var(--sf-ink)]/20 bg-white px-4 text-sm font-bold text-[var(--sf-soft)] focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)]"
        />
        <button
          type="button"
          onClick={copy}
          data-autofocus
          className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold text-white transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)] cursor-pointer ${
            copied
              ? "bg-[var(--sf-sage-deep)] shadow-[0_2px_0_0_#2f4237]"
              : "bg-[var(--sf-sage)] shadow-[0_4px_0_0_var(--sf-sage-deep)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--sf-sage-deep)]"
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" /> Copy link
            </>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-[var(--sf-soft)] transition hover:text-[var(--sf-ink)] focus-visible:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
      >
        Maybe later
      </button>
    </GardenDialog>
  );
}
