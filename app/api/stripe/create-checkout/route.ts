import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";

const checkoutSchema = z.object({
  amount: z.number().int().min(100, "Minimum donation is $1"),
  donorName: z.string().max(100).optional(),
  donorEmail: z.string().email("Valid email required"),
  message: z.string().max(500).optional(),
  coverFees: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    const { amount, donorName, donorEmail, message, coverFees } = validated;

    // If donor wants to cover fees, adjust amount so school receives full intended amount
    const finalAmountCents = coverFees
      ? Math.round((amount + 30) / (1 - 0.029))
      : amount;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      payment_method_types: ["card"],
      customer_email: donorEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: finalAmountCents,
            product_data: {
              name: "Donation to Sage Field",
              description:
                "Supporting outdoor learning and community growth in Central Texas",
              images: [],
            },
          },
        },
      ],
      metadata: {
        payment_type: "donation",
        description: "Donation to Sage Field",
        donor_name: donorName || "",
        donor_email: donorEmail,
        message: message || "",
        intended_amount_cents: String(amount),
        cover_fees: String(coverFees),
      },
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/donate`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
