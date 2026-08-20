import { getChicagoDateTimeParts } from "@/lib/pickup-reminder";
import { supabase } from "@/lib/supabase";
import {
  buildDisplayNameMap,
  getStudentDisplayName,
} from "@/lib/student-display-name";

export const UPCOMING_BIRTHDAY_DAYS = 7;

export type StaffBirthday = {
  studentId: string;
  name: string;
  profileImageUrl: string | null;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  birthdayYmd: string;
  daysUntil: number;
  turningAge: number;
  currentAge: number;
};

/** @deprecated Use StaffBirthday */
export type StaffUpcomingBirthday = StaffBirthday;

export type StaffBirthdayMonthGroup = {
  month: number;
  monthLabel: string;
  birthdays: StaffBirthday[];
};

type AppRow = {
  student_id: string;
  admin_tags: string[] | null;
  program: string | null;
  drop_in_program: string | null;
  preferred_name: string | null;
  child_legal_name: string | null;
  dob_month: string | null;
  dob_day: string | null;
  dob_year: string | null;
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [ty, tm, td] = toYmd.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function getBirthdayInYear(month: number, day: number, year: number): string {
  let m = month;
  let d = day;
  if (m === 2 && d === 29 && !isLeapYear(year)) {
    d = 28;
  }
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function getDaysUntilBirthday(
  month: string,
  day: string,
  todayYmd: string,
): { daysUntil: number; birthdayYmd: string } | null {
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  if (
    !monthNum ||
    !dayNum ||
    monthNum < 1 ||
    monthNum > 12 ||
    dayNum < 1 ||
    dayNum > 31
  ) {
    return null;
  }

  const todayYear = parseInt(todayYmd.split("-")[0], 10);
  const birthdayThisYear = getBirthdayInYear(monthNum, dayNum, todayYear);
  let daysUntil = daysBetween(todayYmd, birthdayThisYear);
  let birthdayYmd = birthdayThisYear;

  if (daysUntil < 0) {
    birthdayYmd = getBirthdayInYear(monthNum, dayNum, todayYear + 1);
    daysUntil = daysBetween(todayYmd, birthdayYmd);
  }

  return { daysUntil, birthdayYmd };
}

function computeCurrentAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  todayYmd: string,
): number {
  const [ty, tm, td] = todayYmd.split("-").map(Number);
  let age = ty - birthYear;
  if (tm < birthMonth || (tm === birthMonth && td < birthDay)) {
    age -= 1;
  }
  return age;
}

function isSchoolYearApp(
  app: Pick<AppRow, "program" | "drop_in_program">,
): boolean {
  return (
    app.program === "school_year_26_27" ||
    app.program === "both" ||
    (app.program === "homeschool_drop_in" &&
      (app.drop_in_program === "school_year_26_27" ||
        app.drop_in_program === "both"))
  );
}

function hasCompleteDob(app: AppRow): boolean {
  return Boolean(app.dob_month && app.dob_day && app.dob_year);
}

export function formatBirthdayRelativeDay(
  daysUntil: number,
  birthdayYmd: string,
): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  const [y, m, d] = birthdayYmd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatBirthdayDate(birthday: StaffBirthday): string {
  const month = parseInt(birthday.dobMonth, 10);
  const day = parseInt(birthday.dobDay, 10);
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatFullDob(birthday: StaffBirthday): string {
  const month = parseInt(birthday.dobMonth, 10);
  const day = parseInt(birthday.dobDay, 10);
  const year = parseInt(birthday.dobYear, 10);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getUpcomingBirthdays(
  birthdays: StaffBirthday[],
  maxDays = UPCOMING_BIRTHDAY_DAYS,
): StaffBirthday[] {
  return birthdays
    .filter((b) => b.daysUntil <= maxDays)
    .sort((a, b) => {
      const byDays = a.daysUntil - b.daysUntil;
      if (byDays !== 0) return byDays;
      return a.name.localeCompare(b.name);
    });
}

export function groupBirthdaysByMonth(
  birthdays: StaffBirthday[],
): StaffBirthdayMonthGroup[] {
  const byMonth = new Map<number, StaffBirthday[]>();

  for (const birthday of birthdays) {
    const month = parseInt(birthday.dobMonth, 10);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(birthday);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, rows]) => ({
      month,
      monthLabel: MONTH_LABELS[month - 1] ?? `Month ${month}`,
      birthdays: rows.sort(
        (a, b) => parseInt(a.dobDay, 10) - parseInt(b.dobDay, 10),
      ),
    }));
}

export function buildStaffBirthdaysFromApps(
  apps: AppRow[],
  todayYmd: string,
  profileMap: Map<string, string | null> = new Map(),
): StaffBirthday[] {
  const displayNameMap = buildDisplayNameMap(apps);

  const eligibleApps = apps.filter(
    (app) =>
      isSchoolYearApp(app) &&
      !(app.admin_tags ?? []).includes("Don't Include") &&
      hasCompleteDob(app),
  );

  const birthdays: StaffBirthday[] = [];

  for (const app of eligibleApps) {
    const timing = getDaysUntilBirthday(
      app.dob_month!,
      app.dob_day!,
      todayYmd,
    );
    if (!timing) continue;

    const birthYear = parseInt(app.dob_year!, 10);
    const birthMonth = parseInt(app.dob_month!, 10);
    const birthDay = parseInt(app.dob_day!, 10);
    const birthdayYear = parseInt(timing.birthdayYmd.split("-")[0], 10);

    birthdays.push({
      studentId: app.student_id,
      name:
        displayNameMap.get(app.student_id) ??
        getStudentDisplayName(app.preferred_name, app.child_legal_name),
      profileImageUrl: profileMap.get(app.student_id) ?? null,
      dobMonth: app.dob_month!,
      dobDay: app.dob_day!,
      dobYear: app.dob_year!,
      birthdayYmd: timing.birthdayYmd,
      daysUntil: timing.daysUntil,
      turningAge: birthdayYear - birthYear,
      currentAge: computeCurrentAge(birthYear, birthMonth, birthDay, todayYmd),
    });
  }

  return birthdays.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchStaffBirthdays(
  todayYmd = getChicagoDateTimeParts().ymd,
): Promise<StaffBirthday[]> {
  const { data: appsData, error: appsError } = await supabase
    .schema("parent_app")
    .from("applications")
    .select(
      "student_id, admin_tags, program, drop_in_program, preferred_name, child_legal_name, dob_month, dob_day, dob_year",
    )
    .eq("status", "enrolled");

  if (appsError) throw appsError;

  const apps = (appsData ?? []) as AppRow[];
  const eligibleIds = apps
    .filter(
      (app) =>
        isSchoolYearApp(app) &&
        !(app.admin_tags ?? []).includes("Don't Include") &&
        hasCompleteDob(app),
    )
    .map((app) => app.student_id);

  if (!eligibleIds.length) return [];

  const { data: studentsData, error: studentsError } = await supabase
    .schema("admin")
    .from("students")
    .select("id, profile_image_url")
    .in("id", eligibleIds);

  if (studentsError) throw studentsError;

  const profileMap = new Map(
    (studentsData ?? []).map((s) => [
      s.id,
      s.profile_image_url as string | null,
    ]),
  );

  return buildStaffBirthdaysFromApps(apps, todayYmd, profileMap);
}

export async function fetchStaffUpcomingBirthdays(
  todayYmd = getChicagoDateTimeParts().ymd,
): Promise<StaffBirthday[]> {
  const all = await fetchStaffBirthdays(todayYmd);
  return getUpcomingBirthdays(all);
}
