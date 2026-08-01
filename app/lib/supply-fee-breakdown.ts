export const SUPPLY_FEE_CENTS = 30000;

export type SupplyFeeBreakdownLine = {
  label: string;
  amountCents: number;
  sublabel?: string;
};

export function parseCsvInts(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

export function parseCsvStrings(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

export function homeschoolTierLabel(tier: string | undefined): string | null {
  if (tier === "dropin") return "Explorer Day Pass";
  if (tier === "2day") return "2 Days / Week";
  if (tier === "3day") return "3 Days / Week";
  return tier ?? null;
}

export function lookupParallelAmount(
  studentId: string,
  idsKey: string,
  amountsKey: string,
  meta: Record<string, string>,
): number {
  const ids = parseCsvStrings(meta[idsKey]);
  const amounts = parseCsvInts(meta[amountsKey]);
  const idx = ids.indexOf(studentId);
  return idx >= 0 ? (amounts[idx] ?? 0) : 0;
}

export function buildSupplyFeeStudentLines(
  meta: Record<string, string>,
  studentId: string,
  isPrimary: boolean,
): SupplyFeeBreakdownLine[] {
  const lines: SupplyFeeBreakdownLine[] = [
    { label: "Annual Supply Fee", amountCents: SUPPLY_FEE_CENTS },
  ];

  const bundleType = meta.bundle_type;
  if (!bundleType) return lines;

  if (isPrimary) {
    const bundleCents = parseInt(meta.bundle_amount_cents ?? "0", 10);
    if (bundleCents > 0) {
      if (bundleType === "school_year_tuition") {
        lines.push({ label: "August 2026 Tuition", amountCents: bundleCents });
      } else if (bundleType === "homeschool") {
        lines.push({
          label: "Homeschool Drop-In — August 2026",
          amountCents: bundleCents,
          sublabel: homeschoolTierLabel(meta.bundle_homeschool_tier) ?? undefined,
        });
      }
    }
  } else if (bundleType === "school_year_tuition") {
    const schoolYearCents = lookupParallelAmount(
      studentId,
      "sibling_bundle_student_ids",
      "sibling_bundle_amounts",
      meta,
    );
    if (schoolYearCents > 0) {
      lines.push({ label: "August 2026 Tuition", amountCents: schoolYearCents });
    }
  } else if (bundleType === "homeschool") {
    const homeschoolCents = lookupParallelAmount(
      studentId,
      "sibling_homeschool_bundle_student_ids",
      "sibling_homeschool_bundle_amounts",
      meta,
    );
    if (homeschoolCents > 0) {
      lines.push({
        label: "Homeschool Drop-In — August 2026",
        amountCents: homeschoolCents,
        sublabel: homeschoolTierLabel(meta.bundle_homeschool_tier) ?? undefined,
      });
    }
  }

  return lines;
}

export function getSupplyFeeCheckoutStudentIds(
  meta: Record<string, string>,
  primaryStudentId: string | null,
): string[] {
  const ids: string[] = [];
  if (primaryStudentId) ids.push(primaryStudentId);
  for (const id of parseCsvStrings(meta.sibling_supply_student_ids)) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Admin sidebar HS label: tier + first selected day + month */
export function homeschoolBundleShortLabel(
  meta: Record<string, string>,
  monthLabels: Record<string, string>,
  dayLabels: Record<string, string>,
): string {
  const tier =
    meta.bundle_homeschool_tier === "dropin"
      ? "1 Day/Wk"
      : meta.bundle_homeschool_tier === "2day"
        ? "2 Days/Wk"
        : meta.bundle_homeschool_tier === "3day"
          ? "3 Days/Wk"
          : meta.bundle_homeschool_tier ?? "Drop-In";
  const monthLabel = monthLabels[meta.bundle_month_index ?? ""] ?? "";
  let dayStr = "";
  try {
    const ws: { week: number; days: string[] }[] = JSON.parse(
      meta.bundle_homeschool_week_selections_json ?? "[]",
    );
    const day = ws[0]?.days?.[0];
    if (day) dayStr = ` · ${dayLabels[day] ?? day}`;
  } catch {
    /* ignore */
  }
  return `HS Drop-In (${tier}${dayStr}) · ${monthLabel}`;
}
