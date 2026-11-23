"use client";

import { useEffect, useMemo, useState } from "react";
import PortalShell from "@/app/parent/_garden/PortalShell";
import ChildSwitcher, { type SwitcherChild } from "@/app/parent/_garden/ChildSwitcher";
import { PillTabs } from "@/app/parent/_garden/tabs";
import { SectionHeader, btnGhostSm } from "@/app/parent/_garden/ui";
import { formatCents } from "@/shared/billing/school-year";
import { submitTuitionFeedback } from "@/app/actions/submitTuitionFeedback";
import TuitionFeedbackPopup from "./TuitionFeedbackPopup";
import type {
  HomeschoolDropInApp,
  HomeschoolNotesByStudent,
  NonEnrolledApp,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  PaidHomeschoolByStudent,
  PaidSchoolYearByStudent,
  PaidWeeksByStudent,
  PendingPaymentRequest,
  SchoolYearOnlyApp,
  StripeTransaction,
  StudentInfo,
  SummerEnrollment,
  SummerNotesByStudent,
} from "./page";
import AddonFlow from "./garden/AddonFlow";
import PayByCheckDialog from "./garden/PayByCheckDialog";
import PaymentHistory from "./garden/PaymentHistory";
import RegistrationFlow from "./garden/RegistrationFlow";
import SchoolYearHomeschoolFlow from "./garden/SchoolYearHomeschoolFlow";
import SchoolYearTuitionFlow from "./garden/SchoolYearTuitionFlow";
import SummerHomeschoolFlow from "./garden/SummerHomeschoolFlow";
import SummerTuitionFlow from "./garden/SummerTuitionFlow";
import SupplyFeeFlow, { type SupplyFeeCandidate } from "./garden/SupplyFeeFlow";
import TuitionCodeFlow from "./garden/TuitionCodeFlow";
import { formatDropInProgramLabel, formatProgram, formatProgramLabel } from "./garden/data";
import { addonConfig, addonPaidItems, type AddonKind, type ProgramType } from "./garden/payloads";
import { PhotoCard, firstName } from "./garden/parts";
import {
  AllCaughtUp,
  BillingHero,
  ChildrenSidebar,
  DueBanner,
  NonEnrolledCard,
  PendingSheet,
  SecureSpotBanner,
  SiblingsBanner,
  StepBlock,
  TotalOwed,
  TuitionCodeLink,
} from "./garden/sections";

interface Props {
  transactions: StripeTransaction[];
  studentMap: Record<string, StudentInfo>;
  pendingRequests: PendingPaymentRequest[];
  summerEnrollments: SummerEnrollment[];
  unpaidSummerEnrollments: SummerEnrollment[];
  paidWeeksByStudent: PaidWeeksByStudent;
  parentId: string;
  parentEmail: string;
  nonEnrolledApps: NonEnrolledApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidAftercareByStudent: PaidAftercareByStudent;
  paidFunFridayByStudent: PaidFunFridayByStudent;
  summerNotesByStudent: SummerNotesByStudent;
  homeschoolNotesByStudent: HomeschoolNotesByStudent;
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  hasSubmittedTuitionFeedback: boolean;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
  recentTuitionCodes: string[];
  /** Admin "view as parent": every payment and note write is blocked with the Preview toast. */
  readOnlyPreview?: boolean;
}

type Sheet =
  | { kind: "summer"; enrollment: SummerEnrollment }
  | { kind: "addon"; addon: AddonKind; enrollment: SummerEnrollment }
  | { kind: "homeschool_summer"; app: HomeschoolDropInApp; view: "plan" | "history" }
  | { kind: "homeschool_sy"; app: HomeschoolDropInApp; view: "plan" | "history" }
  | { kind: "supply"; studentId: string; programType: ProgramType; childGrade: string | null }
  | { kind: "sy_tuition"; studentId: string; childGrade: string | null }
  | { kind: "code" }
  | { kind: "registration"; appId: string; type: "drop_in" | "full_time" }
  | null;

const SY_FF_KEYS = ["aug_26", "sep_26", "oct_26", "nov_26", "dec_26", "jan_27", "feb_27", "mar_27", "apr_27", "may_27"];
const SUMMER_FF_KEYS = ["may", "jun", "jul", "aug"];
const LOCKED_REASON = "↑ pay the Annual Supply Fee first, then tuition unlocks";

export default function BillingPage(props: Props) {
  return (
    <PortalShell className="flex min-h-0 w-full flex-1 overflow-hidden">
      <Billing {...props} />
    </PortalShell>
  );
}

function Billing({
  transactions,
  studentMap,
  pendingRequests,
  summerEnrollments,
  unpaidSummerEnrollments,
  paidWeeksByStudent,
  parentId,
  parentEmail,
  nonEnrolledApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  paidAftercareByStudent,
  paidFunFridayByStudent,
  summerNotesByStudent,
  homeschoolNotesByStudent,
  schoolYearOnlyApps,
  hasSubmittedTuitionFeedback,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
  recentTuitionCodes,
  readOnlyPreview,
}: Props) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedPending, setSelectedPending] = useState<PendingPaymentRequest | null>(null);
  const [checkOpen, setCheckOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [dueDismissed, setDueDismissed] = useState(false);

  const hasPaidAny = transactions.some((tx) => tx.status === "completed" && tx.payment_type !== "registration_fee");

  useEffect(() => {
    // The feedback popup never shows in admin preview.
    if (readOnlyPreview || !hasPaidAny || hasSubmittedTuitionFeedback) return;
    const t = setTimeout(() => setFeedbackOpen(true), 1500);
    return () => clearTimeout(t);
  }, [hasPaidAny, hasSubmittedTuitionFeedback, readOnlyPreview]);

  const nonEnrolledMap = new Map(nonEnrolledApps.map((a) => [a.student_id, a]));

  const homeschoolPricingByStudentId = useMemo(
    () => Object.fromEntries(homeschoolDropInApps.map((a) => [a.student_id, a.use_updated_homeschool_pricing])),
    [homeschoolDropInApps],
  );

  const studentProgramMap = new Map<string, string>();
  for (const e of summerEnrollments) {
    if (e.program) studentProgramMap.set(e.student_id, e.program);
  }
  for (const e of homeschoolDropInApps) {
    // Only set from homeschoolDropInApps if the student's primary program is actually
    // a homeschool/drop-in variant — don't overwrite a summer_26-only enrollment
    const prog = e.drop_in_program ?? "homeschool_drop_in";
    if (!studentProgramMap.has(e.student_id) || e.drop_in_program === "homeschool_drop_in") {
      studentProgramMap.set(e.student_id, prog);
    }
  }
  for (const a of nonEnrolledApps) {
    if (a.program) studentProgramMap.set(a.student_id, a.program);
  }
  for (const a of schoolYearOnlyApps) {
    if (!studentProgramMap.has(a.student_id)) studentProgramMap.set(a.student_id, "school_year_26_27");
  }

  const allStudentIds = [
    ...new Set([
      ...summerEnrollments.map((e) => e.student_id),
      ...(pendingRequests.map((r) => r.student_id).filter(Boolean) as string[]),
      ...nonEnrolledApps.map((a) => a.student_id),
      ...homeschoolDropInApps.map((a) => a.student_id),
      ...schoolYearOnlyApps.map((a) => a.student_id),
    ]),
  ];
  const orphanRequests = pendingRequests.filter((r) => !r.student_id);
  const hasOrphans = orphanRequests.length > 0;
  const [activeStudentId, setActiveStudentId] = useState<string | null>(allStudentIds[0] ?? null);

  const nonEnrolledStudentIds = new Set(nonEnrolledApps.map((a) => a.student_id));
  const visibleTransactions = transactions.filter((tx) => {
    const meta = (tx.metadata ?? {}) as Record<string, string>;
    return (
      (!tx.student_id || !nonEnrolledStudentIds.has(tx.student_id)) &&
      meta.is_sibling_split !== "true" &&
      meta.bundled_with_supply_fee !== "true"
    );
  });

  const multiChildSummerEligible = unpaidSummerEnrollments.filter((e) => e.program === "summer_26" || e.program === "both").length >= 2;
  const multiChildSchoolYearEligible =
    [
      ...schoolYearOnlyApps.map((a) => a.student_id),
      ...summerEnrollments.filter((e) => e.program === "both").map((e) => e.student_id),
      ...homeschoolDropInApps
        .filter((a) => a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both")
        .map((a) => a.student_id),
    ].length >= 2;

  // School-year students with unpaid supply fees — used for the sibling pre-step
  const schoolYearStudentsForSupplyFee: { studentId: string; childGrade: string | null; programType: ProgramType }[] = [
    ...schoolYearOnlyApps
      .filter((a) => !paidSupplyFeeByStudent[a.student_id])
      .map((a) => ({ studentId: a.student_id, childGrade: a.child_grade ?? null, programType: "school_year" as const })),
    ...summerEnrollments
      .filter((e) => e.program === "both" && !paidSupplyFeeByStudent[e.student_id])
      .map((e) => ({ studentId: e.student_id, childGrade: e.child_grade ?? null, programType: "school_year" as const })),
    ...homeschoolDropInApps
      .filter((a) => (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both") && !paidSupplyFeeByStudent[a.student_id])
      .map((a) => ({ studentId: a.student_id, childGrade: a.child_grade ?? null, programType: "homeschool" as const })),
  ];

  const hasPendingContent =
    unpaidSummerEnrollments.length > 0 ||
    pendingRequests.length > 0 ||
    nonEnrolledApps.length > 0 ||
    summerEnrollments.length > 0 ||
    homeschoolDropInApps.length > 0 ||
    schoolYearOnlyApps.length > 0;

  // ── Active-student view (verbatim visibility rules from PendingPaymentsSection) ──
  const isSchoolYearOnly = schoolYearOnlyApps.some((a) => a.student_id === activeStudentId);
  const isBoth = summerEnrollments.some((e) => e.student_id === activeStudentId && e.program === "both");
  const hasSchoolYearContent =
    isSchoolYearOnly ||
    isBoth ||
    homeschoolDropInApps.some(
      (a) => a.student_id === activeStudentId && (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both"),
    );
  const isSchoolYearOnlyStudent = hasSchoolYearContent;
  const studentTermKey = `${activeStudentId}-${isSchoolYearOnlyStudent ? "school_year" : "summer"}`;
  const [userTermTab, setUserTermTab] = useState<{ studentKey: string; tab: "summer" | "school_year" } | null>(null);
  const defaultTermTab: "summer" | "school_year" = isSchoolYearOnlyStudent ? "school_year" : "summer";
  const activeTermTab = userTermTab?.studentKey === studentTermKey ? userTermTab.tab : defaultTermTab;

  const isOtherTab = activeStudentId === "__other__";
  const activeSummerEnrollments = unpaidSummerEnrollments.filter((e) => e.student_id === activeStudentId);
  const activeAllSummerEnrollments = summerEnrollments.filter((e) => e.student_id === activeStudentId);
  const activePendingRequests = pendingRequests.filter((r) => r.student_id === activeStudentId);
  const activeHomeschoolApps = homeschoolDropInApps.filter((a) => a.student_id === activeStudentId);
  const totalCents = (isOtherTab ? orphanRequests : activePendingRequests).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
  const currentItems = isOtherTab ? orphanRequests : activePendingRequests;
  const currentSummer = isOtherTab ? [] : activeSummerEnrollments;
  const currentAllSummer = isOtherTab ? [] : activeAllSummerEnrollments;
  const currentHomeschool = isOtherTab ? [] : activeHomeschoolApps;
  const activeNonEnrolled = activeStudentId ? nonEnrolledMap.get(activeStudentId) : undefined;
  const showSchoolYearTab = hasSchoolYearContent && activeTermTab === "school_year";
  const summerPendingItems = currentItems.filter((r) => r.program !== "school_year_26_27");
  const schoolYearPendingItems = currentItems.filter((r) => r.program === "school_year_26_27");
  const summerHomeschoolApps = currentHomeschool.filter((a) => a.drop_in_program === "summer_26" || a.drop_in_program === "both");
  const schoolYearHomeschoolApps = currentHomeschool.filter((a) => a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both");
  const summerTotalCents = (activeStudentId === "__other__" ? orphanRequests : summerPendingItems).reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
  const schoolYearTotalCents = schoolYearPendingItems.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
  const nothingAtAll =
    !isSchoolYearOnly &&
    unpaidSummerEnrollments.length === 0 &&
    pendingRequests.length === 0 &&
    nonEnrolledApps.length === 0 &&
    summerEnrollments.length === 0 &&
    homeschoolDropInApps.length === 0;

  // ── Openers ──
  const syGrade = (sid: string) =>
    schoolYearOnlyApps.find((a) => a.student_id === sid)?.child_grade ??
    summerEnrollments.find((e) => e.student_id === sid && e.program === "both")?.child_grade ??
    homeschoolDropInApps.find((a) => a.student_id === sid && (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both"))
      ?.child_grade ??
    null;
  const syProgramType = (sid: string): ProgramType =>
    schoolYearOnlyApps.some((a) => a.student_id === sid)
      ? "school_year"
      : homeschoolDropInApps.some((a) => a.student_id === sid && (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both"))
        ? "homeschool"
        : summerEnrollments.some((e) => e.student_id === sid && e.program === "both")
          ? "school_year"
          : null;

  const openSupplyFee = (sid: string) => setSheet({ kind: "supply", studentId: sid, programType: syProgramType(sid), childGrade: syGrade(sid) });
  const openSchoolYearTuition = (sid: string) => setSheet({ kind: "sy_tuition", studentId: sid, childGrade: syGrade(sid) });

  /** Fix: the pending request's "Pay Now" opens the checkout that matches it. */
  const pendingTarget = (req: PendingPaymentRequest): (() => void) | null => {
    const sid = req.student_id;
    if (!sid) return null;
    const supplyPaid = paidSupplyFeeByStudent[sid] ?? false;
    const hasSchoolYear = syProgramType(sid) !== null;
    switch (req.payment_type) {
      case "summer_tuition": {
        const e = unpaidSummerEnrollments.find((x) => x.student_id === sid && x.program !== "homeschool_drop_in");
        return e ? () => setSheet({ kind: "summer", enrollment: e }) : null;
      }
      case "supply_fee":
        return hasSchoolYear && !supplyPaid ? () => openSupplyFee(sid) : null;
      case "tuition":
        if (!hasSchoolYear) return null;
        return supplyPaid ? () => openSchoolYearTuition(sid) : () => openSupplyFee(sid);
      case "homeschool_dropin": {
        if (req.program === "school_year_26_27") {
          const app = homeschoolDropInApps.find((a) => a.student_id === sid && (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both"));
          if (!app) return null;
          return supplyPaid ? () => setSheet({ kind: "homeschool_sy", app, view: "plan" }) : () => openSupplyFee(sid);
        }
        const app = homeschoolDropInApps.find((a) => a.student_id === sid && (a.drop_in_program === "summer_26" || a.drop_in_program === "both"));
        return app ? () => setSheet({ kind: "homeschool_summer", app, view: "plan" }) : null;
      }
      case "registration_fee": {
        const committed = summerEnrollments.some((e) => e.student_id === sid && e.program === "both");
        if (committed) return null;
        const dropIn = homeschoolDropInApps.find((a) => a.student_id === sid && a.drop_in_program === "summer_26");
        if (dropIn) return () => setSheet({ kind: "registration", appId: dropIn.id, type: "drop_in" });
        const summer = summerEnrollments.find((e) => e.student_id === sid && e.program === "summer_26");
        return summer ? () => setSheet({ kind: "registration", appId: summer.id, type: "full_time" }) : null;
      }
      default:
        return null;
    }
  };
  const pendingPay = selectedPending ? pendingTarget(selectedPending) : null;

  // ── Header bits ──
  const activeProgram = activeStudentId ? studentProgramMap.get(activeStudentId) : undefined;
  const programBadgeLabel = formatProgramLabel(activeProgram);
  const activeHomeschoolApp = homeschoolDropInApps.find((a) => a.student_id === activeStudentId);
  const dropInBadgeLabel =
    activeProgram === "homeschool_drop_in" && activeHomeschoolApp ? formatDropInProgramLabel(activeHomeschoolApp.drop_in_program) : null;
  const activeFullName = activeStudentId ? studentMap[activeStudentId]?.name : null;

  const switcherItems: SwitcherChild[] = [
    ...allStudentIds.map((id) => {
      const ne = nonEnrolledMap.get(id);
      return {
        id,
        name: ne ? (ne.name ?? "Student") : (studentMap[id]?.name ?? "Unknown"),
        imageUrl: ne ? null : (studentMap[id]?.profileImageUrl ?? null),
        sub: formatProgramLabel(studentProgramMap.get(id)),
        attention: !!ne,
        attentionLabel: ne ? "Enrollment not complete" : undefined,
      };
    }),
    ...(hasOrphans ? [{ id: "__other__", name: "Other" }] : []),
  ];

  // Secure-your-spot banner (one component for drop-in and full-time; same rules as before)
  const alreadyCommitted = summerEnrollments.some((e) => e.student_id === activeStudentId && e.program === "both");
  const dropInForBanner = homeschoolDropInApps.find((a) => a.student_id === activeStudentId);
  const secureSpot = (() => {
    if (alreadyCommitted) return null;
    if (dropInForBanner && dropInForBanner.drop_in_program === "summer_26") {
      return { appId: dropInForBanner.id, type: "drop_in" as const, studentId: dropInForBanner.student_id };
    }
    const hasDropIn = homeschoolDropInApps.some((a) => a.student_id === activeStudentId && a.drop_in_program === "summer_26");
    if (hasDropIn) return null;
    const activeSummer = summerEnrollments.find((e) => e.student_id === activeStudentId && e.program === "summer_26");
    return activeSummer ? { appId: activeSummer.id, type: "full_time" as const, studentId: activeSummer.student_id } : null;
  })();

  // ── Card builders ──
  const pendingCard = (req: PendingPaymentRequest) => (
    <PhotoCard
      key={req.id}
      image="/assets/ImageTen.jpg"
      tint="butter"
      term={formatProgram(req.program)}
      title={req.label}
      cta={{ label: "Pay Now", tone: "pay" }}
      amount={req.amount_cents != null ? formatCents(req.amount_cents) : "—"}
      onClick={() => setSelectedPending(req)}
    />
  );

  const schoolYearSection = () => {
    const sid = activeStudentId!;
    const supplyFeePaid = paidSupplyFeeByStudent[sid] ?? false;
    const showSteps = isSchoolYearOnly || isBoth || schoolYearHomeschoolApps.length > 0;
    const schoolYearOnly = schoolYearOnlyApps.find((a) => a.student_id === sid);
    const bothEnrollment = summerEnrollments.find((e) => e.student_id === sid && e.program === "both");
    const homeschoolApp = schoolYearHomeschoolApps.find((a) => a.student_id === sid);
    const enrollment =
      (schoolYearOnly as unknown as SummerEnrollment) ?? bothEnrollment ?? (homeschoolApp as unknown as SummerEnrollment) ?? null;
    const paidSyMonths = (paidSchoolYearByStudent[sid] ?? []).length;
    const ffPaid = (paidFunFridayByStudent[sid]?.months ?? []).filter((k) => SY_FF_KEYS.includes(k)).length;

    return (
      <div className="flex flex-col gap-10">
        {showSteps ? (
          <ol className="mx-auto flex w-full max-w-2xl flex-col gap-16 pt-2">
            <StepBlock n={1} total={3} title="Supply Fee" done={supplyFeePaid}>
              <PhotoCard
                image="/assets/Stock2.jpg"
                imagePosition="center 65%"
                tint="peach"
                term="School Year 26–27"
                title="Annual Supply Fee"
                badge={{ label: "$300", tone: "note" }}
                cta={supplyFeePaid ? { label: "Paid", tone: "paid" } : { label: "Pay now", tone: "pay" }}
                onClick={supplyFeePaid ? undefined : () => openSupplyFee(sid)}
              />
            </StepBlock>
            <StepBlock n={2} total={3} title="Tuition" subtitle="Tuition due December 1">
              {schoolYearHomeschoolApps.map((app) => {
                const hasPlan = (paidHomeschoolByStudent[app.student_id]?.schoolYear.length ?? 0) > 0;
                const paid = paidSupplyFeeByStudent[app.student_id] ?? false;
                return (
                  <PhotoCard
                    key={app.id}
                    image="/assets/Stock11.jpg"
                    tint="mint"
                    term="School Year 26–27"
                    title="Homeschool Drop-In"
                    badge={hasPlan ? { label: "Plan active", tone: "paid" } : { label: "Select schedule & days", tone: "note" }}
                    cta={paid ? { label: hasPlan ? "Add month" : "Set up plan", tone: "plan" } : { label: "Pay supply fee first", tone: "locked" }}
                    onClick={paid ? () => setSheet({ kind: "homeschool_sy", app, view: "plan" }) : undefined}
                    lockedReason={paid ? undefined : LOCKED_REASON}
                    secondary={
                      paid && hasPlan && paidHomeschoolByStudent[app.student_id]
                        ? { label: "View current plan", onClick: () => setSheet({ kind: "homeschool_sy", app, view: "history" }) }
                        : undefined
                    }
                  />
                );
              })}
              <PhotoCard
                image="/assets/Stock1.jpg"
                tint="sky"
                term="School Year 26–27"
                title="School Year Tuition"
                badge={paidSyMonths > 0 ? { label: `${paidSyMonths} mo. paid`, tone: "paid" } : null}
                cta={supplyFeePaid ? { label: "Pay tuition", tone: "pay" } : { label: "Pay supply fee first", tone: "locked" }}
                onClick={supplyFeePaid ? () => openSchoolYearTuition(sid) : undefined}
                lockedReason={supplyFeePaid ? undefined : LOCKED_REASON}
              />
              <TuitionCodeLink onClick={() => setSheet({ kind: "code" })} />
            </StepBlock>
            {enrollment ? (
              <StepBlock n={3} total={3} title="Add-ons" optional subtitle="Friday & aftercare programs">
                <PhotoCard
                  image="/assets/Stock4.jpg"
                  tint="lav"
                  term="School Year 26–27"
                  title="Friday Enrichment Day"
                  badge={ffPaid > 0 ? { label: `${ffPaid} mo. paid`, tone: "paid" } : { label: "Optional", tone: "note" }}
                  cta={{ label: "Select plan", tone: "optional" }}
                  onClick={() => setSheet({ kind: "addon", addon: "funfriday_sy", enrollment })}
                />
                <PhotoCard
                  image="/assets/Stock3.jpg"
                  tint="peach"
                  term="School Year 26–27"
                  title="Extended Learning (3:00 – 5:00pm)"
                  badge={{ label: "Optional", tone: "note" }}
                  cta={{ label: "Select plan", tone: "optional" }}
                  onClick={() => setSheet({ kind: "addon", addon: "aftercare_sy", enrollment })}
                />
              </StepBlock>
            ) : null}
          </ol>
        ) : null}
        {schoolYearPendingItems.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{schoolYearPendingItems.map(pendingCard)}</div> : null}
        {!isSchoolYearOnly && !isBoth && schoolYearPendingItems.length === 0 && schoolYearHomeschoolApps.length === 0 ? <AllCaughtUp /> : null}
        {schoolYearTotalCents > 0 ? <TotalOwed cents={schoolYearTotalCents} /> : null}
      </div>
    );
  };

  const summerSection = () => {
    const pendingList = hasSchoolYearContent ? summerPendingItems : currentItems;
    const homeschoolList = hasSchoolYearContent ? summerHomeschoolApps : currentHomeschool;
    if (currentSummer.length === 0 && pendingList.length === 0 && currentAllSummer.length === 0 && homeschoolList.length === 0) {
      return <AllCaughtUp />;
    }
    const owed = hasSchoolYearContent ? summerTotalCents : totalCents;
    return (
      <div className="flex flex-col gap-4">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentSummer.map((e) => {
            const paidWeeks = paidWeeksByStudent[e.student_id] ?? [];
            return (
              <li key={e.student_id} className="min-w-0">
                <PhotoCard
                  image="/assets/ImageFive.jpg"
                  tint="peach"
                  term="Summer 2026"
                  title="Summer Program Tuition"
                  badge={paidWeeks.length > 0 ? { label: `${paidWeeks.length}w paid`, tone: "paid" } : null}
                  cta={{ label: paidWeeks.length > 0 ? "Add weeks" : "Select plan", tone: "plan" }}
                  onClick={() => setSheet({ kind: "summer", enrollment: e })}
                />
              </li>
            );
          })}
          {currentAllSummer.map((e) => (
            <li key={`aftercare-${e.student_id}`} className="min-w-0">
              <PhotoCard
                image="/assets/ImageNine.jpg"
                tint="butter"
                term="Summer 2026"
                title="Extended Learning (3:00 – 5:00pm)"
                badge={{ label: "Optional", tone: "note" }}
                cta={{ label: "Select plan", tone: "optional" }}
                onClick={() => setSheet({ kind: "addon", addon: "aftercare", enrollment: e })}
              />
            </li>
          ))}
          {currentAllSummer.map((e) => {
            const n = (paidFunFridayByStudent[e.student_id]?.months ?? []).filter((k) => SUMMER_FF_KEYS.includes(k)).length;
            return (
              <li key={`funfriday-${e.student_id}`} className="min-w-0">
                <PhotoCard
                  image="/assets/ImageEleven.jpg"
                  imagePosition="top"
                  tint="lav"
                  term="Summer 2026"
                  title="Friday Enrichment Day"
                  badge={n > 0 ? { label: `${n} mo. paid`, tone: "paid" } : { label: "Optional", tone: "note" }}
                  cta={{ label: "Select plan", tone: "optional" }}
                  onClick={() => setSheet({ kind: "addon", addon: "funfriday", enrollment: e })}
                />
              </li>
            );
          })}
          {pendingList.map((req) => (
            <li key={req.id} className="min-w-0">
              {pendingCard(req)}
            </li>
          ))}
          {homeschoolList.map((app) => {
            const paidData = paidHomeschoolByStudent[app.student_id];
            const isDisabled = app.drop_in_program === "school_year_26_27";
            const hasSummer = (paidData?.summer.length ?? 0) > 0;
            const hasSy = (paidData?.schoolYear.length ?? 0) > 0;
            const hasPrior = hasSummer || hasSy;
            const syMonths = (paidData?.schoolYear ?? []).reduce((sum, entry) => sum + entry.weeks.length, 0);
            let programLabel = "Homeschool Drop-In";
            if (app.drop_in_program === "summer_26") programLabel = "Summer 2026";
            else if (app.drop_in_program === "school_year_26_27") programLabel = "School Year 2026–2027";
            else if (app.drop_in_program === "both") programLabel = "Summer & School Year";
            let ctaLabel = "Set up plan";
            let badgeLabel = "Select schedule & days";
            if (hasSummer && hasSy) {
              ctaLabel = "Manage Plan";
              badgeLabel = "Plans active";
            } else if (hasSummer) {
              ctaLabel = "Add Weeks";
              badgeLabel = "Summer plan active";
            } else if (hasSy) {
              ctaLabel = "Edit Plan";
              badgeLabel = "School year plan active";
            }
            return (
              <li key={app.id} className="min-w-0">
                <PhotoCard
                  image="/assets/Stock7.jpg"
                  tint="mint"
                  term={programLabel}
                  title="Homeschool Drop-In"
                  badge={
                    isDisabled
                      ? null
                      : syMonths > 0
                        ? { label: `${syMonths} mo. paid`, tone: "paid" }
                        : { label: badgeLabel, tone: hasPrior ? "paid" : "note" }
                  }
                  cta={isDisabled ? { label: "Not available yet", tone: "locked" } : { label: ctaLabel, tone: "plan" }}
                  onClick={isDisabled ? undefined : () => setSheet({ kind: "homeschool_summer", app, view: "plan" })}
                  secondary={
                    !isDisabled && hasPrior && paidData
                      ? { label: "View current plan", onClick: () => setSheet({ kind: "homeschool_summer", app, view: "history" }) }
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
        <TuitionCodeLink onClick={() => setSheet({ kind: "code" })} />
        {owed > 0 ? <TotalOwed cents={owed} /> : null}
      </div>
    );
  };

  // ── Sheets ──
  const sheetEl = (() => {
    if (!sheet) return null;
    const close = () => setSheet(null);
    switch (sheet.kind) {
      case "summer":
        return (
          <SummerTuitionFlow
            enrollment={sheet.enrollment}
            studentName={studentMap[sheet.enrollment.student_id]?.name ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            paidWeeks={paidWeeksByStudent[sheet.enrollment.student_id] ?? []}
            initialNote={summerNotesByStudent[sheet.enrollment.student_id] ?? ""}
            siblingEnrollments={unpaidSummerEnrollments.filter(
              (e) => e.student_id !== sheet.enrollment.student_id && e.program !== "homeschool_drop_in",
            )}
            siblingPaidWeeks={paidWeeksByStudent}
            siblingStudentMap={studentMap}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      case "addon": {
        const cfg = addonConfig(sheet.addon);
        const isAftercare = sheet.addon === "aftercare" || sheet.addon === "aftercare_sy";
        const sid = sheet.enrollment.student_id;
        const paid = isAftercare
          ? { months: paidAftercareByStudent[sid]?.months ?? [], items: paidAftercareByStudent[sid]?.days ?? [] }
          : { months: paidFunFridayByStudent[sid]?.months ?? [], items: paidFunFridayByStudent[sid]?.fridays ?? [] };
        return (
          <AddonFlow
            kind={sheet.addon}
            enrollment={sheet.enrollment}
            studentName={studentMap[sid]?.name ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            paidMonths={new Set(paid.months)}
            paidItems={addonPaidItems(cfg, paid)}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      }
      case "homeschool_summer":
        return (
          <SummerHomeschoolFlow
            app={sheet.app}
            studentName={studentMap[sheet.app.student_id]?.name ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            paidData={paidHomeschoolByStudent[sheet.app.student_id]}
            initialNote={homeschoolNotesByStudent[sheet.app.student_id] ?? ""}
            initialView={sheet.view}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      case "homeschool_sy":
        return (
          <SchoolYearHomeschoolFlow
            app={sheet.app}
            studentName={studentMap[sheet.app.student_id]?.name ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            paidData={paidHomeschoolByStudent[sheet.app.student_id]}
            siblingApps={homeschoolDropInApps.filter(
              (a) =>
                a.id !== sheet.app.id &&
                (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both") &&
                paidSupplyFeeByStudent[a.student_id],
            )}
            siblingPaidHomeschool={paidHomeschoolByStudent}
            siblingStudentMap={studentMap}
            initialView={sheet.view}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      case "supply": {
        const candidates: SupplyFeeCandidate[] = schoolYearStudentsForSupplyFee
          .filter((s) => s.studentId !== sheet.studentId)
          .map((s) => ({ studentId: s.studentId, studentName: studentMap[s.studentId]?.name ?? null, childGrade: s.childGrade, programType: s.programType }));
        return (
          <SupplyFeeFlow
            studentId={sheet.studentId}
            studentName={studentMap[sheet.studentId]?.name ?? null}
            childGrade={sheet.childGrade}
            programType={sheet.programType}
            applicationId={homeschoolDropInApps.find((a) => a.student_id === sheet.studentId)?.id}
            paidSchoolYearMonths={paidSchoolYearByStudent[sheet.studentId] ?? []}
            candidates={candidates}
            resolveSiblings={(ids) =>
              candidates
                .filter((c) => ids.includes(c.studentId))
                .map((c) => ({
                  ...c,
                  applicationId: homeschoolDropInApps.find((a) => a.student_id === c.studentId)?.id,
                  paidSchoolYearMonths: paidSchoolYearByStudent[c.studentId] ?? [],
                }))
            }
            parentId={parentId}
            parentEmail={parentEmail}
            paidHomeschoolByStudent={paidHomeschoolByStudent}
            homeschoolPricingByStudentId={homeschoolPricingByStudentId}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      }
      case "sy_tuition":
        return (
          <SchoolYearTuitionFlow
            studentId={sheet.studentId}
            studentName={studentMap[sheet.studentId]?.name ?? null}
            childGrade={sheet.childGrade}
            parentId={parentId}
            parentEmail={parentEmail}
            paidMonthIndices={new Set(paidSchoolYearByStudent[sheet.studentId] ?? [])}
            siblingStudents={[
              ...schoolYearOnlyApps.filter((a) => a.student_id !== sheet.studentId),
              ...summerEnrollments
                .filter((e) => e.student_id !== sheet.studentId && e.program === "both")
                .map((e) => ({ student_id: e.student_id, child_grade: e.child_grade })),
            ].filter((s) => paidSupplyFeeByStudent[s.student_id])}
            siblingPaidSchoolYear={paidSchoolYearByStudent}
            siblingStudentMap={studentMap}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      case "code":
        return (
          <TuitionCodeFlow parentId={parentId} parentEmail={parentEmail} recentTuitionCodes={recentTuitionCodes} readOnly={readOnlyPreview} onClose={close} />
        );
      case "registration": {
        const app =
          sheet.type === "full_time"
            ? (summerEnrollments.find((e) => e.id === sheet.appId) ?? null)
            : (homeschoolDropInApps.find((a) => a.id === sheet.appId) ?? null);
        if (!app) return null;
        return (
          <RegistrationFlow
            app={app}
            type={sheet.type}
            studentName={studentMap[app.student_id]?.name ?? null}
            parentId={parentId}
            parentEmail={parentEmail}
            readOnly={readOnlyPreview}
            onClose={close}
          />
        );
      }
    }
  })();

  const termOptions = [
    ...(!isSchoolYearOnlyStudent ? [{ value: "summer" as const, label: "Summer", icon: "☀️" }] : []),
    {
      value: "school_year" as const,
      label: "School Year",
      icon: "🎒",
      badge: "New!",
    },
  ];

  const showSidebar = allStudentIds.length > 0 || hasOrphans;

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      {/* Left: children (original layout) */}
      {showSidebar ? (
        <ChildrenSidebar
          items={switcherItems.map((c) => ({ id: c.id, name: c.name, imageUrl: c.imageUrl ?? null, sub: c.sub ?? null, attention: !!c.attention }))}
          activeId={activeStudentId}
          onChange={setActiveStudentId}
          controls="billing-panel"
        />
      ) : null}

      {/* Right: main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {switcherItems.length > 0 ? (
          <div className="pointer-events-auto shrink-0 border-b border-[var(--sf-ink)]/[0.06] bg-white/70 px-6 py-2.5 md:hidden">
            <ChildSwitcher items={switcherItems} activeId={activeStudentId} onChange={setActiveStudentId} label="Choose a child" controls="billing-panel" showSingle />
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto" data-lenis-prevent>
          {!dueDismissed ? (
            <div className="mx-auto max-w-5xl px-6 pt-6">
              <DueBanner onDismiss={() => setDueDismissed(true)} />
            </div>
          ) : null}
          <div id="billing-panel" className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-20 pt-8">
            <BillingHero
              firstName={programBadgeLabel ? (activeFullName ? firstName(activeFullName) : null) : null}
              programLabel={programBadgeLabel}
              dropInLabel={dropInBadgeLabel}
            />

            {secureSpot ? (
              <SecureSpotBanner
                childFirstName={firstName(studentMap[secureSpot.studentId]?.name, "") || null}
                onCommit={() => setSheet({ kind: "registration", appId: secureSpot.appId, type: secureSpot.type })}
              />
            ) : null}

            {hasPendingContent ? (
              <section aria-labelledby="billing-pending" className="flex flex-col gap-4">
                <SectionHeader
                  id="billing-pending"
                  title="Pending Payments"
                  action={
                    <button type="button" onClick={() => setCheckOpen(true)} className={btnGhostSm}>
                      <span aria-hidden="true">✉️</span> Want to pay by check?
                    </button>
                  }
                />
                {nothingAtAll ? (
                  <AllCaughtUp />
                ) : (
                  <>
                    {multiChildSummerEligible && (activeTermTab === "summer" || !hasSchoolYearContent) ? (
                      <SiblingsBanner
                        action={
                          <button
                            type="button"
                            onClick={() => {
                              const e = unpaidSummerEnrollments.find((x) => x.program === "summer_26" || x.program === "both");
                              if (e) setSheet({ kind: "summer", enrollment: e });
                            }}
                            className={`${btnGhostSm} shrink-0`}
                          >
                            View tuition
                          </button>
                        }
                      />
                    ) : null}
                    {multiChildSchoolYearEligible && activeTermTab === "school_year" ? <SiblingsBanner /> : null}
                    {hasSchoolYearContent && !isOtherTab ? (
                      <div className="pointer-events-auto">
                        <PillTabs
                          label="Term"
                          value={activeTermTab}
                          onChange={(tab) => setUserTermTab({ studentKey: studentTermKey, tab })}
                          options={termOptions}
                        />
                      </div>
                    ) : null}
                    {activeNonEnrolled ? <NonEnrolledCard app={activeNonEnrolled} /> : showSchoolYearTab ? schoolYearSection() : summerSection()}
                  </>
                )}
              </section>
            ) : null}

            <PaymentHistory transactions={visibleTransactions} studentMap={studentMap} />
          </div>
        </div>
      </div>

      {sheetEl}

      <PendingSheet
        pending={selectedPending}
        studentName={selectedPending?.student_id ? (studentMap[selectedPending.student_id]?.name ?? null) : null}
        canPay={!!pendingPay}
        onPay={() => {
          const go = pendingPay;
          setSelectedPending(null);
          go?.();
        }}
        onClose={() => setSelectedPending(null)}
      />
      <PayByCheckDialog open={checkOpen} onClose={() => setCheckOpen(false)} />
      {readOnlyPreview ? null : (
        <TuitionFeedbackPopup isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSubmit={submitTuitionFeedback} />
      )}
    </div>
  );
}
