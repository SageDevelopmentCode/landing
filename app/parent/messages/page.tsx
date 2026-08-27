import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import MessagesPage from "./MessagesPage";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";

export default async function MessagesRoute({
  searchParams,
}: {
  searchParams: Promise<{
    recipientId?: string;
    recipientName?: string;
    studentId?: string;
    tab?: string;
  }>;
}) {
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

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const isSharedAccess = !!grant;

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient.schema("admin").from("users").select("full_name").eq("id", effectiveParentId).single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  const params = await searchParams;
  const initialRecipientId = params.recipientId ?? null;
  const initialRecipientName = params.recipientName ?? null;
  const initialStudentId = params.studentId ?? null;
  const initialTab = params.tab === "community" ? "community" : "direct";

  return (
    <div className="bg-welcome-bg h-screen overflow-hidden">
      <div className="h-full flex flex-col">
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

        <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

        <main className="flex-1 min-h-0 flex flex-col">
          <MessagesPage
            userId={user.id}
            effectiveParentId={effectiveParentId}
            initialRecipientId={initialRecipientId}
            initialRecipientName={initialRecipientName}
            initialStudentId={initialStudentId}
            initialTab={initialTab}
          />
        </main>
      </div>
    </div>
  );
}
