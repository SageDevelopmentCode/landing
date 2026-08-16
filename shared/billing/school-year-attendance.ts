import {
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
} from "./school-year";

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

export const SCHOOL_YEAR_AFTERCARE_KEYS = new Set(
  SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => m.key),
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

/** Current tuition month index 1..10, clamped to school year bounds. */
export function getCurrentSchoolYearMonthIndex(): number {
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const idx = dateToSchoolYearMonthIndex(ymd);
  if (idx !== null) return idx;
  if (today < SCHOOL_YEAR_START) return 1;
  return 10;
}

/** All school dates in a tuition month (aftercare weekdays + fun fridays), sorted. */
export function getSchoolYearMonthDates(monthIndex: number): string[] {
  const aftercareMonth = SCHOOL_YEAR_AFTERCARE_MONTHS[monthIndex - 1];
  const fridayMonth = SCHOOL_YEAR_FUN_FRIDAY_MONTHS[monthIndex - 1];
  if (!aftercareMonth || !fridayMonth) return [];
  const dates = [
    ...aftercareMonth.days.map((d) => d.date),
    ...fridayMonth.fridays.map((f) => f.date),
  ];
  return [...new Set(dates)].sort();
}

/** Resolve aug_26 / sep_26 / … for a given aftercare weekday ISO date. */
export function getSchoolYearAftercareMonthKey(dateStr: string): string | null {
  for (const month of SCHOOL_YEAR_AFTERCARE_MONTHS) {
    if (month.days.some((d) => d.date === dateStr)) {
      return month.key;
    }
  }
  return null;
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

/** Extended Learning (aftercare) eligibility for school year from stripe_transactions row. */
export function isSchoolYearAftercarePaid(
  txn: StripeTxnLike,
  dateStr: string,
): boolean {
  if (txn.payment_type !== "aftercare_tuition") return false;

  const meta = txn.metadata ?? {};
  const paidDays =
    metaString(meta, "selected_days")?.split(",").filter(Boolean) ?? [];
  if (paidDays.includes(dateStr)) return true;

  const monthKey = getSchoolYearAftercareMonthKey(dateStr);
  if (!monthKey) return false;

  const paidMonths =
    metaString(meta, "selected_months")?.split(",").filter(Boolean) ?? [];

  return paidMonths.some(
    (key) => SCHOOL_YEAR_AFTERCARE_KEYS.has(key) && key === monthKey,
  );
}

/** Fri school-year Field Fun Friday eligibility (excludes summer FF month keys). */
export function isSchoolYearFieldFridayPaid(
  txn: StripeTxnLike,
  dateStr: string,
): boolean {
  if (!isSchoolYearFriday(dateStr)) return false;
  if (txn.payment_type !== "fun_friday_tuition") return false;

  const meta = txn.metadata ?? {};
  const paidFridays = metaString(meta, "selected_fridays")?.split(",").filter(Boolean) ?? [];
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
  const paidFridays = metaString(meta, "selected_fridays")?.split(",").filter(Boolean) ?? [];
  if (paidFridays.includes(dateStr)) {
    const syKey = getSchoolYearFunFridayMonthKey(dateStr);
    if (syKey) return false;
    return true;
  }

  const paidMonths =
    metaString(meta, "selected_months")?.split(",").filter(Boolean) ?? [];
  return paidMonths.some((key) => SUMMER_FUN_FRIDAY_MONTH_KEYS.has(key));
}
