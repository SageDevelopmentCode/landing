import type { Database } from "@/app/types/database.types";
import type { LearningNoteCategory } from "@/app/actions/saveParentLearningNote";
import type { HomeTint } from "@/app/parent/_garden/ui";

export type Student = Database["admin"]["Tables"]["students"]["Row"];
export type AuthorizedPickupPlan = Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
export type AuthorizedPickupPerson = Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

/** Tab order follows mobile `CHILD_TABS`. */
export const CHILD_TABS = [
  { value: "teacher", label: "Teacher", icon: "🍎" },
  { value: "attendance", label: "Attendance", icon: "📋" },
  { value: "learning", label: "Learning", icon: "💡" },
  { value: "pickup", label: "Pickup", icon: "🚗" },
  { value: "profile", label: "Profile", icon: "🌱" },
] as const;
export type ChildTab = (typeof CHILD_TABS)[number]["value"];

export function parseTab(raw: string | null): ChildTab {
  return CHILD_TABS.some((t) => t.value === raw) ? (raw as ChildTab) : "teacher";
}

export function formatProgramLabel(program: string | undefined | null): string | null {
  switch (program) {
    case "summer_26":
      return "Summer 2026";
    case "school_year_26_27":
      return "School Year 26–27";
    case "both":
      return "Summer & School Year";
    case "homeschool_drop_in":
      return "Homeschool Drop-In";
    default:
      return null;
  }
}

export function formatProgramName(key: string): string {
  const summerMatch = key.match(/^summer[_-]?(\d{2,4})$/i);
  if (summerMatch) {
    const yr = summerMatch[1];
    const full = yr.length === 2 ? `20${yr}` : yr;
    return `Summer ${full}`;
  }
  const syMatch = key.match(/^school[_-]year[_-](\d{2,4})[_-](\d{2,4})$/i);
  if (syMatch) {
    const [, a, b] = syMatch;
    const fa = a.length === 2 ? `20${a}` : a;
    const fb = b.length === 2 ? `20${b}` : b;
    return `School Year ${fa}-${fb}`;
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function computeAge(month: string | null, day: string | null, year: string | null): number | null {
  if (!month || !day || !year) return null;
  const dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function formatDOB(month: string | null, day: string | null, year: string | null): string {
  if (!month && !day && !year) return "—";
  return [month, day, year].filter(Boolean).join("/");
}

export const TEACHER_CARD_DATA: Record<string, { role: string; image: string; about: string; email: string }> = {
  "Sabrina Obnamia": {
    role: "Lead Teacher & Director",
    image: "/assets/team/sabrina.jpg",
    email: "sabrina@sagefieldschool.com",
    about:
      "Ms. Sabrina brings a wealth of experience to Sage Field. She holds a Bachelor's degree in Elementary Education with a concentration in Early Childhood Development from Biola University and a Teaching Credential. Her background includes working with children in a wide range of roles both in the U.S. and internationally—spanning special education, Pre-K, homeschooling, tutoring, coaching, traditional schooling, nature school guide, and more.",
  },
  "Paige Wood": {
    role: "Primary Lead Teacher",
    image: "/assets/team/Paige.webp",
    email: "paige@sagefieldschool.com",
    about:
      "Ms. Paige is the Lead Primary Teacher at Sage Field Private School. She has a passion for outdoor-based learning and creating environments where young children feel safe, curious, and inspired. With experience in Montessori-style education and outdoor learning, she brings creativity and intentionality to every lesson.",
  },
  "Zelinda Melo": {
    role: "Lower Elementary Teacher",
    image: "/assets/team/Zelinda2.JPG",
    email: "zelinda@sagefieldschool.com",
    about:
      "Ms. Zelinda has a deep love for children and a heart for nurturing their growth in a safe and encouraging environment. She looks forward to supporting each child's learning journey and being a positive presence in their day.",
  },
  "Edith DeLuna": {
    role: "Primary and Lower Elementary Teacher Aide",
    image: "/assets/team/Edith.jpg",
    email: "",
    about:
      "Edith has been working with children from a young age and has experience with both nannying and working in schools. She has been especially influenced by the Montessori method, which focuses on independence, curiosity, and hands-on learning. Her goal is to help each child build confidence, discover their strengths, and become more independent in a caring environment. Edith also loves spending time outdoors and enjoys making learning fun, meaningful, and engaging for children.",
  },
  "Craig Wilkerson": {
    role: "Music Teacher",
    image: "/assets/team/Craig Wilkerson.JPG",
    email: "",
    about:
      "Craig Wilkerson is a singer-songwriter, music educator, husband, and father. He joins Sage Field as our music teacher for students ages 4–11, bringing experience as a pre-K music instructor alongside his work in administrative management and human resources at Opus One Music. His background in teaching and songwriting adds to Sage Field's emphasis on creative expression and hands-on learning.",
  },
};

// ─── Learning notes ──────────────────────────────────────────────────────────
export const NOTE_CATEGORIES: LearningNoteCategory[] = ["academic", "social", "behavioral", "health", "other"];

/** Labels from the old page; tint + emoji from mobile `CATEGORY_TINTS` / `CATEGORY_EMOJI`. */
export const CATEGORY_META: Record<LearningNoteCategory, { label: string; tint: HomeTint; emoji: string }> = {
  academic: { label: "Academic", tint: "sky", emoji: "📚" },
  social: { label: "Social", tint: "lav", emoji: "🤝" },
  behavioral: { label: "Behavioral", tint: "peach", emoji: "🌈" },
  health: { label: "Health", tint: "coral", emoji: "🩺" },
  other: { label: "Other", tint: "butter", emoji: "✏️" },
};

// ─── Profile sections (same fields + payload as the old page) ────────────────
export type SectionKey = "medical" | "learning" | "regulation" | "support";

export type ProfileFieldKey =
  | "has_medical_conditions"
  | "medical_conditions_description"
  | "has_allergies"
  | "allergies_description"
  | "has_emergency_medications"
  | "emergency_medications_description"
  | "learning_style"
  | "strengths_interests"
  | "current_challenges"
  | "dysregulation_response"
  | "regulation_strategies"
  | "activities_to_avoid"
  | "needs_aide"
  | "needs_aide_description"
  | "history_flags"
  | "history_explanation";

/**
 * Each section's editable fields, in order. A `yesNo` field shows its `detail` textarea only
 * when set to "yes" (the old page did the same); the payload still includes every field.
 */
export type SectionField =
  | { key: ProfileFieldKey; label: string; kind: "text" }
  | { key: ProfileFieldKey; label: string; kind: "yesNo"; detail: { key: ProfileFieldKey; label: string; viewLabel: string } };

export const PROFILE_SECTIONS: Record<
  SectionKey,
  { title: string; emoji: string; successTitle: string; fields: SectionField[] }
> = {
  medical: {
    title: "Medical Info",
    emoji: "🩺",
    successTitle: "Medical info saved",
    fields: [
      { key: "has_medical_conditions", label: "Has Medical Conditions", kind: "yesNo", detail: { key: "medical_conditions_description", label: "Medical Conditions Description", viewLabel: "Medical Conditions" } },
      { key: "has_allergies", label: "Has Allergies", kind: "yesNo", detail: { key: "allergies_description", label: "Allergies Description", viewLabel: "Allergies" } },
      { key: "has_emergency_medications", label: "Has Emergency Medications", kind: "yesNo", detail: { key: "emergency_medications_description", label: "Emergency Medications Description", viewLabel: "Emergency Medications" } },
    ],
  },
  learning: {
    title: "Learning Profile",
    emoji: "🎨",
    successTitle: "Learning profile saved",
    fields: [
      { key: "learning_style", label: "Learning Style", kind: "text" },
      { key: "strengths_interests", label: "Strengths & Interests", kind: "text" },
      { key: "current_challenges", label: "Current Challenges", kind: "text" },
    ],
  },
  regulation: {
    title: "Regulation & Support",
    emoji: "🌬️",
    successTitle: "Regulation & support saved",
    fields: [
      { key: "dysregulation_response", label: "Dysregulation Response", kind: "text" },
      { key: "regulation_strategies", label: "Regulation Strategies", kind: "text" },
      { key: "activities_to_avoid", label: "Activities to Avoid", kind: "text" },
    ],
  },
  support: {
    title: "Additional Support",
    emoji: "🤝",
    successTitle: "Additional support saved",
    fields: [
      { key: "needs_aide", label: "Needs Aide", kind: "yesNo", detail: { key: "needs_aide_description", label: "Aide Description", viewLabel: "Aide Description" } },
      { key: "history_flags", label: "History Flags", kind: "yesNo", detail: { key: "history_explanation", label: "History Explanation", viewLabel: "History Explanation" } },
    ],
  },
};

/** Field keys in the same order as the old `SECTION_FIELDS`. */
export const SECTION_FIELDS: Record<SectionKey, ProfileFieldKey[]> = {
  medical: [
    "has_medical_conditions",
    "medical_conditions_description",
    "has_allergies",
    "allergies_description",
    "has_emergency_medications",
    "emergency_medications_description",
  ],
  learning: ["learning_style", "strengths_interests", "current_challenges"],
  regulation: ["dysregulation_response", "regulation_strategies", "activities_to_avoid"],
  support: ["needs_aide", "needs_aide_description", "history_flags", "history_explanation"],
};
