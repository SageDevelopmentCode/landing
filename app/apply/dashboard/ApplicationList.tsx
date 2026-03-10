"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { updateApplication } from "@/app/actions/updateApplication";

type App = Record<string, string | null | boolean>;

// ─── Program label map ───────────────────────────────────────────────────────
const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 2026-2027",
  both: "Both",
};

function formatProgram(value: string | null | boolean | undefined) {
  if (!value || typeof value === "boolean") return null;
  return PROGRAM_LABELS[value] ?? value;
}

// ─── Read-only field ────────────────────────────────────────────────────────
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

// ─── Editable field ─────────────────────────────────────────────────────────
function EditField({
  label,
  fieldKey,
  draft,
  onChange,
  multiline = false,
}: {
  label: string;
  fieldKey: string;
  draft: App;
  onChange: (key: string, value: string) => void;
  multiline?: boolean;
}) {
  const value = draft[fieldKey] == null ? "" : String(draft[fieldKey]);
  const inputClass =
    "w-full text-sm text-gray-800 font-body border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] bg-gray-50";

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs text-gray-400 font-body">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className={inputClass + " resize-none"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className={inputClass}
        />
      )}
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

// ─── SlideOver ───────────────────────────────────────────────────────────────
function SlideOver({
  app,
  onClose,
  onSave,
}: {
  app: App;
  onClose: () => void;
  onSave: (updated: App) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<App>(app);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleChange(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value || null }));
  }

  function enterEdit() {
    setDraft(app);
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!draft.id) return;
    setSaving(true);
    setSaveError(null);

    // Strip non-editable / metadata fields before sending
    const {
      id,
      user_id,
      created_at,
      updated_at,
      status,
      approved,
      approved_at,
      ...editableFields
    } = draft;

    const result = await updateApplication(
      draft.id as string,
      editableFields as Record<string, string | null>,
    );
    setSaving(false);

    if ("error" in result && result.error) {
      setSaveError(result.error);
      return;
    }

    const updated = result.data as App;
    onSave(updated);
    setIsEditing(false);
  }

  const ef = (label: string, key: string, multiline = false) => (
    <EditField
      label={label}
      fieldKey={key}
      draft={draft}
      onChange={handleChange}
      multiline={multiline}
    />
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={isEditing ? undefined : onClose}
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
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-body">Application</p>
            <h2 className="text-base font-bold font-heading text-gray-800">
              {(isEditing ? draft : app).preferred_name ??
                (isEditing ? draft : app).child_legal_name ??
                "—"}
            </h2>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="text-xs font-semibold text-gray-500 font-body hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-semibold text-white font-body bg-[#2C5F2E] hover:bg-[#234d25] border border-[#2C5F2E] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={enterEdit}
                className="text-xs font-semibold text-gray-500 font-body hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2 py-1 rounded transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="mx-6 mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-body">
            {saveError}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isEditing ? (
            <>
              <Section title="Child's Details">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-400 font-body">
                    Program
                  </label>
                  <select
                    value={draft["program"] == null ? "" : String(draft["program"])}
                    onChange={(e) => handleChange("program", e.target.value)}
                    className="w-full text-sm text-gray-800 font-body border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2C5F2E]/30 focus:border-[#2C5F2E] bg-gray-50"
                  >
                    <option value="" disabled>
                      Select program
                    </option>
                    <option value="summer_26">Summer 2026</option>
                    <option value="school_year_26_27">
                      School Year 2026-2027
                    </option>
                    <option value="both">Both</option>
                  </select>
                </div>
                {ef("Legal Name", "child_legal_name")}
                {ef("Preferred Name", "preferred_name")}
                {ef("Birth Month", "dob_month")}
                {ef("Birth Day", "dob_day")}
                {ef("Birth Year", "dob_year")}
                {ef("Grade", "child_grade")}
                {ef("Street Address", "address_street")}
                {ef("City", "address_city")}
                {ef("State", "address_state")}
                {ef("Zip", "address_zip")}
                {ef("Household Phone", "household_phone")}
                {ef("Homeschooled", "is_homeschooled")}
                {ef("Previous Schools", "previous_schools", true)}
                {ef("Special Interests", "special_interests", true)}
              </Section>

              <Section title="Guardian Info">
                {ef("Guardian 1 Name", "g1_full_name")}
                {ef("Relationship", "g1_relationship")}
                {ef("Email", "g1_email")}
                {ef("Cell Phone", "g1_cell_phone")}
                {ef("Work Phone", "g1_work_phone")}
                {ef("Preferred Contact", "g1_preferred_contact")}
                {ef("Lives with Child", "g1_lives_with_child")}
                {ef("Has Custody", "g1_has_custody")}
                {ef("Guardian 2 Name", "g2_full_name")}
                {ef("Relationship (G2)", "g2_relationship")}
                {ef("Email (G2)", "g2_email")}
                {ef("Cell Phone (G2)", "g2_cell_phone")}
                {ef("Work Phone (G2)", "g2_work_phone")}
                {ef("Preferred Contact (G2)", "g2_preferred_contact")}
                {ef("Lives with Child (G2)", "g2_lives_with_child")}
                {ef("Has Custody (G2)", "g2_has_custody")}
                {ef("Custody Orders", "has_custody_orders")}
              </Section>

              <Section title="Health & Support">
                {ef(
                  "Medical Conditions",
                  "medical_conditions_description",
                  true,
                )}
                {ef("Allergies", "allergies_description", true)}
                {ef(
                  "Emergency Medications",
                  "emergency_medications_description",
                  true,
                )}
                {ef("History Flags", "history_flags")}
                {ef("Needs Aide", "needs_aide")}
              </Section>

              <Section title="Learning Profile">
                {ef("Learning Style", "learning_style", true)}
                {ef("Strengths & Interests", "strengths_interests", true)}
                {ef("Current Challenges", "current_challenges", true)}
                {ef("Dysregulation Response", "dysregulation_response", true)}
                {ef("Regulation Strategies", "regulation_strategies", true)}
                {ef("Activities to Avoid", "activities_to_avoid", true)}
              </Section>

              <Section title="Signatures">
                <p className="text-xs text-gray-400 font-body italic">
                  Signatures cannot be edited.
                </p>
                {field("Guardian 1 Signature", app.g1_signature_name)}
                {field("Signature Date", app.g1_signature_date)}
                {field("Guardian 2 Signature", app.g2_signature_name)}
                {field("Signature Date (G2)", app.g2_signature_date)}
              </Section>
            </>
          ) : (
            <>
              <Section title="Child's Details">
                {field("Program", formatProgram(app.program))}
                {field("Legal Name", app.child_legal_name)}
                {field("Preferred Name", app.preferred_name)}
                {field("Date of Birth", app.child_dob)}
                {field("Age", app.child_age)}
                {field("Grade", app.child_grade)}
                {field("Address", app.address)}
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
                {field("Medical Conditions", app.medical_conditions)}
                {field("Allergies", app.allergies)}
                {field("Emergency Medications", app.emergency_medications)}
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
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── ApplicationList ─────────────────────────────────────────────────────────
export default function ApplicationList({
  apps: initialApps,
}: {
  apps: App[];
}) {
  const [apps, setApps] = useState<App[]>(initialApps);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  function handleSave(updated: App) {
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedApp(updated);
  }

  if (apps.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center mb-6">
        <p className="text-gray-500 font-body text-sm">
          No applications found.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-6">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_120px_1fr_140px_80px] px-5 text-xs font-semibold text-gray-400 font-body uppercase tracking-wide">
          <span>Child Name</span>
          <span>Grade</span>
          <span>Program</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {apps.map((app, i) => {
          const childName = app.preferred_name ?? app.child_legal_name ?? "—";
          const isInProgress = app.status === "in_progress";

          function getContinueStep(): number {
            if (!app.g1_full_name) return 2;
            if (!app.has_medical_conditions && !app.medical_conditions_description) return 3;
            if (!app.learning_style) return 4;
            if (!app.g1_signature_name) return 5;
            return 1;
          }

          return (
            <div
              key={(app.id as string | null | undefined) ?? i}
              className="grid grid-cols-[1fr_120px_1fr_140px_80px] items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm"
            >
              <span className="text-sm font-medium text-gray-800 font-body">
                {childName}
              </span>
              <span className="text-sm text-gray-600 font-body">
                {app.child_grade ?? "—"}
              </span>
              <span className="text-sm text-gray-600 font-body">
                {formatProgram(app.program) ?? "—"}
              </span>
              {isInProgress ? (
                <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full font-body border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  In Progress
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full font-body border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Submitted
                </span>
              )}
              {isInProgress ? (
                <Link
                  href={`/apply/step/${getContinueStep()}?appId=${app.id}`}
                  className="text-xs font-semibold text-white font-body bg-[#2C5F2E] hover:bg-[#234d25] rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                >
                  Continue
                </Link>
              ) : (
                <button
                  onClick={() => setSelectedApp(app)}
                  className="text-xs font-semibold text-gray-500 font-body hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  View/Edit
                </button>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <SlideOver
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  );
}
