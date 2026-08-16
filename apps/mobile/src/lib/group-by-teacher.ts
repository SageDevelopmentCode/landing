export const TEACHER_COLORS: Record<string, { bg: string; accent: string }> = {
  "Sabrina Obnamia": { bg: "#fce7f3", accent: "#db2777" },
  "Zelinda Melo": { bg: "#ffedd5", accent: "#ea580c" },
  "Paige Wood": { bg: "#dcfce7", accent: "#16a34a" },
  "Joy Paige": { bg: "#ecfdf5", accent: "#059669" },
};

export const UNASSIGNED_TEACHER = "Unassigned";

const UNASSIGNED_COLORS = { bg: "#f3f4f6", accent: "#9ca3af" };

export function getTeacherColors(
  teacherName: string,
): { bg: string; accent: string } {
  if (teacherName === UNASSIGNED_TEACHER) return UNASSIGNED_COLORS;
  return TEACHER_COLORS[teacherName] ?? UNASSIGNED_COLORS;
}

export type TeacherSection<T extends { teacherName: string | null }> = {
  teacherName: string;
  students: T[];
};

export function groupStudentsByTeacher<
  T extends { teacherName: string | null; name: string | null },
>(students: T[], statusPriority: (s: T) => number): TeacherSection<T>[] {
  const buckets = new Map<string, T[]>();
  for (const s of students) {
    const key = s.teacherName ?? UNASSIGNED_TEACHER;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(s);
  }

  const sortWithin = (arr: T[]) =>
    arr.slice().sort((a, b) => {
      const diff = statusPriority(a) - statusPriority(b);
      if (diff !== 0) return diff;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

  const sections: TeacherSection<T>[] = [...buckets.entries()]
    .filter(([name]) => name !== UNASSIGNED_TEACHER)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([teacherName, sts]) => ({
      teacherName,
      students: sortWithin(sts),
    }));

  const unassigned = buckets.get(UNASSIGNED_TEACHER);
  if (unassigned?.length) {
    sections.push({
      teacherName: UNASSIGNED_TEACHER,
      students: sortWithin(unassigned),
    });
  }

  return sections;
}
