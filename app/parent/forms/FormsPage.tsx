"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { StudentSignatureMap } from "@/app/types/enrollment-signatures";
import {
  isContractComplete,
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_6_ID,
} from "@/app/types/enrollment-signatures";
import PortalShell from "@/app/parent/_garden/PortalShell";
import ChildSwitcher from "@/app/parent/_garden/ChildSwitcher";
import { EmptyState } from "@/app/parent/_garden/states";
import { Arrow, CheckIcon, TINT_BG, type HomeTint } from "@/app/parent/_garden/ui";
import ContractModal from "@/app/parent/dashboard/ContractModal";
import HealthFormModal from "@/app/parent/dashboard/HealthFormModal";
import HealthStatementModal from "@/app/parent/dashboard/HealthStatementModal";
import PhotoReleaseModal from "@/app/parent/dashboard/PhotoReleaseModal";
import MedicationPlanModal from "@/app/parent/dashboard/MedicationPlanModal";
import AssumptionOfRiskModal from "@/app/parent/dashboard/AssumptionOfRiskModal";
import AuthorizedPickupModal from "@/app/parent/dashboard/AuthorizedPickupModal";
import ImmunizationUploadModal from "@/app/parent/dashboard/ImmunizationUploadModal";
import {
  childNameOf,
  hasHealthFormDetails,
  type Application,
  type AuthorizedPickupPerson,
  type AuthorizedPickupPlan,
  type StudentHealthInfo,
  type StudentMedication,
  type StudentMedicationPlan,
} from "@/app/parent/dashboard/garden/checklist";

interface Props {
  apps: Application[];
  signaturesByStudent: StudentSignatureMap;
  healthInfoByStudent: Record<string, StudentHealthInfo>;
  medicationPlanByStudent: Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }>;
  immunizationFileCountByStudent: Record<string, number>;
  consentByStudent: Record<string, "FULL" | "LIMITED" | "NO">;
  authorizedPickupByStudent: Record<string, { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }>;
  healthStatementByStudent: Record<string, { option_type: string } | null>;
  religiousExemptionCountByStudent: Record<string, number>;
  parentId: string;
  parentName: string;
  /** Admin "view as parent": documents still open (they're read-only anyway). */
  readOnlyPreview?: boolean;
}

type DocId =
  | "contract1"
  | "contract2"
  | "healthForm"
  | "medicationPlan"
  | "photoRelease"
  | "assumptionOfRisk"
  | "authorizedPickup"
  | "healthStatement"
  | "immunization";

type DocEntry = { id: DocId; label: string; emoji: string; tint: HomeTint };

const noOp = () => {};

export default function FormsPage(props: Props) {
  return (
    <PortalShell>
      <FormsContent {...props} />
    </PortalShell>
  );
}

function FormsContent({
  apps,
  signaturesByStudent,
  healthInfoByStudent,
  medicationPlanByStudent,
  immunizationFileCountByStudent,
  consentByStudent,
  authorizedPickupByStudent,
  healthStatementByStudent,
  religiousExemptionCountByStudent,
  parentId,
  parentName,
  readOnlyPreview,
}: Props) {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(apps[0]?.id ?? null);
  const [open, setOpen] = useState<{ id: DocId; nonce: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const nonce = useRef(0);

  const openDoc = (id: DocId) => {
    nonce.current += 1;
    setOpen({ id, nonce: nonce.current });
    setSheetOpen(true);
  };
  const closeDoc = () => {
    setSheetOpen(false);
    const closing = nonce.current;
    window.setTimeout(() => {
      if (nonce.current === closing) setOpen(null);
    }, 450);
  };

  const header = (
    <div className="mb-8">
      <h1 className="sf-display text-[2.4rem] leading-none sm:text-[3rem]">Forms &amp; Documents</h1>
    </div>
  );

  if (apps.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-8 sm:pt-12">
        {header}
        <EmptyState emoji="📂" tint="sky" title="No enrolled children found." body="If you believe this is an error, please contact us." />
      </div>
    );
  }

  const activeApp = apps.find((a) => a.id === activeId) ?? apps[0];
  const studentId = activeApp.student_id ?? "";
  const sigs = signaturesByStudent[studentId] ?? {};
  const healthInfo = healthInfoByStudent[studentId] ?? null;
  const medicationPlan = medicationPlanByStudent[studentId] ?? { plan: null, medications: [] };
  const immunizationFileCount = immunizationFileCountByStudent[studentId] ?? 0;
  const consent = consentByStudent[studentId] ?? null;
  const authorizedPickup = authorizedPickupByStudent[studentId] ?? { plan: null, persons: [] };
  const healthStatement = healthStatementByStudent[studentId] ?? null;
  const religiousExemptionCount = religiousExemptionCountByStudent[studentId] ?? 0;
  const hasHealthFormSig = Object.keys(sigs).some((k) => k.startsWith("3-"));

  // Same documents, labels and order as before. The health form only counts when it
  // has real health details (Emergency Contacts saves can create a bare row on their own).
  const visibleDocs: DocEntry[] = [
    { id: "contract1" as const, label: "Program Description, Parent Responsibilities & Key Policies", emoji: "📜", tint: "sky" as const, show: isContractComplete(sigs, CONTRACT_1_ID, CONTRACT_1_TOTAL_SECTIONS) },
    { id: "contract2" as const, label: "Community Agreement for Families and Staff", emoji: "🤝", tint: "lav" as const, show: isContractComplete(sigs, CONTRACT_2_ID, CONTRACT_2_TOTAL_SECTIONS) },
    { id: "healthForm" as const, label: "Emergency Contact, Health, and Immunization Form", emoji: "❤️", tint: "coral" as const, show: hasHealthFormDetails(healthInfo) || hasHealthFormSig },
    { id: "medicationPlan" as const, label: "Emergency Medication Plan", emoji: "💊", tint: "peach" as const, show: !!medicationPlan.plan },
    { id: "photoRelease" as const, label: "Photo, Video, and Media Release", emoji: "📸", tint: "butter" as const, show: !!consent },
    { id: "assumptionOfRisk" as const, label: "Assumption of Risk and Liability Release", emoji: "⚠️", tint: "peach" as const, show: !!sigs[`${CONTRACT_6_ID}-1`] },
    { id: "authorizedPickup" as const, label: "Additional Authorized Pickup Person", emoji: "🚗", tint: "lav" as const, show: !!authorizedPickup.plan },
    { id: "healthStatement" as const, label: "Health Information Form", emoji: "📋", tint: "sky" as const, show: !!healthStatement },
    { id: "immunization" as const, label: "Proof of Immunizations", emoji: "🛡️", tint: "mint" as const, show: immunizationFileCount > 0 },
  ]
    .filter((d) => d.show)
    .map(({ id, label, emoji, tint }) => ({ id, label, emoji, tint }));

  const childName = childNameOf(activeApp);
  const panelId = "forms-panel";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-8 sm:pt-12">
      {header}

      <ChildSwitcher
        items={apps.map((a, i) => ({ id: a.id, name: a.child_legal_name ?? `Child ${i + 1}` }))}
        activeId={activeApp.id}
        onChange={(id) => {
          setActiveId(id);
          closeDoc();
        }}
        label="Choose a child"
        controls={panelId}
        className="mb-6"
      />

      <section id={panelId} aria-labelledby="forms-list-heading" role={apps.length > 1 ? "tabpanel" : undefined}>
        <h2 id="forms-list-heading" className="sr-only">
          {childName}&apos;s documents
        </h2>
        {visibleDocs.length === 0 ? (
          <EmptyState emoji="🗂️" tint="butter" title="No completed documents yet" body="Completed enrollment forms will appear here." />
        ) : (
          <>
            <p className="sf-hand mb-3 text-lg text-[var(--sf-sage-deep)]">
              {visibleDocs.length} document{visibleDocs.length !== 1 ? "s" : ""} on file for {childName.split(" ")[0]}
            </p>
            <ul className="flex flex-col gap-2.5">
              {visibleDocs.map((doc, i) => (
                <motion.li
                  key={`${activeApp.id}-${doc.id}`}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: reduce ? 0 : i * 0.03 }}
                >
                  <button
                    type="button"
                    onClick={() => openDoc(doc.id)}
                    className="group flex min-h-[64px] w-full items-center gap-3.5 rounded-[22px] bg-white px-4 py-3 text-left shadow-[0_14px_30px_-24px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.07] transition hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/20 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] sm:px-5 cursor-pointer"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${TINT_BG[doc.tint]}`} aria-hidden="true">
                      {doc.emoji}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-extrabold leading-snug">{doc.label}</span>
                    <span className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full bg-[var(--sf-mint)] px-2.5 text-xs font-extrabold text-[var(--sf-sage-deep)]">
                      <CheckIcon className="h-3 w-3" /> On file
                    </span>
                    <Arrow className="hidden h-4 w-4 shrink-0 text-[var(--sf-soft)]/60 transition group-hover:translate-x-0.5 sm:block" />
                  </button>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Read-only document sheets */}
      {open?.id === "contract1" || open?.id === "contract2" ? (
        <ContractModal
          key={open.nonce}
          isOpen={sheetOpen}
          onClose={closeDoc}
          contractId={open.id === "contract1" ? CONTRACT_1_ID : CONTRACT_2_ID}
          studentId={studentId}
          parentName={parentName}
          existingSignatures={sigs}
          onSignaturesSaved={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "healthForm" ? (
        <HealthFormModal
          key={open.nonce}
          isOpen={sheetOpen}
          onClose={closeDoc}
          studentId={studentId}
          parentName={parentName}
          app={activeApp}
          existingSignatures={sigs}
          existingHealthInfo={healthInfo}
          onSignaturesSaved={noOp}
          onHealthInfoSaved={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "medicationPlan" ? (
        <MedicationPlanModal
          key={open.nonce}
          isOpen={sheetOpen}
          onClose={closeDoc}
          studentId={studentId}
          parentName={parentName}
          app={activeApp}
          existingSignatures={sigs}
          existingPlan={medicationPlan}
          onSignaturesSaved={noOp}
          onPlanSaved={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "photoRelease" ? (
        <PhotoReleaseModal
          key={open.nonce}
          open={sheetOpen}
          onClose={closeDoc}
          studentId={studentId}
          studentName={childName}
          parentId={parentId}
          parentName={parentName}
          signatures={sigs}
          onSectionSaved={noOp}
          existingConsent={consent}
          onConsentSaved={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "assumptionOfRisk" ? (
        <AssumptionOfRiskModal
          key={open.nonce}
          open={sheetOpen}
          onClose={closeDoc}
          studentId={studentId}
          parentId={parentId}
          parentName={parentName}
          app={activeApp}
          signatures={sigs}
          onSectionSaved={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "authorizedPickup" ? (
        <AuthorizedPickupModal
          key={open.nonce}
          open={sheetOpen}
          onClose={closeDoc}
          studentId={studentId}
          parentId={parentId}
          parentName={parentName}
          app={activeApp}
          signatures={sigs}
          onSectionSaved={noOp}
          existingPlan={authorizedPickup}
          onPlanSaved={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "healthStatement" ? (
        <HealthStatementModal
          key={open.nonce}
          isOpen={sheetOpen}
          app={activeApp}
          parentId={parentId}
          parentName={parentName}
          existingStatement={healthStatement}
          initialReligiousExemptionCount={religiousExemptionCount}
          existingSig={sigs["8-1"]}
          onSectionSaved={noOp}
          onClose={closeDoc}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
      {open?.id === "immunization" ? (
        <ImmunizationUploadModal
          key={open.nonce}
          isOpen={sheetOpen}
          onClose={closeDoc}
          parentId={parentId}
          studentId={studentId}
          studentName={childName}
          onUploadComplete={noOp}
          readOnly
          readOnlyPreview={readOnlyPreview}
        />
      ) : null}
    </div>
  );
}
