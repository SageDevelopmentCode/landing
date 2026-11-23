"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Database } from "@/app/types/database.types";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_4_ID, CONTRACT_4_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import { saveMedicationPlan } from "@/app/actions/saveMedicationPlan";
import type { MedicationEntry } from "@/app/actions/saveMedicationPlan";
import GardenSheet from "@/app/parent/_garden/sheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import ConfirmDialog from "@/app/parent/_garden/ConfirmDialog";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import { CheckboxRow, InlineError, LockedNote, PhoneField, SavedNote, TextArea, TextField, TrashIcon } from "@/app/parent/_garden/fields";
import { Spinner, btnGhostSm, btnSageSm, cardBase } from "@/app/parent/_garden/ui";
import { FactsCard, LegalText, NoteCard, SheetStep, SigningFooter, signedLabel, useScrollToSection } from "./garden/sheetParts";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type StudentMedicationPlan = Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication = Database["parent_app"]["Tables"]["student_medications"]["Row"];

type MedCard = MedicationEntry & { key: string };

let keySeq = 0;
const nextKey = () => `med-${++keySeq}`;

function blankMedication(): MedCard {
  return {
    key: nextKey(),
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

function initMedications(rows: StudentMedication[]): MedCard[] {
  if (rows.length === 0) return [blankMedication()];
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({
      key: nextKey(),
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

const strip = (cards: MedCard[]): MedicationEntry[] => cards.map(({ key: _key, ...m }) => m);
const hasData = (m: MedCard) =>
  [m.medicationName, m.conditionReason, m.dosageFrequency, m.physicianName, m.physicianPhone, m.expirationDate].some((v) => v.trim() !== "") ||
  m.isDaily ||
  m.isEmergencyOnly;

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
  /** `medications` are the rows the server now holds (so lists don't go stale). */
  onPlanSaved: (plan: StudentMedicationPlan, medications?: StudentMedication[]) => void;
  readOnly?: boolean;
  readOnlyPreview?: boolean;
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
  readOnlyPreview,
}: MedicationPlanModalProps) {
  const reduce = useReducedMotion();
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [medications, setMedications] = useState<MedCard[]>(() => initMedications(existingPlan.medications));
  const [emergencyProcedure, setEmergencyProcedure] = useState(existingPlan.plan?.emergency_procedure ?? "");
  const [specialInstructions, setSpecialInstructions] = useState(existingPlan.plan?.special_instructions ?? "");
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify([strip(initMedications(existingPlan.medications)), existingPlan.plan?.emergency_procedure ?? "", existingPlan.plan?.special_instructions ?? ""]),
  );
  const [planReady, setPlanReady] = useState(!!existingPlan.plan);
  const [localSigs, setLocalSigs] = useState<SignatureMap>(existingSignatures);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nameErrors, setNameErrors] = useState<Record<string, boolean>>({});
  const [justSaved, setJustSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<MedCard | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollToSection(bodyRef);

  const snapshot = JSON.stringify([strip(medications), emergencyProcedure, specialInstructions]);
  const dirty = !readOnly && snapshot !== savedSnapshot;
  const guard = useUnsavedGuard(dirty);
  const close = () => guard.confirm(onClose);

  const touch = () => setJustSaved(false);

  const updateMedication = <K extends keyof MedicationEntry>(key: string, field: K, value: MedicationEntry[K]) => {
    touch();
    setMedications((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)));
    if (field === "medicationName" && nameErrors[key]) setNameErrors((prev) => ({ ...prev, [key]: false }));
  };

  const addMedication = () => {
    touch();
    const card = blankMedication();
    setMedications((prev) => [...prev, card]);
    window.setTimeout(() => scrollTo(`med-card-${card.key}`), 200);
  };

  const removeMedication = (key: string) => {
    touch();
    setMedications((prev) => prev.filter((m) => m.key !== key));
  };

  const handleSave = async () => {
    const blank = medications.filter((m) => !m.medicationName.trim());
    if (blank.length > 0) {
      setNameErrors(Object.fromEntries(blank.map((m) => [m.key, true])));
      setSaveError("Each medication entry requires a medication name.");
      scrollTo(`med-card-${blank[0].key}`);
      return;
    }
    setNameErrors({});
    setSaveError(null);
    setSaving(true);
    const firstSave = !planReady;
    const out: { plan: StudentMedicationPlan | null; meds: StudentMedication[] | undefined; error: string | null } = {
      plan: null,
      meds: undefined,
      error: null,
    };
    await runSave({
      successTitle: "Medication plan saved",
      successMessage: firstSave ? "You can now sign the authorization below." : undefined,
      errorTitle: "Couldn't save the medication plan",
      retry: () => void handleSave(),
      fn: async () => {
        const result = await saveMedicationPlan({ studentId, medications: strip(medications), emergencyProcedure, specialInstructions });
        if (result.error || !result.data) {
          out.error = result.error ?? "Something went wrong. Please try again.";
          return { ok: false, error: out.error };
        }
        out.plan = result.data as StudentMedicationPlan;
        out.meds = result.medications as StudentMedication[] | undefined;
        return { ok: true };
      },
    });
    setSaving(false);
    if (out.plan) {
      setPlanReady(true);
      setSavedSnapshot(snapshot);
      setJustSaved(true);
      onPlanSaved(out.plan, out.meds);
      if (firstSave) window.setTimeout(() => scrollTo("med-sec-7"), 300);
    } else if (out.error) {
      setSaveError(out.error);
    }
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_4_ID}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSignaturesSaved(updated);
  };

  const signedCount = localSigs[`${CONTRACT_4_ID}-1`] ? 1 : 0;
  const dob = [app.dob_month, app.dob_day, app.dob_year].filter(Boolean).join("/") || null;
  const needsSave = !planReady || dirty;

  return (
    <>
      <GardenSheet
        open={isOpen}
        onClose={close}
        size="wide"
        bodyRef={bodyRef}
        icon="💊"
        title="Emergency Medication Plan"
        note={!readOnly && dirty ? "Unsaved changes" : signedLabel(signedCount, CONTRACT_4_TOTAL_SECTIONS)}
        footer={
          <SigningFooter
            total={CONTRACT_4_TOTAL_SECTIONS}
            signed={signedCount}
            readOnly={readOnly}
            onClose={close}
            save={needsSave ? { label: "Save Medication Plan", busy: saving, onClick: () => void handleSave() } : null}
            onNext={() => scrollTo("med-sec-7")}
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

          <SheetStep n={2} title="Parent/Guardian" done>
            <FactsCard
              title="Primary Guardian"
              rows={[
                { label: "Full Name", value: app.g1_full_name },
                { label: "Mobile Phone", value: app.g1_cell_phone },
              ]}
            />
            {app.g2_full_name ? (
              <FactsCard
                title="Secondary Guardian"
                rows={[
                  { label: "Full Name", value: app.g2_full_name },
                  { label: "Mobile Phone", value: app.g2_cell_phone },
                ]}
              />
            ) : null}
          </SheetStep>

          <SheetStep n={3} title="Emergency Contact (other than parent)" done>
            <NoteCard tone="sky">
              In case of emergency, school staff will contact the parent/guardian listed above first. If unreachable, staff will contact the
              emergency contact listed on your student&apos;s health form. To update emergency contacts, please edit the Emergency Contact, Health,
              and Immunization Form.
            </NoteCard>
          </SheetStep>

          <SheetStep n={4} title="Medication Information">
            <LegalText>
              <p>List all medications your child may require while at school. Include both daily medications and emergency-use medications.</p>
            </LegalText>
            <ul className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {medications.map((med, index) => (
                  <motion.li
                    key={med.key}
                    id={`med-card-${med.key}`}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22 }}
                    className={`${cardBase} flex flex-col gap-3 px-4 py-4 sm:px-5`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-extrabold">
                        <span aria-hidden="true">💊 </span>Medication {index + 1}
                      </p>
                      {!readOnly && medications.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => (hasData(med) ? setConfirmRemove(med) : removeMedication(med.key))}
                          className={`${btnGhostSm} !min-h-10 !px-4 text-[var(--sf-coral-deep)]`}
                          aria-label={`Remove medication ${index + 1}`}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextField
                        label="Medication Name"
                        required
                        value={med.medicationName}
                        onChange={(v) => updateMedication(med.key, "medicationName", v)}
                        placeholder="e.g., EpiPen, Albuterol"
                        error={nameErrors[med.key] ? "Each medication entry requires a medication name." : null}
                      />
                      <TextField
                        label="Condition / Reason"
                        value={med.conditionReason}
                        onChange={(v) => updateMedication(med.key, "conditionReason", v)}
                        placeholder="e.g., Severe allergy, Asthma"
                      />
                      <TextField
                        label="Dosage & Frequency"
                        value={med.dosageFrequency}
                        onChange={(v) => updateMedication(med.key, "dosageFrequency", v)}
                        placeholder="e.g., 0.3mg as needed"
                      />
                      <TextField
                        label="Prescribing Physician"
                        value={med.physicianName}
                        onChange={(v) => updateMedication(med.key, "physicianName", v)}
                        placeholder="Dr. Name"
                      />
                      <PhoneField
                        label="Physician Phone"
                        value={med.physicianPhone}
                        onChange={(v) => updateMedication(med.key, "physicianPhone", v)}
                        placeholder="(555) 000-0000"
                      />
                      <TextField
                        label="Expiration Date"
                        value={med.expirationDate}
                        onChange={(v) => updateMedication(med.key, "expirationDate", v)}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CheckboxRow checked={med.isDaily} onChange={(v) => updateMedication(med.key, "isDaily", v)} disabled={readOnly}>
                        Daily medication
                      </CheckboxRow>
                      <CheckboxRow
                        checked={med.isEmergencyOnly}
                        onChange={(v) => updateMedication(med.key, "isEmergencyOnly", v)}
                        disabled={readOnly}
                      >
                        Emergency use only
                      </CheckboxRow>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {!readOnly ? (
              <button type="button" onClick={addMedication} className={`${btnGhostSm} self-start`}>
                <span aria-hidden="true">＋</span> Add Medication
              </button>
            ) : null}
          </SheetStep>

          <SheetStep n={5} title="Emergency Procedure">
            <TextArea
              label="Briefly describe symptoms or situations when medication should be given"
              value={emergencyProcedure}
              onChange={(v) => {
                touch();
                setEmergencyProcedure(v);
              }}
              placeholder="e.g., Administer EpiPen immediately if child shows signs of anaphylaxis (hives, difficulty breathing, swelling)..."
              disabled={readOnly}
            />
          </SheetStep>

          <SheetStep n={6} title="Special Instructions">
            <TextArea
              label="Storage requirements, assistance needed, or other notes"
              value={specialInstructions}
              onChange={(v) => {
                touch();
                setSpecialInstructions(v);
              }}
              placeholder="e.g., Store EpiPen at room temperature, keep in child's backpack at all times..."
              disabled={readOnly}
            />
          </SheetStep>

          {!readOnly ? (
            <div className={`${cardBase} flex flex-col gap-3 bg-[var(--sf-butter)]/40 px-5 py-5`}>
              {saveError ? <InlineError>{saveError}</InlineError> : null}
              {justSaved && !saveError ? <SavedNote>Medication plan saved successfully.</SavedNote> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || (planReady && !dirty)}
                  aria-busy={saving || undefined}
                  className={btnSageSm}
                >
                  {saving ? <Spinner /> : null}
                  {saving ? "Saving…" : "Save Medication Plan"}
                </button>
                <span className="text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
                  {dirty ? "Unsaved changes" : planReady ? "✓ Saved" : "Not saved yet"}
                </span>
              </div>
            </div>
          ) : null}

          <SheetStep n={7} title="Authorization and Release" done={signedCount === 1} id="med-sec-7">
            <LegalText>
              <p>
                I hereby authorize Sage Field Private School staff to administer the medication(s) listed above to my child in accordance with
                the instructions provided. I understand that school staff are not licensed medical professionals and will follow the
                instructions given to the best of their ability. I release Sage Field Private School and its staff from liability for any
                adverse reactions that occur when medication is administered as directed.
              </p>
              <p>
                I agree to provide medication in its original, clearly labeled container and to update this form whenever medication
                information changes.
              </p>
            </LegalText>
            {!readOnly && !planReady ? (
              <LockedNote>Save the medication plan above to unlock signing.</LockedNote>
            ) : (
              <SignatureBlock
                sectionId={1}
                contractId={CONTRACT_4_ID}
                studentId={studentId}
                parentName={parentName}
                existingSig={localSigs[`${CONTRACT_4_ID}-1`]}
                onSectionSaved={handleSectionSaved}
                readOnly={readOnly}
                readOnlyPreview={readOnlyPreview}
                label="Emergency Medication Plan"
              />
            )}
          </SheetStep>
        </fieldset>
      </GardenSheet>
      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) removeMedication(confirmRemove.key);
          setConfirmRemove(null);
        }}
        title="Remove this medication?"
        body={confirmRemove?.medicationName ? <>“{confirmRemove.medicationName}” will be removed from the plan when you save.</> : "This medication will be removed from the plan when you save."}
        confirmLabel="Remove medication"
      />
      {guard.dialog}
    </>
  );
}
