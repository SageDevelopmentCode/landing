import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Inter } from "next/font/google";
import { Sidebar } from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import { cssColors as colors, radius, cssShadows as shadows } from "./design-system";

const inter = Inter({ subsets: ["latin"], variable: "--font-admin-inter" });

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
        style={{ backgroundColor: colors.bg }}
      >
        <div
          className="p-8 max-w-md w-full text-center"
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            boxShadow: shadows.medium,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: colors.error }}
          >
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            You do not have permission to access the admin area.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="px-6 py-3 text-white text-sm font-medium transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: colors.accent,
                borderRadius: radius.lg,
                boxShadow: shadows.medium,
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
    .eq('status', 'in_review')

  return (
    <ThemeProvider>
      <div
        className={`${inter.variable} h-screen flex overflow-hidden`}
        style={{ backgroundColor: colors.bg, fontFamily: "var(--font-admin-inter, Inter, sans-serif)" }}
      >
        <Sidebar
          pendingApplications={pendingApplications ?? 0}
          userEmail={user.email}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 w-full overflow-auto flex flex-col">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
