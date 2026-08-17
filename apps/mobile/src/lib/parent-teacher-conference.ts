// Keep in sync with app/lib/parent-teacher-conference.ts (web).

import { API_BASE_URL } from "@/constants/config";

export type ConferenceTeacher = {
  id: string;
  name: string;
  gradeBand: string;
  image: string;
};

export type ConferenceWeek = {
  start: string;
  label: string;
};

export type ConferenceDay = {
  date: string;
  label: string;
  isFriday: boolean;
};

export type ConferenceStudentContext = {
  studentId: string;
  name: string;
  assignedTeacherId: string | null;
};

export const SABRINA_OBNAMIA_TEACHER_ID =
  "6db16988-f41e-4249-b3fa-7b6720d11ac0";

export const CONFERENCE_TEACHER_IDS = [
  SABRINA_OBNAMIA_TEACHER_ID,
  "bd562de1-18c2-4b47-91d7-5f0b93fee107",
  "68709384-b054-4f38-a4ee-81554dad2eb8",
] as const;

/** Teachers who do not work on Fridays — no PTC slots on Friday for these IDs. */
export const TEACHERS_UNAVAILABLE_FRIDAYS = new Set<string>([
  SABRINA_OBNAMIA_TEACHER_ID,
]);

export const CONFERENCE_TEACHERS: ConferenceTeacher[] = [
  {
    id: "6db16988-f41e-4249-b3fa-7b6720d11ac0",
    name: "Sabrina Obnamia",
    gradeBand: "3rd – 4th Grade",
    image: "/assets/team/sabrina.jpg",
  },
  {
    id: "bd562de1-18c2-4b47-91d7-5f0b93fee107",
    name: "Zelinda Melo",
    gradeBand: "1st – 2nd Grade",
    image: "/assets/team/Zelinda2.JPG",
  },
  {
    id: "68709384-b054-4f38-a4ee-81554dad2eb8",
    name: "Joy Paige",
    gradeBand: "Pre-K – Kindergarten",
    image: "/assets/team/Joy (1).png",
  },
];

const TEACHER_LOCAL_IMAGES: Record<string, number> = {
  "bd562de1-18c2-4b47-91d7-5f0b93fee107": require("../../assets/images/team/Zelinda.webp"),
  "68709384-b054-4f38-a4ee-81554dad2eb8": require("../../assets/images/team/Paige.webp"),
};

export const CONFERENCE_WEEKS: ConferenceWeek[] = [
  { start: "2026-08-24", label: "Aug 24 – 28" },
  { start: "2026-08-31", label: "Aug 31 – Sep 4" },
  { start: "2026-09-07", label: "Sep 7 – 11" },
];

export const MON_THU_SLOTS = [
  "1:50 – 2:20pm",
  "2:30 – 3:00pm",
  "3:10 – 3:40pm",
] as const;

function formatSlotLabel(startMinutes: number): string {
  const endMinutes = startMinutes + 30;
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? "pm" : "am";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
  };
  return `${fmt(startMinutes)} – ${fmt(endMinutes)}`;
}

export const FRIDAY_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let mins = 8 * 60 + 30; mins < 15 * 60; mins += 30) {
    slots.push(formatSlotLabel(mins));
  }
  return slots;
})();

export function getDaysForWeek(weekStart: string): ConferenceDay[] {
  const start = new Date(`${weekStart}T12:00:00`);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return dayLabels.map((dayLabel, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const dayNum = d.getDate();
    return {
      date: iso,
      label: `${dayLabel} ${month} ${dayNum}`,
      isFriday: i === 4,
    };
  });
}

export function isConferenceDayAvailable(
  teacherId: string | null,
  day: ConferenceDay,
): boolean {
  if (!teacherId) return true;
  if (day.isFriday && TEACHERS_UNAVAILABLE_FRIDAYS.has(teacherId)) {
    return false;
  }
  return true;
}

export function getFirstAvailableDayForTeacher(
  weekStart: string,
  teacherId: string | null,
): string {
  const days = getDaysForWeek(weekStart);
  const available = days.find((d) => isConferenceDayAvailable(teacherId, d));
  return available?.date ?? days[0].date;
}

export type ConferenceTeacherDisplay = ConferenceTeacher & {
  profileImageUrl: string | null;
};

export function takenSlotKey(
  teacherId: string,
  conferenceDate: string,
  timeSlot: string,
): string {
  return `${teacherId}:${conferenceDate}:${timeSlot}`;
}

export function formatConferenceDateForDisplay(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export type ConferenceBookingRecord = {
  teacherId: string;
  conferenceDate: string;
  timeSlot: string;
  format: "in_person" | "virtual";
  accommodationNote: string | null;
};

export function resolveTeacherImageSource(
  teacher: ConferenceTeacherDisplay,
): { uri: string } | number {
  if (teacher.profileImageUrl) {
    return { uri: teacher.profileImageUrl };
  }
  const local = TEACHER_LOCAL_IMAGES[teacher.id];
  if (local) return local;
  return { uri: `${API_BASE_URL}${teacher.image}` };
}

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
