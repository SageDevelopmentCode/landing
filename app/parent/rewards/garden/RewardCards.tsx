"use client";

import { useState } from "react";
import { CountUp } from "@/app/_garden/motion";
import { CopyButton } from "@/app/parent/_garden/copy";
import { Arrow, CheckIcon, btnInkSm } from "@/app/parent/_garden/ui";

/** The page's one dark ink panel: Refer a Family, stats, link + copy, and "View Details". */
export function ReferPanel({
  referralCount,
  enrolledCount,
  earnedDollars,
  referralLink,
  onOpenDetails,
}: {
  referralCount: number;
  enrolledCount: number;
  earnedDollars: number;
  referralLink: string;
  onOpenDetails: () => void;
}) {
  const [linkEl, setLinkEl] = useState<HTMLElement | null>(null);
  const stats = [
    { label: "Referred", value: referralCount, prefix: "" },
    { label: "Enrolled", value: enrolledCount, prefix: "" },
    { label: "Earned", value: earnedDollars, prefix: "$" },
  ];

  return (
    <section
      aria-labelledby="refer-title"
      className="relative overflow-hidden rounded-[36px] bg-[var(--sf-ink)] p-6 text-[var(--sf-cream)] shadow-[0_30px_60px_-35px_rgba(43,42,38,0.8)] sm:p-8"
    >
      <span
        className="sf-spin-slow pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[10px] border-dashed border-[var(--sf-butter)]/25"
        aria-hidden="true"
      />
      <div className="relative">
        <h2 id="refer-title" className="sf-display flex flex-wrap items-center gap-x-3 gap-y-2 text-[2rem] leading-[1.05] sm:text-[2.5rem]">
          <span className="flex items-center gap-2.5">
            <span className="text-[1.6rem] sm:text-[2rem]" aria-hidden="true">
              🎁
            </span>
            Refer a Family
          </span>
          <span
            className="rounded-full bg-[var(--sf-butter)] px-3 py-1 text-sm font-extrabold tracking-normal text-[#5c4400]"
            style={{ fontFamily: "var(--font-sf-body)" }}
          >
            $500 gift card
          </span>
        </h2>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[var(--sf-cream)]/75">
          Share your referral link — earn a $500 gift card when a family enrolls.
        </p>

        <dl className="mt-6 grid max-w-md grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col-reverse items-center rounded-[20px] bg-white/10 px-2 py-3 ring-1 ring-white/15">
              <dt className="mt-1.5 text-xs font-extrabold text-[var(--sf-cream)]/70">{s.label}</dt>
              <dd className="sf-display text-[1.9rem] leading-none text-white">
                <CountUp value={s.value} prefix={s.prefix} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex min-w-0 items-center gap-2 rounded-full bg-white/10 py-1.5 pl-4 pr-1.5 ring-1 ring-white/15">
          <span className="sr-only">Your referral link:</span>
          <span ref={setLinkEl} className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--sf-cream)]/85">
            {referralLink}
          </span>
          <CopyButton text={referralLink} label="Copy referral link" toastTitle="Link copied" selectEl={linkEl} />
        </div>

        <button
          type="button"
          onClick={onOpenDetails}
          className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--sf-butter)] px-5 text-sm font-extrabold text-[#5c4400] shadow-[0_4px_0_0_#c9a93f] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-butter)]/50 active:translate-y-0.5 cursor-pointer"
        >
          View Details <Arrow />
        </button>
      </div>
    </section>
  );
}

/** Butter sticky note: Share Your Experience, "✓ Submitted" once a testimonial is in. */
export function ExperienceCard({ submitted, onOpen }: { submitted: boolean; onOpen: () => void }) {
  return (
    <div className="pt-2">
      <section
        aria-labelledby="experience-title"
        className="relative rounded-[6px] bg-[var(--sf-butter)] p-6 shadow-[0_24px_40px_-26px_rgba(43,42,38,0.6)] transition-[rotate] duration-300 hover:!rotate-0 focus-within:!rotate-0 motion-reduce:transition-none sm:p-7"
        style={{ rotate: "1.5deg" }}
      >
        <span
          className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-3deg] rounded-[3px] bg-[var(--sf-coral)]/45"
          aria-hidden="true"
        />
        <h2 id="experience-title" className="sf-display flex flex-wrap items-center gap-x-3 gap-y-2 text-[1.8rem] leading-[1.05] text-[var(--sf-ink)]">
          <span className="flex items-center gap-2.5">
            <span className="text-[1.5rem]" aria-hidden="true">
              ☕
            </span>
            Share Your Experience
          </span>
          <span
            className="rounded-full bg-[#a0784a] px-3 py-1 text-sm font-extrabold tracking-normal text-white"
            style={{ fontFamily: "var(--font-sf-body)" }}
          >
            $15 Starbucks
          </span>
        </h2>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#5c4400]">
          Share a short testimonial and we&apos;ll send you a $15 Starbucks gift card — coffee on us.
        </p>
        <div className="mt-5">
          {submitted ? (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-sm font-extrabold text-[var(--sf-sage-deep)]">
              <CheckIcon className="h-4 w-4" />
              Submitted
            </span>
          ) : (
            <button type="button" onClick={onOpen} className={btnInkSm}>
              View Details <Arrow />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
