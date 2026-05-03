import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ParentFeedClient from "@/app/parent/feed/ParentFeedClient";
import { getFeedPosts } from "@/app/teacher/feed/actions";

export default async function ImpersonateFeedPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const [{ data: adminUser }, initialPosts, { data: teachers }] =
    await Promise.all([
      adminClient
        .schema("admin")
        .from("users")
        .select("full_name, email, role, profile_image_url")
        .eq("id", parentId)
        .single(),
      getFeedPosts(),
      adminClient
        .schema("admin")
        .from("users")
        .select("id, full_name, role, profile_image_url")
        .in("role", ["teacher", "super_admin"])
        .eq("is_deleted", false)
        .order("full_name", { ascending: true }),
    ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";

  const currentUser = {
    full_name: adminUser.full_name,
    role: adminUser.role,
    id: parentId,
  };

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-center">
        <DashboardNav parentId={parentId} />
      </header>
      <main className="flex-1 flex flex-col overflow-hidden pointer-events-none select-none">
        <ParentFeedClient
          currentUser={currentUser}
          initialPosts={initialPosts}
          profileImageUrl={adminUser.profile_image_url ?? null}
          teachers={teachers ?? []}
        />
      </main>
    </div>
  );
}
