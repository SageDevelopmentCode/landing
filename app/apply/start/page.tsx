import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import StartPageClient from "./StartPageClient";

export default async function StartPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/apply/dashboard");
  return <StartPageClient />;
}
