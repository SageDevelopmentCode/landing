"use client";

import { SCHOOL_YEAR_MONTHS, formatCents } from "@/shared/billing/school-year";
import { btnSageSm } from "@/app/parent/_garden/ui";
import type { PaidHomeschoolByStudent } from "../page";

const tierLabel = (tier: string) => {
  if (tier === "dropin") return "Explorer Day Pass";
  if (tier === "2day") return "2 Days / Week";
  if (tier === "3day") return "3 Days / Week";
  return tier;
};
const dayLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);
const formatEntryDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
};

/** "Current Plan": every paid homeschool entry, shown inside the homeschool sheet. */
export default function HomeschoolHistory({ paidData, onAddMore }: { paidData: PaidHomeschoolByStudent[string]; onAddMore: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {paidData.summer.length > 0 ? (
        <section aria-label="Summer 2026">
          <h3 className="mb-3 text-base font-extrabold">Summer 2026</h3>
          <ul className="flex flex-col gap-3">
            {paidData.summer.map((entry, i) => (
              <li key={i} className="rounded-[22px] bg-white px-4 py-3 ring-1 ring-[var(--sf-ink)]/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-extrabold">{tierLabel(entry.tier)}</span>
                  <span className="sf-display text-lg">{formatCents(entry.amountCents)}</span>
                </div>
                {entry.days.length > 0 ? <p className="text-xs font-bold text-[var(--sf-soft)]">Days: {entry.days.map(dayLabel).join(", ")}</p> : null}
                {entry.weeks.length > 0 ? (
                  <p className="text-xs font-bold text-[var(--sf-soft)]">
                    Weeks: {[...entry.weeks].sort((a, b) => a - b).join(", ")} ({entry.weeks.length} week{entry.weeks.length !== 1 ? "s" : ""})
                  </p>
                ) : null}
                <p className="mt-1 text-xs font-bold text-[var(--sf-sage-deep)]">✓ Paid {formatEntryDate(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {paidData.schoolYear.length > 0 ? (
        <section aria-label="School Year 2026–2027">
          <h3 className="mb-3 text-base font-extrabold">School Year 2026–2027</h3>
          <ul className="flex flex-col gap-3">
            {paidData.schoolYear.map((entry, i) => (
              <li key={i} className="rounded-[22px] bg-white px-4 py-3 ring-1 ring-[var(--sf-ink)]/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-extrabold">{tierLabel(entry.tier)}</span>
                  <span className="sf-display text-lg">{formatCents(entry.amountCents)}</span>
                </div>
                {entry.weeks.length > 0 ? (
                  <p className="text-xs font-bold text-[var(--sf-soft)]">
                    Months:{" "}
                    {[...entry.weeks]
                      .sort((a, b) => a - b)
                      .map((w) => SCHOOL_YEAR_MONTHS.find((m) => m.index === w)?.short ?? `Month ${w}`)
                      .join(", ")}
                  </p>
                ) : null}
                {entry.days.length > 0 ? (
                  <p className="text-xs font-bold text-[var(--sf-soft)]">
                    {entry.tier === "dropin" ? `Every ${dayLabel(entry.days[0])}` : `Days: ${entry.days.map(dayLabel).join(", ")}`}
                  </p>
                ) : null}
                <p className="mt-1 text-xs font-bold text-[var(--sf-sage-deep)]">✓ Paid {formatEntryDate(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <button type="button" onClick={onAddMore} className={`${btnSageSm} w-full`}>
        Add more days / weeks
      </button>
    </div>
  );
}
