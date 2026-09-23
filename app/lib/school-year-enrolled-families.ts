import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAddress } from "@/app/lib/application-display";
import {
  hasDontIncludeTag,
  isSchoolYearApp,
} from "@/app/lib/school-year-program";

export type NormalizedAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type EnrolledFamilyStudent = {
  studentId: string;
  applicationId: string;
  name: string;
  grade: string | null;
};

export type EnrolledFamily = {
  parentId: string;
  parentName: string | null;
  parentEmail: string | null;
  students: EnrolledFamilyStudent[];
  address: NormalizedAddress | null;
  formattedAddress: string;
  addressKey: string | null;
};

type ApplicationRow = {
  id: string;
  user_id: string;
  student_id: string;
  child_legal_name: string | null;
  child_grade: string | null;
  program: string | null;
  drop_in_program: string | null;
  admin_tags: string[] | null;
  g1_full_name: string | null;
  g1_email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
};

const STATE_NAME_TO_CODE: Record<string, string> = {
  texas: "TX",
  tx: "TX",
};

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
]);

function titleCaseCity(city: string): string {
  return city
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeStreet(street: string): string {
  return street.replace(/\s+/g, " ").trim();
}

/** Strip unit/apt suffix for geocoding attempts; display keeps the original street. */
export function stripUnitFromStreet(street: string): string {
  return normalizeStreet(
    street
      .replace(/\s+(UNIT|APT|APARTMENT|STE|SUITE)\s*[#\w-]+$/i, "")
      .replace(/\s+#\s*[\w-]+$/i, ""),
  );
}

export function normalizeAddress(parts: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): NormalizedAddress | null {
  let street = normalizeStreet(parts.street?.trim() ?? "");
  let city = parts.city?.trim() ?? "";
  let state = parts.state?.trim().toUpperCase() ?? "";
  let zip = parts.zip?.trim() ?? "";

  if (city.includes(",")) {
    const [cityPart, statePart] = city.split(",").map((value) => value.trim());
    city = cityPart;
    if (!state && statePart) {
      state =
        STATE_NAME_TO_CODE[statePart.toLowerCase()] ??
        statePart.slice(0, 2).toUpperCase();
    }
  }

  if (!US_STATE_CODES.has(state)) {
    state = "TX";
  }

  city = titleCaseCity(city);

  if (!street || !city || !zip) {
    return null;
  }

  return { street, city, state, zip };
}

export function addressCacheKey(address: NormalizedAddress): string {
  return formatAddress(address).toLowerCase();
}

function pickBetterAddress(
  current: NormalizedAddress | null,
  candidate: NormalizedAddress | null,
): NormalizedAddress | null {
  if (!candidate) return current;
  if (!current) return candidate;

  const currentScore =
    current.street.length +
    current.city.length +
    current.state.length +
    current.zip.length;
  const candidateScore =
    candidate.street.length +
    candidate.city.length +
    candidate.state.length +
    candidate.zip.length;

  return candidateScore >= currentScore ? candidate : current;
}

export async function fetchSchoolYearEnrolledFamilies(
  db: SupabaseClient,
): Promise<EnrolledFamily[]> {
  const [appsRes, supplyFeeRes] = await Promise.all([
    db
      .schema("parent_app")
      .from("applications")
      .select(
        "id, user_id, student_id, child_legal_name, child_grade, program, drop_in_program, admin_tags, g1_full_name, g1_email, address_street, address_city, address_state, address_zip",
      )
      .eq("status", "enrolled"),
    db
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id")
      .eq("payment_type", "supply_fee")
      .eq("status", "completed")
      .eq("is_deleted", false)
      .not("student_id", "is", null),
  ]);

  if (appsRes.error) throw new Error(appsRes.error.message);
  if (supplyFeeRes.error) throw new Error(supplyFeeRes.error.message);

  const supplyFeePaidIds = new Set(
    ((supplyFeeRes.data ?? []) as { student_id: string }[]).map(
      (row) => row.student_id,
    ),
  );

  const eligibleApps = ((appsRes.data ?? []) as ApplicationRow[]).filter(
    (app) =>
      isSchoolYearApp(app) &&
      !hasDontIncludeTag(app.admin_tags) &&
      supplyFeePaidIds.has(app.student_id),
  );

  const familiesByParent = new Map<string, EnrolledFamily>();

  for (const app of eligibleApps) {
    const normalized = normalizeAddress({
      street: app.address_street,
      city: app.address_city,
      state: app.address_state,
      zip: app.address_zip,
    });

    const existing = familiesByParent.get(app.user_id);
    const student: EnrolledFamilyStudent = {
      studentId: app.student_id,
      applicationId: app.id,
      name: app.child_legal_name?.trim() || "Unknown student",
      grade: app.child_grade,
    };

    if (!existing) {
      familiesByParent.set(app.user_id, {
        parentId: app.user_id,
        parentName: app.g1_full_name,
        parentEmail: app.g1_email,
        students: [student],
        address: normalized,
        formattedAddress: normalized
          ? formatAddress(normalized)
          : formatAddress({
              street: app.address_street,
              city: app.address_city,
              state: app.address_state,
              zip: app.address_zip,
            }),
        addressKey: normalized ? addressCacheKey(normalized) : null,
      });
      continue;
    }

    existing.students.push(student);
    existing.address = pickBetterAddress(existing.address, normalized);
    existing.formattedAddress = existing.address
      ? formatAddress(existing.address)
      : existing.formattedAddress;
    existing.addressKey = existing.address
      ? addressCacheKey(existing.address)
      : existing.addressKey;
  }

  return Array.from(familiesByParent.values()).map((family) => ({
    ...family,
    students: family.students.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
