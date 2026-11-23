"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Spinner, btnGhostSm, btnSheetPrimary, cardBase } from "@/app/parent/_garden/ui";

/** Garden form fields and cards for the My Children tabs and sheets. */

export const inputCls =
  "w-full min-h-12 rounded-[16px] bg-white px-4 py-3 text-[15px] font-semibold text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/10 placeholder:text-[var(--sf-soft)]/60 transition focus:outline-none focus:ring-[var(--sf-sage)] disabled:opacity-60";

export function TextField({
  label,
  required,
  value,
  onChange,
  ...rest
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-[var(--sf-ink)]">
        {label}
        {required ? (
          <>
            <span className="text-[var(--sf-coral-deep)]" aria-hidden="true">
              {" "}
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      <input id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} required={required} {...rest} />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  autoFocus,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-[var(--sf-ink)]">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className={`${inputCls} resize-y leading-relaxed`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-autofocus={autoFocus ? true : undefined}
      />
    </div>
  );
}

/** Yes / No radio pills (native radios, so arrow keys work even when nothing is picked yet). */
export function YesNoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-extrabold text-[var(--sf-ink)]">{label}</legend>
      <div className="flex gap-2">
        {[
          { v: "yes", l: "Yes" },
          { v: "no", l: "No" },
        ].map((o) => (
          <label
            key={o.v}
            className={`relative inline-flex min-h-11 min-w-20 cursor-pointer items-center justify-center rounded-full px-5 text-sm font-extrabold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--sf-sky)] ${
              value === o.v ? "bg-[var(--sf-ink)] text-white" : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:bg-[var(--sf-butter)]/60"
            }`}
          >
            <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} className="sr-only" />
            {value === o.v ? <span aria-hidden="true">✓&nbsp;</span> : null}
            {o.l}
          </label>
        ))}
        {value === "" ? <span className="self-center text-xs font-bold text-[var(--sf-soft)]">Not set</span> : null}
      </div>
    </fieldset>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim();
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-[var(--sf-ink)]/10 py-3 last:border-0">
      <dt className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/80">{label}</dt>
      <dd className={`whitespace-pre-line text-[15px] font-bold ${v ? "text-[var(--sf-ink)]" : "italic text-[var(--sf-soft)]/70"}`}>{v || "Not provided"}</dd>
    </div>
  );
}

/** White card with an emoji, a Display h3 and an optional Edit button. */
export function SectionCard({
  emoji,
  title,
  onEdit,
  editLabel,
  children,
  className = "",
}: {
  emoji: string;
  title: string;
  onEdit?: () => void;
  /** Accessible label for the edit button, e.g. "Edit Medical Info". */
  editLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${cardBase} px-5 pb-3 pt-5 sm:px-6 ${className}`}>
      <div className="mb-1 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-butter)]/70 text-lg" aria-hidden="true">
          {emoji}
        </span>
        <h3 className="sf-display min-w-0 flex-1 text-xl leading-tight">{title}</h3>
        {onEdit ? (
          <button type="button" onClick={onEdit} className={`${btnGhostSm} !min-h-10 !px-4`} aria-label={editLabel}>
            <PencilIcon />
            Edit
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function PencilIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 3.5l3 3L7 16l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 011-1h2a1 1 0 011 1v1.5M5.5 5.5l.8 10.6a1.5 1.5 0 001.5 1.4h4.4a1.5 1.5 0 001.5-1.4l.8-10.6" />
    </svg>
  );
}

/** Round 44px icon button with a required accessible label. */
export function IconButton({
  label,
  onClick,
  children,
  busy,
  disabled,
  tone = "ink",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  tone?: "ink" | "coral";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--sf-soft)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
        tone === "coral"
          ? "hover:bg-[var(--sf-coral)]/20 hover:text-[var(--sf-coral-deep)] focus-visible:text-[var(--sf-coral-deep)]"
          : "hover:bg-[var(--sf-mint)] hover:text-[var(--sf-sage-deep)] focus-visible:text-[var(--sf-sage-deep)]"
      }`}
    >
      {busy ? <Spinner /> : children}
    </button>
  );
}

/** Sticky sheet footer: primary button plus a one-line status under it. */
export function SheetSaveFooter({
  label,
  busy,
  disabled,
  onClick,
  status,
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  status?: ReactNode;
}) {
  return (
    <div>
      <button type="button" className={btnSheetPrimary} onClick={onClick} disabled={busy || disabled} aria-busy={busy || undefined}>
        {busy ? <Spinner /> : null}
        {busy ? "Saving…" : label}
      </button>
      {status ? (
        <p className="mt-2 text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}

/** Inline error inside a sheet (server validation messages, etc.). */
export function InlineError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-[16px] bg-[var(--sf-coral)]/20 px-4 py-3 text-sm font-bold text-[var(--sf-coral-deep)]">
      {children}
    </p>
  );
}
