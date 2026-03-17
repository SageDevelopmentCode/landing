"use client";

import { useState } from "react";
import { FileText, ChevronRight } from "lucide-react";
import type { Database } from "@/app/types/database.types";
import type { StudentSignatureMap } from "@/app/types/enrollment-signatures";
import {
  isContractComplete,
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_6_ID,
} from "@/app/types/enrollment-signatures";
import ContractModal from "@/app/parent/dashboard/ContractModal";
import HealthFormModal from "@/app/parent/dashboard/HealthFormModal";
import HealthStatementModal from "@/app/parent/dashboard/HealthStatementModal";
import PhotoReleaseModal from "@/app/parent/dashboard/PhotoReleaseModal";
import MedicationPlanModal from "@/app/parent/dashboard/MedicationPlanModal";
import AssumptionOfRiskModal from "@/app/parent/dashboard/AssumptionOfRiskModal";
import AuthorizedPickupModal from "@/app/parent/dashboard/AuthorizedPickupModal";
import ImmunizationUploadModal from "@/app/parent/dashboard/ImmunizationUploadModal";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type StudentHealthInfo =
  Database["parent_app"]["Tables"]["student_health_info"]["Row"];
type StudentMedicationPlan =
  Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication =
  Database["parent_app"]["Tables"]["student_medications"]["Row"];
type AuthorizedPickupPlan =
  Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson =
  Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

interface Props {
  apps: Application[];
  signaturesByStudent: StudentSignatureMap;
  healthInfoByStudent: Record<string, StudentHealthInfo>;
  medicationPlanByStudent: Record<
    string,
    { plan: StudentMedicationPlan | null; medications: StudentMedication[] }
  >;
  immunizationFileCountByStudent: Record<string, number>;
  consentByStudent: Record<string, "FULL" | "LIMITED" | "NO">;
  authorizedPickupByStudent: Record<
    string,
    { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }
  >;
  healthStatementByStudent: Record<string, { option_type: string } | null>;
  religiousExemptionCountByStudent: Record<string, number>;
  parentId: string;
  parentName: string;
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

interface DocEntry {
  id: DocId;
  label: string;
}

export default function FormsPage({
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
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openModal, setOpenModal] = useState<DocId | null>(null);

  if (apps.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 font-body text-lg">
          No enrolled children found.
        </p>
        <p className="text-gray-300 font-body text-sm mt-1">
          If you believe this is an error, please contact us.
        </p>
      </div>
    );
  }

  const activeApp = apps[activeIndex];
  const studentId = activeApp.student_id ?? "";
  const sigs = signaturesByStudent[studentId] ?? {};
  const healthInfo = healthInfoByStudent[studentId] ?? null;
  const medicationPlan = medicationPlanByStudent[studentId] ?? {
    plan: null,
    medications: [],
  };
  const immunizationFileCount = immunizationFileCountByStudent[studentId] ?? 0;
  const consent = consentByStudent[studentId] ?? null;
  const authorizedPickup = authorizedPickupByStudent[studentId] ?? {
    plan: null,
    persons: [],
  };
  const healthStatement = healthStatementByStudent[studentId] ?? null;
  const religiousExemptionCount =
    religiousExemptionCountByStudent[studentId] ?? 0;

  const hasHealthFormSig = Object.keys(sigs).some((k) => k.startsWith("3-"));

  const visibleDocs: DocEntry[] = [
    {
      id: "contract1",
      label: "Program Description, Parent Responsibilities & Key Policies",
    },
    {
      id: "contract2",
      label: "Community Agreement for Families and Staff",
    },
    {
      id: "healthForm",
      label: "Emergency Contact, Health, and Immunization Form",
    },
    { id: "medicationPlan", label: "Emergency Medication Plan" },
    { id: "photoRelease", label: "Photo, Video, and Media Release" },
    {
      id: "assumptionOfRisk",
      label: "Assumption of Risk and Liability Release",
    },
    {
      id: "authorizedPickup",
      label: "Additional Authorized Pickup Person",
    },
    { id: "healthStatement", label: "Health Information Form" },
    { id: "immunization", label: "Proof of Immunizations" },
  ].filter(({ id }) => {
    switch (id) {
      case "contract1":
        return isContractComplete(sigs, CONTRACT_1_ID, CONTRACT_1_TOTAL_SECTIONS);
      case "contract2":
        return isContractComplete(sigs, CONTRACT_2_ID, CONTRACT_2_TOTAL_SECTIONS);
      case "healthForm":
        return !!healthInfo || hasHealthFormSig;
      case "medicationPlan":
        return !!medicationPlan.plan;
      case "photoRelease":
        return !!consent;
      case "assumptionOfRisk":
        return !!sigs[`${CONTRACT_6_ID}-1`];
      case "authorizedPickup":
        return !!authorizedPickup.plan;
      case "healthStatement":
        return !!healthStatement;
      case "immunization":
        return immunizationFileCount > 0;
      default:
        return false;
    }
  }) as DocEntry[];

  const noOp = () => {};

  return (
    <div>
      {/* Child switcher */}
      {apps.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {apps.map((app, i) => (
            <button
              key={app.student_id ?? i}
              onClick={() => {
                setActiveIndex(i);
                setOpenModal(null);
              }}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                i === activeIndex
                  ? "bg-[#4a7c59] text-white border-[#4a7c59] font-semibold"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#4a7c59]"
              }`}
            >
              {app.child_legal_name ?? `Child ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Document list */}
      {visibleDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-base font-semibold font-heading text-gray-700 mb-1">
            No completed documents yet
          </p>
          <p className="text-sm font-body text-gray-400">
            Completed enrollment forms will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {visibleDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setOpenModal(doc.id)}
              className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors group first:rounded-t-2xl last:rounded-b-2xl cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#4a7c59] flex-shrink-0" />
              <span className="flex-1 text-sm font-body text-gray-700 group-hover:text-gray-900">
                {doc.label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Modals — all readOnly */}
      {openModal === "contract1" && (
        <ContractModal
          isOpen
          onClose={() => setOpenModal(null)}
          contractId={CONTRACT_1_ID}
          studentId={studentId}
          parentName={parentName}
          existingSignatures={sigs}
          onSignaturesSaved={noOp}
          readOnly
        />
      )}

      {openModal === "contract2" && (
        <ContractModal
          isOpen
          onClose={() => setOpenModal(null)}
          contractId={CONTRACT_2_ID}
          studentId={studentId}
          parentName={parentName}
          existingSignatures={sigs}
          onSignaturesSaved={noOp}
          readOnly
        />
      )}

      {openModal === "healthForm" && (
        <HealthFormModal
          isOpen
          onClose={() => setOpenModal(null)}
          studentId={studentId}
          parentName={parentName}
          app={activeApp}
          existingSignatures={sigs}
          existingHealthInfo={healthInfo}
          onSignaturesSaved={noOp}
          onHealthInfoSaved={noOp}
          readOnly
        />
      )}

      {openModal === "medicationPlan" && (
        <MedicationPlanModal
          isOpen
          onClose={() => setOpenModal(null)}
          studentId={studentId}
          parentName={parentName}
          app={activeApp}
          existingSignatures={sigs}
          existingPlan={medicationPlan}
          onSignaturesSaved={noOp}
          onPlanSaved={noOp}
          readOnly
        />
      )}

      {openModal === "photoRelease" && (
        <PhotoReleaseModal
          open
          onClose={() => setOpenModal(null)}
          studentId={studentId}
          studentName={activeApp.child_legal_name ?? ""}
          parentId={parentId}
          parentName={parentName}
          signatures={sigs}
          onSectionSaved={noOp}
          existingConsent={consent}
          onConsentSaved={noOp}
          readOnly
        />
      )}

      {openModal === "assumptionOfRisk" && (
        <AssumptionOfRiskModal
          open
          onClose={() => setOpenModal(null)}
          studentId={studentId}
          parentId={parentId}
          parentName={parentName}
          app={activeApp}
          signatures={sigs}
          onSectionSaved={noOp}
          readOnly
        />
      )}

      {openModal === "authorizedPickup" && (
        <AuthorizedPickupModal
          open
          onClose={() => setOpenModal(null)}
          studentId={studentId}
          parentId={parentId}
          parentName={parentName}
          app={activeApp}
          signatures={sigs}
          onSectionSaved={noOp}
          existingPlan={authorizedPickup}
          onPlanSaved={noOp}
          readOnly
        />
      )}

      {openModal === "healthStatement" && (
        <HealthStatementModal
          app={activeApp}
          parentId={parentId}
          parentName={parentName}
          existingStatement={healthStatement}
          initialReligiousExemptionCount={religiousExemptionCount}
          existingSig={sigs["8-1"]}
          onSectionSaved={noOp}
          onClose={() => setOpenModal(null)}
          readOnly
        />
      )}

      {openModal === "immunization" && (
        <ImmunizationUploadModal
          isOpen
          onClose={() => setOpenModal(null)}
          parentId={parentId}
          studentId={studentId}
          studentName={activeApp.child_legal_name ?? ""}
          onUploadComplete={noOp}
          readOnly
        />
      )}
    </div>
  );
}
