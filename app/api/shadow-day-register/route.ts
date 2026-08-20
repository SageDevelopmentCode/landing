import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createErrorEmbed } from "@/app/lib/discord";
import {
  isShadowDayBookable,
  parseIsoDate,
} from "@/app/lib/academic-calendar-data";

const schema = z.object({
  parentName: z.string().min(1, "Parent name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  children: z
    .array(
      z.object({
        name: z.string().min(1, "Child name required"),
        age: z.number().int().min(4).max(11),
      }),
    )
    .min(1, "At least one child required"),
  selectedDate: z.string().min(1, "Shadow day date required"),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  consentOutdoor: z.boolean(),
  consentPhoto: z.boolean(),
  interestedInEnrollment: z.boolean(),
  signatureName: z.string().min(1, "Signature required"),
});

export async function POST(request: NextRequest) {
  let data: z.infer<typeof schema> | undefined;
  try {
    const body = await request.json();
    data = schema.parse(body);

    const selectedDate = parseIsoDate(data.selectedDate);
    if (!isShadowDayBookable(selectedDate)) {
      return NextResponse.json(
        { error: "Selected date is not available." },
        { status: 400 },
      );
    }

    const PRICE_PER_CHILD_CENTS = 2000; // $20
    const BASE_AMOUNT_CENTS = data.children.length * PRICE_PER_CHILD_CENTS;
    const childNames = data.children.map((c) => c.name).join(", ");

    const adminClient = createAdminClient();

    // Upsert booking — conflict on email (guest flow, no user_id)
    const { data: booking, error: bookingError } = await adminClient
      .schema("marketing")
      .from("shadow_day_bookings")
      .upsert(
        {
          user_id: null,
          shadow_date: data.selectedDate,
          first_name: data.parentName.split(" ")[0] ?? data.parentName,
          last_name: data.parentName.split(" ").slice(1).join(" ") || null,
          email: data.email,
          phone: data.phone || null,
          child_name: childNames,
          child_grade: null,
          child_age: data.children[0].age,
          referral_source: data.referralSource || null,
          notes: data.notes || null,
          emergency_name: data.emergencyName || null,
          emergency_phone: data.emergencyPhone || null,
          consent_outdoor: data.consentOutdoor,
          consent_photo: data.consentPhoto,
          interested_in_enrollment: data.interestedInEnrollment,
          signature_name: data.signatureName,
          payment_status: "pending",
          source: "shadow_page",
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();

    if (bookingError) {
      console.error("Shadow day booking upsert error:", bookingError);
      sendDiscordNotification(
        createErrorEmbed({
          context: "Shadow Day Register — DB upsert",
          error: bookingError.message,
          details: { email: data.email, childNames },
        }),
      ).catch(() => {});
      return NextResponse.json(
        { error: "Failed to save booking. Please try again." },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.email,
      payment_intent_data: {
        receipt_email: data.email,
      },
      line_items: [
        {
          quantity: data.children.length,
          price_data: {
            currency: "usd",
            unit_amount: PRICE_PER_CHILD_CENTS,
            product_data: {
              name: "Shadow Day Visit Fee",
              description: "Sage Field Private School — shadow day visit",
            },
          },
        },
      ],
      metadata: {
        payment_type: "shadow_day_fee",
        booking_id: booking.id,
        parent_email: data.email,
        child_names: childNames,
        child_count: String(data.children.length),
        intended_amount_cents: String(BASE_AMOUNT_CENTS),
        description: "Shadow Day Fee",
      },
      success_url: `${baseUrl}/shadow/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shadow#reserve`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("Shadow day register error:", error);
    sendDiscordNotification(
      createErrorEmbed({
        context: "Shadow Day Register — Stripe session creation",
        error: error instanceof Error ? error.message : String(error),
        details: {
          email: data?.email ?? "unknown",
          childNames: data?.children?.map((c) => c.name).join(", ") ?? "unknown",
        },
      }),
    ).catch(() => {});
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
