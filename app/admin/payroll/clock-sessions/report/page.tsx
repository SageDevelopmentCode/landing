import { notFound } from "next/navigation";
import { getClockSessionsForRange } from "@/app/actions/timeclock";
import { getEmployeeClockSummary } from "../../clockSessionsSummary";
import { ClockSessionsReportDocument } from "../ClockSessionsReportDocument";
import { ClockSessionsReportToolbar } from "./ClockSessionsReportToolbar";

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00");
  return !Number.isNaN(d.getTime());
}

export default async function ClockSessionsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; start?: string; end?: string }>;
}) {
  const { teacherId, start, end } = await searchParams;

  if (!teacherId || !start || !end) notFound();
  if (!isValidDateKey(start) || !isValidDateKey(end)) notFound();
  if (start > end) notFound();

  const sessions = await getClockSessionsForRange(start, end);
  const summary = getEmployeeClockSummary(sessions, teacherId);

  if (!summary || summary.sessionCount === 0) notFound();

  const days = [...summary.byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, day]) => ({
      dateKey,
      mins: day.mins,
      sessionCount: day.sessionCount,
      activeCount: day.activeCount,
      sessions: day.sessions,
    }));

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="clock-sessions-report-print-root min-h-full bg-gray-50 pb-10">
      <ClockSessionsReportToolbar />
      <ClockSessionsReportDocument
        employeeName={summary.full_name ?? "Employee"}
        rangeStart={start}
        rangeEnd={end}
        generatedAt={generatedAt}
        totalMins={summary.totalMins}
        sessionCount={summary.sessionCount}
        activeCount={summary.activeCount}
        days={days}
      />
    </div>
  );
}
