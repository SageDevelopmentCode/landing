// Shared parent Home state, data loading and handlers.
// Moved from (tabs)/home.tsx so the classic Home and the Garden preview
// variants run exactly the same logic.
import {
  markFallLeavesPlayed,
  shouldPlayFallLeaves,
} from "@/components/FallLeavesOverlay";
import type { DefaultSaveStatus } from "@/components/AutoFillPreferenceCard";
import { useAuth } from "@/contexts/AuthContext";
import { getChannels } from "@/lib/channel-actions";
import { computePaidDates } from "@/lib/compute-paid-dates";
import {
  computeHasUnsetActivityPreference,
  findFirstUnsetActivity,
} from "@/lib/activity-preferences";
import type { ParticipationLevel } from "@/lib/activity-preferences";
import {
  childHasVisibleUpcomingActivity,
  persistStudentDefaultPreference,
  type StudentDefaultPreference,
} from "@/lib/default-preferences";
import { getActivities, type Activity } from "@/lib/activities-actions";
import { notifyDiscord, notifyError } from "@/lib/discord";
import {
  getPublishedNewsletters,
  type ParentNewsletterListItem,
} from "@/lib/newsletters-actions";
import { fetchParentVisibleTeachers } from "@/lib/parent-visible-teachers";
import { fetchSchoolYearTeachersForStudents } from "@/lib/student-teacher-assignments";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList } from "react-native";
import {
  getSchoolYearTuitionStudentIds,
  getTuitionActionSubtext,
  needsSchoolYearTuitionAction,
  type PaidSchoolYearByStudent,
} from "@/lib/action-needed";
import { fetchConferenceContext } from "@/lib/conference-actions";
import {
  type ConferenceBookingRecord,
  type ConferenceStudentContext,
  type ConferenceTeacherDisplay,
} from "@/lib/parent-teacher-conference";
import type { PaidHomeschoolByStudent } from "@/lib/school-year-billing";
import { PARENT_CALENDAR_ADD_INTRO_SEEN } from "@/lib/parent-onboarding-flags";
import { useTeacherFavoritesSeen } from "@/features/teacher-favorites/useTeacherFavoritesSeen";
import {
  CHECKLIST_TASKS,
  DROP_OFF_SLOTS,
  buildDropInProgramByStudent,
  getInitials,
  toYMD,
} from "./constants";
import { fetchDMNotifs } from "./fetchDMNotifs";
import { INTRO_SLIDES, type IntroSlide } from "./IntroSlideshow";
import type {
  CalendarEvent,
  CommunityMessage,
  HomeApplicationRow,
  NotifItem,
  PendingPaymentPreview,
  TeacherSuggestion,
} from "./types";

export type HomeActionResult = { ok: boolean; error?: string; canceled?: boolean };

export type UseParentHomeOptions = {
  /** Auto-present the intro, fall leaves and calendar-add intro. Defaults to true. */
  autoPrompts?: boolean;
};

export function useParentHome({ autoPrompts = true }: UseParentHomeOptions = {}) {
  const router = useRouter();
  const { activityId: activityIdParam } = useLocalSearchParams<{ activityId?: string }>();
  const handledActivityNotificationRef = useRef<string | null>(null);
  const goToTuition = useCallback(() => {
    router.push("/(tabs)/tuition" as any);
  }, [router]);
  const { userId, effectiveParentId, parentViewUserId, isGrantee, ownerName, isReadOnlyPreview } = useAuth();
  const [firstName, setFirstName] = useState<string>("there");
  const [initials, setInitials] = useState<string>("");
  const [parentImageUrl, setParentImageUrl] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [students, setStudents] = useState<
    {
      id: string;
      child_legal_name: string;
      child_grade: string | null;
      profile_image_url: string | null;
    }[]
  >([]);
  const [teacherNameByStudentId, setTeacherNameByStudentId] = useState<
    Record<string, string>
  >({});
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pendingPayments, setPendingPayments] = useState<
    PendingPaymentPreview[]
  >([]);
  const [tuitionLoading, setTuitionLoading] = useState(true);
  const [uploadingParentImage, setUploadingParentImage] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<Set<string>>(
    new Set(),
  );
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [dropOffSlot, setDropOffSlot] = useState<string | null>(null);
  const [dropOffSaved, setDropOffSaved] = useState(false);
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [dropOffError, setDropOffError] = useState<string | null>(null);
  const [applications, setApplications] = useState<HomeApplicationRow[]>([]);
  const [paidWeeksByStudent, setPaidWeeksByStudent] = useState<
    Record<string, number[]>
  >({});
  const [paidAftercareByStudent, setPaidAftercareByStudent] = useState<
    Record<string, { months: string[]; days: string[] }>
  >({});
  const [paidFunFridayByStudent, setPaidFunFridayByStudent] = useState<
    Record<string, { months: string[]; fridays: string[] }>
  >({});

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const [communityMsgs, setCommunityMsgs] = useState<CommunityMessage[]>([]);
  const [communityIsMember, setCommunityIsMember] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityIdx, setCommunityIdx] = useState(0);
  const communityFade = useRef(new Animated.Value(1)).current;

  const [teachers, setTeachers] = useState<TeacherSuggestion[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  // Teacher Favorites section "New!" badge (device flag, re-read on focus).
  const { seen: teacherFavoritesSeen, open: openTeacherFavorites } =
    useTeacherFavoritesSeen("parent");
  const [startingConvTeacherId, setStartingConvTeacherId] = useState<
    string | null
  >(null);
  const [homeNewsletters, setHomeNewsletters] = useState<ParentNewsletterListItem[]>([]);
  const [newslettersLoading, setNewslettersLoading] = useState(true);
  const [hasActivityForPaidDay, setHasActivityForPaidDay] = useState(false);
  const [weekActivities, setWeekActivities] = useState<Activity[]>([]);
  const [weekActivitiesLoading, setWeekActivitiesLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const activityBannerRef = useRef<{
    activities: { id: string; activity_date: string | null }[];
    activityPrefs: { student_id: string; activity_id: string }[];
    studentDefaults: StudentDefaultPreference[];
    defaultPrefStudentIds: Set<string>;
    paidSets: Record<string, Set<string>>;
  } | null>(null);
  const [studentDefaults, setStudentDefaults] = useState<StudentDefaultPreference[]>([]);
  const [activityPaidSets, setActivityPaidSets] = useState<Record<string, Set<string>>>({});
  const [defaultSaveStatusByStudent, setDefaultSaveStatusByStudent] = useState<
    Record<string, DefaultSaveStatus>
  >({});
  const [paidSchoolYearByStudent, setPaidSchoolYearByStudent] =
    useState<PaidSchoolYearByStudent>({});
  const [paidSupplyFeeByStudent, setPaidSupplyFeeByStudent] = useState<
    Record<string, boolean>
  >({});
  const [paidHomeschoolByStudent, setPaidHomeschoolByStudent] =
    useState<PaidHomeschoolByStudent>({});
  const [conferenceBookingsByStudent, setConferenceBookingsByStudent] =
    useState<Record<string, ConferenceBookingRecord>>({});
  const [conferenceStudents, setConferenceStudents] = useState<
    ConferenceStudentContext[]
  >([]);
  const [conferenceTeachers, setConferenceTeachers] = useState<
    ConferenceTeacherDisplay[]
  >([]);
  const [conferenceTakenSlotKeys, setConferenceTakenSlotKeys] = useState<
    string[]
  >([]);
  const [conferenceContextLoading, setConferenceContextLoading] =
    useState(false);
  const [conferenceContextError, setConferenceContextError] = useState<
    string | null
  >(null);

  const applyConferenceBookingsFromRows = useCallback(
    (
      rows: Array<{
        student_id: string;
        teacher_id: string;
        conference_date: string;
        time_slot: string;
        format: string;
        accommodation_note: string | null;
      }> | null,
    ) => {
      const map: Record<string, ConferenceBookingRecord> = {};
      for (const row of rows ?? []) {
        map[row.student_id] = {
          teacherId: row.teacher_id,
          conferenceDate: row.conference_date,
          timeSlot: row.time_slot,
          format: row.format as "in_person" | "virtual",
          accommodationNote: row.accommodation_note ?? null,
        };
      }
      setConferenceBookingsByStudent(map);
    },
    [],
  );

  const loadConferenceBookingsFromSupabase = useCallback(async () => {
    if (!effectiveParentId) return;
    const { data } = await supabase
      .schema("teachers")
      .from("parent_teacher_conference_bookings")
      .select(
        "student_id, teacher_id, conference_date, time_slot, format, accommodation_note",
      )
      .eq("parent_id", effectiveParentId);
    applyConferenceBookingsFromRows(data);
  }, [effectiveParentId, applyConferenceBookingsFromRows]);

  const loadConferenceContext = useCallback(async (): Promise<boolean> => {
    if (!effectiveParentId) return false;
    setConferenceContextLoading(true);
    setConferenceContextError(null);
    try {
      const ctx = await fetchConferenceContext(effectiveParentId);
      setConferenceTeachers(ctx.conferenceTeachers);
      setConferenceStudents(ctx.conferenceStudents);
      setConferenceBookingsByStudent(ctx.bookingsByStudent);
      setConferenceTakenSlotKeys(ctx.takenSlotKeys);
      return true;
    } catch (err) {
      console.warn("[home] conference context load failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load conference data";
      setConferenceContextError(message);
      await loadConferenceBookingsFromSupabase();
      return false;
    } finally {
      setConferenceContextLoading(false);
    }
  }, [effectiveParentId, loadConferenceBookingsFromSupabase]);

  const openPtcSheet = useCallback(() => {
    if (isReadOnlyPreview) return;
    ptcSheetRef.current?.present();
    if (
      conferenceTeachers.length === 0 ||
      conferenceStudents.length === 0
    ) {
      void loadConferenceContext();
    }
  }, [
    isReadOnlyPreview,
    conferenceTeachers.length,
    conferenceStudents.length,
    loadConferenceContext,
  ]);

  const profileSheetRef = useRef<BottomSheetModal>(null);
  const eventSheetRef = useRef<BottomSheetModal>(null);
  const checklistSheetRef = useRef<BottomSheetModal>(null);
  const notifSheetRef = useRef<BottomSheetModal>(null);
  const ptcSheetRef = useRef<BottomSheetModal>(null);
  const activityPrefSheetRef = useRef<BottomSheetModal>(null);
  const autoFillSheetRef = useRef<BottomSheetModal>(null);
  const calendarAddIntroSheetRef = useRef<BottomSheetModal>(null);
  const pendingCalendarAddIntroRef = useRef(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const introListRef = useRef<FlatList<IntroSlide>>(null);
  const [showFallLeaves, setShowFallLeaves] = useState(false);

  useEffect(() => {
    if (!autoPrompts) return;
    if (shouldPlayFallLeaves()) {
      setShowFallLeaves(true);
    }
  }, [autoPrompts]);

  // Refresh "X min ago" labels every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoPrompts) return;
    if (!loading) {
      if (!onboardingCompleted.has("intro_seen")) {
        const t = setTimeout(() => setIntroVisible(true), 400);
        return () => clearTimeout(t);
      }
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const tryPresentCalendarAddIntro = useCallback(() => {
    if (isReadOnlyPreview) return;
    if (onboardingCompleted.has(PARENT_CALENDAR_ADD_INTRO_SEEN)) return;
    calendarAddIntroSheetRef.current?.present();
  }, [isReadOnlyPreview, onboardingCompleted]);

  useEffect(() => {
    if (!autoPrompts) return;
    if (loading || onboardingLoading || introVisible || isReadOnlyPreview) {
      return;
    }
    if (!onboardingCompleted.has("intro_seen")) return;
    if (onboardingCompleted.has(PARENT_CALENDAR_ADD_INTRO_SEEN)) return;
    if (pendingCalendarAddIntroRef.current) return;
    const t = setTimeout(() => tryPresentCalendarAddIntro(), 400);
    return () => clearTimeout(t);
  }, [
    loading,
    onboardingLoading,
    introVisible,
    isReadOnlyPreview,
    onboardingCompleted,
    tryPresentCalendarAddIntro,
    autoPrompts,
  ]);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCore = useCallback(async (): Promise<HomeActionResult> => {
    if (!effectiveParentId || !userId) return { ok: false };
    let loadOk = true;

    async function loadUser() {
      try {
        setCurrentUserId(userId);

        // ─── Core data: try RPC first (1 round-trip), fall back to individual queries ───
        type TxRow = {
          student_id: string | null;
          payment_type: string;
          status: string;
          metadata: Record<string, string> | null;
          amount_cents?: number;
          created_at?: string;
        };
        type StudentRow = { id: string; child_legal_name: string; child_grade: string | null; profile_image_url: string | null };

        let studentsForActivity: StudentRow[] = [];
        let txForActivity: TxRow[] = [];

        const { data: rpcRaw, error: rpcError } = await (supabase as any).rpc(
          "rpc_home_screen_data",
          { p_user_id: parentViewUserId ?? userId, p_parent_id: effectiveParentId },
        );

        console.log("[home] core data source:", rpcRaw && !rpcError ? "RPC" : `fallback (rpcError: ${rpcError?.message ?? "no data"})`);

        if (rpcRaw && !rpcError) {
          // ── Fast path: populate everything from the single RPC response ──
          const rpc = rpcRaw as {
            profile: { full_name: string; profile_image_url: string | null } | null;
            students: StudentRow[] | null;
            events: CalendarEvent[] | null;
            pending_payments: PendingPaymentPreview[] | null;
            onboarding: { completed: string[] } | null;
            dropoff: { slot: string } | null;
            applications: HomeApplicationRow[] | null;
            transactions: TxRow[] | null;
          };

          if (rpc.profile?.full_name) {
            setFirstName(rpc.profile.full_name.split(" ")[0]);
            setInitials(getInitials(rpc.profile.full_name));
          } else {
            setInitials("?");
          }
          if (rpc.profile?.profile_image_url) setParentImageUrl(rpc.profile.profile_image_url);

          studentsForActivity = rpc.students ?? [];
          setStudents(studentsForActivity);
          setUpcomingEvents(rpc.events ?? []);
          setPendingPayments(rpc.pending_payments ?? []);
          setTuitionLoading(false);

          console.log("[onboarding] effectiveParentId:", effectiveParentId);
          console.log("[onboarding] onboarding:", JSON.stringify(rpc.onboarding));
          const completedArr = (rpc.onboarding?.completed ?? []) as string[];
          console.log("[onboarding] completed array:", completedArr);
          setOnboardingCompleted(new Set(completedArr));

          if (rpc.dropoff?.slot) {
            setDropOffSlot(rpc.dropoff.slot);
            setDropOffSaved(true);
          }

          setApplications(rpc.applications ?? []);

          txForActivity = rpc.transactions ?? [];
          applyTransactionState(txForActivity);

          const rpcApplications = rpc.applications ?? [];
          const dropInProgramByStudent =
            buildDropInProgramByStudent(rpcApplications);
          const [{ teacherNameByStudentId }, parentVisibleTeachers] =
            await Promise.all([
              fetchSchoolYearTeachersForStudents(
                studentsForActivity.map((s) => s.id),
                dropInProgramByStudent,
              ),
              fetchParentVisibleTeachers(),
            ]);
          setTeacherNameByStudentId(teacherNameByStudentId);
          setTeachers(parentVisibleTeachers);
          setTeachersLoading(false);

          // Unlock the main render immediately after core data is ready
          setLoading(false);
          setOnboardingLoading(false);

          // Background: activity-banner (non-critical, use existing skeletons)
          const paidDatesMap = computePaidDates(txForActivity.filter((tx): tx is typeof tx & { student_id: string } => tx.student_id != null));
          const paidSets: Record<string, Set<string>> = {};
          for (const [sid, dates] of Object.entries(paidDatesMap)) {
            paidSets[sid] = new Set(dates);
          }
          const [activitiesResult, activityPrefsResult, defaultPrefsResult] =
            await Promise.all([
              supabase.schema("teachers").from("activities").select("id, activity_date").eq("status", "published").eq("visibility", "public").eq("is_deleted", false),
              supabase.schema("parent_app").from("activity_preferences").select("student_id, activity_id").eq("parent_id", effectiveParentId),
              supabase.schema("parent_app").from("student_default_preferences").select("student_id, participation_level").eq("parent_id", effectiveParentId),
            ]);

          applyActivityBanner(activitiesResult, activityPrefsResult, defaultPrefsResult, studentsForActivity, paidSets);
          void loadConferenceBookingsFromSupabase();
          void loadConferenceContext();

        } else {
          // ── Fallback: original individual queries (unchanged logic) ──────
          const { data: profileData } = await supabase
            .schema("admin")
            .from("users")
            .select("full_name, profile_image_url")
            .eq("id", userId)
            .single();

          if (profileData?.full_name) {
            setFirstName(profileData.full_name.split(" ")[0]);
            setInitials(getInitials(profileData.full_name));
          } else {
            setInitials("?");
          }
          if (profileData?.profile_image_url) setParentImageUrl(profileData.profile_image_url);

          const { data: fetchedStudents } = await supabase
            .schema("admin")
            .from("students")
            .select("id, child_legal_name, child_grade, profile_image_url")
            .eq("parent_id", effectiveParentId)
            .eq("is_deleted", false);

          studentsForActivity = fetchedStudents ?? [];
          setStudents(studentsForActivity);

          const [
            eventsResult,
            pendingResult,
            onboardingResult,
            dropOffResult,
            applicationsResult,
            transactionsResult,
            activitiesResult,
            activityPrefsResult,
            defaultPrefsResult,
          ] = await Promise.all([
            supabase
              .schema("calendar")
              .from("events")
              .select(
                "id,title,event_date,is_all_day,start_time,end_time,color,category,description,location,attachment_links",
              )
              .gte("event_date", toYMD(new Date()))
              .order("event_date", { ascending: true })
              .limit(3),
            supabase
              .schema("billing")
              .from("pending_payment_requests")
              .select("id, label, amount_cents, program, student_id, payment_type")
              .eq("parent_id", effectiveParentId)
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .schema("parent_app")
              .from("onboarding_checklist")
              .select("completed")
              .eq("parent_id", effectiveParentId)
              .maybeSingle(),
            supabase
              .schema("parent_app")
              .from("dropoff_times")
              .select("slot")
              .eq("parent_id", effectiveParentId)
              .maybeSingle(),
            supabase
              .schema("parent_app")
              .from("applications")
              .select(
                "id, student_id, status, program, drop_in_program, child_legal_name",
              )
              .eq("user_id", effectiveParentId)
              .eq("approved", true)
              .in("program", [
                "summer_26",
                "both",
                "homeschool_drop_in",
                "school_year_26_27",
              ]),
            supabase
              .schema("billing")
              .from("stripe_transactions")
              .select(
                "student_id, payment_type, status, metadata, amount_cents, created_at",
              )
              .eq("parent_id", effectiveParentId)
              .eq("is_deleted", false)
              .eq("status", "completed"),
            supabase
              .schema("teachers")
              .from("activities")
              .select("id, activity_date")
              .eq("status", "published")
              .eq("visibility", "public")
              .eq("is_deleted", false),
            supabase
              .schema("parent_app")
              .from("activity_preferences")
              .select("student_id, activity_id")
              .eq("parent_id", effectiveParentId),
            supabase
              .schema("parent_app")
              .from("student_default_preferences")
              .select("student_id, participation_level")
              .eq("parent_id", effectiveParentId),
          ]);

          if (eventsResult.data) setUpcomingEvents(eventsResult.data);

          setPendingPayments(pendingResult.data ?? []);
          setTuitionLoading(false);

          console.log("[onboarding] effectiveParentId:", effectiveParentId);
          console.log(
            "[onboarding] raw result:",
            JSON.stringify(onboardingResult),
          );
          console.log("[onboarding] data:", onboardingResult.data);
          console.log("[onboarding] error:", onboardingResult.error);
          const completedArr = (onboardingResult.data?.completed ??
            []) as string[];
          console.log("[onboarding] completed array:", completedArr);
          setOnboardingCompleted(new Set(completedArr));

          if (dropOffResult.data?.slot) {
            setDropOffSlot(dropOffResult.data.slot);
            setDropOffSaved(true);
          }

          setApplications(applicationsResult.data ?? []);

          const fallbackApplications = applicationsResult.data ?? [];
          const dropInProgramByStudent =
            buildDropInProgramByStudent(fallbackApplications);
          const [{ teacherNameByStudentId }, parentVisibleTeachers] =
            await Promise.all([
              fetchSchoolYearTeachersForStudents(
                studentsForActivity.map((s) => s.id),
                dropInProgramByStudent,
              ),
              fetchParentVisibleTeachers(),
            ]);
          setTeacherNameByStudentId(teacherNameByStudentId);
          setTeachers(parentVisibleTeachers);
          setTeachersLoading(false);

          txForActivity = transactionsResult.data ?? [];
          applyTransactionState(txForActivity);

          const paidDatesMap = computePaidDates(txForActivity.filter((tx): tx is typeof tx & { student_id: string } => tx.student_id != null));
          const paidSets: Record<string, Set<string>> = {};
          for (const [sid, dates] of Object.entries(paidDatesMap)) {
            paidSets[sid] = new Set(dates);
          }

          applyActivityBanner(activitiesResult, activityPrefsResult, defaultPrefsResult, studentsForActivity, paidSets);
          void loadConferenceBookingsFromSupabase();
          void loadConferenceContext();
        }

        // ─── DM + channels (parallel, always runs after core) ────────────────
        setNotifLoading(true);
        const [dmItems, channelsData] = await Promise.all([
          fetchDMNotifs(userId!),
          getChannels(userId!),
        ]);
        const channelNotifItems: NotifItem[] = channelsData
          .filter((ch) => ch.isMember && ch.unreadCount > 0 && ch.lastMessage)
          .map((ch) => ({
            id: ch.id,
            kind: "channel" as const,
            name: `#${ch.name}`,
            preview: ch.lastMessage!.body.slice(0, 60),
            timestamp: ch.lastMessage!.created_at,
            unreadCount: ch.unreadCount,
            channelId: ch.id,
            channelName: ch.name,
            isMember: ch.isMember,
            isDefault: ch.is_default,
            memberCount: ch.memberCount,
          }));
        const allNotifs = [...dmItems, ...channelNotifItems]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 10);
        setNotifItems(allNotifs);
        setNotifTotal(allNotifs.reduce((sum, i) => sum + i.unreadCount, 0));
        setNotifLoading(false);

        // Community preview — members see the carousel, non-members see an invite
        const generalCh = channelsData.find((ch) => ch.is_default);
        if (generalCh) {
          setCommunityIsMember(generalCh.isMember);
          if (generalCh.isMember) {
            const { data: rawMsgs } = await supabase
              .schema("messaging")
              .from("channel_messages")
              .select("body, sender_id")
              .eq("channel_id", generalCh.id)
              .order("created_at", { ascending: false })
              .limit(5);

            if (rawMsgs?.length) {
              const senderIds = [
                ...new Set(rawMsgs.map((m: any) => m.sender_id as string)),
              ];
              const { data: profiles } = await supabase
                .schema("admin")
                .from("users")
                .select("id, full_name, profile_image_url")
                .in("id", senderIds);

              const profileMap = new Map<
                string,
                { full_name: string; profile_image_url: string | null }
              >();
              (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));

              setCommunityMsgs(
                rawMsgs.map((m: any) => {
                  const p = profileMap.get(m.sender_id);
                  return {
                    body: m.body,
                    senderName: p?.full_name ?? "Someone",
                    senderImageUrl: p?.profile_image_url ?? null,
                  };
                }),
              );
            }
          }
        }
        setCommunityLoading(false);
        setLoadError(null);
      } catch (e) {
        notifyError("parent-home-load", e);
        loadOk = false;
        setLoadError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
        setOnboardingLoading(false);
      }
    }

    // ─── Shared helpers (close over state setters) ──────────────────────────
    type TxRow = {
      student_id: string | null;
      payment_type: string;
      status: string;
      metadata: Record<string, string> | null;
      amount_cents?: number;
      created_at?: string;
    };

    function applyTransactionState(txData: TxRow[]) {
      const paidWeeks: Record<string, number[]> = {};
      const aftercareMap: Record<string, { months: string[]; days: string[] }> = {};
      const funFridayMap: Record<string, { months: string[]; fridays: string[] }> = {};
      const schoolYearMap: PaidSchoolYearByStudent = {};
      const supplyFeeMap: Record<string, boolean> = {};
      const homeschoolMap: PaidHomeschoolByStudent = {};

      for (const tx of txData) {
        if (tx.status !== "completed" || !tx.student_id) continue;
        const meta = tx.metadata;
        if (tx.payment_type === "summer_tuition") {
          if (meta?.plan_type === "full") {
            paidWeeks[tx.student_id] = Array.from({ length: 12 }, (_, i) => i + 1);
          } else {
            const weeks = (meta?.weeks ?? "").split(",").map(Number).filter(Boolean);
            const existing = new Set(paidWeeks[tx.student_id] ?? []);
            weeks.forEach((w) => existing.add(w));
            paidWeeks[tx.student_id] = Array.from(existing);
          }
        } else if (tx.payment_type === "aftercare_tuition") {
          const months = (meta?.selected_months ?? "").split(",").filter(Boolean);
          const days = (meta?.selected_days ?? "").split(",").filter(Boolean);
          const prev = aftercareMap[tx.student_id] ?? { months: [], days: [] };
          aftercareMap[tx.student_id] = { months: [...prev.months, ...months], days: [...prev.days, ...days] };
        } else if (tx.payment_type === "fun_friday_tuition") {
          const months = (meta?.selected_months ?? "").split(",").filter(Boolean);
          const fridays = (meta?.selected_fridays ?? "").split(",").filter(Boolean);
          const prev = funFridayMap[tx.student_id] ?? { months: [], fridays: [] };
          funFridayMap[tx.student_id] = { months: [...prev.months, ...months], fridays: [...prev.fridays, ...fridays] };
        } else if (tx.payment_type === "school_year_tuition") {
          const months = (meta?.selected_months ?? "")
            .split(",")
            .map(Number)
            .filter(Boolean);
          if (!schoolYearMap[tx.student_id]) {
            schoolYearMap[tx.student_id] = [];
          }
          schoolYearMap[tx.student_id].push(...months);
        } else if (tx.payment_type === "supply_fee") {
          supplyFeeMap[tx.student_id] = true;
          // Tuition month bundled with the supply fee counts as paid.
          const bundleMonth = Number(meta?.bundle_month_index);
          if (meta?.bundle_type === "school_year_tuition" && bundleMonth) {
            if (!schoolYearMap[tx.student_id]) {
              schoolYearMap[tx.student_id] = [];
            }
            if (!schoolYearMap[tx.student_id].includes(bundleMonth)) {
              schoolYearMap[tx.student_id].push(bundleMonth);
            }
          }
          if (
            meta?.bundle_type === "homeschool" &&
            meta.bundle_homeschool_tier
          ) {
            const tier = meta.bundle_homeschool_tier;
            const weeks = (meta.bundle_homeschool_selected_days ?? "")
              .split(",")
              .map(Number)
              .filter(Boolean);
            const weekDays: Record<number, string[]> = {};
            if (meta.bundle_homeschool_week_selections_json) {
              try {
                const parsed: { week: number; days: string[] }[] = JSON.parse(
                  meta.bundle_homeschool_week_selections_json,
                );
                parsed.forEach(({ week, days }) => {
                  weekDays[week] = days;
                });
              } catch {
                /* ignore */
              }
            }
            if (Object.keys(weekDays).length === 0) {
              weeks.forEach((w) => {
                weekDays[w] = [];
              });
            }
            const days = [...new Set(Object.values(weekDays).flat())];
            const amountCents = meta.bundle_amount_cents
              ? parseInt(meta.bundle_amount_cents, 10)
              : (tx.amount_cents ?? 0);
            if (!homeschoolMap[tx.student_id]) {
              homeschoolMap[tx.student_id] = { summer: [], schoolYear: [] };
            }
            homeschoolMap[tx.student_id].schoolYear.push({
              weeks,
              tier,
              days,
              weekDays,
              amountCents,
              createdAt: tx.created_at ?? "",
            });
          }
        } else if (tx.payment_type === "homeschool_dropin") {
          const program = meta?.program ?? "summer_26";
          const tier = meta?.tier ?? "dropin";
          const days = meta?.selected_days?.split(",").filter(Boolean) ?? [];
          const weeks =
            meta?.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
          const weekDays: Record<number, string[]> = {};
          if (meta?.week_selections) {
            try {
              const parsed: { week: number; days: string[] }[] = JSON.parse(
                meta.week_selections,
              );
              parsed.forEach(({ week, days: d }) => {
                weekDays[week] = d;
              });
            } catch {
              /* ignore */
            }
          }
          if (Object.keys(weekDays).length === 0) {
            weeks.forEach((w) => {
              weekDays[w] = days;
            });
          }
          if (!homeschoolMap[tx.student_id]) {
            homeschoolMap[tx.student_id] = { summer: [], schoolYear: [] };
          }
          const entry = {
            weeks,
            tier,
            days,
            weekDays,
            amountCents: tx.amount_cents ?? 0,
            createdAt: tx.created_at ?? "",
          };
          if (program === "school_year_26_27") {
            homeschoolMap[tx.student_id].schoolYear.push(entry);
          } else {
            homeschoolMap[tx.student_id].summer.push(entry);
          }
        }
      }

      setPaidWeeksByStudent(paidWeeks);
      setPaidAftercareByStudent(aftercareMap);
      setPaidFunFridayByStudent(funFridayMap);
      setPaidSchoolYearByStudent(schoolYearMap);
      setPaidSupplyFeeByStudent(supplyFeeMap);
      setPaidHomeschoolByStudent(homeschoolMap);
    }

    function applyActivityBanner(
      activitiesResult: { data: { id: string; activity_date: string | null }[] | null },
      activityPrefsResult: { data: { student_id: string; activity_id: string }[] | null },
      defaultPrefsResult: {
        data: { student_id: string; participation_level: ParticipationLevel }[] | null;
      },
      studentsData: { id: string }[],
      paidSets: Record<string, Set<string>>,
    ) {
      const activities = activitiesResult.data ?? [];
      const activityPrefs = activityPrefsResult.data ?? [];
      const defaults = (defaultPrefsResult.data ?? []) as StudentDefaultPreference[];
      const defaultPrefStudentIds = new Set(defaults.map((d) => d.student_id));

      setStudentDefaults(defaults);
      setActivityPaidSets(paidSets);

      activityBannerRef.current = {
        activities,
        activityPrefs,
        studentDefaults: defaults,
        defaultPrefStudentIds,
        paidSets,
      };

      setHasActivityForPaidDay(
        computeHasUnsetActivityPreference(
          activities,
          activityPrefs,
          defaultPrefStudentIds,
          studentsData,
          paidSets,
        ),
      );
    }

    await loadUser();
    return { ok: loadOk };
  }, [
    effectiveParentId,
    userId,
    parentViewUserId,
    loadConferenceBookingsFromSupabase,
    loadConferenceContext,
  ]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (communityMsgs.length <= 1) return;
    const t = setInterval(() => {
      Animated.timing(communityFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCommunityIdx((i) => (i + 1) % communityMsgs.length);
        Animated.timing(communityFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(t);
  }, [communityMsgs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNewsletters = useCallback(async () => {
    if (!effectiveParentId) return;
    await getPublishedNewsletters(5)
      .then(setHomeNewsletters)
      .catch(() => {})
      .finally(() => setNewslettersLoading(false));
  }, [effectiveParentId]);

  useEffect(() => {
    void loadNewsletters();
  }, [loadNewsletters]);

  const loadWeekActivities = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setWeekActivitiesLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const all = await getActivities();
      const filtered = all
        .filter(
          (a) =>
            a.status === "published" &&
            a.visibility === "public" &&
            a.activity_date != null &&
            a.activity_date >= today,
        )
        .sort((a, b) => (a.activity_date ?? "").localeCompare(b.activity_date ?? ""));
      setWeekActivities(filtered);
    } catch (e) {
      notifyError("parent-home-week-activities", e);
    } finally {
      setWeekActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeekActivities();
  }, [loadWeekActivities]);

  const refreshActivityBanner = useCallback(async () => {
    if (!effectiveParentId || !activityBannerRef.current) return;
    const { activities, defaultPrefStudentIds, paidSets } =
      activityBannerRef.current;

    const { data: prefs } = await supabase
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, activity_id")
      .eq("parent_id", effectiveParentId);

    const activityPrefs = prefs ?? [];
    activityBannerRef.current = {
      ...activityBannerRef.current,
      activityPrefs,
    };

    setHasActivityForPaidDay(
      computeHasUnsetActivityPreference(
        activities,
        activityPrefs,
        defaultPrefStudentIds,
        students,
        paidSets,
      ),
    );
  }, [effectiveParentId, students]);

  const eligibleAutoFillStudents = useMemo(() => {
    if (weekActivities.length === 0) return [];
    return students.filter((s) =>
      childHasVisibleUpcomingActivity(
        Array.from(activityPaidSets[s.id] ?? []),
        weekActivities,
      ),
    );
  }, [students, weekActivities, activityPaidSets]);

  const refreshActivityBannerFromDefaults = useCallback(
    (nextDefaults: StudentDefaultPreference[]) => {
      if (!activityBannerRef.current) return;
      const defaultPrefStudentIds = new Set(nextDefaults.map((d) => d.student_id));
      activityBannerRef.current = {
        ...activityBannerRef.current,
        studentDefaults: nextDefaults,
        defaultPrefStudentIds,
      };
      const { activities, activityPrefs, paidSets } = activityBannerRef.current;
      setHasActivityForPaidDay(
        computeHasUnsetActivityPreference(
          activities,
          activityPrefs,
          defaultPrefStudentIds,
          students,
          paidSets,
        ),
      );
    },
    [students],
  );

  const handleHomeSetDefault = useCallback(
    async (
      studentId: string,
      level: ParticipationLevel | null,
    ): Promise<HomeActionResult> => {
      if (isReadOnlyPreview || !effectiveParentId) return { ok: false, canceled: true };

      setDefaultSaveStatusByStudent((prev) => ({ ...prev, [studentId]: "saving" }));

      const nextDefaults =
        level !== null
          ? [
              ...studentDefaults.filter((d) => d.student_id !== studentId),
              { student_id: studentId, participation_level: level },
            ]
          : studentDefaults.filter((d) => d.student_id !== studentId);

      setStudentDefaults(nextDefaults);
      refreshActivityBannerFromDefaults(nextDefaults);

      const result = await persistStudentDefaultPreference({
        parentId: effectiveParentId,
        studentId,
        level,
      });

      if (result.error) {
        setDefaultSaveStatusByStudent((prev) => ({ ...prev, [studentId]: "error" }));
        return { ok: false, error: String(result.error) };
      }

      setDefaultSaveStatusByStudent((prev) => ({ ...prev, [studentId]: "saved" }));
      setTimeout(() => {
        setDefaultSaveStatusByStudent((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }, 2500);
      return { ok: true };
    },
    [
      isReadOnlyPreview,
      effectiveParentId,
      studentDefaults,
      refreshActivityBannerFromDefaults,
    ],
  );

  const openActivityPreferenceSheet = useCallback(
    async (activity?: Activity | null) => {
      if (isReadOnlyPreview && !activity) return;

      let target = activity ?? null;

      if (!target && activityBannerRef.current) {
        const ctx = activityBannerRef.current;
        const unsetId = findFirstUnsetActivity(
          ctx.activities,
          ctx.activityPrefs,
          ctx.defaultPrefStudentIds,
          students,
          ctx.paidSets,
        );
        if (unsetId) {
          target = weekActivities.find((a) => a.id === unsetId) ?? null;
          if (!target) {
            try {
              const all = await getActivities();
              target = all.find((a) => a.id === unsetId) ?? null;
            } catch (e) {
              notifyError("parent-home-activity-pref-open", e);
            }
          }
        }
      }

      if (target) {
        setSelectedActivity(target);
        setTimeout(() => activityPrefSheetRef.current?.present(), 50);
      } else {
        router.push("/(tabs)/preferences" as any);
      }
    },
    [isReadOnlyPreview, students, weekActivities, router],
  );

  useEffect(() => {
    if (!activityIdParam || handledActivityNotificationRef.current === activityIdParam) return;
    if (isReadOnlyPreview || !effectiveParentId) return;

    handledActivityNotificationRef.current = activityIdParam;

    void (async () => {
      try {
        const all = await getActivities();
        const activity = all.find((a) => a.id === activityIdParam) ?? null;
        if (activity) {
          await openActivityPreferenceSheet(activity);
        }
      } catch (e) {
        notifyError("activity-notification-deeplink", e);
      } finally {
        router.setParams({ activityId: undefined });
      }
    })();
  }, [
    activityIdParam,
    effectiveParentId,
    isReadOnlyPreview,
    openActivityPreferenceSheet,
    router,
  ]);

  async function handlePickParentImage(opts?: {
    onUploadStart?: () => void;
  }): Promise<HomeActionResult> {
    if (isReadOnlyPreview) return { ok: false, canceled: true };
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return { ok: false, canceled: true };
    setUploadingParentImage(true);
    opts?.onUploadStart?.();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !currentUserId) return { ok: false, error: "Not signed in" };
      const asset = result.assets[0];
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const storagePath = `${currentUserId}/profile.jpg`;
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
      if (!uploadRes.ok) return { ok: false, error: "Upload failed" };
      const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${storagePath}`;
      await supabase.rpc("update_user_profile_image", {
        p_image_url: publicUrl,
      });
      setParentImageUrl(publicUrl);
      return { ok: true };
    } catch (e) {
      notifyError("parent-home-profile-image", e);
      return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
    } finally {
      setUploadingParentImage(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    profileSheetRef.current?.dismiss();
    router.replace("/");
  }

  async function handleMessageTeacher(
    teacher: TeacherSuggestion,
  ): Promise<HomeActionResult> {
    setStartingConvTeacherId(teacher.id);
    try {
      const { data: convId } = await supabase.rpc(
        "find_or_create_conversation",
        { other_user_id: teacher.id },
      );
      if (!convId) return { ok: false, error: "Could not open conversation" };
      router.push({
        pathname: "/(tabs)/messages/[id]" as any,
        params: {
          id: convId,
          otherUserName: teacher.full_name,
          otherUserAvatar: teacher.profile_image_url ?? "",
          otherUserId: teacher.id,
        },
      });
      return { ok: true };
    } catch (e) {
      notifyError("parent-home-message-teacher", e);
      return { ok: false, error: e instanceof Error ? e.message : "Could not open conversation" };
    } finally {
      setStartingConvTeacherId(null);
    }
  }

  async function handleSaveDropOff() {
    if (isReadOnlyPreview) return;
    if (!dropOffSlot || !effectiveParentId) return;
    setDropOffSaving(true);
    setDropOffError(null);
    const { error } = await supabase
      .schema("parent_app")
      .from("dropoff_times")
      .upsert(
        {
          parent_id: effectiveParentId,
          slot: dropOffSlot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
    setDropOffSaving(false);
    if (error) {
      notifyError("parent-home-dropoff-save", error);
      setDropOffError("Could not save. Please try again.");
      return;
    }
    const wasAlreadySaved = dropOffSaved;
    setDropOffSaved(true);
    const chosen = DROP_OFF_SLOTS.find((s) => s.value === dropOffSlot);
    notifyDiscord({
      type: wasAlreadySaved ? "dropoff_time_updated" : "dropoff_time_selected",
      data: { slot: dropOffSlot, slotLabel: chosen?.label ?? dropOffSlot },
    });
  }

  async function toggleOnboardingTask(
    id: string,
  ): Promise<HomeActionResult & { done: boolean; completedCount: number }> {
    const wasDone = onboardingCompleted.has(id);
    const countFor = (set: Set<string>) =>
      CHECKLIST_TASKS.filter((t) => set.has(t.id)).length;
    if (isReadOnlyPreview) {
      return {
        ok: false,
        canceled: true,
        done: wasDone,
        completedCount: countFor(onboardingCompleted),
      };
    }
    const next = new Set(onboardingCompleted);
    next.has(id) ? next.delete(id) : next.add(id);
    setOnboardingCompleted(next);
    const result = { done: !wasDone, completedCount: countFor(next) };
    if (!effectiveParentId) return { ok: true, ...result };
    const { error } = await supabase
      .schema("parent_app")
      .from("onboarding_checklist")
      .upsert(
        {
          parent_id: effectiveParentId,
          completed: [...next],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
    if (error) {
      notifyError("parent-home-onboarding-toggle", error);
      return { ok: false, error: error.message, ...result };
    }
    return { ok: true, ...result };
  }

  async function markIntroSeen() {
    if (isReadOnlyPreview) return;
    const next = new Set(onboardingCompleted);
    next.add("intro_seen");
    setOnboardingCompleted(next);
    if (!effectiveParentId) return;
    await supabase
      .schema("parent_app")
      .from("onboarding_checklist")
      .upsert(
        {
          parent_id: effectiveParentId,
          completed: [...next],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
  }

  async function markCalendarAddIntroSeen() {
    if (isReadOnlyPreview) return;
    if (onboardingCompleted.has(PARENT_CALENDAR_ADD_INTRO_SEEN)) return;
    const next = new Set(onboardingCompleted);
    next.add(PARENT_CALENDAR_ADD_INTRO_SEEN);
    setOnboardingCompleted(next);
    pendingCalendarAddIntroRef.current = false;
    if (!effectiveParentId) return;
    await supabase
      .schema("parent_app")
      .from("onboarding_checklist")
      .upsert(
        {
          parent_id: effectiveParentId,
          completed: [...next],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
  }

  function handleChecklistDismiss() {
    if (!pendingCalendarAddIntroRef.current) return;
    if (onboardingCompleted.has(PARENT_CALENDAR_ADD_INTRO_SEEN)) {
      pendingCalendarAddIntroRef.current = false;
      return;
    }
    pendingCalendarAddIntroRef.current = false;
    setTimeout(() => tryPresentCalendarAddIntro(), 350);
  }

  function handleIntroNext() {
    if (introIndex < INTRO_SLIDES.length - 1) {
      const next = introIndex + 1;
      introListRef.current?.scrollToIndex({ index: next, animated: true });
      setIntroIndex(next);
    } else {
      handleIntroFinish();
    }
  }

  function handleIntroFinish() {
    setIntroVisible(false);
    markIntroSeen();
    if (!onboardingCompleted.has(PARENT_CALENDAR_ADD_INTRO_SEEN)) {
      pendingCalendarAddIntroRef.current = true;
    }
    setTimeout(() => checklistSheetRef.current?.present(), 350);
  }

  function handleIntroBack() {
    if (introIndex > 0) {
      const prev = introIndex - 1;
      introListRef.current?.scrollToIndex({ index: prev, animated: true });
      setIntroIndex(prev);
    }
  }

  function handleIntroSkip() {
    setIntroVisible(false);
    markIntroSeen();
  }

  /** Re-open the welcome tour from the first slide (preview screens). */
  function replayIntro() {
    setIntroIndex(0);
    introListRef.current?.scrollToIndex({ index: 0, animated: false });
    setIntroVisible(true);
  }

  function navigateChecklist(id: string) {
    checklistSheetRef.current?.dismiss();
    switch (id) {
      case "upload_photo":
        router.push({
          pathname: "/(tabs)/children" as any,
          params: { tab: "profile" },
        });
        break;
      case "view_teachers":
        router.push({
          pathname: "/(tabs)/children" as any,
          params: { tab: "teacher" },
        });
        break;
      case "introduce_community":
        router.push({
          pathname: "/(tabs)/messages" as any,
          params: { tab: "community" },
        });
        break;
      case "send_message":
        router.push("/(tabs)/messages" as any);
        break;
      case "setup_tuition":
        router.push("/(tabs)/tuition" as any);
        break;
      case "react_post":
        router.push("/(tabs)/feed" as any);
        break;
      case "check_events":
        router.push("/(tabs)/calendar" as any);
        break;
      case "add_pickup":
        router.push({
          pathname: "/(tabs)/children" as any,
          params: { tab: "pickup" },
        });
        break;
    }
  }

  const completedTaskCount = CHECKLIST_TASKS.filter((t) =>
    onboardingCompleted.has(t.id),
  ).length;

  const enrolledApps = applications.filter((a) => a.status === "enrolled");
  const schoolYearTuitionStudentIds = getSchoolYearTuitionStudentIds(
    enrolledApps
      .filter((a) => a.program === "school_year_26_27")
      .map((a) => a.student_id),
    enrolledApps.filter((a) => a.program === "both").map((a) => a.student_id),
  );
  const showActionTuition = needsSchoolYearTuitionAction(
    schoolYearTuitionStudentIds,
    paidSchoolYearByStudent,
  );
  const ptcStudentsForBanner = useMemo((): ConferenceStudentContext[] => {
    if (conferenceStudents.length > 0) return conferenceStudents;
    return students.map((s) => ({
      studentId: s.id,
      name: s.child_legal_name.trim().split(/\s+/)[0] ?? s.child_legal_name,
      assignedTeacherId: null,
    }));
  }, [conferenceStudents, students]);

  const showActionActivity = hasActivityForPaidDay;
  const showActionNeededCard = showActionTuition || showActionActivity;
  const tuitionActionSubtext = getTuitionActionSubtext(
    schoolYearTuitionStudentIds,
    paidSupplyFeeByStudent,
  );

  const reload = useCallback(async (): Promise<HomeActionResult> => {
    const [core] = await Promise.all([
      loadCore(),
      loadNewsletters(),
      loadWeekActivities({ silent: true }),
    ]);
    return core;
  }, [loadCore, loadNewsletters, loadWeekActivities]);

  return {
    // auth / routing
    router,
    userId,
    effectiveParentId,
    isGrantee,
    ownerName,
    isReadOnlyPreview,
    goToTuition,
    // profile
    firstName,
    initials,
    parentImageUrl,
    uploadingParentImage,
    handlePickParentImage,
    signOut,
    // core data
    now,
    loading,
    loadError,
    reload,
    students,
    teacherNameByStudentId,
    applications,
    upcomingEvents,
    pendingPayments,
    tuitionLoading,
    paidWeeksByStudent,
    paidAftercareByStudent,
    paidFunFridayByStudent,
    paidSchoolYearByStudent,
    paidSupplyFeeByStudent,
    paidHomeschoolByStudent,
    // events
    selectedEvent,
    setSelectedEvent,
    // notifications
    notifItems,
    notifTotal,
    notifLoading,
    // community
    communityMsgs,
    communityIsMember,
    communityLoading,
    communityIdx,
    communityFade,
    // teachers / messages
    teachers,
    teachersLoading,
    startingConvTeacherId,
    handleMessageTeacher,
    // newsletters
    homeNewsletters,
    newslettersLoading,
    // activities + defaults
    weekActivities,
    weekActivitiesLoading,
    selectedActivity,
    openActivityPreferenceSheet,
    refreshActivityBanner,
    eligibleAutoFillStudents,
    studentDefaults,
    defaultSaveStatusByStudent,
    handleHomeSetDefault,
    // parent-teacher conferences
    conferenceBookingsByStudent,
    setConferenceBookingsByStudent,
    conferenceStudents,
    conferenceTeachers,
    conferenceTakenSlotKeys,
    setConferenceTakenSlotKeys,
    conferenceContextLoading,
    conferenceContextError,
    loadConferenceContext,
    openPtcSheet,
    ptcStudentsForBanner,
    // drop-off (section currently disabled in the UI)
    dropOffSlot,
    setDropOffSlot,
    dropOffSaved,
    setDropOffSaved,
    dropOffSaving,
    dropOffError,
    handleSaveDropOff,
    // onboarding / checklist / intro
    onboardingCompleted,
    onboardingLoading,
    completedTaskCount,
    toggleOnboardingTask,
    navigateChecklist,
    handleChecklistDismiss,
    markCalendarAddIntroSeen,
    introVisible,
    introIndex,
    setIntroIndex,
    introListRef,
    handleIntroNext,
    handleIntroBack,
    handleIntroSkip,
    replayIntro,
    showFallLeaves,
    setShowFallLeaves,
    markFallLeavesPlayed,
    // teacher favorites
    teacherFavoritesSeen,
    openTeacherFavorites,
    // action needed
    showActionTuition,
    showActionActivity,
    showActionNeededCard,
    tuitionActionSubtext,
    // sheet refs
    profileSheetRef,
    eventSheetRef,
    checklistSheetRef,
    notifSheetRef,
    ptcSheetRef,
    activityPrefSheetRef,
    autoFillSheetRef,
    calendarAddIntroSheetRef,
  };
}

export type ParentHome = ReturnType<typeof useParentHome>;
