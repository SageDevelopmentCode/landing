"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getParentStudentAttendance } from "@/app/actions/getParentStudentAttendance";
import {
  ATT_FILTER_TABS,
  filterAttendanceRecords,
  getAttendanceStatus,
  PROGRAM_CONFIG,
  type AttendanceFilter,
  type AttendanceStatus,
  type UnifiedAttendanceRecord,
  type UserMap,
} from "@/shared/parent/student-attendance";
import GardenSheet from "@/app/parent/_garden/sheet";
import { EmptyState, ErrorCard, SkeletonList } from "@/app/parent/_garden/states";

/**
 * Attendance history shared by the parent Home sheet and the My Children "Attendance" tab
 * (after mobile `features/attendance/garden/AttendanceParts`).
 *  - `useAttendanceHistory(studentId)` loads and caches records per student.
 *  - `AttendanceFilters` / `AttendanceSummary` / `AttendanceList` / `AttendanceRecordDetail` are the pieces.
 *  - `AttendanceHistory` is the inline composition (list + a detail sheet).
 */

export function formatAttendanceDate(ymd: string) {
  return new Date(ymd + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPickupTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const STATUS: Record<AttendanceStatus, { label: string; cls: string; emoji: string }> = {
  absent: { label: "Absent", cls: "bg-[var(--sf-butter)] text-[#7a5b00]", emoji: "🏠" },
  picked_up: { label: "Picked Up", cls: "bg-[var(--sf-sky)] text-[#2d5d86]", emoji: "👋" },
  attended: { label: "Attended", cls: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]", emoji: "✓" },
};

// ─── Data ────────────────────────────────────────────────────────────────────
type Entry = { ok: true; records: UnifiedAttendanceRecord[]; userMap: UserMap } | { ok: false };

export type AttendanceData = {
  status: "idle" | "loading" | "error" | "ready";
  records: UnifiedAttendanceRecord[];
  userMap: UserMap;
  retry: () => void;
};

const EMPTY_RECORDS: UnifiedAttendanceRecord[] = [];
const EMPTY_MAP: UserMap = {};

/** Loads attendance for `studentId` while `enabled`, caching each student's result for the page's lifetime. */
export function useAttendanceHistory(studentId: string | null | undefined, enabled = true): AttendanceData {
  const [cache, setCache] = useState<Record<string, Entry>>({});
  const entry = studentId ? cache[studentId] : undefined;
  const shouldLoad = !!studentId && enabled && !entry;

  useEffect(() => {
    if (!shouldLoad || !studentId) return;
    let cancelled = false;
    getParentStudentAttendance(studentId)
      .then(({ records, userMap }) => {
        if (!cancelled) setCache((c) => ({ ...c, [studentId]: { ok: true, records, userMap } }));
      })
      .catch(() => {
        if (!cancelled) setCache((c) => ({ ...c, [studentId]: { ok: false } }));
      });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, studentId]);

  const retry = useCallback(() => {
    if (!studentId) return;
    setCache((c) => {
      const next = { ...c };
      delete next[studentId];
      return next;
    });
  }, [studentId]);

  const status: AttendanceData["status"] = !studentId || (!enabled && !entry) ? "idle" : !entry ? "loading" : entry.ok ? "ready" : "error";
  return {
    status,
    records: entry?.ok ? entry.records : EMPTY_RECORDS,
    userMap: entry?.ok ? entry.userMap : EMPTY_MAP,
    retry,
  };
}

// ─── Pieces ──────────────────────────────────────────────────────────────────
export function AttendanceFilters({ value, onChange }: { value: AttendanceFilter; onChange: (f: AttendanceFilter) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Filter by program">
      {ATT_FILTER_TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
            value === key
              ? "bg-[var(--sf-ink)] text-white"
              : "bg-white text-[var(--sf-soft)] ring-1 ring-[var(--sf-ink)]/10 hover:text-[var(--sf-ink)] focus-visible:text-[var(--sf-ink)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AttendanceSummary({ records }: { records: UnifiedAttendanceRecord[] }) {
  if (records.length === 0) return null;
  const counts = records.reduce(
    (acc, r) => {
      acc[getAttendanceStatus(r)] += 1;
      return acc;
    },
    { attended: 0, picked_up: 0, absent: 0 } as Record<AttendanceStatus, number>,
  );
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(STATUS) as AttendanceStatus[]).map((k) => (
        <div key={k} className={`rounded-[18px] px-3 py-2.5 ${STATUS[k].cls}`}>
          <p className="sf-display text-2xl leading-none">{counts[k]}</p>
          <p className="mt-1 text-xs font-extrabold">{STATUS[k].label}</p>
        </div>
      ))}
    </div>
  );
}

/** Loading / error / empty / rows. `onSelect` opens a record. */
export function AttendanceList({
  att,
  filter,
  onSelect,
}: {
  att: AttendanceData;
  filter: AttendanceFilter;
  onSelect: (r: UnifiedAttendanceRecord) => void;
}) {
  if (att.status === "loading" || att.status === "idle") {
    return <SkeletonList rows={5} rowClassName="h-14" label="Loading attendance…" />;
  }
  if (att.status === "error") {
    return <ErrorCard title="We couldn't load attendance." onRetry={att.retry} />;
  }
  const filtered = filterAttendanceRecords(att.records, filter);
  if (filtered.length === 0) {
    return <EmptyState emoji="📋" title="No attendance records found." tint="butter" />;
  }
  return (
    <ul className="flex flex-col gap-2">
      {filtered.map((r) => {
        const cfg = PROGRAM_CONFIG[r.program];
        const st = STATUS[getAttendanceStatus(r)];
        return (
          <li key={`${r.program}-${r.id}`}>
            <button
              type="button"
              onClick={() => onSelect(r)}
              className="flex min-h-14 w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-left shadow-[0_2px_0_0_rgba(43,42,38,0.06)] ring-1 ring-[var(--sf-ink)]/[0.06] transition hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/20 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
            >
              <span className="w-[92px] shrink-0 text-sm font-extrabold">{formatAttendanceDate(r.date)}</span>
              <span className="min-w-0 flex-1">
                <span className="inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-extrabold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                  {cfg.label}
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${st.cls}`}>
                <span aria-hidden="true">{st.emoji} </span>
                {st.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-[var(--sf-ink)]/10 py-3 last:border-0">
      <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/80">{label}</span>
      <span className="text-[15px] font-bold text-[var(--sf-ink)]">{children}</span>
    </div>
  );
}

export function AttendanceRecordDetail({ record, userMap }: { record: UnifiedAttendanceRecord; userMap: UserMap }) {
  const cfg = PROGRAM_CONFIG[record.program];
  const status = getAttendanceStatus(record);
  const recordedBy = userMap[record.recorded_by]?.full_name ?? "Staff";
  const pickupRecordedBy = record.pickup_recorded_by ? (userMap[record.pickup_recorded_by]?.full_name ?? "Staff") : null;
  return (
    <div className="rounded-[24px] bg-white px-5 py-2 shadow-[0_18px_40px_-30px_rgba(43,42,38,0.5)]">
      <Field label="Date">{formatAttendanceDate(record.date)}</Field>
      <Field label="Program">
        <span className="mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
          {cfg.label}
        </span>
      </Field>
      {status === "absent" ? (
        <Field label="Status">Marked absent</Field>
      ) : (
        <>
          <Field label="Recorded By">{recordedBy}</Field>
          {record.pickup_time ? (
            <>
              <Field label="Pickup Time">{formatPickupTime(record.pickup_time)}</Field>
              {record.picked_up_by_name ? (
                <Field label="Picked Up By">{[record.picked_up_by_name, record.picked_up_by_relationship].filter(Boolean).join(" · ")}</Field>
              ) : null}
              {pickupRecordedBy ? <Field label="Pickup Recorded By">{pickupRecordedBy}</Field> : null}
            </>
          ) : null}
        </>
      )}
      {record.notes ? <Field label="Notes">{record.notes}</Field> : null}
    </div>
  );
}

/** Hand-note line for a header: "looking it up…" / "12 days on record". */
export function attendanceNote(att: AttendanceData): string | undefined {
  if (att.status === "loading") return "looking it up…";
  if (att.status === "ready" && att.records.length) return `${att.records.length} days on record`;
  return undefined;
}

// ─── Inline composition (My Children → Attendance) ───────────────────────────
export function AttendanceHistory({ att, heading }: { att: AttendanceData; heading?: ReactNode }) {
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selected, setSelected] = useState<UnifiedAttendanceRecord | null>(null);
  const ready = att.status === "ready" && att.records.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {heading}
      {ready ? <AttendanceSummary records={att.records} /> : null}
      {ready ? <AttendanceFilters value={filter} onChange={setFilter} /> : null}
      <AttendanceList att={att} filter={filter} onSelect={setSelected} />
      <GardenSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        icon="📋"
        title="Attendance Record"
        note={selected ? formatAttendanceDate(selected.date) : undefined}
      >
        {selected ? <AttendanceRecordDetail record={selected} userMap={att.userMap} /> : null}
      </GardenSheet>
    </div>
  );
}
