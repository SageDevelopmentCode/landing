import { createAdminClient } from "@/app/lib/supabase-server";
import { maybeSendMobilePaymentNotifications } from "@/app/lib/mobile-payment-notifications";
import type Stripe from "stripe";

export async function recordMobilePaymentIntent(
  intent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createAdminClient>,
  options: { skipNotifications?: boolean } = {},
) {
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
    const sibCents =
      metadata.sibling_intended_cents?.split(",").map(Number) ?? [];

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

  await maybeSendMobilePaymentNotifications(intent, supabase, options);
}
