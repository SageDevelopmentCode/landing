"use client";

import { motion } from "framer-motion";
import type { Database } from "@/app/types/database.types";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 2026-2027",
  both: "Both",
};

function formatProgram(value: string | null | undefined) {
  if (!value) return null;
  return PROGRAM_LABELS[value] ?? value;
}

function field(label: string, value: string | null | boolean | undefined) {
  if (value == null || value === false || value === "") return null;
  const display = value === true ? "Yes" : value;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-body">{label}</span>
      <span className="text-sm text-gray-800 font-body">{display}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const kids = Array.isArray(children) ? children.filter(Boolean) : children;
  if (!kids || (Array.isArray(kids) && kids.length === 0)) return null;
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-3 border-b border-gray-100 pb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export default function ApplicationViewSlideOver({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const childName = app.preferred_name ?? app.child_legal_name ?? "—";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-body">Application</p>
            <h2 className="text-base font-bold font-heading text-gray-800">
              {childName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2 py-1 rounded transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Section title="Child's Details">
            {field("Program", formatProgram(app.program))}
            {field("Legal Name", app.child_legal_name)}
            {field("Preferred Name", app.preferred_name)}
            {field("Date of Birth", app.dob_month && app.dob_day && app.dob_year ? `${app.dob_month}/${app.dob_day}/${app.dob_year}` : null)}
            {field("Age", app.child_age != null ? String(app.child_age) : null)}
            {field("Grade", app.child_grade)}
            {field("Address", [app.address_street, app.address_city, app.address_state, app.address_zip].filter(Boolean).join(", ") || null)}
            {field("Household Phone", app.household_phone)}
            {field("Homeschooled", app.is_homeschooled)}
            {field("Previous Schools", app.previous_schools)}
            {field("Special Interests", app.special_interests)}
          </Section>

          <Section title="Guardian Info">
            {field("Guardian 1 Name", app.g1_full_name)}
            {field("Relationship", app.g1_relationship)}
            {field("Email", app.g1_email)}
            {field("Cell Phone", app.g1_cell_phone)}
            {field("Work Phone", app.g1_work_phone)}
            {field("Preferred Contact", app.g1_preferred_contact)}
            {field("Lives with Child", app.g1_lives_with_child)}
            {field("Has Custody", app.g1_has_custody)}
            {app.g2_full_name ? (
              <div className="pt-2 flex flex-col gap-3">
                {field("Guardian 2 Name", app.g2_full_name)}
                {field("Relationship", app.g2_relationship)}
                {field("Email", app.g2_email)}
                {field("Cell Phone", app.g2_cell_phone)}
                {field("Work Phone", app.g2_work_phone)}
                {field("Preferred Contact", app.g2_preferred_contact)}
                {field("Lives with Child", app.g2_lives_with_child)}
                {field("Has Custody", app.g2_has_custody)}
              </div>
            ) : null}
            {field("Custody Orders", app.has_custody_orders)}
          </Section>

          <Section title="Health & Support">
            {field("Medical Conditions", app.medical_conditions_description)}
            {field("Allergies", app.allergies_description)}
            {field("Emergency Medications", app.emergency_medications_description)}
            {field("History Flags", app.history_flags)}
            {field("Needs Aide", app.needs_aide)}
          </Section>

          <Section title="Learning Profile">
            {field("Learning Style", app.learning_style)}
            {field("Strengths & Interests", app.strengths_interests)}
            {field("Current Challenges", app.current_challenges)}
            {field("Dysregulation Response", app.dysregulation_response)}
            {field("Regulation Strategies", app.regulation_strategies)}
            {field("Activities to Avoid", app.activities_to_avoid)}
          </Section>

          <Section title="Signatures">
            {field("Guardian 1 Signature", app.g1_signature_name)}
            {field("Signature Date", app.g1_signature_date)}
            {field("Guardian 2 Signature", app.g2_signature_name)}
            {field("Signature Date (G2)", app.g2_signature_date)}
          </Section>
        </div>
      </motion.div>
    </>
  );
}
