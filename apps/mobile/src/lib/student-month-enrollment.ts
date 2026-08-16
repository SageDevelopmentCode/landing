import type { StripeTxnLike } from "./school-year-attendance";
import { tierToDays, type HomeschoolTier } from "./school-year";

export type StudentMonthEnrollment = {
  isPaidForMonth: boolean;
  homeschoolDays: string[];
};

export type EnrollmentTxn = StripeTxnLike & {
  student_id: string;
};

function metaString(
  meta: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  const value = meta?.[key];
  return typeof value === "string" ? value : undefined;
}

function parseWeekSelectionsJson(
  json: string | undefined,
  monthIndex: number,
): string[] {
  if (!json) return [];

  try {
    const selections = JSON.parse(json) as Array<{
      week: number;
      days: string[];
    }>;
    const days = new Set<string>();
    for (const s of selections) {
      if (s.week === monthIndex) {
        s.days.forEach((d) => days.add(d));
      }
    }
    return Array.from(days);
  } catch {
    return [];
  }
}

function mergeHomeschoolDays(
  entry: StudentMonthEnrollment,
  days: string[],
): void {
  if (days.length === 0) return;
  entry.isPaidForMonth = true;
  const merged = new Set([...entry.homeschoolDays, ...days]);
  entry.homeschoolDays = Array.from(merged);
}

function parseHomeschoolDropInMonthDays(
  txn: StripeTxnLike,
  monthIndex: number,
): string[] {
  const meta = txn.metadata ?? {};
  if (metaString(meta, "program") !== "school_year_26_27") return [];

  const fromJson = parseWeekSelectionsJson(
    metaString(meta, "week_selections"),
    monthIndex,
  );
  if (fromJson.length > 0) return fromJson;

  const selectedWeeks = metaString(meta, "selected_weeks")
    ?.split(",")
    .map(Number)
    .filter(Boolean);
  const selectedDays = metaString(meta, "selected_days")
    ?.split(",")
    .filter(Boolean);

  if (selectedWeeks?.includes(monthIndex) && selectedDays?.length) {
    return selectedDays;
  }

  return [];
}

function parseSupplyFeeHomeschoolBundleDays(
  txn: StripeTxnLike,
  monthIndex: number,
): string[] {
  const meta = txn.metadata ?? {};
  if (metaString(meta, "bundle_type") !== "homeschool") return [];

  const fromJson = parseWeekSelectionsJson(
    metaString(meta, "bundle_homeschool_week_selections_json"),
    monthIndex,
  );
  if (fromJson.length > 0) return fromJson;

  const bundleMonthIndex = Number(metaString(meta, "bundle_month_index"));
  if (bundleMonthIndex !== monthIndex) return [];

  const tier = metaString(meta, "bundle_homeschool_tier") as
    | HomeschoolTier
    | undefined;
  if (tier === "dropin" || tier === "2day" || tier === "3day") {
    return tierToDays(tier);
  }

  return [];
}

function isFullTuitionPaidForMonth(
  txn: StripeTxnLike,
  monthIndex: number,
): boolean {
  if (txn.payment_type !== "school_year_tuition") return false;
  const months = metaString(txn.metadata, "selected_months")
    ?.split(",")
    .map(Number)
    .filter(Boolean);
  return months?.includes(monthIndex) ?? false;
}

function isHomeschoolBundlePaidForMonth(
  txn: StripeTxnLike,
  monthIndex: number,
): boolean {
  if (txn.payment_type !== "homeschool") return false;
  const months = metaString(txn.metadata, "selected_months")
    ?.split(",")
    .map(Number)
    .filter(Boolean);
  return months?.includes(monthIndex) ?? false;
}

function isSupplyFeeSchoolYearBundlePaidForMonth(
  txn: StripeTxnLike,
  monthIndex: number,
): boolean {
  if (txn.payment_type !== "supply_fee") return false;
  const meta = txn.metadata ?? {};
  if (metaString(meta, "bundle_type") !== "school_year_tuition") return false;
  return Number(metaString(meta, "bundle_month_index")) === monthIndex;
}

/** Build per-student paid/enrollment summary for a school-year month index (1–10). */
export function buildStudentMonthEnrollment(
  txns: EnrollmentTxn[],
  monthIndex: number,
): Map<string, StudentMonthEnrollment> {
  const map = new Map<string, StudentMonthEnrollment>();

  for (const txn of txns) {
    const sid = txn.student_id;
    if (!sid) continue;

    if (!map.has(sid)) {
      map.set(sid, { isPaidForMonth: false, homeschoolDays: [] });
    }
    const entry = map.get(sid)!;

    if (isFullTuitionPaidForMonth(txn, monthIndex)) {
      entry.isPaidForMonth = true;
    }

    if (isHomeschoolBundlePaidForMonth(txn, monthIndex)) {
      entry.isPaidForMonth = true;
    }

    if (isSupplyFeeSchoolYearBundlePaidForMonth(txn, monthIndex)) {
      entry.isPaidForMonth = true;
    }

    if (txn.payment_type === "homeschool_dropin") {
      mergeHomeschoolDays(entry, parseHomeschoolDropInMonthDays(txn, monthIndex));
    }

    if (txn.payment_type === "supply_fee") {
      mergeHomeschoolDays(
        entry,
        parseSupplyFeeHomeschoolBundleDays(txn, monthIndex),
      );
    }
  }

  return map;
}
