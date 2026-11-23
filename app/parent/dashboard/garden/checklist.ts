import type { Database } from "@/app/types/database.types";
import type { SignatureMap } from "@/app/types/enrollment-signatures";
import {
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_ID,
  CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_4_ID,
  CONTRACT_4_TOTAL_SECTIONS,
  CONTRACT_5_ID,
  CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_ID,
  CONTRACT_6_TOTAL_SECTIONS,
  CONTRACT_7_ID,
  CONTRACT_7_TOTAL_SECTIONS,
  CONTRACT_8_ID,
  CONTRACT_8_TOTAL_SECTIONS,
  isContractComplete,
} from "@/app/types/enrollment-signatures";
import type { HomeTint } from "@/app/parent/_garden/ui";

export type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
export type StudentHealthInfo = Database["parent_app"]["Tables"]["student_health_info"]["Row"];
export type StudentMedicationPlan = Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
export type StudentMedication = Database["parent_app"]["Tables"]["student_medications"]["Row"];
export type AuthorizedPickupPlan = Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
export type AuthorizedPickupPerson = Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];
export type ConsentLevel = "FULL" | "LIMITED" | "NO";

export type ChecklistItem = {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  tint: HomeTint;
  required: boolean;
  /** "contract" rows open a signing sheet; the others are uploads / payment. */
  kind: "contract" | "immunization" | "fee";
  contractId?: number;
  contractSections?: number;
};

/** The 10 enrollment steps, in the order parents see them. Titles are the real copy. */
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 1,
    title: "Program Description, Parent Responsibilities, and Key Policies",
    subtitle: "Review and sign the program contract",
    emoji: "📜",
    tint: "sky",
    required: true,
    kind: "contract",
    contractId: CONTRACT_1_ID,
    contractSections: CONTRACT_1_TOTAL_SECTIONS,
  },
  {
    id: 2,
    title: "Community Agreement for Families and Staff",
    subtitle: "Review and sign the community agreement",
    emoji: "🤝",
    tint: "lav",
    required: true,
    kind: "contract",
    contractId: CONTRACT_2_ID,
    contractSections: CONTRACT_2_TOTAL_SECTIONS,
  },
  {
    id: 3,
    title: "Emergency Contact, Health, and Immunization Form",
    subtitle: "Complete and sign the health and emergency form",
    emoji: "❤️",
    tint: "coral",
    required: true,
    kind: "contract",
    contractId: CONTRACT_3_ID,
    contractSections: CONTRACT_3_TOTAL_SECTIONS,
  },
  {
    id: 4,
    title: "Emergency Medication Plan on File",
    subtitle: "Submit if your child requires emergency medication",
    emoji: "💊",
    tint: "peach",
    required: false,
    kind: "contract",
    contractId: CONTRACT_4_ID,
    contractSections: CONTRACT_4_TOTAL_SECTIONS,
  },
  {
    id: 5,
    title: "Submit Proof of Immunizations",
    subtitle: "Upload current immunization records",
    emoji: "🛡️",
    tint: "mint",
    required: true,
    kind: "immunization",
  },
  {
    id: 10,
    title: "Health Information Form",
    subtitle: "Complete and sign the health information statement",
    emoji: "📋",
    tint: "sky",
    required: true,
    kind: "contract",
    contractId: CONTRACT_8_ID,
    contractSections: CONTRACT_8_TOTAL_SECTIONS,
  },
  {
    id: 6,
    title: "Photo Release Form",
    subtitle: "Review and sign the photo and media release",
    emoji: "📸",
    tint: "butter",
    required: true,
    kind: "contract",
    contractId: CONTRACT_5_ID,
    contractSections: CONTRACT_5_TOTAL_SECTIONS,
  },
  {
    id: 7,
    title: "Assumption of Risk and Liability Release",
    subtitle: "Review and sign the liability release",
    emoji: "⚠️",
    tint: "peach",
    required: true,
    kind: "contract",
    contractId: CONTRACT_6_ID,
    contractSections: CONTRACT_6_TOTAL_SECTIONS,
  },
  {
    id: 8,
    title: "Additional Authorized Pickup Person",
    subtitle: "Add authorized pickup contacts and sign",
    emoji: "🚗",
    tint: "lav",
    required: false,
    kind: "contract",
    contractId: CONTRACT_7_ID,
    contractSections: CONTRACT_7_TOTAL_SECTIONS,
  },
  {
    id: 9,
    title: "Pay Registration Fee",
    subtitle: "Submit the registration fee to complete enrollment",
    emoji: "💳",
    tint: "coral",
    required: true,
    kind: "fee",
  },
];

export const TOTAL_STEPS = CHECKLIST_ITEMS.length;

export type ChecklistState = {
  signatures: SignatureMap;
  immunizationCount: number;
  feePaid: boolean;
};

export function isItemDone(item: ChecklistItem, s: ChecklistState): boolean {
  if (item.kind === "immunization") return s.immunizationCount > 0;
  if (item.kind === "fee") return s.feePaid;
  if (item.contractId && item.contractSections) return isContractComplete(s.signatures, item.contractId, item.contractSections);
  return false;
}

export function signedSectionCount(item: ChecklistItem, signatures: SignatureMap): number {
  if (!item.contractId) return 0;
  return Object.keys(signatures).filter((k) => k.startsWith(`${item.contractId}-`)).length;
}

export function completedCount(s: ChecklistState): number {
  return CHECKLIST_ITEMS.filter((i) => isItemDone(i, s)).length;
}

/** Every required row done (same rule the server checks before enrolling). */
export function requiredComplete(s: ChecklistState): boolean {
  return CHECKLIST_ITEMS.filter((i) => i.required).every((i) => isItemDone(i, s));
}

/** First required row that still needs the parent, in list order. */
export function nextRequiredItem(s: ChecklistState): ChecklistItem | null {
  return CHECKLIST_ITEMS.find((i) => i.required && !isItemDone(i, s)) ?? null;
}

export function childNameOf(app: Pick<Application, "preferred_name" | "child_legal_name">): string {
  return app.preferred_name ?? app.child_legal_name ?? "Student";
}

export function dobOf(app: Pick<Application, "dob_month" | "dob_day" | "dob_year">): string | null {
  return [app.dob_month, app.dob_day, app.dob_year].filter(Boolean).join("/") || null;
}

/** Pending application → step to resume at (unchanged from the old dashboard). */
export function continueStepFor(app: Application): number {
  if (!app.g1_full_name) return 2;
  if (!app.has_medical_conditions && !app.medical_conditions_description) return 3;
  if (!app.learning_style) return 4;
  if (!app.g1_signature_name) return 5;
  return 1;
}

/**
 * Health info counts as "a health form" only when it has more than the emergency contacts,
 * since the Emergency Contacts page upserts those on their own.
 */
export function hasHealthFormDetails(info: StudentHealthInfo | null | undefined): boolean {
  if (!info) return false;
  const text = [
    info.physician_name,
    info.clinic_name,
    info.physician_phone,
    info.insurance_provider,
    info.policy_number,
    info.group_number,
    info.preferred_hospital,
    info.health_conditions,
    info.ongoing_care_description,
    info.emergency_medication_description,
    info.immunization_status,
  ];
  return text.some((v) => !!v && String(v).trim() !== "") || !!info.ongoing_care || !!info.emergency_medication_required;
}
