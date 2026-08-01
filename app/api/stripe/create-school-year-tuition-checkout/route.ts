import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";
import {
  sendDiscordNotification,
  createAppErrorEmbed,
} from "@/app/lib/discord";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  intendedAmountCents: z.number().int().positive(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  selectedMonths: z.array(z.number().int().positive()).optional().default([]),
});

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
    } = validated;

    const baseCents = intendedAmountCents;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const productName =
      selectedMonths.length === 1
        ? "School Year Tuition (1 month)"
        : `School Year Tuition (${selectedMonths.length} months)`;

    let lineItems;
    if (coverFees && paymentMethod === "ach") {
      const feeCents = Math.min(Math.round(baseCents * 0.008), 500);
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: baseCents,
            product_data: {
              name: productName,
              description:
                "Sage Field Private School — School Year 2026–27 monthly tuition",
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: feeCents,
            product_data: { name: "ACH processing fee" },
          },
        },
      ];
    } else if (coverFees && paymentMethod === "card") {
      const feeCents = Math.round((baseCents + 30) / (1 - 0.029)) - baseCents;
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: baseCents,
            product_data: {
              name: productName,
              description:
                "Sage Field Private School — School Year 2026–27 monthly tuition",
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: feeCents,
            product_data: { name: "Card processing fee" },
          },
        },
      ];
    } else {
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: baseCents,
            product_data: {
              name: productName,
              description:
                "Sage Field Private School — School Year 2026–27 monthly tuition",
            },
          },
        },
      ];
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(
      parentId,
      parentEmail,
    );

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
        payment_type: "school_year_tuition",
        parent_id: parentId,
        parent_email: parentEmail,
        student_id: studentId,
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(baseCents),
        selected_months: selectedMonths.join(","),
      },
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
