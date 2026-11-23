"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      <section aria-labelledby="home-conferences">
        <h2 id="home-conferences" className="sr-only">
          Parent-teacher conferences
        </h2>
        <ul className="flex flex-col gap-3">
          {upcomingEntries.map((entry) => {
            const { weekday, day, month } = formatDateBlock(entry.booking.conferenceDate);
            const isVirtual = entry.booking.format === "virtual";

            return (
              <li key={entry.studentId}>
                <button
                  type="button"
                  onClick={() => setPtcOpen(true)}
                  className="sf-ticket group flex w-full items-stretch gap-0 overflow-hidden rounded-[26px] bg-[var(--sf-lav)]/80 text-left transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
                  aria-label={`Conference for ${entry.studentName} with ${entry.teacherName}, ${formatConferenceDateForDisplay(entry.booking.conferenceDate)} at ${entry.booking.timeSlot}. View details`}
                >
                  <span className="flex w-24 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-[#6b3f86]/25 py-4 pl-4 text-[#6b3f86]">
                    <span className="text-[11px] font-extrabold uppercase leading-none tracking-wide">{weekday}</span>
                    <span className="sf-display text-4xl leading-none">{day}</span>
                    <span className="text-[11px] font-extrabold uppercase leading-none tracking-wide">{month}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-4 pl-4 pr-8">
                    <span className="sf-hand text-base leading-none text-[#6b3f86]">parent-teacher conference</span>
                    <span className="truncate text-[17px] font-extrabold">{entry.studentName}</span>
                    <span className="text-sm font-bold text-[var(--sf-soft)]">with {entry.teacherName}</span>
                    <span className="text-sm font-bold text-[var(--sf-soft)]">
                      {formatConferenceDateForDisplay(entry.booking.conferenceDate)} · {entry.booking.timeSlot}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-extrabold text-[#6b3f86]">
                      {isVirtual ? (
                        <>
                          <Video size={12} className="shrink-0" aria-hidden="true" />
                          Virtual
                        </>
                      ) : (
                        <>
                          <MapPin size={12} className="shrink-0" aria-hidden="true" />
                          In person at Sage Field
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

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
        onBooked={() => router.refresh()}
      />
    </>
  );
}
