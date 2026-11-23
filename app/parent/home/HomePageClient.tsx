"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "@/app/_garden/motion";
import OnboardingChecklist from "@/app/parent/components/OnboardingChecklist";
import HelpWidget from "@/app/parent/components/HelpWidget";
import type { ConferenceTeacherDisplay, ConferenceBookingRecord } from "@/app/lib/parent-teacher-conference";
import type { ConferenceStudentContext } from "@/app/lib/get-conference-teacher-assignments";
import { findFirstUnsetActivity, computeHasUnsetActivityPreference } from "@/shared/parent/activity-preferences";
import {
  getSchoolYearTuitionStudentIds,
  getTuitionActionSubtext,
  needsSchoolYearTuitionAction,
} from "@/shared/action-needed";
import type { StudentDefaultPreference } from "@/app/parent/preferences/page";
import { getEligibleAutoFillStudents } from "@/app/parent/components/AutoFillPreferenceSection";
import type { Activity } from "@/app/actions/activities";
import { saveDropOffTime } from "@/app/actions/saveDropOffTime";
import UpcomingParentTeacherConferenceCard from "./UpcomingParentTeacherConferenceCard";
import UpcomingActivitiesSection from "./UpcomingActivitiesSection";
import ParentActivityPreferenceSheet from "./ParentActivityPreferenceSheet";
import AutoFillPreferencesSheet from "./AutoFillPreferencesSheet";
import PortalShell from "@/app/parent/_garden/PortalShell";
import HomeHero from "./garden/HomeHero";
import NextSteps, { type HomeStep } from "./garden/NextSteps";
import DropOffPicker, { dropOffLabel } from "./garden/DropOffPicker";
import TuitionCards from "./garden/TuitionCards";
import { buildTuitionCards } from "./garden/tuition";
import { ChildrenPolaroids, EventsList, PhotosLink, QuickActions, RewardsPanel } from "./garden/HomeSections";
import ReferralDialog from "./garden/ReferralDialog";
import AttendanceSheet from "./garden/AttendanceSheet";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { TeacherFavoritesSection, TeacherFavoritesSheet, useTeacherFavoritesSeen } from "./garden/TeacherFavorites";
import NewslettersRail from "./garden/NewslettersRail";
import { TEACHER_FAVORITES } from "@/shared/parent/teacher-favorites";
import type { TeacherPhotoMap } from "@/app/lib/get-teacher-favorite-photos";
import type { DBNewsletterListItem } from "@/app/actions/newsletter";
import type {
  HomeStudent,
  HomeCheckIn,
  HomeEvent,
  HomePendingPayment,
  HomeReferral,
  StudentMap,
  PaidHomeschoolByStudent,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  SummerEnrollment,
  HomeschoolDropInApp,
  SchoolYearOnlyApp,
  PaidSchoolYearByStudent,
} from "./page";

// Update each year to match the first school week
const DROPOFF_WEEK_START = new Date("2026-04-28T00:00:00");
const DROPOFF_WEEK_END = new Date("2026-05-29T23:59:59");

interface Props {
  fullName: string | null;
  email: string;
  userId: string;
  parentId: string;
  students: HomeStudent[];
  activeCheckIns: HomeCheckIn[];
  upcomingEvents: HomeEvent[];
  pendingPayments: HomePendingPayment[];
  studentMap: StudentMap;
  referrals: HomeReferral[];
  savedDropOffSlot: string | null;
  summerEnrollments: SummerEnrollment[];
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidAftercareByStudent: PaidAftercareByStudent;
  paidFunFridayByStudent: PaidFunFridayByStudent;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
  checklistComplete: boolean;
  initialCompletedIds?: string[];
  checklistInteractive?: boolean;
  actionNeededInteractive?: boolean;
  readOnlyPreview?: boolean;
  suppressReferralPopup?: boolean;
  upcomingActivities: Activity[];
  activityPrefs: { student_id: string; activity_id: string }[];
  studentDefaults: StudentDefaultPreference[];
  paidDateSets: Record<string, string[]>;
  publishedActivitiesForBanner: { id: string; activity_date: string | null }[];
  hasSubmittedTestimonial: boolean;
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  conferenceBookingsByStudent: Record<string, ConferenceBookingRecord>;
  conferenceTakenSlotKeys: string[];
  teacherPhotos?: TeacherPhotoMap;
  newsletters?: DBNewsletterListItem[];
}

export default function HomePageClient(props: Props) {
  return (
    <PortalShell>
      <HomeContent {...props} />
    </PortalShell>
  );
}

function HomeContent({
  fullName,
  userId,
  parentId,
  students,
  upcomingEvents,
  pendingPayments,
  studentMap,
  referrals,
  savedDropOffSlot,
  summerEnrollments,
  schoolYearOnlyApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  paidAftercareByStudent,
  paidFunFridayByStudent,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
  checklistComplete,
  initialCompletedIds,
  checklistInteractive,
  actionNeededInteractive,
  readOnlyPreview,
  suppressReferralPopup,
  upcomingActivities,
  activityPrefs,
  studentDefaults: initialStudentDefaults,
  paidDateSets,
  publishedActivitiesForBanner,
  hasSubmittedTestimonial,
  conferenceTeachers,
  conferenceStudents,
  conferenceBookingsByStudent,
  conferenceTakenSlotKeys,
  teacherPhotos = {},
  newsletters = [],
}: Props) {
  const router = useRouter();
  const { runSave } = usePortalFeedback(readOnlyPreview);

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [referralPopupOpen, setReferralPopupOpen] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState<HomeStudent | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [dropOffSlot, setDropOffSlot] = useState<string | null>(savedDropOffSlot);
  const [dropOffSaved, setDropOffSaved] = useState<boolean>(savedDropOffSlot !== null);
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [autoFillSheetOpen, setAutoFillSheetOpen] = useState(false);
  const [studentDefaults, setStudentDefaults] = useState(initialStudentDefaults);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritesTeacher, setFavoritesTeacher] = useState(TEACHER_FAVORITES[0].fullName);
  const { seen: favoritesSeen, markSeen: markFavoritesSeen } = useTeacherFavoritesSeen(readOnlyPreview);

  function openTeacherFavorites(teacher?: string) {
    setFavoritesTeacher(teacher ?? TEACHER_FAVORITES[0].fullName);
    setFavoritesOpen(true);
    markFavoritesSeen();
  }

  /* ─── Activity preferences (unchanged logic) ─────────────────────────── */

  const paidSets = useMemo(() => {
    const sets: Record<string, Set<string>> = {};
    for (const [studentId, dates] of Object.entries(paidDateSets)) sets[studentId] = new Set(dates);
    return sets;
  }, [paidDateSets]);

  const defaultPrefStudentIdSet = useMemo(() => new Set(studentDefaults.map((d) => d.student_id)), [studentDefaults]);

  const hasActivityForPaidDayLive = useMemo(
    () =>
      computeHasUnsetActivityPreference(publishedActivitiesForBanner, activityPrefs, defaultPrefStudentIdSet, students, paidSets),
    [publishedActivitiesForBanner, activityPrefs, defaultPrefStudentIdSet, students, paidSets],
  );

  const hasEligibleAutoFillStudents = useMemo(
    () => getEligibleAutoFillStudents(students, paidDateSets, upcomingActivities).length > 0,
    [students, paidDateSets, upcomingActivities],
  );

  const openActivityPreferenceSheet = useCallback(
    (activity?: Activity | null) => {
      if (readOnlyPreview && !activity) return;
      let target = activity ?? null;
      if (!target) {
        const unsetId = findFirstUnsetActivity(publishedActivitiesForBanner, activityPrefs, defaultPrefStudentIdSet, students, paidSets);
        if (unsetId) target = upcomingActivities.find((a) => a.id === unsetId) ?? null;
      }
      if (target) {
        setSelectedActivity(target);
        setActivitySheetOpen(true);
      } else if (!readOnlyPreview) {
        router.push("/parent/preferences");
      }
    },
    [readOnlyPreview, publishedActivitiesForBanner, activityPrefs, defaultPrefStudentIdSet, students, paidSets, upcomingActivities, router],
  );

  const handleActivitySaved = useCallback(() => router.refresh(), [router]);

  /* ─── Referral popup: once per session ───────────────────────────────── */

  useEffect(() => {
    if (suppressReferralPopup) return;
    if (!sessionStorage.getItem("referralPopupSeen")) {
      const t = setTimeout(() => setReferralPopupOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, [suppressReferralPopup]);

  function closeReferralPopup() {
    sessionStorage.setItem("referralPopupSeen", "1");
    setReferralPopupOpen(false);
  }

  const refCode = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const referralLink = `https://sagefield.co/apply?ref=${refCode}`;
  const earnedDollars = referrals.filter((r) => r.status === "rewarded").length * 500;

  /* ─── Drop-off ───────────────────────────────────────────────────────── */

  const now = new Date();
  const showDropOff = now >= DROPOFF_WEEK_START && now <= DROPOFF_WEEK_END;

  async function handleSaveDropOff(slot = dropOffSlot) {
    if (!slot) return;
    setDropOffSaving(true);
    const ok = await runSave({
      successTitle: "Drop-off time saved",
      successMessage: `${dropOffLabel(slot)} · First Week Drop-Off`,
      errorTitle: "Drop-off time wasn't saved",
      retry: () => void handleSaveDropOff(slot),
      fn: async () => {
        const res = await saveDropOffTime(slot);
        return { ok: "ok" in res && !!res.ok, error: "error" in res ? res.error : undefined };
      },
    });
    if (ok) setDropOffSaved(true);
    setDropOffSaving(false);
  }

  /* ─── Next steps (Action Needed + onboarding + drop-off) ─────────────── */

  const schoolYearTuitionStudentIds = useMemo(
    () =>
      getSchoolYearTuitionStudentIds(
        schoolYearOnlyApps.map((a) => a.student_id),
        summerEnrollments.filter((e) => e.program === "both").map((e) => e.student_id),
      ),
    [schoolYearOnlyApps, summerEnrollments],
  );
  const showTuitionStep = needsSchoolYearTuitionAction(schoolYearTuitionStudentIds, paidSchoolYearByStudent);

  const steps: HomeStep[] = [];
  if (!checklistComplete) {
    steps.push({
      key: "onboarding",
      emoji: "📋",
      tint: "sky",
      title: "Complete your onboarding",
      body: "Finish setting up your account",
      cta: { label: "Open checklist", onClick: () => setChecklistOpen(true) },
    });
  }
  if (showTuitionStep) {
    steps.push({
      key: "tuition",
      emoji: "🏫",
      tint: "peach",
      title: "School Year Tuition Available",
      body: getTuitionActionSubtext(schoolYearTuitionStudentIds, paidSupplyFeeByStudent),
      cta: { label: "Go to billing", href: "/parent/billing" },
    });
  }
  if (hasActivityForPaidDayLive) {
    steps.push({
      key: "activity",
      emoji: "🍳",
      tint: "butter",
      title: "Activity Preferences",
      body: "Your child has upcoming activities at Sage Field. Let us know how they'd like to participate.",
      cta: { label: "Set Preferences", onClick: () => openActivityPreferenceSheet() },
    });
  }
  if (showDropOff) {
    steps.push({
      key: "dropoff",
      emoji: "🚗",
      tint: "lav",
      title: "First Week Drop-Off",
      done: dropOffSaved,
      body: (
        <>
          To ease morning traffic during the first week, choose a 15-minute drop-off window for your family. Drop-off runs{" "}
          <span className="font-extrabold text-[var(--sf-ink)]">8:15 – 9:00 AM</span>.
        </>
      ),
      extra: (
        <DropOffPicker
          slot={dropOffSlot}
          saved={dropOffSaved}
          saving={dropOffSaving}
          onSelect={setDropOffSlot}
          onSave={() => void handleSaveDropOff()}
          onEdit={() => setDropOffSaved(false)}
        />
      ),
    });
  }
  const openStepCount = steps.filter((s) => !s.done).length;

  const jumpToSteps = useCallback(() => {
    const el = document.getElementById("next-steps");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    document.getElementById("home-next-steps")?.focus({ preventScroll: true });
  }, []);

  /* ─── Tuition ────────────────────────────────────────────────────────── */

  const tuition = buildTuitionCards({
    pendingPayments,
    studentMap,
    summerEnrollments,
    schoolYearOnlyApps,
    homeschoolDropInApps,
    paidHomeschoolByStudent,
    paidAftercareByStudent,
    paidFunFridayByStudent,
    paidSchoolYearByStudent,
    paidSupplyFeeByStudent,
  });

  const firstName = fullName?.split(" ")[0] ?? "there";
  const interactive = actionNeededInteractive ? "pointer-events-auto" : undefined;

  return (
    <>
      <div className="relative">
        {/* soft pastel washes behind the hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_15%_10%,rgba(205,238,213,0.55),transparent_70%),radial-gradient(50%_55%_at_90%_5%,rgba(255,220,199,0.55),transparent_70%)]" aria-hidden="true" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-20 pt-8 sm:pt-12">
          <HomeHero
            userId={userId}
            firstName={firstName}
            nextEvent={upcomingEvents[0] ?? null}
            stepCount={openStepCount}
            onJumpToSteps={jumpToSteps}
          />

          <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
            {/* Left: what needs you, then your people and the fun stuff */}
            <div className="flex min-w-0 flex-col gap-14">
              <div className={`${interactive ?? ""} flex flex-col gap-5`}>
                <UpcomingParentTeacherConferenceCard
                  parentId={parentId}
                  conferenceTeachers={conferenceTeachers}
                  conferenceStudents={conferenceStudents}
                  conferenceBookingsByStudent={conferenceBookingsByStudent}
                  conferenceTakenSlotKeys={conferenceTakenSlotKeys}
                  readOnly={readOnlyPreview}
                />
                <NextSteps steps={steps} />
              </div>

              <div className={interactive}>
                <UpcomingActivitiesSection
                  activities={upcomingActivities}
                  onSelectActivity={(activity) => openActivityPreferenceSheet(activity)}
                  readOnly={readOnlyPreview}
                  showAutoFillButton={hasEligibleAutoFillStudents}
                  onAutoFillClick={() => setAutoFillSheetOpen(true)}
                />
              </div>

              <Reveal y={24} stagger={0.08} className="flex flex-col gap-14">
                <ChildrenPolaroids
                  students={students}
                  onOpenAttendance={(s) => {
                    setAttendanceStudent(s);
                    setAttendanceOpen(true);
                  }}
                />
                <TeacherFavoritesSection photos={teacherPhotos} isNew={favoritesSeen === false} onOpen={openTeacherFavorites} />
                {newsletters.length > 0 ? <NewslettersRail newsletters={newsletters} /> : null}
                <div className="flex flex-col gap-4">
                  <RewardsPanel earnedDollars={earnedDollars} testimonialSubmitted={hasSubmittedTestimonial} />
                  <PhotosLink />
                </div>
                <QuickActions onOpenHelp={() => setHelpOpen(true)} />
              </Reveal>
            </div>

            {/* Right: dates and money */}
            <Reveal y={24} stagger={0.1} className="flex min-w-0 flex-col gap-14">
              <EventsList events={upcomingEvents} />
              <TuitionCards hasAnything={tuition.hasAnything} cards={tuition.cards} />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Overlays live outside any animated wrapper */}
      <div className={checklistInteractive ? "pointer-events-auto" : undefined}>
        <OnboardingChecklist open={checklistOpen} onClose={() => setChecklistOpen(false)} initialCompleted={initialCompletedIds} />
      </div>
      <HelpWidget hideFloatingButton open={helpOpen} onOpenChange={setHelpOpen} />

      <ReferralDialog open={referralPopupOpen} onClose={closeReferralPopup} referralLink={referralLink} />

      <AttendanceSheet
        key={attendanceStudent?.id ?? "none"}
        student={attendanceStudent}
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
      />

      <ParentActivityPreferenceSheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        activity={selectedActivity}
        students={students}
        readOnly={readOnlyPreview}
        onSaved={handleActivitySaved}
      />

      <TeacherFavoritesSheet
        open={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        selected={favoritesTeacher}
        onSelect={setFavoritesTeacher}
        photos={teacherPhotos}
      />

      <AutoFillPreferencesSheet
        open={autoFillSheetOpen}
        onOpenChange={setAutoFillSheetOpen}
        students={students}
        studentDefaults={studentDefaults}
        paidDateSets={paidDateSets}
        upcomingActivities={upcomingActivities}
        readOnly={readOnlyPreview}
        onDefaultsChange={setStudentDefaults}
      />

    </>
  );
}
