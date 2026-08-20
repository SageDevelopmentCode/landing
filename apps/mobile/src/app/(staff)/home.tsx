import { ActivityPreferencesSheet } from "@/components/ActivityPreferencesSheet";
import { HomeHeroHeader } from "@/components/HomeHeroHeader";
import { StaffAllBirthdaysSheet } from "@/components/StaffAllBirthdaysSheet";
import { StaffConferenceBookingsSheet, type StaffConferenceBookingsSheetRef } from "@/components/StaffConferenceBookingsSheet";
import { StaffConferenceSection } from "@/components/StaffConferenceSection";
import { StaffHealthFoodSection } from "@/components/StaffHealthFoodSection";
import { StaffUpcomingBirthdaysSection } from "@/components/StaffUpcomingBirthdaysSection";
import { StaffSchoolDayFoodPrefsSheet } from "@/components/StaffSchoolDayFoodPrefsSheet";
import { StaffWeekActivityPrefsSheet } from "@/components/StaffWeekActivityPrefsSheet";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { Activity, getActivities } from "@/lib/activities-actions";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { isSchoolYearTeacherAssignment } from "@/lib/student-teacher-assignments";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getTeacherColors,
  groupStudentsByTeacher,
} from "@/lib/group-by-teacher";
import {
  isSchoolYearFieldFridayPaid,
  isSchoolYearWeekdayPaid,
  SCHOOL_YEAR_START,
} from "@/lib/school-year-attendance";
import {
  buildDisplayNameMap,
  getStudentDisplayName,
} from "@/lib/student-display-name";
import {
  fetchStaffSchoolDayFoodPrefs,
  fetchStaffWeekActivityPrefs,
  type StaffActivityPrefGroup,
  type StaffSchoolDayFoodPref,
} from "@/lib/staff-food-and-activity-prefs";
import { getCurrentWeekRange, isDateInRange } from "@/lib/week-date-range";
import {
  fetchAllStaffConferenceBookings,
  isConferenceTeacher,
  type StaffConferenceBooking,
} from "@/lib/staff-conference-bookings";
import {
  fetchStaffBirthdays,
  getUpcomingBirthdays,
  type StaffBirthday,
} from "@/lib/staff-upcoming-birthdays";
import {
  getChicagoDateTimeParts,
  isSchoolYearPickupReminderWindow,
  isStudentAwaitingPickup,
} from "@/lib/pickup-reminder";

// ─── Greeting helpers ─────────────────────────────────────────────────────────

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime12h(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

function formatTodayDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

type PickupPerson = { name: string; relationship: string };

function shiftDay(dateStr: string, delta: 1 | -1): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toYMD(dt);
}

function getDayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date(y, m - 1, d).getDay()
  ];
}

// ─── Payment checker (mirrored from attendance.tsx) ───────────────────────────

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

// ─── Avatar helpers (mirrored from attendance.tsx) ───────────────────────────

const AVATAR_PALETTE = [
  "#c2714f",
  "#8b6f47",
  "#a07850",
  "#7a9e7e",
  "#c4846b",
  "#b08d57",
  "#5E7C68",
  "#c27c47",
];

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function shortName(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AllergyDetail = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
  allergies_description: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_emergency_medications: string | null;
  emergency_medications_description: string | null;
};

type AttendanceSlim = {
  id: string;
  paid_for_day: boolean;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  marked_absent: boolean;
};

const SY_ATTENDANCE_SELECT =
  "id, student_id, paid_for_day, pickup_time, picked_up_by_name, marked_absent";
const SY_ATTENDANCE_SLIM_SELECT =
  "id, paid_for_day, pickup_time, picked_up_by_name, marked_absent";
const AFTERCARE_SLIM_SELECT =
  "id, paid_for_day, pickup_time, picked_up_by_name";

type HomeStudentRow = {
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

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchSchoolYearTodayStudents(
  date: string,
): Promise<HomeStudentRow[]> {
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

  return students
    .filter((s) =>
      isFridayDate
        ? schoolYearFridayPaidIds.has(s.id) ||
          schoolYearFridayRecordMap.has(s.id)
        : schoolYearPaidIds.has(s.id) || schoolYearRecordMap.has(s.id),
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

async function fetchUnpaidStudentsForDate(
  date: string,
  excludeIds: Set<string>,
): Promise<HomeStudentRow[]> {
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

  type StudentRaw = {
    id: string;
    child_legal_name: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRaw[]).filter(
    (s) => enrolledIds.has(s.id) && !excludeIds.has(s.id),
  );

  return students.map((s) => ({
    student_id: s.id,
    name:
      displayNameMap.get(s.id) ??
      getStudentDisplayName(null, s.child_legal_name),
    profile_image_url: s.profile_image_url,
    has_allergies: allergyMap.get(s.id) ?? null,
    program: programMap.get(s.id) ?? null,
    hasSummerEnrollment: false,
    hasAftercareEnrollment: false,
    hasFridayEnrollment: false,
    hasSchoolYearEnrollment: false,
    hasSchoolYearFridayEnrollment: false,
    summerRecord: null,
    aftercareRecord: null,
    fieldFridayRecord: null,
    schoolYearRecord: null,
    schoolYearFieldFridayRecord: null,
    teacherName: null,
    teacherId: null,
    classroom: null,
  }));
}

// ─── AttendanceRow sub-component ─────────────────────────────────────────────

function AttendanceRow({
  label,
  checked,
  pickedUp,
  saving,
  onPress,
  disabled,
}: {
  label: string;
  checked: boolean;
  pickedUp: boolean;
  saving: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        aStyles.row,
        pressed && !disabled && { opacity: 0.7 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[aStyles.checkbox, checked && aStyles.checkboxChecked]}>
        {saving ? (
          <ActivityIndicator
            size="small"
            color={checked ? "#fff" : Brand.sage700}
          />
        ) : checked ? (
          <Ionicons name="checkmark" size={13} color="#fff" />
        ) : null}
      </View>
      <Text style={[aStyles.label, checked && aStyles.labelChecked]}>
        {label}
      </Text>
      {pickedUp && <Text style={aStyles.pickedUpTag}>· Picked up</Text>}
    </Pressable>
  );
}

const aStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },
  label: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  labelChecked: {
    color: "#1f2937",
  },
  pickedUpTag: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffHomeScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");
  const [initials, setInitials] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const avatarSheetRef = useRef<BottomSheetModal>(null);

  // Today's students
  const todayActual = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(todayActual);
  const selectedIsFriday = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 5;
  })();
  const [todayStudents, setTodayStudents] = useState<HomeStudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Quick action sheet
  const studentActionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedStudent, setSelectedStudent] = useState<HomeStudentRow | null>(
    null,
  );
  const [attendanceSaving, setAttendanceSaving] = useState<
    | "aftercare"
    | "school_year"
    | "school_year_absent"
    | "school_year_friday"
    | "school_year_friday_absent"
    | null
  >(null);

  // Activities quick-access section
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [prefCounts, setPrefCounts] = useState<
    Record<string, { full: number; nonFull: number }>
  >({});
  const [selectedPrefsActivityId, setSelectedPrefsActivityId] = useState("");
  const homePrefsSheetRef = useRef<BottomSheetModal>(null);
  const [schoolDayFoodPrefs, setSchoolDayFoodPrefs] = useState<
    StaffSchoolDayFoodPref[]
  >([]);
  const [schoolDayFoodLoading, setSchoolDayFoodLoading] = useState(true);
  const [weekActivityPrefGroups, setWeekActivityPrefGroups] = useState<
    StaffActivityPrefGroup[]
  >([]);
  const [weekActivityPrefsLoading, setWeekActivityPrefsLoading] =
    useState(true);
  const schoolDayFoodSheetRef = useRef<BottomSheetModal>(null);
  const weekActivityPrefsSheetRef = useRef<BottomSheetModal>(null);
  const allBirthdaysSheetRef = useRef<BottomSheetModal>(null);

  const weekActivityPrefSubmissionCount = useMemo(
    () =>
      weekActivityPrefGroups.reduce(
        (total, group) => total + group.students.length,
        0,
      ),
    [weekActivityPrefGroups],
  );

  // Add student sheet
  const addStudentSheetRef = useRef<BottomSheetModal>(null);
  const [unpaidStudents, setUnpaidStudents] = useState<HomeStudentRow[]>([]);
  const [unpaidStudentsLoading, setUnpaidStudentsLoading] = useState(false);
  const [addStudentSearch, setAddStudentSearch] = useState("");

  // Allergies sheet
  const allergiesSheetRef = useRef<BottomSheetModal>(null);
  const [allergyDetails, setAllergyDetails] = useState<AllergyDetail[]>([]);
  const [allergyDetailsLoading, setAllergyDetailsLoading] = useState(false);

  // Pickup sheet
  const pickupSheetRef = useRef<BottomSheetModal>(null);
  const [pickupPersons, setPickupPersons] = useState<PickupPerson[]>([]);
  const [pickupPersonsLoading, setPickupPersonsLoading] = useState(false);
  const [selectedPickupPerson, setSelectedPickupPerson] =
    useState<PickupPerson | null>(null);
  const [pickupSaving, setPickupSaving] = useState(false);

  // Parent-teacher conferences (conference teachers only)
  const ptcBookingsSheetRef = useRef<StaffConferenceBookingsSheetRef>(null);
  const [conferenceBookings, setConferenceBookings] = useState<
    StaffConferenceBooking[]
  >([]);
  const [conferenceBookingsLoading, setConferenceBookingsLoading] =
    useState(false);
  const showConferenceSection = isConferenceTeacher(userId);

  const [allBirthdays, setAllBirthdays] = useState<StaffBirthday[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);

  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(allBirthdays),
    [allBirthdays],
  );

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const id = setInterval(() => {
      const { hour, dayOfWeek } = getChicagoDateTimeParts();
      if (dayOfWeek >= 1 && dayOfWeek <= 4 && hour >= 14) {
        update();
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Load user profile ────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        const { data } = await supabase
          .schema("admin")
          .from("users")
          .select("full_name, role, profile_image_url")
          .eq("id", user.id)
          .single();

        if (data?.profile_image_url) {
          setProfileImageUrl(data.profile_image_url);
        }

        if (data?.full_name) {
          setFullName(data.full_name);
          setFirstName(data.full_name.trim().split(/\s+/)[0]);
          setInitials(getInitials(data.full_name));
        } else {
          const fallback = user.email ?? "";
          setFullName(fallback);
          setFirstName(fallback);
          setInitials(fallback[0]?.toUpperCase() ?? "?");
        }

        if (data?.role) {
          setRole(data.role);
        }
      } catch (err) {
        notifyError("staff-home-load-user", err);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!showConferenceSection || !userId) return;

    let cancelled = false;
    async function loadConferenceBookings() {
      setConferenceBookingsLoading(true);
      try {
        const rows = await fetchAllStaffConferenceBookings();
        if (!cancelled) setConferenceBookings(rows);
      } catch (err) {
        notifyError("staff-home-ptc-bookings", err);
        if (!cancelled) setConferenceBookings([]);
      } finally {
        if (!cancelled) setConferenceBookingsLoading(false);
      }
    }

    loadConferenceBookings();
    return () => {
      cancelled = true;
    };
  }, [showConferenceSection, userId]);

  // ── Load published activities + pref counts ──────────────────────────────────

  const loadActivities = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setActivitiesLoading(true);
    try {
      const { start, end } = getCurrentWeekRange(selectedDate);
      const all = await getActivities();
      const published = all
        .filter(
          (a) =>
            a.status === "published" &&
            a.activity_date != null &&
            isDateInRange(a.activity_date, start, end),
        )
        .sort((a, b) =>
          (a.activity_date ?? "").localeCompare(b.activity_date ?? ""),
        );
      setActivities(published);

      if (published.length > 0) {
        const ids = published.map((a) => a.id);
        const { data } = await supabase
          .schema("parent_app")
          .from("activity_preferences")
          .select("activity_id, participation_level")
          .in("activity_id", ids);

        const counts: Record<string, { full: number; nonFull: number }> = {};
        for (const row of (data ?? []) as {
          activity_id: string;
          participation_level: string;
        }[]) {
          if (!counts[row.activity_id])
            counts[row.activity_id] = { full: 0, nonFull: 0 };
          if (row.participation_level === "full")
            counts[row.activity_id].full++;
          else counts[row.activity_id].nonFull++;
        }
        setPrefCounts(counts);
      } else {
        setPrefCounts({});
      }

      return published;
    } catch (e) {
      notifyError("staff-home-activities", e);
      return [];
    } finally {
      if (!opts?.silent) setActivitiesLoading(false);
    }
  }, [selectedDate]);

  const loadWeekActivityPrefs = useCallback(async (activityIds: string[]) => {
    setWeekActivityPrefsLoading(true);
    try {
      const groups = await fetchStaffWeekActivityPrefs(activityIds);
      setWeekActivityPrefGroups(groups);
    } catch (e) {
      notifyError("staff-home-week-activity-prefs", e);
      setWeekActivityPrefGroups([]);
    } finally {
      setWeekActivityPrefsLoading(false);
    }
  }, []);

  const loadSchoolDayFoodPrefs = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setSchoolDayFoodLoading(true);
    try {
      const prefs = await fetchStaffSchoolDayFoodPrefs();
      setSchoolDayFoodPrefs(prefs);
    } catch (e) {
      notifyError("staff-home-school-day-food-prefs", e);
      setSchoolDayFoodPrefs([]);
    } finally {
      if (!opts?.silent) setSchoolDayFoodLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadAllActivityData() {
      const published = await loadActivities();
      await loadWeekActivityPrefs(published.map((a) => a.id));
    }
    void loadAllActivityData();
  }, [loadActivities, loadWeekActivityPrefs]);

  useEffect(() => {
    loadSchoolDayFoodPrefs();
  }, [loadSchoolDayFoodPrefs]);

  // ── Load today's students (refreshes on focus) ───────────────────────────────

  const loadTodayStudents = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setStudentsLoading(true);
      try {
        const rows = await fetchSchoolYearTodayStudents(selectedDate);
        setTodayStudents(rows);
      } catch (e) {
        notifyError("staff-home-today-students", e);
      } finally {
        if (!opts?.silent) setStudentsLoading(false);
      }
    },
    [selectedDate],
  );

  const loadBirthdays = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setBirthdaysLoading(true);
    try {
      const rows = await fetchStaffBirthdays();
      setAllBirthdays(rows);
    } catch (e) {
      notifyError("staff-home-upcoming-birthdays", e);
      setAllBirthdays([]);
    } finally {
      if (!opts?.silent) setBirthdaysLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayStudents();
      loadBirthdays();
    }, [loadTodayStudents, loadBirthdays]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const published = await loadActivities({ silent: true });
      await Promise.all([
        loadTodayStudents({ silent: true }),
        loadBirthdays({ silent: true }),
        loadWeekActivityPrefs(published.map((a) => a.id)),
        loadSchoolDayFoodPrefs({ silent: true }),
        showConferenceSection
          ? fetchAllStaffConferenceBookings()
              .then(setConferenceBookings)
              .catch((e) => notifyError("staff-home-ptc-bookings", e))
          : Promise.resolve(),
      ]);
    } catch (e) {
      notifyError("staff-home-refresh", e);
    } finally {
      setRefreshing(false);
    }
  }, [
    loadTodayStudents,
    loadBirthdays,
    loadActivities,
    loadWeekActivityPrefs,
    loadSchoolDayFoodPrefs,
    showConferenceSection,
  ]);

  // ── Profile image upload ─────────────────────────────────────────────────────

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingImage(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !userId) return;
      const asset = result.assets[0];
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const storagePath = `${userId}/profile.jpg`;
      const fileRes = await fetch(compressed.uri);
      const blob = await fileRes.blob();
      const uploadRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/profile-images/${storagePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
          },
          body: blob,
        },
      );
      if (!uploadRes.ok) return;
      const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${storagePath}`;
      await supabase.rpc("update_user_profile_image", {
        p_image_url: publicUrl,
      });
      setProfileImageUrl(publicUrl);
    } catch (e) {
      notifyError("staff-home-profile-image", e);
    } finally {
      setUploadingImage(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // ── Student quick actions ─────────────────────────────────────────────────────

  function openStudentActions(student: HomeStudentRow) {
    setSelectedStudent(student);
    studentActionSheetRef.current?.present();
  }

  async function openAddStudentSheet() {
    setUnpaidStudents([]);
    setAddStudentSearch("");
    setUnpaidStudentsLoading(true);
    addStudentSheetRef.current?.present();
    const excludeIds = new Set(todayStudents.map((s) => s.student_id));
    const rows = await fetchUnpaidStudentsForDate(selectedDate, excludeIds);
    setUnpaidStudents(rows);
    setUnpaidStudentsLoading(false);
  }

  async function openAllergiesSheet() {
    setAllergyDetails([]);
    setAllergyDetailsLoading(true);
    allergiesSheetRef.current?.present();
    const allergyIds = todayStudents
      .filter((s) => s.has_allergies === "yes")
      .map((s) => s.student_id);
    if (allergyIds.length === 0) {
      setAllergyDetailsLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .schema("admin")
        .from("students")
        .select(
          "id, child_legal_name, profile_image_url, allergies_description, has_medical_conditions, medical_conditions_description, has_emergency_medications, emergency_medications_description",
        )
        .in("id", allergyIds)
        .order("child_legal_name", { ascending: true });
      type AllergyRaw = {
        id: string;
        child_legal_name: string | null;
        profile_image_url: string | null;
        allergies_description: string | null;
        has_medical_conditions: string | null;
        medical_conditions_description: string | null;
        has_emergency_medications: string | null;
        emergency_medications_description: string | null;
      };
      const nameById = new Map(
        todayStudents.map((s) => [s.student_id, s.name]),
      );
      setAllergyDetails(
        ((data ?? []) as AllergyRaw[]).map((r) => ({
          student_id: r.id,
          name:
            nameById.get(r.id) ??
            getStudentDisplayName(null, r.child_legal_name),
          profile_image_url: r.profile_image_url,
          allergies_description: r.allergies_description,
          has_medical_conditions: r.has_medical_conditions,
          medical_conditions_description: r.medical_conditions_description,
          has_emergency_medications: r.has_emergency_medications,
          emergency_medications_description: r.emergency_medications_description,
        })),
      );
    } catch (e) {
      notifyError("staff-home-allergies", e);
    } finally {
      setAllergyDetailsLoading(false);
    }
  }

  function handleAddStudent(student: HomeStudentRow) {
    setTodayStudents((prev) => [...prev, student]);
    addStudentSheetRef.current?.dismiss();
  }

  // ── Attendance toggles ────────────────────────────────────────────────────────

  function patchStudent(transform: (s: HomeStudentRow) => HomeStudentRow) {
    if (!selectedStudent) return;
    patchStudentById(selectedStudent.student_id, transform);
  }

  function patchStudentById(
    studentId: string,
    transform: (s: HomeStudentRow) => HomeStudentRow,
  ) {
    setTodayStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? transform(s) : s)),
    );
    setSelectedStudent((prev) =>
      prev?.student_id === studentId ? transform(prev) : prev,
    );
  }

  async function markStudentPresent(student: HomeStudentRow) {
    if (attendanceSaving) return;
    const record = getActiveAttendanceRecord(student);
    if (record && !record.marked_absent) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const isFriday = selectedIsFriday;
    const table = isFriday
      ? "school_year_field_friday_records"
      : "school_year_records";
    const recordKey = isFriday
      ? ("schoolYearFieldFridayRecord" as const)
      : ("schoolYearRecord" as const);
    const paidForDay = isFriday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;
    const savingKey = isFriday ? "school_year_friday" : "school_year";
    const discordType = isFriday
      ? "school_year_field_friday_checked_in"
      : "school_year_attendance_marked";
    const errorContext = isFriday
      ? "staff-home-school-year-friday-mark-present"
      : "staff-home-school-year-mark-present";

    setAttendanceSaving(savingKey);
    try {
      if (record?.marked_absent) {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .update({ marked_absent: false })
          .eq("id", record.id)
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError(errorContext, error);
        } else {
          patchStudentById(student.student_id, (s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: discordType,
            data: { studentName: student.name, date: selectedDate },
          });
        }
      } else {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .upsert(
            {
              student_id: student.student_id,
              date: selectedDate,
              recorded_by: user.id,
              paid_for_day: paidForDay,
              marked_absent: false,
            },
            { onConflict: "student_id,date" },
          )
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError(errorContext, error);
        } else {
          patchStudentById(student.student_id, (s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: discordType,
            data: { studentName: student.name, date: selectedDate },
          });
        }
      }
    } finally {
      setAttendanceSaving(null);
    }
  }

  async function toggleAftercareAttendance() {
    if (!selectedStudent || attendanceSaving) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAttendanceSaving("aftercare");
    const existing = selectedStudent.aftercareRecord;

    if (existing) {
      patchStudent((s) => ({ ...s, aftercareRecord: null }));
      const { error } = await supabase
        .schema("attendance")
        .from("aftercare_records")
        .delete()
        .eq("id", existing.id);
      if (error) {
        notifyError("staff-home-aftercare-toggle", error);
        patchStudent((s) => ({ ...s, aftercareRecord: existing }));
      } else {
        notifyDiscord({
          type: "aftercare_checked_out",
          data: { studentName: selectedStudent.name, date: selectedDate },
        });
      }
    } else {
      const { data, error } = await supabase
        .schema("attendance")
        .from("aftercare_records")
        .upsert(
          {
            student_id: selectedStudent.student_id,
            date: selectedDate,
            recorded_by: user.id,
            paid_for_day: selectedStudent.hasAftercareEnrollment,
          },
          { onConflict: "student_id,date" },
        )
        .select(AFTERCARE_SLIM_SELECT)
        .single();
      if (error || !data) {
        notifyError("staff-home-aftercare-toggle", error);
      } else {
        patchStudent((s) => ({
          ...s,
          aftercareRecord: {
            ...(data as Omit<AttendanceSlim, "marked_absent">),
            marked_absent: false,
          },
        }));
        notifyDiscord({
          type: "aftercare_checked_in",
          data: { studentName: selectedStudent.name, date: selectedDate },
        });
      }
    }
    setAttendanceSaving(null);
  }

  async function toggleSchoolYearAttendance() {
    if (!selectedStudent || attendanceSaving) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAttendanceSaving("school_year");
    const existing = selectedStudent.schoolYearRecord;
    const table = "school_year_records";
    const recordKey = "schoolYearRecord" as const;

    try {
      if (existing && !existing.marked_absent) {
        patchStudent((s) => ({ ...s, [recordKey]: null }));
        const { error } = await supabase
          .schema("attendance")
          .from(table)
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError("staff-home-school-year-toggle", error);
          patchStudent((s) => ({ ...s, [recordKey]: existing }));
        } else {
          notifyDiscord({
            type: "school_year_attendance_removed",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else if (existing?.marked_absent) {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .update({ marked_absent: false })
          .eq("id", existing.id)
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-toggle", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_attendance_marked",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .upsert(
            {
              student_id: selectedStudent.student_id,
              date: selectedDate,
              recorded_by: user.id,
              paid_for_day: selectedStudent.hasSchoolYearEnrollment,
              marked_absent: false,
            },
            { onConflict: "student_id,date" },
          )
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-toggle", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_attendance_marked",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      }
    } finally {
      setAttendanceSaving(null);
    }
  }

  async function toggleSchoolYearAbsent() {
    if (!selectedStudent || attendanceSaving) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAttendanceSaving("school_year_absent");
    const existing = selectedStudent.schoolYearRecord;
    const table = "school_year_records";
    const recordKey = "schoolYearRecord" as const;

    try {
      if (existing?.marked_absent) {
        patchStudent((s) => ({ ...s, [recordKey]: null }));
        const { error } = await supabase
          .schema("attendance")
          .from(table)
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError("staff-home-school-year-absent", error);
          patchStudent((s) => ({ ...s, [recordKey]: existing }));
        } else {
          notifyDiscord({
            type: "school_year_attendance_absent_removed",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else if (existing && !existing.marked_absent) {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .update({ marked_absent: true })
          .eq("id", existing.id)
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-absent", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_attendance_absent",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .upsert(
            {
              student_id: selectedStudent.student_id,
              date: selectedDate,
              recorded_by: user.id,
              paid_for_day: selectedStudent.hasSchoolYearEnrollment,
              marked_absent: true,
            },
            { onConflict: "student_id,date" },
          )
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-absent", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_attendance_absent",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      }
    } finally {
      setAttendanceSaving(null);
    }
  }

  async function toggleSchoolYearFieldFridayAttendance() {
    if (!selectedStudent || attendanceSaving) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAttendanceSaving("school_year_friday");
    const existing = selectedStudent.schoolYearFieldFridayRecord;
    const table = "school_year_field_friday_records";
    const recordKey = "schoolYearFieldFridayRecord" as const;

    try {
      if (existing && !existing.marked_absent) {
        patchStudent((s) => ({ ...s, [recordKey]: null }));
        const { error } = await supabase
          .schema("attendance")
          .from(table)
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError("staff-home-school-year-friday-toggle", error);
          patchStudent((s) => ({ ...s, [recordKey]: existing }));
        } else {
          notifyDiscord({
            type: "school_year_field_friday_checked_out",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else if (existing?.marked_absent) {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .update({ marked_absent: false })
          .eq("id", existing.id)
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-friday-toggle", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_field_friday_checked_in",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .upsert(
            {
              student_id: selectedStudent.student_id,
              date: selectedDate,
              recorded_by: user.id,
              paid_for_day: selectedStudent.hasSchoolYearFridayEnrollment,
              marked_absent: false,
            },
            { onConflict: "student_id,date" },
          )
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-friday-toggle", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_field_friday_checked_in",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      }
    } finally {
      setAttendanceSaving(null);
    }
  }

  async function toggleSchoolYearFieldFridayAbsent() {
    if (!selectedStudent || attendanceSaving) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAttendanceSaving("school_year_friday_absent");
    const existing = selectedStudent.schoolYearFieldFridayRecord;
    const table = "school_year_field_friday_records";
    const recordKey = "schoolYearFieldFridayRecord" as const;

    try {
      if (existing?.marked_absent) {
        patchStudent((s) => ({ ...s, [recordKey]: null }));
        const { error } = await supabase
          .schema("attendance")
          .from(table)
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError("staff-home-school-year-friday-absent", error);
          patchStudent((s) => ({ ...s, [recordKey]: existing }));
        } else {
          notifyDiscord({
            type: "school_year_field_friday_absent_removed",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else if (existing && !existing.marked_absent) {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .update({ marked_absent: true })
          .eq("id", existing.id)
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-friday-absent", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_field_friday_absent",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      } else {
        const { data, error } = await supabase
          .schema("attendance")
          .from(table)
          .upsert(
            {
              student_id: selectedStudent.student_id,
              date: selectedDate,
              recorded_by: user.id,
              paid_for_day: selectedStudent.hasSchoolYearFridayEnrollment,
              marked_absent: true,
            },
            { onConflict: "student_id,date" },
          )
          .select(SY_ATTENDANCE_SLIM_SELECT)
          .single();
        if (error || !data) {
          notifyError("staff-home-school-year-friday-absent", error);
        } else {
          patchStudent((s) => ({
            ...s,
            [recordKey]: data as AttendanceSlim,
          }));
          notifyDiscord({
            type: "school_year_field_friday_absent",
            data: { studentName: selectedStudent.name, date: selectedDate },
          });
        }
      }
    } finally {
      setAttendanceSaving(null);
    }
  }

  // ── Pickup ────────────────────────────────────────────────────────────────────

  async function openPickup(student?: HomeStudentRow) {
    const target = student ?? selectedStudent;
    const record = selectedIsFriday
      ? target?.schoolYearFieldFridayRecord
      : target?.schoolYearRecord;
    if (!record || record.marked_absent || !target) return;
    setSelectedPickupPerson(null);
    setPickupPersonsLoading(true);
    pickupSheetRef.current?.present();

    const [appsRes, authRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("applications")
        .select("g1_full_name, g1_relationship, g2_full_name, g2_relationship")
        .eq("student_id", target.student_id)
        .eq("status", "enrolled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("full_name, relationship, sort_order")
        .eq("student_id", target.student_id)
        .order("sort_order", { ascending: true }),
    ]);

    const persons: PickupPerson[] = [];
    const seen = new Set<string>();
    const add = (name: string | null, rel: string | null) => {
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      persons.push({ name, relationship: rel ?? "" });
    };
    add(
      appsRes.data?.g1_full_name ?? null,
      appsRes.data?.g1_relationship ?? null,
    );
    add(
      appsRes.data?.g2_full_name ?? null,
      appsRes.data?.g2_relationship ?? null,
    );
    for (const p of (authRes.data ?? []) as {
      full_name: string;
      relationship: string;
    }[]) {
      add(p.full_name, p.relationship);
    }
    setPickupPersons(persons);
    if (persons.length === 1) setSelectedPickupPerson(persons[0]);
    setPickupPersonsLoading(false);
  }

  async function confirmPickup() {
    const record = selectedIsFriday
      ? selectedStudent?.schoolYearFieldFridayRecord
      : selectedStudent?.schoolYearRecord;
    if (!record || record.marked_absent || !selectedPickupPerson) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setPickupSaving(true);

    const table = selectedIsFriday
      ? "school_year_field_friday_records"
      : "school_year_records";
    const paidForDay = selectedIsFriday
      ? selectedStudent!.hasSchoolYearFridayEnrollment
      : selectedStudent!.hasSchoolYearEnrollment;

    const { data, error } = await supabase
      .schema("attendance")
      .from(table)
      .upsert(
        {
          student_id: selectedStudent!.student_id,
          date: selectedDate,
          recorded_by: user.id,
          paid_for_day: paidForDay,
          picked_up_by_name: selectedPickupPerson.name,
          picked_up_by_relationship: selectedPickupPerson.relationship,
          pickup_recorded_by: user.id,
        },
        { onConflict: "student_id,date" },
      )
      .select(SY_ATTENDANCE_SLIM_SELECT)
      .single();

    if (!error && data) {
      patchStudent((s) => {
        if (selectedIsFriday) {
          return {
            ...s,
            schoolYearFieldFridayRecord: {
              ...s.schoolYearFieldFridayRecord!,
              ...(data as Partial<AttendanceSlim>),
            },
          };
        }
        return {
          ...s,
          schoolYearRecord: {
            ...s.schoolYearRecord!,
            ...(data as Partial<AttendanceSlim>),
          },
        };
      });

      notifyDiscord({
        type: selectedIsFriday
          ? "school_year_field_friday_pickup_recorded"
          : "school_year_pickup_recorded",
        data: {
          studentName: selectedStudent!.name,
          date: selectedDate,
          pickedUpBy: selectedPickupPerson.name,
          relationship: selectedPickupPerson.relationship,
        },
      });
    } else if (error) {
      notifyError("staff-home-pickup", error);
    }

    setPickupSaving(false);
    pickupSheetRef.current?.dismiss();
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  function getActiveAttendanceRecord(s: HomeStudentRow): AttendanceSlim | null {
    return selectedIsFriday
      ? s.schoolYearFieldFridayRecord
      : s.schoolYearRecord;
  }

  function statusPriority(s: HomeStudentRow): number {
    const record = getActiveAttendanceRecord(s);
    if (!record) return 0;
    if (record.picked_up_by_name) return 2;
    return 1;
  }

  const filteredStudents =
    search.length > 0
      ? todayStudents.filter((s) =>
          (s.name ?? "").toLowerCase().includes(search.toLowerCase()),
        )
      : todayStudents;

  const teacherSections = groupStudentsByTeacher(
    filteredStudents,
    statusPriority,
  );

  const showPickupReminder =
    selectedDate === todayActual &&
    !selectedIsFriday &&
    isSchoolYearPickupReminderWindow(now);

  const unpickedStudents = showPickupReminder
    ? todayStudents.filter((s) =>
        isStudentAwaitingPickup(s.schoolYearRecord),
      )
    : [];

  const unpickedNamePreview = (() => {
    const names = unpickedStudents.map((s) => shortName(s.name));
    if (names.length <= 5) return names.join(", ");
    return `${names.slice(0, 5).join(", ")} +${names.length - 5} more`;
  })();

  // ── Empty state ───────────────────────────────────────────────────────────────

  function renderEmptyState() {
    const dow = new Date().getDay();
    const isWeekend = dow === 0 || dow === 6;

    if (search) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={36} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No students match</Text>
          <Text style={styles.emptyStateSub}>Try a different name.</Text>
        </View>
      );
    }

    const [y, m, d] = selectedDate.split("-").map(Number);
    const selectedDay = new Date(y, m - 1, d);
    const beforeSchoolYear = selectedDay < SCHOOL_YEAR_START;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="school-outline" size={40} color="#d1d5db" />
        <Text style={styles.emptyStateTitle}>
          {isWeekend
            ? "No school today"
            : beforeSchoolYear
              ? "School year hasn't started yet"
              : "No students scheduled today"}
        </Text>
        <Text style={styles.emptyStateSub}>
          {isWeekend
            ? "Enjoy your weekend!"
            : beforeSchoolYear
              ? `School year begins ${SCHOOL_YEAR_START.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
              : "No paid enrollments found for today."}
        </Text>
      </View>
    );
  }

  function renderStudentRow(
    student: HomeStudentRow,
    teacherColors: { bg: string; accent: string },
  ) {
    const color = avatarColor(student.student_id);
    const isPaid = selectedIsFriday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;

    return (
      <Pressable
        key={student.student_id}
        style={({ pressed }) => [
          styles.studentRow,
          {
            borderLeftWidth: 3,
            borderLeftColor: teacherColors.accent,
          },
          pressed && { backgroundColor: "#f9fafb" },
        ]}
        onPress={() => openStudentActions(student)}
      >
        <View style={{ position: "relative", width: 40, height: 40 }}>
          <View
            style={[styles.avatarCircle, { backgroundColor: color }]}
          >
            {student.profile_image_url ? (
              <Image
                source={{ uri: student.profile_image_url }}
                style={styles.avatarCircleImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarCircleText}>
                {getInitials(student.name ?? "?")}
              </Text>
            )}
          </View>
          {student.has_allergies === "yes" && (
            <View style={styles.allergyBadge}>
              <Ionicons name="medical" size={7} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.studentRowInfo}>
          <View style={styles.studentNameRow}>
            <Text style={styles.studentName} numberOfLines={1}>
              {shortName(student.name)}
            </Text>
            {student.program === "homeschool_drop_in" && (
              <Ionicons
                name="home"
                size={13}
                color="#059669"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          <View style={styles.careChipsRow}>
            {(() => {
              const record = getActiveAttendanceRecord(student);
              if (record?.marked_absent) {
                return (
                  <View style={[styles.careChip, styles.careChipAbsent]}>
                    <Ionicons name="close-circle" size={10} color="#b91c1c" />
                    <Text
                      style={[
                        styles.careChipText,
                        styles.careChipTextAbsent,
                      ]}
                    >
                      Absent
                    </Text>
                  </View>
                );
              }
              if (record?.picked_up_by_name) {
                return (
                  <View style={[styles.careChip, styles.careChipLogged]}>
                    <Ionicons name="car" size={10} color="#15803d" />
                    <Text
                      style={[
                        styles.careChipText,
                        styles.careChipTextLogged,
                      ]}
                    >
                      Picked Up
                    </Text>
                  </View>
                );
              }
              if (record) {
                return (
                  <View style={[styles.careChip, styles.careChipLogged]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={10}
                      color="#15803d"
                    />
                    <Text
                      style={[
                        styles.careChipText,
                        styles.careChipTextLogged,
                      ]}
                    >
                      Present
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
            {!isPaid && (
              <View style={[styles.careChip, { backgroundColor: "#f3f4f6" }]}>
                <Text
                  style={[styles.careChipText, styles.careChipTextUnlogged]}
                >
                  Unpaid
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          {(() => {
            const record = getActiveAttendanceRecord(student);
            const isPresent = !!record && !record.marked_absent;
            const alreadyPickedUp = !!record?.picked_up_by_name;
            const chipDisabled = attendanceSaving !== null;

            if (!isPresent) {
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.todayChip,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingVertical: 7,
                    },
                    (pressed || chipDisabled) && { opacity: 0.7 },
                  ]}
                  disabled={chipDisabled}
                  onPress={(e) => {
                    e.stopPropagation();
                    markStudentPresent(student);
                  }}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={13}
                    color={Brand.sage700}
                  />
                  <Text style={styles.todayChipText}>Mark Present</Text>
                </Pressable>
              );
            }

            if (!alreadyPickedUp) {
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.todayChip,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingVertical: 7,
                    },
                    (pressed || chipDisabled) && { opacity: 0.7 },
                  ]}
                  disabled={chipDisabled}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedStudent(student);
                    openPickup(student);
                  }}
                >
                  <Ionicons
                    name="car-outline"
                    size={13}
                    color={Brand.sage700}
                  />
                  <Text style={styles.todayChipText}>Record Pickup</Text>
                </Pressable>
              );
            }

            return null;
          })()}
          <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
        </View>
      </Pressable>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <HomeHeroHeader
        name={firstName || fullName}
        role={role || undefined}
        avatarUrl={profileImageUrl}
        initials={initials}
        onAvatarPress={() => avatarSheetRef.current?.present()}
      />

      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Content card */}
        <View style={styles.content}>
          {/* Date navigation */}
          <View style={styles.dateNavRow}>
            <Pressable
              style={({ pressed }) => [
                styles.dateNavBtn,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => setSelectedDate((d) => shiftDay(d, -1))}
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </Pressable>
            <Text style={styles.dateNavLabel}>
              {formatTodayDate(selectedDate)}
            </Text>
            {selectedDate === todayActual && (
              <View style={styles.todayChip}>
                <Text style={styles.todayChipText}>Today</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.dateNavBtn,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => setSelectedDate((d) => shiftDay(d, 1))}
            >
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </Pressable>
            <View style={styles.dateNavActions}>
              {!studentsLoading && (
                <Text style={styles.sectionCount}>
                  {filteredStudents.length}{" "}
                  {filteredStudents.length === 1 ? "student" : "students"}
                </Text>
              )}
              <Pressable
                onPress={openAddStudentSheet}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.addStudentBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {unpickedStudents.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.pickupReminderCard,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push("/(staff)/attendance" as any)}
            >
              <View style={styles.pickupReminderIconWrap}>
                <Ionicons name="warning" size={18} color="#b45309" />
              </View>
              <View style={styles.pickupReminderContent}>
                <View style={styles.pickupReminderTitleRow}>
                  <Text style={styles.pickupReminderTitle}>
                    Pickup not recorded
                  </Text>
                  <View style={styles.pickupReminderBadge}>
                    <Text style={styles.pickupReminderBadgeText}>
                      {unpickedStudents.length}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pickupReminderBody}>
                  {unpickedNamePreview}
                </Text>
                <Text style={styles.pickupReminderHint}>
                  Tap to record pickup in Attendance
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#b45309" />
            </Pressable>
          )}

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students…"
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </Pressable>
            ) : null}
          </View>

          {/* Student list */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Brand.sage700}
              />
            }
          >
            {studentsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.skeletonRow}>
                    <SkeletonBox width={40} height={40} borderRadius={20} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <SkeletonBox width="50%" height={14} borderRadius={4} />
                      <SkeletonBox width="75%" height={11} borderRadius={4} />
                    </View>
                  </View>
                ))
              : filteredStudents.length === 0
                ? renderEmptyState()
                : teacherSections.map((section) => {
                    const colors = getTeacherColors(section.teacherName);
                    return (
                      <View key={section.teacherName} style={styles.teacherSection}>
                        <View
                          style={[
                            styles.teacherSectionHeader,
                            { backgroundColor: colors.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.teacherSectionTitle,
                              { color: colors.accent },
                            ]}
                          >
                            {section.teacherName}
                          </Text>
                          <Text
                            style={[
                              styles.teacherSectionCount,
                              { color: colors.accent },
                            ]}
                          >
                            {section.students.length}{" "}
                            {section.students.length === 1
                              ? "student"
                              : "students"}
                          </Text>
                        </View>
                        {section.students.map((student) =>
                          renderStudentRow(student, colors),
                        )}
                      </View>
                    );
                  })}

            <StaffHealthFoodSection
              allergyCount={
                todayStudents.filter((s) => s.has_allergies === "yes").length
              }
              showAllergiesRow={todayStudents.some(
                (s) => s.has_allergies === "yes",
              )}
              schoolDayFoodCount={schoolDayFoodPrefs.length}
              schoolDayFoodLoading={schoolDayFoodLoading}
              activityPrefCount={weekActivityPrefSubmissionCount}
              activityPrefsLoading={
                activitiesLoading || weekActivityPrefsLoading
              }
              onOpenAllergies={openAllergiesSheet}
              onOpenSchoolDayFood={() =>
                schoolDayFoodSheetRef.current?.present()
              }
              onOpenActivityPrefs={() =>
                weekActivityPrefsSheetRef.current?.present()
              }
            />

            {showConferenceSection && userId && (
              <StaffConferenceSection
                bookings={conferenceBookings}
                loading={conferenceBookingsLoading}
                todayYmd={todayActual}
                currentTeacherId={userId}
                onOpenSheet={() => {
                  ptcBookingsSheetRef.current?.presentList();
                }}
                onBookingPress={(id) => {
                  ptcBookingsSheetRef.current?.presentDetail(id);
                }}
              />
            )}

            {/* This Week's Activities */}
            <View style={styles.activitiesSection}>
              <Text style={styles.activitiesSectionTitle}>
                This Week's Activities
              </Text>
              {activitiesLoading ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.activityCardsRow}
                >
                  {[0, 1, 2].map((i) => (
                    <SkeletonBox
                      key={i}
                      width={140}
                      height={120}
                      borderRadius={14}
                    />
                  ))}
                </ScrollView>
              ) : activities.length === 0 ? (
                <Text style={styles.activitiesEmpty}>
                  No published activities yet.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.activityCardsRow}
                >
                  {activities.map((activity) => {
                    const thumb = activity.images[0]?.signed_url ?? null;
                    const counts = prefCounts[activity.id];
                    return (
                      <Pressable
                        key={activity.id}
                        style={({ pressed }) => [
                          styles.activityCard,
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/(staff)/activities/[activityId]" as any,
                            params: { activityId: activity.id },
                          })
                        }
                      >
                        {thumb ? (
                          <Image
                            source={{ uri: thumb }}
                            style={styles.activityThumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.activityThumb,
                              styles.activityThumbPlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="ribbon-outline"
                              size={24}
                              color="#d1d5db"
                            />
                          </View>
                        )}
                        <Text
                          style={styles.activityCardTitle}
                          numberOfLines={2}
                        >
                          {activity.title}
                        </Text>
                        <View style={styles.activityCardFooter}>
                          <View style={styles.prefChipsRow}>
                            {counts?.full > 0 && (
                              <View
                                style={[
                                  styles.prefChip,
                                  { backgroundColor: "#dcfce7" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.prefChipText,
                                    { color: "#166534" },
                                  ]}
                                >
                                  ✅ {counts.full}
                                </Text>
                              </View>
                            )}
                            {counts?.nonFull > 0 && (
                              <View
                                style={[
                                  styles.prefChip,
                                  { backgroundColor: "#fef9c3" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.prefChipText,
                                    { color: "#854d0e" },
                                  ]}
                                >
                                  ⚠️ {counts.nonFull}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Pressable
                            hitSlop={8}
                            onPress={() => {
                              setSelectedPrefsActivityId(activity.id);
                              homePrefsSheetRef.current?.present();
                            }}
                          >
                            <Ionicons
                              name="people-outline"
                              size={18}
                              color={Brand.sage700}
                            />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <StaffUpcomingBirthdaysSection
              birthdays={upcomingBirthdays}
              loading={birthdaysLoading}
              totalCount={allBirthdays.length}
              onViewAll={() => allBirthdaysSheetRef.current?.present()}
            />
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Avatar / profile sheet */}
      <BottomSheetModal
        ref={avatarSheetRef}
        snapPoints={["40%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView style={styles.sheet}>
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.75}
            disabled={uploadingImage}
            style={{ alignSelf: "center", marginBottom: 16 }}
          >
            <View style={{ position: "relative", width: 62, height: 62 }}>
              <View style={styles.sheetAvatarCircle}>
                {profileImageUrl ? (
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.sheetAvatarCircleImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.sheetAvatarCircleText}>{initials}</Text>
                )}
              </View>
              <View style={styles.sheetAvatarBadge}>
                <Ionicons
                  name={uploadingImage ? "hourglass-outline" : "camera"}
                  size={11}
                  color="#fff"
                />
              </View>
            </View>
          </TouchableOpacity>
          <Pressable
            style={({ pressed }) => [
              styles.sheetItem,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              avatarSheetRef.current?.dismiss();
              router.push({
                pathname: "/(staff)/teacher/[teacherId]" as any,
                params: {
                  teacherId: userId,
                  teacherName: fullName,
                  classroom: "",
                  program: "",
                },
              });
            }}
          >
            <Ionicons name="person-outline" size={20} color="#1f2937" />
            <Text style={styles.sheetItemText}>View Profile</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.sheetItem,
              pressed && { opacity: 0.7 },
            ]}
            onPress={async () => {
              avatarSheetRef.current?.dismiss();
              await signOut();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={[styles.sheetItemText, { color: "#ef4444" }]}>
              Sign out
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Student quick action sheet */}
      <BottomSheetModal
        ref={studentActionSheetRef}
        snapPoints={["60%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        onDismiss={() => setSelectedStudent(null)}
      >
        <BottomSheetView style={styles.actionSheet}>
          {selectedStudent && (
            <>
              {/* Student header */}
              <View style={styles.actionSheetHeader}>
                <View
                  style={[
                    styles.actionAvatarCircle,
                    {
                      backgroundColor: avatarColor(selectedStudent.student_id),
                    },
                  ]}
                >
                  {selectedStudent.profile_image_url ? (
                    <Image
                      source={{ uri: selectedStudent.profile_image_url }}
                      style={styles.actionAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.actionAvatarText}>
                      {getInitials(selectedStudent.name ?? "?")}
                    </Text>
                  )}
                </View>
                <View style={{ gap: 2, flex: 1 }}>
                  <Text style={styles.actionSheetName}>
                    {shortName(selectedStudent.name)}
                  </Text>
                  {selectedStudent.has_allergies === "yes" && (
                    <View style={styles.actionAllergyBadge}>
                      <Ionicons name="medical" size={11} color="#dc2626" />
                      <Text style={styles.actionAllergyText}>
                        Has allergies
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.profileLink,
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    studentActionSheetRef.current?.dismiss();
                    router.push({
                      pathname: "/(staff)/students/[studentId]" as any,
                      params: {
                        studentId: selectedStudent.student_id,
                        studentName: selectedStudent.name ?? "",
                        program: selectedStudent.program ?? "",
                        classroom: "",
                      },
                    });
                  }}
                >
                  <Text style={styles.profileLinkText}>Profile</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={Brand.sage700}
                  />
                </Pressable>
              </View>

              {/* 2×2 action tile grid */}
              {(() => {
                type Tile = {
                  key: string;
                  icon: string;
                  label: string;
                  active: boolean;
                  saving: boolean;
                  disabled: boolean;
                  onPress: () => void;
                };
                const tiles: Tile[] = [];
                const activeRecord = getActiveAttendanceRecord(selectedStudent);
                if (!selectedIsFriday) {
                  tiles.push({
                    key: "school_year",
                    icon: "🎒",
                    label:
                      activeRecord && !activeRecord.marked_absent
                        ? "Present"
                        : "Mark Present",
                    active: !!activeRecord && !activeRecord.marked_absent,
                    saving: attendanceSaving === "school_year",
                    disabled: attendanceSaving !== null,
                    onPress: toggleSchoolYearAttendance,
                  });
                  tiles.push({
                    key: "school_year_absent",
                    icon: "🚫",
                    label: activeRecord?.marked_absent
                      ? "Absent"
                      : "Mark Absent",
                    active: !!activeRecord?.marked_absent,
                    saving: attendanceSaving === "school_year_absent",
                    disabled: attendanceSaving !== null,
                    onPress: toggleSchoolYearAbsent,
                  });
                } else {
                  tiles.push({
                    key: "school_year_friday",
                    icon: "🌿",
                    label:
                      activeRecord && !activeRecord.marked_absent
                        ? "Field Friday"
                        : "Mark Present",
                    active: !!activeRecord && !activeRecord.marked_absent,
                    saving: attendanceSaving === "school_year_friday",
                    disabled: attendanceSaving !== null,
                    onPress: toggleSchoolYearFieldFridayAttendance,
                  });
                  tiles.push({
                    key: "school_year_friday_absent",
                    icon: "🚫",
                    label: activeRecord?.marked_absent
                      ? "Absent"
                      : "Mark Absent",
                    active: !!activeRecord?.marked_absent,
                    saving: attendanceSaving === "school_year_friday_absent",
                    disabled: attendanceSaving !== null,
                    onPress: toggleSchoolYearFieldFridayAbsent,
                  });
                }
                if (
                  selectedStudent.hasAftercareEnrollment ||
                  !!selectedStudent.aftercareRecord
                ) {
                  tiles.push({
                    key: "aftercare",
                    icon: "🏠",
                    label: selectedStudent.aftercareRecord
                      ? "Aftercare"
                      : "Log Aftercare",
                    active: !!selectedStudent.aftercareRecord,
                    saving: attendanceSaving === "aftercare",
                    disabled: attendanceSaving !== null,
                    onPress: toggleAftercareAttendance,
                  });
                }
                return (
                  <View style={styles.tileGrid}>
                    {tiles.map((tile) => (
                      <Pressable
                        key={tile.key}
                        style={({ pressed }) => [
                          styles.tile,
                          tile.active && styles.tileActive,
                          pressed && !tile.disabled && { opacity: 0.75 },
                        ]}
                        onPress={tile.onPress}
                        disabled={tile.disabled}
                      >
                        {tile.saving ? (
                          <ActivityIndicator
                            size="small"
                            color={tile.active ? "#fff" : Brand.sage700}
                          />
                        ) : (
                          <Text style={styles.tileIcon}>{tile.icon}</Text>
                        )}
                        <Text
                          style={[
                            styles.tileLabel,
                            tile.active && styles.tileLabelActive,
                          ]}
                          numberOfLines={2}
                        >
                          {tile.label}
                        </Text>
                        {tile.active && !tile.saving && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#fff"
                            style={{ marginTop: 2 }}
                          />
                        )}
                      </Pressable>
                    ))}
                  </View>
                );
              })()}

              {/* Record Pickup */}
              {(() => {
                const record = getActiveAttendanceRecord(selectedStudent);
                if (!record || record.marked_absent) return null;
                if (record.picked_up_by_name) {
                  return (
                    <View style={styles.pickedUpRow}>
                      <Ionicons name="car" size={14} color={Brand.sage700} />
                      <Text style={styles.pickedUpText}>
                        {"Picked up · "}
                        {record.picked_up_by_name}
                      </Text>
                    </View>
                  );
                }
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.pickupBtn,
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => openPickup()}
                  >
                    <Ionicons
                      name="car-outline"
                      size={16}
                      color={Brand.sage700}
                    />
                    <Text style={styles.pickupBtnText}>Record Pickup</Text>
                  </Pressable>
                );
              })()}
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Pickup — person selector sheet */}
      <BottomSheetModal
        ref={pickupSheetRef}
        snapPoints={["60%", "80%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => {
          setPickupPersons([]);
          setSelectedPickupPerson(null);
          setPickupSaving(false);
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.pickupSheetContent}
        >
          <Text style={styles.pickupSheetTitle}>Who picked up?</Text>
          {pickupPersonsLoading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator color={Brand.sage700} />
            </View>
          ) : pickupPersons.length === 0 ? (
            <Text
              style={{
                fontFamily: FontFamilies.body,
                fontSize: 14,
                color: "#9ca3af",
                padding: 4,
              }}
            >
              No authorized pickup persons on file.
            </Text>
          ) : (
            pickupPersons.map((p) => {
              const isSelected = selectedPickupPerson?.name === p.name;
              return (
                <TouchableOpacity
                  key={p.name}
                  style={[
                    styles.pickupSlotRow,
                    isSelected && { backgroundColor: Brand.sage700 + "18" },
                  ]}
                  onPress={() => setSelectedPickupPerson(p)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.pickupRadio,
                      isSelected && {
                        borderColor: Brand.sage700,
                        backgroundColor: Brand.sage700 + "18",
                      },
                    ]}
                  >
                    {isSelected && <View style={styles.pickupRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.pickupSlotText,
                        isSelected && { color: Brand.sage700 },
                      ]}
                    >
                      {p.name}
                    </Text>
                    {p.relationship ? (
                      <Text
                        style={{
                          fontFamily: FontFamilies.body,
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        {p.relationship}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Brand.sage700}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <Pressable
            style={[
              styles.pickupConfirmBtn,
              (!selectedPickupPerson || pickupSaving) && { opacity: 0.4 },
            ]}
            onPress={confirmPickup}
            disabled={!selectedPickupPerson || pickupSaving}
          >
            {pickupSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.pickupConfirmText}>Confirm Pickup</Text>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Add unpaid student sheet */}
      <BottomSheetModal
        ref={addStudentSheetRef}
        snapPoints={["60%", "85%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => {
          setUnpaidStudents([]);
          setAddStudentSearch("");
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.addStudentSheetContent}
        >
          <Text style={styles.pickupSheetTitle}>Add Student</Text>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students…"
              placeholderTextColor="#9ca3af"
              value={addStudentSearch}
              onChangeText={setAddStudentSearch}
              autoCorrect={false}
              returnKeyType="search"
            />
            {addStudentSearch ? (
              <Pressable onPress={() => setAddStudentSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </Pressable>
            ) : null}
          </View>
          {unpaidStudentsLoading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator color={Brand.sage700} />
            </View>
          ) : unpaidStudents.length === 0 ? (
            <Text
              style={{
                fontFamily: FontFamilies.body,
                fontSize: 14,
                color: "#9ca3af",
                padding: 16,
              }}
            >
              All enrolled students are already in today's list.
            </Text>
          ) : (
            unpaidStudents
              .filter(
                (s) =>
                  !addStudentSearch ||
                  (s.name ?? "")
                    .toLowerCase()
                    .includes(addStudentSearch.toLowerCase()),
              )
              .map((student) => {
                const color = avatarColor(student.student_id);
                return (
                  <Pressable
                    key={student.student_id}
                    style={({ pressed }) => [
                      styles.studentRow,
                      pressed && { backgroundColor: "#f9fafb" },
                    ]}
                    onPress={() => handleAddStudent(student)}
                  >
                    <View
                      style={[styles.avatarCircle, { backgroundColor: color }]}
                    >
                      {student.profile_image_url ? (
                        <Image
                          source={{ uri: student.profile_image_url }}
                          style={styles.avatarCircleImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.avatarCircleText}>
                          {getInitials(student.name ?? "?")}
                        </Text>
                      )}
                    </View>
                    <View style={styles.studentRowInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {shortName(student.name)}
                      </Text>
                      <View style={styles.careChipsRow}>
                        <View
                          style={[
                            styles.careChip,
                            { backgroundColor: "#f3f4f6" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.careChipText,
                              styles.careChipTextUnlogged,
                            ]}
                          >
                            Unpaid
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="add" size={18} color={Brand.sage700} />
                  </Pressable>
                );
              })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Allergies for Today sheet */}
      <BottomSheetModal
        ref={allergiesSheetRef}
        snapPoints={["60%", "85%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => setAllergyDetails([])}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.allergySheetContent}
        >
          <Text style={styles.pickupSheetTitle}>Allergies for Today</Text>
          {allergyDetailsLoading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator color="#dc2626" />
            </View>
          ) : allergyDetails.length === 0 ? (
            <Text
              style={{
                fontFamily: FontFamilies.body,
                fontSize: 14,
                color: "#9ca3af",
                padding: 4,
              }}
            >
              No allergy information on file.
            </Text>
          ) : (
            allergyDetails.map((s) => {
              const color = avatarColor(s.student_id);
              return (
                <View key={s.student_id} style={styles.allergyCard}>
                  <View style={styles.allergyCardHeader}>
                    <View
                      style={[styles.allergyAvatarCircle, { backgroundColor: color }]}
                    >
                      {s.profile_image_url ? (
                        <Image
                          source={{ uri: s.profile_image_url }}
                          style={styles.allergyAvatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.allergyAvatarText}>
                          {getInitials(s.name ?? "?")}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.allergyCardName}>
                      {shortName(s.name)}
                    </Text>
                  </View>
                  {s.allergies_description ? (
                    <View style={styles.allergySection}>
                      <View style={styles.allergySectionLabel}>
                        <Ionicons name="medical" size={12} color="#dc2626" />
                        <Text style={styles.allergySectionLabelText}>
                          Allergies
                        </Text>
                      </View>
                      <Text style={styles.allergySectionBody}>
                        {s.allergies_description}
                      </Text>
                    </View>
                  ) : null}
                  {s.has_medical_conditions === "yes" &&
                  s.medical_conditions_description ? (
                    <View style={styles.allergySection}>
                      <View style={styles.allergySectionLabel}>
                        <Ionicons
                          name="pulse-outline"
                          size={12}
                          color="#b45309"
                        />
                        <Text
                          style={[
                            styles.allergySectionLabelText,
                            { color: "#b45309" },
                          ]}
                        >
                          Medical Conditions
                        </Text>
                      </View>
                      <Text style={styles.allergySectionBody}>
                        {s.medical_conditions_description}
                      </Text>
                    </View>
                  ) : null}
                  {s.has_emergency_medications === "yes" &&
                  s.emergency_medications_description ? (
                    <View style={styles.allergySection}>
                      <View style={styles.allergySectionLabel}>
                        <Ionicons
                          name="bandage-outline"
                          size={12}
                          color="#7c3aed"
                        />
                        <Text
                          style={[
                            styles.allergySectionLabelText,
                            { color: "#7c3aed" },
                          ]}
                        >
                          Emergency Medications
                        </Text>
                      </View>
                      <Text style={styles.allergySectionBody}>
                        {s.emergency_medications_description}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Activity preferences sheet (home quick-access) */}
      <ActivityPreferencesSheet
        ref={homePrefsSheetRef}
        activityId={selectedPrefsActivityId}
        attendingStudents={todayStudents.map((s) => ({
          student_id: s.student_id,
          name: s.name,
          profile_image_url: s.profile_image_url,
        }))}
      />

      <StaffSchoolDayFoodPrefsSheet
        ref={schoolDayFoodSheetRef}
        prefs={schoolDayFoodPrefs}
        loading={schoolDayFoodLoading}
      />

      <StaffAllBirthdaysSheet
        ref={allBirthdaysSheetRef}
        birthdays={allBirthdays}
        loading={birthdaysLoading}
      />

      <StaffWeekActivityPrefsSheet
        ref={weekActivityPrefsSheetRef}
        activities={activities}
        groups={weekActivityPrefGroups}
        loading={activitiesLoading || weekActivityPrefsLoading}
      />

      {showConferenceSection && userId && (
        <StaffConferenceBookingsSheet
          ref={ptcBookingsSheetRef}
          bookings={conferenceBookings}
          currentTeacherId={userId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0DFC4",
  },
  safeArea: {
    flex: 1,
  },

  // Activities quick-access
  activitiesSection: {
    paddingTop: 18,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 8,
  },
  activitiesSectionTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  activitiesEmpty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  activityCardsRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 12,
  },
  activityCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  activityThumb: {
    width: "100%",
    height: 88,
  },
  activityThumbPlaceholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  activityCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1f2937",
    paddingHorizontal: 10,
    paddingTop: 8,
    lineHeight: 17,
  },
  activityCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  prefChipsRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
  },
  prefChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  prefChipText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
  },

  addStudentSheetContent: {
    paddingBottom: 32,
  },

  // Content card
  content: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  sectionCount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#6b7280",
  },
  teacherSection: {
    marginBottom: 16,
  },
  teacherSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  teacherSectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
  },
  teacherSectionCount: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  dateNavActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },
  addStudentBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavBtn: {
    padding: 4,
  },
  dateNavLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#374151",
  },
  todayChip: {
    backgroundColor: Brand.sage700 + "20",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  todayChipText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  pickupReminderCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  pickupReminderIconWrap: {
    marginTop: 1,
  },
  pickupReminderContent: {
    flex: 1,
    gap: 4,
  },
  pickupReminderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickupReminderTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#92400e",
  },
  pickupReminderBadge: {
    backgroundColor: "#fde68a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  pickupReminderBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#92400e",
  },
  pickupReminderBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#b45309",
    lineHeight: 18,
  },
  pickupReminderHint: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#d97706",
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
    padding: 0,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: BottomTabInset + 16,
  },

  // Student row
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarCircleImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarCircleText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#ffffff",
  },
  allergyBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  studentRowInfo: {
    flex: 1,
    gap: 5,
  },
  studentNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    flexShrink: 1,
  },
  careChipsRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  careChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  careChipLogged: {
    backgroundColor: "#dcfce7",
  },
  careChipAbsent: {
    backgroundColor: "#fee2e2",
  },
  careChipUnlogged: {
    backgroundColor: "#f3f4f6",
  },
  careChipIcon: {
    fontSize: 10,
  },
  careChipText: {
    fontSize: 11,
  },
  careChipTextLogged: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#15803d",
  },
  careChipTextAbsent: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#b91c1c",
  },
  careChipTextUnlogged: {
    fontFamily: FontFamilies.body,
    color: "#9ca3af",
  },

  // Skeleton
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 44,
    paddingBottom: 56,
    gap: 10,
  },
  emptyStateTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  emptyStateSub: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },

  // Avatar bottom sheet
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 4,
  },
  sheetAvatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sheetAvatarCircleImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  sheetAvatarCircleText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 22,
    color: Brand.sage700,
  },
  sheetAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sheetItemText: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },

  // Quick action sheet
  actionSheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 8,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    width: "47%",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
    minHeight: 88,
    justifyContent: "center",
  },
  tileActive: {
    backgroundColor: Brand.sage700,
  },
  tileIcon: {
    fontSize: 24,
  },
  tileLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    lineHeight: 16,
  },
  tileLabelActive: {
    color: "#ffffff",
  },
  actionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 2,
  },
  actionAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  actionAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  actionAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
  actionSheetName: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
  },
  actionAllergyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  actionAllergyText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#dc2626",
  },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  profileLinkText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },

  // Pickup button / status
  pickupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Brand.sage700,
    backgroundColor: "#F2F7F3",
    marginTop: 4,
  },
  pickupBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  pickedUpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  pickedUpText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
    flex: 1,
  },

  // Pickup sheets
  pickupSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pickupSheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  pickupSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pickupSlotText: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },
  pickupRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pickupRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.sage700,
  },
  pickupConfirmBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupConfirmText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },

  // Care log history in action sheet
  careHistorySection: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    gap: 4,
  },
  careHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  careHistoryIcon: {
    fontSize: 13,
  },
  careHistoryLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  careHistoryTime: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },

  // Allergies sheet
  allergySheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  allergyCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 10,
  },
  allergyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  allergyAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  allergyAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  allergyAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#ffffff",
  },
  allergyCardName: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  allergySection: {
    gap: 4,
  },
  allergySectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  allergySectionLabelText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#dc2626",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  allergySectionBody: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },
});
