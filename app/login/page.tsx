import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const adminClient = createAdminClient();
    const { data: adminUser } = await adminClient
      .schema("admin")
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminUser?.role === "super_admin") {
      redirect("/admin");
    } else {
      redirect("/apply/dashboard");
    }
  }

  return <LoginForm />;
}
