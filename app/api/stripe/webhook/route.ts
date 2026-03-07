import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
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
    event = stripe.webhooks.constructEvent(
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

  return NextResponse.json({ received: true });
}
