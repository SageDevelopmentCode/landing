import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import { createAdminClient } from "@/app/lib/supabase-server";
import Stripe from "stripe";
import {
  createRegistrationFeeEmbed,
  createSummerTuitionEmbed,
  createAftercareTuitionEmbed,
  createFunFridayTuitionEmbed,
  createHomeschoolDropInEmbed,
  createDonationEmbed,
  createErrorEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  buildRegistrationFeeConfirmationEmail,
  buildSummerTuitionConfirmationEmail,
  buildHomeschoolDropInConfirmationEmail,
  buildDonationConfirmationEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

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
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const supabase = createAdminClient();

    // Backfill stripe_customer_id if missing (safety net for helper failures)
    const parentIdForCustomer = session.metadata?.parent_id;
    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    if (parentIdForCustomer && stripeCustomerId) {
      await supabase
        .schema("admin")
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", parentIdForCustomer)
        .is("stripe_customer_id", null);
    }

    if (session.metadata?.payment_type === "registration_fee") {
      const applicationIdsStr = session.metadata?.application_ids; // combined
      const applicationId = session.metadata?.application_id; // individual

      if (applicationIdsStr) {
        // Combined payment: update all application IDs
        const ids = applicationIdsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        for (const appId of ids) {
          const { error } = await supabase
            .schema("parent_app")
            .from("applications")
            .update({ registration_fee_paid: true })
            .eq("id", appId);

          if (error) {
            console.error(
              `Failed to update registration fee for app ${appId}:`,
              error,
            );
          }
        }

        // Fetch first application for parent name/email
        const { data: firstApplication } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("g1_full_name, g1_email, child_legal_name, program")
          .eq("id", ids[0])
          .single();

        // Fetch all applications for child name list
        const { data: allApplications } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("child_legal_name, preferred_name, program")
          .in("id", ids);

        const programMap: Record<string, string> = {
          summer_26: "Summer 2026",
          school_year_26_27: "School Year 2026-27",
          both: "Summer 2026 & School Year 2026-27",
          homeschool_drop_in: "Homeschool Drop-In",
        };

        const childSummary = (allApplications ?? [])
          .map((a) => {
            const name = a.preferred_name ?? a.child_legal_name ?? "Student";
            const prog = programMap[a.program ?? ""] ?? a.program ?? "N/A";
            return `${name} (${prog})`;
          })
          .join(", ");

        const amountCents = session.amount_total ?? 0;
        const amountDollars = (amountCents / 100).toFixed(2);

        // Discord notification (non-blocking)
        sendDiscordNotification(
          createRegistrationFeeEmbed({
            parentName: firstApplication?.g1_full_name ?? "N/A",
            parentEmail:
              firstApplication?.g1_email ?? session.customer_email ?? "N/A",
            childName: childSummary || "Multiple children",
            program: "Combined payment",
            amountCents,
          }),
        ).catch((err) =>
          console.error("Discord notification failed:", err),
        );

        // Email notification (non-blocking, with error embed fallback)
        (async () => {
          try {
            const toAddress =
              firstApplication?.g1_email ?? session.customer_email ?? "";
            if (!toAddress) return;

            const { subject, content } =
              await buildRegistrationFeeConfirmationEmail({
                g1FullName: firstApplication?.g1_full_name ?? "Parent",
                childLegalName: childSummary || "your children",
                program: "all enrolled programs",
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
                application_id: null,
                status: "success",
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
            console.error(
              "Combined registration fee confirmation email failed:",
              err,
            );
            sendDiscordNotification(
              createErrorEmbed({
                context: "Combined registration fee confirmation email",
                error: String(err),
                details: { applicationIds: ids.join(",") },
              }),
            ).catch(() => {});
          }
        })();
      } else if (applicationId) {
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
          homeschool_drop_in: "Homeschool Drop-In",
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
                status: "success",
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
    } else if (session.metadata?.payment_type === "summer_tuition") {
      const applicationId = session.metadata?.application_id;
      const studentId = session.metadata?.student_id;
      const planType = (session.metadata?.plan_type ?? "full") as "weekly" | "full";
      const weeksStr = session.metadata?.weeks ?? "";
      const weeks = weeksStr
        ? weeksStr.split(",").map(Number).filter((n: number) => !isNaN(n))
        : [];
      const amountCents = session.amount_total ?? 0;
      const amountDollars = (amountCents / 100).toFixed(2);

      // Fetch application for parent/child names
      let parentName = "N/A";
      let parentEmailAddr = session.customer_email ?? "N/A";
      let childName = "N/A";

      if (applicationId) {
        const { data: application } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("g1_full_name, g1_email, child_legal_name")
          .eq("id", applicationId)
          .single();

        if (application) {
          parentName = application.g1_full_name ?? "N/A";
          parentEmailAddr = application.g1_email ?? session.customer_email ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createSummerTuitionEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          planType,
          amountCents,
          weeks: weeks.length > 0 ? weeks : undefined,
        }),
      ).catch((err) => console.error("Summer tuition Discord notification failed:", err));

      // Email confirmation (non-blocking, with error embed fallback)
      (async () => {
        try {
          const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
          if (!toAddress) return;

          const { subject, content } = await buildSummerTuitionConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            amountDollars,
            weeks: weeks.length > 0 ? weeks : undefined,
          });

          const emailResult = await sendZohoEmail({ toAddress, subject, content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject,
              template: "summer_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Summer tuition confirmation email failed:", err);
          sendDiscordNotification(
            createErrorEmbed({
              context: "Summer tuition confirmation email",
              error: String(err),
              details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" },
            }),
          ).catch(() => {});
        }
      })();
    } else if (session.metadata?.payment_type === "aftercare_tuition") {
      const applicationId = session.metadata?.application_id;
      const studentId = session.metadata?.student_id;
      const planType = (session.metadata?.plan_type ?? "monthly") as "monthly" | "daily";
      const selectedMonths = session.metadata?.selected_months
        ? session.metadata.selected_months.split(",").filter(Boolean)
        : [];
      const selectedDays = session.metadata?.selected_days
        ? session.metadata.selected_days.split(",").filter(Boolean)
        : [];
      const amountCents = session.amount_total ?? 0;

      // Fetch parent/child names
      let parentName = "N/A";
      let parentEmailAddr = session.customer_email ?? "N/A";
      let childName = "N/A";

      if (applicationId) {
        const { data: application } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("g1_full_name, g1_email, child_legal_name")
          .eq("id", applicationId)
          .single();

        if (application) {
          parentName = application.g1_full_name ?? "N/A";
          parentEmailAddr = application.g1_email ?? session.customer_email ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createAftercareTuitionEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          planType,
          amountCents,
          selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined,
          selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
        }),
      ).catch((err) => console.error("Aftercare Discord notification failed:", err));
    } else if (session.metadata?.payment_type === "homeschool_dropin") {
      const applicationId = session.metadata?.application_id;
      const studentId = session.metadata?.student_id;
      const program = session.metadata?.program ?? "summer_26";
      const tier = session.metadata?.tier ?? "dropin";
      const selectedDays = session.metadata?.selected_days
        ? session.metadata.selected_days.split(",").filter(Boolean)
        : [];
      const selectedWeeks = session.metadata?.selected_weeks
        ? session.metadata.selected_weeks.split(",").map(Number).filter(Boolean)
        : [];
      const amountCents = session.amount_total ?? 0;
      const amountDollars = (amountCents / 100).toFixed(2);

      // Fetch parent/child names
      let parentName = "N/A";
      let parentEmailAddr = session.customer_email ?? "N/A";
      let childName = "N/A";

      if (applicationId) {
        const { data: application } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("g1_full_name, g1_email, child_legal_name")
          .eq("id", applicationId)
          .single();

        if (application) {
          parentName = application.g1_full_name ?? "N/A";
          parentEmailAddr = application.g1_email ?? session.customer_email ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createHomeschoolDropInEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          program,
          tier,
          selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
          selectedWeeks: selectedWeeks.length > 0 ? selectedWeeks : undefined,
          amountCents,
        }),
      ).catch((err) => console.error("Homeschool drop-in Discord notification failed:", err));

      // Email confirmation (non-blocking, with error embed fallback)
      (async () => {
        try {
          const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
          if (!toAddress) return;

          const { subject, content } = await buildHomeschoolDropInConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            program,
            tier,
            selectedDays,
            selectedWeeks,
            amountDollars,
          });

          const emailResult = await sendZohoEmail({ toAddress, subject, content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject,
              template: "homeschool_dropin_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Homeschool drop-in confirmation email failed:", err);
          sendDiscordNotification(
            createErrorEmbed({
              context: "Homeschool drop-in confirmation email",
              error: String(err),
              details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" },
            }),
          ).catch(() => {});
        }
      })();
    } else if (session.metadata?.payment_type === "fun_friday_tuition") {
      const applicationId = session.metadata?.application_id;
      const studentId = session.metadata?.student_id;
      const planType = (session.metadata?.plan_type ?? "monthly") as "monthly" | "dropin";
      const selectedMonths = session.metadata?.selected_months
        ? session.metadata.selected_months.split(",").filter(Boolean)
        : [];
      const selectedFridays = session.metadata?.selected_fridays
        ? session.metadata.selected_fridays.split(",").filter(Boolean)
        : [];
      const amountCents = session.amount_total ?? 0;

      // Fetch parent/child names
      let parentName = "N/A";
      let parentEmailAddr = session.customer_email ?? "N/A";
      let childName = "N/A";

      if (applicationId) {
        const { data: application } = await supabase
          .schema("parent_app")
          .from("applications")
          .select("g1_full_name, g1_email, child_legal_name")
          .eq("id", applicationId)
          .single();

        if (application) {
          parentName = application.g1_full_name ?? "N/A";
          parentEmailAddr = application.g1_email ?? session.customer_email ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createFunFridayTuitionEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          planType,
          amountCents,
          selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined,
          selectedFridays: selectedFridays.length > 0 ? selectedFridays : undefined,
        }),
      ).catch((err) => console.error("Fun Friday Discord notification failed:", err));
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

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createDonationEmbed({
          donorName,
          donorEmail,
          amountCents,
          message: donationMessage,
          coverFees,
        }),
      ).catch((err) =>
        console.error("Discord donation notification failed:", err),
      );

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

            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: donorEmail,
                subject,
                template: "donation_confirmation",
                status: "success",
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
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
            session.metadata?.parent_email || session.metadata?.donor_email || session.customer_email || "",
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

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const failureMessage = intent.last_payment_error?.message ?? "Unknown error";
    const amountCents = intent.amount ?? 0;
    const parentEmail = intent.metadata?.parent_email ?? intent.receipt_email ?? "N/A";

    sendDiscordNotification(
      createErrorEmbed({
        context: "Payment failed",
        error: failureMessage,
        details: {
          parentEmail,
          amount: `$${(amountCents / 100).toFixed(2)}`,
          paymentIntentId: intent.id,
        },
      }),
    ).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
