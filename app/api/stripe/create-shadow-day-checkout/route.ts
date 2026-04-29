import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const schema = z.object({
  userId: z.string(),
  userEmail: z.string().email("Valid email required"),
  bookingId: z.string(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const { userId, userEmail, bookingId, coverFees, paymentMethod } = validated;

    const baseCents = 9500;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

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
              name: "Shadow Day Visit Fee",
              description: "Sage Field Private School — shadow day visit fee",
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
              name: "Shadow Day Visit Fee",
              description: "Sage Field Private School — shadow day visit fee",
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
              name: "Shadow Day Visit Fee",
              description: "Sage Field Private School — shadow day visit fee",
            },
          },
        },
      ];
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(userId, userEmail);

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      customer: stripeCustomerId,
      saved_payment_method_options: {
        allow_redisplay_filters: ["always", "limited"],
        payment_method_save: "enabled",
      },
      payment_intent_data: {
        receipt_email: userEmail,
        setup_future_usage: "off_session",
      },
      line_items: lineItems,
      metadata: {
        payment_type: "shadow_day_fee",
        booking_id: bookingId,
        parent_id: userId,
        parent_email: userEmail,
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(baseCents),
        description: "Shadow Day Fee",
      },
      success_url: `${baseUrl}/shadow-day/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shadow-day/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("Shadow day checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
