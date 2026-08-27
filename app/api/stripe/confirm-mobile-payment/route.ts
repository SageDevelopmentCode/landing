import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import { recordMobilePaymentIntent } from "@/app/lib/record-mobile-payment-intent";

const schema = z.object({
  paymentIntentId: z.string().min(1),
  parentId: z.string().uuid(),
});

/** Called by the mobile app after Payment Sheet success — mirrors web checkout.session.completed timing. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, parentId } = schema.parse(body);

    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (intent.metadata?.mobile !== "true") {
      return NextResponse.json({ error: "Not a mobile payment" }, { status: 400 });
    }

    if (intent.metadata?.parent_id !== parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (intent.status !== "processing" && intent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not submitted (${intent.status})` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: existingTx } = await supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("id")
      .eq("stripe_session_id", intent.id)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({ ok: true, alreadyRecorded: true });
    }

    await recordMobilePaymentIntent(intent, supabase, { skipNotifications: false });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    console.error("confirm-mobile-payment error:", error);
    return NextResponse.json(
      { error: "Failed to confirm mobile payment" },
      { status: 500 },
    );
  }
}
