"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Arrow, CheckIcon, KidAvatar, TINT_BG, TINT_FG, btnCoralSm, btnGhostSm, btnInkSm, cardBase } from "@/app/parent/_garden/ui";
import {
  CHECKLIST_ITEMS,
  TOTAL_STEPS,
  completedCount,
  isItemDone,
  nextRequiredItem,
  requiredComplete,
  signedSectionCount,
  type Application,
  type ChecklistItem,
  type ChecklistState,
} from "./checklist";

/* ── Hero: name, progress, application ─────────────────────────────── */

export function EnrollmentHero({
  childName,
  childId,
  imageUrl,
  programLabel,
  state,
  onViewApplication,
}: {
  childName: string;
  childId: string;
  imageUrl: string | null;
  programLabel: string | null;
  state: ChecklistState;
  onViewApplication: () => void;
}) {
  const reduce = useReducedMotion();
  const done = completedCount(state);
  const complete = requiredComplete(state);
  const remaining = TOTAL_STEPS - done;
  const pct = Math.round((done / TOTAL_STEPS) * 100);

  return (
    <div className={`${cardBase} px-5 py-5 sm:px-7 sm:py-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <KidAvatar id={childId} name={childName} imageUrl={imageUrl} size="h-14 w-14 text-base" />
          <div className="min-w-0">
            <h1 className="sf-display text-[2rem] leading-none sm:text-[2.4rem]">Enrollment Checklist</h1>
            <p className="sf-hand mt-1 truncate text-lg leading-tight text-[var(--sf-sage-deep)]">
              {childName}
              {programLabel ? ` · ${programLabel}` : ""}
            </p>
          </div>
        </div>
        <button type="button" onClick={onViewApplication} className={`${btnGhostSm} shrink-0 self-start sm:self-auto`}>
          <span aria-hidden="true">📄</span> View Application
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-sm font-extrabold">
            {done} of {TOTAL_STEPS} steps completed
          </p>
          <p className={`text-xs font-extrabold ${complete ? "text-[var(--sf-sage-deep)]" : "text-[var(--sf-soft)]"}`}>
            {complete ? "All steps complete — enrollment is finalized!" : `${remaining} step${remaining !== 1 ? "s" : ""} remaining`}
          </p>
        </div>
        <div
          className="relative h-3 overflow-hidden rounded-full bg-[var(--sf-ink)]/[0.08]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${TOTAL_STEPS} steps completed`}
        >
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--sf-sage)]"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${Math.max(pct, 4)}%` }}
            transition={{ duration: reduce ? 0 : 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── "Next up": the first required step that still needs the parent ── */

export function NextUpCard({ state, onOpen }: { state: ChecklistState; onOpen: (item: ChecklistItem) => void }) {
  const next = nextRequiredItem(state);
  if (!next) return null;
  const requiredLeft = CHECKLIST_ITEMS.filter((i) => i.required && !isItemDone(i, state)).length;
  const cta = next.kind === "fee" ? "Pay now" : next.kind === "immunization" ? "Upload records" : signedSectionCount(next, state.signatures) > 0 ? "Keep signing" : "Start";
  return (
    <div className={`rounded-[28px] p-5 sm:p-6 ${TINT_BG[next.tint]}`}>
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-[0_3px_0_0_rgba(43,42,38,0.12)]" aria-hidden="true">
          {next.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`sf-hand text-lg leading-none ${TINT_FG[next.tint]}`}>
            next up · {requiredLeft} required step{requiredLeft !== 1 ? "s" : ""} left
          </p>
          <h2 className="mt-1.5 text-[18px] font-extrabold leading-snug">{next.title}</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--sf-soft)]">{next.subtitle}</p>
          <button type="button" onClick={() => onOpen(next)} className={`${next.kind === "fee" ? btnCoralSm : btnInkSm} mt-4`}>
            {cta} <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Enrollment Confirmed (real copy from the old dashboard) ───────── */

export function ConfirmedCard({ childName, programLabel }: { childName: string; programLabel: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[28px] bg-[var(--sf-mint)]/80 px-5 py-5 sm:px-7"
      role="status"
    >
      <div className="flex items-start gap-3.5">
        <span className="text-3xl leading-none" aria-hidden="true">
          🎉
        </span>
        <div className="min-w-0">
          <h2 className="sf-display text-2xl leading-tight text-[var(--sf-sage-deep)]">Enrollment Confirmed!</h2>
          <p className="mt-1 text-[15px] font-extrabold text-[var(--sf-sage-deep)]">
            {childName} is confirmed and received for the <span className="font-black">{programLabel}</span> at Sage Field Private School. ✨
          </p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--sf-sage-deep)]/85">
            Your child&apos;s spot is now secured and we cannot wait to welcome them. Our team will be in touch soon with more details about what to expect next.
          </p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--sf-sage-deep)]/85">
            If you have any questions in the meantime, please don&apos;t hesitate to reach out at{" "}
            <a href="mailto:sabrina@sagefield.co" className="font-extrabold underline underline-offset-2">
              sabrina@sagefield.co
            </a>
            .
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Checklist rows ────────────────────────────────────────────────── */

function StatusPill({ item, state }: { item: ChecklistItem; state: ChecklistState }) {
  const done = isItemDone(item, state);
  const base = "inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold whitespace-nowrap";
  if (done) {
    const label = item.kind === "fee" ? "Paid" : item.kind === "immunization" ? "Uploaded" : "Completed";
    return (
      <span className={`${base} bg-[var(--sf-sage)] text-white`}>
        <CheckIcon className="h-3 w-3" /> {label}
      </span>
    );
  }
  if (item.kind === "fee") return <span className={`${base} bg-[var(--sf-coral-deep)] text-white`}>Pay</span>;
  if (item.kind === "immunization") return <span className={`${base} bg-[var(--sf-butter)] text-[#5c4400]`}>Upload</span>;
  const signed = signedSectionCount(item, state.signatures);
  if (signed > 0) {
    return (
      <span className={`${base} bg-[var(--sf-sky)] text-[#2d5d86]`}>
        {signed} / {item.contractSections} signed
      </span>
    );
  }
  return <span className={`${base} bg-[var(--sf-butter)] text-[#5c4400]`}>Sign</span>;
}

export function ChecklistRows({ state, onOpen }: { state: ChecklistState; onOpen: (item: ChecklistItem) => void }) {
  const reduce = useReducedMotion();
  return (
    <ol className="flex flex-col gap-2.5" aria-label="Enrollment steps">
      {CHECKLIST_ITEMS.map((item, i) => {
        const done = isItemDone(item, state);
        return (
          <motion.li
            key={item.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(i * 0.03, 0.3) }}
          >
            <button
              type="button"
              onClick={() => onOpen(item)}
              className={`group flex min-h-[68px] w-full items-center gap-3.5 rounded-[22px] px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] sm:px-5 cursor-pointer ${
                done
                  ? "bg-[var(--sf-mint)]/45 ring-1 ring-[var(--sf-sage)]/25 hover:bg-[var(--sf-mint)]/70"
                  : "bg-white shadow-[0_14px_30px_-24px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.07] hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/20 focus-visible:-translate-y-0.5"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl transition ${done ? "bg-[var(--sf-sage)] text-white" : TINT_BG[item.tint]}`}
                aria-hidden="true"
              >
                {done ? <CheckIcon className="h-5 w-5" /> : item.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] font-extrabold leading-snug ${done ? "text-[var(--sf-sage-deep)]" : ""}`}>{item.title}</span>
                <span className="block truncate text-[13px] font-semibold text-[var(--sf-soft)]">{item.subtitle}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                {!item.required ? (
                  <span className="inline-flex min-h-7 items-center rounded-full bg-[var(--sf-ink)]/[0.06] px-2.5 text-xs font-extrabold text-[var(--sf-soft)]">Optional</span>
                ) : null}
                <StatusPill item={item} state={state} />
              </span>
              <Arrow className="hidden h-4 w-4 shrink-0 text-[var(--sf-soft)]/60 transition group-hover:translate-x-0.5 sm:block" />
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}

export function AnotherKidNote() {
  return (
    <p className="mt-4 text-center text-sm font-semibold text-[var(--sf-soft)]">
      Have another kid?{" "}
      <Link href="/apply/step/1?new=1" className="font-extrabold text-[var(--sf-sage-deep)] underline underline-offset-2">
        Create an application for them
      </Link>{" "}
      — you can pay a combined registration fee for all children in one transaction.
    </p>
  );
}

/* ── Pending application (incomplete or under review) ──────────────── */

export function PendingPanel({
  app,
  childName,
  programLabel,
  continueHref,
  onView,
  codeEntry,
}: {
  app: Application;
  childName: string;
  programLabel: string | null;
  continueHref: string;
  onView: () => void;
  codeEntry: React.ReactNode;
}) {
  const inProgress = app.status === "in_progress";
  return (
    <div className="rounded-[28px] bg-[var(--sf-butter)]/55 px-6 py-8 text-center sm:px-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-[0_4px_0_0_rgba(43,42,38,0.1)]" aria-hidden="true">
        {inProgress ? "📝" : "⏳"}
      </span>
      <h1 className="sf-display mt-4 text-[2rem] leading-tight">{inProgress ? "Application Incomplete" : "Application Under Review"}</h1>
      {programLabel ? <p className="sf-hand mt-1 text-lg text-[#7a5b00]">{programLabel}</p> : null}
      <p className="mx-auto mt-2 max-w-md text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">
        {inProgress
          ? `${childName}'s application hasn't been submitted yet. Pick up where you left off to complete it.`
          : `${childName}'s application has been submitted and is currently under review. We'll be in touch once a decision has been made.`}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        {inProgress ? (
          <Link href={continueHref} className={btnInkSm}>
            Continue Application <Arrow />
          </Link>
        ) : (
          <>
            <button type="button" onClick={onView} className={btnGhostSm}>
              View Application
            </button>
            {codeEntry}
          </>
        )}
      </div>
    </div>
  );
}
