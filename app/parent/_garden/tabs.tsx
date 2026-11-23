"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

/**
 * Accessible tab and segmented controls for the parent portal.
 * Arrow keys / Home / End move between options (roving tabindex), as in the WAI-ARIA tabs pattern.
 */

export type TabOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Decorative icon before the label. */
  icon?: ReactNode;
  /** Small count bubble after the label (e.g. unread). Pair with `badgeLabel` for screen readers. */
  badge?: number | string | null;
  badgeLabel?: string;
  /** Coral "needs attention" dot. Pair with `dotLabel` (e.g. "unsaved changes"). */
  dot?: boolean;
  dotLabel?: string;
  disabled?: boolean;
  /** id of the panel this tab controls (`aria-controls`). */
  controls?: string;
};

function useRovingKeys<T extends string>(
  options: TabOption<T>[],
  value: T,
  onChange: (v: T) => void,
) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const current = options.findIndex((o) => o.value === value);
    const pos = enabled.indexOf(current);
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = enabled[(pos + 1) % enabled.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next === null || next === undefined) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return { refs, onKeyDown };
}

function Extras<T extends string>({ opt, active }: { opt: TabOption<T>; active: boolean }) {
  return (
    <>
      {opt.badge !== undefined && opt.badge !== null && opt.badge !== 0 ? (
        <span
          className={`ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold leading-5 ${
            active ? "bg-white text-[var(--sf-ink)]" : "bg-[var(--sf-coral-deep)] text-white"
          }`}
        >
          {opt.badge}
          {opt.badgeLabel ? <span className="sr-only"> {opt.badgeLabel}</span> : null}
        </span>
      ) : null}
      {opt.dot ? (
        <>
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--sf-coral-deep)]" aria-hidden="true" />
          {opt.dotLabel ? <span className="sr-only">({opt.dotLabel})</span> : null}
        </>
      ) : null}
    </>
  );
}

/**
 * Pill tabs (`role="tablist"`). Scrolls horizontally on narrow screens instead of wrapping.
 * Use for page-level tabs: child profile tabs, Messages / Community, Summer / School Year.
 */
export function PillTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  size = "md",
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Accessible name for the tablist. */
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { refs, onKeyDown } = useRovingKeys(options, value, onChange);
  const idBase = useId();
  const pad = size === "sm" ? "px-3.5 text-[13px]" : "px-4 text-sm";

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0 ${className}`}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idBase}-${opt.value}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={opt.controls}
            tabIndex={active ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={onKeyDown}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${pad} ${
              active
                ? "bg-[var(--sf-ink)] text-white shadow-[0_3px_0_0_#000]"
                : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:bg-[var(--sf-butter)]/60 focus-visible:-translate-y-0.5"
            }`}
          >
            {opt.icon ? <span aria-hidden="true" className="inline-flex">{opt.icon}</span> : null}
            {opt.label}
            <Extras opt={opt} active={active} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Segmented control (`role="radiogroup"`): a small set of mutually exclusive modes,
 * e.g. Monthly / Weekly, Card / Bank (ACH), All day / Set a time.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  fullWidth = false,
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const { refs, onKeyDown } = useRovingKeys(options, value, onChange);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${fullWidth ? "flex w-full" : "inline-flex"} gap-1 rounded-full bg-[var(--sf-ink)]/[0.06] p-1 ${className}`}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={onKeyDown}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
              fullWidth ? "flex-1" : ""
            } ${
              active
                ? "bg-white text-[var(--sf-ink)] shadow-[0_2px_0_0_rgba(43,42,38,0.15)]"
                : "text-[var(--sf-soft)] hover:text-[var(--sf-ink)]"
            }`}
          >
            {opt.icon ? <span aria-hidden="true" className="inline-flex">{opt.icon}</span> : null}
            {opt.label}
            <Extras opt={opt} active={false} />
          </button>
        );
      })}
    </div>
  );
}
