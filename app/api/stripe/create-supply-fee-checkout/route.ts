import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  bundleType: z.enum(["school_year_tuition", "homeschool"]).optional(),
  bundleAmountCents: z.number().int().positive().optional(),
  bundleMonthIndex: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const { parentId, parentEmail, studentId, coverFees, paymentMethod, bundleType, bundleAmountCents, bundleMonthIndex } = validated;

    const supplyFeeCents = 30000;
    const bundleCents = bundleType && bundleAmountCents ? bundleAmountCents : 0;
    const baseCents = supplyFeeCents + bundleCents;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const supplyFeeLineItem = {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: supplyFeeCents,
        product_data: {
          name: "Annual Supply Fee",
          description: "Sage Field Private School — School Year 2026–27 annual supply fee",
        },
      },
    };

    const bundleLineItem = bundleCents > 0 ? {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: bundleCents,
        product_data: {
          name: bundleType === "school_year_tuition" ? "August 2026 Tuition" : "Homeschool Drop-In — First Month",
          description: "Sage Field Private School — School Year 2026–27",
        },
      },
    } : null;

    let lineItems;
    if (coverFees && paymentMethod === "ach") {
      const feeCents = Math.min(Math.round(baseCents * 0.008), 500);
      lineItems = [
        supplyFeeLineItem,
        ...(bundleLineItem ? [bundleLineItem] : []),
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
        supplyFeeLineItem,
        ...(bundleLineItem ? [bundleLineItem] : []),
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
        supplyFeeLineItem,
        ...(bundleLineItem ? [bundleLineItem] : []),
      ];
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
        payment_type: "supply_fee",
        parent_id: parentId,
        parent_email: parentEmail,
        student_id: studentId,
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(baseCents),
        ...(bundleType ? {
          bundle_type: bundleType,
          bundle_amount_cents: String(bundleCents),
          bundle_month_index: bundleMonthIndex != null ? String(bundleMonthIndex) : "",
        } : {}),
      },
      success_url: `${baseUrl}/parent/billing`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Supply fee checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
