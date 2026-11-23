import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import VolunteerPageClient from "@/app/parent/volunteer/VolunteerPageClient";

/**
 * Admin "view as parent" Volunteer. Reuses the real page in `readOnlyPreview`:
 * the interest sheet opens, but submitting shows the "Preview mode" toast.
 */
export default async function ImpersonateVolunteerPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const [{ data: adminUser }, { isSharedAccess, ownerName }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email")
      .eq("id", parentId)
      .single(),
    resolveEffectiveParentId(parentId),
  ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={ownerName} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1 pointer-events-none select-none">
        <VolunteerPageClient readOnlyPreview />
      </main>
    </div>
  );
}
