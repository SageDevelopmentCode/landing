import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";
import {
  sendDiscordNotification,
  createAppErrorEmbed,
} from "@/app/lib/discord";

const SCHOOL_YEAR_TUITION_CENTS = {
  primary: 119500,
  upper: 109500,
} as const;

const siblingSchema = z.object({
  studentId: z.string(),
  gradeTier: z.enum(["primary", "upper"]),
  selectedMonths: z.array(z.number().int().positive()),
  intendedAmountCents: z.number().int().positive(),
  studentName: z.string().optional(),
});

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  intendedAmountCents: z.number().int().positive(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  selectedMonths: z.array(z.number().int().positive()).optional().default([]),
  mobile: z.boolean().optional().default(false),
  siblings: z.array(siblingSchema).optional().default([]),
});

function tuitionLineItemName(
  monthCount: number,
  studentName?: string,
): string {
  const base =
    monthCount === 1
      ? "School Year Tuition (1 month)"
      : `School Year Tuition (${monthCount} months)`;
  return studentName ? `${studentName} — ${base}` : base;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const {
      parentId,
      parentEmail,
      studentId,
      intendedAmountCents,
      coverFees,
      paymentMethod,
      selectedMonths,
      mobile,
      siblings,
    } = validated;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const productName = tuitionLineItemName(selectedMonths.length);

    const primaryMonthCount = Math.max(selectedMonths.length, 1);
    const primaryUnitCents = Math.round(intendedAmountCents / primaryMonthCount);

    const lineItems: {
      quantity: number;
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
    }[] = [
      {
        quantity: primaryMonthCount,
        price_data: {
          currency: "usd",
          unit_amount: primaryUnitCents,
          product_data: {
            name: productName,
            description:
              "Sage Field Private School — School Year 2026–27 monthly tuition",
          },
        },
      },
    ];

    for (const sib of siblings) {
      const unitCents = SCHOOL_YEAR_TUITION_CENTS[sib.gradeTier];
      lineItems.push({
        quantity: sib.selectedMonths.length || 1,
        price_data: {
          currency: "usd",
          unit_amount: unitCents,
          product_data: {
            name: tuitionLineItemName(
              sib.selectedMonths.length,
              sib.studentName,
            ),
            description:
              "Sage Field Private School — School Year 2026–27 monthly tuition",
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
            name:
              paymentMethod === "ach"
                ? "ACH processing fee"
                : "Card processing fee",
          },
        },
      });
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(
      parentId,
      parentEmail,
    );

    const metadata: Record<string, string> = {
      payment_type: "school_year_tuition",
      parent_id: parentId,
      parent_email: parentEmail,
      student_id: studentId,
      cover_fees: String(coverFees),
      payment_method: paymentMethod,
      intended_amount_cents: String(intendedAmountCents),
      selected_months: selectedMonths.join(","),
      description: productName,
    };

    if (siblings.length > 0) {
      metadata.sibling_student_ids = siblings.map((s) => s.studentId).join(",");
      metadata.sibling_grade_tiers = siblings
        .map((s) => s.gradeTier)
        .join(",");
      metadata.sibling_selected_months = siblings
        .map((s) => s.selectedMonths.join(";"))
        .join(",");
      metadata.sibling_intended_cents = siblings
        .map((s) => String(s.intendedAmountCents))
        .join(",");
    }

    if (mobile) {
      metadata.mobile = "true";
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
        metadata,
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
      metadata,
      success_url: `${baseUrl}/parent/billing`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("School year tuition checkout error:", error);
    sendDiscordNotification(
      createAppErrorEmbed({
        error: String(error),
        area: "create-school-year-tuition-checkout",
      }),
    ).catch(() => {});
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
