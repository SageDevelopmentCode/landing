"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Trash2, CheckCircle, PenLine } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { Database } from "@/app/types/database.types";
import type {
  SignatureMap,
  EnrollmentSignature,
} from "@/app/types/enrollment-signatures";
import {
  CONTRACT_4_ID,
  CONTRACT_4_TOTAL_SECTIONS,
} from "@/app/types/enrollment-signatures";
import SectionSignatureBlock from "./SectionSignatureBlock";
import { saveMedicationPlan } from "@/app/actions/saveMedicationPlan";
import type { MedicationEntry } from "@/app/actions/saveMedicationPlan";
import { formatPhone } from "@/app/utils/formatPhone";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type StudentMedicationPlan =
  Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication =
  Database["parent_app"]["Tables"]["student_medications"]["Row"];

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 font-body mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-700 font-body">{value || "—"}</p>
    </div>
  );
}

function FormField({
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
      <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
        {label}
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
      <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
        {label}
      </label>
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

function blankMedication(): MedicationEntry {
  return {
    medicationName: "",
    conditionReason: "",
    dosageFrequency: "",
    physicianName: "",
    physicianPhone: "",
    expirationDate: "",
    isDaily: false,
    isEmergencyOnly: false,
  };
}

function initMedications(rows: StudentMedication[]): MedicationEntry[] {
  if (rows.length === 0) return [blankMedication()];
  return rows.map((r) => ({
    medicationName: r.medication_name ?? "",
    conditionReason: r.condition_reason ?? "",
    dosageFrequency: r.dosage_frequency ?? "",
    physicianName: r.physician_name ?? "",
    physicianPhone: r.physician_phone ?? "",
    expirationDate: r.expiration_date ?? "",
    isDaily: r.is_daily ?? false,
    isEmergencyOnly: r.is_emergency_only ?? false,
  }));
}

interface MedicationPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  parentName: string;
  app: Application;
  existingSignatures: SignatureMap;
  existingPlan: {
    plan: StudentMedicationPlan | null;
    medications: StudentMedication[];
  };
  onSignaturesSaved: (updated: SignatureMap) => void;
  onPlanSaved: (plan: StudentMedicationPlan) => void;
  readOnly?: boolean;
}

export default function MedicationPlanModal({
  isOpen,
  onClose,
  studentId,
  parentName,
  app,
  existingSignatures,
  existingPlan,
  onSignaturesSaved,
  onPlanSaved,
  readOnly,
}: MedicationPlanModalProps) {
  const [medications, setMedications] = useState<MedicationEntry[]>(() =>
    initMedications(existingPlan.medications),
  );
  const [emergencyProcedure, setEmergencyProcedure] = useState(
    existingPlan.plan?.emergency_procedure ?? "",
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    existingPlan.plan?.special_instructions ?? "",
  );
  const [planReady, setPlanReady] = useState(!!existingPlan.plan);
  const [localSigs, setLocalSigs] = useState<SignatureMap>(existingSignatures);
  const [isSaving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const updateMedication = (
    index: number,
    field: keyof MedicationEntry,
    value: string | boolean,
  ) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const addMedication = () => {
    setMedications((prev) => [...prev, blankMedication()]);
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const hasBlankName = medications.some((m) => !m.medicationName.trim());
    if (hasBlankName) {
      setSaveError("Each medication entry requires a medication name.");
      return;
    }
    setSaveError(null);
    setSaveSuccess(false);
    startSave(async () => {
      const result = await saveMedicationPlan({
        studentId,
        medications,
        emergencyProcedure,
        specialInstructions,
      });
      if (result.error) {
        setSaveError(result.error);
      } else if (result.data) {
        setPlanReady(true);
        setSaveSuccess(true);
        onPlanSaved(result.data as StudentMedicationPlan);
      }
    });
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_4_ID}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSignaturesSaved(updated);
  };

  const signedCount = Array.from(
    { length: CONTRACT_4_TOTAL_SECTIONS },
    (_, i) => i + 1,
  ).filter((i) => !!localSigs[`${CONTRACT_4_ID}-${i}`]).length;
  const allSigned = signedCount === CONTRACT_4_TOTAL_SECTIONS;

  const dobFormatted =
    [app.dob_month, app.dob_day, app.dob_year].filter(Boolean).join("/") ||
    null;

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
                  Emergency Medication Plan
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {signedCount} of {CONTRACT_4_TOTAL_SECTIONS} sections signed
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
              <fieldset disabled={readOnly} className="flex flex-col gap-10 border-0 p-0 m-0 min-w-0">
                {/* Section 1: Student Information */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="1" title="Student Information" />
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                    <ReadOnlyField
                      label="Full Legal Name"
                      value={app.child_legal_name}
                    />
                    <ReadOnlyField label="Date of Birth" value={dobFormatted} />
                    <ReadOnlyField
                      label="Grade Level"
                      value={app.child_grade}
                    />
                    <ReadOnlyField
                      label="Preferred Name"
                      value={app.preferred_name}
                    />
                  </div>
                </div>

                {/* Section 2: Parent/Guardian */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="2" title="Parent/Guardian" />
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                      Primary Guardian
                    </p>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                      <ReadOnlyField
                        label="Full Name"
                        value={app.g1_full_name}
                      />
                      <ReadOnlyField
                        label="Mobile Phone"
                        value={app.g1_cell_phone}
                      />
                    </div>
                    {app.g2_full_name && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                          Secondary Guardian
                        </p>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                          <ReadOnlyField
                            label="Full Name"
                            value={app.g2_full_name}
                          />
                          <ReadOnlyField
                            label="Mobile Phone"
                            value={app.g2_cell_phone}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 3: Emergency Contact */}
                <div className="flex flex-col gap-4">
                  <SectionHeader
                    number="3"
                    title="Emergency Contact (other than parent)"
                  />
                  <div className="bg-gray-50 rounded-xl px-4 py-4">
                    <p className="text-xs text-gray-500 font-body">
                      In case of emergency, school staff will contact the
                      parent/guardian listed above first. If unreachable, staff
                      will contact the emergency contact listed on your
                      student&apos;s health form. To update emergency contacts,
                      please edit the Emergency Contact, Health, and
                      Immunization Form.
                    </p>
                  </div>
                </div>

                {/* Section 4: Medication Information */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="4" title="Medication Information" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    List all medications your child may require while at school.
                    Include both daily medications and emergency-use
                    medications.
                  </p>

                  <div className="flex flex-col gap-6">
                    {medications.map((med, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                            Medication {index + 1}
                          </p>
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(index)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-body transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            label="Medication Name"
                            value={med.medicationName}
                            onChange={(v) =>
                              updateMedication(index, "medicationName", v)
                            }
                            placeholder="e.g., EpiPen, Albuterol"
                          />
                          <FormField
                            label="Condition / Reason"
                            value={med.conditionReason}
                            onChange={(v) =>
                              updateMedication(index, "conditionReason", v)
                            }
                            placeholder="e.g., Severe allergy, Asthma"
                          />
                          <FormField
                            label="Dosage & Frequency"
                            value={med.dosageFrequency}
                            onChange={(v) =>
                              updateMedication(index, "dosageFrequency", v)
                            }
                            placeholder="e.g., 0.3mg as needed"
                          />
                          <FormField
                            label="Prescribing Physician"
                            value={med.physicianName}
                            onChange={(v) =>
                              updateMedication(index, "physicianName", v)
                            }
                            placeholder="Dr. Name"
                          />
                          <FormField
                            label="Physician Phone"
                            value={med.physicianPhone}
                            onChange={(v) =>
                              updateMedication(
                                index,
                                "physicianPhone",
                                formatPhone(v),
                              )
                            }
                            placeholder="(555) 000-0000"
                          />
                          <FormField
                            label="Expiration Date"
                            value={med.expirationDate}
                            onChange={(v) =>
                              updateMedication(index, "expirationDate", v)
                            }
                            placeholder="MM/YYYY"
                          />
                        </div>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.isDaily}
                              onChange={(e) =>
                                updateMedication(
                                  index,
                                  "isDaily",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 rounded border-gray-300 accent-primary"
                            />
                            <span className="text-xs font-body text-gray-600">
                              Daily medication
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={med.isEmergencyOnly}
                              onChange={(e) =>
                                updateMedication(
                                  index,
                                  "isEmergencyOnly",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 rounded border-gray-300 accent-primary"
                            />
                            <span className="text-xs font-body text-gray-600">
                              Emergency use only
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addMedication}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm font-body text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors cursor-pointer w-fit"
                  >
                    <Plus className="w-4 h-4" />
                    Add Medication
                  </button>
                </div>

                {/* Section 5: Emergency Procedure */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="5" title="Emergency Procedure" />
                  <FormTextarea
                    label="Briefly describe symptoms or situations when medication should be given"
                    value={emergencyProcedure}
                    onChange={setEmergencyProcedure}
                    placeholder="e.g., Administer EpiPen immediately if child shows signs of anaphylaxis (hives, difficulty breathing, swelling)..."
                  />
                </div>

                {/* Section 6: Special Instructions */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="6" title="Special Instructions" />
                  <FormTextarea
                    label="Storage requirements, assistance needed, or other notes"
                    value={specialInstructions}
                    onChange={setSpecialInstructions}
                    placeholder="e.g., Store EpiPen at room temperature, keep in child's backpack at all times..."
                  />
                </div>

                {/* Save Button */}
                {!readOnly && (
                  <div className="flex flex-col gap-3">
                    {saveError && (
                      <p className="text-xs text-red-500 font-body">
                        {saveError}
                      </p>
                    )}
                    {saveSuccess && (
                      <p className="text-xs text-emerald-600 font-body">
                        Medication plan saved successfully.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-fit px-5 py-2.5 bg-primary text-white text-sm font-semibold font-body rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSaving ? "Saving..." : "Save Medication Plan"}
                    </button>
                  </div>
                )}

                {/* Section 7: Authorization and Release */}
                <div className="flex flex-col gap-4">
                  <SectionHeader number="7" title="Authorization and Release" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I hereby authorize Sage Field Private School staff to
                    administer the medication(s) listed above to my child in
                    accordance with the instructions provided. I understand that
                    school staff are not licensed medical professionals and will
                    follow the instructions given to the best of their ability.
                    I release Sage Field Private School and its staff from
                    liability for any adverse reactions that occur when
                    medication is administered as directed.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I agree to provide medication in its original, clearly
                    labeled container and to update this form whenever
                    medication information changes.
                  </p>

                  {!readOnly && !planReady ? (
                    <div className="mt-4 border border-dashed border-amber-200 rounded-xl px-4 py-3 bg-amber-50">
                      <p className="text-xs text-amber-700 font-body">
                        Complete and save the medication plan above before
                        signing this section.
                      </p>
                    </div>
                  ) : (
                    <SectionSignatureBlock
                      sectionId={1}
                      contractId={CONTRACT_4_ID}
                      studentId={studentId}
                      parentName={parentName}
                      existingSig={localSigs[`${CONTRACT_4_ID}-1`]}
                      onSectionSaved={handleSectionSaved}
                      readOnly={readOnly}
                    />
                  )}
                </div>
              </fieldset>
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
                    {CONTRACT_4_TOTAL_SECTIONS - signedCount} section
                    {CONTRACT_4_TOTAL_SECTIONS - signedCount !== 1 ? "s" : ""}{" "}
                    remaining
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
