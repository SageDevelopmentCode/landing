import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardHeader from "../dashboard/DashboardHeader";
import DashboardNav from "../dashboard/DashboardNav";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";
import ParentAcademicCalendarClient from "./ParentAcademicCalendarClient";

export default async function ParentAcademicCalendarPage() {
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

  const isSharedAccess = !!grant;

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
          fullName={adminUser?.full_name ?? null}
          profileImageUrl={adminUser?.profile_image_url ?? null}
        />
      </DashboardHeader>

      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <ParentAcademicCalendarClient />
      </main>
    </div>
  );
}
