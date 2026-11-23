"use client";

import { Reveal } from "@/app/_garden/motion";
import { ACADEMIC_YEAR_LABEL, HOLIDAYS, KEY_DATES, parseIsoDate, type AcademicHoliday } from "@/app/lib/academic-calendar-data";
import { SectionHeader, TINT_BG, TINT_FG, type HomeTint } from "@/app/parent/_garden/ui";
import { Skeleton } from "@/app/parent/_garden/states";
import { calendarDaysBetween, useNow } from "@/app/parent/_garden/time";

type Season = AcademicHoliday["season"];

const SEASONS: { season: Season; label: string; emoji: string; tint: HomeTint }[] = [
  { season: "fall", label: "Fall", emoji: "🍂", tint: "peach" },
  { season: "winter", label: "Winter", emoji: "❄️", tint: "sky" },
  { season: "spring", label: "Spring", emoji: "🌷", tint: "mint" },
];

const TILTS = ["-1.5deg", "1deg", "-0.5deg"];

function monthShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" });
}

/** "Aug" / "17" stub for a date ticket or chip. Parsed locally, so no timezone drift. */
function dayParts(iso: string) {
  const d = parseIsoDate(iso);
  return { month: monthShort(d), day: String(d.getDate()), weekday: d.toLocaleDateString("en-US", { weekday: "short" }) };
}

/** Day span label for the chip: "23–27" when a break stays in one month, else the first day. */
function chipDays(h: AcademicHoliday) {
  const from = parseIsoDate(h.closedFrom);
  const to = parseIsoDate(h.closedTo);
  if (h.closedFrom === h.closedTo) return { top: monthShort(from), big: String(from.getDate()), multi: false };
  if (from.getMonth() === to.getMonth()) return { top: monthShort(from), big: `${from.getDate()}–${to.getDate()}`, multi: true };
  return { top: `${monthShort(from)}–${monthShort(to)}`, big: String(from.getDate()), multi: true };
}

function KeyDateTicket({ date, tint }: { date: (typeof KEY_DATES)[keyof typeof KEY_DATES]; tint: HomeTint }) {
  const p = dayParts(date.iso);
  return (
    <div className={`sf-ticket flex min-w-0 items-stretch overflow-hidden rounded-[26px] ${TINT_BG[tint]}`}>
      <span
        className={`flex w-24 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-current/25 py-5 pl-4 ${TINT_FG[tint]}`}
        aria-hidden="true"
      >
        <span className="text-[11px] font-extrabold uppercase leading-none tracking-wide">{p.weekday}</span>
        <span className="sf-display text-4xl leading-none">{p.day}</span>
        <span className="text-[11px] font-extrabold uppercase leading-none tracking-wide">{p.month}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-5 pl-4 pr-8">
        <span className="text-[15px] font-extrabold leading-tight">{date.label}</span>
        <span className="sf-display text-[1.7rem] leading-none">
          {date.monthDay} {date.year}
        </span>
      </span>
    </div>
  );
}

function HolidayRow({ h, tint, past, current }: { h: AcademicHoliday; tint: HomeTint; past: boolean; current: boolean }) {
  const chip = chipDays(h);
  return (
    <li
      className={`flex min-w-0 items-center gap-3 rounded-[22px] bg-white px-3 py-3 ring-1 ring-[var(--sf-ink)]/[0.06] transition sm:gap-4 sm:px-4 ${
        current ? "ring-2 ring-[var(--sf-ink)]/70" : ""
      } ${past ? "opacity-60" : ""}`}
    >
      <span
        className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${TINT_BG[tint]} ${TINT_FG[tint]}`}
        aria-hidden="true"
      >
        <span className="text-[10px] font-extrabold uppercase leading-none tracking-wide">{chip.top}</span>
        <span className={`sf-display leading-none ${chip.multi && chip.big.length > 3 ? "text-lg" : "text-2xl"}`}>{chip.big}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-extrabold leading-tight">{h.name}</span>
        <span className="text-sm font-bold text-[var(--sf-soft)]">{h.dates}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-full bg-[var(--sf-coral)]/20 px-2.5 py-1 text-xs font-extrabold text-[var(--sf-coral-deep)]">{h.note}</span>
        {current ? (
          <span className="text-[11px] font-extrabold text-[var(--sf-ink)]">Happening now</span>
        ) : past ? (
          <span className="text-[11px] font-extrabold text-[var(--sf-soft)]">Past</span>
        ) : null}
      </span>
    </li>
  );
}

/** Butter sticky note for the next (or current) closure. Rendered after hydration only. */
function ComingUpNext({ today }: { today: Date | null }) {
  if (!today) {
    return (
      <div className="rounded-[6px] bg-[var(--sf-butter)]/70 p-6" aria-hidden="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
    );
  }
  const next = HOLIDAYS.find((h) => calendarDaysBetween(today, parseIsoDate(h.closedTo)) >= 0);
  if (!next) return null;
  const daysUntil = calendarDaysBetween(today, parseIsoDate(next.closedFrom));
  const when = daysUntil <= 0 ? "happening now" : daysUntil === 1 ? "starts tomorrow" : `in ${daysUntil} days`;
  return (
    <aside
      aria-labelledby="coming-up-next"
      className="relative rotate-[-1.5deg] rounded-[6px] bg-[var(--sf-butter)] p-6 shadow-[0_18px_40px_-22px_rgba(43,42,38,0.55)] transition hover:rotate-0"
    >
      <span
        className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[3deg] rounded-[2px] bg-white/70 shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
        aria-hidden="true"
      />
      <h2 id="coming-up-next" className="sf-hand text-xl leading-none text-[#7a5b00]">
        Coming up next
      </h2>
      <p className="sf-display mt-3 text-[1.9rem] leading-tight">{next.name}</p>
      <p className="mt-1 text-[15px] font-extrabold text-[#5c4400]">{next.dates}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-[var(--sf-coral-deep)]">{next.note}</span>
        <span className="sf-hand text-lg leading-none text-[#7a5b00]">{when}</span>
      </div>
    </aside>
  );
}

export default function AcademicCalendarGarden() {
  const now = useNow(60 * 60_000);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_60%_at_12%_8%,rgba(205,238,213,0.65),transparent_70%),radial-gradient(50%_55%_at_92%_4%,rgba(255,229,138,0.4),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <header className="min-w-0 lg:col-start-1">
            <h1 className="sf-display text-[2.4rem] leading-[1.02] sm:text-[3.4rem]">{ACADEMIC_YEAR_LABEL} Student Calendar</h1>
            <p className="mt-3 text-[15px] font-bold text-[var(--sf-soft)]">Sage Field Private School · Round Rock, Texas</p>
          </header>

          <div className="min-w-0 px-2 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:px-0 lg:pt-4">
            <ComingUpNext today={now} />
          </div>

          <section aria-labelledby="key-dates" className="min-w-0 lg:col-start-1">
            <SectionHeader id="key-dates" title="Key School Year Dates" />
            <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2" y={20}>
              <KeyDateTicket date={KEY_DATES.firstDay} tint="mint" />
              <KeyDateTicket date={KEY_DATES.lastDay} tint="peach" />
            </Reveal>
          </section>

          <section aria-labelledby="holiday-schedule" className="min-w-0 lg:col-start-1">
            <SectionHeader id="holiday-schedule" title="Holiday & Break Schedule" note="School is closed on the following dates." />
            <div className="flex flex-col gap-8">
              {SEASONS.map(({ season, label, emoji, tint }, si) => {
                const items = HOLIDAYS.filter((h) => h.season === season);
                if (items.length === 0) return null;
                return (
                  <Reveal key={season} as="div" y={16} stagger={0.05} selector="li">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${TINT_BG[tint]}`}
                        style={{ rotate: TILTS[si % TILTS.length] }}
                        aria-hidden="true"
                      >
                        {emoji}
                      </span>
                      <span className={`rounded-full px-3 py-0.5 ${TINT_BG[tint]} ${TINT_FG[tint]}`}>{label}</span>
                    </h3>
                    <ul className="flex flex-col gap-2.5">
                      {items.map((h) => {
                        const past = now ? calendarDaysBetween(now, parseIsoDate(h.closedTo)) < 0 : false;
                        const current = now
                          ? calendarDaysBetween(now, parseIsoDate(h.closedFrom)) <= 0 && !past
                          : false;
                        return <HolidayRow key={h.name} h={h} tint={tint} past={past} current={current} />;
                      })}
                    </ul>
                  </Reveal>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
