import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createErrorEmbed } from "@/app/lib/discord";

const schema = z.object({
  payerName: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  childName: z.string().optional(),
  childAge: z.number().int().min(4).max(11).optional().nullable(),
  memo: z.string().max(300).optional(),
  amountCents: z.number().int().min(100, "Minimum amount is $1"),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
});

export async function POST(request: NextRequest) {
  let data: z.infer<typeof schema> | undefined;
  try {
    const body = await request.json();
    data = schema.parse(body);

    const finalAmountCents = data.coverFees
      ? data.paymentMethod === "ach"
        ? data.amountCents + Math.min(Math.round(data.amountCents * 0.008), 500)
        : Math.round((data.amountCents + 30) / (1 - 0.029))
      : data.amountCents;

    const adminClient = createAdminClient();

    const { data: row, error: insertError } = await adminClient
      .schema("billing")
      .from("one_time_payments")
      .insert({
        payer_name: data.payerName,
        payer_email: data.email,
        payer_phone: data.phone || null,
        child_name: data.childName || null,
        child_age: data.childAge ?? null,
        memo: data.memo || null,
        amount_cents: data.amountCents,
        cover_fees: data.coverFees,
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("One-time payment insert error:", insertError);
      sendDiscordNotification(
        createErrorEmbed({
          context: "One-Time Payment — DB insert",
          error: insertError?.message ?? "No row returned",
          details: { email: data.email },
        }),
      ).catch(() => {});
      return NextResponse.json(
        { error: "Failed to save payment info. Please try again." },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const amountLabel = `$${(data.amountCents / 100).toFixed(2)}`;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: data.paymentMethod === "ach" ? ["us_bank_account"] : ["card"],
      customer_email: data.email,
      payment_intent_data: {
        receipt_email: data.email,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: finalAmountCents,
            product_data: {
              name: `Payment to Sage Field${data.memo ? ` — ${data.memo}` : ""}`,
              description: data.memo
                ? `${amountLabel} · ${data.memo}`
                : `${amountLabel} payment to Sage Field Private School`,
            },
          },
        },
      ],
      metadata: {
        payment_type: "one_time_payment",
        one_time_payment_id: row.id,
        payer_name: data.payerName,
        payer_email: data.email,
        memo: data.memo || "",
        intended_amount_cents: String(data.amountCents),
        cover_fees: String(data.coverFees),
        payment_method: data.paymentMethod,
        description: "One-Time Payment",
      },
      success_url: `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pay`,
    });

    // Store session ID on the row
    await adminClient
      .schema("billing")
      .from("one_time_payments")
      .update({ stripe_session_id: session.id })
      .eq("id", row.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("One-time payment error:", error);
    sendDiscordNotification(
      createErrorEmbed({
        context: "One-Time Payment — Stripe session creation",
        error: error instanceof Error ? error.message : String(error),
        details: { email: data?.email ?? "unknown" },
      }),
    ).catch(() => {});
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
