"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  Mail,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { getAdminImmunizationFiles } from "@/app/actions/getAdminImmunizationFiles";
import { getAdminImmunizationDownloadUrl } from "@/app/actions/getAdminImmunizationDownloadUrl";
import { Dancing_Script } from "next/font/google";
import type {
  AdminEnrollmentData,
  StudentHealthInfo,
  StudentMedicationPlan,
  StudentMedication,
  StudentAuthorizedPickupPlan,
  StudentAuthorizedPickupPerson,
} from "../../actions/getAdminEnrollmentData";
import type { ApprovedApplication } from "./EnrollmentProgressCard";
import type {
  SignatureMap,
  EnrollmentSignature,
} from "@/app/types/enrollment-signatures";
import {
  CONTRACT_1_ID,
  CONTRACT_2_ID,
  CONTRACT_3_ID,
  CONTRACT_4_ID,
  CONTRACT_5_ID,
  CONTRACT_6_ID,
  CONTRACT_7_ID,
  CONTRACT_8_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_4_TOTAL_SECTIONS,
  CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_TOTAL_SECTIONS,
  CONTRACT_7_TOTAL_SECTIONS,
  CONTRACT_8_TOTAL_SECTIONS,
} from "@/app/types/enrollment-signatures";
import {
  CONTRACT_1_SECTIONS,
  CONTRACT_2_SECTIONS,
  CONTRACT_5_SECTIONS,
} from "@/app/parent/dashboard/contractContent";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type CachedEnrollmentData = AdminEnrollmentData & {
  registrationFeePaidByStudent: Record<string, boolean>;
  siblingApps: ApprovedApplication[];
};

type Application = {
  id: string;
  user_id: string;
  child_legal_name: string | null;
  preferred_name: string | null;
  dob_month: string | null;
  dob_day: string | null;
  dob_year: string | null;
  child_age: number | null;
  child_grade: string | null;
  program: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  is_homeschooled: string | null;
  homeschool_explanation: string | null;
  previous_schools: string | null;
  previous_schools_list: string | null;
  special_interests: string | null;
  has_allergies: boolean | null;
  allergies_description: string | null;
  has_medical_conditions: boolean | null;
  medical_conditions_description: string | null;
  has_emergency_medications: boolean | null;
  emergency_medications_description: string | null;
  activities_to_avoid: string | null;
  dysregulation_response: string | null;
  regulation_strategies: string | null;
  needs_aide: boolean | null;
  needs_aide_description: string | null;
  history_flags: string | null;
  history_explanation: string | null;
  has_custody_orders: boolean | null;
  custody_orders_description: string | null;
  learning_style: string | null;
  strengths_interests: string | null;
  current_challenges: string | null;
  g1_full_name: string | null;
  g1_relationship: string | null;
  g1_cell_phone: string | null;
  g1_work_phone: string | null;
  g1_email: string | null;
  g1_has_custody: boolean | null;
  g1_lives_with_child: boolean | null;
  g1_preferred_contact: boolean | null;
  g2_full_name: string | null;
  g2_relationship: string | null;
  g2_cell_phone: string | null;
  g2_work_phone: string | null;
  g2_email: string | null;
  g2_has_custody: boolean | null;
  g2_lives_with_child: boolean | null;
  g2_preferred_contact: boolean | null;
  student_id: string | null;
  admin_notes: string | null;
  status: string;
  approved: boolean;
  approved_at: string | null;
  denied: boolean;
  denied_at: string | null;
  denied_reason: string | null;
  created_at: string | null;
  is_active: boolean | null;
  [key: string]: unknown;
};

interface AdminEnrollmentItemDrawerProps {
  itemId: number | null;
  studentId: string | null;
  app: Application | null;
  enrollmentData: CachedEnrollmentData | null;
  onClose: () => void;
}

const ITEM_TITLES: Record<number, string> = {
  1: "Program Description, Parent Responsibilities, and Key Policies",
  2: "Community Agreement for Families and Staff",
  3: "Emergency Contact, Health, and Immunization Form",
  4: "Emergency Medication Plan on File",
  5: "Submit Proof of Immunizations",
  6: "Photo Release Form",
  7: "Assumption of Risk and Liability Release",
  8: "Additional Authorized Pickup Person",
  9: "Pay Registration Fee",
  10: "Health Information Form",
};

// ─── Shared helpers ──────────────────────────────────────────────────────────

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 font-body mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-700 font-body">{display}</p>
    </div>
  );
}

function SectionHeader({ title, number }: { title: string; number?: string }) {
  return (
    <h3 className="text-sm font-bold font-body text-gray-800 pb-2 border-b border-gray-100">
      {number ? `${number}. ${title}` : title}
    </h3>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-semibold font-body text-gray-500 w-36 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm font-body text-gray-800">{value}</span>
    </div>
  );
}

function ReadOnlySignatureBlock({
  sig,
}: {
  sig: EnrollmentSignature | undefined;
}) {
  if (!sig) {
    return (
      <div className="mt-4 border border-dashed border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
        <p className="text-sm text-gray-400 font-body italic">Not signed</p>
      </div>
    );
  }
  return (
    <div
      className={`${dancingScript.variable} mt-4 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p
          className="text-2xl text-gray-700 truncate"
          style={{ fontFamily: "var(--font-dancing-script)" }}
        >
          {sig.signature}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500 font-body">{sig.printed_name}</p>
        <p className="text-xs text-gray-400 font-body">
          {new Date(sig.signed_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// ─── Item content components ─────────────────────────────────────────────────

function ContractContent({
  contractId,
  signatureMap,
}: {
  contractId: number;
  signatureMap: SignatureMap;
}) {
  const sections =
    contractId === CONTRACT_2_ID ? CONTRACT_2_SECTIONS : CONTRACT_1_SECTIONS;
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => {
        const sig = signatureMap[`${contractId}-${section.id}`];
        return (
          <div key={section.id} className="flex flex-col">
            <h3 className="text-sm font-bold font-body text-gray-800 mb-3 pb-2 border-b border-gray-100">
              {section.title}
            </h3>
            <div className="flex flex-col gap-2 text-sm text-gray-600 font-body">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed">
                  {p}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="flex flex-col gap-1.5 mt-1">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.afterBullets &&
                section.afterBullets.map((p, i) => (
                  <p key={i} className="leading-relaxed mt-1">
                    {p}
                  </p>
                ))}
            </div>
            <ReadOnlySignatureBlock sig={sig} />
          </div>
        );
      })}
    </div>
  );
}

function HealthFormContent({
  app,
  healthInfo,
  signatureMap,
}: {
  app: Application;
  healthInfo: StudentHealthInfo | null;
  signatureMap: SignatureMap;
}) {
  const dobFormatted =
    [app.dob_month, app.dob_day, app.dob_year].filter(Boolean).join("/") ||
    null;

  return (
    <div className="flex flex-col gap-10">
      {/* Section 1: Student Information */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="Student Information" />
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
          <ReadOnlyField label="Full Legal Name" value={app.child_legal_name} />
          <ReadOnlyField label="Date of Birth" value={dobFormatted} />
          <ReadOnlyField label="Grade Level" value={app.child_grade} />
          <ReadOnlyField label="Preferred Name" value={app.preferred_name} />
        </div>
      </div>

      {/* Section 2: Parent/Guardian Contact Information */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="2" title="Parent/Guardian Contact Information" />
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
            Primary Guardian
          </p>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
            <ReadOnlyField label="Full Name" value={app.g1_full_name} />
            <ReadOnlyField label="Relationship" value={app.g1_relationship} />
            <ReadOnlyField label="Mobile Phone" value={app.g1_cell_phone} />
            <ReadOnlyField label="Email" value={app.g1_email} />
          </div>
          {app.g2_full_name && (
            <>
              <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                Secondary Guardian
              </p>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                <ReadOnlyField label="Full Name" value={app.g2_full_name} />
                <ReadOnlyField
                  label="Relationship"
                  value={app.g2_relationship}
                />
                <ReadOnlyField label="Mobile Phone" value={app.g2_cell_phone} />
                <ReadOnlyField label="Email" value={app.g2_email} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 3: Authorized Emergency Contacts */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="3" title="Authorized Emergency Contacts" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          In case the parent/guardian cannot be reached, Sage Field may contact
          or release the child to the following individuals. I authorize the
          above individuals to pick up my child if I cannot be reached.
        </p>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
            In-State Emergency Contact
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ReadOnlyField
              label="Full Name"
              value={healthInfo?.in_state_contact_name}
            />
            <ReadOnlyField
              label="Relationship"
              value={healthInfo?.in_state_contact_relation}
            />
            <ReadOnlyField
              label="Phone"
              value={healthInfo?.in_state_contact_phone}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
            Out-of-State Emergency Contact
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ReadOnlyField
              label="Full Name"
              value={healthInfo?.out_of_state_contact_name}
            />
            <ReadOnlyField
              label="Relationship"
              value={healthInfo?.out_of_state_contact_relation}
            />
            <ReadOnlyField
              label="Phone"
              value={healthInfo?.out_of_state_contact_phone}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Physician and Medical Information */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="4" title="Physician and Medical Information" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField
            label="Primary Physician Name"
            value={healthInfo?.physician_name}
          />
          <ReadOnlyField
            label="Clinic/Practice Name"
            value={healthInfo?.clinic_name}
          />
          <ReadOnlyField
            label="Physician Phone"
            value={healthInfo?.physician_phone}
          />
          <ReadOnlyField
            label="Health Insurance Provider"
            value={healthInfo?.insurance_provider}
          />
          <ReadOnlyField
            label="Policy Number"
            value={healthInfo?.policy_number}
          />
          <ReadOnlyField
            label="Group Number"
            value={healthInfo?.group_number}
          />
        </div>
        <ReadOnlyField
          label="Preferred Hospital or Emergency Care Facility"
          value={healthInfo?.preferred_hospital}
        />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          If emergency treatment is needed and I/we cannot be reached, I
          authorize Sage Field Private School staff to seek necessary medical
          attention from the nearest licensed physician, hospital, or emergency
          facility.
        </p>
      </div>

      {/* Section 5: Health Conditions and Allergy Information */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          number="5"
          title="Health Conditions and Allergy Information"
        />
        {(app.has_allergies || app.allergies_description) && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-rose-700 font-body mb-1">
              Allergies on file
            </p>
            <p className="text-sm text-gray-700 font-body">
              {(app.allergies_description as string) ||
                "Yes (no description provided)"}
            </p>
          </div>
        )}
        {(app.has_medical_conditions || app.medical_conditions_description) && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 font-body mb-1">
              Medical conditions on file
            </p>
            <p className="text-sm text-gray-700 font-body">
              {(app.medical_conditions_description as string) ||
                "Yes (no description provided)"}
            </p>
          </div>
        )}
        {!app.has_allergies &&
          !app.allergies_description &&
          !app.has_medical_conditions &&
          !app.medical_conditions_description && (
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-500 font-body">
                No allergies or medical conditions on file.
              </p>
            </div>
          )}
        <ReadOnlyField
          label="Additional health conditions or notes"
          value={healthInfo?.health_conditions}
        />
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600 font-body">
            Is your child currently receiving care for an ongoing condition?
          </p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold font-body w-fit ${healthInfo?.ongoing_care ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}
          >
            {healthInfo?.ongoing_care ? "Yes" : "No"}
          </span>
          {healthInfo?.ongoing_care && healthInfo.ongoing_care_description && (
            <ReadOnlyField
              label="Description"
              value={healthInfo.ongoing_care_description}
            />
          )}
        </div>
      </div>

      {/* Section 6: Emergency Medications */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="6" title="Emergency Medications" />
        {(app.has_emergency_medications ||
          app.emergency_medications_description) && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-rose-700 font-body mb-1">
              Emergency medications on file
            </p>
            <p className="text-sm text-gray-700 font-body">
              {(app.emergency_medications_description as string) ||
                "Yes (no description provided)"}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-600 font-body">
            Does your child require emergency medication at school?
          </p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold font-body w-fit ${healthInfo?.emergency_medication_required ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}
          >
            {healthInfo?.emergency_medication_required ? "Yes" : "No"}
          </span>
          {healthInfo?.emergency_medication_required &&
            healthInfo.emergency_medication_description && (
              <ReadOnlyField
                label="Medication details"
                value={healthInfo.emergency_medication_description}
              />
            )}
        </div>
      </div>

      {/* Section 7: Immunization Record */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="7" title="Immunization Record or Exemption" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          Texas law requires all schoolchildren to provide proof of current
          immunizations or a valid exemption affidavit.
        </p>
        {healthInfo?.immunization_status ? (
          <div className="w-full text-left px-4 py-3 rounded-xl border border-gray-800 bg-gray-800 text-white flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
            <div>
              <p className="text-sm font-semibold font-body">
                {healthInfo.immunization_status === "record"
                  ? "Immunization record on file"
                  : "Exemption affidavit"}
              </p>
              <p className="text-xs font-body mt-0.5 text-gray-300">
                {healthInfo.immunization_status === "record"
                  ? "Will upload a copy of the current immunization record."
                  : "Will submit a valid Texas DSHS exemption affidavit."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 font-body italic">
            No selection made.
          </p>
        )}
      </div>

      {/* Section 8: OTC Medications Policy + Signature 1 */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="8" title="Over-the-Counter Medications Policy" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          Sage Field Private School staff do not administer prescription or
          over-the-counter medications. The only exception is for life-saving
          emergency medications (e.g., EpiPen, inhaler) with prior written
          authorization. By initialing below, you acknowledge and agree to this
          policy.
        </p>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_3_ID}-1`]} />
      </div>

      {/* Section 9: Sunscreen Policy + Signature 2 */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          number="9"
          title="Sunscreen, Lotion, and Topical Products"
        />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          Parents may provide sunscreen labeled with the child&apos;s name for
          individual use only. No shared topical products or other applications
          will be permitted to ensure allergy safety. By initialing below, you
          acknowledge this policy.
        </p>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_3_ID}-2`]} />
      </div>

      {/* Section 10: Consent and Release + Signature 3 */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="10" title="Consent and Release" />
        <div className="flex flex-col gap-2 text-sm text-gray-600 font-body">
          <p className="leading-relaxed">By signing below, I confirm that:</p>
          <ul className="flex flex-col gap-1.5 mt-1">
            {[
              "All information provided on this form is true and accurate.",
              "I understand and accept Sage Field Private School's health, medication, and outdoor policies.",
              "I authorize Sage Field Private School staff holding current First Aid/CPR certification to administer reasonable first aid or to seek emergency medical care in the event of serious illness or injury.",
              "I assume responsibility for all associated medical expenses.",
              "I agree to notify Sage Field Private School promptly of any changes to the information provided in this form.",
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_3_ID}-3`]} />
      </div>
    </div>
  );
}

function MedicationPlanContent({
  app,
  plan,
  medications,
  signatureMap,
}: {
  app: Application;
  plan: StudentMedicationPlan | null;
  medications: StudentMedication[];
  signatureMap: SignatureMap;
}) {
  const dobFormatted =
    [app.dob_month, app.dob_day, app.dob_year].filter(Boolean).join("/") ||
    null;

  return (
    <div className="flex flex-col gap-10">
      {/* Section 1: Student Information */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="Student Information" />
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
          <ReadOnlyField label="Full Legal Name" value={app.child_legal_name} />
          <ReadOnlyField label="Date of Birth" value={dobFormatted} />
          <ReadOnlyField label="Grade Level" value={app.child_grade} />
          <ReadOnlyField label="Preferred Name" value={app.preferred_name} />
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
            <ReadOnlyField label="Full Name" value={app.g1_full_name} />
            <ReadOnlyField label="Mobile Phone" value={app.g1_cell_phone} />
          </div>
          {app.g2_full_name && (
            <>
              <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                Secondary Guardian
              </p>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl px-4 py-4">
                <ReadOnlyField label="Full Name" value={app.g2_full_name} />
                <ReadOnlyField label="Mobile Phone" value={app.g2_cell_phone} />
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
            In case of emergency, school staff will contact the parent/guardian
            listed above first. If unreachable, staff will contact the emergency
            contact listed on the student&apos;s health form.
          </p>
        </div>
      </div>

      {/* Section 4: Medication Information */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="4" title="Medication Information" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          List all medications your child may require while at school. Include
          both daily medications and emergency-use medications.
        </p>
        {medications.length === 0 ? (
          <p className="text-sm text-gray-400 font-body italic">
            No medications listed.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {medications.map((med, index) => (
              <div
                key={med.id}
                className="border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-white"
              >
                <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                  Medication {index + 1}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField
                    label="Medication Name"
                    value={med.medication_name}
                  />
                  <ReadOnlyField
                    label="Condition / Reason"
                    value={med.condition_reason}
                  />
                  <ReadOnlyField
                    label="Dosage & Frequency"
                    value={med.dosage_frequency}
                  />
                  <ReadOnlyField
                    label="Prescribing Physician"
                    value={med.physician_name}
                  />
                  <ReadOnlyField
                    label="Physician Phone"
                    value={med.physician_phone}
                  />
                  <ReadOnlyField
                    label="Expiration Date"
                    value={med.expiration_date}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${med.is_daily ? "bg-gray-800 border-gray-800" : "border-gray-300"}`}
                    >
                      {med.is_daily && (
                        <span className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </span>
                    <span className="text-xs font-body text-gray-600">
                      Daily medication
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${med.is_emergency_only ? "bg-gray-800 border-gray-800" : "border-gray-300"}`}
                    >
                      {med.is_emergency_only && (
                        <span className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </span>
                    <span className="text-xs font-body text-gray-600">
                      Emergency use only
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Emergency Procedure */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="5" title="Emergency Procedure" />
        <ReadOnlyField
          label="Symptoms or situations when medication should be given"
          value={plan?.emergency_procedure}
        />
      </div>

      {/* Section 6: Special Instructions */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="6" title="Special Instructions" />
        <ReadOnlyField
          label="Storage requirements, assistance needed, or other notes"
          value={plan?.special_instructions}
        />
      </div>

      {/* Section 7: Authorization and Release */}
      <div className="flex flex-col gap-4">
        <SectionHeader number="7" title="Authorization and Release" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I hereby authorize Sage Field Private School staff to administer the
          medication(s) listed above to my child in accordance with the
          instructions provided. I understand that school staff are not licensed
          medical professionals and will follow the instructions given to the
          best of their ability. I release Sage Field Private School and its
          staff from liability for any adverse reactions that occur when
          medication is administered as directed.
        </p>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I agree to provide medication in its original, clearly labeled
          container and to update this form whenever medication information
          changes.
        </p>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_4_ID}-1`]} />
      </div>
    </div>
  );
}

function PhotoReleaseContent({
  consentLevel,
  signatureMap,
}: {
  consentLevel: string | null;
  signatureMap: SignatureMap;
}) {
  const CONSENT_OPTIONS: {
    value: string;
    label: string;
    description: string;
  }[] = [
    {
      value: "FULL",
      label: "Full Consent",
      description:
        "My child's image and name may be used in all School materials, including website, social media, newsletters, print, and presentations.",
    },
    {
      value: "LIMITED",
      label: "Limited Consent",
      description:
        "My child's image may be used in internal School materials only (e.g., newsletters sent to enrolled families). My child's image may NOT be used on public-facing platforms such as the website or social media.",
    },
    {
      value: "NO",
      label: "No Consent",
      description:
        "I do not consent to any photography or video recording of my child for School use. My child will be excluded from group photos and media captures.",
    },
  ];

  const sec5 = CONTRACT_5_SECTIONS.find((s) => s.id === 5)!;

  return (
    <div className="flex flex-col gap-10">
      {/* Sections 1–4, 6–7: text only */}
      {CONTRACT_5_SECTIONS.filter((s) => s.id !== 5).map((section) => (
        <div key={section.id} className="flex flex-col gap-3">
          <h3 className="text-sm font-bold font-body text-gray-800 pb-2 border-b border-gray-100">
            {section.title}
          </h3>
          {section.paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-sm text-gray-600 font-body leading-relaxed"
            >
              {p}
            </p>
          ))}
        </div>
      ))}

      {/* Section 5: Consent level */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold font-body text-gray-800 pb-2 border-b border-gray-100">
          {sec5.title}
        </h3>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          {sec5.paragraphs[0]}
        </p>
        <div className="flex flex-col gap-3">
          {CONSENT_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                consentLevel === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  consentLevel === opt.value
                    ? "border-primary"
                    : "border-gray-300"
                }`}
              >
                {consentLevel === opt.value && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold font-body text-gray-800">
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 font-body mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        {!consentLevel && (
          <p className="text-sm text-gray-400 font-body italic">
            No consent level selected.
          </p>
        )}
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_5_ID}-1`]} />
      </div>

      {/* Parent/Guardian Acknowledgment */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold font-body text-gray-800 pb-2 border-b border-gray-100">
          Parent/Guardian Acknowledgment
        </h3>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          By signing below, I confirm that I have read and understood this
          Photo, Video, and Media Release in its entirety. I acknowledge my
          selected consent level for my child&apos;s participation in
          photography and video recording at Sage Field Academy. I understand
          that this consent may be revoked at any time in writing and that
          revocation applies to future use only.
        </p>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I enter this agreement freely and on behalf of my child, and I have
          the legal authority to grant or withhold consent as described herein.
        </p>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_5_ID}-2`]} />
      </div>
    </div>
  );
}

function AssumptionOfRiskContent({
  app,
  signatureMap,
}: {
  app: Application;
  signatureMap: SignatureMap;
}) {
  const studentName = app.child_legal_name ?? "Student";
  const dob =
    app.dob_month && app.dob_day && app.dob_year
      ? `${app.dob_month}/${app.dob_day}/${app.dob_year}`
      : "—";

  return (
    <div className="flex flex-col gap-10">
      {/* School header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold font-body text-gray-800">
          Sage Field Private School
        </p>
        <p className="text-xs text-gray-500 font-body">EIN: 93-4410750</p>
      </div>

      {/* Student/parent info */}
      <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
        <InfoRow label="Student Name" value={studentName} />
        <InfoRow label="Grade" value={app.child_grade ?? "—"} />
        <InfoRow label="Date of Birth" value={dob} />
        <InfoRow label="Parent / Guardian" value={app.g1_full_name ?? "—"} />
      </div>

      {/* 1. Acknowledgment of Risks */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="1. Acknowledgment of Risks" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I, the undersigned parent or legal guardian, acknowledge that
          participation in the educational, recreational, and extracurricular
          activities offered by Sage Field Private School &quot;School&quot;
          involves inherent risks. These risks may include, but are not limited
          to, physical injury from falls, collisions, equipment use, or other
          participants; exposure to communicable illness; emotional or
          psychological stress; allergic reactions; and other unforeseen hazards
          that may arise during normal school activities, field trips, outdoor
          education, and community events.
        </p>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I understand that no environment can be made entirely risk-free and
          that Sage Field Private School, while committed to maintaining a safe
          and supportive environment, cannot guarantee complete freedom from
          injury or illness.
        </p>
      </div>

      {/* 2. Assumption of Risk */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="2. Assumption of Risk" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          With full knowledge of the risks described above, I voluntarily enroll
          my child in Sage Field Private School and authorize their
          participation in all school-sanctioned activities. I freely and
          expressly assume all risks associated with such participation, whether
          known or unknown, foreseeable or unforeseeable, including the risk of
          serious injury, permanent disability, or death.
        </p>
      </div>

      {/* 3. Release of Liability and Indemnification */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="3. Release of Liability and Indemnification" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          In consideration of my child&apos;s enrollment and participation, I,
          on behalf of myself, my child, and our heirs, successors, and legal
          representatives, hereby release, waive, discharge, and hold harmless
          Sage Field Academy, its officers, directors, employees, volunteers,
          independent contractors, and agents (collectively, &quot;Released
          Parties&quot;) from any and all claims, demands, damages, liabilities,
          actions, or causes of action — whether arising from negligence or
          otherwise — that may result from my child&apos;s participation in
          school activities.
        </p>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I further agree to indemnify and hold harmless the Released Parties
          from any claims brought by or on behalf of my child arising out of or
          related to their participation in school activities, including any
          claims arising from the negligence of the Released Parties, to the
          fullest extent permitted by applicable law.
        </p>
      </div>

      {/* 4. Scope and Limitations */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="4. Scope and Limitations" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          This Agreement applies to all activities conducted under the auspices
          of Sage Field Private School, including but not limited to: on-campus
          instruction and activities, field trips and off-site excursions,
          outdoor and outdoor-based education, school-sponsored community
          events, and any transportation provided by or arranged by the School.
        </p>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          Nothing in this Agreement shall be construed to release any party from
          liability arising from willful or grossly negligent conduct, or from
          any liability that cannot be released as a matter of law.
        </p>
      </div>

      {/* 5. Severability */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="5. Severability" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          If any provision of this Agreement is found to be unenforceable or
          invalid under applicable law, such provision shall be modified to the
          minimum extent necessary to make it enforceable, or, if modification
          is not possible, shall be severed from this Agreement, while the
          remaining provisions shall continue in full force and effect. This
          Agreement constitutes the entire understanding between the parties
          regarding the assumption of risk and release of liability for{" "}
          <span className="font-semibold text-gray-800">{studentName}</span>
          &apos;s participation at Sage Field Private School.
        </p>
      </div>

      {/* Releasor Acknowledgment + Signature */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Releasor Acknowledgment" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          By signing below, I confirm that I have read and fully understand this
          Assumption of Risk and Liability Release. I acknowledge that I am
          signing this Agreement freely and voluntarily, without any duress or
          undue influence, and that I have had the opportunity to seek
          independent legal counsel if desired. I represent that I have the
          legal authority to execute this Agreement on behalf of my child.
        </p>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_6_ID}-1`]} />
      </div>
    </div>
  );
}

function AuthorizedPickupContent({
  app,
  plan,
  persons,
  signatureMap,
}: {
  app: Application;
  plan: StudentAuthorizedPickupPlan | null;
  persons: StudentAuthorizedPickupPerson[];
  signatureMap: SignatureMap;
}) {
  const studentName = app.child_legal_name ?? "Student";

  return (
    <div className="flex flex-col gap-10">
      {/* School header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold font-body text-gray-800">
          Sage Field LLC
        </p>
        <p className="text-xs text-gray-500 font-body">EIN: 41-4605989</p>
      </div>

      {/* Student info */}
      <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
        <InfoRow label="Student Name" value={studentName} />
        <InfoRow label="Grade" value={app.child_grade ?? "—"} />
      </div>

      {/* Request Details */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Request Details" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField
            label="Date of Request"
            value={plan?.date_of_request}
          />
          <ReadOnlyField
            label="Effective Until"
            value={plan?.effective_until}
          />
        </div>
      </div>

      {/* Authorized Pickup Persons */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Authorized Pickup Persons" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          List all individuals authorized to pick up your child from school.
        </p>
        {persons.length === 0 ? (
          <p className="text-sm text-gray-400 font-body italic">
            No authorized pickup persons listed.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {persons.map((person, index) => (
              <div
                key={person.id}
                className="border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-white"
              >
                <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                  Person {index + 1}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Full Name" value={person.full_name} />
                  <ReadOnlyField
                    label="Relationship to Student"
                    value={person.relationship}
                  />
                  <ReadOnlyField label="Phone Number" value={person.phone} />
                  <ReadOnlyField label="Email" value={person.email} />
                  <ReadOnlyField
                    label="DL / State ID Number"
                    value={person.dl_state_id_number}
                  />
                  <ReadOnlyField
                    label="Vehicle Make / Model / Color"
                    value={person.vehicle_info}
                  />
                  <ReadOnlyField
                    label="License Plate / State"
                    value={person.license_plate_state}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorization text + signature */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Authorization" />
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I, the undersigned parent or legal guardian of{" "}
          <span className="font-semibold text-gray-800">{studentName}</span>,
          hereby authorize the individual(s) listed above to pick up my child
          from Sage Field LLC. I understand that school staff will verify the
          identity of any pickup person using a valid government-issued photo ID
          before releasing my child.
        </p>
        <p className="text-sm text-gray-600 font-body leading-relaxed">
          I accept responsibility for notifying Sage Field LLC of any changes to
          this authorization. I understand that my child will not be released to
          any individual not listed on this form or on the emergency contact
          form, unless I provide explicit written or verbal authorization at the
          time of pickup.
        </p>
        <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_7_ID}-1`]} />
      </div>
    </div>
  );
}

function HealthStatementContent({
  app,
  optionType,
  religiousExemptionCount,
  signatureMap,
}: {
  app: Application;
  optionType: string | null;
  religiousExemptionCount: number;
  signatureMap: SignatureMap;
}) {
  const studentName = app.preferred_name ?? app.child_legal_name ?? "Student";
  const dob =
    app.dob_month && app.dob_day && app.dob_year
      ? `${app.dob_month}/${app.dob_day}/${app.dob_year}`
      : "—";

  return (
    <div className="flex flex-col gap-8">
      {/* Pre-filled info */}
      <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
        <InfoRow label="Name of Child" value={app.child_legal_name ?? "—"} />
        <InfoRow label="Date of Birth" value={dob} />
      </div>

      {/* Selected option */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold font-body text-gray-800">
          Selected option:
        </p>
        <div
          className={`flex items-center gap-3 cursor-default rounded-xl border px-4 py-3 ${
            optionType === "professional"
              ? "border-teal-500 bg-teal-50/60"
              : optionType === "religious"
                ? "border-purple-400 bg-purple-50/40"
                : "border-gray-200 bg-white"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              optionType === "professional"
                ? "border-teal-600"
                : optionType === "religious"
                  ? "border-purple-500"
                  : "border-gray-300"
            }`}
          >
            {optionType && (
              <span
                className={`w-2 h-2 rounded-full ${optionType === "professional" ? "bg-teal-600" : "bg-purple-500"}`}
              />
            )}
          </span>
          <span className="flex-1 text-sm font-body text-gray-700">
            {optionType === "professional" ? (
              <>
                <span className="font-semibold">Option A:</span> My child has
                been examined by a health care professional within the past year
              </>
            ) : optionType === "religious" ? (
              <>
                <span className="font-semibold">Option B:</span> Religious
                exemption — I object to physical examination of my child on
                religious grounds
              </>
            ) : (
              <span className="text-gray-400 italic">No option selected.</span>
            )}
          </span>
        </div>

        {/* Option A info */}
        {optionType === "professional" && (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-teal-100 bg-teal-50/40">
            <p className="text-sm font-semibold font-body text-gray-800">
              Option A: Health Care Professional Examination
            </p>
            <p className="text-sm text-gray-600 font-body leading-relaxed">
              I hereby certify that my child,{" "}
              {app.child_legal_name ?? studentName}, has been examined by a
              licensed health care professional within the past year and is in
              satisfactory health to attend school. I understand that the health
              care professional must review and sign the Health Care Statement
              form provided by Sage Field Private School.
            </p>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-body">
                After the health care professional signs the form, it should be
                emailed to{" "}
                <span className="font-semibold">sabrina@sagefield.co</span>
              </p>
            </div>
          </div>
        )}

        {/* Option B info */}
        {optionType === "religious" && (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-purple-100 bg-purple-50/30">
            <p className="text-sm font-semibold font-body text-gray-800">
              Option B: Religious Exemption Affidavit
            </p>
            <p className="text-sm text-gray-600 font-body leading-relaxed">
              I object to the physical examination of my child on religious
              grounds. I understand that I must provide a signed, dated, and{" "}
              <span className="font-semibold text-gray-800">notarized</span>{" "}
              affidavit stating my religious objection to such examination.
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 font-body">
                Uploaded affidavits
              </p>
              <span className="text-xs font-semibold font-body px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {religiousExemptionCount} file
                {religiousExemptionCount !== 1 ? "s" : ""} uploaded
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Signature section */}
      {optionType !== null && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold font-body text-gray-800 pb-2 border-b border-gray-100">
            Parent / Guardian Signature
          </h3>
          <p className="text-sm text-gray-600 font-body leading-relaxed">
            By signing below, I certify that the information provided is
            accurate and complete to the best of my knowledge, and I authorize
            Sage Field Private School to maintain this health information on
            file for my child.
          </p>
          <ReadOnlySignatureBlock sig={signatureMap[`${CONTRACT_8_ID}-1`]} />
        </div>
      )}
    </div>
  );
}

// ─── Immunization files ───────────────────────────────────────────────────────

function formatFileName(name: string): string {
  return name.replace(/^\d+-/, "");
}

function ImmunizationFilesContent({
  parentId,
  studentId,
}: {
  parentId: string;
  studentId: string;
}) {
  const [files, setFiles] = useState<{ name: string }[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    getAdminImmunizationFiles(parentId, studentId).then((res) => {
      if (res.error) {
        setFetchError(res.error);
      } else {
        setFiles(res.files);
      }
    });
  }, [parentId, studentId]);

  async function handleDownload(fileName: string) {
    setDownloadError(null);
    setDownloading((prev) => ({ ...prev, [fileName]: true }));
    const res = await getAdminImmunizationDownloadUrl(
      `${parentId}/${studentId}/${fileName}`,
    );
    setDownloading((prev) => ({ ...prev, [fileName]: false }));
    if ("error" in res && res.error) {
      setDownloadError(res.error);
      return;
    }
    if ("url" in res && res.url) {
      window.open(res.url, "_blank");
    }
  }

  if (files === null && !fetchError) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading files…
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-sm text-red-500">{fetchError}</p>;
  }

  if (!files || files.length === 0) {
    return <p className="text-sm text-gray-400 italic">No files uploaded</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {downloadError && <p className="text-sm text-red-500">{downloadError}</p>}
      {files.map((file) => (
        <button
          key={file.name}
          onClick={() => handleDownload(file.name)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <p className="flex-1 text-sm font-body text-gray-700 truncate">
            {formatFileName(file.name)}
          </p>
          {downloading[file.name] ? (
            <Loader2 className="w-4 h-4 text-gray-400 flex-shrink-0 animate-spin" />
          ) : (
            <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────────

export function AdminEnrollmentItemDrawer({
  itemId,
  studentId,
  app,
  enrollmentData,
  onClose,
}: AdminEnrollmentItemDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const show = itemId !== null && studentId !== null;

  const signatureMap = show
    ? (enrollmentData?.signaturesByStudent[studentId!] ?? {})
    : {};
  const title = show ? (ITEM_TITLES[itemId!] ?? "Enrollment Item") : "";

  const renderContent = () => {
    if (!show) return null;
    switch (itemId!) {
      case 1:
        return (
          <ContractContent
            contractId={CONTRACT_1_ID}
            signatureMap={signatureMap}
          />
        );
      case 2:
        return (
          <ContractContent
            contractId={CONTRACT_2_ID}
            signatureMap={signatureMap}
          />
        );
      case 3: {
        const healthInfo =
          enrollmentData?.healthInfoByStudent[studentId] ?? null;
        if (!app)
          return <p className="text-sm text-gray-400">No application data.</p>;
        return (
          <HealthFormContent
            app={app}
            healthInfo={healthInfo}
            signatureMap={signatureMap}
          />
        );
      }
      case 4: {
        const { plan, medications } = enrollmentData?.medicationPlanByStudent[
          studentId
        ] ?? { plan: null, medications: [] };
        if (!app)
          return <p className="text-sm text-gray-400">No application data.</p>;
        return (
          <MedicationPlanContent
            app={app}
            plan={plan}
            medications={medications}
            signatureMap={signatureMap}
          />
        );
      }
      case 5: {
        if (!app)
          return <p className="text-sm text-gray-400">No application data.</p>;
        return (
          <ImmunizationFilesContent
            parentId={app.user_id}
            studentId={studentId}
          />
        );
      }
      case 6: {
        const consentLevel =
          enrollmentData?.photoConsentByStudent[studentId] ?? null;
        return (
          <PhotoReleaseContent
            consentLevel={consentLevel}
            signatureMap={signatureMap}
          />
        );
      }
      case 7: {
        if (!app)
          return <p className="text-sm text-gray-400">No application data.</p>;
        return (
          <AssumptionOfRiskContent app={app} signatureMap={signatureMap} />
        );
      }
      case 8: {
        const { plan, persons } = enrollmentData?.authorizedPickupByStudent[
          studentId
        ] ?? { plan: null, persons: [] };
        if (!app)
          return <p className="text-sm text-gray-400">No application data.</p>;
        return (
          <AuthorizedPickupContent
            app={app}
            plan={plan}
            persons={persons}
            signatureMap={signatureMap}
          />
        );
      }
      case 9: {
        const paid =
          enrollmentData?.registrationFeePaidByStudent[studentId] ?? false;
        return (
          <div className="flex items-center gap-2">
            {paid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                <CheckCircle className="w-4 h-4" />
                Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200">
                <XCircle className="w-4 h-4" />
                Unpaid
              </span>
            )}
          </div>
        );
      }
      case 10: {
        const healthStatement =
          enrollmentData?.healthStatementByStudent[studentId] ?? null;
        const religiousExemptionCount =
          enrollmentData?.religiousExemptionCountByStudent[studentId] ?? 0;
        if (!app)
          return <p className="text-sm text-gray-400">No application data.</p>;
        return (
          <HealthStatementContent
            app={app}
            optionType={healthStatement?.option_type ?? null}
            religiousExemptionCount={religiousExemptionCount}
            signatureMap={signatureMap}
          />
        );
      }
      default:
        return <p className="text-sm text-gray-400">No data available.</p>;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-[55]"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${dancingScript.variable} fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl z-[60] flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold font-body text-gray-900 leading-snug pr-4 line-clamp-2">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {renderContent()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
