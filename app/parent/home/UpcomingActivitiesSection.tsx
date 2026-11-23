"use client";

import Image from "next/image";
import type { Activity } from "@/app/actions/activities";
import { Arrow, SectionHeader } from "@/app/parent/_garden/ui";

type Props = {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  readOnly?: boolean;
  showAutoFillButton?: boolean;
  onAutoFillClick?: () => void;
};

function formatCardDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const TILTS = ["-2deg", "1.5deg", "-1deg", "2deg"];

export default function UpcomingActivitiesSection({
  activities,
  onSelectActivity,
  readOnly = false,
  showAutoFillButton = false,
  onAutoFillClick,
}: Props) {
  return (
    <section aria-labelledby="home-activities">
      <SectionHeader
        id="home-activities"
        title="Upcoming Activities"
        note={activities.length > 0 ? "Tap an activity to set participation preferences" : undefined}
        action={
          showAutoFillButton && onAutoFillClick ? (
            <button
              type="button"
              onClick={onAutoFillClick}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--sf-butter)] px-4 text-sm font-extrabold text-[#5c4400] shadow-[0_4px_0_0_#e0c35c] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#e0c35c] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#e0c35c] cursor-pointer"
            >
              Auto-Fill ⚡
            </button>
          ) : null
        }
      />
      {activities.length === 0 ? (
        <p className="rounded-[24px] bg-white/70 px-5 py-5 text-sm font-bold text-[var(--sf-soft)]">No upcoming activities.</p>
      ) : (
        <div
          className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 -mb-4 pb-8 pt-3 [scroll-padding-inline:1.5rem] scrollbar-hide"
          role="list"
        >
          {activities.map((activity, i) => {
            const thumb = activity.images[0]?.signed_url ?? null;
            return (
              <div key={activity.id} role="listitem" className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => onSelectActivity(activity)}
                  className="sf-polaroid group block w-[220px] text-left transition-[rotate,translate,box-shadow] duration-300 hover:!rotate-0 hover:-translate-y-1 focus-visible:!rotate-0 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] sm:w-[250px] cursor-pointer"
                  style={{ rotate: TILTS[i % TILTS.length] }}
                  aria-label={`${activity.title}${activity.activity_date ? `, ${formatCardDate(activity.activity_date)}` : ""}. Set preferences`}
                >
                  <div className="relative h-32 overflow-hidden rounded-[3px] bg-[var(--sf-peach)] sm:h-36">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        sizes="250px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden="true">
                        🎀
                      </div>
                    )}
                    {activity.activity_date ? (
                      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold text-[var(--sf-ink)] shadow-sm">
                        {formatCardDate(activity.activity_date)}
                      </span>
                    ) : null}
                  </div>
                  <div className="px-1 pb-0.5 pt-3">
                    <p className="line-clamp-2 min-h-[2.6em] text-[15px] font-extrabold leading-snug text-[var(--sf-ink)]">
                      {activity.title}
                    </p>
                    <span className="mt-2 inline-flex min-h-8 items-center gap-1 rounded-full bg-[var(--sf-mint)] px-3 text-xs font-extrabold text-[var(--sf-sage-deep)] transition group-hover:bg-[var(--sf-sage)] group-hover:text-white group-focus-visible:bg-[var(--sf-sage)] group-focus-visible:text-white">
                      Set preferences <Arrow className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
      {readOnly ? (
        <p className="mt-1 text-xs font-bold text-[var(--sf-soft)]">Preview mode — preferences cannot be saved.</p>
      ) : null}
    </section>
  );
}
