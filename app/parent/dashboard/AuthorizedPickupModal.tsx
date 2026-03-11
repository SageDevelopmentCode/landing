"use client";

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { Database } from "@/app/types/database.types";
import type {
  SignatureMap,
  EnrollmentSignature,
} from "@/app/types/enrollment-signatures";
import { CONTRACT_7_ID, CONTRACT_7_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import SectionSignatureBlock from "./SectionSignatureBlock";
import { saveAuthorizedPickup } from "@/app/actions/saveAuthorizedPickup";
import type { PickupPersonEntry } from "@/app/actions/saveAuthorizedPickup";
import { formatPhone } from "@/app/utils/formatPhone";
import { formatDate } from "@/app/utils/formatDate";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type AuthorizedPickupPlan =
  Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson =
  Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

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

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

function blankPerson(): PickupPersonEntry {
  return {
    fullName: "",
    relationship: "",
    phone: "",
    email: "",
    dlStateIdNumber: "",
    vehicleInfo: "",
    licensePlateState: "",
  };
}

function initPersons(rows: AuthorizedPickupPerson[]): PickupPersonEntry[] {
  if (rows.length === 0) return [blankPerson()];
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({
      fullName: r.full_name ?? "",
      relationship: r.relationship ?? "",
      phone: r.phone ?? "",
      email: r.email ?? "",
      dlStateIdNumber: r.dl_state_id_number ?? "",
      vehicleInfo: r.vehicle_info ?? "",
      licensePlateState: r.license_plate_state ?? "",
    }));
}

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
  onPlanSaved: (plan: AuthorizedPickupPlan) => void;
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
}: AuthorizedPickupModalProps) {
  const [localSigs, setLocalSigs] = useState<SignatureMap>(signatures);
  const [dateOfRequest, setDateOfRequest] = useState(
    existingPlan.plan?.date_of_request ?? ""
  );
  const [effectiveUntil, setEffectiveUntil] = useState(
    existingPlan.plan?.effective_until ?? ""
  );
  const [persons, setPersons] = useState<PickupPersonEntry[]>(() =>
    initPersons(existingPlan.persons)
  );
  const [planSaved, setPlanSaved] = useState(!!existingPlan.plan);
  const [isSaving, startSave] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const studentName = app.child_legal_name ?? "Student";

  const updatePerson = (
    index: number,
    field: keyof PickupPersonEntry,
    value: string
  ) => {
    setPersons((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addPerson = () => {
    setPersons((prev) => [...prev, blankPerson()]);
  };

  const removePerson = (index: number) => {
    setPersons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!dateOfRequest.trim()) {
      setSaveError("Date of Request is required.");
      return;
    }
    if (!effectiveUntil.trim()) {
      setSaveError("Effective Until is required.");
      return;
    }
    const hasBlankName = persons.some((p) => !p.fullName.trim());
    if (hasBlankName) {
      setSaveError("Each person entry requires a full name.");
      return;
    }
    const hasBlankRelationship = persons.some((p) => !p.relationship.trim());
    if (hasBlankRelationship) {
      setSaveError("Each person entry requires a relationship.");
      return;
    }
    const hasBlankPhone = persons.some((p) => !p.phone.trim());
    if (hasBlankPhone) {
      setSaveError("Each person entry requires a phone number.");
      return;
    }
    setSaveError(null);
    setSaveSuccess(false);
    startSave(async () => {
      const result = await saveAuthorizedPickup({
        studentId,
        dateOfRequest,
        effectiveUntil,
        persons,
      });
      if (result.error) {
        setSaveError(result.error);
      } else if (result.data) {
        setPlanSaved(true);
        setSaveSuccess(true);
        onPlanSaved(result.data as AuthorizedPickupPlan);
      }
    });
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_7_ID}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSectionSaved(sig);
  };

  const signedCount = Array.from(
    { length: CONTRACT_7_TOTAL_SECTIONS },
    (_, i) => i + 1
  ).filter((i) => !!localSigs[`${CONTRACT_7_ID}-${i}`]).length;

  return (
    <AnimatePresence>
      {open && (
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
                  Additional Authorized Pickup Person
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {signedCount} of {CONTRACT_7_TOTAL_SECTIONS} sections signed
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

                {/* School header */}
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold font-heading text-gray-800">Sage Field LLC</p>
                  <p className="text-xs text-gray-500 font-body">EIN: 41-4605989</p>
                </div>

                {/* Pre-filled student info */}
                <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold font-body text-gray-500 w-36 flex-shrink-0 pt-0.5">
                      Student Name
                    </span>
                    <span className="text-sm font-body text-gray-800">{studentName}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold font-body text-gray-500 w-36 flex-shrink-0 pt-0.5">
                      Grade
                    </span>
                    <span className="text-sm font-body text-gray-800">{app.child_grade ?? "—"}</span>
                  </div>
                </div>

                {/* Date fields */}
                <div className="flex flex-col gap-4">
                  <SectionHeader title="Request Details" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      label="Date of Request"
                      value={dateOfRequest}
                      onChange={(v) => setDateOfRequest(formatDate(v))}
                      placeholder="MM/DD/YYYY"
                      required
                    />
                    <FormField
                      label="Effective Until"
                      value={effectiveUntil}
                      onChange={(v) => setEffectiveUntil(formatDate(v))}
                      placeholder="MM/DD/YYYY"
                      required
                    />
                  </div>
                </div>

                {/* Pickup persons */}
                <div className="flex flex-col gap-4">
                  <SectionHeader title="Authorized Pickup Persons" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    List all individuals authorized to pick up your child from school. Full name,
                    relationship, and phone number are required for each person.
                  </p>

                  <div className="flex flex-col gap-6">
                    {persons.map((person, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                            Person {index + 1}
                          </p>
                          {persons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePerson(index)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-body transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            label="Full Name"
                            value={person.fullName}
                            onChange={(v) => updatePerson(index, "fullName", v)}
                            placeholder="Jane Doe"
                            required
                          />
                          <FormField
                            label="Relationship to Student"
                            value={person.relationship}
                            onChange={(v) => updatePerson(index, "relationship", v)}
                            placeholder="e.g., Aunt, Grandparent, Family Friend"
                            required
                          />
                          <FormField
                            label="Phone Number"
                            value={person.phone}
                            onChange={(v) => updatePerson(index, "phone", formatPhone(v))}
                            placeholder="(555) 000-0000"
                            required
                          />
                          <FormField
                            label="Email (optional)"
                            value={person.email}
                            onChange={(v) => updatePerson(index, "email", v)}
                            placeholder="jane@example.com"
                          />
                          <FormField
                            label="DL / State ID Number (optional)"
                            value={person.dlStateIdNumber}
                            onChange={(v) => updatePerson(index, "dlStateIdNumber", v)}
                            placeholder="e.g., D1234567"
                          />
                          <FormField
                            label="Vehicle Make / Model / Color (optional)"
                            value={person.vehicleInfo}
                            onChange={(v) => updatePerson(index, "vehicleInfo", v)}
                            placeholder="e.g., 2019 Honda Accord, Blue"
                          />
                          <FormField
                            label="License Plate / State (optional)"
                            value={person.licensePlateState}
                            onChange={(v) => updatePerson(index, "licensePlateState", v)}
                            placeholder="e.g., ABC1234 / CA"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addPerson}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm font-body text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors cursor-pointer w-fit"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Person
                  </button>
                </div>

                {/* Save button */}
                <div className="flex flex-col gap-3">
                  {saveError && (
                    <p className="text-xs text-red-500 font-body">{saveError}</p>
                  )}
                  {saveSuccess && (
                    <p className="text-xs text-emerald-600 font-body">
                      Authorized pickup list saved successfully.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-fit px-5 py-2.5 bg-primary text-white text-sm font-semibold font-body rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Save Authorized Pickup List"}
                  </button>
                </div>

                {/* Authorization text + signature */}
                <div className="flex flex-col gap-4">
                  <SectionHeader title="Authorization" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I, the undersigned parent or legal guardian of{" "}
                    <span className="font-semibold text-gray-800">{studentName}</span>, hereby
                    authorize the individual(s) listed above to pick up my child from Sage Field
                    LLC. I understand that school staff will verify the identity of any pickup
                    person using a valid government-issued photo ID before releasing my child.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I accept responsibility for notifying Sage Field LLC of any changes to this
                    authorization. I understand that my child will not be released to any
                    individual not listed on this form or on the emergency contact form, unless
                    I provide explicit written or verbal authorization at the time of pickup.
                  </p>

                  {!planSaved ? (
                    <div className="mt-4 border border-dashed border-amber-200 rounded-xl px-4 py-3 bg-amber-50">
                      <p className="text-xs text-amber-700 font-body">
                        Complete and save the authorized pickup list above before signing this section.
                      </p>
                    </div>
                  ) : (
                    <SectionSignatureBlock
                      sectionId={1}
                      contractId={CONTRACT_7_ID}
                      studentId={studentId}
                      parentName={parentName}
                      existingSig={localSigs[`${CONTRACT_7_ID}-1`]}
                      onSectionSaved={handleSectionSaved}
                    />
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
