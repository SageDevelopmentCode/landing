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
  createSchoolYearTuitionEmbed,
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
  buildSchoolYearTuitionConfirmationEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  console.log("[webhook] Received POST, signature present:", !!signature);

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

  console.log("[webhook] Event constructed:", event.type, "| payment_type:", (event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent).metadata?.payment_type ?? "n/a");

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
        const updatePayload: Record<string, unknown> = { registration_fee_paid: true };

        // If a summer-only homeschool drop-in parent is committing to school year, update drop_in_program
        const metaProgram = session.metadata?.program;
        const metaDropInProgram = session.metadata?.drop_in_program;
        if (metaProgram === "homeschool_drop_in" && metaDropInProgram === "school_year_26_27") {
          updatePayload.drop_in_program = "both";
          updatePayload.updated_at = new Date().toISOString();
        }

        // NEW: Full-time summer parent committing to school year (fixed client sends program="school_year_26_27" directly)
        if (metaProgram === "school_year_26_27") {
          const { data: currentApp } = await supabase
            .schema("parent_app")
            .from("applications")
            .select("program")
            .eq("id", applicationId)
            .single();

          if (currentApp?.program === "summer_26") {
            updatePayload.program = "both";
            updatePayload.updated_at = new Date().toISOString();
          }
        }

        // KEEP existing: backwards compat for old client shape
        if (metaProgram === "summer_26" && metaDropInProgram === "school_year_26_27") {
          updatePayload.program = "both";
          updatePayload.updated_at = new Date().toISOString();
        }

        const { error } = await supabase
          .schema("parent_app")
          .from("applications")
          .update(updatePayload)
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
      console.log("[supply_fee] Handler entered | studentId:", studentId, "parentId:", parentId, "amountCents:", amountCents, "siblingIds:", session.metadata?.sibling_supply_student_ids ?? "none", "bundleType:", session.metadata?.bundle_type ?? "none");

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

      console.log("[supply_fee] Names resolved | parentName:", parentName, "childName:", childName);
      let allChildNames = childName;
      if (session.metadata?.sibling_supply_student_ids) {
        const sibIds = session.metadata.sibling_supply_student_ids.split(",").filter(Boolean);
        if (sibIds.length > 0) {
          const { data: sibStudents } = await supabase
            .schema("admin")
            .from("students")
            .select("child_legal_name")
            .in("id", sibIds);
          const sibNames = sibStudents?.map((s) => s.child_legal_name ?? "N/A") ?? [];
          allChildNames = [childName, ...sibNames].join(", ");
        }
      }

      console.log("[supply_fee] allChildNames:", allChildNames);

      // Build bundle breakdown if this supply fee includes school year tuition
      const bundleType = session.metadata?.bundle_type;
      const bundleAmountCents = parseInt(session.metadata?.bundle_amount_cents ?? "0");
      const sibBundleAmounts = session.metadata?.sibling_bundle_amounts?.split(",").map(Number) ?? [];
      let studentBreakdown: Array<{ name: string; supplyFee: number; bundleAmount: number }> | undefined;
      if (bundleType) {
        const sibIds = session.metadata?.sibling_supply_student_ids?.split(",").filter(Boolean) ?? [];
        const sibNames: string[] = [];
        if (sibIds.length > 0) {
          const { data: sibStudents } = await supabase
            .schema("admin")
            .from("students")
            .select("child_legal_name")
            .in("id", sibIds);
          sibNames.push(...(sibStudents?.map((s) => s.child_legal_name ?? "N/A") ?? []));
        }
        studentBreakdown = [
          { name: childName, supplyFee: 30000, bundleAmount: bundleAmountCents },
          ...sibIds.map((_, i) => ({
            name: sibNames[i] ?? "N/A",
            supplyFee: 30000,
            bundleAmount: sibBundleAmounts[i] ?? 0,
          })),
        ];
      }

      console.log("[supply_fee] Sending Discord notification...");
      sendDiscordNotification(
        createSupplyFeeEmbed({
          parentName,
          parentEmail: parentEmailAddr,
          childName: allChildNames,
          amountCents,
          bundleType,
          studentBreakdown,
        }),
      ).catch((err) => console.error("Supply fee Discord notification failed:", err));

      (async () => {
        const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
        let subject: string | undefined;
        console.log("[supply_fee] Starting email send to:", toAddress);
        try {
          if (!toAddress) return;
          const amountDollars = (amountCents / 100).toFixed(2);
          const built = await buildSupplyFeeConfirmationEmail({
            g1FullName: parentName !== "N/A" ? parentName : "Parent",
            childName: allChildNames,
            amountDollars,
            bundleType,
            studentBreakdown,
          });
          subject = built.subject;
          const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
          console.log("[supply_fee] Email result:", emailResult.success ? "success" : emailResult.error);
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
      try {
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
          createSchoolYearTuitionEmbed({
            parentName,
            parentEmail: parentEmailAddr,
            childName,
            amountCents,
            selectedMonthIndices: (session.metadata?.selected_months ?? "")
              .split(",")
              .map(Number)
              .filter((n) => !isNaN(n) && n > 0),
          }),
        ).catch((err) => console.error("School year tuition Discord notification failed:", err));

        (async () => {
          const toAddress = parentEmailAddr !== "N/A" ? parentEmailAddr : "";
          let subject: string | undefined;
          try {
            if (!toAddress) return;
            const selectedMonthsRaw = session.metadata?.selected_months ?? "";
            const selectedMonths = selectedMonthsRaw
              .split(",")
              .map(Number)
              .filter((n) => !isNaN(n) && n > 0);
            const amountDollars = (amountCents / 100).toFixed(2);
            const built = await buildSchoolYearTuitionConfirmationEmail({
              g1FullName: parentName !== "N/A" ? parentName : "Parent",
              childName: childName !== "N/A" ? childName : "your child",
              amountDollars,
              selectedMonths: selectedMonths.length > 0 ? selectedMonths : undefined,
            });
            subject = built.subject;
            const emailResult = await sendZohoEmail({ toAddress, subject: built.subject, content: built.content });
            if (emailResult.success) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject: built.subject,
                template: "school_year_tuition_confirmation",
                application_id: null,
                status: "success",
              });
            }
          } catch (err) {
            console.error("School year tuition confirmation email failed:", err);
            if (toAddress) {
              await supabase.schema("email_logs").from("sends").insert({
                to_address: toAddress,
                subject: subject ?? "school_year_tuition_confirmation (failed to build)",
                template: "school_year_tuition_confirmation",
                application_id: null,
                status: "error",
                error_message: String(err).slice(0, 500),
              });
            }
          }
        })();

      } catch (err) {
        console.error("school_year_tuition webhook handler error:", err);
        sendDiscordNotification(
          createErrorEmbed({
            context: "school_year_tuition webhook",
            error: String(err),
            details: {
              parentId: session.metadata?.parent_id ?? "N/A",
              studentId: session.metadata?.student_id ?? "N/A",
            },
          }),
        ).catch(() => {});
      }

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
    console.log("[billing] Writing primary transaction | session:", session.id, "payment_type:", session.metadata?.payment_type, "amount:", session.amount_total);
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

    console.log("[billing] Primary transaction result:", billingError ? `ERROR: ${JSON.stringify(billingError)}` : "OK");
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
        console.log("[billing] Writing bundle row | bundleType:", bundleType, "bundleAmountCents:", bundleAmountCents, "bundleMonthIndex:", bundleMonthIndex);
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
                ...(bundleMonthIndex != null ? { selected_months: String(bundleMonthIndex) } : {}),
                bundled_with_supply_fee: "true",
                primary_session_id: session.id,
              },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        console.log("[billing] Bundle row result:", bundleError ? `ERROR: ${JSON.stringify(bundleError)}` : "OK");
        if (bundleError) {
          console.error("Failed to record bundle billing transaction:", bundleError);
        }
      }
    }

    // Insert sibling rows for supply fee multi-child payment
    if (session.metadata?.payment_type === "supply_fee" && session.metadata?.sibling_supply_student_ids) {
      const sibIds = session.metadata.sibling_supply_student_ids.split(",").filter(Boolean);
      const sibBundleIds = session.metadata.sibling_bundle_student_ids?.split(",").filter(Boolean) ?? [];
      const sibBundleAmounts = session.metadata.sibling_bundle_amounts?.split(",").map(Number) ?? [];
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      console.log("[billing] Writing sibling supply rows | count:", sibIds.length);
      for (let i = 0; i < sibIds.length; i++) {
        const { error: sibSupplyError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${session.id}_supply_sib_${i}`,
              stripe_payment_intent_id: paymentIntentId,
              payment_type: "supply_fee",
              amount_cents: 30000,
              intended_amount_cents: 30000,
              student_id: sibIds[i],
              parent_id: session.metadata.parent_id,
              payer_email: session.metadata.parent_email || session.customer_email || "",
              metadata: { is_sibling_split: "true", primary_session_id: session.id },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        console.log(`[billing] Sibling supply row ${i}:`, sibSupplyError ? `ERROR: ${JSON.stringify(sibSupplyError)}` : "OK");
        if (sibSupplyError) {
          console.error(`Failed to record supply fee sibling row ${i}:`, sibSupplyError);
        }

        const bundleIdx = sibBundleIds.indexOf(sibIds[i]);
        if (bundleIdx >= 0 && sibBundleAmounts[bundleIdx] > 0) {
          const { error: sibBundleError } = await supabase
            .schema("billing")
            .from("stripe_transactions")
            .upsert(
              {
                stripe_session_id: `${session.id}_supply_sib_bundle_${i}`,
                stripe_payment_intent_id: paymentIntentId,
                payment_type: "school_year_tuition",
                amount_cents: sibBundleAmounts[bundleIdx],
                intended_amount_cents: sibBundleAmounts[bundleIdx],
                student_id: sibIds[i],
                parent_id: session.metadata.parent_id,
                payer_email: session.metadata.parent_email || session.customer_email || "",
                metadata: {
                  selected_months: "1",
                  bundled_with_supply_fee: "true",
                  primary_session_id: session.id,
                },
                status: "completed",
              },
              { onConflict: "stripe_session_id" },
            );
          console.log(`[billing] Sibling bundle row ${i}:`, sibBundleError ? `ERROR: ${JSON.stringify(sibBundleError)}` : "OK");
          if (sibBundleError) {
            console.error(`Failed to record supply fee sibling bundle row ${i}:`, sibBundleError);
          }
        }
      }
    }

    // Insert sibling homeschool drop-in bundle rows from supply fee checkout
    if (
      session.metadata?.payment_type === "supply_fee" &&
      session.metadata?.sibling_homeschool_bundle_student_ids
    ) {
      const hsSibIds = session.metadata.sibling_homeschool_bundle_student_ids
        .split(",")
        .filter(Boolean);
      const hsSibAmounts =
        session.metadata.sibling_homeschool_bundle_amounts
          ?.split(",")
          .map(Number) ?? [];
      const hsSibAppIds =
        session.metadata.sibling_homeschool_application_ids?.split(",") ?? [];
      const hsSibGradeTiers =
        session.metadata.sibling_homeschool_grade_tiers?.split(",") ?? [];
      const tier = session.metadata.bundle_homeschool_tier ?? "dropin";
      const weekSelectionsJson =
        session.metadata.bundle_homeschool_week_selections_json ?? "";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      let selectedWeeksCsv = "";
      let selectedDaysCsv = "";
      if (weekSelectionsJson) {
        try {
          const parsed: { week: number; days: string[] }[] =
            JSON.parse(weekSelectionsJson);
          selectedWeeksCsv = parsed.map((p) => p.week).join(",");
          selectedDaysCsv = [
            ...new Set(parsed.flatMap((p) => p.days ?? [])),
          ].join(",");
        } catch {
          selectedWeeksCsv =
            session.metadata.bundle_homeschool_selected_days ?? "";
        }
      } else {
        selectedWeeksCsv = session.metadata.bundle_homeschool_selected_days ?? "";
      }

      for (let i = 0; i < hsSibIds.length; i++) {
        const { error: hsSibBundleError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${session.id}_supply_sib_hs_bundle_${i}`,
              stripe_payment_intent_id: paymentIntentId,
              payment_type: "homeschool_dropin",
              amount_cents: hsSibAmounts[i] ?? 0,
              intended_amount_cents: hsSibAmounts[i] ?? null,
              student_id: hsSibIds[i],
              application_id: hsSibAppIds[i] ?? null,
              parent_id: session.metadata.parent_id,
              payer_email:
                session.metadata.parent_email || session.customer_email || "",
              metadata: {
                payment_type: "homeschool_dropin",
                program: "school_year_26_27",
                tier,
                grade_tier: hsSibGradeTiers[i] ?? "primary",
                selected_days: selectedDaysCsv,
                selected_weeks: selectedWeeksCsv,
                week_selections: weekSelectionsJson,
                bundled_with_supply_fee: "true",
                is_sibling_split: "true",
                primary_session_id: session.id,
              },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        if (hsSibBundleError) {
          console.error(
            `Failed to record supply fee homeschool sibling bundle row ${i}:`,
            hsSibBundleError,
          );
        }
      }
    }

    // Insert sibling rows if this was a bundled multi-child summer payment
    if (
      session.metadata?.payment_type === "summer_tuition" &&
      session.metadata?.sibling_student_ids
    ) {
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

    // Insert sibling rows for bundled multi-child homeschool drop-in payment
    if (
      session.metadata?.payment_type === "homeschool_dropin" &&
      session.metadata?.sibling_student_ids
    ) {
      const sibStudentIds = session.metadata.sibling_student_ids
        .split(",")
        .filter(Boolean);
      const sibAppIds =
        session.metadata.sibling_application_ids?.split(",") ?? [];
      const sibTiers = session.metadata.sibling_tiers?.split(",") ?? [];
      const sibGradeTiers =
        session.metadata.sibling_grade_tiers?.split(",") ?? [];
      const sibWeeksArr = session.metadata.sibling_weeks?.split(",") ?? [];
      const sibDaysArr =
        session.metadata.sibling_selected_days?.split(";") ?? [];
      const sibWeekSelectionsArr =
        session.metadata.sibling_week_selections?.split("|") ?? [];
      const sibCents =
        session.metadata.sibling_intended_cents?.split(",").map(Number) ?? [];
      const program = session.metadata.program ?? "school_year_26_27";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      for (let i = 0; i < sibStudentIds.length; i++) {
        const selectedWeeks = (sibWeeksArr[i] ?? "")
          .replace(/;/g, ",")
          .split(",")
          .filter(Boolean);
        const selectedDays = (sibDaysArr[i] ?? "")
          .split(",")
          .filter(Boolean);
        const weekSelections = sibWeekSelectionsArr[i] ?? "";

        const { error: sibError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${session.id}_sib_${i}`,
              stripe_payment_intent_id: paymentIntentId,
              payment_type: "homeschool_dropin",
              amount_cents: sibCents[i] ?? 0,
              intended_amount_cents: sibCents[i] ?? null,
              currency: session.currency ?? "usd",
              cover_fees: false,
              payer_email:
                session.metadata?.parent_email || session.customer_email || "",
              student_id: sibStudentIds[i],
              application_id: sibAppIds[i] ?? null,
              parent_id: session.metadata?.parent_id ?? null,
              metadata: {
                payment_type: "homeschool_dropin",
                program,
                tier: sibTiers[i] ?? "dropin",
                grade_tier: sibGradeTiers[i] ?? "primary",
                selected_days: selectedDays.join(","),
                selected_weeks: selectedWeeks.join(","),
                week_selections: weekSelections,
                is_sibling_split: "true",
                primary_session_id: session.id,
              },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        if (sibError) {
          console.error(
            `Failed to record homeschool sibling[${i}] billing transaction:`,
            sibError,
          );
        }
      }
    }

    // Insert sibling rows for bundled multi-child school-year tuition payment
    if (
      session.metadata?.payment_type === "school_year_tuition" &&
      session.metadata?.sibling_student_ids
    ) {
      const sibStudentIds = session.metadata.sibling_student_ids
        .split(",")
        .filter(Boolean);
      const sibMonthsArr =
        session.metadata.sibling_selected_months?.split(",") ?? [];
      const sibCents =
        session.metadata.sibling_intended_cents?.split(",").map(Number) ?? [];
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      for (let i = 0; i < sibStudentIds.length; i++) {
        const selectedMonths = (sibMonthsArr[i] ?? "")
          .replace(/;/g, ",")
          .split(",")
          .filter(Boolean);

        const { error: sibError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${session.id}_sib_${i}`,
              stripe_payment_intent_id: paymentIntentId,
              payment_type: "school_year_tuition",
              amount_cents: sibCents[i] ?? 0,
              intended_amount_cents: sibCents[i] ?? null,
              currency: session.currency ?? "usd",
              cover_fees: false,
              payer_email:
                session.metadata?.parent_email || session.customer_email || "",
              student_id: sibStudentIds[i],
              parent_id: session.metadata?.parent_id ?? null,
              metadata: {
                payment_type: "school_year_tuition",
                selected_months: selectedMonths.join(","),
                is_sibling_split: "true",
                primary_session_id: session.id,
              },
              status: "completed",
            },
            { onConflict: "stripe_session_id" },
          );
        if (sibError) {
          console.error(
            `Failed to record school year tuition sibling[${i}] billing transaction:`,
            sibError,
          );
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

    if (
      metadata.payment_type === "school_year_tuition" &&
      metadata.sibling_student_ids
    ) {
      const sibStudentIds = metadata.sibling_student_ids
        .split(",")
        .filter(Boolean);
      const sibMonthsArr = metadata.sibling_selected_months?.split(",") ?? [];
      const sibCents = metadata.sibling_intended_cents?.split(",").map(Number) ?? [];

      for (let i = 0; i < sibStudentIds.length; i++) {
        const selectedMonths = (sibMonthsArr[i] ?? "")
          .replace(/;/g, ",")
          .split(",")
          .filter(Boolean);

        const { error: sibError } = await supabase
          .schema("billing")
          .from("stripe_transactions")
          .upsert(
            {
              stripe_session_id: `${intent.id}_sib_${i}`,
              stripe_payment_intent_id: intent.id,
              payment_type: "school_year_tuition",
              amount_cents: sibCents[i] ?? 0,
              intended_amount_cents: sibCents[i] ?? null,
              currency: intent.currency,
              cover_fees: false,
              payer_email: payerEmail ?? "",
              student_id: sibStudentIds[i],
              parent_id: parentId,
              metadata: {
                payment_type: "school_year_tuition",
                selected_months: selectedMonths.join(","),
                is_sibling_split: "true",
                primary_session_id: intent.id,
              },
              status: "completed",
              is_deleted: false,
            },
            { onConflict: "stripe_session_id" },
          );
        if (sibError) {
          console.error(
            `Failed to record mobile school year tuition sibling[${i}]:`,
            sibError,
          );
        }
      }
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
