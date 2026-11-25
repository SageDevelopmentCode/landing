import { z } from "zod";

export const AGREEMENT_STATUSES = ["draft", "sent", "viewed", "signed", "countersigned", "voided"] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

export const CONTRACTOR_ROLES = ["lead_teacher", "teacher_aide", "one_to_one_aide", "substitute", "other"] as const;
export type ContractorRole = (typeof CONTRACTOR_ROLES)[number];

export const ROLE_LABELS: Record<ContractorRole, string> = {
  lead_teacher: "Lead teacher",
  teacher_aide: "Teacher aide",
  one_to_one_aide: "1:1 aide",
  substitute: "Substitute",
  other: "Other",
};

export const RATE_UNITS = ["hour", "day", "week", "month"] as const;
export type RateUnit = (typeof RATE_UNITS)[number];

export const INVOICE_PERIODS = ["week", "month"] as const;
export type InvoicePeriod = (typeof INVOICE_PERIODS)[number];

export const EXHIBIT_A_KEYS = [
  "role",
  "group",
  "days_hours",
  "rate_schedule",
  "planning_time",
  "extra_duties",
  "materials_contractor",
  "materials_school",
] as const;
export type ExhibitAKey = (typeof EXHIBIT_A_KEYS)[number];
export type ExhibitA = Partial<Record<ExhibitAKey, string>>;

export interface SectionSignature {
  printed_name: string;
  signature: string;
  signed_at: string;
}
export type SectionSignatureMap = Record<string, SectionSignature>;

/** Row in teachers.contractor_agreements. */
export interface ContractorAgreement {
  id: string;
  token: string;
  template_version: string;
  status: AgreementStatus;

  contractor_name: string;
  contractor_email: string | null;
  role: ContractorRole;
  role_other: string | null;
  effective_date: string | null;
  start_date: string | null;
  end_date_text: string | null;
  rate_amount: number | null;
  rate_unit: RateUnit | null;
  invoice_due_text: string | null;
  invoice_period: InvoicePeriod | null;
  payment_days: number | null;
  absence_notice_hours: number | null;
  time_off_notice_days: number | null;
  termination_notice_days: number | null;
  second_contact: string | null;
  exhibit_a: ExhibitA;

  contractor_address: string | null;
  contractor_phone: string | null;
  signer_email: string | null;
  section_signatures: SectionSignatureMap;
  signed_printed_name: string | null;
  signed_signature: string | null;
  signed_at: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  esign_consent_at: string | null;

  school_signer_name: string | null;
  school_signer_title: string | null;
  school_signature: string | null;
  countersigned_at: string | null;
  countersigned_by: string | null;

  viewed_at: string | null;
  voided_at: string | null;
  created_by: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** What the public signing page is allowed to see (no IP/UA/audit internals). */
export type PublicAgreement = Omit<ContractorAgreement, "signer_ip" | "signer_user_agent" | "created_by" | "countersigned_by" | "is_deleted">;

export const STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed · needs countersign",
  countersigned: "Fully executed",
  voided: "Voided",
};

export const isTeacherSigned = (s: AgreementStatus) => s === "signed" || s === "countersigned";
export const isOpenForSigning = (s: AgreementStatus) => s === "sent" || s === "viewed";

// ─── Validation ──────────────────────────────────────────────────────────────

const optText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const optInt = z
  .number()
  .int()
  .min(0)
  .max(10000)
  .optional()
  .nullable()
  .transform((v) => (v === undefined ? null : v));
const optDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const agreementTermsSchema = z.object({
  contractor_name: z.string().trim().min(1, "Teacher name is required").max(200),
  contractor_email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email")
    .transform((v) => (v ? v : null)),
  role: z.enum(CONTRACTOR_ROLES),
  role_other: optText(200),
  effective_date: optDate,
  start_date: optDate,
  end_date_text: optText(200),
  rate_amount: z
    .number()
    .min(0)
    .max(1_000_000)
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
  rate_unit: z.enum(RATE_UNITS).optional().nullable().transform((v) => v ?? null),
  invoice_due_text: optText(200),
  invoice_period: z.enum(INVOICE_PERIODS).optional().nullable().transform((v) => v ?? null),
  payment_days: optInt,
  absence_notice_hours: optInt,
  time_off_notice_days: optInt,
  termination_notice_days: optInt,
  second_contact: optText(200),
  exhibit_a: z.partialRecord(z.enum(EXHIBIT_A_KEYS), z.string().trim().max(1000)).default({}),
});
export type AgreementTermsInput = z.input<typeof agreementTermsSchema>;

const signatureSchema = z.object({
  printed_name: z.string().trim().min(1).max(200),
  signature: z.string().trim().min(1).max(200),
  signed_at: z.string().min(1).max(64),
});

export const submissionSchema = z.object({
  token: z.string().min(16).max(128),
  contractor_address: z.string().trim().min(5, "Please enter your address").max(500),
  contractor_phone: z.string().trim().min(7, "Please enter your phone number").max(40),
  signer_email: z.string().trim().email("Please enter a valid email").max(200),
  section_signatures: z.record(z.string(), signatureSchema),
  final_printed_name: z.string().trim().min(1, "Please enter your printed name").max(200),
  final_signature: z.string().trim().min(1, "Please sign").max(200),
  esign_consent: z.literal(true, { message: "Please agree to sign electronically" }),
});
export type SubmissionInput = z.input<typeof submissionSchema>;

export const countersignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
  title: z.string().trim().min(1, "Title is required").max(200),
  signature: z.string().trim().min(1, "Please sign").max(200),
});
export type CountersignInput = z.input<typeof countersignSchema>;
