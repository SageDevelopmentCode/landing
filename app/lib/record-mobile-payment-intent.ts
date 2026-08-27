import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createSummerTuitionEmbed,
  createAftercareTuitionEmbed,
  createFunFridayTuitionEmbed,
  createHomeschoolDropInEmbed,
  createErrorEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  buildSummerTuitionConfirmationEmail,
  buildHomeschoolDropInConfirmationEmail,
  buildAftercareConfirmationEmail,
  buildFunFridayConfirmationEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";
import { notifySchoolYearTuitionPayment } from "@/app/lib/stripe-school-year-tuition-notify";
import type Stripe from "stripe";

export async function recordMobilePaymentIntent(
  intent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createAdminClient>,
  options: { skipNotifications?: boolean } = {},
) {
  const skipNotifications = options.skipNotifications ?? false;
  const metadata = intent.metadata ?? {};
  const parentId = metadata.parent_id ?? null;
  const payerEmail = metadata.parent_email ?? intent.receipt_email ?? null;

// Backfill stripe_customer_id if missing
if (parentId && intent.customer) {
  await supabase
    .schema("admin")
    .from("users")
    .update({ stripe_customer_id: String(intent.customer) })
    .eq("id", parentId)
    .is("stripe_customer_id", null);
}

// Write to billing.stripe_transactions
// stripe_session_id reuses the PaymentIntent ID (satisfies NOT NULL UNIQUE constraint)
const { error: billingError } = await supabase
  .schema("billing")
  .from("stripe_transactions")
  .upsert(
    {
      stripe_session_id: intent.id,
      stripe_payment_intent_id: intent.id,
      payment_type: metadata.payment_type ?? "unknown",
      amount_cents: intent.amount,
      intended_amount_cents: metadata.intended_amount_cents
        ? parseInt(metadata.intended_amount_cents)
        : null,
      currency: intent.currency,
      cover_fees: metadata.cover_fees === "true",
      payer_name: null,
      payer_email: payerEmail,
      description: metadata.description ?? null,
      student_id: metadata.student_id ?? null,
      application_id: metadata.application_id ?? null,
      parent_id: parentId,
      metadata: intent.metadata,
      status: "completed",
      is_deleted: false,
    },
    { onConflict: "stripe_session_id" },
  );

if (billingError) {
  console.error("Failed to record mobile billing transaction:", billingError);
}

if (
  metadata.payment_type === "school_year_tuition" &&
  metadata.sibling_student_ids
) {
  const sibStudentIds = metadata.sibling_student_ids
    .split(",")
    .filter(Boolean);
  const sibMonthsArr = metadata.sibling_selected_months?.split(",") ?? [];
  const sibCents = metadata.sibling_intended_cents?.split(",").map(Number) ?? [];

  for (let i = 0; i < sibStudentIds.length; i++) {
    const selectedMonths = (sibMonthsArr[i] ?? "")
      .replace(/;/g, ",")
      .split(",")
      .filter(Boolean);

    const { error: sibError } = await supabase
      .schema("billing")
      .from("stripe_transactions")
      .upsert(
        {
          stripe_session_id: `${intent.id}_sib_${i}`,
          stripe_payment_intent_id: intent.id,
          payment_type: "school_year_tuition",
          amount_cents: sibCents[i] ?? 0,
          intended_amount_cents: sibCents[i] ?? null,
          currency: intent.currency,
          cover_fees: false,
          payer_email: payerEmail ?? "",
          student_id: sibStudentIds[i],
          parent_id: parentId,
          metadata: {
            payment_type: "school_year_tuition",
            selected_months: selectedMonths.join(","),
            is_sibling_split: "true",
            primary_session_id: intent.id,
          },
          status: "completed",
          is_deleted: false,
        },
        { onConflict: "stripe_session_id" },
      );
    if (sibError) {
      console.error(
        `Failed to record mobile school year tuition sibling[${i}]:`,
        sibError,
      );
    }
  }
}

// Per-payment-type Discord + email notifications
if (!skipNotifications && metadata.payment_type === "summer_tuition") {
  const applicationId = metadata.application_id;
  const studentId = metadata.student_id;
  const planType = (metadata.plan_type ?? "full") as "weekly" | "full";
  const weeksStr = metadata.weeks ?? "";
  const weeks = weeksStr ? weeksStr.split(",").map(Number).filter((n: number) => !isNaN(n)) : [];
  const amountCents = intent.amount;
  const amountDollars = (amountCents / 100).toFixed(2);

  let parentName = "N/A";
  let parentEmailAddr = payerEmail ?? "N/A";
  let childName = "N/A";

  if (applicationId) {
    const { data: application } = await supabase
      .schema("parent_app")
      .from("applications")
      .select("g1_full_name, g1_email, child_legal_name")
      .eq("id", applicationId)
      .single();
    if (application) {
      parentName = application.g1_full_name ?? "N/A";
      parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
      childName = application.child_legal_name ?? "N/A";
    }
  }
  if (childName === "N/A" && studentId) {
    const { data: student } = await supabase
      .schema("admin")
      .from("students")
      .select("child_legal_name")
      .eq("id", studentId)
      .single();
    if (student) childName = student.child_legal_name ?? "N/A";
  }

  sendDiscordNotification(
    createSummerTuitionEmbed({ parentName, parentEmail: parentEmailAddr, childName, planType, amountCents, weeks: weeks.length > 0 ? weeks : undefined }),
  ).catch((err) => console.error("Mobile summer tuition Discord notification failed:", err));

  (async () => {
    const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
    let subject: string | undefined;
    try {
      if (!toAddress) return;
      const built = await buildSummerTuitionConfirmationEmail({
        g1FullName: parentName !== "N/A" ? parentName : "Parent",
        childLegalName: childName !== "N/A" ? childName : "your child",
        planType,
        amountDollars,
        weeks: weeks.length > 0 ? weeks : undefined,
      });
      subject = built.subject;
      const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
      if (emailResult.success) {
        await supabase.schema("email_logs").from("sends").insert({
          to_address: toAddress,
          subject: built.subject,
          template: "summer_tuition_confirmation",
          application_id: applicationId ?? null,
          status: "success",
        });
      } else {
        throw new Error(emailResult.error ?? "Unknown email error");
      }
    } catch (err) {
      console.error("Mobile summer tuition confirmation email failed:", err);
      if (toAddress) {
        await supabase.schema("email_logs").from("sends").insert({
          to_address: toAddress,
          subject: subject ?? "summer_tuition_confirmation (failed to build)",
          template: "summer_tuition_confirmation",
          application_id: applicationId ?? null,
          status: "error",
          error_message: String(err).slice(0, 500),
        }).then(undefined, () => {});
      }
      sendDiscordNotification(createErrorEmbed({ context: "Mobile summer tuition confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
    }
  })();
} else if (!skipNotifications && metadata.payment_type === "aftercare_tuition") {
  const applicationId = metadata.application_id;
  const studentId = metadata.student_id;
  const planType = (metadata.plan_type ?? "monthly") as "monthly" | "daily";
  const selectedMonths = metadata.selected_months ? metadata.selected_months.split(",").filter(Boolean) : [];
  const selectedDays = metadata.selected_days ? metadata.selected_days.split(",").filter(Boolean) : [];
  const amountCents = intent.amount;
  const amountDollars = (amountCents / 100).toFixed(2);

  let parentName = "N/A";
  let parentEmailAddr = payerEmail ?? "N/A";
  let childName = "N/A";

  if (applicationId) {
    const { data: application } = await supabase
      .schema("parent_app")
      .from("applications")
      .select("g1_full_name, g1_email, child_legal_name")
      .eq("id", applicationId)
      .single();
    if (application) {
      parentName = application.g1_full_name ?? "N/A";
      parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
      childName = application.child_legal_name ?? "N/A";
    }
  } else if (studentId) {
    const { data: student } = await supabase.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single();
    if (student) childName = student.child_legal_name ?? "N/A";
  }

  sendDiscordNotification(
    createAftercareTuitionEmbed({ parentName, parentEmail: parentEmailAddr, childName, planType, amountCents, selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined, selectedDays: selectedDays.length > 0 ? selectedDays : undefined }),
  ).catch((err) => console.error("Mobile aftercare Discord notification failed:", err));

  (async () => {
    const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
    let subject: string | undefined;
    try {
      if (!toAddress) return;
      const built = await buildAftercareConfirmationEmail({
        g1FullName: parentName !== "N/A" ? parentName : "Parent",
        childLegalName: childName !== "N/A" ? childName : "your child",
        planType,
        selectedMonths,
        selectedDays,
        amountDollars,
      });
      subject = built.subject;
      const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
      if (emailResult.success) {
        await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: built.subject, template: "aftercare_tuition_confirmation", application_id: applicationId ?? null, status: "success" });
      } else {
        throw new Error(emailResult.error ?? "Unknown email error");
      }
    } catch (err) {
      console.error("Mobile aftercare confirmation email failed:", err);
      if (toAddress) {
        await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: subject ?? "aftercare_tuition_confirmation (failed to build)", template: "aftercare_tuition_confirmation", application_id: applicationId ?? null, status: "error", error_message: String(err).slice(0, 500) }).then(undefined, () => {});
      }
      sendDiscordNotification(createErrorEmbed({ context: "Mobile aftercare confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
    }
  })();
} else if (!skipNotifications && metadata.payment_type === "homeschool_dropin") {
  const applicationId = metadata.application_id;
  const studentId = metadata.student_id;
  const program = metadata.program ?? "summer_26";
  const tier = metadata.tier ?? "dropin";
  const selectedDays = metadata.selected_days ? metadata.selected_days.split(",").filter(Boolean) : [];
  const selectedWeeks = metadata.selected_weeks ? metadata.selected_weeks.split(",").map(Number).filter(Boolean) : [];
  const amountCents = intent.amount;
  const amountDollars = (amountCents / 100).toFixed(2);

  let parentName = "N/A";
  let parentEmailAddr = payerEmail ?? "N/A";
  let childName = "N/A";

  if (applicationId) {
    const { data: application } = await supabase
      .schema("parent_app")
      .from("applications")
      .select("g1_full_name, g1_email, child_legal_name")
      .eq("id", applicationId)
      .single();
    if (application) {
      parentName = application.g1_full_name ?? "N/A";
      parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
      childName = application.child_legal_name ?? "N/A";
    }
  } else if (studentId) {
    const { data: student } = await supabase.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single();
    if (student) childName = student.child_legal_name ?? "N/A";
  }

  sendDiscordNotification(
    createHomeschoolDropInEmbed({ parentName, parentEmail: parentEmailAddr, childName, program, tier, selectedDays: selectedDays.length > 0 ? selectedDays : undefined, selectedWeeks: selectedWeeks.length > 0 ? selectedWeeks : undefined, amountCents }),
  ).catch((err) => console.error("Mobile homeschool Discord notification failed:", err));

  (async () => {
    const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
    let subject: string | undefined;
    try {
      if (!toAddress) return;
      const built = await buildHomeschoolDropInConfirmationEmail({
        g1FullName: parentName !== "N/A" ? parentName : "Parent",
        childLegalName: childName !== "N/A" ? childName : "your child",
        program,
        tier,
        selectedDays,
        selectedWeeks,
        amountDollars,
      });
      subject = built.subject;
      const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
      if (emailResult.success) {
        await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: built.subject, template: "homeschool_dropin_confirmation", application_id: applicationId ?? null, status: "success" });
      } else {
        throw new Error(emailResult.error ?? "Unknown email error");
      }
    } catch (err) {
      console.error("Mobile homeschool drop-in confirmation email failed:", err);
      if (toAddress) {
        await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: subject ?? "homeschool_dropin_confirmation (failed to build)", template: "homeschool_dropin_confirmation", application_id: applicationId ?? null, status: "error", error_message: String(err).slice(0, 500) }).then(undefined, () => {});
      }
      sendDiscordNotification(createErrorEmbed({ context: "Mobile homeschool drop-in confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
    }
  })();
} else if (!skipNotifications && metadata.payment_type === "fun_friday_tuition") {
  const applicationId = metadata.application_id;
  const studentId = metadata.student_id;
  const planType = (metadata.plan_type ?? "monthly") as "monthly" | "dropin";
  const selectedMonths = metadata.selected_months ? metadata.selected_months.split(",").filter(Boolean) : [];
  const selectedFridays = metadata.selected_fridays ? metadata.selected_fridays.split(",").filter(Boolean) : [];
  const amountCents = intent.amount;
  const amountDollars = (amountCents / 100).toFixed(2);

  let parentName = "N/A";
  let parentEmailAddr = payerEmail ?? "N/A";
  let childName = "N/A";

  if (applicationId) {
    const { data: application } = await supabase
      .schema("parent_app")
      .from("applications")
      .select("g1_full_name, g1_email, child_legal_name")
      .eq("id", applicationId)
      .single();
    if (application) {
      parentName = application.g1_full_name ?? "N/A";
      parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
      childName = application.child_legal_name ?? "N/A";
    }
  } else if (studentId) {
    const { data: student } = await supabase.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single();
    if (student) childName = student.child_legal_name ?? "N/A";
  }

  sendDiscordNotification(
    createFunFridayTuitionEmbed({ parentName, parentEmail: parentEmailAddr, childName, planType, amountCents, selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined, selectedFridays: selectedFridays.length > 0 ? selectedFridays : undefined }),
  ).catch((err) => console.error("Mobile fun friday Discord notification failed:", err));

  (async () => {
    const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
    let subject: string | undefined;
    try {
      if (!toAddress) return;
      const built = await buildFunFridayConfirmationEmail({
        g1FullName: parentName !== "N/A" ? parentName : "Parent",
        childLegalName: childName !== "N/A" ? childName : "your child",
        planType,
        selectedMonths,
        selectedFridays,
        amountDollars,
      });
      subject = built.subject;
      const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
      if (emailResult.success) {
        await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: built.subject, template: "fun_friday_tuition_confirmation", application_id: applicationId ?? null, status: "success" });
      } else {
        throw new Error(emailResult.error ?? "Unknown email error");
      }
    } catch (err) {
      console.error("Mobile fun friday confirmation email failed:", err);
      if (toAddress) {
        await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: subject ?? "fun_friday_tuition_confirmation (failed to build)", template: "fun_friday_tuition_confirmation", application_id: applicationId ?? null, status: "error", error_message: String(err).slice(0, 500) }).then(undefined, () => {});
      }
      sendDiscordNotification(createErrorEmbed({ context: "Mobile fun friday confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
    }
  })();
} else if (
  !skipNotifications &&
  metadata.payment_type === "school_year_tuition"
) {
  try {
    await notifySchoolYearTuitionPayment({
      supabase,
      parentId,
      studentId: metadata.student_id ?? null,
      parentEmailAddr: payerEmail ?? "N/A",
      amountCents: intent.amount,
      selectedMonthsRaw: metadata.selected_months ?? "",
      source: "mobile",
    });
  } catch (err) {
    console.error("Mobile school year tuition webhook handler error:", err);
    sendDiscordNotification(
      createErrorEmbed({
        context: "Mobile school_year_tuition webhook",
        error: String(err),
        details: {
          parentId: parentId ?? "N/A",
          studentId: metadata.student_id ?? "N/A",
        },
      }),
    ).catch(() => {});
  }
}
}
