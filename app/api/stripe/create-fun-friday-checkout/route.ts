import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { getOrCreateStripeCustomer } from "@/app/lib/stripe-customer";

const FUN_FRIDAY_MONTHLY_CENTS = 20000; // $200/month (4 sessions)
const FUN_FRIDAY_DROPIN_CENTS = 6000; // $60/session

const FUN_FRIDAY_MONTHS = [
  { key: "may", label: "May 2026", fridayCount: 1 },
  { key: "jun", label: "June 2026", fridayCount: 4 },
  { key: "jul", label: "July 2026", fridayCount: 5 },
  { key: "aug", label: "August 2026", fridayCount: 2 },
];

const MONTH_LABELS: Record<string, string> = {
  may: "May 2026",
  jun: "June 2026",
  jul: "July 2026",
  aug: "August 2026",
};

const schema = z.object({
  parentId: z.string(),
  parentEmail: z.string().email("Valid email required"),
  studentId: z.string(),
  applicationId: z.string(),
  planType: z.enum(["monthly", "dropin"]),
  // For monthly: array of month keys e.g. ["may", "jun"]
  selectedMonths: z.array(z.string()).default([]),
  // For drop-in: array of ISO date strings e.g. ["2026-05-29", "2026-06-05"]
  selectedFridays: z.array(z.string()).default([]),
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
      applicationId,
      planType,
      selectedMonths,
      selectedFridays,
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
      description = `Fun Friday — ${selectedMonths.length} month${selectedMonths.length !== 1 ? "s" : ""} (${monthLabels})`;
      for (const monthKey of selectedMonths) {
        const month = FUN_FRIDAY_MONTHS.find((m) => m.key === monthKey);
        const count = month?.fridayCount ?? 1;
        const isMonthlyRate = count >= 4;
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: isMonthlyRate ? FUN_FRIDAY_MONTHLY_CENTS : count * FUN_FRIDAY_DROPIN_CENTS,
            product_data: {
              name: `Fun Friday — ${MONTH_LABELS[monthKey] ?? monthKey}`,
              description: isMonthlyRate
                ? "9:00 AM – 1:00 PM · Package of 4 Fridays"
                : `9:00 AM – 1:00 PM · ${count} drop-in session${count !== 1 ? "s" : ""}`,
            },
          },
        });
      }
    } else {
      description = `Fun Friday — ${selectedFridays.length} session${selectedFridays.length !== 1 ? "s" : ""}`;
      lineItems.push({
        quantity: selectedFridays.length,
        price_data: {
          currency: "usd",
          unit_amount: FUN_FRIDAY_DROPIN_CENTS,
          product_data: {
            name: `Fun Friday — Drop-in (${selectedFridays.length} session${selectedFridays.length !== 1 ? "s" : ""})`,
            description: `Dates: ${selectedFridays.join(", ")} · 9:00 AM – 1:00 PM`,
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
          payment_type: "fun_friday_tuition",
          parent_id: parentId,
          parent_email: parentEmail,
          student_id: studentId,
          application_id: applicationId,
          plan_type: planType,
          selected_months: selectedMonths.join(","),
          selected_fridays: selectedFridays.join(","),
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
        payment_type: "fun_friday_tuition",
        parent_id: parentId,
        parent_email: parentEmail,
        student_id: studentId,
        application_id: applicationId,
        plan_type: planType,
        selected_months: selectedMonths.join(","),
        selected_fridays: selectedFridays.join(","),
        cover_fees: String(coverFees),
        payment_method: paymentMethod,
        intended_amount_cents: String(intendedAmountCents),
        description,
      },
      success_url: `${baseUrl}/parent/billing/fun-friday-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Fun Friday checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
