"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, CalendarDays, Users, Check } from "lucide-react";
import type {
  ConferenceTeacherDisplay,
  ConferenceBookingRecord,
} from "@/app/lib/parent-teacher-conference";
import type { ConferenceStudentContext } from "@/app/lib/get-conference-teacher-assignments";
import {
  CONFERENCE_WEEKS,
  MON_THU_SLOTS,
  FRIDAY_SLOTS,
  getDaysForWeek,
  getFirstAvailableDayForTeacher,
  isConferenceDayAvailable,
  takenSlotKey,
  formatConferenceDateForDisplay,
} from "@/app/lib/parent-teacher-conference";

type ConferenceFormat = "in_person" | "virtual";

type ChildSelection = {
  teacherId: string | null;
  weekStart: string;
  dayDate: string;
  slot: string | null;
  format: ConferenceFormat;
  accommodationNote: string;
};

type Props = {
  parentId: string;
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  initialBookingsByStudent: Record<string, ConferenceBookingRecord>;
  initialTakenSlotKeys: string[];
  hideBanner?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  readOnly?: boolean;
};

export function getPtcBannerSubtext(
  conferenceStudents: ConferenceStudentContext[],
  bookingsByStudent: Record<string, ConferenceBookingRecord>,
): string {
  const hasMultipleChildren = conferenceStudents.length > 1;
  const distinctAssignedTeachers =
    new Set(
      conferenceStudents
        .map((s) => s.assignedTeacherId)
        .filter(Boolean) as string[],
    ).size > 1;
  const allChildrenBooked = conferenceStudents.every(
    (s) => bookingsByStudent[s.studentId],
  );

  if (allChildrenBooked) {
    return "All conferences scheduled · Tap to view details";
  }
  if (hasMultipleChildren && distinctAssignedTeachers) {
    return "Schedule for each child · Aug 24, Aug 31 & Sep 7";
  }
  if (hasMultipleChildren) {
    return "Schedule for each child · Tap to book";
  }
  if (bookingsByStudent[conferenceStudents[0]?.studentId ?? ""]) {
    return "Conference scheduled · Tap to view";
  }
  return "Aug 24, Aug 31 & Sep 7 weeks · Tap to book";
}

function defaultSelectionForChild(child: ConferenceStudentContext): ChildSelection {
  const weekStart = CONFERENCE_WEEKS[0].start;
  const days = getDaysForWeek(weekStart);
  return {
    teacherId: child.assignedTeacherId,
    weekStart,
    dayDate: days[0].date,
    slot: null,
    format: "in_person",
    accommodationNote: "",
  };
}

export default function ParentTeacherConferenceSection({
  parentId,
  conferenceTeachers,
  conferenceStudents,
  initialBookingsByStudent,
  initialTakenSlotKeys,
  hideBanner = false,
  open: controlledOpen,
  onOpenChange,
  readOnly = false,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [selectionsByStudent, setSelectionsByStudent] = useState<
    Record<string, ChildSelection>
  >({});
  const [bookingsByStudent, setBookingsByStudent] = useState<
    Record<string, ConferenceBookingRecord>
  >(initialBookingsByStudent);
  const [takenSlotKeys, setTakenSlotKeys] = useState<string[]>(
    initialTakenSlotKeys,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasMultipleChildren = conferenceStudents.length > 1;

  const distinctAssignedTeachers = useMemo(() => {
    const ids = conferenceStudents
      .map((s) => s.assignedTeacherId)
      .filter(Boolean) as string[];
    return new Set(ids).size > 1;
  }, [conferenceStudents]);

  const activeChild =
    conferenceStudents.find((s) => s.studentId === activeStudentId) ??
    conferenceStudents[0] ??
    null;

  const activeBooking = activeChild
    ? bookingsByStudent[activeChild.studentId]
    : null;
  const isActiveChildBooked = !!activeBooking;

  const activeSelection = activeChild
    ? (selectionsByStudent[activeChild.studentId] ??
        defaultSelectionForChild(activeChild))
    : null;

  const weekDays = activeSelection
    ? getDaysForWeek(activeSelection.weekStart)
    : getDaysForWeek(CONFERENCE_WEEKS[0].start);
  const activeDayDate =
    activeSelection?.dayDate ?? weekDays[0].date;
  const activeDay =
    weekDays.find((d) => d.date === activeDayDate) ?? weekDays[0];
  const timeSlots = activeDay.isFriday ? FRIDAY_SLOTS : [...MON_THU_SLOTS];
  const selectedTeacherId = activeSelection?.teacherId ?? null;
  const selectedSlot = activeSelection?.slot ?? null;
  const selectedWeekStart =
    activeSelection?.weekStart ?? CONFERENCE_WEEKS[0].start;
  const selectedFormat = activeSelection?.format ?? "in_person";
  const accommodationNote = activeSelection?.accommodationNote ?? "";

  function isChildBooked(studentId: string) {
    return !!bookingsByStudent[studentId];
  }

  function isSlotTaken(teacherId: string | null, date: string, slot: string) {
    if (!teacherId) return false;
    return takenSlotKeys.includes(takenSlotKey(teacherId, date, slot));
  }

  function updateActiveSelection(patch: Partial<ChildSelection>) {
    if (!activeChild || isActiveChildBooked) return;
    setSelectionsByStudent((prev) => {
      const current =
        prev[activeChild.studentId] ??
        defaultSelectionForChild(activeChild);
      const next = { ...current, ...patch };

      if (patch.teacherId !== undefined) {
        const weekStart = patch.weekStart ?? current.weekStart;
        const dayDate = patch.dayDate ?? current.dayDate;
        const weekDays = getDaysForWeek(weekStart);
        const selectedDay =
          weekDays.find((d) => d.date === dayDate) ?? weekDays[0];
        if (!isConferenceDayAvailable(patch.teacherId, selectedDay)) {
          next.dayDate = getFirstAvailableDayForTeacher(
            weekStart,
            patch.teacherId,
          );
          next.slot = null;
        }
      }

      return {
        ...prev,
        [activeChild.studentId]: next,
      };
    });
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function prepareOpen() {
    const initial: Record<string, ChildSelection> = {};
    for (const child of conferenceStudents) {
      initial[child.studentId] = defaultSelectionForChild(child);
    }
    setSelectionsByStudent(initial);
    const firstUnbooked =
      conferenceStudents.find((s) => !bookingsByStudent[s.studentId]) ??
      conferenceStudents[0];
    setActiveStudentId(firstUnbooked?.studentId ?? null);
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleOpen() {
    prepareOpen();
    setOpen(true);
  }

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (open && !prevOpenRef.current && hideBanner) {
      prepareOpen();
    }
    prevOpenRef.current = open;
  });

  function handleWeekChange(start: string) {
    updateActiveSelection({
      weekStart: start,
      dayDate: getFirstAvailableDayForTeacher(start, selectedTeacherId),
      slot: null,
    });
  }

  async function handleConfirm() {
    if (!activeChild || !activeSelection || isActiveChildBooked) return;
    if (!selectedTeacherId || !selectedSlot) {
      setSubmitError("Please select a teacher and time slot.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/parent-teacher-conference/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          studentId: activeChild.studentId,
          teacherId: selectedTeacherId,
          weekStart: selectedWeekStart,
          conferenceDate: activeDayDate,
          timeSlot: selectedSlot,
          format: selectedFormat,
          accommodationNote: accommodationNote.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const booking: ConferenceBookingRecord = {
        teacherId: selectedTeacherId,
        conferenceDate: activeDayDate,
        timeSlot: selectedSlot,
        format: selectedFormat,
        accommodationNote: accommodationNote.trim() || null,
      };

      setBookingsByStudent((prev) => ({
        ...prev,
        [activeChild.studentId]: booking,
      }));
      setTakenSlotKeys((prev) => [
        ...prev,
        takenSlotKey(selectedTeacherId, activeDayDate, selectedSlot),
      ]);

      setSuccessMessage(`Conference confirmed for ${activeChild.name}!`);

      const nextUnbooked = conferenceStudents.find(
        (s) =>
          s.studentId !== activeChild.studentId &&
          !bookingsByStudent[s.studentId],
      );
      if (nextUnbooked) {
        setTimeout(() => {
          setActiveStudentId(nextUnbooked.studentId);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const bannerSubtext = getPtcBannerSubtext(
    conferenceStudents,
    bookingsByStudent,
  );

  if (conferenceStudents.length === 0) {
    return null;
  }

  const canConfirm =
    !isActiveChildBooked &&
    selectedTeacherId &&
    selectedSlot &&
    !submitting;

  return (
    <>
      {!hideBanner && (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full text-left rounded-2xl bg-gradient-to-br from-[#4a7c59] to-[#5b4d8a] px-4 py-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3 border border-[#4a7c59]/20"
        >
          <span className="text-xl shrink-0">📅</span>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-bold text-white leading-snug">
              Schedule your parent-teacher conference
            </span>
            <span className="text-xs text-white/80">{bannerSubtext}</span>
          </div>
          <ChevronRight size={16} className="text-white/70 shrink-0" />
        </button>
      )}

      <AnimatePresence>
        {open && activeChild && activeSelection && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[480px] bg-white shadow-2xl flex flex-col [&_button:not(:disabled)]:cursor-pointer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#4a7c59]" />
                  <span className="text-sm font-semibold text-gray-800 font-heading">
                    Parent-Teacher Conference
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {hasMultipleChildren ? (
                <div className="shrink-0 px-5 pt-4 pb-2 border-b border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 font-body mb-2">
                    Select child
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {conferenceStudents.map((child) => {
                      const booked = isChildBooked(child.studentId);
                      return (
                        <button
                          key={child.studentId}
                          type="button"
                          onClick={() => {
                            setActiveStudentId(child.studentId);
                            setSubmitError(null);
                            setSuccessMessage(null);
                          }}
                          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold font-body transition-colors border-2 flex items-center gap-1.5 ${
                            activeStudentId === child.studentId
                              ? "bg-[#4a7c59] text-white border-[#4a7c59]"
                              : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          {child.name}
                          {booked && (
                            <Check
                              size={12}
                              className={
                                activeStudentId === child.studentId
                                  ? "text-white"
                                  : "text-[#4a7c59]"
                              }
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {distinctAssignedTeachers && (
                    <p className="text-xs text-amber-700 font-body mt-2 leading-relaxed">
                      Your children have different teachers — book one session
                      per child.
                    </p>
                  )}
                </div>
              ) : (
                <div className="shrink-0 px-5 pt-4 pb-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-body">
                    Scheduling for{" "}
                    <span className="font-semibold text-gray-700">
                      {activeChild.name}
                    </span>
                    {isActiveChildBooked && (
                      <span className="ml-2 text-[#4a7c59] font-semibold">
                        · Booked
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="overflow-y-auto flex-1 px-5 py-6 flex flex-col gap-6">
                {isActiveChildBooked && activeBooking ? (
                  <div className="rounded-xl bg-[#4a7c59]/8 border border-[#4a7c59]/20 px-4 py-4 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-800 font-heading">
                      Conference confirmed for {activeChild.name}
                    </p>
                    <p className="text-xs text-gray-600 font-body">
                      <span className="font-semibold">Teacher:</span>{" "}
                      {conferenceTeachers.find(
                        (t) => t.id === activeBooking.teacherId,
                      )?.name ?? "Your teacher"}
                    </p>
                    <p className="text-xs text-gray-600 font-body">
                      <span className="font-semibold">When:</span>{" "}
                      {formatConferenceDateForDisplay(
                        activeBooking.conferenceDate,
                      )}{" "}
                      · {activeBooking.timeSlot}
                    </p>
                    <p className="text-xs text-gray-600 font-body">
                      <span className="font-semibold">Format:</span>{" "}
                      {activeBooking.format === "in_person"
                        ? "In person at Sage Field"
                        : "Virtual"}
                    </p>
                    {activeBooking.accommodationNote && (
                      <p className="text-xs text-gray-600 font-body">
                        <span className="font-semibold">Note:</span>{" "}
                        {activeBooking.accommodationNote}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-body mt-1">
                      A confirmation email has been sent. Contact us if you need
                      to make a change.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-[#4a7c59]/8 border border-[#4a7c59]/15 px-4 py-3">
                      <p className="text-xs font-body text-gray-600 leading-relaxed">
                        Conferences are available the weeks of{" "}
                        <span className="font-semibold text-gray-800">
                          August 24, August 31, and September 7
                        </span>
                        . Each child needs their own conference
                        {hasMultipleChildren
                          ? " — use the tabs above to schedule separately for each child."
                          : "."}
                      </p>
                    </div>

                    <section className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-800 font-heading">
                          Choose teacher for {activeChild.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {conferenceTeachers.map((teacher) => {
                          const isAssigned =
                            teacher.id === activeChild.assignedTeacherId;
                          const isSelected = selectedTeacherId === teacher.id;
                          const imageSrc =
                            teacher.profileImageUrl ?? teacher.image;
                          return (
                            <button
                              key={teacher.id}
                              type="button"
                              onClick={() =>
                                updateActiveSelection({ teacherId: teacher.id })
                              }
                              className={`shrink-0 w-[152px] rounded-2xl border overflow-hidden flex flex-col transition-all ${
                                isSelected
                                  ? "border-[#4a7c59] ring-2 ring-[#4a7c59]/30 shadow-md"
                                  : "border-gray-100 hover:border-gray-200"
                              } ${selectedTeacherId && !isSelected ? "opacity-60" : ""}`}
                            >
                              <div className="relative h-32 w-full bg-gray-100">
                                <img
                                  src={imageSrc}
                                  alt={teacher.name}
                                  className="w-full h-full object-cover object-top"
                                />
                                {isAssigned && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4a7c59] text-white shadow-sm">
                                    Your Teacher
                                  </span>
                                )}
                              </div>
                              <div className="p-2.5 text-left bg-white">
                                <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
                                  {teacher.name}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                                  {teacher.gradeBand}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold text-gray-800 font-heading">
                        Choose a week
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {CONFERENCE_WEEKS.map((week) => (
                          <button
                            key={week.start}
                            type="button"
                            onClick={() => handleWeekChange(week.start)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-body transition-colors ${
                              selectedWeekStart === week.start
                                ? "bg-[#4a7c59] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {week.label}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold text-gray-800 font-heading">
                        Choose a day
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => {
                          const dayAvailable = isConferenceDayAvailable(
                            selectedTeacherId,
                            day,
                          );
                          return (
                          <button
                            key={day.date}
                            type="button"
                            disabled={!dayAvailable}
                            onClick={() =>
                              updateActiveSelection({
                                dayDate: day.date,
                                slot: null,
                              })
                            }
                            className={`px-3 py-2 rounded-xl text-xs font-semibold font-body transition-colors ${
                              !dayAvailable
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : activeDayDate === day.date
                                ? "bg-[#4a7c59] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {day.label}
                          </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 font-heading">
                          Choose a time
                        </h3>
                        <p className="text-xs text-gray-400 font-body mt-0.5">
                          {activeDay.isFriday
                            ? "Friday · 30-minute blocks, 8:30am – 3:00pm"
                            : "Mon – Thu · Afternoon blocks"}
                        </p>
                      </div>
                      <div
                        className={`grid gap-2 ${
                          activeDay.isFriday
                            ? "grid-cols-2 sm:grid-cols-3"
                            : "grid-cols-1"
                        }`}
                      >
                        {timeSlots.map((slot) => {
                          const taken = isSlotTaken(
                            selectedTeacherId,
                            activeDayDate,
                            slot,
                          );
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={taken || !selectedTeacherId}
                              onClick={() => updateActiveSelection({ slot })}
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold font-body text-left transition-colors ${
                                taken
                                  ? "bg-gray-100 border border-gray-100 text-gray-400 cursor-not-allowed"
                                  : selectedSlot === slot
                                    ? "bg-[#4a7c59] text-white"
                                    : "bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {taken ? `${slot} · Booked` : slot}
                            </button>
                          );
                        })}
                      </div>
                      {!selectedTeacherId && (
                        <p className="text-xs text-gray-400 font-body">
                          Select a teacher to see available times.
                        </p>
                      )}
                    </section>

                    <section className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold text-gray-800 font-heading">
                        Conference format
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveSelection({ format: "in_person" })
                          }
                          className={`px-3.5 py-2.5 rounded-xl text-left transition-colors border ${
                            selectedFormat === "in_person"
                              ? "bg-[#4a7c59] text-white border-[#4a7c59]"
                              : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="text-xs font-semibold font-body block">
                            In person
                          </span>
                          <span
                            className={`text-[10px] font-body block mt-0.5 ${
                              selectedFormat === "in_person"
                                ? "text-white/80"
                                : "text-gray-400"
                            }`}
                          >
                            At Sage Field
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveSelection({ format: "virtual" })
                          }
                          className={`px-3.5 py-2.5 rounded-xl text-left transition-colors border ${
                            selectedFormat === "virtual"
                              ? "bg-[#4a7c59] text-white border-[#4a7c59]"
                              : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="text-xs font-semibold font-body block">
                            Virtual
                          </span>
                          <span
                            className={`text-[10px] font-body block mt-0.5 ${
                              selectedFormat === "virtual"
                                ? "text-white/80"
                                : "text-gray-400"
                            }`}
                          >
                            Video call
                          </span>
                        </button>
                      </div>
                    </section>

                    <section className="flex flex-col gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 font-heading">
                          Need a different time?
                        </h3>
                        <p className="text-xs text-gray-500 font-body mt-1 leading-relaxed">
                          If none of these times work for you, let us know here
                          so we can best accommodate you and find a time that
                          works.
                        </p>
                      </div>
                      <textarea
                        rows={3}
                        value={accommodationNote}
                        onChange={(e) =>
                          updateActiveSelection({
                            accommodationNote: e.target.value,
                          })
                        }
                        placeholder="e.g. We need an earlier morning slot…"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-body text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] resize-none"
                      />
                    </section>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex flex-col gap-2 bg-white">
                {!isActiveChildBooked && readOnly && (
                  <p className="text-center text-xs text-gray-500 font-body leading-relaxed">
                    Admin preview — read only. Parents book from their own
                    account.
                  </p>
                )}
                {!isActiveChildBooked && !readOnly && (
                  <>
                    <button
                      type="button"
                      disabled={!canConfirm}
                      onClick={handleConfirm}
                      className={`w-full py-3 rounded-xl text-sm font-semibold font-body transition-colors ${
                        canConfirm
                          ? "bg-[#4a7c59] text-white hover:bg-[#3d6849]"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {submitting
                        ? "Confirming…"
                        : `Confirm conference for ${activeChild.name}`}
                    </button>
                    {submitError && (
                      <p className="text-center text-xs text-red-600 font-body">
                        {submitError}
                      </p>
                    )}
                    {successMessage && (
                      <p className="text-center text-xs text-[#4a7c59] font-semibold font-body">
                        {successMessage}
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
