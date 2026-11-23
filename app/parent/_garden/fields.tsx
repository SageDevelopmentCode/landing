"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { formatPhone } from "@/app/utils/formatPhone";
import { formatDate } from "@/app/utils/formatDate";
import { CheckIcon, Spinner, btnGhostSm, btnSheetPrimary, cardBase } from "./ui";

/** Garden form fields and cards shared by portal pages and sheets (first built for My Children). */

export const inputCls =
  "w-full min-h-12 rounded-[16px] bg-white px-4 py-3 text-[15px] font-semibold text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/10 placeholder:text-[var(--sf-soft)]/60 transition focus:outline-none focus:ring-[var(--sf-sage)] disabled:opacity-60";

/** Label with an optional coral required star (announced as "(required)"). */
export function FieldLabel({ htmlFor, required, optional, children }: { htmlFor: string; required?: boolean; optional?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-extrabold text-[var(--sf-ink)]">
      {children}
      {required ? (
        <>
          <span className="text-[var(--sf-coral-deep)]" aria-hidden="true">
            {" "}
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      ) : null}
      {optional ? <span className="font-bold text-[var(--sf-soft)]/80"> (optional)</span> : null}
    </label>
  );
}

/** Coral inline message under a field. Link it with `aria-describedby={id}`. */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-bold text-[var(--sf-coral-deep)]">
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  );
}

/** Soft helper line under a field. */
export function FieldHint({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] font-semibold text-[var(--sf-soft)]">
      {children}
    </p>
  );
}

const invalidCls = "!ring-[var(--sf-coral-deep)]/60";

export function TextField({
  label,
  required,
  optional,
  value,
  onChange,
  error,
  hint,
  ...rest
}: {
  label: string;
  required?: boolean;
  /** Shows "(optional)" after the label. */
  optional?: boolean;
  value: string;
  onChange: (v: string) => void;
  /** Inline validation message; marks the input `aria-invalid`. */
  error?: string | null;
  hint?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <input
        id={id}
        className={`${inputCls} ${error ? invalidCls : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        {...rest}
      />
      {error ? <FieldError id={msgId}>{error}</FieldError> : <FieldHint id={msgId}>{hint}</FieldHint>}
    </div>
  );
}

/** Phone input that formats as (555) 123-4567 while typing. */
export function PhoneField(props: Omit<Parameters<typeof TextField>[0], "type" | "inputMode">) {
  return (
    <TextField
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={props.autoComplete ?? "tel"}
      placeholder={props.placeholder ?? "(555) 123-4567"}
      onChange={(v) => props.onChange(formatPhone(v))}
    />
  );
}

/** Text date input masked as MM/DD/YYYY while typing. */
export function MaskedDateField(props: Omit<Parameters<typeof TextField>[0], "type" | "inputMode">) {
  return (
    <TextField
      {...props}
      type="text"
      inputMode="numeric"
      placeholder={props.placeholder ?? "MM/DD/YYYY"}
      onChange={(v) => props.onChange(formatDate(v))}
    />
  );
}

export function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? msgId : undefined}
        className={`${inputCls} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%232b2a26' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 8l5 5 5-5'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11 ${error ? invalidCls : ""}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={msgId}>{error}</FieldError>
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
  required,
  optional,
  error,
  hint,
  maxLength,
  disabled,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  required?: boolean;
  optional?: boolean;
  error?: string | null;
  hint?: ReactNode;
  /** Also shows a live "120 / 2000" counter once the parent starts typing. */
  maxLength?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <FieldLabel htmlFor={id} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        rows={rows}
        className={`${inputCls} resize-y leading-relaxed ${error ? invalidCls : ""}`}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        onChange={(e) => onChange(e.target.value)}
        data-autofocus={autoFocus ? true : undefined}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{error ? <FieldError id={msgId}>{error}</FieldError> : <FieldHint id={msgId}>{hint}</FieldHint>}</div>
        {maxLength && value.length > 0 ? (
          <span className={`mt-1.5 shrink-0 text-xs font-bold tabular-nums ${value.length >= maxLength ? "text-[var(--sf-coral-deep)]" : "text-[var(--sf-soft)]/70"}`}>
            {value.length} / {maxLength}
          </span>
        ) : null}
      </div>
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

/**
 * Multi-select checkbox pills ("How you'd like to help"). Native checkboxes, so Space toggles
 * and screen readers announce the state. Shows "n selected" next to the legend.
 */
export function CheckChipGroup({
  legend,
  options,
  value,
  onChange,
  required,
  error,
  disabled,
}: {
  legend: ReactNode;
  options: readonly string[] | { value: string; label: ReactNode }[];
  value: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}) {
  const id = useId();
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset aria-describedby={error ? `${id}-msg` : undefined} disabled={disabled}>
      <legend className="mb-2 flex w-full items-center justify-between gap-3 text-sm font-extrabold text-[var(--sf-ink)]">
        <span>
          {legend}
          {required ? (
            <>
              <span className="text-[var(--sf-coral-deep)]" aria-hidden="true">
                {" "}
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </span>
        {value.length > 0 ? <span className="shrink-0 text-xs font-bold text-[var(--sf-sage-deep)]">{value.length} selected</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = value.includes(o.value);
          return (
            <label
              key={o.value}
              className={`relative inline-flex min-h-11 cursor-pointer select-none items-center gap-1.5 rounded-full px-4 text-sm font-extrabold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--sf-sky)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                on
                  ? "bg-[var(--sf-sage)] text-white shadow-[0_3px_0_0_var(--sf-sage-deep)]"
                  : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:bg-[var(--sf-mint)]/60"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(o.value)} />
              {on ? <CheckIcon className="h-3.5 w-3.5" /> : null}
              {o.label}
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-msg`}>{error}</FieldError>
    </fieldset>
  );
}

export type RadioCardOption<T extends string> = {
  value: T;
  title: ReactNode;
  description?: ReactNode;
  /** Decorative emoji shown in a bubble. */
  emoji?: string;
};

/**
 * Single-choice cards (`role="radiogroup"` via native radios): consent levels, Option A / B,
 * food preferences. `allowDeselect` lets a click on the chosen card clear it.
 */
export function RadioCardGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  allowDeselect,
  disabled,
  error,
  columns = 1,
}: {
  legend: ReactNode;
  options: RadioCardOption<T>[];
  value: T | null | "";
  onChange: (v: T | null) => void;
  allowDeselect?: boolean;
  disabled?: boolean;
  error?: string | null;
  columns?: 1 | 2 | 3;
}) {
  const name = useId();
  const grid = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset disabled={disabled} aria-describedby={error ? `${name}-msg` : undefined}>
      <legend className="mb-2 text-sm font-extrabold text-[var(--sf-ink)]">{legend}</legend>
      <div className={`grid grid-cols-1 gap-2.5 ${grid}`}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className={`relative flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-[20px] px-4 py-3.5 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--sf-sky)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                on
                  ? "bg-[var(--sf-mint)]/80 ring-2 ring-[var(--sf-sage)]"
                  : "bg-white ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/25"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                onClick={() => {
                  if (allowDeselect && on) onChange(null);
                }}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                  on ? "bg-[var(--sf-sage)] text-white" : "bg-white ring-2 ring-[var(--sf-ink)]/20"
                }`}
                aria-hidden="true"
              >
                {on ? <CheckIcon className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[15px] font-extrabold leading-snug">
                  {o.emoji ? <span aria-hidden="true">{o.emoji}</span> : null}
                  <span className="min-w-0">{o.title}</span>
                </span>
                {o.description ? <span className="mt-0.5 block text-[13px] font-semibold leading-relaxed text-[var(--sf-soft)]">{o.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={`${name}-msg`}>{error}</FieldError>
    </fieldset>
  );
}

/** Large tappable checkbox row for acknowledgements ("I have reviewed…"). */
export function CheckboxRow({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[18px] px-4 py-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--sf-sky)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
        checked ? "bg-[var(--sf-mint)]/70" : "bg-white ring-1 ring-[var(--sf-ink)]/10 hover:bg-[var(--sf-butter)]/40"
      }`}
    >
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] transition ${
          checked ? "bg-[var(--sf-sage)] text-white" : "bg-white ring-2 ring-[var(--sf-ink)]/25"
        }`}
        aria-hidden="true"
      >
        {checked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="min-w-0 text-sm font-semibold leading-relaxed text-[var(--sf-ink)]">{children}</span>
    </label>
  );
}

/** Dashed "🔒 locked step" card for gated sections (sign only after saving the form above). */
export function LockedNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-[18px] border-2 border-dashed border-[var(--sf-ink)]/15 bg-white/60 px-4 py-3 text-sm font-bold text-[var(--sf-soft)]">
      <span aria-hidden="true">🔒</span>
      <span>{children}</span>
    </p>
  );
}

/** Mint "✓ saved" confirmation line inside a sheet. */
export function SavedNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="flex items-start gap-2 rounded-[16px] bg-[var(--sf-mint)]/80 px-4 py-3 text-sm font-bold text-[var(--sf-sage-deep)]">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
