import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import ParentPhotosClient from "@/app/parent/photos/ParentPhotosClient";
import { getAllSchoolPhotos } from "@/app/actions/photos";

/**
 * Admin "view as parent" Photos. The page is read-only (no writes), so browsing and the
 * lightbox stay clickable; there is nothing to block.
 */
export default async function ImpersonatePhotosPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const [{ data: adminUser }, initialPhotos] = await Promise.all([
    adminClient.schema("admin").from("users").select("full_name, email").eq("id", parentId).single(),
    getAllSchoolPhotos(),
  ]);

  if (!adminUser) notFound();

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={adminUser.full_name ?? null} parentEmail={(adminUser.email as string | null) ?? ""} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1">
        <ParentPhotosClient initialPhotos={initialPhotos} />
      </main>
    </div>
  );
}
