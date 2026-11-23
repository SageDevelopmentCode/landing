"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Arrow, CheckIcon, TINT_BG, TINT_FG, type HomeTint } from "@/app/parent/_garden/ui";

// ─── Photo card (the Home `TuitionCards` recipe, as a real button) ───────────

export type CardTone = "pay" | "paid" | "plan" | "optional" | "locked";

const CTA_STYLE: Record<CardTone, string> = {
  pay: "bg-[var(--sf-coral-deep)] text-white shadow-[0_3px_0_0_#b85a4f] group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
  paid: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
  plan: "bg-[var(--sf-sage)] text-white shadow-[0_3px_0_0_var(--sf-sage-deep)] group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
  optional: "bg-white text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/15 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
  locked: "bg-[var(--sf-ink)]/[0.07] text-[var(--sf-soft)]",
};

export type PhotoCardProps = {
  image: string;
  imagePosition?: string;
  tint: HomeTint;
  term: string;
  title: string;
  /** Status pill on the photo, always text ("✓ 2 mo. paid", "Optional"). */
  badge?: { label: string; tone: "paid" | "note" } | null;
  cta: { label: string; tone: CardTone };
  amount?: string | null;
  onClick?: () => void;
  /** Disabled card with a reason line under it. */
  lockedReason?: string;
  /** Secondary link under the card ("View current plan"). */
  secondary?: { label: string; onClick: () => void };
};

const cardClass =
  "group flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-white text-left shadow-[0_18px_40px_-28px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]";

/** The original billing card shape (photo on top, details below), in Garden style. */
export function PhotoCard(p: PhotoCardProps) {
  const locked = p.cta.tone === "locked" || !p.onClick;
  const body = (
    <>
      <span className={`relative block h-28 w-full shrink-0 overflow-hidden ${TINT_BG[p.tint]}`}>
        <Image
          src={p.image}
          alt=""
          fill
          sizes="(min-width: 768px) 400px, 100vw"
          className={`object-cover transition-transform duration-500 motion-reduce:transition-none ${locked ? "grayscale-[40%]" : "group-hover:scale-105 group-focus-visible:scale-105"}`}
          style={p.imagePosition ? { objectPosition: p.imagePosition } : undefined}
        />
        {p.cta.tone === "locked" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--sf-ink)]/35" aria-hidden="true">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[var(--sf-ink)]">
              <Lock className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </span>
        ) : null}
        {p.badge ? (
          <span
            className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${
              p.badge.tone === "paid" ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" : "bg-white/90 text-[var(--sf-ink)] backdrop-blur-sm"
            }`}
          >
            {p.badge.tone === "paid" ? "✓ " : ""}
            {p.badge.label}
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col p-3.5">
        <span className="text-xs font-extrabold text-[var(--sf-soft)]">{p.term}</span>
        <span className="mt-0.5 text-[15px] font-extrabold leading-snug text-[var(--sf-ink)]">{p.title}</span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold transition-transform duration-200 ${CTA_STYLE[p.cta.tone]}`}>
            {p.cta.tone === "paid" ? <CheckIcon className="h-3 w-3" /> : null}
            {p.cta.tone === "locked" ? <Lock className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" /> : null}
            {p.cta.label}
            {p.cta.tone !== "paid" && p.cta.tone !== "locked" ? <Arrow className="h-3 w-3" /> : null}
          </span>
          {p.amount ? <span className="sf-display text-lg">{p.amount}</span> : null}
        </span>
      </span>
    </>
  );

  return (
    <div className="flex min-w-0 flex-col">
      {locked ? (
        <div role="group" aria-label={`${p.title}, ${p.cta.label}`} className={`${cardClass} cursor-not-allowed bg-white/70`}>
          {body}
        </div>
      ) : (
        <button type="button" onClick={p.onClick} className={`${cardClass} cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(43,42,38,0.6)] focus-visible:-translate-y-0.5`}>
          {body}
        </button>
      )}
      {p.lockedReason ? <p className="sf-hand mt-1.5 px-3 text-base leading-tight text-[var(--sf-coral-deep)]">{p.lockedReason}</p> : null}
      {p.secondary ? (
        <button
          type="button"
          onClick={p.secondary.onClick}
          className="mt-1 inline-flex min-h-11 items-center px-3 text-sm font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none cursor-pointer"
        >
          {p.secondary.label}
        </button>
      ) : null}
    </div>
  );
}

// ─── Selectable tiles (months, weeks, weekdays, dates) ──────────────────────

/** A toggle tile: `role="checkbox"`, paid tiles are disabled and say "Paid". */
export function SelectTile({
  checked,
  paid,
  disabled,
  onToggle,
  children,
  sub,
  tint = "mint",
  className = "",
  label,
}: {
  checked: boolean;
  paid?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: ReactNode;
  sub?: ReactNode;
  tint?: HomeTint;
  className?: string;
  /** Accessible name when `children` isn't plain text. */
  label?: string;
}) {
  const off = paid || disabled;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked || !!paid}
      aria-disabled={off || undefined}
      aria-label={label}
      onClick={() => {
        if (!off) onToggle();
      }}
      className={`relative flex min-h-11 min-w-0 flex-col items-start justify-center gap-0.5 rounded-[18px] px-3 py-2 text-left text-sm font-extrabold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
        paid
          ? "cursor-not-allowed bg-[var(--sf-mint)]/60 text-[var(--sf-sage-deep)]"
          : disabled
            ? "cursor-not-allowed bg-[var(--sf-ink)]/[0.04] text-[var(--sf-soft)]/60"
            : checked
              ? `cursor-pointer ${TINT_BG[tint]} ${TINT_FG[tint]} ring-2 ring-current`
              : "cursor-pointer bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/25"
      } ${className}`}
    >
      <span className="flex w-full items-center gap-1.5">
        {checked || paid ? <CheckIcon className="h-3 w-3 shrink-0" /> : null}
        <span className="min-w-0 truncate">{children}</span>
      </span>
      {sub ? <span className="w-full truncate text-[11px] font-bold opacity-80">{sub}</span> : null}
      {paid ? <span className="text-[11px] font-bold">Paid</span> : null}
    </button>
  );
}

/** Single-choice cards (`role="radiogroup"`), e.g. homeschool schedule tiers. */
export function ChoiceCards<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; title: ReactNode; sub?: ReactNode; aside?: ReactNode; extra?: ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`w-full rounded-[20px] px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
              on ? "bg-[var(--sf-mint)]/70 ring-2 ring-[var(--sf-sage)]" : "bg-white ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold">{o.title}</span>
                {o.sub ? <span className="block text-xs font-bold text-[var(--sf-soft)]">{o.sub}</span> : null}
              </span>
              {o.aside ? <span className="shrink-0 text-right">{o.aside}</span> : null}
            </span>
            {o.extra}
          </button>
        );
      })}
    </div>
  );
}

// ─── Totals + small text bits ───────────────────────────────────────────────

export function TotalRow({ label, value, strong = true, tint = "mint" }: { label: ReactNode; value: ReactNode; strong?: boolean; tint?: HomeTint }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 ${TINT_BG[tint]}`} aria-live="polite">
      <span className="min-w-0 text-sm font-bold text-[var(--sf-soft)]">{label}</span>
      <span className={strong ? "sf-display shrink-0 text-xl" : "shrink-0 text-sm font-extrabold"}>{value}</span>
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs font-bold text-[var(--sf-soft)]">{children}</p>;
}

export function EmailUs({ children }: { children?: ReactNode }) {
  return (
    <a href="mailto:sabrina@sagefield.co" className="font-extrabold text-[var(--sf-sage-deep)] underline underline-offset-2">
      {children ?? "sabrina@sagefield.co"}
    </a>
  );
}

/** "Need a different number of days for a specific week? Email us and we'll get it sorted." */
export function DifferentDaysNote() {
  return (
    <p className="mt-3 text-xs font-semibold leading-relaxed text-[var(--sf-soft)]">
      Need a different number of days for a specific week? <EmailUs>Email us</EmailUs> and we&apos;ll get it sorted.
    </p>
  );
}

export function firstName(name: string | null | undefined, fallback = "Child") {
  return name ? name.trim().split(/\s+/)[0] : fallback;
}
