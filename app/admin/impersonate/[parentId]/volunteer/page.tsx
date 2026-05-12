import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import { Heart } from "lucide-react";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";

export default async function ImpersonateVolunteerPage({
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
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full pointer-events-none select-none">
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
        </div>
      </main>
    </div>
  );
}
