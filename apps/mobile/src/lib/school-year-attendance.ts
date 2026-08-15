// Keep in sync with shared/billing/school-year-attendance.ts (web uses repo-root shared/).

// Keep in sync with shared/billing/school-year.ts SCHOOL_YEAR_FUN_FRIDAY_MONTHS
const SCHOOL_YEAR_FUN_FRIDAY_MONTHS = [
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

export type StripeTxnLike = {
  payment_type: string;
  metadata: Record<string, unknown> | null;
};

const JS_DAY_TO_NAME: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

const SUMMER_FUN_FRIDAY_MONTH_KEYS = new Set(["may", "jun", "jul", "aug"]);

export const SCHOOL_YEAR_FUN_FRIDAY_KEYS = new Set(
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key),
);

/** First school day of SY 26–27 (Mon Aug 17, 2026). */
export const SCHOOL_YEAR_START = new Date(2026, 7, 17);

/** Map ISO date → tuition month index 1..10 (Aug 2026 = 1 … May 2027 = 10). */
export function dateToSchoolYearMonthIndex(dateStr: string): number | null {
  const [y, m] = dateStr.split("-").map(Number);
  if (y === 2026 && m >= 8) return m - 7;
  if (y === 2027 && m <= 5) return m + 5;
  return null;
}

export function getDayOfWeekName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return JS_DAY_TO_NAME[new Date(y, m - 1, d).getDay()];
}

export function isSchoolYearWeekday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow >= 1 && dow <= 4;
}

export function isSchoolYearFriday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 5;
}

/** Resolve aug_26 / sep_26 / … for a given Friday ISO date. */
export function getSchoolYearFunFridayMonthKey(dateStr: string): string | null {
  for (const month of SCHOOL_YEAR_FUN_FRIDAY_MONTHS) {
    if (month.fridays.some((f) => f.date === dateStr)) {
      return month.key;
    }
  }
  return null;
}

function metaString(
  meta: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  const value = meta?.[key];
  return typeof value === "string" ? value : undefined;
}

function isSchoolYearHomeschoolPaidForWeekday(
  txn: StripeTxnLike,
  dateStr: string,
  monthIndex: number,
  dayOfWeek: string,
): boolean {
  const meta = txn.metadata ?? {};
  if (metaString(meta, "program") !== "school_year_26_27") return false;

  const weekSelections = metaString(meta, "week_selections");
  if (weekSelections) {
    try {
      const selections = JSON.parse(weekSelections) as Array<{
        week: number;
        days: string[];
      }>;
      return selections.some(
        (s) => s.week === monthIndex && s.days.includes(dayOfWeek),
      );
    } catch {
      // fall through
    }
  }

  const selectedWeeks = metaString(meta, "selected_weeks")
    ?.split(",")
    .map(Number)
    .filter(Boolean);
  const selectedDays = metaString(meta, "selected_days")
    ?.split(",")
    .filter(Boolean);

  if (selectedWeeks?.includes(monthIndex)) {
    if (!selectedDays?.length) return true;
    return selectedDays.includes(dayOfWeek);
  }

  if (selectedDays?.includes(dateStr)) return true;

  return false;
}

/** Mon–Thu school-year eligibility from stripe_transactions row. */
export function isSchoolYearWeekdayPaid(
  txn: StripeTxnLike,
  dateStr: string,
): boolean {
  if (!isSchoolYearWeekday(dateStr)) return false;

  const monthIndex = dateToSchoolYearMonthIndex(dateStr);
  if (monthIndex === null) return false;

  const dayOfWeek = getDayOfWeekName(dateStr);

  if (txn.payment_type === "school_year_tuition") {
    const months = metaString(txn.metadata, "selected_months")
      ?.split(",")
      .map(Number)
      .filter(Boolean);
    return months?.includes(monthIndex) ?? false;
  }

  if (txn.payment_type === "homeschool_dropin") {
    return isSchoolYearHomeschoolPaidForWeekday(
      txn,
      dateStr,
      monthIndex,
      dayOfWeek,
    );
  }

  return false;
}

/** Fri school-year Field Fun Friday eligibility (excludes summer FF month keys). */
export function isSchoolYearFieldFridayPaid(
  txn: StripeTxnLike,
  dateStr: string,
): boolean {
  if (!isSchoolYearFriday(dateStr)) return false;
  if (txn.payment_type !== "fun_friday_tuition") return false;

  const meta = txn.metadata ?? {};
  const paidFridays =
    metaString(meta, "selected_fridays")?.split(",").filter(Boolean) ?? [];
  if (paidFridays.includes(dateStr)) return true;

  const monthKey = getSchoolYearFunFridayMonthKey(dateStr);
  if (!monthKey) return false;

  const paidMonths =
    metaString(meta, "selected_months")?.split(",").filter(Boolean) ?? [];

  return paidMonths.some(
    (key) => SCHOOL_YEAR_FUN_FRIDAY_KEYS.has(key) && key === monthKey,
  );
}

/** Returns true if txn is a summer (not school-year) fun friday payment for the date. */
export function isSummerFieldFridayPaid(
  txn: StripeTxnLike,
  dateStr: string,
): boolean {
  if (txn.payment_type !== "fun_friday_tuition") return false;
  const meta = txn.metadata ?? {};
  const paidFridays =
    metaString(meta, "selected_fridays")?.split(",").filter(Boolean) ?? [];
  if (paidFridays.includes(dateStr)) {
    const syKey = getSchoolYearFunFridayMonthKey(dateStr);
    if (syKey) return false;
    return true;
  }

  const paidMonths =
    metaString(meta, "selected_months")?.split(",").filter(Boolean) ?? [];
  return paidMonths.some((key) => SUMMER_FUN_FRIDAY_MONTH_KEYS.has(key));
}
