import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const AFTERCARE_DAILY_CENTS = 3500; // $35/day
const AFTERCARE_MONTHLY_CENTS = 37500; // $375/month

const AFTERCARE_MONTHS = [
  { key: "may", label: "May 2026", dayCount: 5 },
  { key: "jun", label: "June 2026", dayCount: 21 },
  { key: "jul", label: "July 2026", dayCount: 22 },
  { key: "aug", label: "August 2026", dayCount: 9 },
];

const NORMAL_MONTH_DAY_THRESHOLD = 15;

function aftercareMonthCents(dayCount: number): number {
  return dayCount < NORMAL_MONTH_DAY_THRESHOLD
    ? dayCount * AFTERCARE_DAILY_CENTS
    : AFTERCARE_MONTHLY_CENTS;
}

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  planType: z.enum(["monthly", "daily"]),
  // For monthly: array of month keys e.g. ["may", "jun"]
  selectedMonths: z.array(z.string()).default([]),
  // For daily: array of ISO date strings e.g. ["2026-05-26", "2026-05-27"]
  selectedDays: z.array(z.string()).default([]),
  intendedAmountCents: z.number().int().positive(),
  coverFees: z.boolean().optional().default(false),
  paymentMethod: z.enum(["card", "ach"]).optional().default("card"),
  mobile: z.boolean().optional().default(false),
});

const MONTH_LABELS: Record<string, string> = {
  may: "May 2026",
  jun: "June 2026",
  jul: "July 2026",
  aug: "August 2026",
};

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
      selectedMonths,
      selectedDays,
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
    }[] = [];

    let description = "";

    if (planType === "monthly") {
      const monthLabels = selectedMonths.map((k) => MONTH_LABELS[k] ?? k).join(", ");
      description = `After Care — ${selectedMonths.length} month${selectedMonths.length !== 1 ? "s" : ""} (${monthLabels})`;
      for (const monthKey of selectedMonths) {
        const month = AFTERCARE_MONTHS.find((m) => m.key === monthKey);
        const unitAmount = month ? aftercareMonthCents(month.dayCount) : AFTERCARE_MONTHLY_CENTS;
        const isReduced = unitAmount < AFTERCARE_MONTHLY_CENTS;
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: `After Care — ${MONTH_LABELS[monthKey] ?? monthKey}`,
              description: isReduced
                ? `3:00 PM – 6:00 PM · ${month?.dayCount} days`
                : "3:00 PM – 6:00 PM",
            },
          },
        });
      }
    } else {
      description = `After Care — ${selectedDays.length} day${selectedDays.length !== 1 ? "s" : ""}`;
      lineItems.push({
        quantity: selectedDays.length,
        price_data: {
          currency: "usd",
          unit_amount: AFTERCARE_DAILY_CENTS,
          product_data: {
            name: `After Care — Daily (${selectedDays.length} day${selectedDays.length !== 1 ? "s" : ""})`,
            description: `Days: ${selectedDays.join(", ")} · 3:00 PM – 6:00 PM`,
          },
        },
      });
    }

    if (coverFees) {
      const feeCents =
        paymentMethod === "ach"
          ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
          : Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents;

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

    const stripeCustomerId = await getOrCreateStripeCustomer(parentId, parentEmail);

    if (mobile) {
      const mobileFee = coverFees
        ? paymentMethod === "ach"
          ? Math.min(Math.round(intendedAmountCents * 0.008), 500)
          : Math.round((intendedAmountCents + 30) / (1 - 0.029)) - intendedAmountCents
        : 0;
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: intendedAmountCents + mobileFee,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method_types: ["card", "us_bank_account"],
        receipt_email: parentEmail,
        setup_future_usage: "off_session",
        metadata: {
          payment_type: "aftercare_tuition",
          parent_id: parentId,
          parent_email: parentEmail,
          student_id: studentId,
          application_id: applicationId,
          plan_type: planType,
          selected_months: selectedMonths.join(","),
          selected_days: selectedDays.join(","),
          cover_fees: String(coverFees),
          payment_method: paymentMethod,
          intended_amount_cents: String(intendedAmountCents),
          description,
        },
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
      metadata: {
        payment_type: "aftercare_tuition",
        parent_id: parentId,
        parent_email: parentEmail,
        student_id: studentId,
        application_id: applicationId,
        plan_type: planType,
        selected_months: selectedMonths.join(","),
        selected_days: selectedDays.join(","),
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(intendedAmountCents),
        description,
      },
      success_url: `${baseUrl}/parent/billing/aftercare-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Aftercare checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
