"use client";

import type { AdminEnrollmentData } from "@/app/actions/getAdminEnrollmentData";
import {
  formatAddress,
  formatBoolean,
  formatDob,
  formatFieldValue,
  formatProgram,
  getChildDisplayName,
  type ApplicationSummaryFields,
} from "@/app/lib/application-display";
import {
  ENROLLMENT_CHECKLIST_ITEMS,
  getChecklistCompletionStatus,
} from "@/app/lib/enrollment-checklist";
import {
  ENROLLMENT_ITEM_TITLES,
  SignatureFontProvider,
  renderEnrollmentItemContent,
  type EnrollmentSummaryApplication,
} from "./EnrollmentSummarySections";

export type EnrollmentSummaryDocumentProps = {
  application: EnrollmentSummaryApplication & ApplicationSummaryFields;
  enrollmentData: AdminEnrollmentData;
  studentId: string;
  registrationFeePaid: boolean;
  immunizationFileNames: string[];
  generatedAt: string;
};

function CompactFieldTable({
  fields,
}: {
  fields: { label: string; value: string }[];
}) {
  return (
    <table className="summary-field-table w-full border-collapse">
      <tbody>
        {fields.map((field) => (
          <tr key={field.label} className="border-b border-gray-100">
            <td className="py-0.5 pr-3 align-top font-semibold text-gray-600 w-[32%] text-xs leading-tight">
              {field.label}
            </td>
            <td className="py-0.5 align-top text-gray-800 text-xs leading-snug">
              {field.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Subsection({
  title,
  fields,
}: {
  title: string;
  fields: { label: string; value: string }[];
}) {
  return (
    <div className="summary-subsection">
      <h3 className="text-xs font-semibold text-gray-700 mb-1 mt-2 first:mt-0">
        {title}
      </h3>
      <CompactFieldTable fields={fields} />
    </div>
  );
}

function SectionBlock({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`summary-section ${className}`}>
      <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EnrollmentSummaryDocument({
  application,
  enrollmentData,
  studentId,
  registrationFeePaid,
  immunizationFileNames,
  generatedAt,
}: EnrollmentSummaryDocumentProps) {
  const signatureMap = enrollmentData.signaturesByStudent[studentId] ?? {};
  const immunizationFileCount =
    enrollmentData.immunizationFileCountByStudent[studentId] ?? 0;
  const checklist = getChecklistCompletionStatus(
    signatureMap,
    immunizationFileCount,
    registrationFeePaid
  );
  const childName = getChildDisplayName(application);
  const { plan: medicationPlan, medications } =
    enrollmentData.medicationPlanByStudent[studentId] ?? {
      plan: null,
      medications: [],
    };
  const { plan: pickupPlan, persons: pickupPersons } =
    enrollmentData.authorizedPickupByStudent[studentId] ?? {
      plan: null,
      persons: [],
    };
  const healthStatement =
    enrollmentData.healthStatementByStudent[studentId] ?? null;

  const itemRenderProps = {
    app: application,
    signatureMap,
    healthInfo: enrollmentData.healthInfoByStudent[studentId] ?? null,
    medicationPlan,
    medications,
    photoConsentLevel:
      enrollmentData.photoConsentByStudent[studentId] ?? null,
    pickupPlan,
    pickupPersons,
    registrationFeePaid,
    healthStatementOptionType: healthStatement?.option_type ?? null,
    religiousExemptionCount:
      enrollmentData.religiousExemptionCountByStudent[studentId] ?? 0,
    immunizationFileNames,
  };

  const legalNameSuffix =
    application.child_legal_name &&
    application.preferred_name &&
    application.child_legal_name !== application.preferred_name
      ? ` (${application.child_legal_name})`
      : "";

  return (
    <SignatureFontProvider>
      <div className="enrollment-summary-print enrollment-summary-document max-w-4xl mx-auto bg-white text-gray-900 px-4 py-6 sm:px-6 sm:py-8">
        <header className="summary-section mb-4 border-b-2 border-[#2C5F2E] pb-3">
          <p className="text-[10px] uppercase tracking-widest text-[#2C5F2E] font-semibold mb-0.5">
            Sage Field School
          </p>
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            Enrollment Summary
          </h1>
          <p className="text-xs text-gray-600 leading-snug">
            <span className="font-semibold text-gray-800">Student:</span>{" "}
            {childName}
            {legalNameSuffix}
            {" · "}
            <span className="font-semibold text-gray-800">Program:</span>{" "}
            {formatProgram(application.program)}
            {" · "}
            <span className="font-semibold text-gray-800">Status:</span> Enrolled
            {" · "}
            <span className="font-semibold text-gray-800">Generated:</span>{" "}
            {generatedAt}
          </p>
        </header>

        <SectionBlock title="Application Information">
          <div className="flex flex-col gap-1">
            <Subsection
              title="Child"
              fields={[
                { label: "Legal Name", value: formatFieldValue(application.child_legal_name) },
                { label: "Preferred Name", value: formatFieldValue(application.preferred_name) },
                {
                  label: "Date of Birth",
                  value: formatDob(
                    application.dob_month,
                    application.dob_day,
                    application.dob_year
                  ),
                },
                { label: "Age", value: formatFieldValue(application.child_age) },
                { label: "Grade", value: formatFieldValue(application.child_grade) },
                { label: "Program", value: formatProgram(application.program) },
              ]}
            />
            <Subsection
              title="Address"
              fields={[
                { label: "Street", value: formatFieldValue(application.address_street) },
                { label: "City", value: formatFieldValue(application.address_city) },
                { label: "State", value: formatFieldValue(application.address_state) },
                { label: "ZIP", value: formatFieldValue(application.address_zip) },
                {
                  label: "Full Address",
                  value: formatAddress({
                    street: application.address_street,
                    city: application.address_city,
                    state: application.address_state,
                    zip: application.address_zip,
                  }),
                },
              ]}
            />
            <Subsection
              title="Health"
              fields={[
                { label: "Has Allergies", value: formatBoolean(application.has_allergies) },
                { label: "Allergies", value: formatFieldValue(application.allergies_description) },
                { label: "Has Medical Conditions", value: formatBoolean(application.has_medical_conditions) },
                { label: "Medical Conditions", value: formatFieldValue(application.medical_conditions_description) },
                { label: "Has Emergency Medications", value: formatBoolean(application.has_emergency_medications) },
                { label: "Emergency Medications", value: formatFieldValue(application.emergency_medications_description) },
                { label: "Needs Aide", value: formatBoolean(application.needs_aide) },
                { label: "Aide Description", value: formatFieldValue(application.needs_aide_description) },
                { label: "Activities to Avoid", value: formatFieldValue(application.activities_to_avoid) },
                { label: "Dysregulation Response", value: formatFieldValue(application.dysregulation_response) },
                { label: "Regulation Strategies", value: formatFieldValue(application.regulation_strategies) },
                { label: "History Flags", value: formatFieldValue(application.history_flags) },
                { label: "History Explanation", value: formatFieldValue(application.history_explanation) },
                { label: "Has Custody Orders", value: formatBoolean(application.has_custody_orders) },
                { label: "Custody Orders", value: formatFieldValue(application.custody_orders_description) },
              ]}
            />
            <Subsection
              title="Background"
              fields={[
                { label: "Previously Homeschooled", value: formatFieldValue(application.is_homeschooled) },
                { label: "Homeschool Explanation", value: formatFieldValue(application.homeschool_explanation) },
                { label: "Previous Schools", value: formatFieldValue(application.previous_schools) },
                { label: "Previous Schools List", value: formatFieldValue(application.previous_schools_list) },
                { label: "Special Interests", value: formatFieldValue(application.special_interests) },
                { label: "Learning Style", value: formatFieldValue(application.learning_style) },
                { label: "Strengths & Interests", value: formatFieldValue(application.strengths_interests) },
                { label: "Current Challenges", value: formatFieldValue(application.current_challenges) },
              ]}
            />
            <Subsection
              title="Guardian 1"
              fields={[
                { label: "Name", value: formatFieldValue(application.g1_full_name) },
                { label: "Relationship", value: formatFieldValue(application.g1_relationship) },
                { label: "Cell Phone", value: formatFieldValue(application.g1_cell_phone) },
                { label: "Work Phone", value: formatFieldValue(application.g1_work_phone) },
                { label: "Email", value: formatFieldValue(application.g1_email) },
                { label: "Has Custody", value: formatBoolean(application.g1_has_custody) },
                { label: "Lives with Child", value: formatBoolean(application.g1_lives_with_child) },
                { label: "Preferred Contact", value: formatBoolean(application.g1_preferred_contact) },
              ]}
            />
            {(application.g2_full_name || application.g2_email) && (
              <Subsection
                title="Guardian 2"
                fields={[
                  { label: "Name", value: formatFieldValue(application.g2_full_name) },
                  { label: "Relationship", value: formatFieldValue(application.g2_relationship) },
                  { label: "Cell Phone", value: formatFieldValue(application.g2_cell_phone) },
                  { label: "Work Phone", value: formatFieldValue(application.g2_work_phone) },
                  { label: "Email", value: formatFieldValue(application.g2_email) },
                  { label: "Has Custody", value: formatBoolean(application.g2_has_custody) },
                  { label: "Lives with Child", value: formatBoolean(application.g2_lives_with_child) },
                  { label: "Preferred Contact", value: formatBoolean(application.g2_preferred_contact) },
                ]}
              />
            )}
          </div>
        </SectionBlock>

        <SectionBlock title="Enrollment Checklist Overview" className="mt-4">
          <p className="text-xs text-gray-600 mb-2 leading-snug">
            {checklist.completedCount} of {checklist.totalCount} steps completed
            {checklist.isEnrollmentComplete
              ? " — all required steps complete."
              : "."}
          </p>
          <table className="summary-checklist-table w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-0.5 pr-3 font-semibold">Item</th>
                <th className="text-left py-0.5 pr-3 font-semibold w-16">Req.</th>
                <th className="text-left py-0.5 font-semibold w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {checklist.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-0.5 pr-3 align-top leading-snug">{item.title}</td>
                  <td className="py-0.5 pr-3 align-top">
                    {item.required ? "Yes" : "No"}
                  </td>
                  <td className="py-0.5 align-top">
                    {item.complete ? "Complete" : "Incomplete"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionBlock>

        <div className="mt-4 flex flex-col gap-4">
          {ENROLLMENT_CHECKLIST_ITEMS.map((item) => (
            <section
              key={item.id}
              className="summary-section summary-item-detail border-t border-gray-200 pt-3"
            >
              <h2 className="text-sm font-bold text-gray-900 mb-0.5 leading-snug">
                {ENROLLMENT_ITEM_TITLES[item.id]}
              </h2>
              <p className="text-[10px] text-gray-500 mb-2 leading-snug">
                {item.subtitle}
              </p>
              <div className="summary-detail-content">
                {renderEnrollmentItemContent({
                  itemId: item.id,
                  ...itemRenderProps,
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in;
        }

        @media print {
          aside,
          .lg\\:hidden.fixed.top-4 {
            display: none !important;
          }

          .h-screen.flex.overflow-hidden {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          main {
            padding: 0 !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }

          .enrollment-summary-print-root {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .enrollment-summary-document {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .summary-signature-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .enrollment-summary-print .summary-detail-content {
            font-size: 10px;
            line-height: 1.35;
          }

          .enrollment-summary-print .summary-detail-content .gap-10 {
            gap: 0.6rem !important;
          }

          .enrollment-summary-print .summary-detail-content .gap-8 {
            gap: 0.5rem !important;
          }

          .enrollment-summary-print .summary-detail-content .gap-6 {
            gap: 0.4rem !important;
          }

          .enrollment-summary-print .summary-detail-content .gap-4 {
            gap: 0.3rem !important;
          }

          .enrollment-summary-print .summary-detail-content .gap-3 {
            gap: 0.25rem !important;
          }

          .enrollment-summary-print .summary-detail-content .text-sm {
            font-size: 10px !important;
            line-height: 1.35 !important;
          }

          .enrollment-summary-print .summary-detail-content .text-xs {
            font-size: 9px !important;
            line-height: 1.3 !important;
          }

          .enrollment-summary-print .summary-detail-content .text-2xl {
            font-size: 13px !important;
          }

          .enrollment-summary-print .summary-detail-content .rounded-xl,
          .enrollment-summary-print .summary-detail-content .rounded-lg {
            border-radius: 0.2rem !important;
          }

          .enrollment-summary-print .summary-detail-content .px-4,
          .enrollment-summary-print .summary-detail-content .px-5 {
            padding-left: 0.35rem !important;
            padding-right: 0.35rem !important;
          }

          .enrollment-summary-print .summary-detail-content .py-3,
          .enrollment-summary-print .summary-detail-content .py-4,
          .enrollment-summary-print .summary-detail-content .py-5 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          .enrollment-summary-print .summary-detail-content .mb-3,
          .enrollment-summary-print .summary-detail-content .mb-4,
          .enrollment-summary-print .summary-detail-content .mb-5 {
            margin-bottom: 0.25rem !important;
          }

          .enrollment-summary-print .summary-detail-content .mt-4 {
            margin-top: 0.2rem !important;
          }

          .enrollment-summary-print .summary-detail-content .pb-2 {
            padding-bottom: 0.15rem !important;
          }

          .enrollment-summary-print .summary-detail-content [class*="bg-rose-"],
          .enrollment-summary-print .summary-detail-content [class*="bg-amber-"],
          .enrollment-summary-print .summary-detail-content [class*="bg-teal-"],
          .enrollment-summary-print .summary-detail-content [class*="bg-purple-"],
          .enrollment-summary-print .summary-detail-content [class*="bg-emerald-"],
          .enrollment-summary-print .summary-detail-content [class*="bg-gray-50"],
          .enrollment-summary-print .summary-detail-content [class*="bg-gray-800"] {
            background: transparent !important;
            color: inherit !important;
          }

          .enrollment-summary-print .summary-detail-content .border-emerald-200,
          .enrollment-summary-print .summary-detail-content .border-rose-100,
          .enrollment-summary-print .summary-detail-content .border-amber-100,
          .enrollment-summary-print .summary-detail-content .border-teal-100,
          .enrollment-summary-print .summary-detail-content .border-purple-100 {
            border-color: #d1d5db !important;
          }

          .enrollment-summary-print .summary-signature-block {
            margin-top: 0.25rem !important;
            padding: 0.2rem 0.35rem !important;
          }

          .enrollment-summary-print .summary-signature-block svg {
            display: none !important;
          }

          .enrollment-summary-print .summary-field-table td {
            font-size: 10px !important;
            padding-top: 1px !important;
            padding-bottom: 1px !important;
          }

          .enrollment-summary-print .summary-checklist-table th,
          .enrollment-summary-print .summary-checklist-table td {
            font-size: 10px !important;
            padding-top: 1px !important;
            padding-bottom: 1px !important;
          }

          .enrollment-summary-print .summary-item-detail {
            padding-top: 0.5rem !important;
          }
        }
      `}</style>
    </SignatureFontProvider>
  );
}
