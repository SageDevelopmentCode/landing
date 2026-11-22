// Staff Home data + handlers. All Supabase reads/writes for the screen live
// here; the Garden UI (./garden) only reacts to the { ok } results these
// return. Logic is carried over from the original app/(staff)/home.tsx — the
// write paths, payloads and Discord notifications are unchanged. Differences:
//   • every loader/write reports { ok } instead of failing silently
//   • a per-student lock (pending) replaces the single global saving lock
//   • writes take the student explicitly instead of reading selectedStudent
import type { StaffConferenceBookingsSheetRef } from "@/components/StaffConferenceBookingsSheet";
import { Activity, getActivities } from "@/lib/activities-actions";
import {
  fetchTourBookingsForDate,
  type TourBooking,
} from "@/lib/admin-actions";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { getPublishedNewsletters, type ParentNewsletterListItem } from "@/lib/newsletters-actions";
import { groupStudentsByTeacher } from "@/lib/group-by-teacher";
import {
  getChicagoDateTimeParts,
  isSchoolYearPickupReminderWindow,
  isStudentAwaitingPickup,
} from "@/lib/pickup-reminder";
import {
  fetchSchoolYearHiddenStudentsForDate,
  fetchSchoolYearTodayStudents,
  type AttendanceSlim,
  type SchoolYearTodayStudent,
} from "@/lib/school-year-today-students";
import {
  fetchAllStaffConferenceBookings,
  isConferenceTeacher,
  type StaffConferenceBooking,
} from "@/lib/staff-conference-bookings";
import {
  fetchStaffSchoolDayFoodPrefs,
  fetchStaffWeekActivityPrefs,
  type StaffActivityPrefGroup,
  type StaffSchoolDayFoodPref,
} from "@/lib/staff-food-and-activity-prefs";
import {
  fetchStaffBirthdays,
  getUpcomingBirthdays,
  type StaffBirthday,
} from "@/lib/staff-upcoming-birthdays";
import { useTeacherFavoritesSeen } from "@/features/teacher-favorites/useTeacherFavoritesSeen";
import { getStudentDisplayName } from "@/lib/student-display-name";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AFTERCARE_SLIM_SELECT,
  SY_ATTENDANCE_SLIM_SELECT,
  buildTeacherRosterSummaries,
  fetchUnpaidStudentsForDate,
  getInitials,
  getStudentDayStatus,
  isStudentCheckedIn,
  parseYMD,
  shortName,
  toYMD,
  type AllergyDetail,
  type PickupPerson,
  type StaffUpcomingCalendarEvent,
  type StudentStatusFilter,
} from "./staffHomeUtils";
import { fetchPickupPersons, writePickup, writeSchoolYearPresent } from "./attendanceWrites";

export type WriteResult = { ok: boolean; skipped?: boolean; canceled?: boolean };
export type LoadResult = { ok: boolean };

export type SavingKey =
  | "aftercare"
  | "school_year"
  | "school_year_absent"
  | "school_year_friday"
  | "school_year_friday_absent";

const OK: WriteResult = { ok: true };
const SKIP: WriteResult = { ok: false, skipped: true };
const FAIL: WriteResult = { ok: false };

export function useStaffHome() {
  const router = useRouter();
  // Teacher Favorites section "New!" badge (device flag, re-read on focus).
  const { seen: teacherFavoritesSeen, open: openTeacherFavorites } =
    useTeacherFavoritesSeen("staff");

  // ── Profile ──────────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");
  const [initials, setInitials] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const avatarSheetRef = useRef<BottomSheetModal>(null);

  // ── Day + roster ─────────────────────────────────────────────────────────────
  const todayActual = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(todayActual);
  const selectedIsFriday = parseYMD(selectedDate).getDay() === 5;
  const [todayStudents, setTodayStudents] = useState<SchoolYearTodayStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");

  // Per-student write lock: studentId → which write is running.
  const [pending, setPending] = useState<Record<string, SavingKey>>({});
  const pendingRef = useRef<Record<string, SavingKey>>({});
  const setPendingKey = useCallback((id: string, key: SavingKey | null) => {
    const next = { ...pendingRef.current };
    if (key) next[id] = key;
    else delete next[id];
    pendingRef.current = next;
    setPending(next);
  }, []);

  // Student quick-action sheet
  const studentActionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<SchoolYearTodayStudent | null>(null);

  // ── Activities + prefs ───────────────────────────────────────────────────────
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(false);
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
  const [weekActivityPrefsLoading, setWeekActivityPrefsLoading] = useState(true);
  const schoolDayFoodSheetRef = useRef<BottomSheetModal>(null);
  const weekActivityPrefsSheetRef = useRef<BottomSheetModal>(null);
  const allBirthdaysSheetRef = useRef<BottomSheetModal>(null);
  const eventSheetRef = useRef<BottomSheetModal>(null);

  const weekActivityPrefBadge = useMemo(() => {
    const signed = weekActivityPrefGroups.reduce(
      (total, group) => total + group.signedUpCount,
      0,
    );
    const expected = weekActivityPrefGroups.reduce(
      (total, group) => total + group.totalCount,
      0,
    );
    return `${signed}/${expected}`;
  }, [weekActivityPrefGroups]);

  // ── Add student sheet ────────────────────────────────────────────────────────
  const addStudentSheetRef = useRef<BottomSheetModal>(null);
  const [unpaidStudents, setUnpaidStudents] = useState<SchoolYearTodayStudent[]>([]);
  const [hiddenStudents, setHiddenStudents] = useState<SchoolYearTodayStudent[]>([]);
  const [unpaidStudentsLoading, setUnpaidStudentsLoading] = useState(false);
  const [addStudentSearch, setAddStudentSearch] = useState("");
  const [rosterActionStudentId, setRosterActionStudentId] = useState<string | null>(null);

  // ── Allergies sheet ──────────────────────────────────────────────────────────
  const allergiesSheetRef = useRef<BottomSheetModal>(null);
  const [allergyDetails, setAllergyDetails] = useState<AllergyDetail[]>([]);
  const [allergyDetailsLoading, setAllergyDetailsLoading] = useState(false);

  // ── Pickup sheet ─────────────────────────────────────────────────────────────
  const pickupSheetRef = useRef<BottomSheetModal>(null);
  const [pickupStudent, setPickupStudent] = useState<SchoolYearTodayStudent | null>(null);
  const [pickupPersons, setPickupPersons] = useState<PickupPerson[]>([]);
  const [pickupPersonsLoading, setPickupPersonsLoading] = useState(false);
  const [selectedPickupPerson, setSelectedPickupPerson] = useState<PickupPerson | null>(null);
  const [pickupSaving, setPickupSaving] = useState(false);

  // ── Conferences (conference teachers only) ───────────────────────────────────
  const ptcBookingsSheetRef = useRef<StaffConferenceBookingsSheetRef>(null);
  const [conferenceBookings, setConferenceBookings] = useState<StaffConferenceBooking[]>([]);
  const [conferenceBookingsLoading, setConferenceBookingsLoading] = useState(false);
  const showConferenceSection = isConferenceTeacher(userId);

  // ── Birthdays / events / tours ───────────────────────────────────────────────
  const [allBirthdays, setAllBirthdays] = useState<StaffBirthday[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);
  const [birthdaysError, setBirthdaysError] = useState(false);

  // ── Newsletters (latest published, same rail as the parent Home) ─────────────
  const [homeNewsletters, setHomeNewsletters] = useState<ParentNewsletterListItem[]>([]);
  const [newslettersLoading, setNewslettersLoading] = useState(true);
  const [newslettersError, setNewslettersError] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<StaffUpcomingCalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<StaffUpcomingCalendarEvent | null>(null);
  const [todayTours, setTodayTours] = useState<TourBooking[]>([]);

  const canSeeTourBanner = role === "teacher" || role === "super_admin";
  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(allBirthdays), [allBirthdays]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const id = setInterval(() => {
      const { hour, dayOfWeek } = getChicagoDateTimeParts();
      if (dayOfWeek >= 1 && dayOfWeek <= 4 && hour >= 14) update();
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setStatusFilter("all");
  }, [selectedDate]);

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
        if (data?.profile_image_url) setProfileImageUrl(data.profile_image_url);
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
        if (data?.role) setRole(data.role);
      } catch (err) {
        notifyError("staff-home-load-user", err);
      }
    }
    loadUser();
  }, []);

  const loadConferenceBookings = useCallback(
    async (opts?: { silent?: boolean }): Promise<LoadResult> => {
      if (!opts?.silent) setConferenceBookingsLoading(true);
      try {
        const rows = await fetchAllStaffConferenceBookings();
        setConferenceBookings(rows);
        return { ok: true };
      } catch (err) {
        notifyError("staff-home-ptc-bookings", err);
        if (!opts?.silent) setConferenceBookings([]);
        return { ok: false };
      } finally {
        if (!opts?.silent) setConferenceBookingsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!showConferenceSection || !userId) return;
    void loadConferenceBookings();
  }, [showConferenceSection, userId, loadConferenceBookings]);

  // ── Activities + pref counts ─────────────────────────────────────────────────
  const loadActivities = useCallback(
    async (opts?: { silent?: boolean }): Promise<{ ok: boolean; published: Activity[] }> => {
      if (!opts?.silent) setActivitiesLoading(true);
      try {
        const all = await getActivities();
        const published = all
          .filter(
            (a) =>
              a.status === "published" &&
              a.activity_date != null &&
              a.activity_date >= selectedDate,
          )
          .sort((a, b) => (a.activity_date ?? "").localeCompare(b.activity_date ?? ""));
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
            if (!counts[row.activity_id]) counts[row.activity_id] = { full: 0, nonFull: 0 };
            if (row.participation_level === "full") counts[row.activity_id].full++;
            else counts[row.activity_id].nonFull++;
          }
          setPrefCounts(counts);
        } else {
          setPrefCounts({});
        }
        setActivitiesError(false);
        return { ok: true, published };
      } catch (e) {
        notifyError("staff-home-activities", e);
        setActivitiesError(true);
        return { ok: false, published: [] };
      } finally {
        if (!opts?.silent) setActivitiesLoading(false);
      }
    },
    [selectedDate],
  );

  const loadWeekActivityPrefs = useCallback(
    async (weekActivities: { id: string; activity_date: string | null }[]): Promise<LoadResult> => {
      setWeekActivityPrefsLoading(true);
      try {
        const groups = await fetchStaffWeekActivityPrefs(weekActivities);
        setWeekActivityPrefGroups(groups);
        return { ok: true };
      } catch (e) {
        notifyError("staff-home-week-activity-prefs", e);
        setWeekActivityPrefGroups([]);
        return { ok: false };
      } finally {
        setWeekActivityPrefsLoading(false);
      }
    },
    [],
  );

  const loadSchoolDayFoodPrefs = useCallback(
    async (opts?: { silent?: boolean }): Promise<LoadResult> => {
      if (!opts?.silent) setSchoolDayFoodLoading(true);
      try {
        const prefs = await fetchStaffSchoolDayFoodPrefs();
        setSchoolDayFoodPrefs(prefs);
        return { ok: true };
      } catch (e) {
        notifyError("staff-home-school-day-food-prefs", e);
        setSchoolDayFoodPrefs([]);
        return { ok: false };
      } finally {
        if (!opts?.silent) setSchoolDayFoodLoading(false);
      }
    },
    [],
  );

  const loadAllActivityData = useCallback(async (): Promise<LoadResult> => {
    const r = await loadActivities();
    const p = await loadWeekActivityPrefs(
      r.published.map((a) => ({ id: a.id, activity_date: a.activity_date })),
    );
    return { ok: r.ok && p.ok };
  }, [loadActivities, loadWeekActivityPrefs]);

  useEffect(() => {
    void loadAllActivityData();
  }, [loadAllActivityData]);

  useEffect(() => {
    void loadSchoolDayFoodPrefs();
  }, [loadSchoolDayFoodPrefs]);

  // ── Today's students (refreshes on focus) ────────────────────────────────────
  const loadTodayStudents = useCallback(
    async (opts?: { silent?: boolean }): Promise<LoadResult> => {
      if (!opts?.silent) setStudentsLoading(true);
      try {
        const rows = await fetchSchoolYearTodayStudents(selectedDate);
        setTodayStudents(rows);
        setStudentsError(false);
        return { ok: true };
      } catch (e) {
        notifyError("staff-home-today-students", e);
        setStudentsError(true);
        return { ok: false };
      } finally {
        if (!opts?.silent) setStudentsLoading(false);
      }
    },
    [selectedDate],
  );

  const loadBirthdays = useCallback(async (opts?: { silent?: boolean }): Promise<LoadResult> => {
    if (!opts?.silent) setBirthdaysLoading(true);
    try {
      const rows = await fetchStaffBirthdays();
      setAllBirthdays(rows);
      setBirthdaysError(false);
      return { ok: true };
    } catch (e) {
      notifyError("staff-home-upcoming-birthdays", e);
      setAllBirthdays([]);
      setBirthdaysError(true);
      return { ok: false };
    } finally {
      if (!opts?.silent) setBirthdaysLoading(false);
    }
  }, []);

  const loadNewsletters = useCallback(async (opts?: { silent?: boolean }): Promise<LoadResult> => {
    if (!opts?.silent) setNewslettersLoading(true);
    try {
      setHomeNewsletters(await getPublishedNewsletters(5));
      setNewslettersError(false);
      return { ok: true };
    } catch (e) {
      notifyError("staff-home-newsletters", e);
      setNewslettersError(true);
      return { ok: false };
    } finally {
      setNewslettersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNewsletters();
  }, [loadNewsletters]);

  const openNewsletters = useCallback(() => {
    router.push("/(staff)/school-newsletters" as never);
  }, [router]);

  const loadUpcomingEvents = useCallback(async (opts?: { silent?: boolean }): Promise<LoadResult> => {
    if (!opts?.silent) setEventsLoading(true);
    try {
      const todayYmd = toYMD(new Date());
      const { data, error } = await supabase
        .schema("calendar")
        .from("events")
        .select(
          "id,title,event_date,is_all_day,start_time,end_time,color,category,description,location,attachment_links",
        )
        .gte("event_date", todayYmd)
        .order("event_date", { ascending: true })
        .limit(3);
      if (error) throw error;
      setUpcomingEvents(data ?? []);
      setEventsError(false);
      return { ok: true };
    } catch (e) {
      notifyError("staff-home-upcoming-events", e);
      setUpcomingEvents([]);
      setEventsError(true);
      return { ok: false };
    } finally {
      if (!opts?.silent) setEventsLoading(false);
    }
  }, []);

  const loadTodayTours = useCallback(async (): Promise<LoadResult> => {
    if (!canSeeTourBanner) {
      setTodayTours([]);
      return { ok: true };
    }
    try {
      const rows = await fetchTourBookingsForDate(todayActual);
      setTodayTours(rows);
      return { ok: true };
    } catch (e) {
      notifyError("staff-home-today-tours", e);
      setTodayTours([]);
      return { ok: false };
    }
  }, [canSeeTourBanner, todayActual]);

  useEffect(() => {
    void loadTodayTours();
  }, [loadTodayTours]);

  useFocusEffect(
    useCallback(() => {
      void loadTodayStudents();
      void loadBirthdays();
      void loadUpcomingEvents();
      void loadTodayTours();
    }, [loadTodayStudents, loadBirthdays, loadUpcomingEvents, loadTodayTours]),
  );

  /** Pull-to-refresh: re-runs every loader quietly (no skeleton flash). */
  const reload = useCallback(async (): Promise<LoadResult> => {
    try {
      const acts = await loadActivities({ silent: true });
      const results = await Promise.all([
        loadTodayStudents({ silent: true }),
        loadBirthdays({ silent: true }),
        loadNewsletters({ silent: true }),
        loadUpcomingEvents({ silent: true }),
        loadWeekActivityPrefs(
          acts.published.map((a) => ({ id: a.id, activity_date: a.activity_date })),
        ),
        loadSchoolDayFoodPrefs({ silent: true }),
        showConferenceSection
          ? loadConferenceBookings({ silent: true })
          : Promise.resolve({ ok: true }),
        loadTodayTours(),
      ]);
      return { ok: acts.ok && results.every((r) => r.ok) };
    } catch (e) {
      notifyError("staff-home-refresh", e);
      return { ok: false };
    }
  }, [
    loadActivities,
    loadTodayStudents,
    loadBirthdays,
    loadNewsletters,
    loadUpcomingEvents,
    loadWeekActivityPrefs,
    loadSchoolDayFoodPrefs,
    showConferenceSection,
    loadConferenceBookings,
    loadTodayTours,
  ]);

  // ── Profile image upload ─────────────────────────────────────────────────────
  async function handlePickImage(opts?: { onUploadStart?: () => void }): Promise<WriteResult> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return { ok: false, canceled: true };
    setUploadingImage(true);
    opts?.onUploadStart?.();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !userId) return FAIL;
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
      if (!uploadRes.ok) {
        notifyError("staff-home-profile-image", new Error(`Upload failed (${uploadRes.status})`));
        return FAIL;
      }
      const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${storagePath}`;
      const { error: rpcError } = await supabase.rpc("update_user_profile_image", {
        p_image_url: publicUrl,
      });
      if (rpcError) {
        notifyError("staff-home-profile-image", rpcError);
        return FAIL;
      }
      setProfileImageUrl(publicUrl);
      return OK;
    } catch (e) {
      notifyError("staff-home-profile-image", e);
      return FAIL;
    } finally {
      setUploadingImage(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getActiveAttendanceRecord(s: SchoolYearTodayStudent): AttendanceSlim | null {
    return selectedIsFriday ? s.schoolYearFieldFridayRecord : s.schoolYearRecord;
  }

  function patchStudentById(
    studentId: string,
    transform: (s: SchoolYearTodayStudent) => SchoolYearTodayStudent,
  ) {
    setTodayStudents((prev) => prev.map((s) => (s.student_id === studentId ? transform(s) : s)));
    setSelectedStudent((prev) => (prev?.student_id === studentId ? transform(prev) : prev));
    setPickupStudent((prev) => (prev?.student_id === studentId ? transform(prev) : prev));
  }

  function insertIntoRoster(merged: SchoolYearTodayStudent) {
    setTodayStudents((prev) => {
      const without = prev.filter((s) => s.student_id !== merged.student_id);
      return [...without, merged].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    });
    setHiddenStudents((prev) => prev.filter((s) => s.student_id !== merged.student_id));
  }

  // ── Sheets ───────────────────────────────────────────────────────────────────
  function openStudentActions(student: SchoolYearTodayStudent) {
    setSelectedStudent(student);
    studentActionSheetRef.current?.present();
  }

  async function openAddStudentSheet(): Promise<LoadResult> {
    setUnpaidStudents([]);
    setHiddenStudents([]);
    setAddStudentSearch("");
    setUnpaidStudentsLoading(true);
    addStudentSheetRef.current?.present();
    const excludeIds = new Set(todayStudents.map((s) => s.student_id));
    try {
      const [unpaidRows, hiddenRows] = await Promise.all([
        fetchUnpaidStudentsForDate(selectedDate, excludeIds),
        fetchSchoolYearHiddenStudentsForDate(selectedDate),
      ]);
      setUnpaidStudents(unpaidRows);
      setHiddenStudents(hiddenRows);
      return { ok: true };
    } catch (e) {
      notifyError("staff-home-add-student-sheet", e);
      return { ok: false };
    } finally {
      setUnpaidStudentsLoading(false);
    }
  }

  async function openAllergiesSheet(): Promise<LoadResult> {
    setAllergyDetails([]);
    setAllergyDetailsLoading(true);
    allergiesSheetRef.current?.present();
    const allergyIds = todayStudents
      .filter((s) => s.has_allergies === "yes")
      .map((s) => s.student_id);
    if (allergyIds.length === 0) {
      setAllergyDetailsLoading(false);
      return { ok: true };
    }
    try {
      const { data, error } = await supabase
        .schema("admin")
        .from("students")
        .select(
          "id, child_legal_name, profile_image_url, allergies_description, has_medical_conditions, medical_conditions_description, has_emergency_medications, emergency_medications_description",
        )
        .in("id", allergyIds)
        .order("child_legal_name", { ascending: true });
      if (error) throw error;
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
      const nameById = new Map(todayStudents.map((s) => [s.student_id, s.name]));
      setAllergyDetails(
        ((data ?? []) as AllergyRaw[]).map((r) => ({
          student_id: r.id,
          name: nameById.get(r.id) ?? getStudentDisplayName(null, r.child_legal_name),
          profile_image_url: r.profile_image_url,
          allergies_description: r.allergies_description,
          has_medical_conditions: r.has_medical_conditions,
          medical_conditions_description: r.medical_conditions_description,
          has_emergency_medications: r.has_emergency_medications,
          emergency_medications_description: r.emergency_medications_description,
        })),
      );
      return { ok: true };
    } catch (e) {
      notifyError("staff-home-allergies", e);
      return { ok: false };
    } finally {
      setAllergyDetailsLoading(false);
    }
  }

  // ── Roster writes ────────────────────────────────────────────────────────────
  async function addStudentToRoster(student: SchoolYearTodayStudent): Promise<WriteResult> {
    if (rosterActionStudentId) return SKIP;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return FAIL;

    const isFriday = selectedIsFriday;
    const table = isFriday ? "school_year_field_friday_records" : "school_year_records";
    const recordKey = isFriday
      ? ("schoolYearFieldFridayRecord" as const)
      : ("schoolYearRecord" as const);
    const paidForDay = isFriday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;

    setRosterActionStudentId(student.student_id);
    try {
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
            checked_in: false,
            excluded_from_roster: false,
          },
          { onConflict: "student_id,date" },
        )
        .select(SY_ATTENDANCE_SLIM_SELECT)
        .single();
      if (error || !data) {
        notifyError("staff-home-add-student-roster", error);
        return FAIL;
      }
      insertIntoRoster({ ...student, [recordKey]: data as AttendanceSlim });
      addStudentSheetRef.current?.dismiss();
      return OK;
    } finally {
      setRosterActionStudentId(null);
    }
  }

  async function restoreHiddenStudent(student: SchoolYearTodayStudent): Promise<WriteResult> {
    if (rosterActionStudentId) return SKIP;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return FAIL;

    const isFriday = selectedIsFriday;
    const table = isFriday ? "school_year_field_friday_records" : "school_year_records";
    const recordKey = isFriday
      ? ("schoolYearFieldFridayRecord" as const)
      : ("schoolYearRecord" as const);
    const existing = getActiveAttendanceRecord(student);
    const paidForDay = isFriday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;

    setRosterActionStudentId(student.student_id);
    try {
      const { data, error } = await supabase
        .schema("attendance")
        .from(table)
        .upsert(
          {
            student_id: student.student_id,
            date: selectedDate,
            recorded_by: user.id,
            paid_for_day: existing?.paid_for_day ?? paidForDay,
            marked_absent: existing?.marked_absent ?? false,
            checked_in: existing?.checked_in ?? false,
            excluded_from_roster: false,
          },
          { onConflict: "student_id,date" },
        )
        .select(SY_ATTENDANCE_SLIM_SELECT)
        .single();
      if (error || !data) {
        notifyError("staff-home-restore-hidden-student", error);
        return FAIL;
      }
      insertIntoRoster({ ...student, [recordKey]: data as AttendanceSlim });
      addStudentSheetRef.current?.dismiss();
      return OK;
    } finally {
      setRosterActionStudentId(null);
    }
  }

  async function hideStudentFromRoster(student: SchoolYearTodayStudent): Promise<WriteResult> {
    if (rosterActionStudentId || pendingRef.current[student.student_id]) return SKIP;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return FAIL;

    const isFriday = selectedIsFriday;
    const table = isFriday ? "school_year_field_friday_records" : "school_year_records";
    const existing = getActiveAttendanceRecord(student);
    const paidForDay = isFriday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;

    setRosterActionStudentId(student.student_id);
    try {
      const { error } = await supabase.schema("attendance").from(table).upsert(
        {
          student_id: student.student_id,
          date: selectedDate,
          recorded_by: user.id,
          paid_for_day: existing?.paid_for_day ?? paidForDay,
          marked_absent: existing?.marked_absent ?? false,
          checked_in: existing?.checked_in ?? false,
          excluded_from_roster: true,
        },
        { onConflict: "student_id,date" },
      );
      if (error) {
        notifyError("staff-home-hide-student-roster", error);
        return FAIL;
      }
      setTodayStudents((prev) => prev.filter((s) => s.student_id !== student.student_id));
      studentActionSheetRef.current?.dismiss();
      setSelectedStudent(null);
      return OK;
    } finally {
      setRosterActionStudentId(null);
    }
  }

  // ── Attendance writes ────────────────────────────────────────────────────────

  /** Row chip: mark the student present for the selected day. */
  async function markStudentPresent(student: SchoolYearTodayStudent): Promise<WriteResult> {
    if (pendingRef.current[student.student_id]) return SKIP;
    const record = getActiveAttendanceRecord(student);
    if (isStudentCheckedIn(record)) return SKIP;

    const isFriday = selectedIsFriday;
    const savingKey: SavingKey = isFriday ? "school_year_friday" : "school_year";
    setPendingKey(student.student_id, savingKey);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return FAIL;

      const table = isFriday ? "school_year_field_friday_records" : "school_year_records";
      const recordKey = isFriday
        ? ("schoolYearFieldFridayRecord" as const)
        : ("schoolYearRecord" as const);
      const paidForDay = isFriday
        ? student.hasSchoolYearFridayEnrollment
        : student.hasSchoolYearEnrollment;
      const discordType = isFriday
        ? "school_year_field_friday_checked_in"
        : "school_year_attendance_marked";
      const errorContext = isFriday
        ? "staff-home-school-year-friday-mark-present"
        : "staff-home-school-year-mark-present";

      const { data, error } = record?.marked_absent
        ? await supabase
            .schema("attendance")
            .from(table)
            .update({ marked_absent: false, checked_in: true, excluded_from_roster: false })
            .eq("id", record.id)
            .select(SY_ATTENDANCE_SLIM_SELECT)
            .single()
        : await supabase
            .schema("attendance")
            .from(table)
            .upsert(
              {
                student_id: student.student_id,
                date: selectedDate,
                recorded_by: user.id,
                paid_for_day: paidForDay,
                marked_absent: false,
                checked_in: true,
                excluded_from_roster: false,
              },
              { onConflict: "student_id,date" },
            )
            .select(SY_ATTENDANCE_SLIM_SELECT)
            .single();
      if (error || !data) {
        notifyError(errorContext, error);
        return FAIL;
      }
      patchStudentById(student.student_id, (s) => ({
        ...s,
        [recordKey]: data as AttendanceSlim,
      }));
      notifyDiscord({
        type: discordType,
        data: { studentName: student.name, date: selectedDate },
      });
      return OK;
    } finally {
      setPendingKey(student.student_id, null);
    }
  }

  async function toggleAftercareAttendance(student: SchoolYearTodayStudent): Promise<WriteResult> {
    if (pendingRef.current[student.student_id]) return SKIP;
    setPendingKey(student.student_id, "aftercare");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return FAIL;
      const existing = student.aftercareRecord;

      if (existing) {
        patchStudentById(student.student_id, (s) => ({ ...s, aftercareRecord: null }));
        const { error } = await supabase
          .schema("attendance")
          .from("aftercare_records")
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError("staff-home-aftercare-toggle", error);
          patchStudentById(student.student_id, (s) => ({ ...s, aftercareRecord: existing }));
          return FAIL;
        }
        notifyDiscord({
          type: "aftercare_checked_out",
          data: { studentName: student.name, date: selectedDate },
        });
        return OK;
      }

      const { data, error } = await supabase
        .schema("attendance")
        .from("aftercare_records")
        .upsert(
          {
            student_id: student.student_id,
            date: selectedDate,
            recorded_by: user.id,
            paid_for_day: student.hasAftercareEnrollment,
          },
          { onConflict: "student_id,date" },
        )
        .select(AFTERCARE_SLIM_SELECT)
        .single();
      if (error || !data) {
        notifyError("staff-home-aftercare-toggle", error);
        return FAIL;
      }
      patchStudentById(student.student_id, (s) => ({
        ...s,
        aftercareRecord: {
          ...(data as Omit<AttendanceSlim, "marked_absent">),
          marked_absent: false,
        },
      }));
      notifyDiscord({
        type: "aftercare_checked_in",
        data: { studentName: student.name, date: selectedDate },
      });
      return OK;
    } finally {
      setPendingKey(student.student_id, null);
    }
  }

  /**
   * Present toggle shared by the school-year and Field Friday tiles. Same three
   * branches as before: checked in → delete; absent → flip to present; else upsert.
   */
  async function togglePresent(
    student: SchoolYearTodayStudent,
    friday: boolean,
  ): Promise<WriteResult> {
    if (pendingRef.current[student.student_id]) return SKIP;
    const savingKey: SavingKey = friday ? "school_year_friday" : "school_year";
    setPendingKey(student.student_id, savingKey);
    const table = friday ? "school_year_field_friday_records" : "school_year_records";
    const recordKey = friday
      ? ("schoolYearFieldFridayRecord" as const)
      : ("schoolYearRecord" as const);
    const existing = friday ? student.schoolYearFieldFridayRecord : student.schoolYearRecord;
    const errorContext = friday
      ? "staff-home-school-year-friday-toggle"
      : "staff-home-school-year-toggle";
    const markedType = friday
      ? "school_year_field_friday_checked_in"
      : "school_year_attendance_marked";
    const removedType = friday
      ? "school_year_field_friday_checked_out"
      : "school_year_attendance_removed";
    const paidForDay = friday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return FAIL;

      if (existing && isStudentCheckedIn(existing)) {
        patchStudentById(student.student_id, (s) => ({ ...s, [recordKey]: null }));
        const { error } = await supabase
          .schema("attendance")
          .from(table)
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError(errorContext, error);
          patchStudentById(student.student_id, (s) => ({ ...s, [recordKey]: existing }));
          return FAIL;
        }
        notifyDiscord({
          type: removedType,
          data: { studentName: student.name, date: selectedDate },
        });
        return OK;
      }

      const { data, error } = await writeSchoolYearPresent(table, {
        studentId: student.student_id,
        date: selectedDate,
        userId: user.id,
        paidForDay,
        existing,
        select: SY_ATTENDANCE_SLIM_SELECT,
      });
      if (error || !data) {
        notifyError(errorContext, error);
        return FAIL;
      }
      patchStudentById(student.student_id, (s) => ({
        ...s,
        [recordKey]: data as AttendanceSlim,
      }));
      notifyDiscord({
        type: markedType,
        data: { studentName: student.name, date: selectedDate },
      });
      return OK;
    } finally {
      setPendingKey(student.student_id, null);
    }
  }

  /** Absent toggle shared by the school-year and Field Friday tiles. */
  async function toggleAbsent(
    student: SchoolYearTodayStudent,
    friday: boolean,
  ): Promise<WriteResult> {
    if (pendingRef.current[student.student_id]) return SKIP;
    const savingKey: SavingKey = friday ? "school_year_friday_absent" : "school_year_absent";
    setPendingKey(student.student_id, savingKey);
    const table = friday ? "school_year_field_friday_records" : "school_year_records";
    const recordKey = friday
      ? ("schoolYearFieldFridayRecord" as const)
      : ("schoolYearRecord" as const);
    const existing = friday ? student.schoolYearFieldFridayRecord : student.schoolYearRecord;
    const errorContext = friday
      ? "staff-home-school-year-friday-absent"
      : "staff-home-school-year-absent";
    const absentType = friday
      ? "school_year_field_friday_absent"
      : "school_year_attendance_absent";
    const removedType = friday
      ? "school_year_field_friday_absent_removed"
      : "school_year_attendance_absent_removed";
    const paidForDay = friday
      ? student.hasSchoolYearFridayEnrollment
      : student.hasSchoolYearEnrollment;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return FAIL;

      if (existing?.marked_absent) {
        patchStudentById(student.student_id, (s) => ({ ...s, [recordKey]: null }));
        const { error } = await supabase
          .schema("attendance")
          .from(table)
          .delete()
          .eq("id", existing.id);
        if (error) {
          notifyError(errorContext, error);
          patchStudentById(student.student_id, (s) => ({ ...s, [recordKey]: existing }));
          return FAIL;
        }
        notifyDiscord({
          type: removedType,
          data: { studentName: student.name, date: selectedDate },
        });
        return OK;
      }

      const { data, error } = existing
        ? await supabase
            .schema("attendance")
            .from(table)
            .update({ marked_absent: true, checked_in: false })
            .eq("id", existing.id)
            .select(SY_ATTENDANCE_SLIM_SELECT)
            .single()
        : await supabase
            .schema("attendance")
            .from(table)
            .upsert(
              {
                student_id: student.student_id,
                date: selectedDate,
                recorded_by: user.id,
                paid_for_day: paidForDay,
                marked_absent: true,
                checked_in: false,
                excluded_from_roster: false,
              },
              { onConflict: "student_id,date" },
            )
            .select(SY_ATTENDANCE_SLIM_SELECT)
            .single();
      if (error || !data) {
        notifyError(errorContext, error);
        return FAIL;
      }
      patchStudentById(student.student_id, (s) => ({
        ...s,
        [recordKey]: data as AttendanceSlim,
      }));
      notifyDiscord({
        type: absentType,
        data: { studentName: student.name, date: selectedDate },
      });
      return OK;
    } finally {
      setPendingKey(student.student_id, null);
    }
  }

  // ── Pickup ───────────────────────────────────────────────────────────────────
  async function openPickup(student: SchoolYearTodayStudent): Promise<LoadResult> {
    const record = getActiveAttendanceRecord(student);
    if (!record || record.marked_absent || !record.checked_in) return { ok: true };
    setPickupStudent(student);
    setPickupPersons([]);
    setSelectedPickupPerson(null);
    setPickupPersonsLoading(true);
    pickupSheetRef.current?.present();

    const res = await fetchPickupPersons(student.student_id);
    setPickupPersons(res.persons);
    if (res.persons.length === 1) setSelectedPickupPerson(res.persons[0]);
    setPickupPersonsLoading(false);
    if (!res.ok) {
      notifyError("staff-home-pickup-persons", res.error);
      return { ok: false };
    }
    return { ok: true };
  }

  async function confirmPickup(): Promise<WriteResult> {
    const student = pickupStudent;
    const person = selectedPickupPerson;
    if (!student || !person || pickupSaving) return SKIP;
    const record = getActiveAttendanceRecord(student);
    if (!record || record.marked_absent) return SKIP;

    setPickupSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return FAIL;

      const table = selectedIsFriday ? "school_year_field_friday_records" : "school_year_records";
      const paidForDay = selectedIsFriday
        ? student.hasSchoolYearFridayEnrollment
        : student.hasSchoolYearEnrollment;

      // Only the pickup columns change on an existing record, so "Checked In
      // By" (recorded_by) keeps the staff member who checked the child in.
      const { data, error } = await writePickup(table, {
        studentId: student.student_id,
        date: selectedDate,
        userId: user.id,
        paidForDay,
        existing: record,
        person,
        select: SY_ATTENDANCE_SLIM_SELECT,
      });

      if (error || !data) {
        notifyError("staff-home-pickup", error);
        return FAIL;
      }
      patchStudentById(student.student_id, (s) =>
        selectedIsFriday
          ? {
              ...s,
              schoolYearFieldFridayRecord: {
                ...s.schoolYearFieldFridayRecord!,
                ...(data as Partial<AttendanceSlim>),
              },
            }
          : {
              ...s,
              schoolYearRecord: {
                ...s.schoolYearRecord!,
                ...(data as Partial<AttendanceSlim>),
              },
            },
      );
      notifyDiscord({
        type: selectedIsFriday
          ? "school_year_field_friday_pickup_recorded"
          : "school_year_pickup_recorded",
        data: {
          studentName: student.name,
          date: selectedDate,
          pickedUpBy: person.name,
          relationship: person.relationship,
        },
      });
      pickupSheetRef.current?.dismiss();
      return OK;
    } finally {
      setPickupSaving(false);
    }
  }

  function resetPickupSheet() {
    setPickupPersons([]);
    setSelectedPickupPerson(null);
    setPickupSaving(false);
    setPickupStudent(null);
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  function statusPriority(s: SchoolYearTodayStudent): number {
    const record = getActiveAttendanceRecord(s);
    if (!record || !record.checked_in) return 0;
    if (record.picked_up_by_name) return 2;
    return 1;
  }

  const statusCounts = useMemo(() => {
    const counts = { unmarked: 0, present: 0, picked_up: 0, absent: 0 };
    for (const student of todayStudents) {
      counts[getStudentDayStatus(student, selectedIsFriday)]++;
    }
    return counts;
  }, [todayStudents, selectedIsFriday]);

  const filteredStudents = useMemo(() => {
    if (statusFilter === "all") return todayStudents;
    return todayStudents.filter(
      (student) => getStudentDayStatus(student, selectedIsFriday) === statusFilter,
    );
  }, [todayStudents, statusFilter, selectedIsFriday]);

  const teacherSections = groupStudentsByTeacher(filteredStudents, statusPriority);

  const teacherRosterSummaries = useMemo(
    () => buildTeacherRosterSummaries(todayStudents, selectedIsFriday),
    [todayStudents, selectedIsFriday],
  );

  const showPickupReminder =
    selectedDate === todayActual && !selectedIsFriday && isSchoolYearPickupReminderWindow(now);

  const unpickedStudents = showPickupReminder
    ? todayStudents.filter((s) => isStudentAwaitingPickup(s.schoolYearRecord))
    : [];

  const unpickedNamePreview = (() => {
    const names = unpickedStudents.map((s) => shortName(s.name));
    if (names.length <= 5) return names.join(", ");
    return `${names.slice(0, 5).join(", ")} +${names.length - 5} more`;
  })();

  const showTourBanner = canSeeTourBanner && selectedDate === todayActual && todayTours.length > 0;

  const todayToursSummary = useMemo(() => {
    if (todayTours.length <= 3) {
      return todayTours
        .map((t) => {
          const lastInitial = t.last_name?.[0] ? ` ${t.last_name[0]}.` : "";
          return `${t.tour_time} · ${t.first_name}${lastInitial}`;
        })
        .join("\n");
    }
    const times = todayTours.map((t) => t.tour_time).join(", ");
    return `${todayTours.length} tours: ${times}`;
  }, [todayTours]);

  const allergyCount = todayStudents.filter((s) => s.has_allergies === "yes").length;

  return {
    router,
    // newsletters
    homeNewsletters,
    newslettersLoading,
    newslettersError,
    openNewsletters,
    // teacher favorites
    teacherFavoritesSeen,
    openTeacherFavorites,
    // profile
    fullName,
    firstName,
    role,
    initials,
    profileImageUrl,
    userId,
    uploadingImage,
    avatarSheetRef,
    handlePickImage,
    signOut,
    // day + roster
    todayActual,
    selectedDate,
    setSelectedDate,
    selectedIsFriday,
    todayStudents,
    studentsLoading,
    studentsError,
    statusFilter,
    setStatusFilter,
    statusCounts,
    filteredStudents,
    teacherSections,
    teacherRosterSummaries,
    pending,
    getActiveAttendanceRecord,
    loadTodayStudents,
    // student sheet
    studentActionSheetRef,
    selectedStudent,
    setSelectedStudent,
    openStudentActions,
    markStudentPresent,
    togglePresent,
    toggleAbsent,
    toggleAftercareAttendance,
    hideStudentFromRoster,
    // add student
    addStudentSheetRef,
    unpaidStudents,
    hiddenStudents,
    unpaidStudentsLoading,
    addStudentSearch,
    setAddStudentSearch,
    rosterActionStudentId,
    openAddStudentSheet,
    addStudentToRoster,
    restoreHiddenStudent,
    // allergies
    allergiesSheetRef,
    allergyDetails,
    allergyDetailsLoading,
    allergyCount,
    openAllergiesSheet,
    // pickup
    pickupSheetRef,
    pickupStudent,
    pickupPersons,
    pickupPersonsLoading,
    selectedPickupPerson,
    setSelectedPickupPerson,
    pickupSaving,
    openPickup,
    confirmPickup,
    resetPickupSheet,
    // alerts
    unpickedStudents,
    unpickedNamePreview,
    showTourBanner,
    todayTours,
    todayToursSummary,
    // activities + prefs
    activities,
    activitiesLoading,
    activitiesError,
    prefCounts,
    selectedPrefsActivityId,
    setSelectedPrefsActivityId,
    homePrefsSheetRef,
    loadAllActivityData,
    schoolDayFoodPrefs,
    schoolDayFoodLoading,
    schoolDayFoodSheetRef,
    weekActivityPrefGroups,
    weekActivityPrefsLoading,
    weekActivityPrefsSheetRef,
    weekActivityPrefBadge,
    // conferences
    showConferenceSection,
    conferenceBookings,
    conferenceBookingsLoading,
    ptcBookingsSheetRef,
    // events + birthdays
    upcomingEvents,
    eventsLoading,
    eventsError,
    loadUpcomingEvents,
    selectedEvent,
    setSelectedEvent,
    eventSheetRef,
    allBirthdays,
    upcomingBirthdays,
    birthdaysLoading,
    birthdaysError,
    loadBirthdays,
    allBirthdaysSheetRef,
    // refresh
    reload,
  };
}

export type StaffHome = ReturnType<typeof useStaffHome>;
