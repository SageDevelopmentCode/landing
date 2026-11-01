"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/app/lib/supabase-server";
import type {
  ActionResult,
  BudgetItemPatch,
  ProjectSettingsPatch,
  TimelinePhasePatch,
} from "./types";

const PAGE_PATH = "/admin/new-property";

const usd = z.number().finite().nonnegative().max(100_000_000);
const week = z.number().int().min(1).max(260);
const optionalText = z.string().max(5000).nullable();

const budgetItemPatchSchema = z
  .object({
    category: z.string().trim().min(1).max(100),
    scope: z.string().trim().min(1).max(500),
    favorableUsd: usd,
    workingUsd: usd,
    difficultUsd: usd,
    priorityCode: z.enum(["A", "B", "C", "D"]),
    startWeek: week,
    endWeek: week,
    activities: optionalText,
    completionGate: optionalText,
    dependencies: optionalText,
    exclusions: optionalText,
    notes: optionalText,
    deferralRule: optionalText,
    status: z.enum(["not_started", "in_progress", "done", "deferred"]),
    actualSpentUsd: usd,
    includedInBudget: z.boolean(),
  })
  .partial()
  .strict();

const timelinePhasePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    startWeek: week,
    endWeek: week,
    activities: optionalText,
    completionGate: optionalText,
    dependencies: optionalText,
  })
  .partial()
  .strict();

const projectSettingsPatchSchema = z
  .object({
    projectStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .partial()
  .strict();

const idSchema = z.string().uuid();

const COLUMN_MAP: Record<string, string> = {
  category: "category",
  scope: "scope",
  favorableUsd: "favorable_usd",
  workingUsd: "working_usd",
  difficultUsd: "difficult_usd",
  priorityCode: "priority_code",
  startWeek: "start_week",
  endWeek: "end_week",
  activities: "activities",
  completionGate: "completion_gate",
  dependencies: "dependencies",
  exclusions: "exclusions",
  notes: "notes",
  deferralRule: "deferral_rule",
  status: "status",
  actualSpentUsd: "actual_spent_usd",
  includedInBudget: "included_in_budget",
  name: "name",
  projectStartDate: "project_start_date",
};

function toColumns(patch: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    row[COLUMN_MAP[key]] =
      typeof value === "string" && value.trim() === "" ? null : value;
  }
  return row;
}

async function requireSuperAdmin(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Not signed in";

  const { data: adminUser } = await supabase
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return adminUser?.role === "super_admin" ? null : "Not authorized";
}

function weeksInvalid(patch: { startWeek?: number; endWeek?: number }) {
  return (
    patch.startWeek !== undefined &&
    patch.endWeek !== undefined &&
    patch.endWeek < patch.startWeek
  );
}

export async function updatePropertyBudgetItem(
  id: string,
  patch: BudgetItemPatch,
): Promise<ActionResult> {
  const authError = await requireSuperAdmin();
  if (authError) return { ok: false, error: authError };

  const parsedId = idSchema.safeParse(id);
  const parsed = budgetItemPatchSchema.safeParse(patch);
  if (!parsedId.success || !parsed.success) {
    return { ok: false, error: "Invalid values" };
  }
  if (weeksInvalid(parsed.data)) {
    return { ok: false, error: "End week must be on or after start week" };
  }

  const { error } = await createAdminClient()
    .schema("admin")
    .from("property_budget_items")
    .update({ ...toColumns(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", parsedId.data);

  if (error) return { ok: false, error: error.message };
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function updatePropertyTimelinePhase(
  id: string,
  patch: TimelinePhasePatch,
): Promise<ActionResult> {
  const authError = await requireSuperAdmin();
  if (authError) return { ok: false, error: authError };

  const parsedId = idSchema.safeParse(id);
  const parsed = timelinePhasePatchSchema.safeParse(patch);
  if (!parsedId.success || !parsed.success) {
    return { ok: false, error: "Invalid values" };
  }
  if (weeksInvalid(parsed.data)) {
    return { ok: false, error: "End week must be on or after start week" };
  }

  const { error } = await createAdminClient()
    .schema("admin")
    .from("property_timeline_phases")
    .update({ ...toColumns(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", parsedId.data);

  if (error) return { ok: false, error: error.message };
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function updatePropertyProjectSettings(
  patch: ProjectSettingsPatch,
): Promise<ActionResult> {
  const authError = await requireSuperAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = projectSettingsPatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "Invalid values" };

  const { error } = await createAdminClient()
    .schema("admin")
    .from("property_project_settings")
    .upsert({
      id: true,
      ...toColumns(parsed.data),
      updated_at: new Date().toISOString(),
    });

  if (error) return { ok: false, error: error.message };
  revalidatePath(PAGE_PATH);
  return { ok: true };
}
