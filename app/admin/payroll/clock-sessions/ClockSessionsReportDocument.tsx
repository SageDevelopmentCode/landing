"use client";

import type { DaySessionSummary } from "../clockSessionsSummary";
import {
  fmtDateRangeLabel,
  fmtDayLabel,
  fmtDuration,
  fmtMins,
  fmtTime,
} from "../clockSessionsSummary";

export type ClockSessionsReportDay = {
  dateKey: string;
  mins: number;
  sessionCount: number;
  activeCount: number;
  sessions: DaySessionSummary[];
};

export type ClockSessionsReportDocumentProps = {
  employeeName: string;
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
  totalMins: number;
  sessionCount: number;
  activeCount: number;
  days: ClockSessionsReportDay[];
};

export function ClockSessionsReportDocument({
  employeeName,
  rangeStart,
  rangeEnd,
  generatedAt,
  totalMins,
  sessionCount,
  activeCount,
  days,
}: ClockSessionsReportDocumentProps) {
  const rangeLabel = fmtDateRangeLabel(rangeStart, rangeEnd);

  return (
    <>
      <div className="clock-sessions-report-print clock-sessions-report-document max-w-3xl mx-auto bg-white text-gray-900 px-4 py-6 sm:px-8 sm:py-10">
        <header className="mb-6 border-b-2 border-[#2C5F2E] pb-4">
          <p className="text-[10px] uppercase tracking-widest text-[#2C5F2E] font-semibold mb-1">
            Sage Field School
          </p>
          <h1 className="text-xl font-bold text-gray-900 font-heading mb-2">
            Time Summary
          </h1>
          <p className="text-sm text-gray-600 font-body leading-relaxed">
            <span className="font-semibold text-gray-800">Employee:</span>{" "}
            {employeeName}
            {" · "}
            <span className="font-semibold text-gray-800">Period:</span>{" "}
            {rangeLabel}
            {" · "}
            <span className="font-semibold text-gray-800">Generated:</span>{" "}
            {generatedAt}
          </p>
        </header>

        <div
          className="rounded-xl border border-[#2C5F2E]/20 bg-[#f4f8f5] px-5 py-4 mb-8 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#2C5F2E] font-semibold mb-1">
              Period total
            </p>
            <p className="text-3xl font-bold text-gray-900 font-heading tabular-nums leading-none">
              {fmtMins(totalMins)}
            </p>
          </div>
          <div className="text-sm text-gray-600 font-body tabular-nums">
            <span className="font-semibold text-gray-800">{sessionCount}</span>{" "}
            session{sessionCount !== 1 ? "s" : ""}
            {activeCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-[#2C5F2E]">{activeCount}</span>{" "}
                active
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {days.map((day) => (
            <section key={day.dateKey} className="clock-sessions-report-day break-inside-avoid">
              <div className="flex items-baseline justify-between gap-4 mb-2 border-b border-gray-200 pb-2">
                <h2 className="text-sm font-bold text-gray-900 font-heading">
                  {fmtDayLabel(day.dateKey)}
                </h2>
                <p className="text-sm font-semibold text-[#2C5F2E] tabular-nums font-body">
                  {day.mins > 0 ? fmtMins(day.mins) : "—"}
                  <span className="text-gray-400 font-normal ml-2">
                    ({day.sessionCount} session{day.sessionCount !== 1 ? "s" : ""})
                  </span>
                </p>
              </div>

              <table className="w-full border-collapse text-sm font-body">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["In", "Out", "Duration", "Note"].map((label) => (
                      <th
                        key={label}
                        className="py-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500 last:pr-0"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {day.sessions.map((session, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-2 pr-4 text-gray-800 tabular-nums whitespace-nowrap">
                        {fmtTime(session.clock_in_at)}
                      </td>
                      <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                        {session.clock_out_at ? (
                          <span className="text-gray-800">{fmtTime(session.clock_out_at)}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#2C5F2E] bg-[#e8f0ea]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-600 tabular-nums whitespace-nowrap">
                        {fmtDuration(session.clock_in_at, session.clock_out_at)}
                      </td>
                      <td className="py-2 text-gray-700 last:pr-0">
                        {session.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        <footer className="mt-10 pt-4 border-t border-gray-200 flex items-center justify-between gap-4 text-sm font-body">
          <span className="text-gray-500">{rangeLabel}</span>
          <span className="font-bold text-gray-900 tabular-nums">
            Total: {fmtMins(totalMins)}
          </span>
        </footer>
      </div>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in;
        }

        @media print {
          aside,
          .lg\\:hidden.fixed.top-4 {
            display: none !important;
          }

          .h-screen.flex.overflow-hidden {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          main {
            padding: 0 !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }

          .clock-sessions-report-print-root {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .clock-sessions-report-document {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .clock-sessions-report-day {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
