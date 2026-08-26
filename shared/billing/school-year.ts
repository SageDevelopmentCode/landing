// Shared school-year billing constants (source: BillingPage.tsx)
// Used by web and mobile — keep in sync with business rules.

export const SUPPLY_FEE_CENTS = 30000;
export const BUNDLE_MONTH_INDEX = 1; // August 2026
export const REGISTRATION_SCHOOL_YEAR_CENTS = 50000;
export const SCHOOL_YEAR_TUITION_PRIMARY_CENTS = 119500;
export const SCHOOL_YEAR_TUITION_UPPER_CENTS = 109500;

export const AFTERCARE_DAILY_CENTS = 3500;
export const AFTERCARE_MONTHLY_CENTS = 29900;
export const FUN_FRIDAY_MONTHLY_CENTS = 16000;
export const FUN_FRIDAY_SESSION_MONTHLY_CENTS = 4000;
export const FUN_FRIDAY_DROPIN_CENTS = 5000;

export type HomeschoolTier = "dropin" | "2day" | "3day";

export const HOMESCHOOL_SCHOOL_YEAR_PRICING = {
  dropin: { primary: 48000, upper: 44000 },
  "2day": { primary: 56000, upper: 52000 },
  "3day": { primary: 78000, upper: 72000 },
} as const;

export const HOMESCHOOL_TIERS = [
  { key: "dropin" as const, label: "1 Day / Week", sub: "Part-Time", days: 1 },
  { key: "2day" as const, label: "2 Days / Week", sub: "Part-Time", days: 2 },
  { key: "3day" as const, label: "3 Days / Week", sub: "Part-Time", days: 3 },
];

export const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
] as const;

export const SCHOOL_YEAR_AFTERCARE_MONTHS = [
  {
    key: "aug_26",
    label: "August 2026",
    shortLabel: "Aug",
    days: [
      { label: "Mon Aug 17", date: "2026-08-17" },
      { label: "Tue Aug 18", date: "2026-08-18" },
      { label: "Wed Aug 19", date: "2026-08-19" },
      { label: "Thu Aug 20", date: "2026-08-20" },
      { label: "Mon Aug 24", date: "2026-08-24" },
      { label: "Tue Aug 25", date: "2026-08-25" },
      { label: "Wed Aug 26", date: "2026-08-26" },
      { label: "Thu Aug 27", date: "2026-08-27" },
      { label: "Mon Aug 31", date: "2026-08-31" },
    ],
  },
  {
    key: "sep_26",
    label: "September 2026",
    shortLabel: "Sep",
    days: [
      { label: "Tue Sep 1", date: "2026-09-01" },
      { label: "Wed Sep 2", date: "2026-09-02" },
      { label: "Thu Sep 3", date: "2026-09-03" },
      { label: "Tue Sep 8", date: "2026-09-08" },
      { label: "Wed Sep 9", date: "2026-09-09" },
      { label: "Thu Sep 10", date: "2026-09-10" },
      { label: "Mon Sep 14", date: "2026-09-14" },
      { label: "Tue Sep 15", date: "2026-09-15" },
      { label: "Wed Sep 16", date: "2026-09-16" },
      { label: "Thu Sep 17", date: "2026-09-17" },
      { label: "Mon Sep 21", date: "2026-09-21" },
      { label: "Tue Sep 22", date: "2026-09-22" },
      { label: "Wed Sep 23", date: "2026-09-23" },
      { label: "Thu Sep 24", date: "2026-09-24" },
      { label: "Mon Sep 28", date: "2026-09-28" },
      { label: "Tue Sep 29", date: "2026-09-29" },
      { label: "Wed Sep 30", date: "2026-09-30" },
    ],
  },
  {
    key: "oct_26",
    label: "October 2026",
    shortLabel: "Oct",
    days: [
      { label: "Thu Oct 1", date: "2026-10-01" },
      { label: "Mon Oct 5", date: "2026-10-05" },
      { label: "Tue Oct 6", date: "2026-10-06" },
      { label: "Wed Oct 7", date: "2026-10-07" },
      { label: "Thu Oct 8", date: "2026-10-08" },
      { label: "Tue Oct 13", date: "2026-10-13" },
      { label: "Wed Oct 14", date: "2026-10-14" },
      { label: "Thu Oct 15", date: "2026-10-15" },
      { label: "Mon Oct 19", date: "2026-10-19" },
      { label: "Tue Oct 20", date: "2026-10-20" },
      { label: "Wed Oct 21", date: "2026-10-21" },
      { label: "Thu Oct 22", date: "2026-10-22" },
      { label: "Mon Oct 26", date: "2026-10-26" },
      { label: "Tue Oct 27", date: "2026-10-27" },
      { label: "Wed Oct 28", date: "2026-10-28" },
      { label: "Thu Oct 29", date: "2026-10-29" },
    ],
  },
  {
    key: "nov_26",
    label: "November 2026",
    shortLabel: "Nov",
    days: [
      { label: "Mon Nov 2", date: "2026-11-02" },
      { label: "Tue Nov 3", date: "2026-11-03" },
      { label: "Wed Nov 4", date: "2026-11-04" },
      { label: "Thu Nov 5", date: "2026-11-05" },
      { label: "Mon Nov 9", date: "2026-11-09" },
      { label: "Tue Nov 10", date: "2026-11-10" },
      { label: "Wed Nov 11", date: "2026-11-11" },
      { label: "Thu Nov 12", date: "2026-11-12" },
      { label: "Mon Nov 16", date: "2026-11-16" },
      { label: "Tue Nov 17", date: "2026-11-17" },
      { label: "Wed Nov 18", date: "2026-11-18" },
      { label: "Thu Nov 19", date: "2026-11-19" },
      { label: "Mon Nov 30", date: "2026-11-30" },
    ],
  },
  {
    key: "dec_26",
    label: "December 2026",
    shortLabel: "Dec",
    days: [
      { label: "Tue Dec 1", date: "2026-12-01" },
      { label: "Wed Dec 2", date: "2026-12-02" },
      { label: "Thu Dec 3", date: "2026-12-03" },
      { label: "Mon Dec 7", date: "2026-12-07" },
      { label: "Tue Dec 8", date: "2026-12-08" },
      { label: "Wed Dec 9", date: "2026-12-09" },
      { label: "Thu Dec 10", date: "2026-12-10" },
      { label: "Mon Dec 14", date: "2026-12-14" },
      { label: "Tue Dec 15", date: "2026-12-15" },
      { label: "Wed Dec 16", date: "2026-12-16" },
      { label: "Thu Dec 17", date: "2026-12-17" },
    ],
  },
  {
    key: "jan_27",
    label: "January 2027",
    shortLabel: "Jan",
    days: [
      { label: "Mon Jan 4", date: "2027-01-04" },
      { label: "Tue Jan 5", date: "2027-01-05" },
      { label: "Wed Jan 6", date: "2027-01-06" },
      { label: "Thu Jan 7", date: "2027-01-07" },
      { label: "Mon Jan 11", date: "2027-01-11" },
      { label: "Tue Jan 12", date: "2027-01-12" },
      { label: "Wed Jan 13", date: "2027-01-13" },
      { label: "Thu Jan 14", date: "2027-01-14" },
      { label: "Tue Jan 19", date: "2027-01-19" },
      { label: "Wed Jan 20", date: "2027-01-20" },
      { label: "Thu Jan 21", date: "2027-01-21" },
      { label: "Mon Jan 25", date: "2027-01-25" },
      { label: "Tue Jan 26", date: "2027-01-26" },
      { label: "Wed Jan 27", date: "2027-01-27" },
      { label: "Thu Jan 28", date: "2027-01-28" },
    ],
  },
  {
    key: "feb_27",
    label: "February 2027",
    shortLabel: "Feb",
    days: [
      { label: "Mon Feb 1", date: "2027-02-01" },
      { label: "Tue Feb 2", date: "2027-02-02" },
      { label: "Wed Feb 3", date: "2027-02-03" },
      { label: "Thu Feb 4", date: "2027-02-04" },
      { label: "Mon Feb 8", date: "2027-02-08" },
      { label: "Tue Feb 9", date: "2027-02-09" },
      { label: "Wed Feb 10", date: "2027-02-10" },
      { label: "Thu Feb 11", date: "2027-02-11" },
      { label: "Tue Feb 16", date: "2027-02-16" },
      { label: "Wed Feb 17", date: "2027-02-17" },
      { label: "Thu Feb 18", date: "2027-02-18" },
      { label: "Mon Feb 22", date: "2027-02-22" },
      { label: "Tue Feb 23", date: "2027-02-23" },
      { label: "Wed Feb 24", date: "2027-02-24" },
      { label: "Thu Feb 25", date: "2027-02-25" },
    ],
  },
  {
    key: "mar_27",
    label: "March 2027",
    shortLabel: "Mar",
    days: [
      { label: "Mon Mar 1", date: "2027-03-01" },
      { label: "Tue Mar 2", date: "2027-03-02" },
      { label: "Wed Mar 3", date: "2027-03-03" },
      { label: "Thu Mar 4", date: "2027-03-04" },
      { label: "Mon Mar 8", date: "2027-03-08" },
      { label: "Tue Mar 9", date: "2027-03-09" },
      { label: "Wed Mar 10", date: "2027-03-10" },
      { label: "Thu Mar 11", date: "2027-03-11" },
      { label: "Mon Mar 22", date: "2027-03-22" },
      { label: "Tue Mar 23", date: "2027-03-23" },
      { label: "Wed Mar 24", date: "2027-03-24" },
      { label: "Thu Mar 25", date: "2027-03-25" },
      { label: "Mon Mar 29", date: "2027-03-29" },
      { label: "Tue Mar 30", date: "2027-03-30" },
      { label: "Wed Mar 31", date: "2027-03-31" },
    ],
  },
  {
    key: "apr_27",
    label: "April 2027",
    shortLabel: "Apr",
    days: [
      { label: "Thu Apr 1", date: "2027-04-01" },
      { label: "Mon Apr 5", date: "2027-04-05" },
      { label: "Tue Apr 6", date: "2027-04-06" },
      { label: "Wed Apr 7", date: "2027-04-07" },
      { label: "Thu Apr 8", date: "2027-04-08" },
      { label: "Mon Apr 12", date: "2027-04-12" },
      { label: "Tue Apr 13", date: "2027-04-13" },
      { label: "Wed Apr 14", date: "2027-04-14" },
      { label: "Thu Apr 15", date: "2027-04-15" },
      { label: "Mon Apr 19", date: "2027-04-19" },
      { label: "Tue Apr 20", date: "2027-04-20" },
      { label: "Wed Apr 21", date: "2027-04-21" },
      { label: "Thu Apr 22", date: "2027-04-22" },
      { label: "Mon Apr 26", date: "2027-04-26" },
      { label: "Tue Apr 27", date: "2027-04-27" },
      { label: "Wed Apr 28", date: "2027-04-28" },
      { label: "Thu Apr 29", date: "2027-04-29" },
    ],
  },
  {
    key: "may_27",
    label: "May 2027",
    shortLabel: "May",
    days: [
      { label: "Mon May 3", date: "2027-05-03" },
      { label: "Tue May 4", date: "2027-05-04" },
      { label: "Wed May 5", date: "2027-05-05" },
      { label: "Thu May 6", date: "2027-05-06" },
      { label: "Mon May 10", date: "2027-05-10" },
      { label: "Tue May 11", date: "2027-05-11" },
      { label: "Wed May 12", date: "2027-05-12" },
      { label: "Thu May 13", date: "2027-05-13" },
      { label: "Mon May 17", date: "2027-05-17" },
      { label: "Tue May 18", date: "2027-05-18" },
      { label: "Wed May 19", date: "2027-05-19" },
      { label: "Thu May 20", date: "2027-05-20" },
      { label: "Mon May 24", date: "2027-05-24" },
      { label: "Tue May 25", date: "2027-05-25" },
      { label: "Wed May 26", date: "2027-05-26" },
      { label: "Thu May 27", date: "2027-05-27" },
    ],
  },
];

export const SCHOOL_YEAR_FUN_FRIDAY_MONTHS = [
  {
    key: "aug_26",
    label: "August 2026",
    fridays: [
      { label: "Fri Aug 21", date: "2026-08-21" },
      { label: "Fri Aug 28", date: "2026-08-28" },
    ],
  },
  {
    key: "sep_26",
    label: "September 2026",
    fridays: [
      { label: "Fri Sep 4", date: "2026-09-04" },
      { label: "Fri Sep 11", date: "2026-09-11" },
      { label: "Fri Sep 18", date: "2026-09-18" },
      { label: "Fri Sep 25", date: "2026-09-25" },
    ],
  },
  {
    key: "oct_26",
    label: "October 2026",
    fridays: [
      { label: "Fri Oct 2", date: "2026-10-02" },
      { label: "Fri Oct 9", date: "2026-10-09" },
      { label: "Fri Oct 16", date: "2026-10-16" },
      { label: "Fri Oct 23", date: "2026-10-23" },
      { label: "Fri Oct 30", date: "2026-10-30" },
    ],
  },
  {
    key: "nov_26",
    label: "November 2026",
    fridays: [
      { label: "Fri Nov 6", date: "2026-11-06" },
      { label: "Fri Nov 13", date: "2026-11-13" },
      { label: "Fri Nov 20", date: "2026-11-20" },
    ],
  },
  {
    key: "dec_26",
    label: "December 2026",
    fridays: [
      { label: "Fri Dec 4", date: "2026-12-04" },
      { label: "Fri Dec 11", date: "2026-12-11" },
    ],
  },
  {
    key: "jan_27",
    label: "January 2027",
    fridays: [
      { label: "Fri Jan 8", date: "2027-01-08" },
      { label: "Fri Jan 15", date: "2027-01-15" },
      { label: "Fri Jan 22", date: "2027-01-22" },
      { label: "Fri Jan 29", date: "2027-01-29" },
    ],
  },
  {
    key: "feb_27",
    label: "February 2027",
    fridays: [
      { label: "Fri Feb 5", date: "2027-02-05" },
      { label: "Fri Feb 12", date: "2027-02-12" },
      { label: "Fri Feb 19", date: "2027-02-19" },
      { label: "Fri Feb 26", date: "2027-02-26" },
    ],
  },
  {
    key: "mar_27",
    label: "March 2027",
    fridays: [
      { label: "Fri Mar 5", date: "2027-03-05" },
      { label: "Fri Mar 12", date: "2027-03-12" },
    ],
  },
  {
    key: "apr_27",
    label: "April 2027",
    fridays: [
      { label: "Fri Apr 2", date: "2027-04-02" },
      { label: "Fri Apr 9", date: "2027-04-09" },
      { label: "Fri Apr 16", date: "2027-04-16" },
      { label: "Fri Apr 23", date: "2027-04-23" },
      { label: "Fri Apr 30", date: "2027-04-30" },
    ],
  },
  {
    key: "may_27",
    label: "May 2027",
    fridays: [
      { label: "Fri May 7", date: "2027-05-07" },
      { label: "Fri May 14", date: "2027-05-14" },
      { label: "Fri May 21", date: "2027-05-21" },
    ],
  },
];

export function schoolYearAftercareMonthCents(
  month: (typeof SCHOOL_YEAR_AFTERCARE_MONTHS)[number],
): number {
  const normalMonthDayThreshold = 15;
  return month.days.length < normalMonthDayThreshold
    ? Math.round(month.days.length * 1868.75)
    : AFTERCARE_MONTHLY_CENTS;
}
export function schoolYearFunFridayMonthCents(
  month: (typeof SCHOOL_YEAR_FUN_FRIDAY_MONTHS)[number],
): number {
  return month.fridays.length >= 4
    ? FUN_FRIDAY_MONTHLY_CENTS
    : month.fridays.length * FUN_FRIDAY_SESSION_MONTHLY_CENTS;
}

export const SCHOOL_YEAR_MONTHS = [
  { index: 1, label: "August 2026", short: "Aug" },
  { index: 2, label: "September 2026", short: "Sep" },
  { index: 3, label: "October 2026", short: "Oct" },
  { index: 4, label: "November 2026", short: "Nov" },
  { index: 5, label: "December 2026", short: "Dec" },
  { index: 6, label: "January 2027", short: "Jan" },
  { index: 7, label: "February 2027", short: "Feb" },
  { index: 8, label: "March 2027", short: "Mar" },
  { index: 9, label: "April 2027", short: "Apr" },
  { index: 10, label: "May 2027", short: "May" },
];

export function getWeekdaysForMonth(
  monthIndex: number,
): { encoded: number; label: string; dayOfMonth: number }[] {
  const monthOffsets: [number, number][] = [
    [2026, 7],
    [2026, 8],
    [2026, 9],
    [2026, 10],
    [2026, 11],
    [2027, 0],
    [2027, 1],
    [2027, 2],
    [2027, 3],
    [2027, 4],
  ];
  const [year, month] = monthOffsets[monthIndex - 1];
  const days: { encoded: number; label: string; dayOfMonth: number }[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow >= 1 && dow <= 4) {
      const dom = date.getDate();
      const encoded = (monthIndex - 1) * 31 + dom;
      const label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      days.push({ encoded, label, dayOfMonth: dom });
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getGradeTier(grade: string | null): "primary" | "upper" {
  if (!grade) return "upper";
  const g = grade.toLowerCase().trim();
  if (["pre-k", "prek", "pre k", "kindergarten", "k", "1st", "1", "1st grade"].includes(g))
    return "primary";
  return "upper";
}

export function schoolYearTuitionCents(grade: string | null): number {
  return getGradeTier(grade) === "primary"
    ? SCHOOL_YEAR_TUITION_PRIMARY_CENTS
    : SCHOOL_YEAR_TUITION_UPPER_CENTS;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function tierToDays(tier: HomeschoolTier): string[] {
  if (tier === "dropin") return ["mon"];
  if (tier === "2day") return ["mon", "tue"];
  return ["mon", "tue", "wed"];
}

export function schoolYearMonthShort(monthIndex: number): string {
  return SCHOOL_YEAR_MONTHS.find((m) => m.index === monthIndex)?.short ?? `Month ${monthIndex}`;
}

export function schoolYearMonthLabel(monthIndex: number): string {
  return SCHOOL_YEAR_MONTHS.find((m) => m.index === monthIndex)?.label ?? `Month ${monthIndex}`;
}

export function parseSchoolYearMonthIndices(raw: string): number[] {
  return raw
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);
}

export function formatSchoolYearMonthIndices(
  indices: number[],
  style: "short" | "label" = "short",
): string {
  const formatter = style === "label" ? schoolYearMonthLabel : schoolYearMonthShort;
  return indices.map(formatter).join(", ");
}

export function formatSchoolYearMonthsFromMetadata(
  raw: string | undefined,
  style: "short" | "label" = "short",
): string | null {
  if (!raw) return null;
  const indices = parseSchoolYearMonthIndices(raw);
  if (indices.length === 0) return null;
  return formatSchoolYearMonthIndices(indices, style);
}

export function formatWeekdayKeys(dayKeys: string[]): string {
  const set = new Set(dayKeys);
  return WEEKDAYS.filter(({ key }) => set.has(key))
    .map(({ label }) => label)
    .join(", ");
}

export function buildPaidDaysByMonth(
  entries: {
    weekDays: Record<number, string[]>;
    weeks: number[];
    days: string[];
    createdAt?: string;
  }[],
): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  const resultAt: Record<number, string> = {};

  for (const entry of entries) {
    const entryTime = entry.createdAt ?? "";
    const monthToDays: Record<number, string[]> = {};

    for (const monthIndex of entry.weeks) {
      const days =
        entry.weekDays[monthIndex]?.length > 0
          ? entry.weekDays[monthIndex]
          : entry.days;
      if (days.length > 0) {
        monthToDays[monthIndex] = days;
      }
    }
    for (const [wk, days] of Object.entries(entry.weekDays)) {
      const monthIndex = Number(wk);
      if (days.length > 0) {
        monthToDays[monthIndex] = days;
      }
    }

    for (const [monthIndexStr, days] of Object.entries(monthToDays)) {
      const monthIndex = Number(monthIndexStr);
      const prevTime = resultAt[monthIndex] ?? "";
      if (!result[monthIndex] || entryTime >= prevTime) {
        result[monthIndex] = days;
        resultAt[monthIndex] = entryTime;
      }
    }
  }
  return result;
}

export function formatHomeschoolSubline(meta: Record<string, string>): string | null {
  const program = meta.program ?? "summer_26";
  const isSchoolYear = program === "school_year_26_27";

  const weekDayMap: Record<number, string[]> = {};
  if (meta.week_selections) {
    try {
      const parsed: { week: number; days: string[] }[] = JSON.parse(meta.week_selections);
      for (const { week, days } of parsed) {
        weekDayMap[week] = days;
      }
    } catch {
      /* ignore malformed */
    }
  }

  const formatPeriod = (index: number) =>
    isSchoolYear ? schoolYearMonthShort(index) : `Wk ${index}`;

  if (Object.keys(weekDayMap).length > 0) {
    const parts = Object.entries(weekDayMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([wk, days]) => {
        const dayLabels = days
          .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
          .join(", ");
        return `${dayLabels} · ${formatPeriod(Number(wk))}`;
      });
    return parts.join(" · ");
  }

  const days = meta.selected_days
    ? meta.selected_days.split(",").filter(Boolean).map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    : [];
  const wks = meta.selected_weeks
    ? meta.selected_weeks.split(",").map(Number).filter(Boolean)
    : [];

  if (days.length > 0 && wks.length > 0) {
    const periodLabels = isSchoolYear
      ? wks.map((w) => schoolYearMonthShort(w)).join(", ")
      : `Wk ${wks.join(", ")}`;
    return `${days.length} day${days.length !== 1 ? "s" : ""} · ${days.join(", ")} · ${periodLabels}`;
  }
  if (days.length > 0) {
    return `${days.length} day${days.length !== 1 ? "s" : ""} · ${days.join(", ")}`;
  }
  if (wks.length > 0) {
    if (isSchoolYear) {
      const labels = wks.map((w) => schoolYearMonthShort(w)).join(", ");
      return `${wks.length} month${wks.length !== 1 ? "s" : ""} · ${labels}`;
    }
    return `${wks.length} week${wks.length !== 1 ? "s" : ""}`;
  }
  return null;
}
