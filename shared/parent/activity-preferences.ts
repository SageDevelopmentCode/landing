export type ParticipationLevel = "watch" | "cook_no_eat" | "full";

export type ActivityPref = {
  level: ParticipationLevel | null;
  notes: string;
};

export type SavedActivityPref = {
  student_id: string;
  activity_id: string;
  participation_level: ParticipationLevel;
  notes: string;
};

export const LEVEL_OPTIONS: {
  level: ParticipationLevel;
  emoji: string;
  label: string;
}[] = [
  { level: "watch", emoji: "👀", label: "Do not participate, just watch" },
  {
    level: "cook_no_eat",
    emoji: "🧑‍🍳",
    label: "Cook and interact with ingredients but do not consume",
  },
  { level: "full", emoji: "✅", label: "Okay for everything (cooking and eating)" },
];

export const LEVEL_SHORT_LABEL: Record<ParticipationLevel, string> = {
  watch: "Watch",
  cook_no_eat: "Cook",
  full: "Full",
};

export const ALLERGEN_DISCLAIMER =
  "I have reviewed the ingredients and allergens listed above. I understand and acknowledge that Sage Field is not responsible for any allergic reactions, dietary sensitivities, or adverse responses related to food items consumed during activities.";

export function buildInitialPrefsForActivity(
  studentIds: string[],
  savedByStudent: Record<string, ActivityPref>,
  defaultsByStudent: Record<string, ParticipationLevel>,
  savedStudentIds: Set<string>,
): {
  prefs: Record<string, ActivityPref>;
  savedIds: Set<string>;
  snapshots: Record<string, ActivityPref>;
} {
  const prefs: Record<string, ActivityPref> = {};
  for (const studentId of studentIds) {
    if (savedByStudent[studentId]) {
      prefs[studentId] = { ...savedByStudent[studentId] };
    } else if (defaultsByStudent[studentId]) {
      prefs[studentId] = { level: defaultsByStudent[studentId], notes: "" };
    } else {
      prefs[studentId] = { level: null, notes: "" };
    }
  }

  const snapshots: Record<string, ActivityPref> = {};
  for (const studentId of studentIds) {
    snapshots[studentId] = { ...(prefs[studentId] ?? { level: null, notes: "" }) };
  }

  return { prefs, savedIds: new Set(savedStudentIds), snapshots };
}

export type SaveActivityPrefEntry = {
  studentId: string;
  childName: string;
  level: ParticipationLevel | null;
  notes: string;
};

type ActivityRow = { id: string; activity_date: string | null };

export function computeHasUnsetActivityPreference(
  activities: ActivityRow[],
  activityPrefs: { student_id: string; activity_id: string }[],
  defaultPrefStudentIds: Set<string>,
  students: { id: string }[],
  paidSets: Record<string, Set<string>>,
): boolean {
  const prefSet = new Set(
    activityPrefs.map((p) => `${p.student_id}:${p.activity_id}`),
  );

  return activities.some(
    (act) =>
      act.activity_date != null &&
      students.some(
        (s) =>
          paidSets[s.id]?.has(act.activity_date!) &&
          !defaultPrefStudentIds.has(s.id) &&
          !prefSet.has(`${s.id}:${act.id}`),
      ),
  );
}

export function findFirstUnsetActivity(
  activities: ActivityRow[],
  activityPrefs: { student_id: string; activity_id: string }[],
  defaultPrefStudentIds: Set<string>,
  students: { id: string }[],
  paidSets: Record<string, Set<string>>,
): string | null {
  const prefSet = new Set(
    activityPrefs.map((p) => `${p.student_id}:${p.activity_id}`),
  );

  for (const act of activities) {
    if (act.activity_date == null) continue;
    const needsPref = students.some(
      (s) =>
        paidSets[s.id]?.has(act.activity_date!) &&
        !defaultPrefStudentIds.has(s.id) &&
        !prefSet.has(`${s.id}:${act.id}`),
    );
    if (needsPref) return act.id;
  }

  return null;
}

/** Summer program window — activities outside this range skip paid-date eligibility. */
export const SUMMER_FIRST_DATE = "2026-05-26";
export const SUMMER_LAST_DATE = "2026-08-14";

/** Matches filterVisibleActivities: school-year dates bypass paid-day check. */
export function childHasVisibleUpcomingActivity(
  paidDates: string[],
  upcomingActivities: { activity_date: string | null }[],
  today = new Date().toISOString().slice(0, 10),
): boolean {
  const paidSet = new Set(paidDates);
  return upcomingActivities.some((a) => {
    if (!a.activity_date || a.activity_date < today) return false;
    if (
      a.activity_date < SUMMER_FIRST_DATE ||
      a.activity_date > SUMMER_LAST_DATE
    ) {
      return true;
    }
    return paidSet.has(a.activity_date);
  });
}
