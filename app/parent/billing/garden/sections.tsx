"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { EmptyState } from "@/app/parent/_garden/states";
import { Arrow, CheckIcon, KidAvatar, btnCoralSm, btnSageSm } from "@/app/parent/_garden/ui";
import { formatCents } from "@/shared/billing/school-year";
import type { NonEnrolledApp, PendingPaymentRequest } from "../page";
import { formatDate, formatPaymentType, formatProgram } from "./data";

// ─── Children sidebar (original layout: desktop column; phones get chips) ─────

export type BillingChild = {
  id: string;
  name: string;
  imageUrl: string | null;
  sub: string | null;
  attention: boolean;
};

/** Desktop "Children" column, a `role="tablist"` with arrow-key navigation. */
export function ChildrenSidebar({
  items,
  activeId,
  onChange,
  controls,
}: {
  items: BillingChild[];
  activeId: string | null;
  onChange: (id: string) => void;
  controls: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = items.findIndex((c) => c.id === activeId);
    let next: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }
  return (
    <aside className="pointer-events-auto hidden w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-[var(--sf-ink)]/[0.06] bg-white/60 px-3 pt-8 md:flex">
      <p className="px-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--sf-soft)]" id="billing-children-label">
        Children
      </p>
      <div role="tablist" aria-orientation="vertical" aria-labelledby="billing-children-label" className="flex flex-col gap-1.5">
        {items.map((c, i) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={controls}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(c.id)}
              onKeyDown={onKeyDown}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-[18px] px-2.5 py-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
                active
                  ? "bg-white text-[var(--sf-ink)] shadow-[0_10px_24px_-18px_rgba(43,42,38,0.55)] ring-2 ring-[var(--sf-sage)]"
                  : "text-[var(--sf-soft)] hover:bg-white hover:text-[var(--sf-ink)]"
              }`}
            >
              {c.id === "__other__" ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sf-ink)]/[0.06] text-sm" aria-hidden="true">
                  ✉️
                </span>
              ) : (
                <KidAvatar id={c.id} name={c.name} imageUrl={c.imageUrl} size="h-8 w-8 text-[11px]" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold leading-tight">{c.name}</span>
                {c.sub ? <span className="block truncate text-xs font-bold leading-tight text-[var(--sf-soft)]">{c.sub}</span> : null}
              </span>
              {c.attention ? (
                <>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-butter)] ring-2 ring-[#c9a100]/40" aria-hidden="true" />
                  <span className="sr-only">(Enrollment not complete)</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

export function BillingHero({
  firstName,
  programLabel,
  dropInLabel,
}: {
  firstName: string | null;
  programLabel: string | null;
  dropInLabel: string | null;
}) {
  return (
    <header>
      <h1 className="sf-display text-[2.4rem] leading-[1] sm:text-5xl">Tuition &amp; Billing</h1>
      {programLabel ? (
        <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          {firstName ? <span className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">{firstName}&apos;s programs:</span> : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sf-mint)] px-3 py-1 text-xs font-extrabold text-[var(--sf-sage-deep)]">{programLabel}</span>
            {dropInLabel ? <span className="rounded-full bg-[var(--sf-butter)] px-3 py-1 text-xs font-extrabold text-[#7a5b00]">{dropInLabel}</span> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** Dismissible notice above the header: "Tuition due December 1." */
export function DueBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="note" className="flex items-center gap-3 rounded-[20px] bg-[var(--sf-butter)]/80 py-1.5 pl-4 pr-1.5">
      <span aria-hidden="true">📌</span>
      <p className="flex-1 text-sm font-extrabold text-[#5c4500]">
        Tuition due <span className="underline decoration-2 underline-offset-2">December 1</span>.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#7a5b00] transition hover:bg-white/50 focus-visible:bg-white/60 focus-visible:outline-none"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </div>
  );
}

// ─── Banners ────────────────────────────────────────────────────────────────

/** One banner for "Secure {name}'s spot for 2026–2027" (drop-in and full-time). */
export function SecureSpotBanner({ childFirstName, onCommit }: { childFirstName: string | null; onCommit: () => void }) {
  return (
    <section aria-label="Secure your spot for 2026–2027" className="flex flex-col gap-3 rounded-[28px] bg-[var(--sf-mint)]/70 px-5 py-5 md:flex-row md:items-center md:justify-between md:gap-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          🌱
        </span>
        <div>
          <p className="text-base font-extrabold">Secure {childFirstName ? `${childFirstName}'s` : "your child's"} spot for 2026–2027</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--sf-soft)]">
            {childFirstName
              ? `Want to make sure ${childFirstName}'s spot is ready for the 2026–2027 school year?`
              : "Want to make sure your child's spot is ready for the 2026–2027 school year?"}{" "}
            If your family plans to continue, secure their place now.
          </p>
        </div>
      </div>
      <button type="button" onClick={onCommit} className={`${btnSageSm} w-full shrink-0 md:w-auto`}>
        Commit to School Year
      </button>
    </section>
  );
}

export function SiblingsBanner({ action }: { action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] bg-[var(--sf-sky)]/70 px-4 py-3.5 sm:flex-row sm:items-center">
      <span className="text-xl" aria-hidden="true">
        👨‍👩‍👧
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[#2d5d86]">Pay for all children in one transaction</p>
        <p className="text-xs font-semibold text-[var(--sf-soft)]">Add siblings during checkout and pay only one processing fee.</p>
      </div>
      {action}
    </div>
  );
}

// ─── Step block (School Year steps, original left-indicator layout) ─────────

export function StepBlock({
  n,
  total,
  title,
  done,
  optional,
  subtitle,
  children,
}: {
  n: number;
  total: number;
  title: string;
  done?: boolean;
  optional?: boolean;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex shrink-0 flex-row items-center gap-2.5 sm:w-44 sm:flex-col sm:items-start sm:gap-1.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
            optional ? "bg-[var(--sf-lav)] text-[#6b3f86]" : "bg-[var(--sf-sage)] text-white"
          }`}
          aria-hidden="true"
        >
          {optional ? "✦" : done ? <CheckIcon className="h-4 w-4" /> : n}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--sf-soft)]" aria-hidden="true">
            {optional ? "Optional" : `Step ${n}`}
          </span>
          <h3 className="sf-display text-xl leading-tight">
            <span className="sr-only">{optional ? "Optional: " : `Step ${n} of ${total}${done ? " (done)" : ""}: `}</span>
            {title}
          </h3>
          {subtitle ? (
            <span className={`mt-0.5 hidden text-xs font-extrabold sm:block ${optional ? "text-[var(--sf-soft)]" : "text-[#a2552e]"}`}>{subtitle}</span>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
    </li>
  );
}

// ─── Small cards ────────────────────────────────────────────────────────────

export function AllCaughtUp() {
  return <EmptyState emoji="🌿" title="All caught up!" body="You have no outstanding payments at this time." />;
}

export function NonEnrolledCard({ app }: { app: NonEnrolledApp }) {
  return (
    <Link
      href={`/parent/dashboard?app=${app.id}`}
      className="group flex items-center gap-4 rounded-[26px] bg-[var(--sf-butter)]/70 px-5 py-4 transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
    >
      <KidAvatar id={app.student_id} name={app.name ?? "Student"} size="h-11 w-11 text-sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold">{app.name ?? "Student"}</span>
        <span className="block text-xs font-extrabold text-[#7a5b00]">Enrollment not complete</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-extrabold text-[#7a5b00]">
        Complete enrollment <Arrow />
      </span>
    </Link>
  );
}

export function TotalOwed({ cents }: { cents: number }) {
  return (
    <div className="flex items-center justify-between rounded-[20px] bg-[var(--sf-mint)]/70 px-4 py-3">
      <span className="text-sm font-extrabold text-[var(--sf-sage-deep)]">Total owed</span>
      <span className="sf-display text-xl">{formatCents(cents)}</span>
    </div>
  );
}

export function TuitionCodeLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-1.5 rounded-full px-2 text-sm font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
    >
      Have a tuition code?
    </button>
  );
}

// ─── Pending request sheet ──────────────────────────────────────────────────

export function PendingSheet({
  pending,
  studentName,
  canPay,
  onPay,
  onClose,
}: {
  pending: PendingPaymentRequest | null;
  studentName: string | null;
  /** False when no checkout matches this request; the parent is pointed to "Have a tuition code?". */
  canPay: boolean;
  onPay: () => void;
  onClose: () => void;
}) {
  return (
    <GardenSheet
      open={!!pending}
      onClose={onClose}
      title={studentName ?? "Payment Request"}
      icon="📬"
      note={pending ? pending.label : undefined}
      footer={
        pending ? (
          canPay ? (
            <button type="button" onClick={onPay} className={`${btnCoralSm} min-h-[52px] w-full text-base`}>
              Pay Now
            </button>
          ) : (
            <p className="text-center text-sm font-bold text-[var(--sf-soft)]">
              Pay with the tuition code from the school, or email <a className="font-extrabold text-[var(--sf-sage-deep)] underline" href="mailto:sabrina@sagefield.co">sabrina@sagefield.co</a>.
            </p>
          )
        ) : null
      }
    >
      {pending ? (
        <dl className="flex flex-col gap-3 rounded-[24px] bg-white p-4 ring-1 ring-[var(--sf-ink)]/10">
          {[
            ["Label", pending.label],
            ["Program", formatProgram(pending.program)],
            ["Payment Type", formatPaymentType(pending.payment_type)],
            ["Amount", pending.amount_cents != null ? formatCents(pending.amount_cents) : "—"],
            ["Requested On", formatDate(pending.created_at)],
            ...(studentName ? [["Student", studentName]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">{k}</dt>
              <dd className="text-right text-sm font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </GardenSheet>
  );
}
