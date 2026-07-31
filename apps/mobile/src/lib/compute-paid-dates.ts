export type TxRow = {
  student_id: string;
  payment_type: string;
  status: string;
  metadata: Record<string, unknown> | null;
};

const SUMMER_WEEK1_START = new Date(2026, 4, 25);
const DAY_OFFSETS: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 };
export const SUMMER_FIRST_DATE = "2026-05-26";
export const SUMMER_LAST_DATE  = "2026-08-14";

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekToDates(weekNum: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(SUMMER_WEEK1_START);
    d.setDate(d.getDate() + (weekNum - 1) * 7 + i);
    dates.push(toYMD(d));
  }
  return dates;
}

function weekDayToDate(weekNum: number, day: string): string {
  const d = new Date(SUMMER_WEEK1_START);
  d.setDate(d.getDate() + (weekNum - 1) * 7 + (DAY_OFFSETS[day] ?? 0));
  return toYMD(d);
}

export function computePaidDates(txns: TxRow[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const tx of txns) {
    if (tx.status !== "completed" || !tx.student_id) continue;
    const meta = (tx.metadata ?? {}) as Record<string, unknown>;
    const sid = tx.student_id;
    if (!map[sid]) map[sid] = new Set();

    if (tx.payment_type === "summer_tuition") {
      let weeks: number[] = [];
      if (meta.plan_type === "full") {
        weeks = Array.from({ length: 12 }, (_, i) => i + 1);
      } else if (typeof meta.weeks === "string") {
        weeks = meta.weeks.split(",").map(Number).filter(Boolean);
      }
      for (const w of weeks) weekToDates(w).forEach((dt) => map[sid].add(dt));
    } else if (tx.payment_type === "homeschool_dropin") {
      let sels: Array<{ week: number; days: string[] }> = [];
      if (typeof meta.week_selections === "string") {
        try { sels = JSON.parse(meta.week_selections); } catch {}
      } else if (typeof meta.selected_weeks === "string" && typeof meta.selected_days === "string") {
        const wks = meta.selected_weeks.split(",").map(Number).filter(Boolean);
        const dys = meta.selected_days.split(",").filter(Boolean);
        for (const w of wks) for (const d of dys) sels.push({ week: w, days: [d] });
      }
      for (const sel of sels) {
        for (const day of sel.days) map[sid].add(weekDayToDate(sel.week, day));
      }
    }
  }
  return Object.fromEntries(
    Object.entries(map).map(([sid, set]) => [sid, Array.from(set)])
  );
}
