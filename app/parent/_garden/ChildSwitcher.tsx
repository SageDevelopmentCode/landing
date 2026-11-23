"use client";

import { useRef, type KeyboardEvent } from "react";
import { KidAvatar, firstNameOf } from "./ui";

export type SwitcherChild = {
  id: string;
  name: string;
  imageUrl?: string | null;
  /** Small line under the name (grade, program). Shown in the "cards" variant. */
  sub?: string | null;
  /** Coral dot plus `attentionLabel` for screen readers, e.g. "Enrollment not complete". */
  attention?: boolean;
  attentionLabel?: string;
};

/**
 * Child picker shared by My Children and Tuition & Billing.
 * A `role="tablist"` of avatar chips with arrow-key navigation. Hidden when there's only one child
 * unless `showSingle` is set.
 *  - `chips`: compact pills (phones, sheet toolbars)
 *  - `cards`: taller cards with a sub line (desktop rails)
 */
export default function ChildSwitcher({
  items,
  activeId,
  onChange,
  label = "Choose a child",
  variant = "chips",
  showSingle = false,
  controls,
  className = "",
}: {
  items: SwitcherChild[];
  activeId: string | null;
  onChange: (id: string) => void;
  label?: string;
  variant?: "chips" | "cards";
  showSingle?: boolean;
  /** id of the panel the tabs control. */
  controls?: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  if (items.length === 0 || (items.length === 1 && !showSingle)) return null;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = items.findIndex((c) => c.id === activeId);
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  const cards = variant === "cards";

  return (
    <div
      role="tablist"
      aria-label={label}
      className={
        cards
          ? `flex flex-col gap-2 ${className}`
          : `-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0 ${className}`
      }
    >
      {items.map((child, i) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={controls}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(child.id)}
            onKeyDown={onKeyDown}
            className={`group relative flex shrink-0 items-center text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
              cards
                ? `min-h-14 w-full gap-3 rounded-[20px] px-3 py-2.5 ${
                    active
                      ? "bg-white shadow-[0_12px_30px_-20px_rgba(43,42,38,0.55)] ring-2 ring-[var(--sf-sage)]"
                      : "bg-white/50 ring-1 ring-[var(--sf-ink)]/[0.06] hover:-translate-y-0.5 hover:bg-white focus-visible:-translate-y-0.5"
                  }`
                : `min-h-11 gap-2 rounded-full py-1 pl-1 pr-4 text-sm font-extrabold ${
                    active
                      ? "bg-[var(--sf-ink)] text-white shadow-[0_3px_0_0_#000]"
                      : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:bg-[var(--sf-butter)]/60 focus-visible:-translate-y-0.5"
                  }`
            }`}
          >
            <KidAvatar id={child.id} name={child.name} imageUrl={child.imageUrl} size={cards ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs"} />
            {cards ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold leading-tight">{child.name}</span>
                {child.sub ? <span className="block truncate text-xs font-bold text-[var(--sf-soft)]">{child.sub}</span> : null}
              </span>
            ) : (
              <span className="whitespace-nowrap">{firstNameOf(child.name)}</span>
            )}
            {child.attention ? (
              <>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-coral-deep)] ring-2 ring-white ${cards ? "" : "absolute left-8 top-1"}`}
                  aria-hidden="true"
                />
                {child.attentionLabel ? <span className="sr-only">({child.attentionLabel})</span> : null}
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
