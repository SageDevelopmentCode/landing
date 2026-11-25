/**
 * Server-only reads for contractor agreements (service-role client).
 * Used by server components; mutations live in app/actions/contractorAgreements.ts.
 */
import { createAdminClient } from "@/app/lib/supabase-server";
import type { ContractorAgreement, PublicAgreement } from "./types";

const TABLE = "contractor_agreements";

export const agreementsTable = () => createAdminClient().schema("teachers").from(TABLE);

export function toPublic(a: ContractorAgreement): PublicAgreement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signer_ip, signer_user_agent, created_by, countersigned_by, is_deleted, ...rest } = a;
  return rest;
}

export async function getAgreementByToken(token: string): Promise<ContractorAgreement | null> {
  if (!token || token.length < 16 || token.length > 128) return null;
  const { data } = await agreementsTable().select("*").eq("token", token).eq("is_deleted", false).maybeSingle();
  return (data as ContractorAgreement | null) ?? null;
}

/** First open of a sent link marks it viewed. */
export async function markAgreementViewed(id: string): Promise<void> {
  await agreementsTable()
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "sent");
}

export async function getAgreementById(id: string): Promise<ContractorAgreement | null> {
  const { data } = await agreementsTable().select("*").eq("id", id).eq("is_deleted", false).maybeSingle();
  return (data as ContractorAgreement | null) ?? null;
}

export async function listAgreements(): Promise<ContractorAgreement[]> {
  const { data } = await agreementsTable()
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  return (data as ContractorAgreement[] | null) ?? [];
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://sagefield.co").replace(/\/$/, "");
export const adminAgreementUrl = (id: string) => `${siteUrl()}/admin/contractor-agreements?id=${id}`;
export const publicAgreementPath = (token: string) => `/agreement/${token}`;
