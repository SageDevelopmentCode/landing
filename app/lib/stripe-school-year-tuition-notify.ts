import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createSchoolYearTuitionEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  buildSchoolYearTuitionConfirmationEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function notifySchoolYearTuitionPayment(opts: {
  supabase: ReturnType<typeof createAdminClient>;
  parentId: string | null;
  studentId: string | null;
  parentEmailAddr: string;
  amountCents: number;
  selectedMonthsRaw: string;
  source?: "web" | "mobile";
}) {
  const {
    supabase,
    parentId,
    studentId,
    parentEmailAddr,
    amountCents,
    selectedMonthsRaw,
    source,
  } = opts;

  let parentName = "N/A";
  let childName = "N/A";

  if (parentId) {
    const { data: userRow } = await supabase
      .schema("admin")
      .from("users")
      .select("full_name")
      .eq("id", parentId)
      .single();
    if (userRow) parentName = userRow.full_name ?? "N/A";
  }
  if (studentId) {
    const { data: student } = await supabase
      .schema("admin")
      .from("students")
      .select("child_legal_name")
      .eq("id", studentId)
      .single();
    if (student) childName = student.child_legal_name ?? "N/A";
  }

  const selectedMonthIndices = selectedMonthsRaw
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  await sendDiscordNotification(
    createSchoolYearTuitionEmbed({
      parentName,
      parentEmail: parentEmailAddr,
      childName,
      amountCents,
      selectedMonthIndices,
      source,
    }),
  );

  const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
  let subject: string | undefined;
  try {
    if (!toAddress) return;
    const amountDollars = (amountCents / 100).toFixed(2);
    const built = await buildSchoolYearTuitionConfirmationEmail({
      g1FullName: parentName !== "N/A" ? parentName : "Parent",
      childName: childName !== "N/A" ? childName : "your child",
      amountDollars,
      selectedMonths:
        selectedMonthIndices.length > 0 ? selectedMonthIndices : undefined,
    });
    subject = built.subject;
    const emailResult = await sendZohoEmail({
      toAddress,
      subject: built.subject,
      content: built.content,
    });
    if (emailResult.success) {
      await supabase.schema("email_logs").from("sends").insert({
        to_address: toAddress,
        subject: built.subject,
        template: "school_year_tuition_confirmation",
        application_id: null,
        status: "success",
      });
    }
  } catch (err) {
    console.error("School year tuition confirmation email failed:", err);
    if (toAddress) {
      await supabase.schema("email_logs").from("sends").insert({
        to_address: toAddress,
        subject: subject ?? "school_year_tuition_confirmation (failed to build)",
        template: "school_year_tuition_confirmation",
        application_id: null,
        status: "error",
        error_message: String(err).slice(0, 500),
      });
    }
  }
}
