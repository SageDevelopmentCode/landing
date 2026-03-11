"use client";

import { useState } from "react";
import {
  FileText,
  Users,
  Heart,
  Pill,
  ShieldCheck,
  Camera,
  AlertTriangle,
  UserPlus,
  PenLine,
  CreditCard,
  CheckCircle,
  Upload,
} from "lucide-react";
import type { Database } from "@/app/types/database.types";
import type {
  StudentSignatureMap,
  SignatureMap,
} from "@/app/types/enrollment-signatures";
import {
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_ID,
  CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_4_ID,
  CONTRACT_4_TOTAL_SECTIONS,
  CONTRACT_5_ID,
  CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_ID,
  CONTRACT_6_TOTAL_SECTIONS,
  isContractComplete,
} from "@/app/types/enrollment-signatures";
import type { EnrollmentSignature } from "@/app/types/enrollment-signatures";
import ContractModal from "./ContractModal";
import HealthFormModal from "./HealthFormModal";
import MedicationPlanModal from "./MedicationPlanModal";
import ImmunizationUploadModal from "./ImmunizationUploadModal";
import PhotoReleaseModal from "./PhotoReleaseModal";
import AssumptionOfRiskModal from "./AssumptionOfRiskModal";

type StudentHealthInfo = Database["parent_app"]["Tables"]["student_health_info"]["Row"];
type StudentMedicationPlan = Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication = Database["parent_app"]["Tables"]["student_medications"]["Row"];

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

interface ChecklistItem {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  required: boolean;
  isContract: boolean;
  contractId?: number;
  contractSections?: number;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    title: "Program Description, Parent Responsibilities, and Key Policies",
    subtitle: "Review and sign the program contract",
    icon: <FileText className="w-4 h-4" />,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_1_ID,
    contractSections: CONTRACT_1_TOTAL_SECTIONS,
  },
  {
    id: 2,
    title: "Community Agreement for Families and Staff",
    subtitle: "Review and sign the community agreement",
    icon: <Users className="w-4 h-4" />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_2_ID,
    contractSections: CONTRACT_2_TOTAL_SECTIONS,
  },
  {
    id: 3,
    title: "Emergency Contact, Health, and Immunization Form",
    subtitle: "Complete and sign the health and emergency form",
    icon: <Heart className="w-4 h-4" />,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_3_ID,
    contractSections: CONTRACT_3_TOTAL_SECTIONS,
  },
  {
    id: 4,
    title: "Emergency Medication Plan on File",
    subtitle: "Submit if your child requires emergency medication",
    icon: <Pill className="w-4 h-4" />,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    required: false,
    isContract: true,
    contractId: CONTRACT_4_ID,
    contractSections: CONTRACT_4_TOTAL_SECTIONS,
  },
  {
    id: 5,
    title: "Submit Proof of Immunizations",
    subtitle: "Upload current immunization records",
    icon: <ShieldCheck className="w-4 h-4" />,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    required: true,
    isContract: false,
  },
  {
    id: 6,
    title: "Photo Release Form",
    subtitle: "Review and sign the photo and media release",
    icon: <Camera className="w-4 h-4" />,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_5_ID,
    contractSections: CONTRACT_5_TOTAL_SECTIONS,
  },
  {
    id: 7,
    title: "Assumption of Risk and Liability Release",
    subtitle: "Review and sign the liability release",
    icon: <AlertTriangle className="w-4 h-4" />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_6_ID,
    contractSections: CONTRACT_6_TOTAL_SECTIONS,
  },
  {
    id: 8,
    title: "Additional Authorized Pickup Person",
    subtitle: "Add authorized pickup contacts and sign",
    icon: <UserPlus className="w-4 h-4" />,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    required: true,
    isContract: true,
  },
  {
    id: 9,
    title: "Pay Registration Fee",
    subtitle: "Submit the registration fee to complete enrollment",
    icon: <CreditCard className="w-4 h-4" />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    required: true,
    isContract: false,
  },
];

const totalCount = checklistItems.length;

function Checklist({
  childName,
  signatureMap,
  onContractClick,
  onImmunizationClick,
  immunizationFileCount,
}: {
  childName: string;
  signatureMap: SignatureMap;
  onContractClick: (contractId: number) => void;
  onImmunizationClick: () => void;
  immunizationFileCount: number;
}) {
  const completedCount = checklistItems.filter((item) => {
    if (item.id === 5) return immunizationFileCount > 0;
    if (item.contractId && item.contractSections) {
      return isContractComplete(signatureMap, item.contractId, item.contractSections);
    }
    return false;
  }).length;

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div>
      <div className="mb-5 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-semibold font-heading text-gray-800 mb-0.5">
              Enrollment Checklist
            </h2>
            <p className="text-xs text-gray-400 font-body">
              {childName} is enrolled at Sage Field Academy.
            </p>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              {completedCount} of {totalCount} steps completed
            </p>
          </div>
          <button className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-body bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer">
            Get Started
          </button>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400 font-body">
          {completedCount === totalCount
            ? "All steps complete — enrollment is finalized!"
            : `${totalCount - completedCount} step${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {checklistItems.map((item) => {
          const isImmunization = item.id === 5;
          const isComplete = isImmunization
            ? immunizationFileCount > 0
            : item.contractId && item.contractSections
            ? isContractComplete(signatureMap, item.contractId, item.contractSections)
            : false;

          const signedCount =
            item.contractId && item.contractSections
              ? Object.keys(signatureMap).filter((k) =>
                  k.startsWith(`${item.contractId}-`)
                ).length
              : 0;

          const isInProgress =
            item.isContract && item.contractId != null && signedCount > 0 && !isComplete;

          const isClickable = isImmunization || (item.isContract && item.contractId != null);

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isImmunization) {
                  onImmunizationClick();
                } else if (isClickable && item.contractId != null) {
                  onContractClick(item.contractId);
                }
              }}
              className={`rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 border transition-all ${
                isComplete
                  ? "bg-emerald-50 border-emerald-200 cursor-pointer hover:border-emerald-300 hover:shadow-md"
                  : isClickable
                  ? "bg-white border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-md"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isComplete
                    ? "bg-emerald-100 text-emerald-600"
                    : `${item.iconBg} ${item.iconColor}`
                }`}
              >
                {isComplete ? <CheckCircle className="w-4 h-4" /> : item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold font-heading truncate ${isComplete ? "text-emerald-800" : "text-gray-800"}`}>
                  {item.title}
                </p>
                <p className={`text-xs font-body truncate ${isComplete ? "text-emerald-600/70" : "text-gray-400"}`}>
                  {item.subtitle}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {isImmunization ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <Upload className="w-3 h-3" />
                      Upload
                    </span>
                  )
                ) : item.isContract ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      <PenLine className="w-3 h-3" />
                      {signedCount} / {item.contractSections} signed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <PenLine className="w-3 h-3" />
                      Sign
                    </span>
                  )
                ) : null}
                {!item.required && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                    Optional
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChildTabsProps {
  apps: Application[];
  signaturesByStudent: StudentSignatureMap;
  healthInfoByStudent: Record<string, StudentHealthInfo>;
  medicationPlanByStudent: Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }>;
  parentName: string;
  parentId: string;
  immunizationFileCountByStudent: Record<string, number>;
  consentByStudent: Record<string, "FULL" | "LIMITED" | "NO">;
}

export default function ChildTabs({
  apps,
  signaturesByStudent,
  healthInfoByStudent,
  medicationPlanByStudent,
  parentName,
  parentId,
  immunizationFileCountByStudent,
  consentByStudent,
}: ChildTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openContractId, setOpenContractId] = useState<number | null>(null);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [healthFormOpen, setHealthFormOpen] = useState(false);
  const [healthFormStudentId, setHealthFormStudentId] = useState<string | null>(null);
  const [medicationPlanOpen, setMedicationPlanOpen] = useState(false);
  const [medicationPlanStudentId, setMedicationPlanStudentId] = useState<string | null>(null);
  const [immunizationOpen, setImmunizationOpen] = useState(false);
  const [immunizationStudentId, setImmunizationStudentId] = useState<string | null>(null);
  const [localSigs, setLocalSigs] = useState<StudentSignatureMap>(signaturesByStudent);
  const [localHealthInfo, setLocalHealthInfo] = useState<Record<string, StudentHealthInfo>>(healthInfoByStudent);
  const [localMedicationPlan, setLocalMedicationPlan] = useState<
    Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }>
  >(medicationPlanByStudent);
  const [localImmunizationCounts, setLocalImmunizationCounts] = useState<Record<string, number>>(
    immunizationFileCountByStudent
  );
  const [localConsent, setLocalConsent] = useState<Record<string, "FULL" | "LIMITED" | "NO">>(consentByStudent);
  const [photoReleaseOpen, setPhotoReleaseOpen] = useState(false);
  const [photoReleaseStudentId, setPhotoReleaseStudentId] = useState<string | null>(null);
  const [assumptionOfRiskOpen, setAssumptionOfRiskOpen] = useState(false);
  const [assumptionOfRiskStudentId, setAssumptionOfRiskStudentId] = useState<string | null>(null);

  if (apps.length === 0) {
    return (
      <p className="text-sm text-gray-500 font-body">No enrolled students.</p>
    );
  }

  const activeApp = apps[activeIndex];
  const childName =
    activeApp.preferred_name ?? activeApp.child_legal_name ?? "Student";
  const activeStudentId = activeApp.student_id ?? "";

  const handleContractClick = (contractId: number) => {
    if (contractId === CONTRACT_3_ID) {
      setHealthFormStudentId(activeStudentId);
      setHealthFormOpen(true);
    } else if (contractId === CONTRACT_4_ID) {
      setMedicationPlanStudentId(activeStudentId);
      setMedicationPlanOpen(true);
    } else if (contractId === CONTRACT_5_ID) {
      setPhotoReleaseStudentId(activeStudentId);
      setPhotoReleaseOpen(true);
    } else if (contractId === CONTRACT_6_ID) {
      setAssumptionOfRiskStudentId(activeStudentId);
      setAssumptionOfRiskOpen(true);
    } else {
      setOpenContractId(contractId);
      setOpenStudentId(activeStudentId);
    }
  };

  const handleClose = () => {
    setOpenContractId(null);
    setOpenStudentId(null);
  };

  const handleHealthFormClose = () => {
    setHealthFormOpen(false);
    setHealthFormStudentId(null);
  };

  const handleMedicationPlanClose = () => {
    setMedicationPlanOpen(false);
    setMedicationPlanStudentId(null);
  };

  const handleImmunizationClose = () => {
    setImmunizationOpen(false);
    setImmunizationStudentId(null);
  };

  const handleImmunizationUploadComplete = (sid: string) => {
    setLocalImmunizationCounts((prev) => ({ ...prev, [sid]: (prev[sid] ?? 0) + 1 }));
  };

  const handleSignaturesSaved = (updatedMap: SignatureMap) => {
    const sid = openStudentId ?? healthFormStudentId ?? medicationPlanStudentId;
    if (!sid) return;
    setLocalSigs((prev) => ({ ...prev, [sid]: updatedMap }));
  };

  const handlePhotoReleaseSectionSaved = (sig: EnrollmentSignature) => {
    if (!photoReleaseStudentId) return;
    const key = `${sig.contract_id}-${sig.section_id}`;
    setLocalSigs((prev) => ({
      ...prev,
      [photoReleaseStudentId]: { ...(prev[photoReleaseStudentId] ?? {}), [key]: sig },
    }));
  };

  const handleConsentSaved = (level: "FULL" | "LIMITED" | "NO") => {
    if (!photoReleaseStudentId) return;
    setLocalConsent((prev) => ({ ...prev, [photoReleaseStudentId]: level }));
  };

  const handlePhotoReleaseClose = () => {
    setPhotoReleaseOpen(false);
    setPhotoReleaseStudentId(null);
  };

  const handleAssumptionOfRiskClose = () => {
    setAssumptionOfRiskOpen(false);
    setAssumptionOfRiskStudentId(null);
  };

  const handleAssumptionOfRiskSectionSaved = (sig: EnrollmentSignature) => {
    if (!assumptionOfRiskStudentId) return;
    const key = `${sig.contract_id}-${sig.section_id}`;
    setLocalSigs((prev) => ({
      ...prev,
      [assumptionOfRiskStudentId]: { ...(prev[assumptionOfRiskStudentId] ?? {}), [key]: sig },
    }));
  };

  const handleHealthInfoSaved = (info: StudentHealthInfo) => {
    if (!healthFormStudentId) return;
    setLocalHealthInfo((prev) => ({ ...prev, [healthFormStudentId]: info }));
  };

  const handleMedicationPlanSaved = (plan: StudentMedicationPlan) => {
    if (!medicationPlanStudentId) return;
    setLocalMedicationPlan((prev) => ({
      ...prev,
      [medicationPlanStudentId]: {
        plan,
        medications: prev[medicationPlanStudentId]?.medications ?? [],
      },
    }));
  };

  const handleImmunizationClick = () => {
    setImmunizationStudentId(activeStudentId);
    setImmunizationOpen(true);
  };

  const checklist = (
    <Checklist
      childName={childName}
      signatureMap={localSigs[activeStudentId] ?? {}}
      onContractClick={handleContractClick}
      onImmunizationClick={handleImmunizationClick}
      immunizationFileCount={localImmunizationCounts[activeStudentId] ?? 0}
    />
  );

  return (
    <div>
      {apps.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {apps.map((app, index) => {
            const label =
              app.preferred_name ?? app.child_legal_name ?? "Student";
            const isActive = index === activeIndex;
            return (
              <button
                key={app.id}
                onClick={() => setActiveIndex(index)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold font-heading transition-colors cursor-pointer ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {checklist}

      {openContractId !== null && openStudentId !== null && (
        <ContractModal
          isOpen
          onClose={handleClose}
          contractId={openContractId}
          studentId={openStudentId}
          parentName={parentName}
          existingSignatures={localSigs[openStudentId] ?? {}}
          onSignaturesSaved={handleSignaturesSaved}
        />
      )}

      {healthFormOpen && healthFormStudentId !== null && (
        <HealthFormModal
          isOpen
          onClose={handleHealthFormClose}
          studentId={healthFormStudentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === healthFormStudentId)!}
          existingSignatures={localSigs[healthFormStudentId] ?? {}}
          existingHealthInfo={localHealthInfo[healthFormStudentId] ?? null}
          onSignaturesSaved={handleSignaturesSaved}
          onHealthInfoSaved={handleHealthInfoSaved}
        />
      )}

      {medicationPlanOpen && medicationPlanStudentId !== null && (
        <MedicationPlanModal
          isOpen
          onClose={handleMedicationPlanClose}
          studentId={medicationPlanStudentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === medicationPlanStudentId)!}
          existingSignatures={localSigs[medicationPlanStudentId] ?? {}}
          existingPlan={
            localMedicationPlan[medicationPlanStudentId] ?? { plan: null, medications: [] }
          }
          onSignaturesSaved={handleSignaturesSaved}
          onPlanSaved={handleMedicationPlanSaved}
        />
      )}

      {photoReleaseOpen && photoReleaseStudentId !== null && (
        <PhotoReleaseModal
          open
          onClose={handlePhotoReleaseClose}
          studentId={photoReleaseStudentId}
          studentName={
            apps.find((a) => a.student_id === photoReleaseStudentId)?.preferred_name ??
            apps.find((a) => a.student_id === photoReleaseStudentId)?.child_legal_name ??
            "Student"
          }
          parentId={parentId}
          parentName={parentName}
          signatures={localSigs[photoReleaseStudentId] ?? {}}
          onSectionSaved={handlePhotoReleaseSectionSaved}
          existingConsent={localConsent[photoReleaseStudentId] ?? null}
          onConsentSaved={handleConsentSaved}
        />
      )}

      {assumptionOfRiskOpen && assumptionOfRiskStudentId !== null && (
        <AssumptionOfRiskModal
          open
          onClose={handleAssumptionOfRiskClose}
          studentId={assumptionOfRiskStudentId}
          parentId={parentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === assumptionOfRiskStudentId)!}
          signatures={localSigs[assumptionOfRiskStudentId] ?? {}}
          onSectionSaved={handleAssumptionOfRiskSectionSaved}
        />
      )}

      {immunizationOpen && immunizationStudentId !== null && (
        <ImmunizationUploadModal
          isOpen
          onClose={handleImmunizationClose}
          parentId={parentId}
          studentId={immunizationStudentId}
          studentName={
            apps.find((a) => a.student_id === immunizationStudentId)?.preferred_name ??
            apps.find((a) => a.student_id === immunizationStudentId)?.child_legal_name ??
            "Student"
          }
          onUploadComplete={handleImmunizationUploadComplete}
        />
      )}
    </div>
  );
}
