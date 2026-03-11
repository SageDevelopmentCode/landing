import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const supabase = createAdminClient();

    if (session.metadata?.payment_type === "registration_fee") {
      const applicationId = session.metadata?.application_id;
      if (applicationId) {
        const { error } = await supabase
          .schema("parent_app")
          .from("applications")
          .update({ registration_fee_paid: true })
          .eq("id", applicationId);

        if (error) {
          console.error("Failed to update registration fee status:", error);
          return NextResponse.json(
            { error: "Failed to update registration fee status" },
            { status: 500 }
          );
        }
      }
    } else {
      const { error } = await supabase
        .schema("donations")
        .from("donations")
        .upsert(
          {
            stripe_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            donor_name: session.metadata?.donor_name || null,
            donor_email:
              session.metadata?.donor_email || session.customer_email || "",
            message: session.metadata?.message || null,
            status: "completed",
          },
          { onConflict: "stripe_session_id" }
        );

      if (error) {
        console.error("Failed to record donation:", error);
        return NextResponse.json(
          { error: "Failed to record donation" },
          { status: 500 }
        );
      }
    }

    // Shared write to billing.stripe_transactions for all payment types
    const { error: billingError } = await supabase
      .schema("billing")
      .from("stripe_transactions")
      .upsert({
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        payment_type: session.metadata?.payment_type ?? "donation",
        amount_cents: session.amount_total ?? 0,
        intended_amount_cents: session.metadata?.intended_amount_cents
          ? parseInt(session.metadata.intended_amount_cents)
          : null,
        currency: session.currency ?? "usd",
        cover_fees: session.metadata?.cover_fees === "true",
        payer_name: session.metadata?.donor_name || null,
        payer_email: session.metadata?.donor_email || session.customer_email || "",
        description: session.metadata?.description || null,
        student_id: session.metadata?.student_id || null,
        application_id: session.metadata?.application_id || null,
        parent_id: session.metadata?.parent_id || null,
        metadata: session.metadata ?? {},
        status: "completed",
      }, { onConflict: "stripe_session_id" });

    if (billingError) {
      console.error("Failed to record billing transaction:", billingError);
    }
  }

  return NextResponse.json({ received: true });
}
