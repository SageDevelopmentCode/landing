"use client";

import { PencilIcon } from "@/app/parent/_garden/fields";
import { Arrow, btnInkSm, cardBase } from "@/app/parent/_garden/ui";
import type { SchoolDayFoodPreference } from "../page";
import { getEmergencySnackLabel, getSharedFoodLabel } from "./foodOptions";

/** Amber step card shown while the selected child has no school day food preferences yet. */
export function FoodActionNeeded({ onOpen }: { onOpen: () => void }) {
  return (
    <section aria-labelledby="food-action-title" className="rounded-[28px] bg-amber-100/80 p-5 ring-1 ring-amber-300/60 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white text-2xl shadow-[0_6px_14px_-8px_rgba(43,42,38,0.5)]"
          style={{ rotate: "-5deg" }}
          aria-hidden="true"
        >
          🍎
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="food-action-title" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-extrabold leading-snug text-amber-950">
            School Day Food Preferences
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-extrabold text-white">Action Needed</span>
          </h2>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-amber-900">
            Please tell us how to handle backup snacks and food shared by families during the school day. This is a new
            form, separate from activity cooking preferences below.
          </p>
        </div>
      </div>
      <button type="button" onClick={onOpen} className={`${btnInkSm} mt-4 w-full sm:w-auto`}>
        Complete preferences <Arrow />
      </button>
    </section>
  );
}

/** Saved school day food answers with an Update button. */
export function FoodSavedSummary({ pref, onUpdate }: { pref: SchoolDayFoodPreference; onUpdate: () => void }) {
  return (
    <section aria-labelledby="food-saved-title" className={`${cardBase} p-5 sm:p-6`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-butter)] text-xl" aria-hidden="true">
          🍎
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="food-saved-title" className="text-base font-extrabold leading-snug">
            School Day Food Preferences
          </h2>
          <p className="text-[13px] font-semibold text-[var(--sf-soft)]">Saved to your child&apos;s profile for daily food offerings</p>
        </div>
        <button
          type="button"
          onClick={onUpdate}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-extrabold text-[var(--sf-sage-deep)] transition hover:bg-[var(--sf-mint)]/70 focus-visible:bg-[var(--sf-mint)]/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
          aria-label="Update School Day Food Preferences"
        >
          <PencilIcon />
          Update
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-2.5">
        <div className="rounded-[18px] bg-[var(--sf-cream)] px-4 py-3">
          <dt className="text-xs font-extrabold text-[var(--sf-soft)]">Emergency / backup snacks</dt>
          <dd className="mt-0.5 text-sm font-bold">{getEmergencySnackLabel(pref.emergency_snack_preference)}</dd>
        </div>
        <div className="rounded-[18px] bg-[var(--sf-cream)] px-4 py-3">
          <dt className="text-xs font-extrabold text-[var(--sf-soft)]">Shared / gifted foods</dt>
          <dd className="mt-0.5 text-sm font-bold">{getSharedFoodLabel(pref.shared_food_preference)}</dd>
        </div>
      </dl>
    </section>
  );
}
