"use client";

import type { Database } from "@/app/types/database.types";
import GardenSheet from "./garden/EnrollmentSheet";
import { InfoRow } from "@/app/parent/_garden/fields";
import { cardBase } from "@/app/parent/_garden/ui";
import { PROGRAM_LABELS } from "@/app/lib/application-programs";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

function formatProgram(value: string | null | undefined) {
  if (!value) return null;
  return PROGRAM_LABELS[value] ?? value;
}

type Row = { label: string; value: string | null | boolean | undefined };

/** Drops empty answers (as before) and shows `true` as "Yes". */
function visible(rows: Row[]) {
  return rows
    .filter((r) => !(r.value == null || r.value === false || r.value === ""))
    .map((r) => ({ label: r.label, value: r.value === true ? "Yes" : String(r.value) }));
}

function Group({ title, emoji, rows }: { title: string; emoji: string; rows: Row[] }) {
  const shown = visible(rows);
  if (shown.length === 0) return null;
  return (
    <section className={`${cardBase} px-5 pb-2 pt-4`} aria-label={title}>
      <h3 className="flex items-center gap-2 text-base font-extrabold">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h3>
      <dl>
        {shown.map((r, i) => (
          <InfoRow key={`${r.label}-${i}`} label={r.label} value={r.value} />
        ))}
      </dl>
    </section>
  );
}

export default function ApplicationViewSlideOver({
  app,
  onClose,
  open = true,
}: {
  app: Application;
  onClose: () => void;
  /** Defaults to open: callers that mount it only while showing can leave it out. */
  open?: boolean;
}) {
  const childName = app.preferred_name ?? app.child_legal_name ?? "—";
  const dob = app.dob_month && app.dob_day && app.dob_year ? `${app.dob_month}/${app.dob_day}/${app.dob_year}` : null;
  const address = [app.address_street, app.address_city, app.address_state, app.address_zip].filter(Boolean).join(", ") || null;

  return (
    <GardenSheet open={open} onClose={onClose} icon="📝" title={childName} note="Application">
      <div className="flex flex-col gap-4 pt-2">
        <Group
          title="Child's Details"
          emoji="🌱"
          rows={[
            { label: "Program", value: formatProgram(app.program) },
            ...(app.program === "homeschool_drop_in" ? [{ label: "Drop-In Program", value: formatProgram(app.drop_in_program) }] : []),
            { label: "Legal Name", value: app.child_legal_name },
            { label: "Preferred Name", value: app.preferred_name },
            { label: "Date of Birth", value: dob },
            { label: "Age", value: app.child_age != null ? String(app.child_age) : null },
            { label: "Grade", value: app.child_grade },
            { label: "Address", value: address },
            { label: "Homeschooled", value: app.is_homeschooled },
            { label: "Previous Schools", value: app.previous_schools },
            { label: "Special Interests", value: app.special_interests },
          ]}
        />
        <Group
          title="Guardian Info"
          emoji="👪"
          rows={[
            { label: "Guardian 1 Name", value: app.g1_full_name },
            { label: "Relationship", value: app.g1_relationship },
            { label: "Email", value: app.g1_email },
            { label: "Cell Phone", value: app.g1_cell_phone },
            { label: "Work Phone", value: app.g1_work_phone },
            { label: "Preferred Contact", value: app.g1_preferred_contact },
            { label: "Lives with Child", value: app.g1_lives_with_child },
            { label: "Has Custody", value: app.g1_has_custody },
            ...(app.g2_full_name
              ? [
                  { label: "Guardian 2 Name", value: app.g2_full_name },
                  { label: "Relationship", value: app.g2_relationship },
                  { label: "Email", value: app.g2_email },
                  { label: "Cell Phone", value: app.g2_cell_phone },
                  { label: "Work Phone", value: app.g2_work_phone },
                  { label: "Preferred Contact", value: app.g2_preferred_contact },
                  { label: "Lives with Child", value: app.g2_lives_with_child },
                  { label: "Has Custody", value: app.g2_has_custody },
                ]
              : []),
            { label: "Custody Orders", value: app.has_custody_orders },
          ]}
        />
        <Group
          title="Health & Support"
          emoji="❤️"
          rows={[
            { label: "Medical Conditions", value: app.medical_conditions_description },
            { label: "Allergies", value: app.allergies_description },
            { label: "Emergency Medications", value: app.emergency_medications_description },
            { label: "History Flags", value: app.history_flags },
            { label: "Needs Aide", value: app.needs_aide },
          ]}
        />
        <Group
          title="Learning Profile"
          emoji="🧠"
          rows={[
            { label: "Learning Style", value: app.learning_style },
            { label: "Strengths & Interests", value: app.strengths_interests },
            { label: "Current Challenges", value: app.current_challenges },
            { label: "Dysregulation Response", value: app.dysregulation_response },
            { label: "Regulation Strategies", value: app.regulation_strategies },
            { label: "Activities to Avoid", value: app.activities_to_avoid },
          ]}
        />
        <Group
          title="Signatures"
          emoji="✍️"
          rows={[
            { label: "Guardian 1 Signature", value: app.g1_signature_name },
            { label: "Signature Date", value: app.g1_signature_date },
            { label: "Guardian 2 Signature", value: app.g2_signature_name },
            { label: "Signature Date (G2)", value: app.g2_signature_date },
          ]}
        />
      </div>
    </GardenSheet>
  );
}
