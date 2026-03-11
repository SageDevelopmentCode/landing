import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  coverFees: z.boolean().optional().default(false),
  program: z
    .enum(["summer_26", "school_year_26_27", "both"])
    .default("summer_26"),
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
      program,
    } = validated;

    const summerCents = 7500;
    const schoolCents = 50000;
    const totalBaseCents =
      program === "both"
        ? summerCents + schoolCents
        : program === "school_year_26_27"
          ? schoolCents
          : summerCents;

    const description =
      program === "both"
        ? "Summer 2026 + School Year 2026–27 Registration Fees"
        : program === "school_year_26_27"
          ? "School Year 2026–27 Registration Fee"
          : "Summer 2026 Registration Fee";

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    let lineItems;

    if (program === "both") {
      const feeCents = coverFees
        ? Math.round((totalBaseCents + 30) / (1 - 0.029)) - totalBaseCents
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
                  product_data: { name: "Registration fee processing fee" },
                },
              } as const,
            ]
          : []),
      ];
    } else {
      const finalAmountCents = coverFees
        ? Math.round((totalBaseCents + 30) / (1 - 0.029))
        : totalBaseCents;
      const productName =
        program === "school_year_26_27"
          ? "School Year 2026–27 Registration Fee"
          : "Summer 2026 Registration Fee";
      const productDescription =
        program === "school_year_26_27"
          ? "Sage Field Private School — 2026–27 school year registration"
          : "Sage Field Private School — Summer 2026 program registration";
      lineItems = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: finalAmountCents,
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
        },
      ];
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      customer_email: parentEmail,
      line_items: lineItems,
      metadata: {
        payment_type: "registration_fee",
        program,
        description,
        parent_id: parentId,
        student_id: studentId,
        application_id: applicationId,
        cover_fees: String(coverFees),
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
