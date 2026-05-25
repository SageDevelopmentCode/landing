import { SUMMER_DATE_TO_WEEK, JS_DOW_TO_DAY_KEY } from "./summer-schedule";

type Transaction = {
  payment_type: string;
  status: string;
  student_id: string | null;
  metadata: Record<string, unknown> | null;
};

// Returns a map: studentId → Set of ISO date strings the child has paid for.
export function computePaidDates(
  transactions: Transaction[]
): Record<string, Set<string>> {
  const paidWeeks: Record<string, number[]> = {};
  for (const tx of transactions) {
    if (
      tx.payment_type === "summer_tuition" &&
      tx.status === "completed" &&
      tx.student_id
    ) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      if (meta.plan_type === "full") {
        paidWeeks[tx.student_id] = Array.from({ length: 12 }, (_, i) => i + 1);
      } else {
        const weeks = meta.weeks?.split(",").map(Number).filter(Boolean) ?? [];
        paidWeeks[tx.student_id] = [
          ...(paidWeeks[tx.student_id] ?? []),
          ...weeks,
        ];
      }
    }
  }

  const paidHomeschool: Record<string, { week: number; days: string[] }[]> = {};
  for (const tx of transactions) {
    if (
      tx.payment_type === "homeschool_dropin" &&
      tx.status === "completed" &&
      tx.student_id
    ) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const program = meta.program ?? "summer_26";
      if (program !== "summer_26") continue;

      let weekDayEntries: { week: number; days: string[] }[] = [];
      if (meta.week_selections) {
        try {
          weekDayEntries = JSON.parse(meta.week_selections);
        } catch {
          // fall through to legacy fallback
        }
      }
      if (!weekDayEntries.length) {
        const weeks =
          meta.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
        const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
        weekDayEntries = weeks.map((w) => ({ week: w, days }));
      }
      paidHomeschool[tx.student_id] = [
        ...(paidHomeschool[tx.student_id] ?? []),
        ...weekDayEntries,
      ];
    }
  }

  const result: Record<string, Set<string>> = {};

  for (const [studentId, weeks] of Object.entries(paidWeeks)) {
    if (!result[studentId]) result[studentId] = new Set();
    for (const [date, weekNum] of Object.entries(SUMMER_DATE_TO_WEEK)) {
      if (weeks.includes(weekNum)) result[studentId].add(date);
    }
  }

  for (const [studentId, entries] of Object.entries(paidHomeschool)) {
    if (!result[studentId]) result[studentId] = new Set();
    for (const { week, days } of entries) {
      for (const [date, weekNum] of Object.entries(SUMMER_DATE_TO_WEEK)) {
        if (weekNum !== week) continue;
        const d = new Date(date + "T00:00:00");
        const dayKey = JS_DOW_TO_DAY_KEY[d.getDay()];
        if (dayKey && days.includes(dayKey)) result[studentId].add(date);
      }
    }
  }

  return result;
}
