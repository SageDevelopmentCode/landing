import { getStripe } from "@/app/lib/stripe";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: "Summer 2026",
  school_year_26_27: "School Year 2026–2027",
};

const TIER_LABELS: Record<string, string> = {
  dropin: "Explorer Day Pass",
  "2day": "2 Days / Week",
  "3day": "3 Days / Week",
};

export default async function HomeschoolSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let planLabel = "Homeschool Drop-In";

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      const cents = session.amount_total ?? 0;
      amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "usd",
      }).format(cents / 100);

      const program = session.metadata?.program ?? "summer_26";
      const tier = session.metadata?.tier ?? "dropin";
      const isSummer = program === "summer_26";
      const selectedDays = session.metadata?.selected_days
        ? session.metadata.selected_days.split(",").filter(Boolean)
        : [];
      const selectedWeeks = session.metadata?.selected_weeks
        ? session.metadata.selected_weeks.split(",").filter(Boolean).map(Number)
        : [];

      const programLabel = PROGRAM_LABELS[program] ?? program;
      const tierLabel = TIER_LABELS[tier] ?? tier;
      const daysStr = selectedDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
      const weeksStr = selectedWeeks.length > 0 ? `${selectedWeeks.length} week${selectedWeeks.length !== 1 ? "s" : ""} (${selectedWeeks.join(", ")})` : "";

      if (tier === "dropin") {
        planLabel = isSummer && weeksStr
          ? `Homeschool Drop-In (${tierLabel}) · ${programLabel} · ${weeksStr}`
          : `Homeschool Drop-In (${tierLabel}) · ${programLabel}`;
      } else {
        planLabel = isSummer && weeksStr
          ? `Homeschool Drop-In (${tierLabel} — ${daysStr}) · ${programLabel} · ${weeksStr}`
          : `Homeschool Drop-In (${tierLabel}${daysStr ? ` — ${daysStr}` : ""}) · ${programLabel}`;
      }
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <div className="min-h-screen bg-welcome-bg flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#d4e6d0" }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: "#4a7c59" }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold font-heading text-gray-800 mb-2">
          Payment received!
        </h1>

        {amountFormatted && (
          <p className="text-lg font-semibold font-body mb-3" style={{ color: "#4a7c59" }}>
            {amountFormatted} received
          </p>
        )}

        <p className="text-sm text-gray-500 font-body mb-2">
          Thank you! Your child&apos;s Homeschool Drop-In enrollment has been confirmed for {planLabel}.
        </p>
        <p className="text-sm text-gray-500 font-body mb-8">
          A receipt has been sent to your email.
        </p>

        <Link
          href="/parent/billing"
          className="inline-block px-6 py-3 text-white text-sm font-semibold font-body rounded-xl transition-colors"
          style={{ backgroundColor: "#4a7c59" }}
        >
          Back to Billing
        </Link>
      </div>
    </div>
  );
}
