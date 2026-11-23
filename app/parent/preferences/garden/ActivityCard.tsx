"use client";

import { useId, useState } from "react";
import type { Activity } from "@/app/actions/activities";
import { RadioCardGroup, TextArea } from "@/app/parent/_garden/fields";
import { formatLongDate } from "@/app/parent/_garden/format";
import { cardBase } from "@/app/parent/_garden/ui";
import { LEVEL_CARDS, type ParticipationLevel } from "./levels";

export type ActivityPreference = { level: ParticipationLevel | null; notes: string };

/** One activity: photo, title, food disclosure, participation level (click again to clear) and notes. */
export default function ActivityCard({
  activity,
  pref,
  onChange,
  prefilled,
  unsaved,
}: {
  activity: Activity;
  pref: ActivityPreference;
  onChange: (patch: Partial<ActivityPreference>) => void;
  /** Level came from the auto-fill default and hasn't been saved for this activity yet. */
  prefilled: boolean;
  unsaved: boolean;
}) {
  const [foodsOpen, setFoodsOpen] = useState(false);
  const foodsId = useId();
  const titleId = useId();
  const image = activity.images[0]?.signed_url;
  const showFoods = activity.includes_food && activity.foods.length > 0;

  return (
    <article aria-labelledby={titleId} className={`${cardBase} overflow-hidden`}>
      <div className="flex items-start gap-4 p-5 sm:p-6">
        {image ? (
          <span className="block shrink-0 rounded-[6px] bg-white p-1.5 pb-3 shadow-[0_10px_24px_-14px_rgba(43,42,38,0.55)]" style={{ rotate: "-3deg" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
            <img src={image} alt={activity.title} className="h-16 w-16 rounded-[6px] object-cover sm:h-20 sm:w-20" />
          </span>
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-[var(--sf-peach)]/80 text-3xl sm:h-20 sm:w-20" aria-hidden="true">
            {activity.includes_food ? "🧑‍🍳" : "🎨"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {activity.activity_date ? (
              <span className="rounded-full bg-[var(--sf-sky)]/80 px-2.5 py-0.5 text-xs font-extrabold text-[#2d5d86]">
                {formatLongDate(activity.activity_date)}
              </span>
            ) : null}
            {unsaved ? (
              <span className="rounded-full bg-[var(--sf-coral)]/20 px-2.5 py-0.5 text-xs font-extrabold text-[var(--sf-coral-deep)]">
                Unsaved changes
              </span>
            ) : null}
          </div>
          <h3 id={titleId} className="sf-display mt-1.5 text-[1.45rem] leading-tight sm:text-[1.6rem]">
            {activity.title}
          </h3>
          {activity.description ? (
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--sf-soft)]">{activity.description}</p>
          ) : null}
        </div>
      </div>

      {showFoods ? (
        <div className="border-t-2 border-dashed border-[var(--sf-ink)]/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setFoodsOpen((v) => !v)}
            aria-expanded={foodsOpen}
            aria-controls={foodsId}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--sf-butter)]/60 px-4 text-sm font-extrabold text-[#5c4400] transition hover:bg-[var(--sf-butter)] focus-visible:bg-[var(--sf-butter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${foodsOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 7.5l5 5 5-5" />
            </svg>
            {foodsOpen ? "Hide food items & ingredients" : `See food items & ingredients (${activity.foods.length})`}
          </button>
          <div id={foodsId} hidden={!foodsOpen}>
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {activity.foods.map((food) => (
                <li key={food.id} className="rounded-[18px] bg-[var(--sf-cream)] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold">{food.name}</span>
                    {food.allergens ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 ring-1 ring-amber-300">
                        ⚠ {food.allergens}
                      </span>
                    ) : null}
                  </div>
                  {food.ingredients.length > 0 ? (
                    <p className="mt-1 text-[13px] font-semibold text-[var(--sf-soft)]">
                      Ingredients:{" "}
                      {food.ingredients
                        .slice()
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((i) => i.name)
                        .join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="border-t-2 border-dashed border-[var(--sf-ink)]/10 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <RadioCardGroup
          legend="Participation Preference"
          options={LEVEL_CARDS}
          value={pref.level}
          onChange={(level) => onChange({ level })}
          allowDeselect
        />
        {pref.level !== null && prefilled ? (
          <p className="mt-2.5 flex items-start gap-1.5 text-[13px] font-semibold text-[var(--sf-soft)]">
            <span aria-hidden="true">⚡</span>
            <span>Pre-filled by your default preference · Select a different option to override</span>
          </p>
        ) : null}
        {pref.level !== null ? (
          <div className="mt-4">
            <TextArea
              label="Notes or special instructions"
              optional
              value={pref.notes}
              onChange={(notes) => onChange({ notes })}
              placeholder="e.g. only eat one serving, bringing alternative ingredients: oat milk instead of dairy..."
              rows={2}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
