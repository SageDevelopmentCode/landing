import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import BillingPage from "./BillingPage";

export type PendingPaymentRequest = {
  id: string;
  student_id: string | null;
  program: string;
  payment_type: string;
  week: string | null;
  month: string | null;
  label: string;
  amount_cents: number | null;
  created_at: string;
};

export type StripeTransaction = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_type: string;
  status: string;
  amount_cents: number;
  intended_amount_cents: number | null;
  currency: string;
  cover_fees: boolean | null;
  payer_name: string | null;
  payer_email: string | null;
  description: string | null;
  student_id: string | null;
  application_id: string | null;
  parent_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
};

export default async function BillingRoute() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const [{ data: txData }, { data: adminUser }, { data: pendingData }] = await Promise.all([
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("*")
      .eq("parent_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("billing")
      .from("pending_payment_requests")
      .select("id, student_id, program, payment_type, week, month, label, amount_cents, created_at")
      .eq("parent_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const transactions = (txData ?? []) as StripeTransaction[];
  const pendingRequests = (pendingData ?? []) as PendingPaymentRequest[];
  const fullName = adminUser?.full_name ?? null;

  const studentIds = [
    ...new Set([
      ...transactions.map((t) => t.student_id),
      ...pendingRequests.map((p) => p.student_id),
    ].filter(Boolean)),
  ] as string[];

  let studentMap: Record<string, string> = {};
  if (studentIds.length > 0) {
    const { data: students } = await adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name")
      .in("id", studentIds);
    for (const s of students ?? []) {
      if (s.id && s.child_legal_name) studentMap[s.id] = s.child_legal_name;
    }
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-3 items-center">
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
            <DashboardNav />
          </div>
          <div className="flex items-center justify-end">
            {user?.email && (
              <ProfileDropdown email={user.email} fullName={fullName} />
            )}
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Tuition &amp; Billing
            </h1>
          </div>
          <BillingPage transactions={transactions} studentMap={studentMap} pendingRequests={pendingRequests} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
