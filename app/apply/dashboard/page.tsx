import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ApplicationList from "./ApplicationList";
import ProfileDropdown from "./ProfileDropdown";
import Footer from "@/app/components/Footer";

export default async function ApplicationDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let apps: Record<string, string | null | boolean>[] = [];
  let fullName: string | null = null;
  if (user) {
    const adminClient = createAdminClient();
    const [{ data }, { data: adminUser, error: adminUserError }] =
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
      ]);
    apps = data ?? [];
    if (apps.some((app) => app.approved === true)) {
      redirect("/parent/dashboard");
    }
    fullName = adminUser?.full_name ?? null;
  }

  const g1Name = apps[0]?.g1_full_name ?? "there";

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
        {/* Review notice */}
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
        </div>

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Welcome back, {g1Name}.
          </h1>
          <p className="text-gray-500 font-body text-sm">
            You have {apps.length} submitted application
            {apps.length !== 1 ? "s" : ""}.
          </p>
        </div>

        {/* Application List */}
        <ApplicationList apps={apps} />

        {/* Start another application */}
        <Link
          href="/apply/step/1?new=1"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 font-body hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Start another application
        </Link>
      </main>
      </div>
      <Footer />
    </div>
  );
}
