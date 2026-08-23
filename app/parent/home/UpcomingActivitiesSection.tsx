"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { Activity } from "@/app/actions/activities";

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

export default function UpcomingActivitiesSection({
  activities,
  onSelectActivity,
  readOnly = false,
  showAutoFillButton = false,
  onAutoFillClick,
}: Props) {
  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-heading font-semibold text-gray-800">
            Upcoming Activities
          </h2>
          {showAutoFillButton && onAutoFillClick ? (
            <button
              type="button"
              onClick={onAutoFillClick}
              className="text-sm font-semibold font-body text-[#4a7c59] hover:text-[#3d6849] transition-colors cursor-pointer shrink-0"
            >
              Auto-Fill ⚡
            </button>
          ) : null}
        </div>
        {activities.length > 0 ? (
          <p className="text-sm text-gray-500 font-body mt-1">
            Tap an activity to set participation preferences
          </p>
        ) : null}
      </div>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 font-body">No upcoming activities.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {activities.map((activity) => {
            const thumb = activity.images[0]?.signed_url ?? null;
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onSelectActivity(activity)}
                className="group shrink-0 w-[220px] sm:w-[260px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden text-left cursor-pointer transition-all hover:shadow-md hover:border-[#4a7c59]/25 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a7c59]/40"
              >
                <div className="relative h-32 sm:h-36 overflow-hidden">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
                      🎀
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
                    <ChevronRight
                      size={14}
                      className="text-[#4a7c59] group-hover:translate-x-0.5 transition-transform"
                    />
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-2">
                  <div>
                    <p className="text-sm font-semibold font-heading text-gray-800 line-clamp-2 leading-snug">
                      {activity.title}
                    </p>
                    {activity.activity_date ? (
                      <p className="text-xs text-[#4a7c59] font-body mt-1">
                        {formatCardDate(activity.activity_date)}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-xs font-semibold font-body bg-[#EEF5EF] text-[#4a7c59] group-hover:bg-[#ddeede] transition-colors">
                    Set preferences
                    <ChevronRight size={12} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {readOnly ? (
        <p className="text-xs text-gray-400 font-body mt-2">
          Preview mode — preferences cannot be saved.
        </p>
      ) : null}
    </section>
  );
}
