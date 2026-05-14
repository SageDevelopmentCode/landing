"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, Loader2, Home, ChevronDown, Clock, X, Car } from "lucide-react";
import {
  getSummerStudentsForWeek,
  upsertSummerAttendanceRecord,
  removeSummerAttendanceRecord,
  recordSummerPickup,
  getPickupPersonsForStudent,
} from "@/app/actions/summerAttendance";
import type { SummerStudentRow, SummerDayData, PickupPerson } from "@/app/actions/summerAttendance";

interface Props {
  initialWeekData: SummerDayData[];
  initialWeekNum: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Week 1 anchor = Monday May 25, 2026
const SUMMER_WEEK1_MONDAY = new Date(2026, 4, 25);
const TOTAL_WEEKS = 12;

function weekNumToMonday(weekNum: number): string {
  const d = new Date(SUMMER_WEEK1_MONDAY);
  d.setDate(d.getDate() + (weekNum - 1) * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${MONTH_NAMES[date.getMonth()]} ${d}`;
}

function formatWeekRange(weekNum: number): string {
  const monday = weekNumToMonday(weekNum);
  const [y, m, d] = monday.split("-").map(Number);
  const fri = new Date(y, m - 1, d + 4);
  const monDate = new Date(y, m - 1, d);
  return `${MONTH_NAMES[monDate.getMonth()]} ${monDate.getDate()} – ${MONTH_NAMES[fri.getMonth()]} ${fri.getDate()}`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "#d97706", "#b45309", "#f59e0b", "#d97706", "#92400e",
  "#e97a10", "#c96000", "#f0a030", "#a85200", "#e08020",
];

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) & 0xfffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getTimeSlots(): string[] {
  const now = new Date();
  const slots: string[] = [];
  const end = now.getHours() * 60 + now.getMinutes();
  for (let t = 0; t <= end; t += 5) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots.reverse();
}

function fmt12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function SummerPageClient({ initialWeekData, initialWeekNum }: Props) {
  const [weekNum, setWeekNum] = useState(initialWeekNum);
  const [weekData, setWeekData] = useState<SummerDayData[]>(initialWeekData);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [openPickupPanel, setOpenPickupPanel] = useState<string | null>(null);
  const [pickupPersons, setPickupPersons] = useState<PickupPerson[]>([]);
  const [pickupPersonsLoading, setPickupPersonsLoading] = useState(false);
  const [selectedPickupPerson, setSelectedPickupPerson] = useState<PickupPerson | null>(null);
  const [pickupTime, setPickupTime] = useState<string>("");
  const [pickupSaving, setPickupSaving] = useState(false);
  const [openPickupTimePicker, setOpenPickupTimePicker] = useState(false);

  function addSaving(id: string) {
    setSavingIds((prev) => new Set(prev).add(id));
  }

  function removeSaving(id: string) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleOpenPickup(studentId: string) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    setPickupTime(`${h}:${m}`);
    setSelectedPickupPerson(null);
    setOpenPickupTimePicker(false);
    setOpenPickupPanel(studentId);
    setPickupPersonsLoading(true);
    const persons = await getPickupPersonsForStudent(studentId);
    setPickupPersons(persons);
    if (persons.length === 1) setSelectedPickupPerson(persons[0]);
    setPickupPersonsLoading(false);
  }

  async function handleConfirmPickup(studentId: string, date: string) {
    console.log('[handleConfirmPickup] called', { studentId, date, selectedPickupPerson, pickupTime })
    if (!selectedPickupPerson || !pickupTime) {
      console.warn('[handleConfirmPickup] bailing early — missing person or time')
      return
    }
    setPickupSaving(true);
    const record = await recordSummerPickup(
      studentId, date, pickupTime,
      selectedPickupPerson.name, selectedPickupPerson.relationship,
    );
    if (record) updateWeekDataRecord(date, studentId, record);
    setPickupSaving(false);
    setOpenPickupPanel(null);
    setOpenPickupTimePicker(false);
  }

  function updateWeekDataRecord(
    date: string,
    studentId: string,
    record: SummerStudentRow["record"]
  ) {
    setWeekData((prev) =>
      prev.map((day) => {
        if (day.date !== date) return day;
        return {
          ...day,
          students: day.students.map((s) =>
            s.student_id !== studentId ? s : { ...s, record }
          ),
        };
      })
    );
  }

  async function handleToggle(studentId: string, date: string, row: SummerStudentRow) {
    addSaving(studentId);
    if (row.record) {
      await removeSummerAttendanceRecord(row.record.id);
      updateWeekDataRecord(date, studentId, null);
    } else {
      const record = await upsertSummerAttendanceRecord(studentId, date, row.hasEnrollment);
      updateWeekDataRecord(date, studentId, record);
    }
    removeSaving(studentId);
  }

  async function handleWeekChange(newWeekNum: number) {
    if (newWeekNum < 1 || newWeekNum > TOTAL_WEEKS) return;
    setLoadingWeek(true);
    setWeekNum(newWeekNum);
    setViewMode("week");
    setSelectedDate(null);
    const monday = weekNumToMonday(newWeekNum);
    const data = await getSummerStudentsForWeek(monday);
    setWeekData(data);
    setLoadingWeek(false);
  }

  function handleDrillDown(date: string) {
    setSelectedDate(date);
    setViewMode("day");
  }

  const dayDetail = viewMode === "day" && selectedDate
    ? weekData.find((d) => d.date === selectedDate) ?? null
    : null;

  const filteredDayStudents = dayDetail
    ? (search.trim()
        ? dayDetail.students.filter((s) =>
            s.name?.toLowerCase().includes(search.toLowerCase())
          )
        : dayDetail.students
      ).slice().sort((a, b) => {
        const groupA = a.record !== null ? 0 : a.hasEnrollment ? 1 : 2
        const groupB = b.record !== null ? 0 : b.hasEnrollment ? 1 : 2
        if (groupA !== groupB) return groupA - groupB
        return (a.name ?? "").localeCompare(b.name ?? "")
      })
    : [];

  const totalExpectedThisWeek = new Set(
    weekData.flatMap((d) => d.students.filter((s) => s.hasEnrollment).map((s) => s.student_id))
  ).size;

  const dayDetailExpected = dayDetail?.students.filter((s) => s.hasEnrollment).length ?? 0;
  const dayDetailPresent = dayDetail?.students.filter((s) => s.record !== null).length ?? 0;

  return (
    <div className="flex-1 flex flex-col px-6 pt-6 pb-6 w-full min-h-0 overflow-hidden">
      {/* Header + nav bar */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#d97706]">Summer 2026 Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === "week"
              ? `Week ${weekNum} of ${TOTAL_WEEKS} · ${totalExpectedThisWeek} student${totalExpectedThisWeek !== 1 ? "s" : ""}`
              : `${dayDetailExpected} expected · ${dayDetailPresent} present`}
          </p>
        </div>
      </div>

      {/* Nav bar */}
      <div className="flex items-center gap-2 mb-6">
        {viewMode === "day" && selectedDate && (
          <button
            onClick={() => { setViewMode("week"); setSelectedDate(null); }}
            className="text-xs font-medium text-[#d97706] border border-[#d97706]/30 bg-[#d97706]/5 hover:bg-[#d97706]/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Week overview
          </button>
        )}

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706]/20 transition-colors w-48"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg px-1 py-1 border border-gray-200 bg-white">
          <button
            onClick={() => handleWeekChange(weekNum - 1)}
            disabled={loadingWeek || weekNum <= 1}
            className="p-1 rounded transition-colors disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs font-semibold text-gray-800 px-2 min-w-[140px] text-center">
            Week {weekNum} — {formatWeekRange(weekNum)}
          </span>
          <button
            onClick={() => handleWeekChange(weekNum + 1)}
            disabled={loadingWeek || weekNum >= TOTAL_WEEKS}
            className="p-1 rounded transition-colors disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Week view: flat 5-column grid */}
      {viewMode === "week" && (
        <div className="grid grid-cols-5 divide-x divide-gray-100 border-t border-gray-100">
          {loadingWeek
            ? DAY_LABELS.map((label) => (
                <div key={label} className="px-4 py-4">
                  <div className="h-5 bg-gray-200 rounded w-12 mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-16 mb-3 animate-pulse" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ))
            : weekData.map((day, colIdx) => {
                const filtered = (search.trim()
                  ? day.students.filter((s) =>
                      s.name?.toLowerCase().includes(search.toLowerCase())
                    )
                  : day.students
                ).slice().sort((a, b) => {
                  const groupA = a.record !== null ? 0 : a.hasEnrollment ? 1 : 2
                  const groupB = b.record !== null ? 0 : b.hasEnrollment ? 1 : 2
                  if (groupA !== groupB) return groupA - groupB
                  return (a.name ?? "").localeCompare(b.name ?? "")
                });
                const expectedCount = day.students.filter((s) => s.hasEnrollment).length;
                const presentCount = day.students.filter((s) => s.record !== null).length;
                const isToday =
                  day.date ===
                  (() => {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, "0");
                    const d = String(now.getDate()).padStart(2, "0");
                    return `${y}-${m}-${d}`;
                  })();

                return (
                  <div key={day.date} className="flex flex-col">
                    {/* Day column header */}
                    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-bold text-gray-800">
                          {DAY_LABELS[colIdx]}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-medium text-[#d97706] bg-[#d97706]/10 px-1.5 py-0.5 rounded-full leading-tight">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatShortDate(day.date)}</p>
                      <p className="text-xs mt-1.5">
                        <span className="text-gray-500">{expectedCount} expected</span>
                        {" · "}
                        <span className={presentCount > 0 ? "text-[#d97706] font-semibold" : "text-gray-400"}>
                          {presentCount} present
                        </span>
                      </p>
                    </div>

                    {/* Student list */}
                    <div className="divide-y divide-gray-50">
                      {filtered.length === 0 && (
                        <p className="text-xs text-gray-300 text-center py-6 px-3">
                          {search.trim() ? "No match" : "No students"}
                        </p>
                      )}
                      {filtered.map((row) => {
                        const isSaving = savingIds.has(row.student_id);
                        const isChecked = row.record !== null;
                        return (
                          <div
                            key={row.student_id}
                            className="flex items-center gap-2.5 px-4 py-2.5"
                            style={row.hasEnrollment ? { backgroundColor: 'rgba(74,124,89,0.05)' } : undefined}
                          >
                            {row.profile_image_url ? (
                              <img
                                src={row.profile_image_url}
                                alt={row.name ?? ""}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                style={{ backgroundColor: avatarColor(row.student_id) }}
                              >
                                {getInitials(row.name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate min-w-0">
                                  {row.name ?? "—"}
                                </p>
                                {row.isHomeschool && (
                                  <span title="Homeschool drop-in" className="flex-shrink-0">
                                    <Home className="w-3 h-3 text-[#4a7c59]" />
                                  </span>
                                )}
                              </div>
                              {row.hasEnrollment ? (
                                <span className="text-[10px] text-[#d97706]">Paid</span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Unpaid</span>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center gap-1">
                              {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin text-[#d97706]" />
                              ) : (
                                <button
                                  onClick={() => { if (!row.record?.pickup_time) handleToggle(row.student_id, day.date, row) }}
                                  disabled={!!row.record?.pickup_time}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border-2 ${
                                    isChecked
                                      ? "bg-[#d97706] border-[#d97706]"
                                      : "bg-transparent border-gray-300 hover:border-[#d97706]"
                                  } ${row.record?.pickup_time ? "opacity-60 cursor-not-allowed" : ""}`}
                                  aria-label={isChecked ? "Remove attendance" : "Mark present"}
                                >
                                  {isChecked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                    </svg>
                                  )}
                                </button>
                              )}
                              {row.record?.pickup_time && (
                                <span title={`Picked up at ${fmt12h(row.record.pickup_time)}`}>
                                  <Car className="w-3 h-3 text-blue-400" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleDrillDown(day.date)}
                      className="px-4 py-2 text-xs text-gray-400 hover:text-[#d97706] border-t border-gray-100 text-left mt-auto transition-colors"
                    >
                      View full day →
                    </button>
                  </div>
                );
              })}
        </div>
      )}

      {/* Day detail view */}
      {viewMode === "day" && dayDetail && (
        <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_100px_110px_180px] gap-4 px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Student</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Present</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Status</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Paid</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Pickup</span>
          </div>

          {filteredDayStudents.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              {search.trim() ? `No students match "${search}".` : "No students enrolled for this day."}
            </div>
          )}

          {filteredDayStudents.length > 0 && (
            <div className="divide-y divide-gray-100">
              {filteredDayStudents.map((row) => {
                const isSaving = savingIds.has(row.student_id);
                const isChecked = row.record !== null;
                return (
                  <div
                    key={row.student_id}
                    className="grid grid-cols-[1fr_120px_100px_110px_180px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50 transition-colors"
                    style={row.hasEnrollment ? { backgroundColor: 'rgba(74,124,89,0.05)' } : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {row.profile_image_url ? (
                        <img
                          src={row.profile_image_url}
                          alt={row.name ?? ""}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: avatarColor(row.student_id) }}
                        >
                          {getInitials(row.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{row.name ?? "—"}</p>
                          {row.isHomeschool && (
                            <span title="Homeschool drop-in" className="flex-shrink-0">
                              <Home className="w-3.5 h-3.5 text-[#4a7c59]" />
                            </span>
                          )}
                        </div>
                        {row.grade && <p className="text-xs text-gray-400 truncate">{row.grade}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#d97706]" />
                      ) : (
                        <button
                          onClick={() => { if (!row.record?.pickup_time) handleToggle(row.student_id, dayDetail.date, row) }}
                          disabled={!!row.record?.pickup_time}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border-2 ${
                            isChecked
                              ? "bg-[#d97706] border-[#d97706]"
                              : "bg-transparent border-gray-300 hover:border-[#d97706]"
                          } ${row.record?.pickup_time ? "opacity-60 cursor-not-allowed" : ""}`}
                          aria-label={isChecked ? "Remove from attendance" : "Mark present"}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-center">
                      {isSaving ? (
                        <span className="text-xs text-gray-400">Saving…</span>
                      ) : row.record?.pickup_time ? (
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                          Picked Up
                        </span>
                      ) : isChecked ? (
                        <span className="text-xs font-medium text-[#d97706] bg-[#d97706]/10 px-2.5 py-1 rounded-full">
                          Present
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>

                    <div className="flex items-center justify-center">
                      {row.hasEnrollment ? (
                        <span className="text-xs font-medium text-[#d97706] bg-[#d97706]/10 px-2.5 py-1 rounded-full">
                          Paid
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          Not paid
                        </span>
                      )}
                    </div>

                    {/* Pickup column */}
                    <div className="flex items-center justify-center relative">
                      {!isChecked ? (
                        <span className="text-xs text-gray-200">—</span>
                      ) : row.record?.pickup_time ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-semibold text-[#d97706]">
                            {fmt12h(row.record.pickup_time)}
                          </span>
                          {row.record.picked_up_by_name && (
                            <span className="text-[10px] text-gray-500 truncate max-w-[160px]">
                              {row.record.picked_up_by_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenPickup(row.student_id)}
                          disabled={isSaving}
                          className="text-xs font-medium text-white bg-[#d97706] hover:bg-[#b45309] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          Pickup
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pickup modal */}
      {openPickupPanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpenPickupPanel(null);
              setOpenPickupTimePicker(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-5 w-96 mx-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-800">Who picked up?</span>
              <button
                onClick={() => { setOpenPickupPanel(null); setOpenPickupTimePicker(false); }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {pickupPersonsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#d97706]" />
              </div>
            ) : pickupPersons.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">No authorized persons on file.</p>
            ) : (
              <div className="flex flex-col gap-1 mb-4 max-h-48 overflow-y-auto">
                {pickupPersons.map((person) => (
                  <button
                    key={person.name}
                    onClick={() => setSelectedPickupPerson(person)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-3 ${
                      selectedPickupPerson?.name === person.name
                        ? "bg-[#d97706] text-white"
                        : "text-gray-700 hover:bg-[#d97706]/10"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedPickupPerson?.name === person.name
                        ? "border-white bg-white"
                        : "border-gray-300"
                    }`}>
                      {selectedPickupPerson?.name === person.name && (
                        <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                      )}
                    </span>
                    <span>
                      <span className="font-medium">{person.name}</span>
                      <span className={`ml-1.5 text-xs ${selectedPickupPerson?.name === person.name ? "text-white/80" : "text-gray-400"}`}>
                        ({person.relationship})
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative mb-4 overflow-visible">
              <button
                onClick={() => setOpenPickupTimePicker((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {pickupTime ? fmt12h(pickupTime) : "Select time"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {openPickupTimePicker && (
                <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="max-h-40 overflow-y-auto">
                    {getTimeSlots().map((slot) => (
                      <button
                        key={slot}
                        onClick={() => { setPickupTime(slot); setOpenPickupTimePicker(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          pickupTime === slot
                            ? "bg-[#d97706] text-white"
                            : "text-gray-700 hover:bg-[#d97706]/10"
                        }`}
                      >
                        {fmt12h(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={!selectedPickupPerson || !pickupTime || pickupSaving}
              onClick={() => {
                if (selectedDate && openPickupPanel) {
                  handleConfirmPickup(openPickupPanel, selectedDate);
                }
              }}
              className="w-full px-4 py-2.5 bg-[#d97706] text-white text-sm font-semibold rounded-xl hover:bg-[#b45309] disabled:opacity-40 transition-colors"
            >
              {pickupSaving ? "Saving…" : "Confirm Pickup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
