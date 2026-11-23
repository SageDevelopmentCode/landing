"use client";

import type { ReactNode } from "react";

/** Compact Garden buttons for the parent portal (the marketing ones in app/_garden/ui are hero-sized). */
const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 cursor-pointer";

export const btnInkSm = `${btnBase} bg-[var(--sf-ink)] text-white shadow-[0_4px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#000] focus-visible:-translate-y-0.5 focus-visible:ring-[var(--sf-sky)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#000]`;
export const btnCoralSm = `${btnBase} bg-[var(--sf-coral-deep)] text-white shadow-[0_4px_0_0_#b85a4f] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#b85a4f] focus-visible:-translate-y-0.5 focus-visible:ring-[var(--sf-coral)]/40 active:translate-y-0.5 active:shadow-[0_1px_0_0_#b85a4f]`;
export const btnSageSm = `${btnBase} bg-[var(--sf-sage)] text-white shadow-[0_4px_0_0_var(--sf-sage-deep)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--sf-sage-deep)] focus-visible:-translate-y-0.5 focus-visible:ring-[var(--sf-mint)] active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--sf-sage-deep)]`;
export const btnGhostSm = `${btnBase} bg-white text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/10 shadow-[0_3px_0_0_rgba(43,42,38,0.12)] hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/25 focus-visible:-translate-y-0.5 focus-visible:ring-[var(--sf-sky)] active:translate-y-0.5`;

/** Full-width primary action for sheet footers. */
export const btnSheetPrimary = `${btnSageSm} w-full min-h-[52px] text-base`;

export const linkSoft =
  "inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 transition hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)]";

export const cardBase =
  "rounded-[28px] bg-white shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06]";

export const TINT_BG = {
  coral: "bg-[var(--sf-coral)]/20",
  butter: "bg-[var(--sf-butter)]/70",
  sky: "bg-[var(--sf-sky)]/80",
  lav: "bg-[var(--sf-lav)]/80",
  mint: "bg-[var(--sf-mint)]/80",
  peach: "bg-[var(--sf-peach)]/80",
} as const;
export type HomeTint = keyof typeof TINT_BG;

export const TINT_FG: Record<HomeTint, string> = {
  coral: "text-[var(--sf-coral-deep)]",
  butter: "text-[#7a5b00]",
  sky: "text-[#2d5d86]",
  lav: "text-[#6b3f86]",
  mint: "text-[var(--sf-sage-deep)]",
  peach: "text-[#a2552e]",
};

export function SectionHeader({
  title,
  note,
  action,
  id,
}: {
  title: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 id={id} tabIndex={id ? -1 : undefined} className="sf-display text-[1.9rem] leading-none outline-none sm:text-[2.3rem]">
          {title}
        </h2>
        {note ? <p className="sf-hand mt-1.5 text-lg leading-tight text-[var(--sf-sage-deep)]">{note}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Arrow({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h11M10.5 5l5 5-5 5" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[2.5px] border-current border-t-transparent motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}

const AVATAR_TINTS = [
  "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
  "bg-[var(--sf-sky)] text-[#2d5d86]",
  "bg-[var(--sf-peach)] text-[#a2552e]",
  "bg-[var(--sf-lav)] text-[#6b3f86]",
  "bg-[var(--sf-butter)] text-[#7a5b00]",
  "bg-[var(--sf-coral)]/30 text-[var(--sf-coral-deep)]",
];

export function avatarTint(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_TINTS[n % AVATAR_TINTS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstNameOf(name: string): string {
  return name.split(" ")[0];
}

/** Small round initials / photo avatar. */
export function KidAvatar({
  id,
  name,
  imageUrl,
  size = "h-8 w-8 text-xs",
}: {
  id: string;
  name: string;
  imageUrl?: string | null;
  size?: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs, sizes vary
    return <img src={imageUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${size} ${avatarTint(id)} flex shrink-0 items-center justify-center rounded-full font-extrabold`} aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}

/** Hand-numbered step label used inside sheets: "① choose a child". */
export function StepLabel({ n, done, children }: { n: number; done?: boolean; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors ${
          done ? "bg-[var(--sf-sage)] text-white" : "bg-white text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/15"
        }`}
        aria-hidden="true"
      >
        {done ? <CheckIcon className="h-3.5 w-3.5" /> : n}
      </span>
      <h3 className="text-base font-extrabold leading-tight">
        <span className="sr-only">Step {n}{done ? " (done)" : ""}: </span>
        {children}
      </h3>
    </div>
  );
}

/**
 * Progress header for multi-step sheets ("Step 2 of 4"). Put it in a GardenSheet `toolbar`
 * (or at the top of the body). `labels` are short step names shown under the dots at ≥sm.
 */
export function StepProgress({ current, total, labels }: { current: number; total: number; labels?: string[] }) {
  const pct = total <= 1 ? 100 : Math.round(((current - 1) / (total - 1)) * 100);
  return (
    <div>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-[var(--sf-ink)]/[0.08]"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Step ${current} of ${total}${labels?.[current - 1] ? `: ${labels[current - 1]}` : ""}`}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--sf-sage)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.max(pct, 6)}%` }}
        />
      </div>
      {labels && labels.length === total ? (
        <ol className="mt-2 hidden grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-1 sm:grid" style={{ ["--n" as string]: total }} aria-hidden="true">
          {labels.map((l, i) => (
            <li
              key={l}
              className={`truncate text-[11px] font-extrabold ${i === 0 ? "text-left" : i === total - 1 ? "text-right" : "text-center"} ${
                i + 1 < current ? "text-[var(--sf-sage-deep)]" : i + 1 === current ? "text-[var(--sf-ink)]" : "text-[var(--sf-soft)]/70"
              }`}
            >
              {i + 1 < current ? "✓ " : ""}
              {l}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
