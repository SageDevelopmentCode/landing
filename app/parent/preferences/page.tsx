import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";
import PreferencesPageClient from "./PreferencesPageClient";
import { getPublishedActivities } from "@/app/actions/activities";
import { computePaidDates } from "@/app/lib/compute-paid-dates";

export type PreferenceChild = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
};

export type PaidDatesByStudent = Record<string, string[]>;

export type SavedPreference = {
  student_id: string;
  activity_id: string;
  participation_level: "watch" | "cook_no_eat" | "full";
  notes: string;
};

export default async function PreferencesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;

  const [
    { data: adminUser },
    { data: enrolledCheck },
    { data: studentsData },
    { data: txData },
    { data: savedPrefsData },
    activities,
  ] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", effectiveParentId)
      .eq("status", "enrolled")
      .limit(1),
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
  ]);

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const isSharedAccess = !!grant;

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient.schema("admin").from("users").select("full_name").eq("id", effectiveParentId).single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }
  const children: PreferenceChild[] = (studentsData ?? []) as PreferenceChild[];

  const paidSets = computePaidDates(txData ?? []);
  const paidDatesByStudent: PaidDatesByStudent = {};
  for (const [id, set] of Object.entries(paidSets)) {
    paidDatesByStudent[id] = Array.from(set);
  }

  const savedPreferences: SavedPreference[] = (savedPrefsData ?? []) as SavedPreference[];

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        <DashboardHeader>
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
            <DashboardNav hasEnrolledStudent={(enrolledCheck ?? []).length > 0} />
          </div>
          <ParentHeaderRight
            userId={user.id}
            email={user.email ?? ""}
            fullName={fullName}
            profileImageUrl={profileImageUrl}
          />
        </DashboardHeader>

        <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

        <main className="flex-1 flex overflow-hidden">
          <PreferencesPageClient
            children={children}
            activities={activities}
            paidDatesByStudent={paidDatesByStudent}
            savedPreferences={savedPreferences}
            isSharedAccess={isSharedAccess}
          />
        </main>
      </div>
      <Footer />
    </div>
  );
}
