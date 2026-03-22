import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  children: z.array(
    z.object({
      studentId: z.string(),
      applicationId: z.string(),
      program: z.enum(["summer_26", "school_year_26_27", "both", "homeschool_drop_in"]),
      dropInProgram: z.enum(["summer_26", "school_year_26_27", "both"]).optional(),
      childName: z.string(),
    }),
  ),
});

const summerCents = 7500;
const schoolCents = 50000;

function programCents(program: string, dropInProgram?: string): number {
  const billing = program === "homeschool_drop_in" ? (dropInProgram ?? "summer_26") : program;
  if (billing === "both") return summerCents + schoolCents;
  if (billing === "school_year_26_27") return schoolCents;
  return summerCents;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const { parentId, parentEmail, coverFees, paymentMethod, children } = validated;

    const totalBaseCents = children.reduce(
      (sum, c) => sum + programCents(c.program, c.dropInProgram),
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
      const billing = child.program === "homeschool_drop_in" ? (child.dropInProgram ?? "summer_26") : child.program;
      if (billing === "both") {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: summerCents,
            product_data: {
              name: `${child.childName} — Summer 2026 Registration Fee`,
              description:
                "Sage Field Private School — Summer 2026 program registration",
            },
          },
        });
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: schoolCents,
            product_data: {
              name: `${child.childName} — School Year 2026–27 Registration Fee`,
              description:
                "Sage Field Private School — 2026–27 school year registration",
            },
          },
        });
      } else {
        const name =
          billing === "school_year_26_27"
            ? `${child.childName} — School Year 2026–27 Registration Fee`
            : `${child.childName} — Summer 2026 Registration Fee`;
        const description =
          billing === "school_year_26_27"
            ? "Sage Field Private School — 2026–27 school year registration"
            : "Sage Field Private School — Summer 2026 program registration";
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: programCents(child.program, child.dropInProgram),
            product_data: { name, description },
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

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      customer_email: parentEmail,
      payment_intent_data: {
        receipt_email: parentEmail,
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
