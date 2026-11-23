"use client";

import { useCallback, type ReactNode, type RefObject } from "react";
import { InfoRow } from "@/app/parent/_garden/fields";
import { Arrow, CheckIcon, StepLabel, btnGhostSm, btnSheetPrimary, cardBase, Spinner } from "@/app/parent/_garden/ui";

/** Numbered block inside an enrollment sheet. `id` lets the footer / jump list scroll to it. */
export function SheetStep({
  n,
  title,
  done,
  id,
  children,
}: {
  n: number;
  title: ReactNode;
  done?: boolean;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4" aria-label={typeof title === "string" ? title : undefined}>
      <StepLabel n={n} done={done}>
        {title}
      </StepLabel>
      <div className="flex flex-col gap-4 sm:pl-[38px]">{children}</div>
    </section>
  );
}

/** Contract / policy body copy. */
export function LegalText({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 text-[15px] font-medium leading-relaxed text-[var(--sf-soft)]">{children}</div>;
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((b, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sf-sage)]" aria-hidden="true" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

/** Read-only facts pulled from the application (student, guardians). */
export function FactsCard({ title, rows }: { title?: string; rows: { label: string; value: string | null | undefined }[] }) {
  return (
    <div className={`${cardBase} px-5 py-2`}>
      {title ? <p className="pt-3 text-xs font-extrabold uppercase tracking-wide text-[var(--sf-sage-deep)]">{title}</p> : null}
      <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </dl>
    </div>
  );
}

/** Soft tinted note (e.g. "Allergies on file"). */
export function NoteCard({ tone = "butter", title, children }: { tone?: "butter" | "coral" | "mint" | "sky"; title?: ReactNode; children: ReactNode }) {
  const bg = {
    butter: "bg-[var(--sf-butter)]/50",
    coral: "bg-[var(--sf-coral)]/15",
    mint: "bg-[var(--sf-mint)]/70",
    sky: "bg-[var(--sf-sky)]/60",
  }[tone];
  return (
    <div className={`rounded-[20px] ${bg} px-4 py-3`}>
      {title ? <p className="text-sm font-extrabold text-[var(--sf-ink)]">{title}</p> : null}
      <div className="text-sm font-semibold leading-relaxed text-[var(--sf-soft)]">{children}</div>
    </div>
  );
}

/** Scroll a section of the sheet body into view and move focus there for keyboard users. */
export function useScrollToSection(bodyRef: RefObject<HTMLDivElement | null>) {
  return useCallback(
    (id: string) => {
      const body = bodyRef.current;
      const el = body?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!body || !el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 12;
      body.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
      const focusTarget = el.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])");
      window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), reduce ? 0 : 350);
    },
    [bodyRef],
  );
}

/**
 * Sticky footer for signing sheets: one primary action that adapts to where the parent is
 * (save the form → go to the next signature → done) and a one-line status under it.
 */
export function SigningFooter({
  total,
  signed,
  readOnly,
  onClose,
  onNext,
  save,
}: {
  total: number;
  signed: number;
  readOnly?: boolean;
  onClose: () => void;
  /** Scroll to the next unsigned section. */
  onNext?: () => void;
  /** When the form above still needs saving, the primary becomes this save action. */
  save?: { label: string; busy: boolean; onClick: () => void } | null;
}) {
  const remaining = Math.max(total - signed, 0);
  const all = remaining === 0;
  const status = all ? (
    <span className="inline-flex items-center gap-1.5 text-[var(--sf-sage-deep)]">
      <CheckIcon /> All sections signed
    </span>
  ) : (
    `${remaining} section${remaining !== 1 ? "s" : ""} remaining`
  );

  let primary: ReactNode;
  if (!readOnly && save) {
    primary = (
      <button type="button" className={btnSheetPrimary} onClick={save.onClick} disabled={save.busy} aria-busy={save.busy || undefined}>
        {save.busy ? <Spinner /> : null}
        {save.busy ? "Saving…" : save.label}
      </button>
    );
  } else if (!readOnly && !all && onNext) {
    primary = (
      <button type="button" className={btnSheetPrimary} onClick={onNext}>
        Go to next signature <Arrow />
      </button>
    );
  } else {
    primary = (
      <button type="button" className={readOnly || !all ? `${btnGhostSm} w-full min-h-[52px] text-base` : btnSheetPrimary} onClick={onClose}>
        {readOnly ? "Close" : "Done"}
      </button>
    );
  }

  return (
    <div>
      {primary}
      <p className="mt-2 text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

export function signedLabel(signed: number, total: number) {
  return `${signed} of ${total} signed`;
}

/** Contract titles carry their own "3. " prefix; the step bubble already shows the number. */
export function stripNumber(title: string) {
  return title.replace(/^\d+\.\s*/, "");
}
