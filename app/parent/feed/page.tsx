import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import DashboardNav from "../dashboard/DashboardNav";
import ParentFeedClient from "./ParentFeedClient";
import { getFeedPosts } from "@/app/teacher/feed/actions";

export default async function ParentFeedPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  let currentUser: { full_name: string; role: string; id: string } | null = null;

  const [{ data: adminUser }, initialPosts, { data: teachers }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, role, profile_image_url")
      .eq("id", user.id)
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

  if (adminUser) {
    currentUser = {
      full_name: adminUser.full_name,
      role: adminUser.role,
      id: user.id,
    };
  }

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
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
            <ProfileDropdown
              email={user.email}
              fullName={currentUser?.full_name ?? null}
              userId={user.id}
              profileImageUrl={adminUser?.profile_image_url ?? null}
            />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <ParentFeedClient
          currentUser={currentUser}
          initialPosts={initialPosts}
          profileImageUrl={adminUser?.profile_image_url ?? null}
          teachers={teachers ?? []}
        />
      </main>
    </div>
  );
}
