"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, PenLine, Save } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { Database } from "@/app/types/database.types";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_3_ID, CONTRACT_3_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import SectionSignatureBlock from "./SectionSignatureBlock";
import { saveHealthInfo } from "@/app/actions/saveHealthInfo";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type StudentHealthInfo = Database["parent_app"]["Tables"]["student_health_info"]["Row"];

interface HealthDraft {
  inStateContactName: string;
  inStateContactRelation: string;
  inStateContactPhone: string;
  outOfStateContactName: string;
  outOfStateContactRelation: string;
  outOfStateContactPhone: string;
  physicianName: string;
  clinicName: string;
  physicianPhone: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
  preferredHospital: string;
  healthConditions: string;
  ongoingCare: boolean;
  ongoingCareDescription: string;
  emergencyMedicationRequired: boolean;
  emergencyMedicationDescription: string;
  immunizationStatus: "record" | "exemption" | null;
}

function initDraft(info: StudentHealthInfo | null): HealthDraft {
  return {
    inStateContactName: info?.in_state_contact_name ?? "",
    inStateContactRelation: info?.in_state_contact_relation ?? "",
    inStateContactPhone: info?.in_state_contact_phone ?? "",
    outOfStateContactName: info?.out_of_state_contact_name ?? "",
    outOfStateContactRelation: info?.out_of_state_contact_relation ?? "",
    outOfStateContactPhone: info?.out_of_state_contact_phone ?? "",
    physicianName: info?.physician_name ?? "",
    clinicName: info?.clinic_name ?? "",
    physicianPhone: info?.physician_phone ?? "",
    insuranceProvider: info?.insurance_provider ?? "",
    policyNumber: info?.policy_number ?? "",
    groupNumber: info?.group_number ?? "",
    preferredHospital: info?.preferred_hospital ?? "",
    healthConditions: info?.health_conditions ?? "",
    ongoingCare: info?.ongoing_care ?? false,
    ongoingCareDescription: info?.ongoing_care_description ?? "",
    emergencyMedicationRequired: info?.emergency_medication_required ?? false,
    emergencyMedicationDescription: info?.emergency_medication_description ?? "",
    immunizationStatus: info?.immunization_status ?? null,
  };
}

function validateRequiredFields(draft: HealthDraft): string[] {
  const errors: string[] = [];
  if (!draft.inStateContactName.trim()) errors.push("In-state contact name");
  if (!draft.inStateContactRelation.trim()) errors.push("In-state contact relationship");
  if (!draft.inStateContactPhone.trim()) errors.push("In-state contact phone");
  if (!draft.outOfStateContactName.trim()) errors.push("Out-of-state contact name");
  if (!draft.outOfStateContactRelation.trim()) errors.push("Out-of-state contact relationship");
  if (!draft.outOfStateContactPhone.trim()) errors.push("Out-of-state contact phone");
  if (!draft.physicianName.trim()) errors.push("Physician name");
  if (!draft.clinicName.trim()) errors.push("Clinic/practice name");
  if (!draft.physicianPhone.trim()) errors.push("Physician phone");
  if (!draft.insuranceProvider.trim()) errors.push("Insurance provider");
  if (!draft.policyNumber.trim()) errors.push("Policy number");
  if (!draft.preferredHospital.trim()) errors.push("Preferred hospital/ER");
  return errors;
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 font-body mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 font-body">{value || "—"}</p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 font-body mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
      />
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {number}. {title}
    </h3>
  );
}

function SignatureGate({
  healthInfoReady,
  sectionId,
  studentId,
  parentName,
  existingSig,
  onSectionSaved,
}: {
  healthInfoReady: boolean;
  sectionId: number;
  studentId: string;
  parentName: string;
  existingSig?: EnrollmentSignature;
  onSectionSaved: (sectionId: number, sig: EnrollmentSignature) => void;
}) {
  if (!healthInfoReady) {
    return (
      <div className="mt-4 border border-dashed border-amber-200 rounded-xl px-4 py-3 bg-amber-50">
        <p className="text-xs text-amber-700 font-body">
          Complete and save the form above before signing this section.
        </p>
      </div>
    );
  }
  return (
    <SectionSignatureBlock
      sectionId={sectionId}
      contractId={CONTRACT_3_ID}
      studentId={studentId}
      parentName={parentName}
      existingSig={existingSig}
      onSectionSaved={onSectionSaved}
    />
  );
}

interface HealthFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  parentName: string;
  app: Application;
  existingSignatures: SignatureMap;
  existingHealthInfo: StudentHealthInfo | null;
  onSignaturesSaved: (updatedMap: SignatureMap) => void;
  onHealthInfoSaved: (info: StudentHealthInfo) => void;
}

export default function HealthFormModal({
  isOpen,
  onClose,
  studentId,
  parentName,
  app,
  existingSignatures,
  existingHealthInfo,
  onSignaturesSaved,
  onHealthInfoSaved,
}: HealthFormModalProps) {
  const [draft, setDraft] = useState<HealthDraft>(() => initDraft(existingHealthInfo));
  const [healthInfoReady, setHealthInfoReady] = useState(!!existingHealthInfo);
  const [isSavingHealth, startHealthSave] = useTransition();
  const [healthSaveError, setHealthSaveError] = useState<string | null>(null);
  const [healthSaveSuccess, setHealthSaveSuccess] = useState(false);
  const [localSigs, setLocalSigs] = useState<SignatureMap>(existingSignatures);

  const set = (field: keyof HealthDraft, value: string | boolean | null) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const handleSaveHealthInfo = () => {
    const errors = validateRequiredFields(draft);
    if (errors.length > 0) {
      setHealthSaveError(`Please complete required fields: ${errors.join(", ")}`);
      return;
    }
    setHealthSaveError(null);
    startHealthSave(async () => {
      const result = await saveHealthInfo({ studentId, ...draft });
      if (result.error) {
        setHealthSaveError(result.error);
      } else if (result.data) {
        setHealthInfoReady(true);
        setHealthSaveSuccess(true);
        onHealthInfoSaved(result.data as StudentHealthInfo);
      }
    });
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_3_ID}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSignaturesSaved(updated);
  };

  const signedCount = Array.from({ length: CONTRACT_3_TOTAL_SECTIONS }, (_, i) => i + 1).filter(
    (i) => !!localSigs[`${CONTRACT_3_ID}-${i}`]
  ).length;
  const allSigned = signedCount === CONTRACT_3_TOTAL_SECTIONS;

  const dobFormatted = [app.dob_month, app.dob_day, app.dob_year]
    .filter(Boolean)
    .join("/") || null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={dancingScript.variable}>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Right-side drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-3xl z-[70] bg-white flex flex-col shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex-shrink-0 sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-bold font-heading text-gray-800">
                  Emergency Contact, Health, and Immunization Form
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {signedCount} of {CONTRACT_3_TOTAL_SECTIONS} sections signed
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-10">

                {/* Section 1: Student Information (read-only) */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="1" title="Student Information" />
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                    <ReadOnlyField label="Full Legal Name" value={app.child_legal_name} />
                    <ReadOnlyField label="Date of Birth" value={dobFormatted} />
                    <ReadOnlyField label="Grade Level" value={app.child_grade} />
                    <ReadOnlyField label="Preferred Name" value={app.preferred_name} />
                  </div>
                </div>

                {/* Section 2: Parent/Guardian Contact Information (read-only) */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="2" title="Parent/Guardian Contact Information" />
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">Primary Guardian</p>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                      <ReadOnlyField label="Full Name" value={app.g1_full_name} />
                      <ReadOnlyField label="Relationship" value={app.g1_relationship} />
                      <ReadOnlyField label="Mobile Phone" value={app.g1_cell_phone} />
                      <ReadOnlyField label="Email" value={app.g1_email} />
                    </div>
                    {app.g2_full_name && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">Secondary Guardian</p>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                          <ReadOnlyField label="Full Name" value={app.g2_full_name} />
                          <ReadOnlyField label="Relationship" value={app.g2_relationship} />
                          <ReadOnlyField label="Mobile Phone" value={app.g2_cell_phone} />
                          <ReadOnlyField label="Email" value={app.g2_email} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 3: Authorized Emergency Contacts + Signature 1 */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="3" title="Authorized Emergency Contacts" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    In case the parent/guardian cannot be reached, Sage Field may contact or release the child to the following individuals. I authorize the above individuals to pick up my child if I cannot be reached.
                  </p>

                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">In-State Emergency Contact</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <FormField
                        label="Full Name"
                        value={draft.inStateContactName}
                        onChange={(v) => set("inStateContactName", v)}
                        placeholder="Contact name"
                        required
                      />
                      <FormField
                        label="Relationship"
                        value={draft.inStateContactRelation}
                        onChange={(v) => set("inStateContactRelation", v)}
                        placeholder="e.g., Aunt, Grandparent"
                        required
                      />
                      <FormField
                        label="Phone"
                        value={draft.inStateContactPhone}
                        onChange={(v) => set("inStateContactPhone", v)}
                        placeholder="Phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">Out-of-State Emergency Contact</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <FormField
                        label="Full Name"
                        value={draft.outOfStateContactName}
                        onChange={(v) => set("outOfStateContactName", v)}
                        placeholder="Contact name"
                        required
                      />
                      <FormField
                        label="Relationship"
                        value={draft.outOfStateContactRelation}
                        onChange={(v) => set("outOfStateContactRelation", v)}
                        placeholder="e.g., Grandparent"
                        required
                      />
                      <FormField
                        label="Phone"
                        value={draft.outOfStateContactPhone}
                        onChange={(v) => set("outOfStateContactPhone", v)}
                        placeholder="Phone number"
                        required
                      />
                    </div>
                  </div>

                  <SignatureGate
                    healthInfoReady={healthInfoReady}
                    sectionId={1}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_3_ID}-1`]}
                    onSectionSaved={handleSectionSaved}
                  />
                </div>

                {/* Section 4: Physician and Medical Information + Signature 2 */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="4" title="Physician and Medical Information" />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      label="Primary Physician Name"
                      value={draft.physicianName}
                      onChange={(v) => set("physicianName", v)}
                      placeholder="Dr. Name"
                      required
                    />
                    <FormField
                      label="Clinic/Practice Name"
                      value={draft.clinicName}
                      onChange={(v) => set("clinicName", v)}
                      placeholder="Clinic name"
                      required
                    />
                    <FormField
                      label="Physician Phone"
                      value={draft.physicianPhone}
                      onChange={(v) => set("physicianPhone", v)}
                      placeholder="Phone number"
                      required
                    />
                    <FormField
                      label="Health Insurance Provider"
                      value={draft.insuranceProvider}
                      onChange={(v) => set("insuranceProvider", v)}
                      placeholder="Insurance company"
                      required
                    />
                    <FormField
                      label="Policy Number"
                      value={draft.policyNumber}
                      onChange={(v) => set("policyNumber", v)}
                      placeholder="Policy #"
                      required
                    />
                    <FormField
                      label="Group Number (optional)"
                      value={draft.groupNumber}
                      onChange={(v) => set("groupNumber", v)}
                      placeholder="Group #"
                    />
                  </div>
                  <FormField
                    label="Preferred Hospital or Emergency Care Facility"
                    value={draft.preferredHospital}
                    onChange={(v) => set("preferredHospital", v)}
                    placeholder="Hospital or ER name"
                    required
                  />

                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    If emergency treatment is needed and I/we cannot be reached, I authorize Sage Field Academy staff to seek necessary medical attention from the nearest licensed physician, hospital, or emergency facility.
                  </p>

                  <SignatureGate
                    healthInfoReady={healthInfoReady}
                    sectionId={2}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_3_ID}-2`]}
                    onSectionSaved={handleSectionSaved}
                  />
                </div>

                {/* Section 5: Health Conditions and Allergy Information (read-only + supplements) */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="5" title="Health Conditions and Allergy Information" />

                  {(app.has_allergies === "yes" || app.allergies_description) && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-rose-700 font-body mb-1">Allergies on file</p>
                      <p className="text-sm text-gray-700 font-body">{app.allergies_description || "Yes (no description provided)"}</p>
                    </div>
                  )}

                  {(app.has_medical_conditions === "yes" || app.medical_conditions_description) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-amber-700 font-body mb-1">Medical conditions on file</p>
                      <p className="text-sm text-gray-700 font-body">{app.medical_conditions_description || "Yes (no description provided)"}</p>
                    </div>
                  )}

                  {app.has_allergies !== "yes" && !app.allergies_description && app.has_medical_conditions !== "yes" && !app.medical_conditions_description && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-500 font-body">No allergies or medical conditions on file.</p>
                    </div>
                  )}

                  <FormTextarea
                    label="Additional health conditions or notes (if any)"
                    value={draft.healthConditions}
                    onChange={(v) => set("healthConditions", v)}
                    placeholder="Any conditions not listed above..."
                  />

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-600 font-body">Is your child currently receiving care from a healthcare provider for an ongoing condition?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => set("ongoingCare", true)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                          draft.ongoingCare
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => set("ongoingCare", false)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                          !draft.ongoingCare
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        No
                      </button>
                    </div>
                    {draft.ongoingCare && (
                      <FormTextarea
                        label="Please describe"
                        value={draft.ongoingCareDescription}
                        onChange={(v) => set("ongoingCareDescription", v)}
                        placeholder="Describe the condition and provider..."
                      />
                    )}
                  </div>
                </div>

                {/* Section 6: Emergency Medications */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="6" title="Emergency Medications" />

                  {(app.has_emergency_medications === "yes" || app.emergency_medications_description) && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-rose-700 font-body mb-1">Emergency medications on file</p>
                      <p className="text-sm text-gray-700 font-body">{app.emergency_medications_description || "Yes (no description provided)"}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-600 font-body">Does your child require emergency medication at school (e.g., EpiPen, inhaler)?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => set("emergencyMedicationRequired", true)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                          draft.emergencyMedicationRequired
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => set("emergencyMedicationRequired", false)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors ${
                          !draft.emergencyMedicationRequired
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        No
                      </button>
                    </div>
                    {draft.emergencyMedicationRequired && (
                      <FormTextarea
                        label="Medication details"
                        value={draft.emergencyMedicationDescription}
                        onChange={(v) => set("emergencyMedicationDescription", v)}
                        placeholder="Describe the medication and any instructions..."
                      />
                    )}
                  </div>

                  {draft.emergencyMedicationRequired && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-700 font-body leading-relaxed">
                        If yes, parents must provide: a completed Emergency Medication Authorization Form, medication in its original clearly labeled container, and any specific care instructions from the prescribing provider.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 7: Immunization Record */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="7" title="Immunization Record or Exemption" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    Texas law requires all schoolchildren to provide proof of current immunizations or a valid exemption affidavit. Students may not begin attendance until one of the following is on file with administration.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => set("immunizationStatus", "record")}
                      className={`cursor-pointer w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-start gap-3 ${
                        draft.immunizationStatus === "record"
                          ? "bg-gray-800 border-gray-800 text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        draft.immunizationStatus === "record" ? "border-white" : "border-gray-300"
                      }`}>
                        {draft.immunizationStatus === "record" && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-semibold font-body">Immunization record on file</p>
                        <p className={`text-xs font-body mt-0.5 ${draft.immunizationStatus === "record" ? "text-gray-300" : "text-gray-400"}`}>
                          I will upload a copy of my child's current immunization record (signed or stamped by a physician or public health clinic).
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => set("immunizationStatus", "exemption")}
                      className={`cursor-pointer w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-start gap-3 ${
                        draft.immunizationStatus === "exemption"
                          ? "bg-gray-800 border-gray-800 text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        draft.immunizationStatus === "exemption" ? "border-white" : "border-gray-300"
                      }`}>
                        {draft.immunizationStatus === "exemption" && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-semibold font-body">Exemption affidavit</p>
                        <p className={`text-xs font-body mt-0.5 ${draft.immunizationStatus === "exemption" ? "text-gray-300" : "text-gray-400"}`}>
                          I will submit a valid Texas DSHS exemption affidavit (medical or religious exemption).
                        </p>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-body italic">
                    Uploading the actual document is a separate step in your enrollment checklist.
                  </p>
                </div>

                {/* Save Health Form CTA */}
                <div className="flex flex-col gap-3 bg-gray-50 rounded-2xl px-5 py-5 border border-gray-100">
                  <div>
                    <p className="text-sm font-bold font-heading text-gray-800">Save Health Form</p>
                    <p className="text-xs text-gray-500 font-body mt-0.5">
                      Save all the information above before signing the sections below. You can return to update this information at any time.
                    </p>
                  </div>
                  {healthSaveError && (
                    <p className="text-xs text-red-500 font-body">{healthSaveError}</p>
                  )}
                  {healthSaveSuccess && !healthSaveError && (
                    <p className="text-xs text-emerald-600 font-body flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Health form saved — you may now sign the sections below.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveHealthInfo}
                    disabled={isSavingHealth}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold font-body rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingHealth ? "Saving..." : healthInfoReady ? "Update Health Form" : "Save Health Form"}
                  </button>
                </div>

                {/* Section 8: OTC Medications Policy + Signature 3 */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="8" title="Over-the-Counter Medications Policy" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    Sage Field Academy staff do not administer prescription or over-the-counter medications. The only exception is for life-saving emergency medications (e.g., EpiPen, inhaler) with prior written authorization. By initialing below, you acknowledge and agree to this policy.
                  </p>
                  <SignatureGate
                    healthInfoReady={healthInfoReady}
                    sectionId={3}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_3_ID}-3`]}
                    onSectionSaved={handleSectionSaved}
                  />
                </div>

                {/* Section 9: Sunscreen/Topical Products + Signature 4 */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="9" title="Sunscreen, Lotion, and Topical Products" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    Parents may provide sunscreen labeled with the child's name for individual use only. No shared topical products or other applications will be permitted to ensure allergy safety. By initialing below, you acknowledge this policy.
                  </p>
                  <SignatureGate
                    healthInfoReady={healthInfoReady}
                    sectionId={4}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_3_ID}-4`]}
                    onSectionSaved={handleSectionSaved}
                  />
                </div>

                {/* Section 10: Consent and Release + Signature 5 */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="10" title="Consent and Release" />
                  <div className="flex flex-col gap-2 text-sm text-gray-600 font-body">
                    <p className="leading-relaxed">By signing below, I confirm that:</p>
                    <ul className="flex flex-col gap-1.5 mt-1">
                      <li className="flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>All information provided on this form is true and accurate.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>I understand and accept Sage Field Academy's health, medication, and outdoor policies.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>I authorize Sage Field Academy staff holding current First Aid/CPR certification to administer reasonable first aid or to seek emergency medical care in the event of serious illness or injury.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>I assume responsibility for all associated medical expenses.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>I agree to notify Sage Field Academy promptly of any changes to the information provided in this form.</span>
                      </li>
                    </ul>
                  </div>
                  <SignatureGate
                    healthInfoReady={healthInfoReady}
                    sectionId={5}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_3_ID}-5`]}
                    onSectionSaved={handleSectionSaved}
                  />
                </div>

              </div>
            </div>

            {/* Sticky Footer */}
            <div
              className={`flex-shrink-0 sticky bottom-0 border-t px-6 py-4 flex items-center justify-between ${
                allSigned
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-100"
              }`}
            >
              {allSigned ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700 font-body">
                    All sections signed — form complete
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-500 font-body">
                    {CONTRACT_3_TOTAL_SECTIONS - signedCount} section
                    {CONTRACT_3_TOTAL_SECTIONS - signedCount !== 1 ? "s" : ""} remaining
                  </span>
                </div>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold font-body text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
