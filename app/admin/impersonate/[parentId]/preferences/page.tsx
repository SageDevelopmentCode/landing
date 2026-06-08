import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import PreferencesPageClient from "@/app/parent/preferences/PreferencesPageClient";
import { getPublishedActivities } from "@/app/actions/activities";
import { computePaidDates } from "@/app/lib/compute-paid-dates";
import type { PreferenceChild, SavedPreference, StudentDefaultPreference } from "@/app/parent/preferences/page";

export default async function ImpersonatePreferencesPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const { effectiveParentId, isSharedAccess, ownerName } = await resolveEffectiveParentId(parentId);

  const [
    { data: adminUser },
    { data: studentsData },
    { data: txData },
    { data: savedPrefsData },
    activities,
    { data: studentDefaultsData },
  ] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email")
      .eq("id", parentId)
      .single(),
    adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("payment_type, status, student_id, metadata")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, activity_id, participation_level, notes")
      .eq("parent_id", effectiveParentId),
    getPublishedActivities(),
    adminClient
      .schema("parent_app")
      .from("student_default_preferences")
      .select("student_id, participation_level")
      .eq("parent_id", effectiveParentId),
  ]);

  if (!adminUser) notFound();

  const children: PreferenceChild[] = (studentsData ?? []) as PreferenceChild[];

  const paidSets = computePaidDates(txData ?? []);
  const paidDatesByStudent: Record<string, string[]> = {};
  for (const [id, set] of Object.entries(paidSets)) {
    paidDatesByStudent[id] = Array.from(set);
  }

  const savedPreferences: SavedPreference[] = (savedPrefsData ?? []) as SavedPreference[];
  const studentDefaults: StudentDefaultPreference[] = (studentDefaultsData ?? []) as StudentDefaultPreference[];

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={ownerName} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1 flex overflow-hidden pointer-events-none select-none">
        <PreferencesPageClient
          children={children}
          activities={activities}
          paidDatesByStudent={paidDatesByStudent}
          savedPreferences={savedPreferences}
          studentDefaults={studentDefaults}
        />
      </main>
    </div>
  );
}
