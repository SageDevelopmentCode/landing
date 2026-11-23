"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, Ticket } from "lucide-react";
import { useToast } from "@/app/_garden/toast";
import GardenSheet from "@/app/parent/_garden/sheet";
import { CheckIcon, Spinner, StepLabel, btnSheetPrimary } from "@/app/parent/_garden/ui";
import { celebrate } from "@/app/parent/_garden/feedback";
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
  /** Called after a booking succeeds (Home refreshes its tickets). */
  onBooked?: () => void;
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
  onBooked,
}: Props) {
  const toast = useToast();
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

  function isSlotTaken(date: string, slot: string) {
    return takenSlotKeys.includes(takenSlotKey(date, slot));
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
        const message = data.error ?? "Something went wrong. Please try again.";
        setSubmitError(message);
        toast.show({ tone: "error", title: "Conference not booked", message });
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
        takenSlotKey(activeDayDate, selectedSlot),
      ]);

      setSuccessMessage(`Conference confirmed for ${activeChild.name}!`);
      toast.show({
        tone: "success",
        title: `Conference confirmed for ${activeChild.name}!`,
        message: `${formatConferenceDateForDisplay(activeDayDate)} · ${selectedSlot}`,
      });
      void celebrate();
      onBooked?.();

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
      toast.show({
        tone: "error",
        title: "Conference not booked",
        message: "Please check your connection and try again.",
        action: { label: "Try again", onClick: () => void handleConfirm() },
      });
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

  const selectedTeacher = conferenceTeachers.find((t) => t.id === selectedTeacherId) ?? null;
  const bookedCount = conferenceStudents.filter((s) => isChildBooked(s.studentId)).length;
  const doneSteps = [!!selectedTeacherId, true, true, !!selectedSlot, true];

  const chip = (active: boolean, disabled = false) =>
    `min-h-11 rounded-2xl px-3.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
      disabled
        ? "cursor-not-allowed bg-[var(--sf-ink)]/[0.05] text-[var(--sf-soft)]/60 line-through decoration-2"
        : active
          ? "bg-[var(--sf-ink)] text-white shadow-[0_3px_0_0_#000] cursor-pointer"
          : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/30 cursor-pointer"
    }`;

  const childTabs = hasMultipleChildren ? (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Children">
        {conferenceStudents.map((child) => {
          const booked = isChildBooked(child.studentId);
          const active = activeStudentId === child.studentId;
          return (
            <button
              key={child.studentId}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveStudentId(child.studentId);
                setSubmitError(null);
                setSuccessMessage(null);
              }}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                active ? "bg-[var(--sf-ink)] text-white" : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:ring-[var(--sf-ink)]/30"
              }`}
            >
              {child.name}
              {booked ? (
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" : "bg-[var(--sf-sage)] text-white"}`}>
                  <CheckIcon className="h-3 w-3" />
                  <span className="sr-only">booked</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {distinctAssignedTeachers ? (
        <p className="sf-hand mt-1.5 text-base leading-tight text-[var(--sf-coral-deep)]">
          Your children have different teachers — book one session per child.
        </p>
      ) : null}
    </div>
  ) : null;

  const footer =
    isActiveChildBooked ? undefined : readOnly ? (
      <p className="text-center text-sm font-bold leading-relaxed text-[var(--sf-soft)]">
        Admin preview — read only. Parents book from their own account.
      </p>
    ) : (
      <div className="flex flex-col gap-3">
        <div className="sf-ticket flex items-center gap-3 rounded-2xl bg-[var(--sf-butter)]/70 px-7 py-2.5">
          <Ticket className="h-5 w-5 shrink-0 text-[#7a5b00]" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-xs font-bold leading-snug text-[#5c4400]">
            {selectedTeacher && selectedSlot ? (
              <>
                <span className="block truncate font-extrabold">
                  {activeChild.name} with {selectedTeacher.name}
                </span>
                {activeDay.label} · {selectedSlot} · {selectedFormat === "in_person" ? "In person" : "Virtual"}
              </>
            ) : (
              <span className="sf-hand text-base font-normal">
                {selectedTeacher ? "now pick a time ↑" : "pick a teacher to get started ↑"}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={btnSheetPrimary}
        >
          {submitting ? (
            <>
              <Spinner /> Confirming…
            </>
          ) : (
            `Confirm conference for ${activeChild.name}`
          )}
        </button>
        {submitError ? (
          <p className="text-center text-sm font-extrabold text-[var(--sf-coral-deep)]" role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    );

  return (
    <>
      {!hideBanner && (
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full items-center gap-3 rounded-[28px] bg-[var(--sf-lav)]/80 px-5 py-4 text-left transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
        >
          <span className="text-2xl shrink-0" aria-hidden="true">📅</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-extrabold leading-snug">Schedule your parent-teacher conference</span>
            <span className="text-sm font-bold text-[#6b3f86]">{bannerSubtext}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[#6b3f86]" aria-hidden="true" />
        </button>
      )}

      <GardenSheet
        open={open && !!activeChild && !!activeSelection}
        onClose={() => setOpen(false)}
        icon="🍎"
        title="Parent-Teacher Conference"
        note={
          hasMultipleChildren
            ? `${bookedCount} of ${conferenceStudents.length} booked`
            : isActiveChildBooked
              ? `${activeChild.name} · booked ✓`
              : `scheduling for ${activeChild.name}`
        }
        toolbar={childTabs}
        footer={footer}
      >
        {isActiveChildBooked && activeBooking ? (
          <div className="flex flex-col gap-4">
            <div className="sf-ticket rounded-[24px] bg-[var(--sf-mint)] px-8 py-5">
              <p className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">you&apos;re all set ✓</p>
              <p className="sf-display mt-1.5 text-2xl leading-tight">Conference confirmed for {activeChild.name}</p>
              <dl className="mt-3 grid gap-1.5 text-sm">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-extrabold">Teacher</dt>
                  <dd className="font-bold text-[var(--sf-soft)]">
                    {conferenceTeachers.find((t) => t.id === activeBooking.teacherId)?.name ?? "Your teacher"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-extrabold">When</dt>
                  <dd className="font-bold text-[var(--sf-soft)]">
                    {formatConferenceDateForDisplay(activeBooking.conferenceDate)} · {activeBooking.timeSlot}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-extrabold">Format</dt>
                  <dd className="font-bold text-[var(--sf-soft)]">
                    {activeBooking.format === "in_person" ? "In person at Sage Field" : "Virtual"}
                  </dd>
                </div>
                {activeBooking.accommodationNote ? (
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 font-extrabold">Note</dt>
                    <dd className="font-bold text-[var(--sf-soft)]">{activeBooking.accommodationNote}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <p className="text-sm leading-relaxed text-[var(--sf-soft)]">
              A confirmation email has been sent. Contact us if you need to make a change.
            </p>
            {successMessage ? (
              <p className="text-center text-sm font-extrabold text-[var(--sf-sage-deep)]" aria-live="polite">
                {successMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            <div className="rounded-[22px] bg-[var(--sf-sky)]/70 px-4 py-3.5">
              <p className="text-sm leading-relaxed text-[#24496b]">
                Conferences are available the weeks of{" "}
                <span className="font-extrabold">August 24, August 31, and September 7</span>. Each child needs their own
                conference
                {hasMultipleChildren ? " — use the tabs above to schedule separately for each child." : "."}
              </p>
            </div>

            <section>
              <StepLabel n={1} done={doneSteps[0]}>
                Choose teacher for {activeChild.name}
              </StepLabel>
              <div className="grid grid-cols-2 gap-3">
                {conferenceTeachers.map((teacher) => {
                  const isAssigned = teacher.id === activeChild.assignedTeacherId;
                  const isSelected = selectedTeacherId === teacher.id;
                  const imageSrc = teacher.profileImageUrl ?? teacher.image;
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => updateActiveSelection({ teacherId: teacher.id })}
                      className={`sf-polaroid relative flex flex-col text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                        isSelected ? "ring-[3px] ring-[var(--sf-sage)]" : selectedTeacherId ? "opacity-65 hover:opacity-100" : "hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="relative h-32 w-full overflow-hidden rounded-[3px] bg-[var(--sf-mint)]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- teacher photos come from storage or /assets */}
                        <img src={imageSrc} alt={teacher.name} className="h-full w-full object-cover object-top" />
                        {isAssigned ? (
                          <span className="absolute left-2 top-2 rounded-full bg-[var(--sf-butter)] px-2 py-0.5 text-[10px] font-extrabold text-[#5c4400] shadow-sm">
                            Your Teacher
                          </span>
                        ) : null}
                        {isSelected ? (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white shadow">
                            <CheckIcon className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate px-0.5 text-sm font-extrabold leading-tight">{teacher.name}</p>
                      <p className="px-0.5 text-xs font-bold text-[var(--sf-soft)]">{teacher.gradeBand}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <StepLabel n={2} done={doneSteps[1]}>
                Choose a week
              </StepLabel>
              <div className="flex flex-wrap gap-2">
                {CONFERENCE_WEEKS.map((week) => (
                  <button
                    key={week.start}
                    type="button"
                    aria-pressed={selectedWeekStart === week.start}
                    onClick={() => handleWeekChange(week.start)}
                    className={chip(selectedWeekStart === week.start)}
                  >
                    {week.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <StepLabel n={3} done={doneSteps[2]}>
                Choose a day
              </StepLabel>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const dayAvailable = isConferenceDayAvailable(selectedTeacherId, day);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={!dayAvailable}
                      aria-pressed={activeDayDate === day.date}
                      title={dayAvailable ? undefined : "Not available for this teacher"}
                      onClick={() => updateActiveSelection({ dayDate: day.date, slot: null })}
                      className={chip(activeDayDate === day.date, !dayAvailable)}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <StepLabel n={4} done={doneSteps[3]}>
                Choose a time
              </StepLabel>
              <p className="-mt-1.5 mb-3 text-xs font-bold text-[var(--sf-soft)]">
                {activeDay.isFriday ? "Friday · Afternoon blocks, 2:10pm – 3:20pm" : "Mon – Thu · Afternoon blocks, 3:10pm – 4:20pm"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Time slot">
                {timeSlots.map((slot) => {
                  const taken = isSlotTaken(activeDayDate, slot);
                  const active = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={taken || !selectedTeacherId}
                      onClick={() => updateActiveSelection({ slot })}
                      className={`flex min-h-12 items-center gap-2 rounded-2xl border-2 border-dashed px-4 text-left text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
                        taken
                          ? "cursor-not-allowed border-transparent bg-[var(--sf-ink)]/[0.05] text-[var(--sf-soft)]/60"
                          : !selectedTeacherId
                            ? "cursor-not-allowed border-[var(--sf-ink)]/10 bg-white/60 text-[var(--sf-soft)]/60"
                            : active
                              ? "border-[var(--sf-ink)] bg-[var(--sf-ink)] text-white cursor-pointer"
                              : "border-[var(--sf-ink)]/20 bg-white text-[var(--sf-ink)] hover:border-[var(--sf-ink)]/45 cursor-pointer"
                      }`}
                    >
                      {active ? <CheckIcon /> : <span aria-hidden="true">🕒</span>}
                      {taken ? `${slot} · Booked` : slot}
                    </button>
                  );
                })}
              </div>
              {!selectedTeacherId ? (
                <p className="mt-2 text-xs font-bold text-[var(--sf-soft)]">Select a teacher to see available times.</p>
              ) : null}
            </section>

            <section>
              <StepLabel n={5} done={doneSteps[4]}>
                Conference format
              </StepLabel>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Conference format">
                {(
                  [
                    { value: "in_person", label: "In person", sub: "At Sage Field", emoji: "🏫" },
                    { value: "virtual", label: "Virtual", sub: "Video call", emoji: "💻" },
                  ] as const
                ).map((f) => {
                  const active = selectedFormat === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => updateActiveSelection({ format: f.value })}
                      className={`flex min-h-16 items-center gap-3 rounded-[20px] px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                        active
                          ? "bg-[var(--sf-mint)] ring-2 ring-[var(--sf-sage)]"
                          : "bg-white ring-1 ring-[var(--sf-ink)]/10 hover:ring-[var(--sf-ink)]/30"
                      }`}
                    >
                      <span className="text-xl" aria-hidden="true">{f.emoji}</span>
                      <span>
                        <span className={`block text-sm font-extrabold ${active ? "text-[var(--sf-sage-deep)]" : ""}`}>{f.label}</span>
                        <span className="block text-xs font-bold text-[var(--sf-soft)]">{f.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-base font-extrabold">Need a different time?</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--sf-soft)]">
                If none of these times work for you, let us know here so we can best accommodate you and find a time that
                works.
              </p>
              <label htmlFor="ptc-accommodation" className="sr-only">
                Need a different time?
              </label>
              <textarea
                id="ptc-accommodation"
                rows={3}
                value={accommodationNote}
                onChange={(e) => updateActiveSelection({ accommodationNote: e.target.value })}
                placeholder="e.g. We need an earlier morning slot…"
                className="mt-2.5 w-full resize-none rounded-[20px] border-2 border-[var(--sf-ink)]/10 bg-white px-3.5 py-3 text-sm text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)]"
              />
            </section>
          </div>
        )}
      </GardenSheet>
    </>
  );
}
