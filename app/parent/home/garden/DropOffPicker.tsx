"use client";

import { useRef, type KeyboardEvent } from "react";
import { CalendarClock } from "lucide-react";
import { CheckIcon, Spinner, btnInkSm } from "@/app/parent/_garden/ui";

export const DROP_OFF_SLOTS = [
  { label: "8:15 – 8:30", value: "8:15" },
  { label: "8:30 – 8:45", value: "8:30" },
  { label: "8:45 – 9:00", value: "8:45" },
] as const;

export function dropOffLabel(slot: string | null): string | null {
  if (!slot) return null;
  return DROP_OFF_SLOTS.find((s) => s.value === slot)?.label ?? slot;
}

type Props = {
  slot: string | null;
  saved: boolean;
  saving: boolean;
  onSelect: (slot: string) => void;
  onSave: () => void;
  onEdit: () => void;
};

export default function DropOffPicker({ slot, saved, saving, onSelect, onSave, onEdit }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  if (saved) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white">
            <CheckIcon />
          </span>
          <span className="sf-display text-lg">{dropOffLabel(slot)}</span>
          <span className="text-sm font-bold text-[var(--sf-sage-deep)]">confirmed</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-extrabold text-[var(--sf-ink)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
        >
          Edit
        </button>
      </div>
    );
  }

  const selectedIndex = DROP_OFF_SLOTS.findIndex((s) => s.value === slot);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + DROP_OFF_SLOTS.length) % DROP_OFF_SLOTS.length;
    onSelect(DROP_OFF_SLOTS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Drop-off window" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DROP_OFF_SLOTS.map((s, i) => {
          const active = slot === s.value;
          return (
            <button
              key={s.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active || (selectedIndex === -1 && i === 0) ? 0 : -1}
              onClick={() => onSelect(s.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-3 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                active
                  ? "border-[var(--sf-ink)] bg-[var(--sf-ink)] text-white shadow-[0_4px_0_0_#000]"
                  : "border-[var(--sf-ink)]/20 bg-white text-[var(--sf-ink)] hover:-translate-y-0.5 hover:border-[var(--sf-ink)]/45"
              }`}
            >
              {active ? <CheckIcon /> : <span aria-hidden="true">🚗</span>}
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--sf-soft)]">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          One time slot for the whole family
        </span>
        <button type="button" disabled={!slot || saving} onClick={onSave} className={btnInkSm}>
          {saving ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            <>
              <CheckIcon /> Save drop-off time
            </>
          )}
        </button>
      </div>
    </div>
  );
}
