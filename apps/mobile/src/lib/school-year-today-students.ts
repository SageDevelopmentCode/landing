import { isSchoolYearTeacherAssignment } from "@/lib/student-teacher-assignments";
import {
  isSchoolYearFieldFridayPaid,
  isSchoolYearWeekdayPaid,
} from "@/lib/school-year-attendance";
import {
  buildDisplayNameMap,
  getStudentDisplayName,
} from "@/lib/student-display-name";
import { supabase } from "@/lib/supabase";

type TxnRow = {
  student_id: string;
  payment_type: string;
  metadata: Record<string, unknown> | null;
};

const MONTH_NAMES_SHORT = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

function getDayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date(y, m - 1, d).getDay()
  ];
}

function isStudentPaidForAftercare(txn: TxnRow, date: string): boolean {
  if (txn.payment_type !== "aftercare_tuition") return false;
  const meta = txn.metadata ?? {};
  if (
    typeof meta.selected_days === "string" &&
    meta.selected_days.split(",").includes(date)
  )
    return true;
  if (typeof meta.selected_months === "string") {
    const monthName = MONTH_NAMES_SHORT[parseInt(date.split("-")[1], 10) - 1];
    if (meta.selected_months.split(",").includes(monthName)) return true;
  }
  return false;
}

export type AttendanceSlim = {
  id: string;
  paid_for_day: boolean;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  marked_absent: boolean;
  excluded_from_roster: boolean;
  checked_in: boolean;
};

const SY_ATTENDANCE_SELECT =
  "id, student_id, paid_for_day, pickup_time, picked_up_by_name, marked_absent, excluded_from_roster, checked_in";

export function isStudentOnSchoolYearDayRoster(
  studentId: string,
  isFridayDate: boolean,
  paidIds: Set<string>,
  weekdayRecordMap: Map<string, AttendanceSlim>,
  fridayRecordMap: Map<string, AttendanceSlim>,
): boolean {
  const record = isFridayDate
    ? fridayRecordMap.get(studentId)
    : weekdayRecordMap.get(studentId);
  if (record?.excluded_from_roster) return false;
  return paidIds.has(studentId) || record != null;
}

export async function fetchSchoolYearHiddenStudentsForDate(
  date: string,
): Promise<SchoolYearTodayStudent[]> {
  const dayOfWeek = getDayOfWeek(date);
  const isFridayDate = dayOfWeek === "fri";
  const table = isFridayDate
    ? "school_year_field_friday_records"
    : "school_year_records";

  const { data: hiddenRows, error } = await supabase
    .schema("attendance")
    .from(table)
    .select(`student_id, ${SY_ATTENDANCE_SELECT}`)
    .eq("date", date)
    .eq("excluded_from_roster", true);

  if (error || !hiddenRows?.length) return [];

  const studentIds = hiddenRows.map(
    (r) => (r as { student_id: string }).student_id,
  );

  const [studentsRes, appsRes, assignmentsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .in("id", studentIds),
    supabase
      .schema("parent_app")
      .from("applications")
      .select(
        "student_id, admin_tags, has_allergies, program, drop_in_program, preferred_name, child_legal_name",
      )
      .in("student_id", studentIds),
    supabase.rpc("get_all_teacher_assignments"),
  ]);

  type AppRow = {
    student_id: string;
    admin_tags: string[] | null;
    has_allergies: string | null;
    program: string | null;
    drop_in_program: string | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  };

  const appsData = (appsRes.data ?? []) as AppRow[];
  const displayNameMap = buildDisplayNameMap(appsData);
  const allergyMap = new Map(
    appsData.map((a) => [a.student_id, a.has_allergies]),
  );
  const programMap = new Map(appsData.map((a) => [a.student_id, a.program]));
  const dropInProgramMap = new Map(
    appsData.map((a) => [a.student_id, a.drop_in_program]),
  );

  type StudentRaw = {
    id: string;
    child_legal_name: string | null;
    profile_image_url: string | null;
  };

  const studentsById = new Map(
    ((studentsRes.data ?? []) as StudentRaw[]).map((s) => [s.id, s]),
  );

  const teacherMap = buildSchoolYearTeacherMap(
    (assignmentsRes.data ?? []) as TeacherAssignmentRow[],
    dropInProgramMap,
  );

  type HiddenAttendanceRaw = {
    id: string;
    student_id: string;
    paid_for_day: boolean;
    pickup_time: string | null;
    picked_up_by_name: string | null;
    marked_absent: boolean;
    excluded_from_roster: boolean;
    checked_in: boolean;
  };

  const toSlim = (r: HiddenAttendanceRaw): AttendanceSlim => ({
    id: r.id,
    paid_for_day: r.paid_for_day,
    pickup_time: r.pickup_time,
    picked_up_by_name: r.picked_up_by_name,
    marked_absent: r.marked_absent ?? false,
    excluded_from_roster: r.excluded_from_roster ?? false,
    checked_in: r.checked_in ?? false,
  });

  return (hiddenRows as HiddenAttendanceRaw[])
    .map((row) => {
      const s = studentsById.get(row.student_id);
      if (!s) return null;
      const teacher = teacherMap.get(row.student_id);
      const slim = toSlim(row);
      return {
        student_id: row.student_id,
        name:
          displayNameMap.get(row.student_id) ??
          getStudentDisplayName(null, s.child_legal_name),
        profile_image_url: s.profile_image_url,
        has_allergies: allergyMap.get(row.student_id) ?? null,
        program: programMap.get(row.student_id) ?? null,
        hasSummerEnrollment: false,
        hasAftercareEnrollment: false,
        hasFridayEnrollment: false,
        hasSchoolYearEnrollment: slim.paid_for_day,
        hasSchoolYearFridayEnrollment: isFridayDate ? slim.paid_for_day : false,
        summerRecord: null,
        aftercareRecord: null,
        fieldFridayRecord: null,
        schoolYearRecord: isFridayDate ? null : slim,
        schoolYearFieldFridayRecord: isFridayDate ? slim : null,
        teacherName: teacher?.teacherName ?? null,
        teacherId: teacher?.teacherId ?? null,
        classroom: teacher?.classroom ?? null,
      } satisfies SchoolYearTodayStudent;
    })
    .filter((s): s is SchoolYearTodayStudent => s != null)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

export type SchoolYearTodayStudent = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
  has_allergies: string | null;
  program: string | null;
  hasSummerEnrollment: boolean;
  hasAftercareEnrollment: boolean;
  hasFridayEnrollment: boolean;
  hasSchoolYearEnrollment: boolean;
  hasSchoolYearFridayEnrollment: boolean;
  summerRecord: AttendanceSlim | null;
  aftercareRecord: AttendanceSlim | null;
  fieldFridayRecord: AttendanceSlim | null;
  schoolYearRecord: AttendanceSlim | null;
  schoolYearFieldFridayRecord: AttendanceSlim | null;
  teacherName: string | null;
  teacherId: string | null;
  classroom: string | null;
};

type TeacherAssignmentRow = {
  assignment_id: string;
  teacher_id: string;
  teacher_name: string | null;
  student_id: string;
  program: string;
  classroom: string | null;
};

function buildSchoolYearTeacherMap(
  assignments: TeacherAssignmentRow[],
  dropInProgramByStudent: Map<string, string | null>,
): Map<
  string,
  { teacherName: string | null; teacherId: string; classroom: string | null }
> {
  const byStudent = new Map<string, TeacherAssignmentRow[]>();
  for (const assignment of assignments) {
    if (
      !isSchoolYearTeacherAssignment(
        assignment.program,
        dropInProgramByStudent.get(assignment.student_id),
      )
    ) {
      continue;
    }
    if (!byStudent.has(assignment.student_id)) {
      byStudent.set(assignment.student_id, []);
    }
    byStudent.get(assignment.student_id)!.push(assignment);
  }

  const map = new Map<
    string,
    { teacherName: string | null; teacherId: string; classroom: string | null }
  >();
  for (const [studentId, rows] of byStudent) {
    const picked =
      rows.find((r) => r.program === "school_year_26_27") ?? rows[0];
    map.set(studentId, {
      teacherName: picked.teacher_name,
      teacherId: picked.teacher_id,
      classroom: picked.classroom,
    });
  }
  return map;
}

export async function fetchSchoolYearTodayStudents(
  date: string,
): Promise<SchoolYearTodayStudent[]> {
  const [studentsRes, appsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select(
        "student_id, admin_tags, has_allergies, program, drop_in_program, preferred_name, child_legal_name",
      )
      .eq("status", "enrolled"),
  ]);

  type AppRow = {
    student_id: string;
    admin_tags: string[] | null;
    has_allergies: string | null;
    program: string | null;
    drop_in_program: string | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  };

  const appsData = (appsRes.data ?? []) as AppRow[];
  const displayNameMap = buildDisplayNameMap(appsData);
  const isSchoolYearApp = (a: AppRow) =>
    a.program === "school_year_26_27" ||
    a.program === "both" ||
    (a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"));

  const enrolledIds = new Set(
    appsData
      .filter(
        (a) =>
          isSchoolYearApp(a) &&
          !(a.admin_tags ?? []).includes("Don't Include"),
      )
      .map((a) => a.student_id),
  );
  const allergyMap = new Map(
    appsData.map((a) => [a.student_id, a.has_allergies]),
  );
  const programMap = new Map(appsData.map((a) => [a.student_id, a.program]));
  const dropInProgramMap = new Map(
    appsData.map((a) => [a.student_id, a.drop_in_program]),
  );

  type StudentRaw = {
    id: string;
    child_legal_name: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRaw[]).filter((s) =>
    enrolledIds.has(s.id),
  );

  if (!students.length) return [];
  const studentIds = students.map((s) => s.id);

  const dayOfWeek = getDayOfWeek(date);
  const isFridayDate = dayOfWeek === "fri";

  type SyAttendanceRaw = {
    id: string;
    student_id: string;
    paid_for_day: boolean;
    pickup_time: string | null;
    picked_up_by_name: string | null;
    marked_absent: boolean;
    excluded_from_roster: boolean;
    checked_in: boolean;
  };

  const [
    txnsRes,
    schoolYearRecordsRes,
    schoolYearFridayRecordsRes,
    aftercareRecordsRes,
    assignmentsRes,
  ] = await Promise.all([
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id, payment_type, metadata")
      .in("payment_type", [
        "school_year_tuition",
        "homeschool_dropin",
        "fun_friday_tuition",
      ])
      .eq("status", "completed")
      .eq("is_deleted", false)
      .in("student_id", studentIds),
    isFridayDate
      ? Promise.resolve({ data: [] as SyAttendanceRaw[] })
      : supabase
          .schema("attendance")
          .from("school_year_records")
          .select(SY_ATTENDANCE_SELECT)
          .eq("date", date)
          .in("student_id", studentIds),
    isFridayDate
      ? supabase
          .schema("attendance")
          .from("school_year_field_friday_records")
          .select(SY_ATTENDANCE_SELECT)
          .eq("date", date)
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as SyAttendanceRaw[] }),
    supabase
      .schema("attendance")
      .from("aftercare_records")
      .select("id, student_id, paid_for_day, pickup_time, picked_up_by_name")
      .eq("date", date)
      .in("student_id", studentIds),
    supabase.rpc("get_all_teacher_assignments"),
  ]);

  const txns = (txnsRes.data ?? []) as TxnRow[];

  const schoolYearPaidIds = new Set<string>();
  const schoolYearFridayPaidIds = new Set<string>();
  const aftercarePaidIds = new Set<string>();

  for (const txn of txns) {
    if (isSchoolYearWeekdayPaid(txn, date))
      schoolYearPaidIds.add(txn.student_id);
    if (isSchoolYearFieldFridayPaid(txn, date))
      schoolYearFridayPaidIds.add(txn.student_id);
    if (isStudentPaidForAftercare(txn, date))
      aftercarePaidIds.add(txn.student_id);
  }

  type AttendanceRaw = SyAttendanceRaw;

  const toSlim = (r: AttendanceRaw): AttendanceSlim => ({
    id: r.id,
    paid_for_day: r.paid_for_day,
    pickup_time: r.pickup_time,
    picked_up_by_name: r.picked_up_by_name,
    marked_absent: r.marked_absent ?? false,
    excluded_from_roster: r.excluded_from_roster ?? false,
    checked_in: r.checked_in ?? false,
  });

  const schoolYearRecordMap = new Map(
    ((schoolYearRecordsRes.data ?? []) as AttendanceRaw[]).map((r) => [
      r.student_id,
      toSlim(r),
    ]),
  );
  const schoolYearFridayRecordMap = new Map(
    ((schoolYearFridayRecordsRes.data ?? []) as AttendanceRaw[]).map((r) => [
      r.student_id,
      toSlim(r),
    ]),
  );
  const aftercareRecordMap = new Map(
    ((aftercareRecordsRes.data ?? []) as AttendanceRaw[]).map((r) => [
      r.student_id,
      toSlim(r),
    ]),
  );

  const teacherMap = buildSchoolYearTeacherMap(
    (assignmentsRes.data ?? []) as TeacherAssignmentRow[],
    dropInProgramMap,
  );

  const paidIds = isFridayDate ? schoolYearFridayPaidIds : schoolYearPaidIds;

  return students
    .filter((s) =>
      isStudentOnSchoolYearDayRoster(
        s.id,
        isFridayDate,
        paidIds,
        schoolYearRecordMap,
        schoolYearFridayRecordMap,
      ),
    )
    .map((s) => {
      const teacher = teacherMap.get(s.id);
      return {
        student_id: s.id,
        name:
          displayNameMap.get(s.id) ??
          getStudentDisplayName(null, s.child_legal_name),
        profile_image_url: s.profile_image_url,
        has_allergies: allergyMap.get(s.id) ?? null,
        program: programMap.get(s.id) ?? null,
        hasSummerEnrollment: false,
        hasAftercareEnrollment: aftercarePaidIds.has(s.id),
        hasFridayEnrollment: false,
        hasSchoolYearEnrollment: schoolYearPaidIds.has(s.id),
        hasSchoolYearFridayEnrollment: schoolYearFridayPaidIds.has(s.id),
        summerRecord: null,
        aftercareRecord: aftercareRecordMap.get(s.id) ?? null,
        fieldFridayRecord: null,
        schoolYearRecord: schoolYearRecordMap.get(s.id) ?? null,
        schoolYearFieldFridayRecord:
          schoolYearFridayRecordMap.get(s.id) ?? null,
        teacherName: teacher?.teacherName ?? null,
        teacherId: teacher?.teacherId ?? null,
        classroom: teacher?.classroom ?? null,
      };
    })
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}
