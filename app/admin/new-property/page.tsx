import { createAdminClient } from "@/app/lib/supabase-server";
import { NEW_CAMPUS_LOCATION } from "@/app/lib/geocode";
import { PropertyBudgetClient } from "./PropertyBudgetClient";
import type {
  BudgetItem,
  ItemStatus,
  PriorityCode,
  ProjectSettings,
  TimelinePhase,
} from "./types";

type BudgetItemRow = {
  id: string;
  code: string;
  category: string;
  scope: string;
  favorable_usd: number | string;
  working_usd: number | string;
  difficult_usd: number | string;
  priority_code: PriorityCode;
  start_week: number;
  end_week: number;
  activities: string | null;
  completion_gate: string | null;
  dependencies: string | null;
  exclusions: string | null;
  notes: string | null;
  deferral_rule: string | null;
  status: ItemStatus;
  actual_spent_usd: number | string;
  included_in_budget?: boolean;
  sort_order: number;
};

type TimelinePhaseRow = {
  id: string;
  code: string;
  name: string;
  start_week: number;
  end_week: number;
  activities: string | null;
  completion_gate: string | null;
  dependencies: string | null;
  sort_order: number;
};

type SettingsRow = {
  project_start_date: string;
  contingency_favorable: number | string;
  contingency_working: number | string;
  contingency_difficult: number | string;
  repair_reserve_low_usd: number | string;
  repair_reserve_high_usd: number | string;
  assumptions: string | null;
  exclusions: string | null;
};

const DEFAULT_SETTINGS: ProjectSettings = {
  projectStartDate: "2026-12-15",
  contingency: { favorable: 0.15, working: 0.2, difficult: 0.2 },
  repairReserveLowUsd: 15000,
  repairReserveHighUsd: 25000,
  assumptions: null,
  exclusions: null,
};

function mapItem(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    scope: row.scope,
    favorableUsd: Number(row.favorable_usd),
    workingUsd: Number(row.working_usd),
    difficultUsd: Number(row.difficult_usd),
    priorityCode: row.priority_code,
    startWeek: row.start_week,
    endWeek: row.end_week,
    activities: row.activities,
    completionGate: row.completion_gate,
    dependencies: row.dependencies,
    exclusions: row.exclusions,
    notes: row.notes,
    deferralRule: row.deferral_rule,
    status: row.status,
    actualSpentUsd: Number(row.actual_spent_usd),
    includedInBudget: row.included_in_budget ?? true,
    sortOrder: row.sort_order,
  };
}

function mapPhase(row: TimelinePhaseRow): TimelinePhase {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    startWeek: row.start_week,
    endWeek: row.end_week,
    activities: row.activities,
    completionGate: row.completion_gate,
    dependencies: row.dependencies,
    sortOrder: row.sort_order,
  };
}

function mapSettings(row: SettingsRow | null): ProjectSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    projectStartDate: row.project_start_date,
    contingency: {
      favorable: Number(row.contingency_favorable),
      working: Number(row.contingency_working),
      difficult: Number(row.contingency_difficult),
    },
    repairReserveLowUsd: Number(row.repair_reserve_low_usd),
    repairReserveHighUsd: Number(row.repair_reserve_high_usd),
    assumptions: row.assumptions,
    exclusions: row.exclusions,
  };
}

export default async function NewPropertyPage() {
  const db = createAdminClient().schema("admin");

  const [itemsRes, phasesRes, settingsRes] = await Promise.all([
    db.from("property_budget_items").select("*").order("sort_order"),
    db.from("property_timeline_phases").select("*").order("sort_order"),
    db.from("property_project_settings").select("*").maybeSingle(),
  ]);

  const loadError =
    itemsRes.error?.message ??
    phasesRes.error?.message ??
    settingsRes.error?.message ??
    null;

  return (
    <div className="pt-6 pb-16">
      {loadError ? (
        <div
          className="max-w-xl mt-8 p-6 rounded-xl text-sm"
          style={{
            backgroundColor: "var(--admin-warning-bg)",
            border: "1px solid var(--admin-warning-border)",
            color: "var(--admin-text-primary)",
          }}
        >
          <p className="font-semibold mb-1">Property budget tables not found</p>
          <p style={{ color: "var(--admin-text-secondary)" }}>
            Run{" "}
            <code>supabase/migrations/20261101100000_property_budget.sql</code>{" "}
            in the Supabase SQL editor, then reload this page.
          </p>
          <p
            className="mt-3 text-xs"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            {loadError}
          </p>
        </div>
      ) : (
        <PropertyBudgetClient
          address={NEW_CAMPUS_LOCATION.address}
          initialItems={(itemsRes.data as BudgetItemRow[]).map(mapItem)}
          initialPhases={(phasesRes.data as TimelinePhaseRow[]).map(mapPhase)}
          initialSettings={mapSettings(settingsRes.data as SettingsRow | null)}
        />
      )}
    </div>
  );
}
