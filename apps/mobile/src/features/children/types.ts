// Shared types + constants for the parent Children screen.
import type { GardenTint } from "@/components/garden";
import type { ImageSourcePropType } from "react-native";

export type Result = { ok: boolean; error?: string; canceled?: boolean };

export interface Student {
  id: string;
  child_legal_name: string;
  dob_day: string | null;
  dob_month: string | null;
  dob_year: string | null;
  child_grade: string | null;
  has_allergies: string | null;
  allergies_description: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_emergency_medications: string | null;
  emergency_medications_description: string | null;
  learning_style: string | null;
  special_interests: string | null;
  strengths_interests: string | null;
  current_challenges: string | null;
  regulation_strategies: string | null;
  dysregulation_response: string | null;
  profile_image_url: string | null;
}

export const STUDENT_SELECT =
  "id, child_legal_name, dob_day, dob_month, dob_year, child_grade, has_allergies, allergies_description, has_medical_conditions, medical_conditions_description, has_emergency_medications, emergency_medications_description, learning_style, special_interests, strengths_interests, current_challenges, regulation_strategies, dysregulation_response, profile_image_url";

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  student_id: string;
  program: string | null;
  classroom: string | null;
  teacher_name: string | null;
}

export type ChildTab = "teacher" | "attendance" | "learning" | "pickup" | "profile";

export const CHILD_TABS: { key: ChildTab; label: string }[] = [
  { key: "teacher", label: "Teacher" },
  { key: "attendance", label: "Attendance" },
  { key: "learning", label: "Learning" },
  { key: "pickup", label: "Pickup" },
  { key: "profile", label: "Profile" },
];

export const TEACHER_PHOTOS: Record<string, ImageSourcePropType> = {
  "Sabrina Obnamia": require("@/assets/images/Headshot.webp"),
  "Zelinda Melo": require("@/assets/images/team/Zelinda.webp"),
  "Paige Wood": require("@/assets/images/team/Paige.webp"),
};

export interface PickupPlan {
  id: string;
  student_id: string;
  parent_id: string;
  date_of_request: string | null;
  effective_until: string | null;
}

export interface PickupPerson {
  id: string;
  student_id: string;
  parent_id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  dl_state_id_number: string | null;
  vehicle_info: string | null;
  license_plate_state: string | null;
  sort_order: number | null;
}

export type LocalPerson = {
  tempId: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  dl_state_id_number: string;
  vehicle_info: string;
  license_plate_state: string;
};

export const EMPTY_PERSON: Omit<LocalPerson, "tempId"> = {
  full_name: "",
  relationship: "",
  phone: "",
  email: "",
  dl_state_id_number: "",
  vehicle_info: "",
  license_plate_state: "",
};

export type LearningNoteCategory = "academic" | "social" | "behavioral" | "health" | "other";

export interface LearningNote {
  id: string;
  parent_id: string;
  student_id: string;
  category: LearningNoteCategory;
  note_text: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const NOTE_CATEGORIES: LearningNoteCategory[] = ["academic", "social", "behavioral", "health", "other"];

export const CATEGORY_LABELS: Record<LearningNoteCategory, string> = {
  academic: "Academic",
  social: "Social",
  behavioral: "Behavioral",
  health: "Health",
  other: "Other",
};

export const CATEGORY_TINTS: Record<LearningNoteCategory, GardenTint> = {
  academic: "sky",
  social: "lav",
  behavioral: "peach",
  health: "coral",
  other: "butter",
};

export const CATEGORY_EMOJI: Record<LearningNoteCategory, string> = {
  academic: "📚",
  social: "🤝",
  behavioral: "🌈",
  health: "🩺",
  other: "✏️",
};

export type YesNo = "yes" | "no" | "";

/** Editable profile sections — each saves through update_student_profile_fields. */
export type ProfileSectionKind = "overview" | "medical" | "learning" | "regulation" | "support";

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function formatYMDShort(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
