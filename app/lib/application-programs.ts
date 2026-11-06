/**
 * Single source of truth for application program values, labels, and
 * registration fee logic. Safe to import from client and server code.
 *
 * Legacy values (`summer_26`, `both`) are no longer offered in the apply form
 * but remain valid for existing application rows.
 */

export const SUMMER_FEE_CENTS = 7500;
export const SCHOOL_YEAR_FEE_CENTS = 50000;

/** A single registration-fee-bearing program. */
export type FeeComponent =
  | "summer_26"
  | "summer_27"
  | "school_year_26_27"
  | "school_year_27_28";

export type ProgramValue =
  | "summer_26"
  | "summer_27"
  | "school_year_26_27"
  | "school_year_27_28"
  | "both"
  | "summer_27_school_year_27_28"
  | "homeschool_drop_in";

export type DropInProgramValue =
  | "summer_26"
  | "summer_27"
  | "school_year_26_27"
  | "both"
  | "summer_27_school_year_27_28";

/** Combo value for Summer 2027 + SY 2027-28 (shown as "Both" for drop-in). */
export const SUMMER_27_SY_27_28 = "summer_27_school_year_27_28" as const;

/** Options offered in the Step 1 "Program Interest" list. */
export const PROGRAM_OPTIONS: { value: ProgramValue; label: string }[] = [
  { value: "school_year_26_27", label: "School Year 2026-2027" },
  { value: "homeschool_drop_in", label: "Homeschool Drop-In" },
  { value: "summer_27", label: "Summer 2027" },
  { value: "school_year_27_28", label: "School Year 2027-2028" },
  {
    value: SUMMER_27_SY_27_28,
    label: "Both: Summer 2027 + School Year 2027-2028",
  },
];

/** Options offered for "Which program(s) are you dropping in for?". */
export const DROP_IN_PROGRAM_OPTIONS: {
  value: DropInProgramValue;
  label: string;
}[] = [
  { value: "school_year_26_27", label: "School Year 2026-2027" },
  { value: "summer_27", label: "Summer 2027" },
  {
    value: SUMMER_27_SY_27_28,
    label: "Both: Summer 2027 + School Year 2027-2028",
  },
];

/** Full label map (includes legacy values). */
export const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  summer_27: "Summer 2027",
  school_year_26_27: "School Year 2026-2027",
  school_year_27_28: "School Year 2027-2028",
  both: "Summer 2026 + School Year 2026-2027",
  summer_27_school_year_27_28: "Summer 2027 + School Year 2027-2028",
  homeschool_drop_in: "Homeschool Drop-In",
};

type Option<T extends string> = { value: T; label: string };

/**
 * Appends `current` (e.g. a legacy value like `summer_26`) to an option list
 * when it isn't already offered, so saved selections aren't silently lost.
 */
export function withCurrentOption<T extends string>(
  options: Option<T>[],
  current: string | null | undefined,
): Option<T | string>[] {
  if (!current || options.some((o) => o.value === current)) return options;
  const label = PROGRAM_LABELS[current];
  return label ? [...options, { value: current, label }] : options;
}

const COMPONENTS: Record<
  FeeComponent,
  {
    cents: number;
    /** Stripe line item / UI fee name */
    feeName: string;
    /** Stripe line item description */
    description: string;
    /** Label used in combined program labels */
    label: string;
    shortLabel: string;
    /** Whether this is a school-year (vs summer) component */
    isSchoolYear: boolean;
  }
> = {
  summer_26: {
    cents: SUMMER_FEE_CENTS,
    feeName: "Summer 2026 Registration Fee",
    description: "Sage Field Private School — Summer 2026 program registration",
    label: "Summer 2026",
    shortLabel: "Summer '26",
    isSchoolYear: false,
  },
  summer_27: {
    cents: SUMMER_FEE_CENTS,
    feeName: "Summer 2027 Registration Fee",
    description: "Sage Field Private School — Summer 2027 program registration",
    label: "Summer 2027",
    shortLabel: "Summer '27",
    isSchoolYear: false,
  },
  school_year_26_27: {
    cents: SCHOOL_YEAR_FEE_CENTS,
    feeName: "School Year 2026–27 Registration Fee",
    description: "Sage Field Private School — 2026–27 school year registration",
    label: "School Year 2026–27",
    shortLabel: "School Yr '26–'27",
    isSchoolYear: true,
  },
  school_year_27_28: {
    cents: SCHOOL_YEAR_FEE_CENTS,
    feeName: "School Year 2027–28 Registration Fee",
    description: "Sage Field Private School — 2027–28 school year registration",
    label: "School Year 2027–28",
    shortLabel: "School Yr '27–'28",
    isSchoolYear: true,
  },
};

const BILLING_COMPONENTS: Record<string, FeeComponent[]> = {
  summer_26: ["summer_26"],
  summer_27: ["summer_27"],
  school_year_26_27: ["school_year_26_27"],
  school_year_27_28: ["school_year_27_28"],
  both: ["summer_26", "school_year_26_27"],
  [SUMMER_27_SY_27_28]: ["summer_27", "school_year_27_28"],
};

/** Legacy fallback for rows with no/unknown program (same $75 as before). */
const FALLBACK_BILLING = "summer_26";

/** Resolves the value that determines billing (drop-in rows bill by drop-in program). */
export function getBillingProgram(
  program: string | null | undefined,
  dropInProgram?: string | null,
): string {
  const raw =
    program === "homeschool_drop_in" ? (dropInProgram ?? FALLBACK_BILLING) : program;
  return raw && BILLING_COMPONENTS[raw] ? raw : FALLBACK_BILLING;
}

export function getFeeComponents(
  program: string | null | undefined,
  dropInProgram?: string | null,
): FeeComponent[] {
  return BILLING_COMPONENTS[getBillingProgram(program, dropInProgram)];
}

export type RegistrationFeeLine = {
  component: FeeComponent;
  name: string;
  description: string;
  cents: number;
};

/** One line per program the family owes a registration fee for. */
export function getRegistrationFeeLines(
  program: string | null | undefined,
  dropInProgram?: string | null,
): RegistrationFeeLine[] {
  return getFeeComponents(program, dropInProgram).map((component) => ({
    component,
    name: COMPONENTS[component].feeName,
    description: COMPONENTS[component].description,
    cents: COMPONENTS[component].cents,
  }));
}

export function getRegistrationFeeCents(
  program: string | null | undefined,
  dropInProgram?: string | null,
): number {
  return getRegistrationFeeLines(program, dropInProgram).reduce(
    (sum, l) => sum + l.cents,
    0,
  );
}

/** Long label, e.g. "School Year 2026–27 + Summer 2027". */
export function getBillingProgramLabel(
  program: string | null | undefined,
  dropInProgram?: string | null,
): string {
  return getFeeComponents(program, dropInProgram)
    .map((c) => COMPONENTS[c].label)
    .join(" + ");
}

/** Label for the program on an application, prefixing drop-in rows. */
export function getProgramLineLabel(
  program: string | null | undefined,
  dropInProgram?: string | null,
): string {
  const base = getBillingProgramLabel(program, dropInProgram);
  return program === "homeschool_drop_in" ? `Homeschool Drop-In — ${base}` : base;
}

/** Compact label for badges, e.g. "Summer '27". */
export function getShortProgramLabel(
  program: string | null | undefined,
  dropInProgram?: string | null,
): string {
  return getFeeComponents(program, dropInProgram)
    .map((c) => COMPONENTS[c].shortLabel)
    .join(" + ");
}

export function includesSchoolYear26_27(
  program: string | null | undefined,
  dropInProgram?: string | null,
): boolean {
  return getFeeComponents(program, dropInProgram).includes("school_year_26_27");
}

export function isValidProgram(value: string): value is ProgramValue {
  return value === "homeschool_drop_in" || value in BILLING_COMPONENTS;
}

export function isValidDropInProgram(value: string): value is DropInProgramValue {
  return value in BILLING_COMPONENTS && value !== "school_year_27_28";
}

/** Tuple of all valid program values, for zod enums. */
export const ALL_PROGRAM_VALUES = [
  "summer_26",
  "summer_27",
  "school_year_26_27",
  "school_year_27_28",
  "both",
  SUMMER_27_SY_27_28,
  "homeschool_drop_in",
] as const;

/** Tuple of all valid drop-in program values, for zod enums. */
export const ALL_DROP_IN_PROGRAM_VALUES = [
  "summer_26",
  "summer_27",
  "school_year_26_27",
  "both",
  SUMMER_27_SY_27_28,
] as const;
