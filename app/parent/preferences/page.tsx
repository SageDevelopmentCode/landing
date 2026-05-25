import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";
import PreferencesPageClient from "./PreferencesPageClient";
import { getPublishedActivities } from "@/app/actions/activities";

export type PreferenceChild = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
};

export default async function PreferencesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [{ data: adminUser }, { data: enrolledCheck }, { data: studentsData }, activities] =
    await Promise.all([
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
      adminClient
        .schema("admin")
        .from("students")
        .select("id, child_legal_name, profile_image_url")
        .eq("parent_id", user.id)
        .eq("is_deleted", false),
      getPublishedActivities(),
    ]);

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const children: PreferenceChild[] = (studentsData ?? []) as PreferenceChild[];

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
          <ParentHeaderRight
            userId={user.id}
            email={user.email ?? ""}
            fullName={fullName}
            profileImageUrl={profileImageUrl}
          />
        </DashboardHeader>

        <main className="flex-1 flex overflow-hidden">
          <PreferencesPageClient children={children} activities={activities} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
