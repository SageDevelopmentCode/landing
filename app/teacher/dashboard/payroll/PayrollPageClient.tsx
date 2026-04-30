"use client";

import { useState, useMemo, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Calendar,
} from "lucide-react";
import { submitPaystub } from "@/app/actions/paystubs";
import type { Paystub } from "@/app/actions/paystubs";
import type { SessionsByDay } from "@/app/actions/teacherHours";
import {
  getPastPayPeriods,
  sessionDurationHours,
  formatDuration,
  fmt12,
  toISOKey,
} from "@/app/lib/clock-utils";

interface Props {
  paystubs: Paystub[];
  hourlyRate: number | null;
  sessionsByDay: SessionsByDay;
}

const STATUS_CONFIG = {
  pending:  { label: "Pending",  bg: "bg-amber-50",        text: "text-amber-700",    border: "border-amber-200" },
  approved: { label: "Approved", bg: "bg-blue-50",          text: "text-blue-700",     border: "border-blue-200" },
  paid:     { label: "Paid",     bg: "bg-[#4a7c59]/8",      text: "text-[#4a7c59]",   border: "border-[#4a7c59]/20" },
} as const;

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtSubmitted(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PayrollPageClient({ paystubs: initial, hourlyRate, sessionsByDay }: Props) {
  const [paystubs, setPaystubs] = useState<Paystub[]>(initial);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedStub, setExpandedStub] = useState<string | null>(null);

  const periods = useMemo(() => getPastPayPeriods(12), []);
  const selectedPeriod = periods[selectedPeriodIdx];

  const periodSessions = useMemo(() => {
    if (!selectedPeriod) return [];
    const result: Array<{ date: string; clockInAt: string; clockOutAt: string; hours: number }> = [];
    const start = new Date(selectedPeriod.start + "T00:00:00");
    const end   = new Date(selectedPeriod.end   + "T00:00:00");
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toISOKey(new Date(d));
      for (const s of sessionsByDay[key] ?? []) {
        if (s.clockOutAt) {
          result.push({
            date:       key,
            clockInAt:  s.clockInAt,
            clockOutAt: s.clockOutAt,
            hours:      sessionDurationHours(s),
          });
        }
      }
    }
    return result;
  }, [selectedPeriod, sessionsByDay]);

  const totalHours = useMemo(
    () => Math.round(periodSessions.reduce((a, s) => a + s.hours, 0) * 100) / 100,
    [periodSessions],
  );

  const grossPay = hourlyRate ? Math.round(totalHours * hourlyRate * 100) / 100 : null;

  const alreadySubmitted = useMemo(
    () =>
      selectedPeriod
        ? paystubs.some(
            (p) => p.period_start === selectedPeriod.start && p.period_end === selectedPeriod.end,
          )
        : false,
    [paystubs, selectedPeriod],
  );

  const canSubmit = !!hourlyRate && totalHours > 0 && !alreadySubmitted && !isPending;

  function handleSubmit() {
    if (!canSubmit || !selectedPeriod) return;
    setSubmitError(null);
    setSubmitSuccess(false);
    startTransition(async () => {
      const result = await submitPaystub(selectedPeriod.start, selectedPeriod.end);
      if ("error" in result) {
        setSubmitError(result.error);
      } else {
        setPaystubs((prev) => [result.paystub, ...prev]);
        setSubmitSuccess(true);
      }
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: submission panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold font-heading text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-0.5">Submit and track your paystub requests.</p>
        </div>

        {/* No rate banner */}
        {!hourlyRate && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Your hourly rate hasn&apos;t been set yet. Contact your admin before submitting a paystub.
            </p>
          </div>
        )}

        {/* Submit card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4a7c59]" />
            <h2 className="text-sm font-semibold text-gray-800">New Paystub Request</h2>
          </div>

          {/* Period selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Pay Period</label>
            <div className="relative">
              <select
                value={selectedPeriodIdx}
                onChange={(e) => {
                  setSelectedPeriodIdx(Number(e.target.value));
                  setSubmitError(null);
                  setSubmitSuccess(false);
                }}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 pr-8 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
              >
                {periods.map((p, i) => (
                  <option key={p.start} value={i}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Hours</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{formatDuration(totalHours)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Rate</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {hourlyRate ? `$${hourlyRate}/hr` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-[#4a7c59]/5 border border-[#4a7c59]/15 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-[#4a7c59]" />
                <span className="text-xs text-[#4a7c59]">Gross Pay</span>
              </div>
              <p className="text-sm font-semibold text-[#4a7c59]">
                {grossPay != null ? fmtMoney(grossPay) : "—"}
              </p>
            </div>
          </div>

          {/* Session list */}
          {periodSessions.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">{periodSessions.length} session{periodSessions.length !== 1 ? "s" : ""}</p>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {periodSessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span>{fmtDate(s.date)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{fmt12(s.clockInAt)} – {fmt12(s.clockOutAt)}</span>
                    </div>
                    <span className="font-medium text-gray-700">{formatDuration(s.hours)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">
              No completed sessions for this period.{" "}
              <a href="/teacher/dashboard/hours" className="text-[#4a7c59] underline">View My Hours</a> to check for unclosed sessions.
            </p>
          )}

          {/* Feedback messages */}
          {alreadySubmitted && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              Already submitted for this period. Check your history below.
            </div>
          )}
          {submitSuccess && (
            <div className="flex items-center gap-2 text-xs text-[#4a7c59] bg-[#4a7c59]/6 border border-[#4a7c59]/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              Paystub submitted! It will appear in your history once admin reviews it.
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-[#4a7c59] text-white text-sm font-medium py-2.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:opacity-80"
          >
            {isPending ? "Submitting…" : "Submit Paystub"}
          </button>
        </div>
      </div>

      {/* Right: history sidebar */}
      <aside className="w-72 border-l border-gray-100 bg-white overflow-y-auto flex-shrink-0 p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
        {paystubs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-8">No paystubs submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {paystubs.map((stub) => {
              const cfg = STATUS_CONFIG[stub.status];
              const isExpanded = expandedStub === stub.id;
              return (
                <div
                  key={stub.id}
                  className="rounded-xl border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedStub(isExpanded ? null : stub.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {fmtDate(stub.period_start)} – {fmtDate(stub.period_end)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtMoney(stub.gross_pay)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-3 h-3 text-gray-400" />
                        : <ChevronDown className="w-3 h-3 text-gray-400" />
                      }
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-50 bg-gray-50/50">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <span className="text-gray-400">Hours</span>
                        <span className="text-gray-700 font-medium text-right">{formatDuration(stub.total_hours)}</span>
                        <span className="text-gray-400">Rate</span>
                        <span className="text-gray-700 font-medium text-right">${stub.hourly_rate_snapshot}/hr</span>
                        <span className="text-gray-400">Gross Pay</span>
                        <span className="text-gray-700 font-medium text-right">{fmtMoney(stub.gross_pay)}</span>
                        <span className="text-gray-400">Submitted</span>
                        <span className="text-gray-700 font-medium text-right">{fmtSubmitted(stub.submitted_at)}</span>
                        {stub.approved_at && (
                          <>
                            <span className="text-gray-400">Approved</span>
                            <span className="text-gray-700 font-medium text-right">{fmtSubmitted(stub.approved_at)}</span>
                          </>
                        )}
                        {stub.paid_at && (
                          <>
                            <span className="text-gray-400">Paid</span>
                            <span className="text-gray-700 font-medium text-right">{fmtSubmitted(stub.paid_at)}</span>
                          </>
                        )}
                      </div>
                      {stub.admin_note && (
                        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2 text-xs text-gray-600">
                          <span className="font-medium text-gray-400 block mb-0.5">Admin note</span>
                          {stub.admin_note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}
