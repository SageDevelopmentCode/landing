import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const adminClient = createAdminClient();
    const [{ data: adminUser }, { data: enrolledApp }] = await Promise.all([
      adminClient
        .schema("admin")
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single(),
      adminClient
        .schema("parent_app")
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "enrolled")
        .limit(1),
    ]);

    if (adminUser?.role === "super_admin") {
      redirect("/admin");
    } else if (adminUser?.role === "teacher") {
      redirect("/teacher/dashboard");
    } else if ((enrolledApp ?? []).length > 0) {
      redirect("/parent/home");
    } else {
      redirect("/apply/dashboard");
    }
  }

  return <LoginForm />;
}
