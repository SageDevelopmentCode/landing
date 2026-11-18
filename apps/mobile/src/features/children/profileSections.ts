// Editable profile sections (Learning Overview, Medical Info, Learning Profile,
// Regulation, Support). Copy is unchanged from the previous screen.
import type { ProfileSectionKind, Student, YesNo } from "./types";

export type TextFieldDef = {
  key: keyof Student;
  label: string;
  placeholder: string;
};

export type YesNoFieldDef = {
  key: "has_allergies" | "has_medical_conditions" | "has_emergency_medications";
  descKey: "allergies_description" | "medical_conditions_description" | "emergency_medications_description";
  label: string;
  descLabel: string;
  descPlaceholder: string;
};

export type SectionDef = {
  title: string;
  /** Discord/error key, unchanged from the old screen. */
  logKey: string;
  successTitle: string;
  textFields: TextFieldDef[];
  yesNoFields?: YesNoFieldDef[];
};

const LEARNING_STYLE: TextFieldDef = {
  key: "learning_style",
  label: "Learning Style",
  placeholder: "e.g. Visual, Hands-on, Auditory",
};
const SPECIAL_INTERESTS: TextFieldDef = {
  key: "special_interests",
  label: "Special Interests",
  placeholder: "e.g. Dinosaurs, Music, Sports",
};
const STRENGTHS: TextFieldDef = {
  key: "strengths_interests",
  label: "Strengths & Interests",
  placeholder: "What your child does well or enjoys",
};
const CHALLENGES: TextFieldDef = {
  key: "current_challenges",
  label: "Current Challenges",
  placeholder: "Areas where your child needs extra support",
};

export const PROFILE_SECTIONS: Record<ProfileSectionKind, SectionDef> = {
  overview: {
    title: "Edit Learning Overview",
    logKey: "parent-children-learning-overview-save",
    successTitle: "Learning overview saved",
    textFields: [LEARNING_STYLE, SPECIAL_INTERESTS, STRENGTHS, CHALLENGES],
  },
  medical: {
    title: "Edit Medical Info",
    logKey: "parent-children-medical-info-save",
    successTitle: "Medical info saved",
    textFields: [],
    yesNoFields: [
      {
        key: "has_allergies",
        descKey: "allergies_description",
        label: "Has Allergies?",
        descLabel: "Allergies Description",
        descPlaceholder: "Describe allergies…",
      },
      {
        key: "has_medical_conditions",
        descKey: "medical_conditions_description",
        label: "Has Medical Conditions?",
        descLabel: "Medical Conditions Description",
        descPlaceholder: "Describe medical conditions…",
      },
      {
        key: "has_emergency_medications",
        descKey: "emergency_medications_description",
        label: "Has Emergency Medications?",
        descLabel: "Emergency Medications Description",
        descPlaceholder: "Describe emergency medications…",
      },
    ],
  },
  learning: {
    title: "Edit Learning Profile",
    logKey: "parent-children-learning-profile-save",
    successTitle: "Learning profile saved",
    textFields: [LEARNING_STYLE, SPECIAL_INTERESTS, STRENGTHS],
  },
  regulation: {
    title: "Edit Regulation",
    logKey: "parent-children-regulation-save",
    successTitle: "Regulation saved",
    textFields: [
      {
        key: "regulation_strategies",
        label: "Regulation Strategies",
        placeholder: "What helps your child self-regulate?",
      },
      {
        key: "dysregulation_response",
        label: "Dysregulation Response",
        placeholder: "How does your child respond when dysregulated?",
      },
    ],
  },
  support: {
    title: "Edit Support",
    logKey: "parent-children-support-save",
    successTitle: "Support saved",
    textFields: [CHALLENGES],
  },
};

export type SectionDraft = Record<string, string>;

export function draftFromStudent(kind: ProfileSectionKind, st: Student): SectionDraft {
  const def = PROFILE_SECTIONS[kind];
  const d: SectionDraft = {};
  for (const f of def.textFields) d[f.key] = (st[f.key] as string | null) ?? "";
  for (const f of def.yesNoFields ?? []) {
    d[f.key] = ((st[f.key] as YesNo | null) ?? "") as string;
    d[f.descKey] = st[f.descKey] ?? "";
  }
  return d;
}

/** The student fields the save writes (identical rules to the old modals). */
export function fieldsFromDraft(kind: ProfileSectionKind, d: SectionDraft): Partial<Student> {
  const def = PROFILE_SECTIONS[kind];
  const out: Record<string, string | null> = {};
  for (const f of def.textFields) out[f.key] = (d[f.key] ?? "").trim() || null;
  for (const f of def.yesNoFields ?? []) {
    const yn = d[f.key] ?? "";
    out[f.key] = yn || null;
    out[f.descKey] = yn === "yes" ? (d[f.descKey] ?? "").trim() || null : null;
  }
  return out as Partial<Student>;
}

/** RPC params: p_<field> for every field the section owns. */
export function rpcParams(studentId: string, fields: Partial<Student>) {
  const params: Record<string, string | null> = { p_student_id: studentId };
  for (const [k, v] of Object.entries(fields)) params[`p_${k}`] = (v as string | null) ?? null;
  return params;
}
