"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PortalShell from "@/app/parent/_garden/PortalShell";
import ChildSwitcher, { type SwitcherChild } from "@/app/parent/_garden/ChildSwitcher";
import { EmptyState } from "@/app/parent/_garden/states";
import { usePortalFeedback, celebrate } from "@/app/parent/_garden/feedback";
import type { StudentSignatureMap, SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import {
  CONTRACT_3_ID,
  CONTRACT_4_ID,
  CONTRACT_5_ID,
  CONTRACT_6_ID,
  CONTRACT_7_ID,
  CONTRACT_8_ID,
} from "@/app/types/enrollment-signatures";
import { enrollApplication } from "@/app/actions/enrollApplication";
import { PROGRAM_LABELS, getBillingProgramLabel, getShortProgramLabel } from "@/app/lib/application-programs";
import ContractModal from "./ContractModal";
import HealthFormModal from "./HealthFormModal";
import MedicationPlanModal from "./MedicationPlanModal";
import ImmunizationUploadModal from "./ImmunizationUploadModal";
import PhotoReleaseModal from "./PhotoReleaseModal";
import AssumptionOfRiskModal from "./AssumptionOfRiskModal";
import AuthorizedPickupModal from "./AuthorizedPickupModal";
import ApplicationViewSlideOver from "./ApplicationViewSlideOver";
import HealthStatementModal from "./HealthStatementModal";
import FeeSheet from "./garden/FeeSheet";
import EnrollmentCodeDialog from "./garden/EnrollmentCodeDialog";
import { AnotherKidNote, ChecklistRows, ConfirmedCard, EnrollmentHero, NextUpCard, PendingPanel } from "./garden/ChecklistParts";
import {
  childNameOf,
  continueStepFor,
  requiredComplete,
  type Application,
  type AuthorizedPickupPerson,
  type AuthorizedPickupPlan,
  type ChecklistItem,
  type ChecklistState,
  type StudentHealthInfo,
  type StudentMedication,
  type StudentMedicationPlan,
} from "./garden/checklist";

type MedPlan = { plan: StudentMedicationPlan | null; medications: StudentMedication[] };
type PickupPlan = { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] };
type Consent = "FULL" | "LIMITED" | "NO";

interface ChildTabsProps {
  apps: Application[];
  pendingApps: Application[];
  signaturesByStudent: StudentSignatureMap;
  healthInfoByStudent: Record<string, StudentHealthInfo>;
  medicationPlanByStudent: Record<string, MedPlan>;
  parentName: string;
  parentId: string;
  parentEmail: string;
  immunizationFileCountByStudent: Record<string, number>;
  consentByStudent: Record<string, Consent>;
  authorizedPickupByStudent: Record<string, PickupPlan>;
  registrationFeePaidByStudent: Record<string, boolean>;
  healthStatementByStudent: Record<string, { option_type: string } | null>;
  religiousExemptionCountByStudent: Record<string, number>;
  profileImageByStudent: Record<string, string | null>;
  readOnlyPreview?: boolean;
}

/** Which sheet is showing, for which student. `nonce` remounts it fresh on every open. */
type Sheet =
  | { kind: "contract"; contractId: number; studentId: string; nonce: number }
  | {
      kind: "health" | "medication" | "photo" | "risk" | "pickup" | "statement" | "immunization";
      studentId: string;
      nonce: number;
    }
  | { kind: "fee"; appIds: string[]; nonce: number }
  | { kind: "application"; appId: string; nonce: number };

type SheetSpec =
  | { kind: "contract"; contractId: number; studentId: string }
  | {
      kind: "health" | "medication" | "photo" | "risk" | "pickup" | "statement" | "immunization";
      studentId: string;
    }
  | { kind: "fee"; appIds: string[] }
  | { kind: "application"; appId: string };

function programLabelOf(program: string | null): string | null {
  if (program === "homeschool_drop_in") return "Homeschool Drop-In";
  if (program && program in PROGRAM_LABELS) return getShortProgramLabel(program);
  return null;
}

export default function ChildTabs(props: ChildTabsProps) {
  return (
    <PortalShell>
      <EnrollmentPage {...props} />
    </PortalShell>
  );
}

function EnrollmentPage({
  apps,
  pendingApps,
  signaturesByStudent,
  healthInfoByStudent,
  medicationPlanByStudent,
  parentName,
  parentId,
  parentEmail,
  immunizationFileCountByStudent,
  consentByStudent,
  authorizedPickupByStudent,
  registrationFeePaidByStudent,
  healthStatementByStudent,
  religiousExemptionCountByStudent,
  profileImageByStudent,
  readOnlyPreview,
}: ChildTabsProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const { toast } = usePortalFeedback(readOnlyPreview);

  const allApps = useMemo(() => [...apps, ...pendingApps], [apps, pendingApps]);
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    const fromUrl = searchParams.get("app");
    if (fromUrl && allApps.some((a) => a.id === fromUrl)) return fromUrl;
    return apps[0]?.id ?? pendingApps[0]?.id ?? null;
  });

  // Local mirrors of server data, so the checklist reacts instantly after each save.
  const [sigs, setSigs] = useState<StudentSignatureMap>(signaturesByStudent);
  const [healthInfo, setHealthInfo] = useState(healthInfoByStudent);
  const [medPlans, setMedPlans] = useState(medicationPlanByStudent);
  const [immunizationCounts, setImmunizationCounts] = useState(immunizationFileCountByStudent);
  const [consent, setConsent] = useState(consentByStudent);
  const [pickups, setPickups] = useState(authorizedPickupByStudent);
  const [statements, setStatements] = useState(healthStatementByStudent);
  const [exemptionCounts, setExemptionCounts] = useState(religiousExemptionCountByStudent);
  // Paid status only ever comes from the server (after Stripe sends the parent back).
  const feePaid = registrationFeePaidByStudent;

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const nonce = useRef(0);
  const openSheet = useCallback((s: SheetSpec) => {
    nonce.current += 1;
    setSheet({ ...s, nonce: nonce.current } as Sheet);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    // Unmount once the exit animation is done, so a discarded draft can't keep the
    // "leave site?" guard alive. Skipped if another sheet opened in the meantime.
    const closing = nonce.current;
    window.setTimeout(() => {
      if (nonce.current === closing) setSheet(null);
    }, 450);
  }, []);

  const stateFor = useCallback(
    (studentId: string): ChecklistState => ({
      signatures: sigs[studentId] ?? {},
      immunizationCount: immunizationCounts[studentId] ?? 0,
      feePaid: feePaid[studentId] ?? false,
    }),
    [sigs, immunizationCounts, feePaid],
  );

  const activeApproved = apps.find((a) => a.id === activeTabId) ?? null;
  const activePending = pendingApps.find((a) => a.id === activeTabId) ?? null;
  const activeStudentId = activeApproved?.student_id ?? "";
  const activeState = stateFor(activeStudentId);

  /* ── Enroll on the real transition to "every required step done" ── */
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(() => new Set(apps.filter((a) => a.status === "enrolled").map((a) => a.id)));
  const enrolling = useRef<Set<string>>(new Set());
  const activeComplete = activeApproved ? requiredComplete(activeState) : false;
  useEffect(() => {
    if (!activeApproved || readOnlyPreview || !activeComplete) return;
    const id = activeApproved.id;
    if (enrolledIds.has(id) || enrolling.current.has(id)) return;
    enrolling.current.add(id);
    enrollApplication(id)
      .then((res) => {
        if (res && "success" in res && res.success) {
          setEnrolledIds((prev) => new Set(prev).add(id));
          void celebrate();
          toast.show({ tone: "success", title: "Enrollment confirmed 🎉", message: childNameOf(activeApproved) });
          router.refresh();
        } else {
          enrolling.current.delete(id);
        }
      })
      .catch(() => enrolling.current.delete(id));
  }, [activeApproved, activeComplete, enrolledIds, readOnlyPreview, router, toast]);

  /* ── Save callbacks (each knows its student from the open sheet) ── */

  const putSig = (studentId: string, sig: EnrollmentSignature) =>
    setSigs((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] ?? {}), [`${sig.contract_id}-${sig.section_id}`]: sig } }));
  const putSigMap = (studentId: string, map: SignatureMap) => setSigs((prev) => ({ ...prev, [studentId]: map }));

  const openItem = (item: ChecklistItem) => {
    if (!activeApproved) return;
    const sid = activeStudentId;
    if (item.kind === "immunization") return openSheet({ kind: "immunization", studentId: sid });
    if (item.kind === "fee") {
      if (feePaid[sid]) {
        toast.show({ tone: "success", title: "Registration fee paid ✓", message: childNameOf(activeApproved) });
        return;
      }
      const unpaid = apps.filter((a) => !(feePaid[a.student_id ?? ""] ?? false));
      return openSheet({ kind: "fee", appIds: unpaid.length >= 2 ? unpaid.map((a) => a.id) : [activeApproved.id] });
    }
    switch (item.contractId) {
      case CONTRACT_3_ID:
        return openSheet({ kind: "health", studentId: sid });
      case CONTRACT_4_ID:
        return openSheet({ kind: "medication", studentId: sid });
      case CONTRACT_5_ID:
        return openSheet({ kind: "photo", studentId: sid });
      case CONTRACT_6_ID:
        return openSheet({ kind: "risk", studentId: sid });
      case CONTRACT_7_ID:
        return openSheet({ kind: "pickup", studentId: sid });
      case CONTRACT_8_ID:
        return openSheet({ kind: "statement", studentId: sid });
      default:
        if (item.contractId) openSheet({ kind: "contract", contractId: item.contractId, studentId: sid });
    }
  };

  /* ── Empty: no applications at all ── */
  if (allApps.length === 0 || !activeTabId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-10 sm:pt-14">
        <h1 className="sf-display mb-6 text-[2.2rem] leading-none">Enrollment Checklist</h1>
        <EmptyState
          emoji="🌱"
          tint="mint"
          title="No enrolled students."
          action={
            <Link href="/apply/step/1?new=1" className="inline-flex min-h-11 items-center rounded-full bg-[var(--sf-ink)] px-5 text-sm font-extrabold text-white">
              New Application
            </Link>
          }
        />
      </div>
    );
  }

  const switcherItems: SwitcherChild[] = [
    ...apps.map((a) => {
      const sid = a.student_id ?? "";
      const done = enrolledIds.has(a.id) || requiredComplete(stateFor(sid));
      return {
        id: a.id,
        name: childNameOf(a),
        imageUrl: profileImageByStudent[sid] ?? null,
        sub: done ? "✓ Enrolled" : (programLabelOf(a.program ?? null) ?? "Enrollment in progress"),
        attention: !done,
        attentionLabel: "Enrollment not complete",
      };
    }),
    ...pendingApps.map((a) => ({
      id: a.id,
      name: childNameOf(a),
      imageUrl: profileImageByStudent[a.student_id ?? ""] ?? null,
      sub: a.status === "in_progress" ? "Application Incomplete" : "Under Review",
    })),
  ];

  const newAppLink = (
    <Link
      href="/apply/step/1?new=1"
      className="flex min-h-11 items-center gap-2.5 rounded-[20px] border-2 border-dashed border-[var(--sf-ink)]/15 px-3 py-2 text-sm font-extrabold text-[var(--sf-soft)] transition hover:border-[var(--sf-sage)] hover:bg-white/60 hover:text-[var(--sf-sage-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-current text-base" aria-hidden="true">
        +
      </span>
      New Application
    </Link>
  );

  const sheetApp = (studentId: string) => apps.find((a) => a.student_id === studentId);
  const panelId = "enrollment-panel";
  const multiple = allApps.length > 1;

  return (
    <div className="relative">
      {/* Soft wash behind the page, as on Home */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-[radial-gradient(60%_80%_at_15%_0%,rgba(205,238,213,0.7),transparent_70%),radial-gradient(50%_70%_at_90%_10%,rgba(207,230,251,0.55),transparent_70%)]"
        aria-hidden="true"
      />
      <div className={`relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 pb-20 pt-8 sm:pt-12 ${multiple ? "lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10" : ""}`}>
        {multiple ? (
          <>
            {/* Desktop rail */}
            <aside className="hidden lg:block" aria-label="Children">
              <p className="sf-hand mb-2 px-1 text-lg text-[var(--sf-sage-deep)]">your children</p>
              <ChildSwitcher items={switcherItems} activeId={activeTabId} onChange={setActiveTabId} variant="cards" label="Choose a child" controls={panelId} />
              <div className="mt-2">{newAppLink}</div>
            </aside>
            {/* Phones / tablets */}
            <div className="flex flex-col gap-3 lg:hidden">
              <ChildSwitcher items={switcherItems} activeId={activeTabId} onChange={setActiveTabId} variant="chips" label="Choose a child" controls={panelId} />
            </div>
          </>
        ) : null}

        <div id={panelId} role={multiple ? "tabpanel" : undefined} className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTabId}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {activePending ? (
                <PendingPanel
                  app={activePending}
                  childName={childNameOf(activePending)}
                  programLabel={
                    activePending.program === "homeschool_drop_in"
                      ? "Homeschool Drop-In"
                      : activePending.program && activePending.program in PROGRAM_LABELS
                        ? getBillingProgramLabel(activePending.program)
                        : null
                  }
                  continueHref={`/apply/step/${continueStepFor(activePending)}?appId=${activePending.id}`}
                  onView={() => openSheet({ kind: "application", appId: activePending.id })}
                  codeEntry={<EnrollmentCodeDialog applicationId={activePending.id} onSuccess={() => router.refresh()} readOnlyPreview={readOnlyPreview} />}
                />
              ) : activeApproved ? (
                <>
                  <EnrollmentHero
                    childName={childNameOf(activeApproved)}
                    childId={activeApproved.id}
                    imageUrl={profileImageByStudent[activeStudentId] ?? null}
                    programLabel={programLabelOf(activeApproved.program ?? null)}
                    state={activeState}
                    onViewApplication={() => openSheet({ kind: "application", appId: activeApproved.id })}
                  />
                  {enrolledIds.has(activeApproved.id) || activeComplete ? (
                    <ConfirmedCard childName={childNameOf(activeApproved)} programLabel={programLabelOf(activeApproved.program ?? null) ?? "the program"} />
                  ) : (
                    <NextUpCard state={activeState} onOpen={openItem} />
                  )}
                  <section aria-labelledby="enrollment-steps">
                    <h2 id="enrollment-steps" className="sf-display mb-1 text-[1.9rem] leading-none sm:text-[2.3rem]">
                      All steps
                    </h2>
                    <p className="sf-hand mb-4 text-lg text-[var(--sf-sage-deep)]">tap any step to open it</p>
                    <ChecklistRows state={activeState} onOpen={openItem} />
                    <AnotherKidNote />
                  </section>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
          {multiple ? <div className="mt-6 lg:hidden">{newAppLink}</div> : <div className="mt-6 max-w-xs">{newAppLink}</div>}
        </div>
      </div>

      {/* ── Sheets ── */}
      {sheet?.kind === "contract" ? (
        <ContractModal
          key={sheet.nonce}
          isOpen={sheetOpen}
          onClose={closeSheet}
          contractId={sheet.contractId}
          studentId={sheet.studentId}
          parentName={parentName}
          existingSignatures={sigs[sheet.studentId] ?? {}}
          onSignaturesSaved={(m) => putSigMap(sheet.studentId, m)}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "health" && sheetApp(sheet.studentId) ? (
        <HealthFormModal
          key={sheet.nonce}
          isOpen={sheetOpen}
          onClose={closeSheet}
          studentId={sheet.studentId}
          parentName={parentName}
          app={sheetApp(sheet.studentId)!}
          existingSignatures={sigs[sheet.studentId] ?? {}}
          existingHealthInfo={healthInfo[sheet.studentId] ?? null}
          onSignaturesSaved={(m) => putSigMap(sheet.studentId, m)}
          onHealthInfoSaved={(info) => setHealthInfo((prev) => ({ ...prev, [sheet.studentId]: info }))}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "medication" && sheetApp(sheet.studentId) ? (
        <MedicationPlanModal
          key={sheet.nonce}
          isOpen={sheetOpen}
          onClose={closeSheet}
          studentId={sheet.studentId}
          parentName={parentName}
          app={sheetApp(sheet.studentId)!}
          existingSignatures={sigs[sheet.studentId] ?? {}}
          existingPlan={medPlans[sheet.studentId] ?? { plan: null, medications: [] }}
          onSignaturesSaved={(m) => putSigMap(sheet.studentId, m)}
          onPlanSaved={(plan, medications) => {
            setMedPlans((prev) => ({
              ...prev,
              [sheet.studentId]: { plan, medications: medications ?? prev[sheet.studentId]?.medications ?? [] },
            }));
            router.refresh();
          }}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "photo" && sheetApp(sheet.studentId) ? (
        <PhotoReleaseModal
          key={sheet.nonce}
          open={sheetOpen}
          onClose={closeSheet}
          studentId={sheet.studentId}
          studentName={childNameOf(sheetApp(sheet.studentId)!)}
          parentId={parentId}
          parentName={parentName}
          signatures={sigs[sheet.studentId] ?? {}}
          onSectionSaved={(sig) => putSig(sheet.studentId, sig)}
          existingConsent={consent[sheet.studentId] ?? null}
          onConsentSaved={(level) => setConsent((prev) => ({ ...prev, [sheet.studentId]: level }))}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "risk" && sheetApp(sheet.studentId) ? (
        <AssumptionOfRiskModal
          key={sheet.nonce}
          open={sheetOpen}
          onClose={closeSheet}
          studentId={sheet.studentId}
          parentId={parentId}
          parentName={parentName}
          app={sheetApp(sheet.studentId)!}
          signatures={sigs[sheet.studentId] ?? {}}
          onSectionSaved={(sig) => putSig(sheet.studentId, sig)}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "pickup" && sheetApp(sheet.studentId) ? (
        <AuthorizedPickupModal
          key={sheet.nonce}
          open={sheetOpen}
          onClose={closeSheet}
          studentId={sheet.studentId}
          parentId={parentId}
          parentName={parentName}
          app={sheetApp(sheet.studentId)!}
          signatures={sigs[sheet.studentId] ?? {}}
          onSectionSaved={(sig) => putSig(sheet.studentId, sig)}
          existingPlan={pickups[sheet.studentId] ?? { plan: null, persons: [] }}
          onPlanSaved={(plan, persons) => {
            setPickups((prev) => ({
              ...prev,
              [sheet.studentId]: { plan, persons: persons ?? prev[sheet.studentId]?.persons ?? [] },
            }));
            router.refresh();
          }}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "statement" && sheetApp(sheet.studentId) ? (
        <HealthStatementModal
          key={sheet.nonce}
          isOpen={sheetOpen}
          app={sheetApp(sheet.studentId)!}
          parentId={parentId}
          parentName={parentName}
          existingStatement={statements[sheet.studentId] ?? null}
          initialReligiousExemptionCount={exemptionCounts[sheet.studentId] ?? 0}
          existingSig={sigs[sheet.studentId]?.[`${CONTRACT_8_ID}-1`]}
          onSectionSaved={(sig) => putSig(sheet.studentId, sig)}
          onStatementSaved={(option) => setStatements((prev) => ({ ...prev, [sheet.studentId]: { option_type: option } }))}
          onExemptionCountChange={(count) => setExemptionCounts((prev) => ({ ...prev, [sheet.studentId]: count }))}
          onClose={closeSheet}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "immunization" ? (
        <ImmunizationUploadModal
          key={sheet.nonce}
          isOpen={sheetOpen}
          onClose={closeSheet}
          parentId={parentId}
          studentId={sheet.studentId}
          studentName={sheetApp(sheet.studentId) ? childNameOf(sheetApp(sheet.studentId)!) : "Student"}
          onUploadComplete={() => {}}
          onFilesChanged={(sid, count) => setImmunizationCounts((prev) => ({ ...prev, [sid]: count }))}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "fee" ? (
        <FeeSheet
          key={sheet.nonce}
          open={sheetOpen}
          apps={sheet.appIds.map((id) => apps.find((a) => a.id === id)).filter((a): a is Application => !!a)}
          parentEmail={parentEmail}
          onClose={closeSheet}
          onPayIndividually={activeApproved && !feePaid[activeStudentId] ? () => openSheet({ kind: "fee", appIds: [activeApproved.id] }) : undefined}
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}

      {sheet?.kind === "application" && allApps.find((a) => a.id === sheet.appId) ? (
        <ApplicationViewSlideOver key={sheet.nonce} open={sheetOpen} app={allApps.find((a) => a.id === sheet.appId)!} onClose={closeSheet} />
      ) : null}
    </div>
  );
}
