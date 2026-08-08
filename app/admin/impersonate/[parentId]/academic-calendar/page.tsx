import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import ParentAcademicCalendarClient from "@/app/parent/academic-calendar/ParentAcademicCalendarClient";

export default async function ImpersonateAcademicCalendarPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, email")
    .eq("id", parentId)
    .single();

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 pointer-events-none select-none">
        <ParentAcademicCalendarClient />
      </main>
    </div>
  );
}
