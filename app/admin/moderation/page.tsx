import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import { getAllConversations } from "./actions";
import { ModerationClient } from "./ModerationClient";

export default async function ModerationPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const conversations = await getAllConversations();

  return <ModerationClient initialConversations={conversations} />;
}
