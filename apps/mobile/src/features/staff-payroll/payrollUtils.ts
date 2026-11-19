// Pure payroll helpers shared by usePayroll / usePayrollHistory and the Garden UI.
import { toDateKey } from "@/lib/clock-utils";

export type PaystubStatus = "pending" | "approved" | "paid";

export type Paystub = {
  id: string;
  teacher_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate_snapshot: number;
  gross_pay: number;
  status: PaystubStatus;
  submitted_at: string;
  approved_at: string | null;
  paid_at: string | null;
  admin_note: string | null;
};

export type RawSession = {
  id: string;
  clock_in_at: string;
  clock_out_at: string;
};

export type PayPeriod = { start: string; end: string; label: string };

/** "$1,234.50" — always two decimals (rates used to show as "$15.5"). */
export function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const neg = n < 0;
  const [whole, cents] = Math.abs(n).toFixed(2).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}$${withCommas}.${cents}`;
}

export function fmtHours(n: number): string {
  return n.toFixed(2);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "Nov 30" for a YYYY-MM-DD key (local, no timezone shift). */
export function fmtDayKey(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** History card title: "Nov 10 – Nov 23, 2026". */
export function fmtPeriod(start: string, end: string): string {
  const e = new Date(`${end}T00:00:00`);
  return `${fmtDayKey(start)} – ${fmtDayKey(end)}, ${e.getFullYear()}`;
}

/** A period is still in progress until its last day has passed. */
export function isPeriodInProgress(p: PayPeriod, now: Date = new Date()): boolean {
  return toDateKey(now) <= p.end;
}

export const STATUS_META: Record<PaystubStatus, { label: string; tint: "butter" | "sky" | "sage"; icon: string }> = {
  pending: { label: "Pending", tint: "butter", icon: "hourglass-outline" },
  approved: { label: "Approved", tint: "sky", icon: "checkmark-circle-outline" },
  paid: { label: "Paid", tint: "sage", icon: "cash-outline" },
};

export const DUPLICATE_MSG = "A paystub for this period has already been submitted.";
export const NO_RATE_MSG = "Your hourly rate hasn't been set yet. Contact an admin before submitting.";
