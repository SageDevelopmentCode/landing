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
  siblingStudentIds: z.array(z.string()).optional().default([]),
  siblingBundleStudentIds: z.array(z.string()).optional().default([]),
  siblingGrades: z.array(z.string()).optional().default([]),
  siblingBundleAmounts: z.array(z.number().int()).optional().default([]),
  siblingHomeschoolBundleStudentIds: z.array(z.string()).optional().default([]),
  siblingHomeschoolBundleAmounts: z
    .array(z.number().int())
    .optional()
    .default([]),
  siblingHomeschoolApplicationIds: z.array(z.string()).optional().default([]),
  siblingHomeschoolGradeTiers: z
    .array(z.enum(["primary", "upper"]))
    .optional()
    .default([]),
  bundleHomeschoolTier: z.enum(["dropin", "2day", "3day"]).optional(),
  bundleHomeschoolGradeTier: z.enum(["primary", "upper"]).optional(),
  bundleHomeschoolApplicationId: z.string().optional(),
  bundleHomeschoolSelectedDays: z
    .array(z.number().int())
    .optional()
    .default([]),
  bundleHomeschoolWeekSelectionsJson: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const {
      parentId,
      parentEmail,
      studentId,
      coverFees,
      paymentMethod,
      bundleType,
      bundleAmountCents,
      bundleMonthIndex,
      siblingStudentIds,
      siblingBundleStudentIds,
      siblingGrades,
      siblingBundleAmounts,
      siblingHomeschoolBundleStudentIds,
      siblingHomeschoolBundleAmounts,
      siblingHomeschoolApplicationIds,
      siblingHomeschoolGradeTiers,
      bundleHomeschoolTier,
      bundleHomeschoolGradeTier,
      bundleHomeschoolApplicationId,
      bundleHomeschoolSelectedDays,
      bundleHomeschoolWeekSelectionsJson,
    } = validated;

    const supplyFeeCents = 30000;
    const primaryBundleCents =
      bundleType && bundleAmountCents ? bundleAmountCents : 0;
    const siblingSupplyTotal = supplyFeeCents * siblingStudentIds.length;
    const siblingSchoolYearBundleTotal = siblingBundleAmounts.reduce(
      (sum, a) => sum + a,
      0,
    );
    const siblingHomeschoolBundleTotal = siblingHomeschoolBundleAmounts.reduce(
      (sum, a) => sum + a,
      0,
    );
    const baseCents =
      supplyFeeCents +
      primaryBundleCents +
      siblingSupplyTotal +
      siblingSchoolYearBundleTotal +
      siblingHomeschoolBundleTotal;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const primarySupplyFeeLineItem = {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: supplyFeeCents,
        product_data: {
          name: "Annual Supply Fee",
          description:
            "Sage Field Private School — School Year 2026–27 annual supply fee",
        },
      },
    };

    const primaryBundleLineItem =
      primaryBundleCents > 0
        ? {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: primaryBundleCents,
              product_data: {
                name:
                  bundleType === "school_year_tuition"
                    ? "August 2026 Tuition"
                    : "Homeschool Drop-In — First Month",
                description: "Sage Field Private School — School Year 2026–27",
              },
            },
          }
        : null;

    const siblingLineItems = siblingStudentIds.flatMap((sibId, i) => {
      const items: {
        quantity: number;
        price_data: {
          currency: string;
          unit_amount: number;
          product_data: { name: string; description?: string };
        };
      }[] = [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: supplyFeeCents,
            product_data: {
              name: "Annual Supply Fee — Sibling",
              description: `Sage Field Private School — School Year 2026–27${siblingGrades[i] ? ` · ${siblingGrades[i]}` : ""}`,
            },
          },
        },
      ];
      const schoolYearBundleIdx = siblingBundleStudentIds.indexOf(sibId);
      if (
        schoolYearBundleIdx >= 0 &&
        siblingBundleAmounts[schoolYearBundleIdx] > 0
      ) {
        items.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: siblingBundleAmounts[schoolYearBundleIdx],
            product_data: {
              name: "August 2026 Tuition — Sibling",
              description: `Sage Field Private School — School Year 2026–27${siblingGrades[i] ? ` · ${siblingGrades[i]}` : ""}`,
            },
          },
        });
      }
      const homeschoolBundleIdx =
        siblingHomeschoolBundleStudentIds.indexOf(sibId);
      if (
        homeschoolBundleIdx >= 0 &&
        siblingHomeschoolBundleAmounts[homeschoolBundleIdx] > 0
      ) {
        items.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: siblingHomeschoolBundleAmounts[homeschoolBundleIdx],
            product_data: {
              name: "Homeschool Drop-In — First Month — Sibling",
              description: `Sage Field Private School — School Year 2026–27${siblingGrades[i] ? ` · ${siblingGrades[i]}` : ""}`,
            },
          },
        });
      }
      return items;
    });

    const baseLineItems = [
      primarySupplyFeeLineItem,
      ...(primaryBundleLineItem ? [primaryBundleLineItem] : []),
      ...siblingLineItems,
    ];

    let lineItems;
    if (coverFees && paymentMethod === "ach") {
      const feeCents = Math.min(Math.round(baseCents * 0.008), 500);
      lineItems = [
        ...baseLineItems,
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
        ...baseLineItems,
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
      lineItems = baseLineItems;
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(
      parentId,
      parentEmail,
    );

    const hasHomeschoolBundleMeta =
      bundleHomeschoolTier != null ||
      siblingHomeschoolBundleStudentIds.length > 0;

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
        ...(bundleType
          ? {
              bundle_type: bundleType,
              bundle_amount_cents: String(primaryBundleCents),
              bundle_month_index:
                bundleMonthIndex != null ? String(bundleMonthIndex) : "",
            }
          : {}),
        ...(hasHomeschoolBundleMeta && bundleHomeschoolTier
          ? {
              bundle_homeschool_tier: bundleHomeschoolTier,
              bundle_homeschool_grade_tier: bundleHomeschoolGradeTier ?? "",
              bundle_homeschool_application_id:
                bundleHomeschoolApplicationId ?? "",
              bundle_homeschool_selected_days:
                bundleHomeschoolSelectedDays.join(","),
              bundle_homeschool_week_selections_json:
                bundleHomeschoolWeekSelectionsJson ?? "",
            }
          : {}),
        ...(siblingStudentIds.length > 0
          ? {
              sibling_supply_student_ids: siblingStudentIds.join(","),
              sibling_bundle_student_ids: siblingBundleStudentIds.join(","),
              sibling_bundle_amounts: siblingBundleAmounts.join(","),
            }
          : {}),
        ...(siblingHomeschoolBundleStudentIds.length > 0
          ? {
              sibling_homeschool_bundle_student_ids:
                siblingHomeschoolBundleStudentIds.join(","),
              sibling_homeschool_bundle_amounts:
                siblingHomeschoolBundleAmounts.join(","),
              sibling_homeschool_application_ids:
                siblingHomeschoolApplicationIds.join(","),
              sibling_homeschool_grade_tiers:
                siblingHomeschoolGradeTiers.join(","),
            }
          : {}),
      },
      success_url: `${baseUrl}/parent/billing`,
      cancel_url: `${baseUrl}/parent/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("Supply fee checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
