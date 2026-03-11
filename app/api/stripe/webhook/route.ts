import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import Stripe from "stripe";
import {
  createRegistrationFeeEmbed,
  createDonationEmbed,
  createErrorEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  buildRegistrationFeeConfirmationEmail,
  buildDonationConfirmationEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "webhook/route.ts:entry",
      message: "H-A: Webhook POST received",
      data: {
        hasSignature: !!signature,
        secretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
        discordSet: !!process.env.DISCORD_WEBHOOK_URL,
        zohoSet: !!(
          process.env.ZOHO_REFRESH_TOKEN && process.env.ZOHO_CLIENT_ID
        ),
      },
      timestamp: Date.now(),
      hypothesisId: "H-A",
    }),
  }).catch(() => {});
  // #endregion

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "webhook/route.ts:sig-fail",
        message: "H-B: Signature FAILED",
        data: { error: String(err) },
        timestamp: Date.now(),
        hypothesisId: "H-B",
      }),
    }).catch(() => {});
    // #endregion
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "webhook/route.ts:sig-ok",
      message: "H-B: Signature OK — event type",
      data: { eventType: event.type },
      timestamp: Date.now(),
      hypothesisId: "H-B",
    }),
  }).catch(() => {});
  // #endregion

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const supabase = createAdminClient();

    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "webhook/route.ts:session",
        message: "H-E: session.completed — payment_type",
        data: {
          paymentType: session.metadata?.payment_type,
          sessionId: session.id,
        },
        timestamp: Date.now(),
        hypothesisId: "H-E",
      }),
    }).catch(() => {});
    // #endregion

    if (session.metadata?.payment_type === "registration_fee") {
      const applicationId = session.metadata?.application_id;
      if (applicationId) {
        const { error } = await supabase
          .schema("parent_app")
          .from("applications")
          .update({ registration_fee_paid: true })
          .eq("id", applicationId);

        if (error) {
          console.error("Failed to update registration fee status:", error);
          return NextResponse.json(
            { error: "Failed to update registration fee status" },
            { status: 500 },
          );
        }

        // Fetch application row for notification data
        const { data: application } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("g1_full_name, g1_email, child_legal_name, program")
          .eq("id", applicationId)
          .single();

        const programMap: Record<string, string> = {
          summer_26: "Summer 2026",
          school_year_26_27: "School Year 2026-27",
          both: "Summer 2026 & School Year 2026-27",
        };
        const programLabel =
          programMap[session.metadata?.program ?? ""] ||
          application?.program ||
          "N/A";
        const amountCents = session.amount_total ?? 0;
        const amountDollars = (amountCents / 100).toFixed(2);

        // Discord notification (non-blocking)
        sendDiscordNotification(
          createRegistrationFeeEmbed({
            parentName: application?.g1_full_name ?? "N/A",
            parentEmail:
              application?.g1_email ?? session.customer_email ?? "N/A",
            childName: application?.child_legal_name ?? "N/A",
            program: programLabel,
            amountCents,
          }),
        ).catch((err) => console.error("Discord notification failed:", err));

        // Email notification (non-blocking, with error embed fallback)
        (async () => {
          try {
            const toAddress =
              application?.g1_email ?? session.customer_email ?? "";
            if (!toAddress) return;

            const { subject, content } =
              await buildRegistrationFeeConfirmationEmail({
                g1FullName: application?.g1_full_name ?? "Parent",
                childLegalName: application?.child_legal_name ?? "your child",
                program: programLabel,
                amountDollars,
              });

            const emailResult = await sendZohoEmail({
              toAddress,
              subject,
              content,
            });

            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject,
                template: "registration_fee_confirmation",
                application_id: applicationId,
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
            console.error("Registration fee confirmation email failed:", err);
            sendDiscordNotification(
              createErrorEmbed({
                context: "Registration fee confirmation email",
                error: String(err),
                details: { applicationId },
              }),
            ).catch(() => {});
          }
        })();
      }
    } else {
      const donorEmail =
        session.metadata?.donor_email || session.customer_email || "";
      const donorName = session.metadata?.donor_name || undefined;
      const donationMessage = session.metadata?.message || undefined;
      const amountCents = session.amount_total ?? 0;
      const coverFees = session.metadata?.cover_fees === "true";

      const { error } = await supabase
        .schema("donations")
        .from("donations")
        .upsert(
          {
            stripe_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
            amount_cents: amountCents,
            currency: session.currency ?? "usd",
            donor_name: donorName || null,
            donor_email: donorEmail,
            message: donationMessage || null,
            status: "completed",
          },
          { onConflict: "stripe_session_id" },
        );

      if (error) {
        console.error("Failed to record donation:", error);
        return NextResponse.json(
          { error: "Failed to record donation" },
          { status: 500 },
        );
      }

      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "webhook/route.ts:donation-start",
            message: "H-C,H-D: donation branch reached",
            data: {
              donorEmail,
              discordSet: !!process.env.DISCORD_WEBHOOK_URL,
              zohoSet: !!(
                process.env.ZOHO_REFRESH_TOKEN && process.env.ZOHO_CLIENT_ID
              ),
            },
            timestamp: Date.now(),
            hypothesisId: "H-C,H-D",
          }),
        },
      ).catch(() => {});
      // #endregion

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createDonationEmbed({
          donorName,
          donorEmail,
          amountCents,
          message: donationMessage,
          coverFees,
        }),
      )
        .then((ok) => {
          // #region agent log
          fetch(
            "http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "webhook/route.ts:discord-done",
                message: "H-C: Discord result",
                data: { success: ok },
                timestamp: Date.now(),
                hypothesisId: "H-C",
              }),
            },
          ).catch(() => {});
          // #endregion
        })
        .catch((err) => {
          // #region agent log
          fetch(
            "http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "webhook/route.ts:discord-err",
                message: "H-C: Discord threw",
                data: { error: String(err) },
                timestamp: Date.now(),
                hypothesisId: "H-C",
              }),
            },
          ).catch(() => {});
          // #endregion
          console.error("Discord donation notification failed:", err);
        });

      // Confirmation email (non-blocking, with error embed fallback)
      if (donorEmail) {
        (async () => {
          try {
            const amountDollars = (amountCents / 100).toFixed(2);
            const { subject, content } = await buildDonationConfirmationEmail({
              donorName,
              donorEmail,
              amountDollars,
              message: donationMessage,
            });

            const emailResult = await sendZohoEmail({
              toAddress: donorEmail,
              subject,
              content,
            });

            // #region agent log
            fetch(
              "http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: "webhook/route.ts:email-done",
                  message: "H-D: Zoho result",
                  data: {
                    success: emailResult.success,
                    error: emailResult.error ?? null,
                  },
                  timestamp: Date.now(),
                  hypothesisId: "H-D",
                }),
              },
            ).catch(() => {});
            // #endregion

            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: donorEmail,
                subject,
                template: "donation_confirmation",
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
            // #region agent log
            fetch(
              "http://127.0.0.1:7244/ingest/a31ec2ad-152f-4d45-8abb-fa0a042d78c8",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: "webhook/route.ts:email-catch",
                  message: "H-D: email IIFE caught error",
                  data: { error: String(err) },
                  timestamp: Date.now(),
                  hypothesisId: "H-D",
                }),
              },
            ).catch(() => {});
            // #endregion
            console.error("Donation confirmation email failed:", err);
            sendDiscordNotification(
              createErrorEmbed({
                context: "Donation confirmation email",
                error: String(err),
                details: { donorEmail, sessionId: session.id },
              }),
            ).catch(() => {});
          }
        })();
      }
    }

    // Shared write to billing.stripe_transactions for all payment types
    const { error: billingError } = await supabase
      .schema("billing")
      .from("stripe_transactions")
      .upsert(
        {
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          payment_type: session.metadata?.payment_type ?? "donation",
          amount_cents: session.amount_total ?? 0,
          intended_amount_cents: session.metadata?.intended_amount_cents
            ? parseInt(session.metadata.intended_amount_cents)
            : null,
          currency: session.currency ?? "usd",
          cover_fees: session.metadata?.cover_fees === "true",
          payer_name: session.metadata?.donor_name || null,
          payer_email:
            session.metadata?.donor_email || session.customer_email || "",
          description: session.metadata?.description || null,
          student_id: session.metadata?.student_id || null,
          application_id: session.metadata?.application_id || null,
          parent_id: session.metadata?.parent_id || null,
          metadata: session.metadata ?? {},
          status: "completed",
        },
        { onConflict: "stripe_session_id" },
      );

    if (billingError) {
      console.error("Failed to record billing transaction:", billingError);
    }
  }

  return NextResponse.json({ received: true });
}
