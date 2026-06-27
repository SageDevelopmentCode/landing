import { createAdminClient } from "@/app/lib/supabase-server";
import { cssColors as colors } from "../../design-system";
import { TuitionCodesClient } from "./TuitionCodesClient";

export type TuitionCode = {
  id: string;
  code: string;
  label: string;
  amount_cents: number;
  parent_id: string | null;
  parent_name: string | null;
  parent_email: string | null;
  active: boolean;
  created_at: string;
};

export type ParentOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export default async function TuitionCodesPage() {
  const client = createAdminClient();

  const [{ data: codesData }, { data: parentsData }] = await Promise.all([
    client
      .schema("billing")
      .from("tuition_codes")
      .select("*")
      .order("created_at", { ascending: false }),
    client
      .schema("admin")
      .from("users")
      .select("id, full_name, email")
      .order("full_name", { ascending: true }),
  ]);

  const parentIds = [...new Set((codesData ?? []).map((r: { parent_id: string | null }) => r.parent_id).filter(Boolean))] as string[];
  const parentMap: Record<string, { full_name: string | null; email: string | null }> = {};
  for (const p of parentsData ?? []) {
    if (p.id) parentMap[p.id] = { full_name: p.full_name ?? null, email: p.email ?? null };
  }
  void parentIds;

  const codes: TuitionCode[] = (codesData ?? []).map((row: {
    id: string;
    code: string;
    label: string;
    amount_cents: number;
    parent_id: string | null;
    active: boolean;
    created_at: string;
  }) => ({
    id: row.id,
    code: row.code,
    label: row.label,
    amount_cents: row.amount_cents,
    parent_id: row.parent_id ?? null,
    parent_name: row.parent_id ? (parentMap[row.parent_id]?.full_name ?? null) : null,
    parent_email: row.parent_id ? (parentMap[row.parent_id]?.email ?? null) : null,
    active: row.active,
    created_at: row.created_at,
  }));

  const parents: ParentOption[] = (parentsData ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => ({
    id: p.id,
    full_name: p.full_name ?? null,
    email: p.email ?? null,
  }));

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div
        className="px-6 pt-6 pb-2"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          Tuition Codes
        </h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
          Create and manage custom tuition codes for parents.
        </p>
      </div>
      <div className="p-6">
        <TuitionCodesClient initialCodes={codes} parents={parents} />
      </div>
    </div>
  );
}
