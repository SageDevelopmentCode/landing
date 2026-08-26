import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createErrorEmbed } from "@/app/lib/discord";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/shared/billing/school-year";

const schema = z.object({
  parentName: z.string().min(1, "Parent name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  children: z.array(
    z.object({
      name: z.string().min(1, "Child name required"),
      age: z.number().int().min(4).max(11),
    }),
  ).min(1, "At least one child required"),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  consentOutdoor: z.boolean(),
  consentPhoto: z.boolean(),
  signatureName: z.string().min(1, "Signature required"),
  paymentMethod: z.enum(["card", "ach"]).default("card"),
  coverFees: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  let data: z.infer<typeof schema> | undefined;
  try {
    const body = await request.json();
    data = schema.parse(body);

    const PRICE_PER_CHILD_CENTS = FUN_FRIDAY_DROPIN_CENTS;
    const BASE_AMOUNT_CENTS = data.children.length * PRICE_PER_CHILD_CENTS;
    const childNames = data.children.map((c) => c.name).join(", ");

    const finalAmountCents = data.coverFees
      ? data.paymentMethod === "ach"
        ? BASE_AMOUNT_CENTS + Math.min(Math.round(BASE_AMOUNT_CENTS * 0.008), 500)
        : Math.round((BASE_AMOUNT_CENTS + 30) / (1 - 0.029))
      : BASE_AMOUNT_CENTS;

    const adminClient = createAdminClient();

    const { data: row, error: insertError } = await adminClient
      .schema("marketing")
      .from("beach_bash_registrations")
      .insert({
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone || null,
        children: data.children,
        child_count: data.children.length,
        referral_source: data.referralSource || null,
        notes: data.notes || null,
        emergency_name: data.emergencyName || null,
        emergency_phone: data.emergencyPhone || null,
        consent_outdoor: data.consentOutdoor,
        consent_photo: data.consentPhoto,
        signature_name: data.signatureName,
        payment_method: data.paymentMethod,
        cover_fees: data.coverFees,
        payment_status: "pending",
        source: "friday_page",
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("Beach Bash registration insert error:", insertError);
      sendDiscordNotification(
        createErrorEmbed({
          context: "Beach Bash Register — DB insert",
          error: insertError?.message ?? "No row returned",
          details: { email: data.email, childNames },
        }),
      ).catch(() => {});
      return NextResponse.json(
        { error: "Failed to save registration. Please try again." },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: data.paymentMethod === "ach" ? ["us_bank_account"] : ["card"],
      customer_email: data.email,
      payment_intent_data: {
        receipt_email: data.email,
      },
      line_items: [
        {
          quantity: data.children.length,
          price_data: {
            currency: "usd",
            unit_amount: data.coverFees
              ? Math.round(finalAmountCents / data.children.length)
              : PRICE_PER_CHILD_CENTS,
            product_data: {
              name: "Construction Zone — August 28",
              description: `Sage Field Private School · $${FUN_FRIDAY_DROPIN_CENTS / 100} per child · August 28, 2026`,
            },
          },
        },
      ],
      metadata: {
        payment_type: "beach_bash_fee",
        registration_id: row.id,
        parent_email: data.email,
        parent_name: data.parentName,
        child_names: childNames,
        child_count: String(data.children.length),
        intended_amount_cents: String(BASE_AMOUNT_CENTS),
        cover_fees: String(data.coverFees),
        payment_method: data.paymentMethod,
        description: "Construction Zone Field Day Fee",
      },
      success_url: `${baseUrl}/friday/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/friday#reserve`,
    });

    await adminClient
      .schema("marketing")
      .from("beach_bash_registrations")
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
    console.error("Beach Bash register error:", error);
    sendDiscordNotification(
      createErrorEmbed({
        context: "Beach Bash Register — Stripe session creation",
        error: error instanceof Error ? error.message : String(error),
        details: {
          email: data?.email ?? "unknown",
          childNames: data?.children?.map((c) => c.name).join(", ") ?? "unknown",
        },
      }),
    ).catch(() => {});
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
