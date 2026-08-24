"use client";

import { useMemo, useState } from "react";
import { Video, MapPin } from "lucide-react";
import type {
  ConferenceTeacherDisplay,
  ConferenceBookingRecord,
} from "@/app/lib/parent-teacher-conference";
import {
  getUpcomingConferenceEntries,
  formatConferenceDateForDisplay,
} from "@/app/lib/parent-teacher-conference";
import type { ConferenceStudentContext } from "@/app/lib/get-conference-teacher-assignments";
import ParentTeacherConferenceSection from "./ParentTeacherConferenceSheet";

type Props = {
  parentId: string;
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  conferenceBookingsByStudent: Record<string, ConferenceBookingRecord>;
  conferenceTakenSlotKeys: string[];
  readOnly?: boolean;
};

function formatDateBlock(date: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const d = new Date(`${date}T12:00:00`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: String(d.getDate()),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

export default function UpcomingParentTeacherConferenceCard({
  parentId,
  conferenceTeachers,
  conferenceStudents,
  conferenceBookingsByStudent,
  conferenceTakenSlotKeys,
  readOnly = false,
}: Props) {
  const [ptcOpen, setPtcOpen] = useState(false);

  const todayYmd = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const upcomingEntries = useMemo(
    () =>
      getUpcomingConferenceEntries(
        conferenceStudents,
        conferenceBookingsByStudent,
        conferenceTeachers,
        todayYmd,
      ),
    [
      conferenceStudents,
      conferenceBookingsByStudent,
      conferenceTeachers,
      todayYmd,
    ],
  );

  if (upcomingEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {upcomingEntries.map((entry) => {
          const { weekday, day, month } = formatDateBlock(
            entry.booking.conferenceDate,
          );
          const isVirtual = entry.booking.format === "virtual";

          return (
            <button
              key={entry.studentId}
              type="button"
              onClick={() => setPtcOpen(true)}
              className="w-full text-left rounded-xl border border-emerald-100 bg-white px-3 py-3 flex items-center gap-3 hover:shadow-sm hover:border-emerald-200 transition-all cursor-pointer"
            >
              <div className="shrink-0 w-12 rounded-lg bg-emerald-600 text-white flex flex-col items-center py-1.5">
                <span className="text-[10px] font-semibold font-body uppercase leading-none">
                  {weekday}
                </span>
                <span className="text-lg font-bold font-heading leading-tight">
                  {day}
                </span>
                <span className="text-[10px] font-semibold font-body uppercase leading-none">
                  {month}
                </span>
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-sm font-bold text-gray-800 font-heading">
                  {entry.studentName}
                </span>
                <span className="text-xs text-gray-600 font-body">
                  with {entry.teacherName}
                </span>
                <span className="text-xs text-gray-500 font-body">
                  {formatConferenceDateForDisplay(entry.booking.conferenceDate)} ·{" "}
                  {entry.booking.timeSlot}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-body mt-0.5">
                  {isVirtual ? (
                    <>
                      <Video size={12} className="shrink-0" />
                      Virtual
                    </>
                  ) : (
                    <>
                      <MapPin size={12} className="shrink-0" />
                      In person at Sage Field
                    </>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <ParentTeacherConferenceSection
        parentId={parentId}
        conferenceTeachers={conferenceTeachers}
        conferenceStudents={conferenceStudents}
        initialBookingsByStudent={conferenceBookingsByStudent}
        initialTakenSlotKeys={conferenceTakenSlotKeys}
        hideBanner
        open={ptcOpen}
        onOpenChange={setPtcOpen}
        readOnly={readOnly}
      />
    </>
  );
}
