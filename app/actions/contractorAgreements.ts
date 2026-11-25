"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { assertSuperAdmin } from "@/app/lib/assertSuperAdmin";
import {
  sendDiscordNotification,
  createErrorEmbed,
  createContractorAgreementSignedEmbed,
  createContractorAgreementCountersignedEmbed,
} from "@/app/lib/discord";
import {
  agreementTermsSchema,
  countersignSchema,
  isOpenForSigning,
  submissionSchema,
  type AgreementTermsInput,
  type ContractorAgreement,
  type CountersignInput,
  type SubmissionInput,
} from "@/app/lib/contractor-agreement/types";
import { CURRENT_TEMPLATE_VERSION, formatDate, formatRate, formatRole, getTemplate, signedSectionIds } from "@/app/lib/contractor-agreement/content";
import { adminAgreementUrl, agreementsTable, getAgreementById, getAgreementByToken } from "@/app/lib/contractor-agreement/queries";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const employeeWebhook = () => process.env.DISCORD_EMPLOYEE_WEBHOOK_URL;
const firstIssue = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Please check the form.";
const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

async function currentUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function reportError(context: string, error: unknown, details?: Record<string, string>) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
  console.error(context, message);
  void sendDiscordNotification(createErrorEmbed({ context, error: message, details })).catch(() => {});
}

// ─── Public: teacher submits via private link ────────────────────────────────

export async function submitContractorAgreement(input: SubmissionInput): Promise<Result<{ signedAt: string }>> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const v = parsed.data;

  const agreement = await getAgreementByToken(v.token);
  if (!agreement) return { ok: false, error: "This agreement link isn't valid." };
  if (agreement.status === "voided") return { ok: false, error: "This agreement link is no longer active." };
  if (!isOpenForSigning(agreement.status)) return { ok: false, error: "This agreement has already been signed." };

  const template = getTemplate(agreement.template_version);
  const finalName = normalizeName(v.final_printed_name);
  if (normalizeName(v.final_signature) !== finalName) {
    return { ok: false, error: "Your signature must match your printed name." };
  }
  for (const id of signedSectionIds(template)) {
    const sig = v.section_signatures[String(id)];
    if (!sig) return { ok: false, error: `Please sign Section ${id}.` };
    if (normalizeName(sig.printed_name) !== finalName || normalizeName(sig.signature) !== finalName) {
      return { ok: false, error: `Section ${id} was signed with a different name. Please re-sign it.` };
    }
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || null;
  const ua = h.get("user-agent")?.slice(0, 500) ?? null;
  const now = new Date().toISOString();

  // Keep only the template's sections, so stray keys can't be stored.
  const sectionSignatures = Object.fromEntries(
    signedSectionIds(template).map((id) => [String(id), v.section_signatures[String(id)]]),
  );

  const { data, error } = await agreementsTable()
    .update({
      contractor_address: v.contractor_address,
      contractor_phone: v.contractor_phone,
      signer_email: v.signer_email,
      section_signatures: sectionSignatures,
      signed_printed_name: v.final_printed_name.trim(),
      signed_signature: v.final_signature.trim(),
      signed_at: now,
      esign_consent_at: now,
      signer_ip: ip,
      signer_user_agent: ua,
      status: "signed",
    })
    .eq("id", agreement.id)
    .in("status", ["sent", "viewed"])
    .select("id")
    .maybeSingle();

  if (error) {
    reportError("submitContractorAgreement", error, { agreement: agreement.id });
    return { ok: false, error: "We couldn't save your signature. Please try again." };
  }
  if (!data) return { ok: false, error: "This agreement has already been signed." };

  await sendDiscordNotification(
    createContractorAgreementSignedEmbed({
      teacherName: v.final_printed_name.trim(),
      email: v.signer_email,
      phone: v.contractor_phone,
      role: formatRole(agreement),
      startDate: formatDate(agreement.start_date),
      rate: formatRate(agreement),
      signedAt: new Date(now).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) + " CT",
      adminUrl: adminAgreementUrl(agreement.id),
    }),
    employeeWebhook(),
  ).catch(() => false);

  revalidatePath("/admin/contractor-agreements");
  return { ok: true, data: { signedAt: now } };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function createContractorAgreement(input: AgreementTermsInput): Promise<Result<ContractorAgreement>> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return auth;
  const parsed = agreementTermsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { data, error } = await agreementsTable()
    .insert({
      ...parsed.data,
      token: randomBytes(24).toString("base64url"),
      template_version: CURRENT_TEMPLATE_VERSION,
      status: "sent",
      created_by: await currentUserId(),
    })
    .select("*")
    .single();
  if (error || !data) {
    reportError("createContractorAgreement", error);
    return { ok: false, error: error?.message ?? "Couldn't create the agreement." };
  }
  revalidatePath("/admin/contractor-agreements");
  return { ok: true, data: data as ContractorAgreement };
}

export async function updateContractorAgreementTerms(id: string, input: AgreementTermsInput): Promise<Result<ContractorAgreement>> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return auth;
  const parsed = agreementTermsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { data, error } = await agreementsTable()
    .update(parsed.data)
    .eq("id", id)
    .in("status", ["draft", "sent", "viewed"])
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Signed or voided agreements can't be edited. Void it and create a new one." };
  revalidatePath("/admin/contractor-agreements");
  return { ok: true, data: data as ContractorAgreement };
}

export async function voidContractorAgreement(id: string): Promise<Result<ContractorAgreement>> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return auth;
  const { data, error } = await agreementsTable()
    .update({ status: "voided", voided_at: new Date().toISOString() })
    .eq("id", id)
    .neq("status", "voided")
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Agreement not found or already voided." };
  revalidatePath("/admin/contractor-agreements");
  return { ok: true, data: data as ContractorAgreement };
}

/** Soft delete — only for agreements nobody has signed. */
export async function deleteContractorAgreement(id: string): Promise<Result> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return auth;
  const { data, error } = await agreementsTable()
    .update({ is_deleted: true })
    .eq("id", id)
    .in("status", ["draft", "sent", "viewed", "voided"])
    .is("signed_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Signed agreements can't be deleted." };
  revalidatePath("/admin/contractor-agreements");
  return { ok: true, data: undefined };
}

export async function countersignContractorAgreement(input: CountersignInput): Promise<Result<ContractorAgreement>> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return auth;
  const parsed = countersignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const v = parsed.data;
  if (normalizeName(v.signature) !== normalizeName(v.name)) {
    return { ok: false, error: "The signature must match the printed name." };
  }

  const { data, error } = await agreementsTable()
    .update({
      school_signer_name: v.name,
      school_signer_title: v.title,
      school_signature: v.signature,
      countersigned_at: new Date().toISOString(),
      countersigned_by: await currentUserId(),
      status: "countersigned",
    })
    .eq("id", v.id)
    .eq("status", "signed")
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Only agreements the teacher has signed can be countersigned." };

  const a = data as ContractorAgreement;
  await sendDiscordNotification(
    createContractorAgreementCountersignedEmbed({
      teacherName: a.signed_printed_name ?? a.contractor_name,
      role: formatRole(a),
      schoolSigner: `${v.name}, ${v.title}`,
      adminUrl: adminAgreementUrl(a.id),
    }),
    employeeWebhook(),
  ).catch(() => false);

  revalidatePath("/admin/contractor-agreements");
  return { ok: true, data: a };
}

export async function getContractorAgreementForAdmin(id: string): Promise<Result<ContractorAgreement>> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return auth;
  const a = await getAgreementById(id);
  return a ? { ok: true, data: a } : { ok: false, error: "Not found" };
}
