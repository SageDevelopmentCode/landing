export type OutreachEmailCategory =
  | "enrollment"
  | "summer"
  | "newsletters"
  | "schoolYear"
  | "other";

export type OutreachEmailCatalogEntry = {
  id: string;
  label: string;
  category: OutreachEmailCategory;
};

export const OUTREACH_CATEGORY_LABELS: Record<OutreachEmailCategory, string> = {
  enrollment: "Enrollment",
  summer: "Summer",
  newsletters: "Newsletters",
  schoolYear: "School Year",
  other: "Other",
};

export const OUTREACH_EMAIL_CATALOG: OutreachEmailCatalogEntry[] = [
  // Enrollment
  { id: "reg-fee-confirmation", label: "Send Reg Fee Confirmation", category: "enrollment" },
  { id: "enrollment-reminder", label: "Send Enrollment Reminder", category: "enrollment" },
  { id: "enrollment-reminder-2", label: "Send Enrollment Reminder 2", category: "enrollment" },
  { id: "enrollment-reminder-3", label: "Send Enrollment Reminder 3", category: "enrollment" },
  {
    id: "enrollment-checklist-reminder",
    label: "Send Enrollment Checklist Reminder (Aug 17)",
    category: "enrollment",
  },
  { id: "enrollment-confirmation", label: "Send Enrollment Confirmation", category: "enrollment" },
  { id: "info-session-invite", label: "Send Info Session Invite", category: "enrollment" },
  { id: "open-house-follow-up", label: "Send Open House Follow-Up", category: "enrollment" },
  {
    id: "drop-in-payment-confirmation",
    label: "Send Drop-In Payment Confirmation",
    category: "enrollment",
  },
  { id: "drop-in-clarification", label: "Send Drop-In Clarification", category: "enrollment" },
  // Summer
  {
    id: "school-year-commitment",
    label: "Send School Year Commitment Request",
    category: "summer",
  },
  { id: "summer-week-selection", label: "Send Summer Week Selection", category: "summer" },
  { id: "summer-week-selection-2", label: "Send Summer Week Selection 2", category: "summer" },
  { id: "summer-welcome", label: "Send Summer Welcome", category: "summer" },
  {
    id: "summer-tuition-confirmation",
    label: "Send Summer Tuition Confirmation",
    category: "summer",
  },
  {
    id: "summer-tuition-due-reminder",
    label: "Send Summer Tuition Due Date Reminder",
    category: "summer",
  },
  {
    id: "summer-tuition-due-today",
    label: "Send Tuition Due Today Reminder",
    category: "summer",
  },
  { id: "summer-starting-soon", label: "Send Summer Starting Soon", category: "summer" },
  { id: "summer-first-day", label: "Send Summer First Day", category: "summer" },
  // Newsletters
  { id: "summer-week-one-newsletter", label: "Send Week One Newsletter", category: "newsletters" },
  { id: "summer-week-two-newsletter", label: "Send Week Two Newsletter", category: "newsletters" },
  {
    id: "summer-week-three-newsletter",
    label: "Send Week Three Newsletter",
    category: "newsletters",
  },
  { id: "summer-week-four-newsletter", label: "Send Week Four Newsletter", category: "newsletters" },
  { id: "summer-week-five-newsletter", label: "Send Week Five Newsletter", category: "newsletters" },
  { id: "summer-week-six-newsletter", label: "Send Week Six Newsletter", category: "newsletters" },
  {
    id: "summer-week-seven-newsletter",
    label: "Send Week Seven Newsletter",
    category: "newsletters",
  },
  {
    id: "summer-week-eight-newsletter",
    label: "Send Week Eight Newsletter",
    category: "newsletters",
  },
  {
    id: "summer-week-eleven-newsletter",
    label: "Send Week Eleven Newsletter",
    category: "newsletters",
  },
  {
    id: "summer-week-twelve-newsletter",
    label: "Send Week Twelve Newsletter",
    category: "newsletters",
  },
  // School Year
  {
    id: "school-year-week-one-newsletter",
    label: "Send School Year Week One Newsletter",
    category: "schoolYear",
  },
  {
    id: "school-year-week-two-newsletter",
    label: "Send School Year Week Two Newsletter",
    category: "schoolYear",
  },
  {
    id: "september-tuition-reminder-school-year",
    label: "Send September Tuition Reminder (School Year)",
    category: "schoolYear",
  },
  {
    id: "september-tuition-reminder-drop-in",
    label: "Send September Tuition Reminder (Homeschool Drop-In)",
    category: "schoolYear",
  },
  { id: "labor-day-reminder", label: "Send Labor Day Reminder", category: "schoolYear" },
  // Other
  { id: "free-friday-announcement", label: "Send Free Friday Announcement", category: "other" },
  { id: "fun-friday-confirmation", label: "Send Fun Friday Confirmation", category: "other" },
  { id: "google-review-incentive", label: "Send Google Review Incentive", category: "other" },
  { id: "meet-miss-joy-invite", label: "Send Meet Miss Joy Invite", category: "other" },
  { id: "meet-miss-joy-reminder", label: "Send Meet Miss Joy Reminder", category: "other" },
  {
    id: "activity-preference-reminder",
    label: "Send Activity Preference Reminder",
    category: "other",
  },
  { id: "ptc-reschedule", label: "Send PTC Reschedule Email", category: "other" },
  {
    id: "community-garden-day-invite",
    label: "Send Community Garden Day Invite",
    category: "other",
  },
  { id: "school-year-tuition-info", label: "Send School Year Tuition Info", category: "other" },
  {
    id: "tuition-clarification-2nd-4th",
    label: "Send Tuition Clarification (2nd–4th Grade)",
    category: "other",
  },
  {
    id: "august-tuition-reminder-school-year",
    label: "Send August Tuition Reminder (School Year)",
    category: "other",
  },
  {
    id: "august-tuition-due-tonight-school-year",
    label: "Send August Tuition Due Tonight Reminder (School Year)",
    category: "other",
  },
  {
    id: "august-tuition-reminder-drop-in",
    label: "Send August Tuition Reminder (Homeschool Drop-In)",
    category: "other",
  },
];

export function getOutreachEmailCatalogEntry(
  emailKey: string,
): OutreachEmailCatalogEntry | undefined {
  return OUTREACH_EMAIL_CATALOG.find((entry) => entry.id === emailKey);
}
