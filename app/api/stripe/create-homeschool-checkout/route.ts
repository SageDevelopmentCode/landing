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
  selectedDays: z.array(z.string()).default([]), // e.g. ["mon", "wed"]
  selectedWeeks: z.array(z.number()).default([]), // e.g. [1, 3, 5] — summer only
  intendedAmountCents: z.number().int().positive(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
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
      intendedAmountCents,
      coverFees,
      paymentMethod,
    } = validated;

    const pricing = program === "summer_26" ? SUMMER_PRICING : SCHOOL_YEAR_PRICING;
    const isSummer = program === "summer_26";
    const tierLabel = TIER_LABELS[tier];
    const programLabel = PROGRAM_LABELS[program];
    const daysLabel = selectedDays.length > 0 ? selectedDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ") : "Day Pass";
    const weeksLabel = selectedWeeks.length > 0 ? `Weeks ${selectedWeeks.join(", ")}` : "";

    const weeklyRate = pricing[tier]?.[gradeTier] ?? intendedAmountCents;
    // For summer: charge is weeklyRate × number of weeks
    const unitAmount = isSummer ? weeklyRate : weeklyRate;

    const description = isSummer
      ? tier === "dropin"
        ? `Homeschool Drop-In — ${tierLabel} · ${programLabel}${weeksLabel ? ` · ${weeksLabel}` : ""}`
        : `Homeschool Drop-In — ${tierLabel} (${daysLabel}) · ${programLabel}${weeksLabel ? ` · ${weeksLabel}` : ""}`
      : tier === "dropin"
        ? `Homeschool Drop-In — ${tierLabel} · ${programLabel}`
        : `Homeschool Drop-In — ${tierLabel} (${daysLabel}) · ${programLabel} · $${(weeklyRate / 100).toFixed(0)}/mo`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    // For summer: quantity = number of weeks selected; unit = weekly rate
    // For school year: quantity = 1; unit = monthly rate
    const quantity = isSummer && selectedWeeks.length > 0 ? selectedWeeks.length : 1;
    const productDesc = isSummer
      ? tier === "dropin"
        ? `${programLabel} · Day Pass${weeksLabel ? ` · ${weeksLabel}` : ""}`
        : `${programLabel} · ${daysLabel}${weeksLabel ? ` · ${weeksLabel}` : ""}`
      : tier === "dropin"
        ? `${programLabel} · Day Pass`
        : `${programLabel} · ${daysLabel} · $${(weeklyRate / 100).toFixed(0)}/mo`;

    const lineItems: {
      quantity: number;
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
    }[] = [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: `Homeschool Drop-In — ${tierLabel}${isSummer && quantity > 1 ? ` (${quantity} wks)` : ""}`,
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
