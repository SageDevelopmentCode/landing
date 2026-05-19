import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

// Summer: per-week rates in cents
const SUMMER_PRICING: Record<string, Record<string, number>> = {
  dropin: { primary: 10000, upper: 9500 },
  "2day": { primary: 18000, upper: 17000 },
  "3day": { primary: 25500, upper: 24000 },
};

// School Year: per-month rates in cents
const SCHOOL_YEAR_PRICING: Record<string, Record<string, number>> = {
  dropin: { primary: 12000, upper: 11000 },
  "2day": { primary: 56000, upper: 52000 },
  "3day": { primary: 78000, upper: 72000 },
};

const TIER_LABELS: Record<string, string> = {
  dropin: "Explorer Day Pass (Drop-In)",
  "2day": "2 Days / Week",
  "3day": "3 Days / Week",
};

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 2026–2027",
};

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  program: z.enum(["summer_26", "school_year_26_27"]),
  tier: z.enum(["dropin", "2day", "3day"]),
  gradeTier: z.enum(["primary", "upper"]),
  selectedDays: z.array(z.string()).default([]),
  selectedWeeks: z.array(z.number()).default([]),
  weekSelectionsJson: z.string().optional(), // JSON: [{week, days[]}]
  intendedAmountCents: z.number().int().positive(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  mobile: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const {
      parentId,
      parentEmail,
      studentId,
      applicationId,
      program,
      tier,
      gradeTier,
      selectedDays,
      selectedWeeks,
      weekSelectionsJson,
      intendedAmountCents,
      coverFees,
      paymentMethod,
      mobile,
    } = validated;

    const programLabel = PROGRAM_LABELS[program];
    const weeksCount = selectedWeeks.length;
    const description = `Homeschool Drop-In · ${programLabel} · ${weeksCount} week${weeksCount !== 1 ? "s" : ""}`;
    const productDesc = `${programLabel} · ${weeksCount} week${weeksCount !== 1 ? "s" : ""}, varied schedule`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const lineItems: {
      quantity: number;
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
    }[] = [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: intendedAmountCents,
          product_data: {
            name: `Homeschool Drop-In — ${programLabel} (${weeksCount} wk${weeksCount !== 1 ? "s" : ""})`,
            description: productDesc,
          },
        },
      },
    ];

    if (coverFees) {
      const feeCents =
        paymentMethod === "ach"
          ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
          : Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents;

      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: feeCents,
          product_data: {
            name: paymentMethod === "ach" ? "ACH processing fee" : "Card processing fee",
          },
        },
      });
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(parentId, parentEmail);

    if (mobile) {
      const mobileFee = coverFees
        ? paymentMethod === "ach"
          ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
          : Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents
        : 0;
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: intendedAmountCents + mobileFee,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method_types: ["card", "us_bank_account"],
        receipt_email: parentEmail,
        setup_future_usage: "off_session",
        metadata: {
          payment_type: "homeschool_dropin",
          parent_id: parentId,
          parent_email: parentEmail,
          student_id: studentId,
          application_id: applicationId,
          program,
          tier,
          grade_tier: gradeTier,
          selected_days: selectedDays.join(","),
          selected_weeks: selectedWeeks.join(","),
          week_selections: weekSelectionsJson ?? "",
          cover_fees: String(coverFees),
          payment_method: paymentMethod,
          intended_amount_cents: String(intendedAmountCents),
          description,
        },
      });
      const ephemeralKey = await getStripe().ephemeralKeys.create(
        { customer: stripeCustomerId },
        { apiVersion: "2026-02-25.clover" },
      );
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId: stripeCustomerId,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      customer: stripeCustomerId,
      saved_payment_method_options: {
        allow_redisplay_filters: ["always", "limited"],
        payment_method_save: "enabled",
      },
      payment_intent_data: {
        receipt_email: parentEmail,
        setup_future_usage: "off_session",
      },
      line_items: lineItems,
      metadata: {
        payment_type: "homeschool_dropin",
        parent_id: parentId,
        parent_email: parentEmail,
        student_id: studentId,
        application_id: applicationId,
        program,
        tier,
        grade_tier: gradeTier,
        selected_days: selectedDays.join(","),
        selected_weeks: selectedWeeks.join(","),
        week_selections: weekSelectionsJson ?? "",
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(intendedAmountCents),
        description,
      },
      success_url: `${baseUrl}/parent/billing/homeschool-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Homeschool drop-in checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
