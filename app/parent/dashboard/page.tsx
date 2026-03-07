import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";

export default async function ParentDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const [{ data: apps }, { data: adminUser }] = await Promise.all([
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

  const fullName = adminUser?.full_name ?? null;
  const approvedApp = (apps ?? []).find((app) => app.approved === true);
  const studentName = approvedApp?.student_full_name ?? "your student";

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
          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Welcome, {fullName ?? "Parent"}.
            </h1>
            <p className="text-gray-500 font-body text-sm">
              {studentName} is enrolled at Sage Field Academy.
            </p>
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Schedule */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold font-heading text-gray-800 mb-2">
                Schedule
              </h2>
              <p className="text-sm text-gray-400 font-body">
                Class schedule coming soon.
              </p>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold font-heading text-gray-800 mb-2">
                Upcoming Events
              </h2>
              <p className="text-sm text-gray-400 font-body">
                No events scheduled yet.
              </p>
            </div>

            {/* Announcements */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold font-heading text-gray-800 mb-2">
                Announcements
              </h2>
              <p className="text-sm text-gray-400 font-body">
                No announcements at this time.
              </p>
            </div>

            {/* Documents */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold font-heading text-gray-800 mb-2">
                Documents
              </h2>
              <p className="text-sm text-gray-400 font-body">
                No documents available yet.
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
