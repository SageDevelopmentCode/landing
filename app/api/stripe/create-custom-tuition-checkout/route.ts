import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string().optional(),
  tuitionCode: z.string(),
  label: z.string(),
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
      tuitionCode,
      label,
      intendedAmountCents,
      coverFees,
      paymentMethod,
      mobile,
    } = validated;

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
          product_data: { name: label },
        },
      },
    ];

    if (coverFees) {
      const feeCents =
        paymentMethod === "ach"
          ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
          : Math.round((intendedAmountCents + 30) / (1 - 0.029)) -
            intendedAmountCents;

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
      payment_type: "custom_tuition",
      parent_id: parentId,
      parent_email: parentEmail,
      ...(studentId ? { student_id: studentId } : {}),
      tuition_code: tuitionCode,
      label,
      cover_fees: String(coverFees),
      payment_method: paymentMethod,
      intended_amount_cents: String(intendedAmountCents),
      description: label,
    };

    if (mobile) {
      const mobileFee = coverFees
        ? paymentMethod === "ach"
          ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
          : Math.round((intendedAmountCents + 30) / (1 - 0.029)) -
            intendedAmountCents
        : 0;
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: intendedAmountCents + mobileFee,
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
      success_url: `${baseUrl}/parent/billing/custom-tuition-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("Custom tuition checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
