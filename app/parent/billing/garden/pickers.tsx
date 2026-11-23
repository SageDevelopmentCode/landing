"use client";

import { HOMESCHOOL_TIERS, SCHOOL_YEAR_MONTHS, WEEKDAYS, formatCents, type HomeschoolTier } from "@/shared/billing/school-year";
import { SUMMER_WEEKS } from "./data";
import { ChoiceCards, SelectTile } from "./parts";

/** School-year month grid (Aug–May). */
export function MonthPicker({
  label,
  selected,
  isPaid,
  onToggle,
  subFor,
  titleFor,
}: {
  label: string;
  selected: Set<number>;
  isPaid: (index: number) => boolean;
  onToggle: (index: number) => void;
  subFor?: (index: number) => string | undefined;
  titleFor?: (index: number) => string | undefined;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {SCHOOL_YEAR_MONTHS.map((m) => (
        <SelectTile
          key={m.index}
          checked={selected.has(m.index)}
          paid={isPaid(m.index)}
          onToggle={() => onToggle(m.index)}
          sub={subFor?.(m.index)}
          className="items-center text-center"
        >
          <span title={titleFor?.(m.index) ?? m.label}>{m.short}</span>
        </SelectTile>
      ))}
    </div>
  );
}

/** Summer week grid (12 themed weeks). */
export function WeekPicker({
  label,
  selected,
  isPaid,
  onToggle,
}: {
  label: string;
  selected: Set<number>;
  isPaid: (week: number) => boolean;
  onToggle: (week: number) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
      {SUMMER_WEEKS.map((w) => (
        <SelectTile
          key={w.week}
          checked={selected.has(w.week)}
          paid={isPaid(w.week)}
          onToggle={() => onToggle(w.week)}
          sub={
            <>
              {w.dates} · {w.theme}
            </>
          }
          tint="peach"
        >
          Week {w.week}
        </SelectTile>
      ))}
    </div>
  );
}

/** Mon–Thu picker with a required count. */
export function WeekdayPicker({
  label,
  selected,
  required,
  onToggle,
  available,
  paid,
}: {
  label: string;
  selected: Set<string>;
  /** When set, other days lock once this many are chosen. */
  required?: number;
  onToggle: (key: string) => void;
  /** Restrict to these day keys (short summer week 1). */
  available?: string[];
  paid?: Set<string>;
}) {
  const days = WEEKDAYS.filter((d) => !available || available.includes(d.key));
  return (
    <div role="group" aria-label={label} className="grid grid-cols-4 gap-2">
      {days.map((d) => {
        const on = selected.has(d.key);
        const atLimit = required !== undefined && selected.size === required && !on;
        return (
          <SelectTile
            key={d.key}
            checked={on}
            paid={paid?.has(d.key)}
            disabled={atLimit}
            onToggle={() => onToggle(d.key)}
            className="items-center text-center"
          >
            {d.label}
          </SelectTile>
        );
      })}
    </div>
  );
}

/** Homeschool schedule tiers with a /mo price. */
export function TierPicker({
  value,
  onChange,
  priceFor,
  extraFor,
}: {
  value: HomeschoolTier | null;
  onChange: (t: HomeschoolTier) => void;
  priceFor: (t: HomeschoolTier) => number;
  extraFor?: (t: HomeschoolTier) => React.ReactNode;
}) {
  return (
    <ChoiceCards
      label="Choose your schedule"
      value={value}
      onChange={onChange}
      options={HOMESCHOOL_TIERS.map((t) => ({
        value: t.key,
        title: t.label,
        sub: t.sub,
        aside: (
          <>
            <span className="sf-display block text-lg">{formatCents(priceFor(t.key))}</span>
            <span className="block text-xs font-bold text-[var(--sf-soft)]">/mo</span>
          </>
        ),
        extra: extraFor?.(t.key),
      }))}
    />
  );
}

export function requiredDaysLabel(requiredDays: number) {
  return requiredDays === 1 ? "1 day" : requiredDays === 2 ? "2 days" : "3 days";
}
