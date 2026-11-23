"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Database } from "@/app/types/database.types";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_7_ID, CONTRACT_7_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import { saveAuthorizedPickup } from "@/app/actions/saveAuthorizedPickup";
import type { PickupPersonEntry } from "@/app/actions/saveAuthorizedPickup";
import GardenSheet from "@/app/parent/_garden/sheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import ConfirmDialog from "@/app/parent/_garden/ConfirmDialog";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import { InlineError, LockedNote, MaskedDateField, PhoneField, SavedNote, TextField, TrashIcon } from "@/app/parent/_garden/fields";
import { Spinner, btnGhostSm, btnSageSm, cardBase } from "@/app/parent/_garden/ui";
import { FactsCard, LegalText, SheetStep, SigningFooter, signedLabel, useScrollToSection } from "./garden/sheetParts";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type AuthorizedPickupPlan = Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson = Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

type PersonCard = PickupPersonEntry & { key: string };

let keySeq = 0;
const nextKey = () => `person-${++keySeq}`;

function blankPerson(): PersonCard {
  return { key: nextKey(), fullName: "", relationship: "", phone: "", email: "", dlStateIdNumber: "", vehicleInfo: "", licensePlateState: "" };
}

function initPersons(rows: AuthorizedPickupPerson[]): PersonCard[] {
  if (rows.length === 0) return [blankPerson()];
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({
      key: nextKey(),
      fullName: r.full_name ?? "",
      relationship: r.relationship ?? "",
      phone: r.phone ?? "",
      email: r.email ?? "",
      dlStateIdNumber: r.dl_state_id_number ?? "",
      vehicleInfo: r.vehicle_info ?? "",
      licensePlateState: r.license_plate_state ?? "",
    }));
}

const strip = (cards: PersonCard[]): PickupPersonEntry[] => cards.map(({ key: _key, ...p }) => p);
const hasData = (p: PersonCard) => Object.entries(p).some(([k, v]) => k !== "key" && String(v).trim() !== "");

type PersonErrors = Partial<Record<"fullName" | "relationship" | "phone", string>>;

interface AuthorizedPickupModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  parentId: string;
  parentName: string;
  app: Application;
  signatures: SignatureMap;
  onSectionSaved: (sig: EnrollmentSignature) => void;
  existingPlan: { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] };
  /** `persons` are the rows the server now holds (so lists don't go stale). */
  onPlanSaved: (plan: AuthorizedPickupPlan, persons?: AuthorizedPickupPerson[]) => void;
  readOnly?: boolean;
  readOnlyPreview?: boolean;
}

export default function AuthorizedPickupModal({
  open,
  onClose,
  studentId,
  parentName,
  app,
  signatures,
  onSectionSaved,
  existingPlan,
  onPlanSaved,
  readOnly,
  readOnlyPreview,
}: AuthorizedPickupModalProps) {
  const reduce = useReducedMotion();
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [localSigs, setLocalSigs] = useState<SignatureMap>(signatures);
  const [dateOfRequest, setDateOfRequest] = useState(existingPlan.plan?.date_of_request ?? "");
  const [effectiveUntil, setEffectiveUntil] = useState(existingPlan.plan?.effective_until ?? "");
  const [persons, setPersons] = useState<PersonCard[]>(() => initPersons(existingPlan.persons));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify([existingPlan.plan?.date_of_request ?? "", existingPlan.plan?.effective_until ?? "", strip(initPersons(existingPlan.persons))]),
  );
  const [planSaved, setPlanSaved] = useState(!!existingPlan.plan);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dateErrors, setDateErrors] = useState<{ request?: string; until?: string }>({});
  const [personErrors, setPersonErrors] = useState<Record<string, PersonErrors>>({});
  const [justSaved, setJustSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ card: PersonCard; index: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollToSection(bodyRef);

  const snapshot = JSON.stringify([dateOfRequest, effectiveUntil, strip(persons)]);
  const dirty = !readOnly && snapshot !== savedSnapshot;
  const guard = useUnsavedGuard(dirty);
  const close = () => guard.confirm(onClose);

  const studentName = app.child_legal_name ?? "Student";

  const updatePerson = (key: string, field: keyof PickupPersonEntry, value: string) => {
    setJustSaved(false);
    setPersons((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
    if (personErrors[key]?.[field as keyof PersonErrors]) {
      setPersonErrors((prev) => ({ ...prev, [key]: { ...prev[key], [field]: undefined } }));
    }
  };

  const addPerson = () => {
    setJustSaved(false);
    const card = blankPerson();
    setPersons((prev) => [...prev, card]);
    window.setTimeout(() => scrollTo(`pickup-card-${card.key}`), 200);
  };

  const removePerson = (key: string) => {
    setJustSaved(false);
    setPersons((prev) => prev.filter((p) => p.key !== key));
  };

  /** Same checks, order and messages as before; every problem is also marked on its field. */
  const validate = (): { message: string; target: string } | null => {
    const dErr: { request?: string; until?: string } = {};
    if (!dateOfRequest.trim()) dErr.request = "Date of Request is required.";
    if (!effectiveUntil.trim()) dErr.until = "Effective Until is required.";
    const pErr: Record<string, PersonErrors> = {};
    for (const p of persons) {
      const e: PersonErrors = {};
      if (!p.fullName.trim()) e.fullName = "Each person entry requires a full name.";
      if (!p.relationship.trim()) e.relationship = "Each person entry requires a relationship.";
      if (!p.phone.trim()) e.phone = "Each person entry requires a phone number.";
      if (Object.keys(e).length) pErr[p.key] = e;
    }
    setDateErrors(dErr);
    setPersonErrors(pErr);

    if (dErr.request) return { message: dErr.request, target: "pickup-dates" };
    if (dErr.until) return { message: dErr.until, target: "pickup-dates" };
    for (const field of ["fullName", "relationship", "phone"] as const) {
      const p = persons.find((x) => pErr[x.key]?.[field]);
      if (p) return { message: pErr[p.key][field]!, target: `pickup-card-${p.key}` };
    }
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setSaveError(problem.message);
      scrollTo(problem.target);
      return;
    }
    setSaveError(null);
    setSaving(true);
    const firstSave = !planSaved;
    const out: { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] | undefined; error: string | null } = {
      plan: null,
      persons: undefined,
      error: null,
    };
    await runSave({
      successTitle: "Authorized pickup list saved",
      successMessage: firstSave ? "You can now sign the authorization below." : undefined,
      errorTitle: "Couldn't save the pickup list",
      retry: () => void handleSave(),
      fn: async () => {
        const result = await saveAuthorizedPickup({ studentId, dateOfRequest, effectiveUntil, persons: strip(persons) });
        if (result.error || !result.data) {
          out.error = result.error ?? "Something went wrong. Please try again.";
          return { ok: false, error: out.error };
        }
        out.plan = result.data;
        out.persons = result.persons;
        return { ok: true };
      },
    });
    setSaving(false);
    if (out.plan) {
      setPlanSaved(true);
      setSavedSnapshot(snapshot);
      setJustSaved(true);
      onPlanSaved(out.plan, out.persons);
      if (firstSave) window.setTimeout(() => scrollTo("pickup-sec-sign"), 300);
    } else if (out.error) {
      setSaveError(out.error);
    }
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    setLocalSigs((prev) => ({ ...prev, [`${CONTRACT_7_ID}-${sectionId}`]: sig }));
    onSectionSaved(sig);
  };

  const signedCount = localSigs[`${CONTRACT_7_ID}-1`] ? 1 : 0;
  const needsSave = !planSaved || dirty;

  return (
    <>
      <GardenSheet
        open={open}
        onClose={close}
        size="wide"
        bodyRef={bodyRef}
        icon="🚗"
        title="Additional Authorized Pickup Person"
        note={!readOnly && dirty ? "Unsaved changes" : signedLabel(signedCount, CONTRACT_7_TOTAL_SECTIONS)}
        footer={
          <SigningFooter
            total={CONTRACT_7_TOTAL_SECTIONS}
            signed={signedCount}
            readOnly={readOnly}
            onClose={close}
            save={needsSave ? { label: "Save Authorized Pickup List", busy: saving, onClick: () => void handleSave() } : null}
            onNext={() => scrollTo("pickup-sec-sign")}
          />
        }
      >
        <fieldset disabled={readOnly} className="m-0 flex min-w-0 flex-col gap-10 border-0 p-0 pt-2">
          <div>
            <p className="sf-display text-xl leading-tight">Sage Field LLC</p>
            <p className="text-xs font-bold text-[var(--sf-soft)]">EIN: 41-4605989</p>
          </div>

          <FactsCard
            rows={[
              { label: "Student Name", value: studentName },
              { label: "Grade", value: app.child_grade ?? "—" },
            ]}
          />

          <SheetStep n={1} title="Request Details" id="pickup-dates" done={!!dateOfRequest.trim() && !!effectiveUntil.trim()}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MaskedDateField
                label="Date of Request"
                required
                value={dateOfRequest}
                onChange={(v) => {
                  setJustSaved(false);
                  setDateOfRequest(v);
                  if (dateErrors.request) setDateErrors((p) => ({ ...p, request: undefined }));
                }}
                error={dateErrors.request}
              />
              <MaskedDateField
                label="Effective Until"
                required
                value={effectiveUntil}
                onChange={(v) => {
                  setJustSaved(false);
                  setEffectiveUntil(v);
                  if (dateErrors.until) setDateErrors((p) => ({ ...p, until: undefined }));
                }}
                error={dateErrors.until}
              />
            </div>
          </SheetStep>

          <SheetStep n={2} title="Authorized Pickup Persons">
            <LegalText>
              <p>
                List all individuals authorized to pick up your child from school. Full name, relationship, and phone number are required for
                each person.
              </p>
            </LegalText>
            <ul className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {persons.map((person, index) => {
                  const errs = personErrors[person.key] ?? {};
                  return (
                    <motion.li
                      key={person.key}
                      id={`pickup-card-${person.key}`}
                      layout={!reduce}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.22 }}
                      className={`${cardBase} flex flex-col gap-3 px-4 py-4 sm:px-5`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold">
                          <span aria-hidden="true">🧑 </span>Person {index + 1}
                        </p>
                        {!readOnly && persons.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => (hasData(person) ? setConfirmRemove({ card: person, index }) : removePerson(person.key))}
                            className={`${btnGhostSm} !min-h-10 !px-4 text-[var(--sf-coral-deep)]`}
                            aria-label={`Remove person ${index + 1}`}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TextField
                          label="Full Name"
                          required
                          value={person.fullName}
                          onChange={(v) => updatePerson(person.key, "fullName", v)}
                          placeholder="Jane Doe"
                          error={errs.fullName}
                        />
                        <TextField
                          label="Relationship to Student"
                          required
                          value={person.relationship}
                          onChange={(v) => updatePerson(person.key, "relationship", v)}
                          placeholder="e.g., Aunt, Grandparent, Family Friend"
                          error={errs.relationship}
                        />
                        <PhoneField
                          label="Phone Number"
                          required
                          value={person.phone}
                          onChange={(v) => updatePerson(person.key, "phone", v)}
                          placeholder="(555) 000-0000"
                          error={errs.phone}
                        />
                        <TextField
                          label="Email"
                          optional
                          type="email"
                          value={person.email}
                          onChange={(v) => updatePerson(person.key, "email", v)}
                          placeholder="jane@example.com"
                        />
                        <TextField
                          label="DL / State ID Number"
                          optional
                          value={person.dlStateIdNumber}
                          onChange={(v) => updatePerson(person.key, "dlStateIdNumber", v)}
                          placeholder="e.g., D1234567"
                        />
                        <TextField
                          label="Vehicle Make / Model / Color"
                          optional
                          value={person.vehicleInfo}
                          onChange={(v) => updatePerson(person.key, "vehicleInfo", v)}
                          placeholder="e.g., 2019 Honda Accord, Blue"
                        />
                        <TextField
                          label="License Plate / State"
                          optional
                          value={person.licensePlateState}
                          onChange={(v) => updatePerson(person.key, "licensePlateState", v)}
                          placeholder="e.g., ABC1234 / CA"
                        />
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            {!readOnly ? (
              <button type="button" onClick={addPerson} className={`${btnGhostSm} self-start`}>
                <span aria-hidden="true">＋</span> Add Another Person
              </button>
            ) : null}
          </SheetStep>

          {!readOnly ? (
            <div className={`${cardBase} flex flex-col gap-3 bg-[var(--sf-butter)]/40 px-5 py-5`}>
              {saveError ? <InlineError>{saveError}</InlineError> : null}
              {justSaved && !saveError ? <SavedNote>Authorized pickup list saved successfully.</SavedNote> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || (planSaved && !dirty)}
                  aria-busy={saving || undefined}
                  className={btnSageSm}
                >
                  {saving ? <Spinner /> : null}
                  {saving ? "Saving…" : "Save Authorized Pickup List"}
                </button>
                <span className="text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
                  {dirty ? "Unsaved changes" : planSaved ? "✓ Saved" : "Not saved yet"}
                </span>
              </div>
            </div>
          ) : null}

          <SheetStep n={3} title="Authorization" done={signedCount === 1} id="pickup-sec-sign">
            <LegalText>
              <p>
                I, the undersigned parent or legal guardian of <span className="font-extrabold text-[var(--sf-ink)]">{studentName}</span>,
                hereby authorize the individual(s) listed above to pick up my child from Sage Field LLC. I understand that school staff will verify
                the identity of any pickup person using a valid government-issued photo ID before releasing my child.
              </p>
              <p>
                I accept responsibility for notifying Sage Field LLC of any changes to this authorization. I understand that my child will not be
                released to any individual not listed on this form or on the emergency contact form, unless I provide explicit written or verbal
                authorization at the time of pickup.
              </p>
            </LegalText>
            {!readOnly && !planSaved ? (
              <LockedNote>Save the authorized pickup list above to unlock signing.</LockedNote>
            ) : (
              <SignatureBlock
                sectionId={1}
                contractId={CONTRACT_7_ID}
                studentId={studentId}
                parentName={parentName}
                existingSig={localSigs[`${CONTRACT_7_ID}-1`]}
                onSectionSaved={handleSectionSaved}
                readOnly={readOnly}
                readOnlyPreview={readOnlyPreview}
                label="Authorized Pickup"
              />
            )}
          </SheetStep>
        </fieldset>
      </GardenSheet>
      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) removePerson(confirmRemove.card.key);
          setConfirmRemove(null);
        }}
        title="Remove this person?"
        body={
          confirmRemove?.card.fullName ? (
            <>“{confirmRemove.card.fullName}” will be removed from the list when you save.</>
          ) : (
            `Person ${(confirmRemove?.index ?? 0) + 1} will be removed from the list when you save.`
          )
        }
        confirmLabel="Remove person"
      />
      {guard.dialog}
    </>
  );
}
