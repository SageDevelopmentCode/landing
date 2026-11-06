import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";
import {
  ALL_PROGRAM_VALUES,
  ALL_DROP_IN_PROGRAM_VALUES,
  getRegistrationFeeLines,
  getBillingProgramLabel,
} from "@/app/lib/application-programs";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  program: z.enum(ALL_PROGRAM_VALUES).default("summer_26"),
  dropInProgram: z
    .enum(ALL_DROP_IN_PROGRAM_VALUES)
    .nullable()
    .optional(),
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
      coverFees,
      paymentMethod,
      program,
      dropInProgram,
    } = validated;

    const feeLines = getRegistrationFeeLines(program, dropInProgram);
    const totalBaseCents = feeLines.reduce((sum, l) => sum + l.cents, 0);

    const description = `${getBillingProgramLabel(program, dropInProgram)} Registration Fee${feeLines.length > 1 ? "s" : ""}`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const feeCents = coverFees
      ? paymentMethod === "ach"
        ? Math.min(Math.round(totalBaseCents * 0.008), 500)
        : Math.round((totalBaseCents + 30) / (1 - 0.029)) - totalBaseCents
      : 0;

    const processingFeeName =
      paymentMethod === "ach"
        ? "ACH processing fee"
        : feeLines.length > 1
          ? "Registration fee processing fee"
          : "Card processing fee";

    const lineItems = [
      ...feeLines.map((line) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: line.cents,
          product_data: {
            name: line.name,
            description: line.description,
          },
        },
      })),
      ...(coverFees
        ? [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: feeCents,
                product_data: { name: processingFeeName },
              },
            },
          ]
        : []),
    ];

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
        payment_type: "registration_fee",
        program,
        ...(dropInProgram ? { drop_in_program: dropInProgram } : {}),
        description,
        parent_id: parentId,
        student_id: studentId,
        application_id: applicationId,
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
    console.error("Registration checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
