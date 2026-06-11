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
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import RewardsClient from "./RewardsClient";

export type RewardsReferral = {
  id: string;
  referred_email: string | null;
  status: string;
  created_at: string;
};

export default async function RewardsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;
  const isSharedAccess = !!grant;

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
      .eq("user_id", effectiveParentId)
      .eq("status", "enrolled")
      .limit(1),
  ]);

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient
      .schema("admin")
      .from("users")
      .select("full_name")
      .eq("id", effectiveParentId)
      .single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }

  const [{ data: referralsData }, { data: testimonialData }, { data: studentsData }] =
    await Promise.all([
      adminClient
        .schema("parent_app")
        .from("referrals")
        .select("id, referred_email, status, created_at")
        .eq("referrer_id", effectiveParentId)
        .order("created_at", { ascending: false }),
      adminClient
        .schema("marketing")
        .from("testimonials")
        .select("id")
        .eq("parent_id", effectiveParentId)
        .eq("is_deleted", false)
        .limit(1)
        .maybeSingle(),
      adminClient
        .schema("admin")
        .from("students")
        .select("child_legal_name")
        .eq("parent_id", effectiveParentId)
        .eq("is_deleted", false)
        .limit(1),
    ]);

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const referrals: RewardsReferral[] = (referralsData ?? []) as RewardsReferral[];
  const hasSubmittedTestimonial = !!testimonialData;
  const studentFirstName =
    (studentsData ?? [])[0]?.child_legal_name?.split(" ")[0] ?? "your child";

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
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

      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <RewardsClient
          referrals={referrals}
          hasSubmittedTestimonial={hasSubmittedTestimonial}
          userId={user.id}
          studentFirstName={studentFirstName}
        />
      </main>

      <Footer />
    </div>
  );
}
