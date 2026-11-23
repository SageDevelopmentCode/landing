"use client";

import { useRef, type KeyboardEvent } from "react";
import { KidAvatar, firstNameOf } from "@/app/parent/_garden/ui";
import type { PreferenceChild } from "../page";

/**
 * Child chips for Preferences. Like the kit's ChildSwitcher, plus two status dots:
 * amber for "School day food preferences needed" and coral for unsaved edits.
 * Each dot is paired with a text label (visible on the active chip, sr-only otherwise).
 */
export default function PrefsChildTabs({
  students,
  activeId,
  onChange,
  needsFood,
  unsaved,
  controls,
}: {
  students: PreferenceChild[];
  activeId: string;
  onChange: (id: string) => void;
  needsFood: (id: string) => boolean;
  unsaved: (id: string) => boolean;
  controls?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = students.findIndex((c) => c.id === activeId);
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % students.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + students.length) % students.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = students.length - 1;
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(students[next].id);
  }

  return (
    <div role="tablist" aria-label="Choose a child" className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 pt-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0">
      {students.map((child, i) => {
        const active = child.id === activeId;
        const food = needsFood(child.id);
        const dirty = unsaved(child.id);
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
            className={`relative flex min-h-11 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-4 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
              active
                ? "bg-[var(--sf-ink)] text-white shadow-[0_3px_0_0_#000]"
                : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:bg-[var(--sf-butter)]/60 focus-visible:-translate-y-0.5"
            }`}
          >
            <KidAvatar id={child.id} name={child.child_legal_name} imageUrl={child.profile_image_url} size="h-9 w-9 text-xs" />
            <span className="whitespace-nowrap">{firstNameOf(child.child_legal_name)}</span>
            {food ? (
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden="true" />
                <span className="sr-only">(School day food preferences needed)</span>
              </span>
            ) : null}
            {dirty ? (
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-coral-deep)] ring-2 ring-white" aria-hidden="true" />
                {active ? (
                  <span className="text-xs font-bold text-white/80">Unsaved</span>
                ) : (
                  <span className="sr-only">(Unsaved changes)</span>
                )}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
