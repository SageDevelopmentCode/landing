import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const SUMMER_WEEKLY_CENTS = { primary: 37500, upper: 35000 };
const SUMMER_FULL_CENTS = { primary: 405000, upper: 378000 };

const siblingSchema = z.object({
  studentId: z.string(),
  applicationId: z.string(),
  planType: z.enum(["weekly", "full"]),
  selectedWeeks: z.array(z.number()).default([]),
  gradeTier: z.enum(["primary", "upper"]),
  intendedAmountCents: z.number().int().positive(),
  studentName: z.string().optional(),
});

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  planType: z.enum(["weekly", "full"]),
  selectedWeeks: z.array(z.number()).default([]),
  gradeTier: z.enum(["primary", "upper"]),
  intendedAmountCents: z.number().int().positive(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  siblings: z.array(siblingSchema).optional().default([]),
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
      applicationId,
      planType,
      selectedWeeks,
      gradeTier,
      intendedAmountCents,
      coverFees,
      paymentMethod,
      siblings,
      mobile,
    } = validated;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    // Build line items
    const lineItems: {
      quantity: number;
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
    }[] = [];

    if (planType === "full") {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: SUMMER_FULL_CENTS[gradeTier],
          product_data: {
            name: "Summer 2026 Tuition — Full Summer (12 Weeks)",
            description: "Sage Field Private School — May 26 – Aug 13, 2026",
          },
        },
      });
    } else {
      // Weekly: single line item with quantity = number of weeks
      lineItems.push({
        quantity: selectedWeeks.length,
        price_data: {
          currency: "usd",
          unit_amount: SUMMER_WEEKLY_CENTS[gradeTier],
          product_data: {
            name: `Summer 2026 Tuition — Weekly (${selectedWeeks.length} week${selectedWeeks.length !== 1 ? "s" : ""})`,
            description: `Weeks: ${selectedWeeks.join(", ")}`,
          },
        },
      });
    }

    // Add sibling line items
    for (const sib of siblings) {
      if (sib.planType === "full") {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: SUMMER_FULL_CENTS[sib.gradeTier],
            product_data: {
              name: `${sib.studentName ? sib.studentName + " — " : ""}Summer 2026 Tuition — Full Summer (12 Weeks)`,
              description: "Sage Field Private School — May 26 – Aug 13, 2026",
            },
          },
        });
      } else {
        lineItems.push({
          quantity: sib.selectedWeeks.length,
          price_data: {
            currency: "usd",
            unit_amount: SUMMER_WEEKLY_CENTS[sib.gradeTier],
            product_data: {
              name: `${sib.studentName ? sib.studentName + " — " : ""}Summer 2026 Tuition — Weekly (${sib.selectedWeeks.length} week${sib.selectedWeeks.length !== 1 ? "s" : ""})`,
              description: `Weeks: ${sib.selectedWeeks.join(", ")}`,
            },
          },
        });
      }
    }

    const totalIntendedCents = intendedAmountCents + siblings.reduce((sum, s) => sum + s.intendedAmountCents, 0);

    if (coverFees) {
      const feeCents =
        paymentMethod === "ach"
          ? Math.min(Math.round(totalIntendedCents * 0.008), 500)
          : Math.round((totalIntendedCents + 30) / (1 - 0.029)) - totalIntendedCents;

      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: feeCents,
          product_data: {
            name: paymentMethod === "ach" ? "ACH processing fee" : "Card processing fee",
          },
        },
      });
    }

    const description =
      planType === "full"
        ? "Summer 2026 Tuition — Full Summer"
        : `Summer 2026 Tuition — ${selectedWeeks.length} Week${selectedWeeks.length !== 1 ? "s" : ""}`;

    const stripeCustomerId = await getOrCreateStripeCustomer(parentId, parentEmail);

    if (mobile) {
      const mobileFee = coverFees
        ? paymentMethod === "ach"
          ? Math.min(Math.round(totalIntendedCents * 0.008), 500)
          : Math.round((totalIntendedCents + 30) / (1 - 0.029)) - totalIntendedCents
        : 0;
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: totalIntendedCents + mobileFee,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method_types: ["card", "us_bank_account"],
        receipt_email: parentEmail,
        setup_future_usage: "off_session",
        metadata: {
          payment_type: "summer_tuition",
          parent_id: parentId,
          parent_email: parentEmail,
          student_id: studentId,
          application_id: applicationId,
          plan_type: planType,
          weeks: planType === "weekly" ? selectedWeeks.join(",") : "1,2,3,4,5,6,7,8,9,10,11,12",
          grade_tier: gradeTier,
          cover_fees: String(coverFees),
          payment_method: paymentMethod,
          intended_amount_cents: String(totalIntendedCents),
          description,
        },
      });
      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
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
      metadata: {
        payment_type: "summer_tuition",
        parent_id: parentId,
        parent_email: parentEmail,
        student_id: studentId,
        application_id: applicationId,
        plan_type: planType,
        weeks: selectedWeeks.join(","),
        grade_tier: gradeTier,
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(totalIntendedCents),
        description,
        ...(siblings.length > 0 && {
          sibling_student_ids: siblings.map((s) => s.studentId).join(","),
          sibling_application_ids: siblings.map((s) => s.applicationId).join(","),
          sibling_plan_types: siblings.map((s) => s.planType).join(","),
          sibling_weeks: siblings.map((s) => s.selectedWeeks.join(";")).join(","),
          sibling_grade_tiers: siblings.map((s) => s.gradeTier).join(","),
          sibling_intended_cents: siblings.map((s) => String(s.intendedAmountCents)).join(","),
        }),
      },
      success_url: `${baseUrl}/parent/billing/summer-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Summer checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
