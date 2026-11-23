import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import ParentNewslettersClient from "@/app/parent/newsletters/ParentNewslettersClient";
import { getPublishedNewslettersList } from "@/app/actions/newsletter";

/**
 * Admin "view as parent" Newsletters. The page has no writes, so search, opening a
 * newsletter and copying its password stay clickable, like the Photos preview.
 */
export default async function ImpersonateNewslettersPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const [{ data: adminUser }, newsletters, { isSharedAccess, ownerName }] = await Promise.all([
    adminClient.schema("admin").from("users").select("full_name, email").eq("id", parentId).single(),
    getPublishedNewslettersList(),
    resolveEffectiveParentId(parentId),
  ]);

  if (!adminUser) notFound();

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={adminUser.full_name ?? null} parentEmail={(adminUser.email as string | null) ?? ""} />
      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={ownerName} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1">
        <ParentNewslettersClient newsletters={newsletters} />
      </main>
    </div>
  );
}
