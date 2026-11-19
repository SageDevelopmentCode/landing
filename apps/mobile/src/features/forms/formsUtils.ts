// Shared helpers for the parent Forms & Docs viewers (read-only).
import { supabase } from "@/lib/supabase";

export type Result = { ok: boolean; error?: string };

export interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

/** Thrown by loaders when a detail link is missing its params. */
export class MissingParamsError extends Error {
  constructor() {
    super("missing-params");
    this.name = "MissingParamsError";
  }
}

/** Throw a Supabase/PostgREST/storage error so useFormDetail can report it. */
export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

/**
 * Signature rows for one contract, scoped to this parent + student and
 * ordered by section. Errors are thrown (never silently ignored).
 */
export async function fetchSignatures(
  studentId: string,
  parentId: string,
  contractId: number,
): Promise<SignatureRow[]> {
  const res = await supabase
    .schema("parent_app")
    .from("enrollment_signatures")
    .select("id, section_id, printed_name, signed_at")
    .eq("student_id", studentId)
    .eq("parent_id", parentId)
    .eq("contract_id", contractId)
    .order("section_id", { ascending: true });
  return (unwrap(res) ?? []) as SignatureRow[];
}

/** Map of section_id → signature (later rows win, matching the old behaviour). */
export function bySection(sigs: SignatureRow[]): Record<number, SignatureRow> {
  const map: Record<number, SignatureRow> = {};
  for (const s of sigs) map[s.section_id] = s;
  return map;
}

const LONG_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

/**
 * A timestamp (e.g. `signed_at`, `created_at`) → "March 4, 2026".
 * Returns "—" for empty values and the raw text if it can't be parsed.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", LONG_DATE);
}

/**
 * A date-only value (`YYYY-MM-DD`) → "March 4, 2026", parsed as a LOCAL date
 * so it never shifts a day in US time zones. Free text that isn't a date is
 * shown as typed instead of "Invalid Date".
 */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString("en-US", LONG_DATE);
  }
  // US-style text dates from the web forms ("07/14/2026").
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const d = new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
    if (d.getMonth() === Number(us[1]) - 1) return d.toLocaleDateString("en-US", LONG_DATE);
  }
  // A full timestamp: format it normally.
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return formatDateTime(trimmed);
  return trimmed;
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatProgram(program: string): string {
  // summer_26 → Summer '26
  const summer = program.match(/^summer[_\s](\d+)$/i);
  if (summer) return `Summer '${summer[1]}`;

  // school_year_26_27 → School Year '26-'27
  const schoolYear = program.match(/^school[_\s]year[_\s](\d+)[_\s](\d+)$/i);
  if (schoolYear) return `School Year '${schoolYear[1]}-'${schoolYear[2]}`;

  // both → Both
  if (program.toLowerCase() === "both") return "Both";

  // fallback: replace underscores and title-case
  return program.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "•••• 4567" — keeps the last four characters of an ID number. */
export function maskId(value: string): string {
  const clean = value.trim();
  if (clean.length <= 4) return "••••";
  return `•••• ${clean.slice(-4)}`;
}

/** Storage list entries that are real files (not folders or placeholders). */
export function isRealStorageFile(f: { name: string; id?: string | null }): boolean {
  if (!f.name || f.name === ".emptyFolderPlaceholder") return false;
  // Folders come back from storage.list() with a null id.
  return f.id != null;
}
