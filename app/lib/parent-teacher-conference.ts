export type ConferenceTeacher = {
  id: string;
  name: string;
  gradeBand: string;
  image: string;
};

export type ConferenceWeek = {
  start: string; // ISO date (Monday)
  label: string;
};

export type ConferenceDay = {
  date: string; // ISO date
  label: string; // e.g. "Mon Aug 24"
  isFriday: boolean;
};

export const CONFERENCE_TEACHER_IDS = [
  "6db16988-f41e-4249-b3fa-7b6720d11ac0",
  "bd562de1-18c2-4b47-91d7-5f0b93fee107",
  "68709384-b054-4f38-a4ee-81554dad2eb8",
] as const;

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

/** 30-minute blocks from 8:30am through 3:00pm */
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

export type ConferenceTeacherDisplay = ConferenceTeacher & {
  profileImageUrl: string | null;
};

export function mergeConferenceTeachersWithProfiles(
  profileMap: Record<string, string | null>,
): ConferenceTeacherDisplay[] {
  return CONFERENCE_TEACHERS.map((t) => ({
    ...t,
    profileImageUrl: profileMap[t.id] ?? null,
  }));
}
