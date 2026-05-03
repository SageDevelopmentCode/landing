import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import OnboardingChecklistButton from "@/app/parent/components/OnboardingChecklistButton";
import VolunteerButton from "./VolunteerButton";

export default async function VolunteerPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const [{ data: adminUser }, { data: enrolledCheck }] = await Promise.all([
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
          <div className="flex items-center justify-end gap-1">
            <OnboardingChecklistButton />
            {user?.email && (
              <ProfileDropdown email={user.email} fullName={fullName} userId={user.id} profileImageUrl={profileImageUrl} />
            )}
          </div>
        </DashboardHeader>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Volunteer Opportunities
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
              <Heart className="w-8 h-8 text-[#4a7c59]" />
            </div>
            <h2 className="text-xl font-semibold font-heading text-gray-800 mb-3">
              No openings right now
            </h2>
            <p className="text-gray-500 font-body text-sm max-w-sm leading-relaxed">
              We&apos;ll notify you as soon as a volunteer opportunity becomes
              available. Thank you for your willingness to get involved!
            </p>
            <VolunteerButton />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
