import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import ApplicationList from "./ApplicationList";
import ProfileDropdown from "./ProfileDropdown";
import Footer from "@/app/components/Footer";
import EnrollmentCodeEntry from "./EnrollmentCodeEntry";
import ReviewStatusCard from "./ReviewStatusCard";
import SubmittedConfetti from "./SubmittedConfetti";
import HelpWidget from "@/app/parent/components/HelpWidget";

export default async function ApplicationDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let apps: Record<string, string | null | boolean>[] = [];
  let fullName: string | null = null;
  let shadowBooking: { shadow_date: string } | null = null;
  if (user) {
    const adminClient = createAdminClient();

    const { data: grant } = await adminClient
      .schema("parent_app")
      .from("dashboard_access_grants")
      .select("owner_id")
      .eq("grantee_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (grant) {
      const { data: ownerEnrolled } = await adminClient
        .schema("parent_app")
        .from("applications")
        .select("id")
        .eq("user_id", grant.owner_id)
        .eq("status", "enrolled")
        .limit(1);
      if ((ownerEnrolled ?? []).length > 0) {
        redirect("/parent/home");
      }
      redirect("/parent/dashboard");
    }

    const [{ data }, { data: adminUser }, { data: booking }] =
      await Promise.all([
        adminClient
          .schema("parent_app")
          .from("applications")
          .select("*")
          .eq("user_id", user.id),
        adminClient
          .schema("admin")
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single(),
        adminClient
          .schema("marketing")
          .from("shadow_day_bookings")
          .select("shadow_date")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);
    apps = data ?? [];
    if (apps.some((app) => app.status === "enrolled")) {
      redirect("/parent/home");
    } else if (apps.some((app) => app.approved === true)) {
      redirect("/parent/dashboard");
    }
    fullName = adminUser?.full_name ?? null;
    if (booking) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(booking.shadow_date + "T00:00:00");
      if (bookingDate >= today) shadowBooking = booking;
    }
  }

  const accountFirstName = fullName?.split(" ")[0] ?? "there";
  const g1Name = (apps[0]?.g1_full_name as string | null) ?? accountFirstName;

  const inProgressCount = apps.filter((a) => a.status === "in_progress").length;
  const submittedCount = apps.filter((a) => a.status !== "in_progress" && a.status != null).length;
  const hasSubmitted = submittedCount > 0;

  function buildSubtitle() {
    const parts: string[] = [];
    if (inProgressCount > 0)
      parts.push(
        `${inProgressCount} in-progress application${inProgressCount !== 1 ? "s" : ""}`
      );
    if (submittedCount > 0)
      parts.push(
        `${submittedCount} submitted application${submittedCount !== 1 ? "s" : ""}`
      );
    if (parts.length === 0) return "No applications found.";
    return `You have ${parts.join(" and ")}.`;
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/assets/Logo.png"
            alt="Sage Field"
            width={50}
            height={24}
            className="object-contain"
          />
        </Link>
        {user?.email && (
          <ProfileDropdown email={user.email} fullName={fullName} />
        )}
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        {/* Confetti on first load after submission */}
        <Suspense>
          <SubmittedConfetti />
        </Suspense>

        {/* Review notice — only shown when at least one app is submitted */}
        {hasSubmitted && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm text-amber-800 font-body">
              <span className="font-semibold">
                We&apos;re reviewing your application.
              </span>{" "}
              Our team will be in touch soon. In the meantime,{" "}
              <Link
                href="/"
                className="underline underline-offset-2 hover:text-amber-900 transition-colors"
              >
                learn more about our programs
              </Link>
              .
            </p>
            <div className="mt-3">
              <EnrollmentCodeEntry />
            </div>
          </div>
        )}

        {/* Shadow day banner */}
        {shadowBooking && (
          <div className="bg-sage-50 border border-sage-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base">🌿</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-sage-800 font-body">
                  You have an upcoming Shadow Day
                </p>
                <p className="text-xs text-sage-700 font-body">
                  {new Date(shadowBooking.shadow_date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Link
              href="/shadow-day/dashboard"
              className="text-xs font-semibold text-white bg-sage-600 hover:bg-sage-700 rounded-lg px-3 py-2 font-body transition-colors whitespace-nowrap flex-shrink-0"
            >
              View Details
            </Link>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Welcome back, {g1Name}.
          </h1>
          <p className="text-gray-500 font-body text-sm">{buildSubtitle()}</p>
        </div>

        {/* Application List */}
        <ApplicationList apps={apps} />

        {/* Progress tracker + what happens next */}
        {hasSubmitted && <ReviewStatusCard />}

      </main>
      </div>
      <Footer />
      <HelpWidget />
    </div>
  );
}
