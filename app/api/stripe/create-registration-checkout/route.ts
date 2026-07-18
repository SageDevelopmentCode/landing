import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  program: z
    .enum(["summer_26", "school_year_26_27", "both", "homeschool_drop_in"])
    .default("summer_26"),
  dropInProgram: z
    .enum(["summer_26", "school_year_26_27", "both"])
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

    const billingProgram = program === "homeschool_drop_in" ? (dropInProgram ?? "summer_26") : program;

    const summerCents = 7500;
    const schoolCents = 50000;
    const totalBaseCents =
      billingProgram === "both"
        ? summerCents + schoolCents
        : billingProgram === "school_year_26_27"
          ? schoolCents
          : summerCents;

    const description =
      billingProgram === "both"
        ? "Summer 2026 + School Year 2026–27 Registration Fees"
        : billingProgram === "school_year_26_27"
          ? "School Year 2026–27 Registration Fee"
          : "Summer 2026 Registration Fee";

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    let lineItems;

    if (billingProgram === "both") {
      const feeCents = coverFees
        ? paymentMethod === "ach"
          ? Math.min(Math.round(totalBaseCents * 0.008), 500)
          : Math.round((totalBaseCents + 30) / (1 - 0.029)) - totalBaseCents
        : 0;
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: summerCents,
            product_data: {
              name: "Summer 2026 Registration Fee",
              description:
                "Sage Field Private School — Summer 2026 program registration",
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: schoolCents,
            product_data: {
              name: "School Year 2026–27 Registration Fee",
              description:
                "Sage Field Private School — 2026–27 school year registration",
            },
          },
        },
        ...(coverFees
          ? [
              {
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
              } as const,
            ]
          : []),
      ];
    } else {
      const productName =
        billingProgram === "school_year_26_27"
          ? "School Year 2026–27 Registration Fee"
          : "Summer 2026 Registration Fee";
      const productDescription =
        billingProgram === "school_year_26_27"
          ? "Sage Field Private School — 2026–27 school year registration"
          : "Sage Field Private School — Summer 2026 program registration";

      if (coverFees && paymentMethod === "ach") {
        const feeCents = Math.min(Math.round(totalBaseCents * 0.008), 500);
        lineItems = [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: totalBaseCents,
              product_data: { name: productName, description: productDescription },
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
        const feeCents =
          Math.round((totalBaseCents + 30) / (1 - 0.029)) - totalBaseCents;
        lineItems = [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: totalBaseCents,
              product_data: { name: productName, description: productDescription },
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
              unit_amount: totalBaseCents,
              product_data: {
                name: productName,
                description: productDescription,
              },
            },
          },
        ];
      }
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
