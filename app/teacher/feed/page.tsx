import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import TeacherNav from "../dashboard/TeacherNav";
import TeacherFeedClient from "./TeacherFeedClient";
import { getFeedPosts } from "./actions";

export default async function TeacherFeedPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  let currentUser: { full_name: string; role: string; id: string } | null = null;

  const [{ data: adminUser }, initialPosts] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, role, profile_image_url")
      .eq("id", user.id)
      .single(),
    getFeedPosts(),
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
          <TeacherNav />
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
        <TeacherFeedClient
          currentUser={currentUser}
          initialPosts={initialPosts}
        />
      </main>
    </div>
  );
}
