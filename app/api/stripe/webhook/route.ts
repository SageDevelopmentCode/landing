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
  createShadowDayPaymentEmbed,
  createBeachBashPaymentEmbed,
  createCustomTuitionEmbed,
  createSupplyFeeEmbed,
  createOneTimePaymentEmbed,
  createErrorEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  buildRegistrationFeeConfirmationEmail,
  buildSummerTuitionConfirmationEmail,
  buildHomeschoolDropInConfirmationEmail,
  buildDonationConfirmationEmail,
  buildShadowDayPaymentConfirmationEmail,
  buildBeachBashConfirmationEmail,
  buildAftercareConfirmationEmail,
  buildFunFridayConfirmationEmail,
  buildCustomTuitionConfirmationEmail,
  buildSupplyFeeConfirmationEmail,
  buildOneTimePaymentConfirmationEmail,
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
          const toAddress =
            firstApplication?.g1_email ?? session.customer_email ?? "";
          let subject: string | undefined;
          try {
            if (!toAddress) return;

            const built = await buildRegistrationFeeConfirmationEmail({
                g1FullName: firstApplication?.g1_full_name ?? "Parent",
                childLegalName: childSummary || "your children",
                program: "all enrolled programs",
                amountDollars,
              });
            subject = built.subject;

            const emailResult = await sendZohoEmail({
              toAddress,
              subject: built.subject,
              content: built.content,
            });

            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject: built.subject,
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
            if (toAddress) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject: subject ?? "registration_fee_confirmation (failed to build)",
                template: "registration_fee_confirmation",
                application_id: null,
                status: "error",
                error_message: String(err).slice(0, 500),
              }).then(undefined, () => {});
            }
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
          const toAddress =
            application?.g1_email ?? session.customer_email ?? "";
          let subject: string | undefined;
          try {
            if (!toAddress) return;

            const built = await buildRegistrationFeeConfirmationEmail({
                g1FullName: application?.g1_full_name ?? "Parent",
                childLegalName: application?.child_legal_name ?? "your child",
                program: programLabel,
                amountDollars,
              });
            subject = built.subject;

            const emailResult = await sendZohoEmail({
              toAddress,
              subject: built.subject,
              content: built.content,
            });

            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject: built.subject,
                template: "registration_fee_confirmation",
                application_id: applicationId,
                status: "success",
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
            console.error("Registration fee confirmation email failed:", err);
            if (toAddress) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject: subject ?? "registration_fee_confirmation (failed to build)",
                template: "registration_fee_confirmation",
                application_id: applicationId,
                status: "error",
                error_message: String(err).slice(0, 500),
              }).then(undefined, () => {});
            }
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
      let parentEmailAddr = session.metadata?.parent_email ?? session.customer_email ?? "N/A";
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
          parentEmailAddr = application.g1_email ?? session.metadata?.parent_email ?? session.customer_email ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      }

      // If application lookup failed (e.g. malformed ID in metadata), try student
      if (childName === "N/A" && studentId) {
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
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;

          // Parse sibling data for bundled multi-child payments
          type SiblingEmailData = { childLegalName: string; planType: "weekly" | "full"; weeks?: number[] };
          const emailSiblings: SiblingEmailData[] = [];

          if (session.metadata?.sibling_student_ids) {
            const sibStudentIds = session.metadata.sibling_student_ids.split(",").filter(Boolean);
            const sibAppIds = session.metadata.sibling_application_ids?.split(",") ?? [];
            const sibPlanTypes = session.metadata.sibling_plan_types?.split(",") ?? [];
            // sibling_weeks format: "1;2;3,4;5" — semicolons delimit weeks within a sibling, commas separate siblings
            const sibWeeksArr = session.metadata.sibling_weeks?.split(",") ?? [];

            for (let i = 0; i < sibStudentIds.length; i++) {
              const sibWeeks = (sibWeeksArr[i] ?? "").split(";").map(Number).filter((n) => !isNaN(n) && n > 0);
              const sibPlanType: "weekly" | "full" = sibPlanTypes[i] === "full" ? "full" : "weekly";

              let sibName = "your child";
              const sibAppId = sibAppIds[i];
              if (sibAppId) {
                const { data: sibApp } = await supabase
                  .schema("parent_app")
                  .from("applications")
                  .select("child_legal_name")
                  .eq("id", sibAppId)
                  .single();
                if (sibApp?.child_legal_name) sibName = sibApp.child_legal_name;
              }
              if (sibName === "your child") {
                const { data: sibStudent } = await supabase
                  .schema("admin")
                  .from("students")
                  .select("child_legal_name")
                  .eq("id", sibStudentIds[i])
                  .single();
                if (sibStudent?.child_legal_name) sibName = sibStudent.child_legal_name;
              }

              emailSiblings.push({
                childLegalName: sibName,
                planType: sibPlanType,
                weeks: sibWeeks.length > 0 ? sibWeeks : undefined,
              });
            }
          }

          const built = await buildSummerTuitionConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            amountDollars,
            weeks: weeks.length > 0 ? weeks : undefined,
            siblings: emailSiblings.length > 0 ? emailSiblings : undefined,
          });
          subject = built.subject;

          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "summer_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Summer tuition confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "summer_tuition_confirmation (failed to build)",
              template: "summer_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
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
      const amountDollars = (amountCents / 100).toFixed(2);
      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const built = await buildAftercareConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            selectedMonths,
            selectedDays,
            amountDollars,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "aftercare_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Aftercare confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "aftercare_tuition_confirmation (failed to build)",
              template: "aftercare_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(
            createErrorEmbed({
              context: "Aftercare confirmation email",
              error: String(err),
              details: {
                applicationId: applicationId ?? "N/A",
                studentId: studentId ?? "N/A",
              },
            }),
          ).catch(() => {});
        }
      })();
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
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;

          const built = await buildHomeschoolDropInConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            program,
            tier,
            selectedDays,
            selectedWeeks,
            amountDollars,
          });
          subject = built.subject;

          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "homeschool_dropin_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Homeschool drop-in confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "homeschool_dropin_confirmation (failed to build)",
              template: "homeschool_dropin_confirmation",
              application_id: applicationId ?? null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
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
      const amountDollars = (amountCents / 100).toFixed(2);
      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const built = await buildFunFridayConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            selectedMonths,
            selectedFridays,
            amountDollars,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "fun_friday_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Fun Friday confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "fun_friday_tuition_confirmation (failed to build)",
              template: "fun_friday_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(
            createErrorEmbed({
              context: "Fun Friday confirmation email",
              error: String(err),
              details: {
                applicationId: applicationId ?? "N/A",
                studentId: studentId ?? "N/A",
              },
            }),
          ).catch(() => {});
        }
      })();
    } else if (session.metadata?.payment_type === "shadow_day_fee") {
      const bookingId = session.metadata?.booking_id;
      const amountCents = session.amount_total ?? 0;
      const amountDollars = (amountCents / 100).toFixed(2);

      // Mark booking as paid
      if (bookingId) {
        const { error: bookingUpdateError } = await supabase
          .schema("marketing")
          .from("shadow_day_bookings")
          .update({ payment_status: "paid" })
          .eq("id", bookingId);

        if (bookingUpdateError) {
          console.error("Failed to update shadow day booking payment status:", bookingUpdateError);
        }
      }

      // Fetch booking for notification data
      let parentName = "N/A";
      let parentEmailAddr = session.metadata?.parent_email ?? session.customer_email ?? "N/A";
      let childName = "N/A";
      let shadowDate = "N/A";

      if (bookingId) {
        const { data: bookingRow } = await supabase
          .schema("marketing")
          .from("shadow_day_bookings")
          .select("first_name, last_name, email, child_name, shadow_date")
          .eq("id", bookingId)
          .single();

        if (bookingRow) {
          parentName = `${bookingRow.first_name ?? ""} ${bookingRow.last_name ?? ""}`.trim() || "N/A";
          parentEmailAddr = bookingRow.email ?? parentEmailAddr;
          childName = bookingRow.child_name ?? "N/A";
          shadowDate = bookingRow.shadow_date ?? "N/A";
        }
      }

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createShadowDayPaymentEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          shadowDate,
          amountCents,
        }),
      ).catch((err) => console.error("Shadow day payment Discord notification failed:", err));

      // Email confirmation (non-blocking, with error embed fallback)
      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;

          const built = await buildShadowDayPaymentConfirmationEmail({
            parentName: parentName !== "N/A" ? parentName : "Parent",
            childName: childName !== "N/A" ? childName : "your child",
            shadowDate,
            amountDollars,
          });
          subject = built.subject;

          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "shadow_day_fee_confirmation",
              application_id: null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Shadow day fee confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "shadow_day_fee_confirmation (failed to build)",
              template: "shadow_day_fee_confirmation",
              application_id: null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(
            createErrorEmbed({
              context: "Shadow day fee confirmation email",
              error: String(err),
              details: { bookingId: bookingId ?? "N/A" },
            }),
          ).catch(() => {});
        }
      })();
    } else if (session.metadata?.payment_type === "beach_bash_fee") {
      const registrationId = session.metadata?.registration_id;
      const amountCents = session.amount_total ?? 0;
      const amountDollars = (amountCents / 100).toFixed(2);

      if (registrationId) {
        const { error: updateError } = await supabase
          .schema("marketing")
          .from("beach_bash_registrations")
          .update({ payment_status: "paid" })
          .eq("id", registrationId);

        if (updateError) {
          console.error("Failed to update beach bash registration payment status:", updateError);
        }
      }

      let parentName = session.metadata?.parent_name ?? "N/A";
      let parentEmailAddr = session.metadata?.parent_email ?? session.customer_email ?? "N/A";
      let childNames = session.metadata?.child_names ?? "N/A";
      let childCount = parseInt(session.metadata?.child_count ?? "1", 10);

      if (registrationId) {
        const { data: regRow } = await supabase
          .schema("marketing")
          .from("beach_bash_registrations")
          .select("parent_name, email, children, child_count")
          .eq("id", registrationId)
          .single();

        if (regRow) {
          parentName = regRow.parent_name ?? parentName;
          parentEmailAddr = regRow.email ?? parentEmailAddr;
          childCount = regRow.child_count ?? childCount;
          const kids = regRow.children as Array<{ name: string; age: number }> | null;
          if (kids && kids.length > 0) {
            childNames = kids.map((c) => c.name).join(", ");
          }
        }
      }

      sendDiscordNotification(
        createBeachBashPaymentEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childNames,
          childCount,
          amountCents,
        }),
      ).catch((err) => console.error("Beach Bash payment Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;

          const built = await buildBeachBashConfirmationEmail({
            parentName: parentName !== "N/A" ? parentName : "Parent",
            childNames: childNames !== "N/A" ? childNames : "your child",
            childCount,
            amountDollars,
          });
          subject = built.subject;

          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "beach_bash_fee_confirmation",
              application_id: null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Beach Bash fee confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "beach_bash_fee_confirmation (failed to build)",
              template: "beach_bash_fee_confirmation",
              application_id: null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(
            createErrorEmbed({
              context: "Beach Bash fee confirmation email",
              error: String(err),
              details: { registrationId: registrationId ?? "N/A" },
            }),
          ).catch(() => {});
        }
      })();
    } else if (session.metadata?.payment_type === "custom_tuition") {
      const parentId = session.metadata?.parent_id;
      const studentId = session.metadata?.student_id;
      const parentEmailAddr = session.metadata?.parent_email ?? session.customer_email ?? "N/A";
      const tuitionCode = session.metadata?.tuition_code ?? "N/A";
      const label = session.metadata?.label ?? "Custom Tuition";
      const amountCents = session.amount_total ?? 0;
      const amountDollars = (amountCents / 100).toFixed(2);

      let parentName = "N/A";
      let childName = "N/A";

      if (parentId) {
        const { data: userRow } = await supabase
          .schema("admin")
          .from("users")
          .select("full_name")
          .eq("id", parentId)
          .single();
        if (userRow) parentName = userRow.full_name ?? "N/A";
      }
      if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createCustomTuitionEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          label,
          tuitionCode,
          amountCents,
        }),
      ).catch((err) => console.error("Custom tuition Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;

          const built = await buildCustomTuitionConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            label,
            amountDollars,
          });
          subject = built.subject;

          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });

          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "custom_tuition_confirmation",
              application_id: null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Custom tuition confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "custom_tuition_confirmation (failed to build)",
              template: "custom_tuition_confirmation",
              application_id: null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(
            createErrorEmbed({
              context: "Custom tuition confirmation email",
              error: String(err),
              details: { parentId: parentId ?? "N/A", tuitionCode },
            }),
          ).catch(() => {});
        }
      })();
    } else if (session.metadata?.payment_type === "supply_fee") {
      const parentId = session.metadata?.parent_id;
      const studentId = session.metadata?.student_id;
      const parentEmailAddr = session.metadata?.parent_email ?? session.customer_email ?? "N/A";
      const amountCents = session.amount_total ?? 0;

      let parentName = "N/A";
      let childName = "N/A";

      if (parentId) {
        const { data: userRow } = await supabase
          .schema("admin")
          .from("users")
          .select("full_name")
          .eq("id", parentId)
          .single();
        if (userRow) parentName = userRow.full_name ?? "N/A";
      }
      if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createSupplyFeeEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          amountCents,
        }),
      ).catch((err) => console.error("Supply fee Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const amountDollars = (amountCents / 100).toFixed(2);
          const built = await buildSupplyFeeConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childName,
            amountDollars,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "supply_fee_confirmation",
              application_id: null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Supply fee confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "supply_fee_confirmation (failed to build)",
              template: "supply_fee_confirmation",
              application_id: null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(
            createErrorEmbed({
              context: "Supply fee confirmation email",
              error: String(err),
              details: { parentId: parentId ?? "N/A", studentId: studentId ?? "N/A" },
            }),
          ).catch(() => {});
        }
      })();

    } else if (session.metadata?.payment_type === "school_year_tuition") {
      const parentId = session.metadata?.parent_id;
      const studentId = session.metadata?.student_id;
      const parentEmailAddr = session.metadata?.parent_email ?? session.customer_email ?? "N/A";
      const amountCents = session.amount_total ?? 0;

      let parentName = "N/A";
      let childName = "N/A";

      if (parentId) {
        const { data: userRow } = await supabase
          .schema("admin")
          .from("users")
          .select("full_name")
          .eq("id", parentId)
          .single();
        if (userRow) parentName = userRow.full_name ?? "N/A";
      }
      if (studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createCustomTuitionEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName,
          label: "School Year Tuition — School Year 26–27",
          tuitionCode: "N/A",
          amountCents,
        }),
      ).catch((err) => console.error("School year tuition Discord notification failed:", err));

    } else if (session.metadata?.payment_type === "one_time_payment") {
      const oneTimePaymentId = session.metadata?.one_time_payment_id;
      const payerEmail =
        session.metadata?.payer_email || session.customer_email || "";
      const payerName = session.metadata?.payer_name || "";
      const memo = session.metadata?.memo || undefined;
      const amountCents = session.amount_total ?? 0;
      const coverFees = session.metadata?.cover_fees === "true";

      // Update one_time_payments row to completed
      if (oneTimePaymentId) {
        await supabase
          .schema("billing")
          .from("one_time_payments")
          .update({ payment_status: "completed", updated_at: new Date().toISOString() })
          .eq("id", oneTimePaymentId);
      }

      const paymentMethod = session.metadata?.payment_method ?? "card";

      // Discord notification (non-blocking)
      sendDiscordNotification(
        createOneTimePaymentEmbed({
          payerName: payerName || "N/A",
          payerEmail: payerEmail || "N/A",
          amountCents,
          memo,
          coverFees,
          paymentMethod,
        }),
      ).catch((err) =>
        console.error("Discord one-time payment notification failed:", err),
      );

      // Confirmation email (non-blocking)
      if (payerEmail) {
        (async () => {
          let subject: string | undefined;
          try {
            const amountDollars = (amountCents / 100).toFixed(2);
            const built = await buildOneTimePaymentConfirmationEmail({
              payerName: payerName || "there",
              amountDollars,
              memo,
            });
            subject = built.subject;
            const emailResult = await sendZohoEmail({ toAddress: payerEmail, subject: built.subject, content: built.content });
            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: payerEmail,
                subject: built.subject,
                template: "one_time_payment_confirmation",
                status: "success",
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
            console.error("One-time payment confirmation email failed:", err);
            await supabase.schema("email_logs").from("sends").insert({
              to_address: payerEmail,
              subject: subject ?? "one_time_payment_confirmation (failed to build)",
              template: "one_time_payment_confirmation",
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
            sendDiscordNotification(
              createErrorEmbed({
                context: "One-time payment confirmation email",
                error: String(err),
                details: { payerEmail, sessionId: session.id },
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
          let subject: string | undefined;
          try {
            const amountDollars = (amountCents / 100).toFixed(2);
            const built = await buildDonationConfirmationEmail({
              donorName,
              donorEmail,
              amountDollars,
              message: donationMessage,
            });
            subject = built.subject;

            const emailResult = await sendZohoEmail({
              toAddress: donorEmail,
              subject: built.subject,
              content: built.content,
            });

            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: donorEmail,
                subject: built.subject,
                template: "donation_confirmation",
                status: "success",
              });
            } else {
              throw new Error(emailResult.error ?? "Unknown email error");
            }
          } catch (err) {
            console.error("Donation confirmation email failed:", err);
            if (donorEmail) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: donorEmail,
                subject: subject ?? "donation_confirmation (failed to build)",
                template: "donation_confirmation",
                status: "error",
                error_message: String(err).slice(0, 500),
              }).then(undefined, () => {});
            }
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
            session.metadata?.payer_email || session.metadata?.parent_email || session.metadata?.donor_email || session.customer_email || "",
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

    // Insert a sibling row if this supply_fee checkout included a bundle
    if (session.metadata?.payment_type === "supply_fee" && session.metadata?.bundle_type) {
      const bundleType = session.metadata.bundle_type; // "school_year_tuition" | "homeschool"
      const bundleAmountCents = parseInt(session.metadata.bundle_amount_cents ?? "0");
      const bundleMonthIndex = session.metadata.bundle_month_index ? parseInt(session.metadata.bundle_month_index) : null;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      if (bundleAmountCents > 0) {
        const { error: bundleError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${session.id}_bundle`,
              stripe_payment_intent_id: paymentIntentId,
              payment_type: bundleType,
              amount_cents: bundleAmountCents,
              intended_amount_cents: bundleAmountCents,
              currency: session.currency ?? "usd",
              cover_fees: false,
              payer_email: session.metadata?.parent_email || session.customer_email || "",
              student_id: session.metadata?.student_id || null,
              parent_id: session.metadata?.parent_id || null,
              metadata: {
                payment_type: bundleType,
                ...(bundleMonthIndex != null ? { month_indices: String(bundleMonthIndex) } : {}),
                bundled_with_supply_fee: "true",
                primary_session_id: session.id,
              },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        if (bundleError) {
          console.error("Failed to record bundle billing transaction:", bundleError);
        }
      }
    }

    // Insert sibling rows if this was a bundled multi-child summer payment
    if (session.metadata?.sibling_student_ids) {
      const sibStudentIds = session.metadata.sibling_student_ids.split(",").filter(Boolean);
      const sibAppIds = session.metadata.sibling_application_ids?.split(",") ?? [];
      const sibPlanTypes = session.metadata.sibling_plan_types?.split(",") ?? [];
      const sibWeeksArr = session.metadata.sibling_weeks?.split(",") ?? [];
      const sibGradeTiers = session.metadata.sibling_grade_tiers?.split(",") ?? [];
      const sibCents = session.metadata.sibling_intended_cents?.split(",").map(Number) ?? [];
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      for (let i = 0; i < sibStudentIds.length; i++) {
        const { error: sibError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${session.id}_sib_${i}`,
              stripe_payment_intent_id: paymentIntentId,
              payment_type: "summer_tuition",
              amount_cents: sibCents[i] ?? 0,
              intended_amount_cents: sibCents[i] ?? null,
              currency: session.currency ?? "usd",
              cover_fees: false,
              payer_email: session.metadata?.parent_email || session.customer_email || "",
              student_id: sibStudentIds[i],
              application_id: sibAppIds[i] ?? null,
              parent_id: session.metadata?.parent_id ?? null,
              metadata: {
                payment_type: "summer_tuition",
                plan_type: sibPlanTypes[i] ?? "weekly",
                weeks: (sibWeeksArr[i] ?? "").replace(/;/g, ","),
                grade_tier: sibGradeTiers[i] ?? "primary",
                is_sibling_split: "true",
                primary_session_id: session.id,
              },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        if (sibError) {
          console.error(`Failed to record sibling[${i}] billing transaction:`, sibError);
        }
      }
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const metadata = intent.metadata ?? {};
    const parentId = metadata.parent_id ?? null;
    const payerEmail = metadata.parent_email ?? intent.receipt_email ?? null;

    const supabase = createAdminClient();

    // Backfill stripe_customer_id if missing
    if (parentId && intent.customer) {
      await supabase
        .schema("admin")
        .from("users")
        .update({ stripe_customer_id: String(intent.customer) })
        .eq("id", parentId)
        .is("stripe_customer_id", null);
    }

    // Write to billing.stripe_transactions
    // stripe_session_id reuses the PaymentIntent ID (satisfies NOT NULL UNIQUE constraint)
    const { error: billingError } = await supabase
      .schema("billing")
      .from("stripe_transactions")
      .upsert(
        {
          stripe_session_id: intent.id,
          stripe_payment_intent_id: intent.id,
          payment_type: metadata.payment_type ?? "unknown",
          amount_cents: intent.amount,
          intended_amount_cents: metadata.intended_amount_cents
            ? parseInt(metadata.intended_amount_cents)
            : null,
          currency: intent.currency,
          cover_fees: metadata.cover_fees === "true",
          payer_name: null,
          payer_email: payerEmail,
          description: metadata.description ?? null,
          student_id: metadata.student_id ?? null,
          application_id: metadata.application_id ?? null,
          parent_id: parentId,
          metadata: intent.metadata,
          status: "completed",
          is_deleted: false,
        },
        { onConflict: "stripe_session_id" },
      );

    if (billingError) {
      console.error("Failed to record mobile billing transaction:", billingError);
    }

    // Per-payment-type Discord + email notifications
    if (metadata.payment_type === "summer_tuition") {
      const applicationId = metadata.application_id;
      const studentId = metadata.student_id;
      const planType = (metadata.plan_type ?? "full") as "weekly" | "full";
      const weeksStr = metadata.weeks ?? "";
      const weeks = weeksStr ? weeksStr.split(",").map(Number).filter((n: number) => !isNaN(n)) : [];
      const amountCents = intent.amount;
      const amountDollars = (amountCents / 100).toFixed(2);

      let parentName = "N/A";
      let parentEmailAddr = payerEmail ?? "N/A";
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
          parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      }
      if (childName === "N/A" && studentId) {
        const { data: student } = await supabase
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createSummerTuitionEmbed({ parentName, parentEmail: parentEmailAddr, childName, planType, amountCents, weeks: weeks.length > 0 ? weeks : undefined }),
      ).catch((err) => console.error("Mobile summer tuition Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const built = await buildSummerTuitionConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            amountDollars,
            weeks: weeks.length > 0 ? weeks : undefined,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: built.subject,
              template: "summer_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "success",
            });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Mobile summer tuition confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({
              to_address: toAddress,
              subject: subject ?? "summer_tuition_confirmation (failed to build)",
              template: "summer_tuition_confirmation",
              application_id: applicationId ?? null,
              status: "error",
              error_message: String(err).slice(0, 500),
            }).then(undefined, () => {});
          }
          sendDiscordNotification(createErrorEmbed({ context: "Mobile summer tuition confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
        }
      })();
    } else if (metadata.payment_type === "aftercare_tuition") {
      const applicationId = metadata.application_id;
      const studentId = metadata.student_id;
      const planType = (metadata.plan_type ?? "monthly") as "monthly" | "daily";
      const selectedMonths = metadata.selected_months ? metadata.selected_months.split(",").filter(Boolean) : [];
      const selectedDays = metadata.selected_days ? metadata.selected_days.split(",").filter(Boolean) : [];
      const amountCents = intent.amount;
      const amountDollars = (amountCents / 100).toFixed(2);

      let parentName = "N/A";
      let parentEmailAddr = payerEmail ?? "N/A";
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
          parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createAftercareTuitionEmbed({ parentName, parentEmail: parentEmailAddr, childName, planType, amountCents, selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined, selectedDays: selectedDays.length > 0 ? selectedDays : undefined }),
      ).catch((err) => console.error("Mobile aftercare Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const built = await buildAftercareConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            selectedMonths,
            selectedDays,
            amountDollars,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: built.subject, template: "aftercare_tuition_confirmation", application_id: applicationId ?? null, status: "success" });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Mobile aftercare confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: subject ?? "aftercare_tuition_confirmation (failed to build)", template: "aftercare_tuition_confirmation", application_id: applicationId ?? null, status: "error", error_message: String(err).slice(0, 500) }).then(undefined, () => {});
          }
          sendDiscordNotification(createErrorEmbed({ context: "Mobile aftercare confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
        }
      })();
    } else if (metadata.payment_type === "homeschool_dropin") {
      const applicationId = metadata.application_id;
      const studentId = metadata.student_id;
      const program = metadata.program ?? "summer_26";
      const tier = metadata.tier ?? "dropin";
      const selectedDays = metadata.selected_days ? metadata.selected_days.split(",").filter(Boolean) : [];
      const selectedWeeks = metadata.selected_weeks ? metadata.selected_weeks.split(",").map(Number).filter(Boolean) : [];
      const amountCents = intent.amount;
      const amountDollars = (amountCents / 100).toFixed(2);

      let parentName = "N/A";
      let parentEmailAddr = payerEmail ?? "N/A";
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
          parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createHomeschoolDropInEmbed({ parentName, parentEmail: parentEmailAddr, childName, program, tier, selectedDays: selectedDays.length > 0 ? selectedDays : undefined, selectedWeeks: selectedWeeks.length > 0 ? selectedWeeks : undefined, amountCents }),
      ).catch((err) => console.error("Mobile homeschool Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const built = await buildHomeschoolDropInConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            program,
            tier,
            selectedDays,
            selectedWeeks,
            amountDollars,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: built.subject, template: "homeschool_dropin_confirmation", application_id: applicationId ?? null, status: "success" });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Mobile homeschool drop-in confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: subject ?? "homeschool_dropin_confirmation (failed to build)", template: "homeschool_dropin_confirmation", application_id: applicationId ?? null, status: "error", error_message: String(err).slice(0, 500) }).then(undefined, () => {});
          }
          sendDiscordNotification(createErrorEmbed({ context: "Mobile homeschool drop-in confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
        }
      })();
    } else if (metadata.payment_type === "fun_friday_tuition") {
      const applicationId = metadata.application_id;
      const studentId = metadata.student_id;
      const planType = (metadata.plan_type ?? "monthly") as "monthly" | "dropin";
      const selectedMonths = metadata.selected_months ? metadata.selected_months.split(",").filter(Boolean) : [];
      const selectedFridays = metadata.selected_fridays ? metadata.selected_fridays.split(",").filter(Boolean) : [];
      const amountCents = intent.amount;
      const amountDollars = (amountCents / 100).toFixed(2);

      let parentName = "N/A";
      let parentEmailAddr = payerEmail ?? "N/A";
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
          parentEmailAddr = application.g1_email ?? payerEmail ?? "N/A";
          childName = application.child_legal_name ?? "N/A";
        }
      } else if (studentId) {
        const { data: student } = await supabase.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single();
        if (student) childName = student.child_legal_name ?? "N/A";
      }

      sendDiscordNotification(
        createFunFridayTuitionEmbed({ parentName, parentEmail: parentEmailAddr, childName, planType, amountCents, selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined, selectedFridays: selectedFridays.length > 0 ? selectedFridays : undefined }),
      ).catch((err) => console.error("Mobile fun friday Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        try {
          if (!toAddress) return;
          const built = await buildFunFridayConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childLegalName: childName !== "N/A" ? childName : "your child",
            planType,
            selectedMonths,
            selectedFridays,
            amountDollars,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          if (emailResult.success) {
            await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: built.subject, template: "fun_friday_tuition_confirmation", application_id: applicationId ?? null, status: "success" });
          } else {
            throw new Error(emailResult.error ?? "Unknown email error");
          }
        } catch (err) {
          console.error("Mobile fun friday confirmation email failed:", err);
          if (toAddress) {
            await supabase.schema("email_logs").from("sends").insert({ to_address: toAddress, subject: subject ?? "fun_friday_tuition_confirmation (failed to build)", template: "fun_friday_tuition_confirmation", application_id: applicationId ?? null, status: "error", error_message: String(err).slice(0, 500) }).then(undefined, () => {});
          }
          sendDiscordNotification(createErrorEmbed({ context: "Mobile fun friday confirmation email", error: String(err), details: { applicationId: applicationId ?? "N/A", studentId: studentId ?? "N/A" } })).catch(() => {});
        }
      })();
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
