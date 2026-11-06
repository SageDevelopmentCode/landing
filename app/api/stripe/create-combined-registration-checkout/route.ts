import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";
import {
  ALL_PROGRAM_VALUES,
  ALL_DROP_IN_PROGRAM_VALUES,
  getRegistrationFeeCents,
  getRegistrationFeeLines,
} from "@/app/lib/application-programs";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  children: z.array(
    z.object({
      studentId: z.string(),
      applicationId: z.string(),
      program: z.enum(ALL_PROGRAM_VALUES),
      dropInProgram: z.enum(ALL_DROP_IN_PROGRAM_VALUES).nullable().optional(),
      childName: z.string(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const { parentId, parentEmail, coverFees, paymentMethod, children } = validated;

    const totalBaseCents = children.reduce(
      (sum, c) => sum + getRegistrationFeeCents(c.program, c.dropInProgram),
      0,
    );

    const applicationIds = children.map((c) => c.applicationId);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const lineItems: {
      quantity: number;
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
    }[] = [];

    for (const child of children) {
      for (const line of getRegistrationFeeLines(child.program, child.dropInProgram)) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: line.cents,
            product_data: {
              name: `${child.childName} — ${line.name}`,
              description: line.description,
            },
          },
        });
      }
    }

    if (coverFees) {
      const feeCents =
        paymentMethod === "ach"
          ? Math.min(Math.round(totalBaseCents * 0.008), 500)
          : Math.round((totalBaseCents + 30) / (1 - 0.029)) - totalBaseCents;
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: feeCents,
          product_data: {
            name:
              paymentMethod === "ach"
                ? "ACH processing fee"
                : "Registration fee processing fee",
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
        payment_type: "registration_fee",
        application_ids: applicationIds.join(","),
        parent_id: parentId,
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(totalBaseCents),
      },
      success_url: `${baseUrl}/parent/dashboard/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/parent/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("Combined registration checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
