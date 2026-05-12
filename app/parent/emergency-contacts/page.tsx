import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import EmergencyContactsPage from "./EmergencyContactsPage";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";
import { getParentEmergencyContacts } from "@/app/actions/getParentEmergencyContacts";

export default async function EmergencyContactsRoute() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const [contacts, { data: adminUser }, { data: enrolledCheck }] = await Promise.all([
    getParentEmergencyContacts(),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "enrolled")
      .limit(1),
  ]);

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        <DashboardHeader>
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/assets/Logo.png"
                alt="Sage Field"
                width={50}
                height={24}
                className="object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <DashboardNav hasEnrolledStudent={(enrolledCheck ?? []).length > 0} />
          </div>
          <ParentHeaderRight userId={user.id} email={user.email ?? ""} fullName={fullName} profileImageUrl={profileImageUrl} />
        </DashboardHeader>

        <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Emergency Contacts
            </h1>
          </div>
          <EmergencyContactsPage contacts={contacts} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
