import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { colors, radius, shadows } from "./design-system";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminUser?.role === 'parent') {
    redirect('/apply/dashboard');
  }

  if (!adminUser || adminUser.role !== 'super_admin') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.softCloud }}
      >
        <div
          className="bg-white p-8 max-w-md w-full text-center"
          style={{
            borderRadius: radius.lg,
            boxShadow: shadows.medium,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: colors.errorText }}
          >
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            You do not have permission to access the admin area.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="px-6 py-4 text-white text-base font-medium transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: colors.mistyForest,
                borderRadius: "16px",
                boxShadow: shadows.soft,
                border: "none",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { count: pendingApplications } = await createAdminClient()
    .schema('parent_app')
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
    .eq('approved', false)

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: colors.softCloud }}
    >
      <Sidebar pendingApplications={pendingApplications ?? 0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar userEmail={user.email} signOutAction={signOut} />
        <main className="flex-1 px-3 sm:px-4 lg:px-6 w-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
