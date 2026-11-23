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
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";
import VolunteerPageClient from "./VolunteerPageClient";

export default async function VolunteerPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  // Shared access: a grantee sees the owner's family, so the enrolled check uses the owner.
  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;
  const isSharedAccess = !!grant;

  const [{ data: adminUser }, { data: enrolledCheck }, { data: ownerUser }] = await Promise.all([
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
    isSharedAccess
      ? adminClient.schema("admin").from("users").select("full_name").eq("id", effectiveParentId).single()
      : Promise.resolve({ data: null }),
  ]);

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const primaryOwnerName = (ownerUser as { full_name: string | null } | null)?.full_name ?? null;

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <DashboardHeader sticky>
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

      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

      <main className="flex-1">
        <VolunteerPageClient />
      </main>
      <Footer />
    </div>
  );
}
