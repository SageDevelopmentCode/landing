import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import MessagesPage from "./MessagesPage";
import { createAdminClient } from "@/app/lib/supabase-server";

export default async function MessagesRoute({
  searchParams,
}: {
  searchParams: Promise<{ recipientId?: string; recipientName?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, profile_image_url")
    .eq("id", user.id)
    .single();

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;

  const params = await searchParams;
  const initialRecipientId = params.recipientId ?? null;
  const initialRecipientName = params.recipientName ?? null;

  return (
    <div className="bg-welcome-bg h-screen overflow-hidden">
      <div className="h-full flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-3 items-center">
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
            <DashboardNav />
          </div>
          <div className="flex items-center justify-end">
            {user?.email && (
              <ProfileDropdown email={user.email} fullName={fullName} userId={user.id} profileImageUrl={profileImageUrl} />
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col">
          <MessagesPage
            userId={user.id}
            initialRecipientId={initialRecipientId}
            initialRecipientName={initialRecipientName}
          />
        </main>
      </div>
    </div>
  );
}
