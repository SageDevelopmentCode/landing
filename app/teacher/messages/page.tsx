import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import TeacherNav from "../dashboard/TeacherNav";
import TeacherMessagesPage from "./TeacherMessagesPage";

export default async function TeacherMessagesRoute({
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
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName = adminUser?.full_name ?? null;

  const params = await searchParams;
  const initialRecipientId = params.recipientId ?? null;
  const initialRecipientName = params.recipientName ?? null;

  return (
    <div className="bg-white h-screen overflow-hidden flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-3 items-center shrink-0">
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
            <ProfileDropdown email={user.email} fullName={fullName} />
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        <TeacherMessagesPage
          userId={user.id}
          initialRecipientId={initialRecipientId}
          initialRecipientName={initialRecipientName}
        />
      </main>
    </div>
  );
}
