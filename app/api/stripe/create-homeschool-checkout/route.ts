import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

// School Year: per-month rates in cents (used for validation reference in client)
const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 2026–2027",
};

const siblingSchema = z.object({
  studentId: z.string(),
  applicationId: z.string(),
  tier: z.enum(["dropin", "2day", "3day"]),
  gradeTier: z.enum(["primary", "upper"]),
  selectedDays: z.array(z.string()).default([]),
  selectedWeeks: z.array(z.number()).default([]),
  weekSelectionsJson: z.string().optional(),
  intendedAmountCents: z.number().int().positive(),
  studentName: z.string().optional(),
});

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
  siblings: z.array(siblingSchema).optional().default([]),
});

function homeschoolLineItemName(
  program: string,
  weeksCount: number,
  suffix?: string,
) {
  const programLabel = PROGRAM_LABELS[program as keyof typeof PROGRAM_LABELS];
  const unit = program === "school_year_26_27" ? "mo" : "wk";
  const base = `Homeschool Drop-In — ${programLabel} (${weeksCount} ${unit}${weeksCount !== 1 ? "s" : ""})`;
  return suffix ? `${base} — ${suffix}` : base;
}

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
      siblings,
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
            name: homeschoolLineItemName(program, weeksCount),
            description: productDesc,
          },
        },
      },
    ];

    for (const sib of siblings) {
      const sibWeeksCount = sib.selectedWeeks.length;
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: sib.intendedAmountCents,
          product_data: {
            name: homeschoolLineItemName(
              program,
              sibWeeksCount,
              sib.studentName ?? "Sibling",
            ),
            description: productDesc,
          },
        },
      });
    }

    const totalIntendedCents =
      intendedAmountCents +
      siblings.reduce((sum, s) => sum + s.intendedAmountCents, 0);

    if (coverFees) {
      const feeCents =
        paymentMethod === "ach"
          ? Math.min(Math.round(totalIntendedCents * 0.008), 500)
          : Math.round((totalIntendedCents + 30) / (1 - 0.029)) -
            totalIntendedCents;

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

    const baseMetadata = {
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
      intended_amount_cents: String(totalIntendedCents),
      description,
    };

    const sessionMetadata: Record<string, string> = { ...baseMetadata };
    if (siblings.length > 0) {
      sessionMetadata.sibling_student_ids = siblings
        .map((s) => s.studentId)
        .join(",");
      sessionMetadata.sibling_application_ids = siblings
        .map((s) => s.applicationId)
        .join(",");
      sessionMetadata.sibling_tiers = siblings.map((s) => s.tier).join(",");
      sessionMetadata.sibling_grade_tiers = siblings
        .map((s) => s.gradeTier)
        .join(",");
      sessionMetadata.sibling_weeks = siblings
        .map((s) => s.selectedWeeks.join(";"))
        .join(",");
      sessionMetadata.sibling_selected_days = siblings
        .map((s) => s.selectedDays.join(","))
        .join(";");
      sessionMetadata.sibling_week_selections = siblings
        .map((s) => s.weekSelectionsJson ?? "")
        .join("|");
      sessionMetadata.sibling_intended_cents = siblings
        .map((s) => String(s.intendedAmountCents))
        .join(",");
    }

    if (mobile) {
      sessionMetadata.mobile = "true";
      const mobileFee = coverFees
        ? paymentMethod === "ach"
          ? Math.min(Math.round(totalIntendedCents * 0.008), 500)
          : Math.round((totalIntendedCents + 30) / (1 - 0.029)) -
            totalIntendedCents
        : 0;
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: totalIntendedCents + mobileFee,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method_types: ["card", "us_bank_account"],
        receipt_email: parentEmail,
        setup_future_usage: "off_session",
        metadata: sessionMetadata,
      });
      const ephemeralKey = await getStripe().ephemeralKeys.create(
        { customer: stripeCustomerId },
        { apiVersion: "2026-02-25.clover" },
      );
      return NextResponse.json({
        paymentIntentId: paymentIntent.id,
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
      metadata: sessionMetadata,
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
