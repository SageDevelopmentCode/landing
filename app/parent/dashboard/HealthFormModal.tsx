"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Database } from "@/app/types/database.types";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_3_ID, CONTRACT_3_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import { saveHealthInfo } from "@/app/actions/saveHealthInfo";
import GardenSheet from "./garden/EnrollmentSheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import {
  InlineError,
  LockedNote,
  PhoneField,
  RadioCardGroup,
  SavedNote,
  TextArea,
  TextField,
  YesNoField,
} from "@/app/parent/_garden/fields";
import { Spinner, btnSageSm, cardBase } from "@/app/parent/_garden/ui";
import { Bullets, FactsCard, LegalText, NoteCard, SheetStep, SigningFooter, signedLabel, useScrollToSection } from "./garden/sheetParts";

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
    immunizationStatus: (info?.immunization_status ?? null) as "record" | "exemption" | null,
  };
}

type TextKey = Exclude<keyof HealthDraft, "ongoingCare" | "emergencyMedicationRequired" | "immunizationStatus">;

/** Required fields, in on-screen order, with the names used in the summary message. */
const REQUIRED: [TextKey, string][] = [
  ["inStateContactName", "In-state contact name"],
  ["inStateContactRelation", "In-state contact relationship"],
  ["inStateContactPhone", "In-state contact phone"],
  ["outOfStateContactName", "Out-of-state contact name"],
  ["outOfStateContactRelation", "Out-of-state contact relationship"],
  ["outOfStateContactPhone", "Out-of-state contact phone"],
  ["physicianName", "Physician name"],
  ["clinicName", "Clinic/practice name"],
  ["physicianPhone", "Physician phone"],
  ["insuranceProvider", "Insurance provider"],
  ["policyNumber", "Policy number"],
  ["preferredHospital", "Preferred hospital/ER"],
];

const fieldDomId = (k: TextKey) => `hf-field-${k}`;
const SIGN_SECTIONS = [8, 9, 10];

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
  readOnly?: boolean;
  readOnlyPreview?: boolean;
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
  readOnly,
  readOnlyPreview,
}: HealthFormModalProps) {
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [draft, setDraft] = useState<HealthDraft>(() => initDraft(existingHealthInfo));
  const [savedDraft, setSavedDraft] = useState<HealthDraft>(() => initDraft(existingHealthInfo));
  const [healthInfoReady, setHealthInfoReady] = useState(!!existingHealthInfo);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TextKey, string>>>({});
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [localSigs, setLocalSigs] = useState<SignatureMap>(existingSignatures);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollToSection(bodyRef);

  const dirty = !readOnly && JSON.stringify(draft) !== JSON.stringify(savedDraft);
  const guard = useUnsavedGuard(dirty);
  const close = () => guard.confirm(onClose);

  const set = <K extends keyof HealthDraft>(field: K, value: HealthDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setJustSaved(false);
    if (fieldErrors[field as TextKey]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSaveHealthInfo = async () => {
    const missing = REQUIRED.filter(([k]) => !draft[k].trim());
    if (missing.length > 0) {
      setFieldErrors(Object.fromEntries(missing.map(([k]) => [k, "This field is required."])));
      setSummaryError(`Please complete required fields: ${missing.map(([, l]) => l).join(", ")}`);
      scrollTo(fieldDomId(missing[0][0]));
      return;
    }
    setFieldErrors({});
    setSummaryError(null);
    setSaving(true);
    const firstSave = !healthInfoReady;
    const out: { saved: StudentHealthInfo | null; error: string | null } = { saved: null, error: null };
    await runSave({
      successTitle: "Health form saved",
      successMessage: firstSave ? "You can now sign the sections below." : undefined,
      errorTitle: "Couldn't save the health form",
      retry: () => void handleSaveHealthInfo(),
      fn: async () => {
        const result = await saveHealthInfo({ studentId, ...draft });
        if (result.error || !result.data) {
          out.error = result.error ?? "Something went wrong. Please try again.";
          return { ok: false, error: out.error };
        }
        out.saved = result.data as StudentHealthInfo;
        return { ok: true };
      },
    });
    setSaving(false);
    if (out.saved) {
      setHealthInfoReady(true);
      setSavedDraft(draft);
      setJustSaved(true);
      onHealthInfoSaved(out.saved);
      if (firstSave) window.setTimeout(() => scrollTo("hf-sec-8"), 300);
    } else if (out.error) {
      setSummaryError(out.error);
    }
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_3_ID}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSignaturesSaved(updated);
    const next = [1, 2, 3].find((i) => !updated[`${CONTRACT_3_ID}-${i}`]);
    if (next) window.setTimeout(() => scrollTo(`hf-sec-${SIGN_SECTIONS[next - 1]}`), 250);
  };

  const signedCount = [1, 2, 3].filter((i) => !!localSigs[`${CONTRACT_3_ID}-${i}`]).length;
  const dob = [app.dob_month, app.dob_day, app.dob_year].filter(Boolean).join("/") || null;

  const field = (k: TextKey, node: ReactNode) => <div id={fieldDomId(k)}>{node}</div>;
  const tf = (k: TextKey, label: string, placeholder: string, required = true) =>
    field(
      k,
      <TextField
        label={label}
        required={required}
        optional={!required}
        value={draft[k]}
        onChange={(v) => set(k, v)}
        placeholder={placeholder}
        error={fieldErrors[k]}
      />,
    );
  const pf = (k: TextKey, label: string) =>
    field(k, <PhoneField label={label} required value={draft[k]} onChange={(v) => set(k, v)} placeholder="(555) 000-0000" error={fieldErrors[k]} />);

  const signature = (sectionId: number, title: string) =>
    !readOnly && !healthInfoReady ? (
      <LockedNote>Save the health form above to unlock signing.</LockedNote>
    ) : (
      <SignatureBlock
        sectionId={sectionId}
        contractId={CONTRACT_3_ID}
        studentId={studentId}
        parentName={parentName}
        existingSig={localSigs[`${CONTRACT_3_ID}-${sectionId}`]}
        onSectionSaved={handleSectionSaved}
        readOnly={readOnly}
        readOnlyPreview={readOnlyPreview}
        label={title}
      />
    );

  const needsSave = !healthInfoReady || dirty;

  return (
    <>
      <GardenSheet
        open={isOpen}
        onClose={close}
        size="wide"
        bodyRef={bodyRef}
        icon="❤️"
        title="Emergency Contact, Health, and Immunization Form"
        note={readOnly ? signedLabel(signedCount, CONTRACT_3_TOTAL_SECTIONS) : dirty ? "Unsaved changes" : signedLabel(signedCount, CONTRACT_3_TOTAL_SECTIONS)}
        footer={
          <SigningFooter
            total={CONTRACT_3_TOTAL_SECTIONS}
            signed={signedCount}
            readOnly={readOnly}
            onClose={close}
            save={needsSave ? { label: healthInfoReady ? "Update Health Form" : "Save Health Form", busy: saving, onClick: () => void handleSaveHealthInfo() } : null}
            onNext={() => {
              const next = [1, 2, 3].find((i) => !localSigs[`${CONTRACT_3_ID}-${i}`]);
              if (next) scrollTo(`hf-sec-${SIGN_SECTIONS[next - 1]}`);
            }}
          />
        }
      >
        <fieldset disabled={readOnly} className="m-0 flex min-w-0 flex-col gap-10 border-0 p-0 pt-2">
          <SheetStep n={1} title="Student Information" done>
            <FactsCard
              rows={[
                { label: "Full Legal Name", value: app.child_legal_name },
                { label: "Date of Birth", value: dob },
                { label: "Grade Level", value: app.child_grade },
                { label: "Preferred Name", value: app.preferred_name },
              ]}
            />
          </SheetStep>

          <SheetStep n={2} title="Parent/Guardian Contact Information" done>
            <FactsCard
              title="Primary Guardian"
              rows={[
                { label: "Full Name", value: app.g1_full_name },
                { label: "Relationship", value: app.g1_relationship },
                { label: "Mobile Phone", value: app.g1_cell_phone },
                { label: "Email", value: app.g1_email },
              ]}
            />
            {app.g2_full_name ? (
              <FactsCard
                title="Secondary Guardian"
                rows={[
                  { label: "Full Name", value: app.g2_full_name },
                  { label: "Relationship", value: app.g2_relationship },
                  { label: "Mobile Phone", value: app.g2_cell_phone },
                  { label: "Email", value: app.g2_email },
                ]}
              />
            ) : null}
          </SheetStep>

          <SheetStep n={3} title="Authorized Emergency Contacts">
            <LegalText>
              <p>
                In case the parent/guardian cannot be reached, Sage Field may contact or release the child to the following individuals. I
                authorize the above individuals to pick up my child if I cannot be reached.
              </p>
            </LegalText>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-sage-deep)]">In-State Emergency Contact</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {tf("inStateContactName", "Full Name", "Contact name")}
              {tf("inStateContactRelation", "Relationship", "e.g., Aunt, Grandparent")}
              {pf("inStateContactPhone", "Phone")}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-sage-deep)]">Out-of-State Emergency Contact</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {tf("outOfStateContactName", "Full Name", "Contact name")}
              {tf("outOfStateContactRelation", "Relationship", "e.g., Grandparent")}
              {pf("outOfStateContactPhone", "Phone")}
            </div>
          </SheetStep>

          <SheetStep n={4} title="Physician and Medical Information">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tf("physicianName", "Primary Physician Name", "Dr. Name")}
              {tf("clinicName", "Clinic/Practice Name", "Clinic name")}
              {pf("physicianPhone", "Physician Phone")}
              {tf("insuranceProvider", "Health Insurance Provider", "Insurance company")}
              {tf("policyNumber", "Policy Number", "Policy #")}
              {tf("groupNumber", "Group Number", "Group #", false)}
            </div>
            {tf("preferredHospital", "Preferred Hospital or Emergency Care Facility", "Hospital or ER name")}
            <LegalText>
              <p>
                If emergency treatment is needed and I/we cannot be reached, I authorize Sage Field Private School staff to seek necessary
                medical attention from the nearest licensed physician, hospital, or emergency facility.
              </p>
            </LegalText>
          </SheetStep>

          <SheetStep n={5} title="Health Conditions and Allergy Information">
            {app.has_allergies === "yes" || app.allergies_description ? (
              <NoteCard tone="coral" title="Allergies on file">
                {app.allergies_description || "Yes (no description provided)"}
              </NoteCard>
            ) : null}
            {app.has_medical_conditions === "yes" || app.medical_conditions_description ? (
              <NoteCard tone="butter" title="Medical conditions on file">
                {app.medical_conditions_description || "Yes (no description provided)"}
              </NoteCard>
            ) : null}
            {app.has_allergies !== "yes" &&
            !app.allergies_description &&
            app.has_medical_conditions !== "yes" &&
            !app.medical_conditions_description ? (
              <NoteCard tone="mint">No allergies or medical conditions on file.</NoteCard>
            ) : null}
            <TextArea
              label="Additional health conditions or notes (if any)"
              value={draft.healthConditions}
              onChange={(v) => set("healthConditions", v)}
              placeholder="Any conditions not listed above..."
              disabled={readOnly}
            />
            <YesNoField
              label="Is your child currently receiving care from a healthcare provider for an ongoing condition?"
              value={draft.ongoingCare ? "yes" : "no"}
              onChange={(v) => set("ongoingCare", v === "yes")}
            />
            {draft.ongoingCare ? (
              <TextArea
                label="Please describe"
                value={draft.ongoingCareDescription}
                onChange={(v) => set("ongoingCareDescription", v)}
                placeholder="Describe the condition and provider..."
                disabled={readOnly}
              />
            ) : null}
          </SheetStep>

          <SheetStep n={6} title="Emergency Medications">
            {app.has_emergency_medications === "yes" || app.emergency_medications_description ? (
              <NoteCard tone="coral" title="Emergency medications on file">
                {app.emergency_medications_description || "Yes (no description provided)"}
              </NoteCard>
            ) : null}
            <YesNoField
              label="Does your child require emergency medication at school (e.g., EpiPen, inhaler)?"
              value={draft.emergencyMedicationRequired ? "yes" : "no"}
              onChange={(v) => set("emergencyMedicationRequired", v === "yes")}
            />
            {draft.emergencyMedicationRequired ? (
              <>
                <TextArea
                  label="Medication details"
                  value={draft.emergencyMedicationDescription}
                  onChange={(v) => set("emergencyMedicationDescription", v)}
                  placeholder="Describe the medication and any instructions..."
                  disabled={readOnly}
                />
                <NoteCard tone="butter">
                  If yes, parents must provide: a completed Emergency Medication Authorization Form, medication in its original clearly labeled
                  container, and any specific care instructions from the prescribing provider.
                </NoteCard>
              </>
            ) : null}
          </SheetStep>

          <SheetStep n={7} title="Immunization Record or Exemption" done={!!draft.immunizationStatus}>
            <LegalText>
              <p>
                Texas law requires all schoolchildren to provide proof of current immunizations or a valid exemption affidavit. Students may not
                begin attendance until one of the following is on file with administration.
              </p>
            </LegalText>
            <RadioCardGroup
              legend={<span className="sr-only">Immunization record or exemption</span>}
              value={draft.immunizationStatus}
              onChange={(v) => set("immunizationStatus", v)}
              disabled={readOnly}
              options={[
                {
                  value: "record",
                  title: "Immunization record on file",
                  description:
                    "I will upload a copy of my child's current immunization record (signed or stamped by a physician or public health clinic).",
                },
                {
                  value: "exemption",
                  title: "Exemption affidavit",
                  description: "I will submit a valid Texas DSHS exemption affidavit (medical or religious exemption).",
                },
              ]}
            />
            <p className="text-xs font-semibold italic text-[var(--sf-soft)]">
              Uploading the actual document is a separate step in your enrollment checklist.
            </p>
          </SheetStep>

          {!readOnly ? (
            <div id="hf-save" className={`${cardBase} flex flex-col gap-3 bg-[var(--sf-butter)]/40 px-5 py-5`}>
              <div>
                <p className="sf-display text-xl leading-tight">Save Health Form</p>
                <p className="mt-1 text-sm font-semibold text-[var(--sf-soft)]">
                  Save all the information above before signing the sections below. You can return to update this information at any time.
                </p>
              </div>
              {summaryError ? <InlineError>{summaryError}</InlineError> : null}
              {justSaved && !summaryError ? <SavedNote>Health form saved — you may now sign the sections below.</SavedNote> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveHealthInfo()}
                  disabled={saving || (healthInfoReady && !dirty)}
                  aria-busy={saving || undefined}
                  className={btnSageSm}
                >
                  {saving ? <Spinner /> : null}
                  {saving ? "Saving…" : healthInfoReady ? "Update Health Form" : "Save Health Form"}
                </button>
                <span className="text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
                  {dirty ? "Unsaved changes" : healthInfoReady ? "✓ Saved" : "Not saved yet"}
                </span>
              </div>
            </div>
          ) : null}

          <SheetStep n={8} title="Over-the-Counter Medications Policy" done={!!localSigs[`${CONTRACT_3_ID}-1`]} id="hf-sec-8">
            <LegalText>
              <p>
                Sage Field Private School staff do not administer prescription or over-the-counter medications. The only exception is for
                life-saving emergency medications (e.g., EpiPen, inhaler) with prior written authorization. By initialing below, you acknowledge
                and agree to this policy.
              </p>
            </LegalText>
            {signature(1, "Over-the-Counter Medications Policy")}
          </SheetStep>

          <SheetStep n={9} title="Sunscreen, Lotion, and Topical Products" done={!!localSigs[`${CONTRACT_3_ID}-2`]} id="hf-sec-9">
            <LegalText>
              <p>
                Parents may provide sunscreen labeled with the child&apos;s name for individual use only. No shared topical products or other
                applications will be permitted to ensure allergy safety. By initialing below, you acknowledge this policy.
              </p>
            </LegalText>
            {signature(2, "Sunscreen, Lotion, and Topical Products")}
          </SheetStep>

          <SheetStep n={10} title="Consent and Release" done={!!localSigs[`${CONTRACT_3_ID}-3`]} id="hf-sec-10">
            <LegalText>
              <p>By signing below, I confirm that:</p>
              <Bullets
                items={[
                  "All information provided on this form is true and accurate.",
                  "I understand and accept Sage Field Private School's health, medication, and outdoor policies.",
                  "I authorize Sage Field Private School staff holding current First Aid/CPR certification to administer reasonable first aid or to seek emergency medical care in the event of serious illness or injury.",
                  "I assume responsibility for all associated medical expenses.",
                  "I agree to notify Sage Field Private School promptly of any changes to the information provided in this form.",
                ]}
              />
            </LegalText>
            {signature(3, "Consent and Release")}
          </SheetStep>
        </fieldset>
      </GardenSheet>
      {guard.dialog}
    </>
  );
}
