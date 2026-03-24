import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import AdminMessagesPage from "./AdminMessagesPage";

export default async function AdminMessagesRoute() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AdminMessagesPage userId={user.id} />;
}
