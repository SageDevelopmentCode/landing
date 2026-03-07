import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import Link from "next/link";
import Image from "next/image";

export default async function ApplicationDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let app = null;
  if (user) {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .schema("parent_app")
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    app = data;
  }

  const g1Name = app?.g1_full_name ?? "Parent/Guardian";
  const childName = app?.preferred_name ?? app?.child_legal_name ?? "your child";

  return (
    <div className="min-h-screen bg-welcome-bg">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Image src="/assets/Logo.png" alt="Sage Field" width={80} height={32} className="object-contain" />
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full font-body border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Application Submitted
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Welcome back, {g1Name}.
          </h1>
          <p className="text-gray-500 font-body text-sm">
            Your application for <span className="font-semibold text-gray-700">{childName}</span> has been submitted. We&apos;ll be in touch soon.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <SummaryCard
            title="Child Info"
            fields={[
              { label: "Legal Name", value: app?.child_legal_name },
              { label: "Grade", value: app?.child_grade },
              { label: "Program", value: app?.program },
            ]}
            href="/apply/step/1"
          />
          <SummaryCard
            title="Guardian Info"
            fields={[
              { label: "Guardian 1", value: app?.g1_full_name },
              { label: "Relationship", value: app?.g1_relationship },
              { label: "Guardian 2", value: app?.g2_full_name ?? "N/A" },
            ]}
            href="/apply/step/2"
          />
          <SummaryCard
            title="Health & Safety"
            fields={[
              { label: "Medical Conditions", value: app?.has_medical_conditions === "yes" ? "Yes" : "None reported" },
              { label: "Allergies", value: app?.has_allergies === "yes" ? "Yes" : "None reported" },
              { label: "Needs Aide", value: app?.needs_aide === "yes" ? "Yes" : "No" },
            ]}
            href="/apply/step/3"
          />
          <SummaryCard
            title="Learning Profile"
            fields={[
              { label: "Learning Style", value: app?.learning_style },
              { label: "Strengths", value: app?.strengths_interests },
              { label: "Challenges", value: app?.current_challenges },
            ]}
            href="/apply/step/4"
          />
        </div>

        {/* What's Next */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 font-body uppercase tracking-wide mb-4">
            What&apos;s Next
          </h2>
          <p className="text-sm text-gray-500 font-body mb-4">
            If your application is accepted, you&apos;ll need to complete the following to finalize enrollment:
          </p>
          <ol className="flex flex-col gap-3">
            {[
              "Sign Enrollment Agreement",
              "Sign Liability Waiver",
              "Complete Medical & Emergency Authorization",
              "Sign Policies Acknowledgment",
              "Pay registration/materials fee",
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold font-body flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600 font-body">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 font-body mt-5">
            These steps will be sent to you by the Sage Field team once your application has been reviewed.
          </p>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  fields,
  href,
}: {
  title: string;
  fields: { label: string; value?: string | null }[];
  href: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 font-body">{title}</h3>
        <Link href={href} className="text-xs text-primary font-body hover:underline">
          View
        </Link>
      </div>
      <div className="flex flex-col gap-1.5">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-2 text-xs">
            <span className="text-gray-400 font-body w-28 flex-shrink-0">{f.label}</span>
            <span className="text-gray-700 font-body truncate">{f.value ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
