import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createSummerTuitionEmbed,
  createAftercareTuitionEmbed,
  createFunFridayTuitionEmbed,
  createHomeschoolDropInEmbed,
  createCustomTuitionEmbed,
  createSupplyFeeEmbed,
  createErrorEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  buildSummerTuitionConfirmationEmail,
  buildHomeschoolDropInConfirmationEmail,
  buildAftercareConfirmationEmail,
  buildFunFridayConfirmationEmail,
  buildCustomTuitionConfirmationEmail,
  buildSupplyFeeConfirmationEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";
import { notifySchoolYearTuitionPayment } from "@/app/lib/stripe-school-year-tuition-notify";
import type Stripe from "stripe";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function resolveParentChildNames(
  supabase: SupabaseAdmin,
  opts: {
    applicationId?: string | null;
    studentId?: string | null;
    parentId?: string | null;
    payerEmail?: string | null;
  },
): Promise<{ parentName: string; parentEmailAddr: string; childName: string }> {
  let parentName = "N/A";
  let parentEmailAddr = opts.payerEmail ?? "N/A";
  let childName = "N/A";

  if (opts.applicationId) {
    const { data: application } = await supabase
      .schema("parent_app")
      .from("applications")
      .select("g1_full_name, g1_email, child_legal_name")
      .eq("id", opts.applicationId)
      .single();
    if (application) {
      parentName = application.g1_full_name ?? "N/A";
      parentEmailAddr = application.g1_email ?? opts.payerEmail ?? "N/A";
      childName = application.child_legal_name ?? "N/A";
    }
  } else {
    if (opts.parentId) {
      const { data: userRow } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name, email")
        .eq("id", opts.parentId)
        .single();
      if (userRow) {
        parentName = userRow.full_name ?? "N/A";
        if (parentEmailAddr === "N/A" && userRow.email) {
          parentEmailAddr = userRow.email;
        }
      }
    }
    if (opts.studentId) {
      const { data: student } = await supabase
        .schema("admin")
        .from("students")
        .select("child_legal_name")
        .eq("id", opts.studentId)
        .single();
      if (student) childName = student.child_legal_name ?? "N/A";
    }
  }

  if (childName === "N/A" && opts.studentId && opts.applicationId) {
    const { data: student } = await supabase
      .schema("admin")
      .from("students")
      .select("child_legal_name")
      .eq("id", opts.studentId)
      .single();
    if (student) childName = student.child_legal_name ?? "N/A";
  }

  return { parentName, parentEmailAddr, childName };
}

async function sendConfirmationEmail(opts: {
  supabase: SupabaseAdmin;
  toAddress: string;
  template: string;
  applicationId?: string | null;
  build: () => Promise<{ subject: string; content: string }>;
  errorContext: string;
  errorDetails?: Record<string, string>;
}): Promise<void> {
  if (!opts.toAddress) return;

  let subject: string | undefined;
  try {
    const built = await opts.build();
    subject = built.subject;
    const emailResult = await sendZohoEmail({
      toAddress: opts.toAddress,
      subject: built.subject,
      content: built.content,
    });
    if (emailResult.success) {
      await opts.supabase.schema("email_logs").from("sends").insert({
        to_address: opts.toAddress,
        subject: built.subject,
        template: opts.template,
        application_id: opts.applicationId ?? null,
        status: "success",
      });
    } else {
      throw new Error(emailResult.error ?? "Unknown email error");
    }
  } catch (err) {
    console.error(`${opts.errorContext} failed:`, err);
    await opts.supabase.schema("email_logs").from("sends").insert({
      to_address: opts.toAddress,
      subject: subject ?? `${opts.template} (failed to build)`,
      template: opts.template,
      application_id: opts.applicationId ?? null,
      status: "error",
      error_message: String(err).slice(0, 500),
    });
    sendDiscordNotification(
      createErrorEmbed({
        context: opts.errorContext,
        error: String(err),
        details: opts.errorDetails ?? {},
      }),
    ).catch(() => {});
  }
}

export async function mobilePaymentNotificationsAlreadySent(
  supabase: SupabaseAdmin,
  stripeSessionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .schema("billing")
    .from("stripe_transactions")
    .select("notifications_sent_at")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  return !!data?.notifications_sent_at;
}

export async function markMobilePaymentNotificationsSent(
  supabase: SupabaseAdmin,
  stripeSessionId: string,
): Promise<void> {
  const { error } = await supabase
    .schema("billing")
    .from("stripe_transactions")
    .update({ notifications_sent_at: new Date().toISOString() })
    .eq("stripe_session_id", stripeSessionId);

  if (error) {
    console.error("Failed to mark mobile payment notifications sent:", error);
  }
}

export async function sendMobilePaymentNotifications(
  intent: Stripe.PaymentIntent,
  supabase: SupabaseAdmin,
): Promise<void> {
  const metadata = intent.metadata ?? {};
  const parentId = metadata.parent_id ?? null;
  const payerEmail = metadata.parent_email ?? intent.receipt_email ?? null;
  const paymentType = metadata.payment_type;

  if (paymentType === "summer_tuition") {
    const applicationId = metadata.application_id;
    const studentId = metadata.student_id;
    const planType = (metadata.plan_type ?? "full") as "weekly" | "full";
    const weeksStr = metadata.weeks ?? "";
    const weeks = weeksStr
      ? weeksStr.split(",").map(Number).filter((n: number) => !isNaN(n))
      : [];
    const amountCents = intent.amount;
    const amountDollars = (amountCents / 100).toFixed(2);

    const { parentName, parentEmailAddr, childName } =
      await resolveParentChildNames(supabase, {
        applicationId,
        studentId,
        payerEmail,
      });

    await sendDiscordNotification(
      createSummerTuitionEmbed({
        parentName,
        parentEmail: parentEmailAddr,
        childName,
        planType,
        amountCents,
        weeks: weeks.length > 0 ? weeks : undefined,
      }),
    );

    await sendConfirmationEmail({
      supabase,
      toAddress: parentEmailAddr !== "N/A" ? parentEmailAddr : "",
      template: "summer_tuition_confirmation",
      applicationId,
      errorContext: "Mobile summer tuition confirmation email",
      errorDetails: {
        applicationId: applicationId ?? "N/A",
        studentId: studentId ?? "N/A",
      },
      build: () =>
        buildSummerTuitionConfirmationEmail({
          g1FullName: parentName !== "N/A" ? parentName : "Parent",
          childLegalName: childName !== "N/A" ? childName : "your child",
          planType,
          amountDollars,
          weeks: weeks.length > 0 ? weeks : undefined,
        }),
    });
    return;
  }

  if (paymentType === "aftercare_tuition") {
    const applicationId = metadata.application_id;
    const studentId = metadata.student_id;
    const planType = (metadata.plan_type ?? "monthly") as "monthly" | "daily";
    const selectedMonths = metadata.selected_months
      ? metadata.selected_months.split(",").filter(Boolean)
      : [];
    const selectedDays = metadata.selected_days
      ? metadata.selected_days.split(",").filter(Boolean)
      : [];
    const amountCents = intent.amount;
    const amountDollars = (amountCents / 100).toFixed(2);

    const { parentName, parentEmailAddr, childName } =
      await resolveParentChildNames(supabase, {
        applicationId,
        studentId,
        payerEmail,
      });

    await sendDiscordNotification(
      createAftercareTuitionEmbed({
        parentName,
        parentEmail: parentEmailAddr,
        childName,
        planType,
        amountCents,
        selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined,
        selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
      }),
    );

    await sendConfirmationEmail({
      supabase,
      toAddress: parentEmailAddr !== "N/A" ? parentEmailAddr : "",
      template: "aftercare_tuition_confirmation",
      applicationId,
      errorContext: "Mobile aftercare confirmation email",
      errorDetails: {
        applicationId: applicationId ?? "N/A",
        studentId: studentId ?? "N/A",
      },
      build: () =>
        buildAftercareConfirmationEmail({
          g1FullName: parentName !== "N/A" ? parentName : "Parent",
          childLegalName: childName !== "N/A" ? childName : "your child",
          planType,
          selectedMonths,
          selectedDays,
          amountDollars,
        }),
    });
    return;
  }

  if (paymentType === "homeschool_dropin") {
    const applicationId = metadata.application_id;
    const studentId = metadata.student_id;
    const program = metadata.program ?? "summer_26";
    const tier = metadata.tier ?? "dropin";
    const selectedDays = metadata.selected_days
      ? metadata.selected_days.split(",").filter(Boolean)
      : [];
    const selectedWeeks = metadata.selected_weeks
      ? metadata.selected_weeks.split(",").map(Number).filter(Boolean)
      : [];
    const amountCents = intent.amount;
    const amountDollars = (amountCents / 100).toFixed(2);

    const { parentName, parentEmailAddr, childName } =
      await resolveParentChildNames(supabase, {
        applicationId,
        studentId,
        payerEmail,
      });

    await sendDiscordNotification(
      createHomeschoolDropInEmbed({
        parentName,
        parentEmail: parentEmailAddr,
        childName,
        program,
        tier,
        selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
        selectedWeeks: selectedWeeks.length > 0 ? selectedWeeks : undefined,
        amountCents,
        source: "mobile",
      }),
    );

    await sendConfirmationEmail({
      supabase,
      toAddress: parentEmailAddr !== "N/A" ? parentEmailAddr : "",
      template: "homeschool_dropin_confirmation",
      applicationId,
      errorContext: "Mobile homeschool drop-in confirmation email",
      errorDetails: {
        applicationId: applicationId ?? "N/A",
        studentId: studentId ?? "N/A",
      },
      build: () =>
        buildHomeschoolDropInConfirmationEmail({
          g1FullName: parentName !== "N/A" ? parentName : "Parent",
          childLegalName: childName !== "N/A" ? childName : "your child",
          program,
          tier,
          selectedDays,
          selectedWeeks,
          amountDollars,
        }),
    });
    return;
  }

  if (paymentType === "fun_friday_tuition") {
    const applicationId = metadata.application_id;
    const studentId = metadata.student_id;
    const planType = (metadata.plan_type ?? "monthly") as "monthly" | "dropin";
    const selectedMonths = metadata.selected_months
      ? metadata.selected_months.split(",").filter(Boolean)
      : [];
    const selectedFridays = metadata.selected_fridays
      ? metadata.selected_fridays.split(",").filter(Boolean)
      : [];
    const amountCents = intent.amount;
    const amountDollars = (amountCents / 100).toFixed(2);

    const { parentName, parentEmailAddr, childName } =
      await resolveParentChildNames(supabase, {
        applicationId,
        studentId,
        payerEmail,
      });

    await sendDiscordNotification(
      createFunFridayTuitionEmbed({
        parentName,
        parentEmail: parentEmailAddr,
        childName,
        planType,
        amountCents,
        selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined,
        selectedFridays:
          selectedFridays.length > 0 ? selectedFridays : undefined,
      }),
    );

    await sendConfirmationEmail({
      supabase,
      toAddress: parentEmailAddr !== "N/A" ? parentEmailAddr : "",
      template: "fun_friday_tuition_confirmation",
      applicationId,
      errorContext: "Mobile fun friday confirmation email",
      errorDetails: {
        applicationId: applicationId ?? "N/A",
        studentId: studentId ?? "N/A",
      },
      build: () =>
        buildFunFridayConfirmationEmail({
          g1FullName: parentName !== "N/A" ? parentName : "Parent",
          childLegalName: childName !== "N/A" ? childName : "your child",
          planType,
          selectedMonths,
          selectedFridays,
          amountDollars,
        }),
    });
    return;
  }

  if (paymentType === "school_year_tuition") {
    await notifySchoolYearTuitionPayment({
      supabase,
      parentId,
      studentId: metadata.student_id ?? null,
      parentEmailAddr: payerEmail ?? "N/A",
      amountCents: intent.amount,
      selectedMonthsRaw: metadata.selected_months ?? "",
      source: "mobile",
    });
    return;
  }

  if (paymentType === "custom_tuition") {
    const studentId = metadata.student_id;
    const parentEmailAddr = payerEmail ?? "N/A";
    const tuitionCode = metadata.tuition_code ?? "N/A";
    const label = metadata.label ?? "Custom Tuition";
    const amountCents = intent.amount;
    const amountDollars = (amountCents / 100).toFixed(2);

    const { parentName, childName } = await resolveParentChildNames(supabase, {
      parentId,
      studentId,
      payerEmail,
    });

    await sendDiscordNotification(
      createCustomTuitionEmbed({
        parentName,
        parentEmail: parentEmailAddr,
        childName,
        label,
        tuitionCode,
        amountCents,
      }),
    );

    await sendConfirmationEmail({
      supabase,
      toAddress: parentEmailAddr !== "N/A" ? parentEmailAddr : "",
      template: "custom_tuition_confirmation",
      errorContext: "Mobile custom tuition confirmation email",
      errorDetails: { parentId: parentId ?? "N/A", tuitionCode },
      build: () =>
        buildCustomTuitionConfirmationEmail({
          g1FullName: parentName !== "N/A" ? parentName : "Parent",
          label,
          amountDollars,
        }),
    });
    return;
  }

  if (paymentType === "supply_fee") {
    const studentId = metadata.student_id;
    const parentEmailAddr = payerEmail ?? "N/A";
    const amountCents = intent.amount;

    const { parentName, childName } = await resolveParentChildNames(supabase, {
      parentId,
      studentId,
      payerEmail,
    });

    let allChildNames = childName;
    if (metadata.sibling_supply_student_ids) {
      const sibIds = metadata.sibling_supply_student_ids
        .split(",")
        .filter(Boolean);
      if (sibIds.length > 0) {
        const { data: sibStudents } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .in("id", sibIds);
        const sibNames =
          sibStudents?.map((s) => s.child_legal_name ?? "N/A") ?? [];
        allChildNames = [childName, ...sibNames].join(", ");
      }
    }

    const bundleType = metadata.bundle_type;
    const bundleAmountCents = parseInt(metadata.bundle_amount_cents ?? "0");
    const sibBundleAmounts =
      metadata.sibling_bundle_amounts?.split(",").map(Number) ?? [];
    let studentBreakdown:
      | Array<{ name: string; supplyFee: number; bundleAmount: number }>
      | undefined;

    if (bundleType) {
      const sibIds =
        metadata.sibling_supply_student_ids?.split(",").filter(Boolean) ?? [];
      const sibNames: string[] = [];
      if (sibIds.length > 0) {
        const { data: sibStudents } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .in("id", sibIds);
        sibNames.push(
          ...(sibStudents?.map((s) => s.child_legal_name ?? "N/A") ?? []),
        );
      }
      studentBreakdown = [
        { name: childName, supplyFee: 30000, bundleAmount: bundleAmountCents },
        ...sibIds.map((_, i) => ({
          name: sibNames[i] ?? "N/A",
          supplyFee: 30000,
          bundleAmount: sibBundleAmounts[i] ?? 0,
        })),
      ];
    }

    await sendDiscordNotification(
      createSupplyFeeEmbed({
        parentName,
        parentEmail: parentEmailAddr,
        childName: allChildNames,
        amountCents,
        bundleType,
        studentBreakdown,
      }),
    );

    await sendConfirmationEmail({
      supabase,
      toAddress: parentEmailAddr !== "N/A" ? parentEmailAddr : "",
      template: "supply_fee_confirmation",
      errorContext: "Mobile supply fee confirmation email",
      errorDetails: { parentId: parentId ?? "N/A", studentId: studentId ?? "N/A" },
      build: async () => {
        const amountDollars = (amountCents / 100).toFixed(2);
        return buildSupplyFeeConfirmationEmail({
          g1FullName: parentName !== "N/A" ? parentName : "Parent",
          childName: allChildNames,
          amountDollars,
          bundleType,
          studentBreakdown,
        });
      },
    });
  }
}

export async function maybeSendMobilePaymentNotifications(
  intent: Stripe.PaymentIntent,
  supabase: SupabaseAdmin,
  options: { skipNotifications?: boolean } = {},
): Promise<void> {
  if (options.skipNotifications) return;

  const alreadySent = await mobilePaymentNotificationsAlreadySent(
    supabase,
    intent.id,
  );
  if (alreadySent) return;

  const paymentType = intent.metadata?.payment_type;
  if (!paymentType || paymentType === "unknown") return;

  try {
    await sendMobilePaymentNotifications(intent, supabase);
    await markMobilePaymentNotificationsSent(supabase, intent.id);
  } catch (err) {
    console.error("Mobile payment notifications failed:", err);
    sendDiscordNotification(
      createErrorEmbed({
        context: "Mobile payment notifications",
        error: String(err),
        details: {
          paymentIntentId: intent.id,
          paymentType: paymentType ?? "N/A",
        },
      }),
    ).catch(() => {});
  }
}
