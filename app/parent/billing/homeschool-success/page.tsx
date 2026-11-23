import { getStripe } from "@/app/lib/stripe";
import SuccessCard from "../garden/SuccessCard";

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
    <SuccessCard amount={amountFormatted}>
      <p>Thank you! Your child&apos;s Homeschool Drop-In enrollment has been confirmed for {planLabel}.</p>
    </SuccessCard>
  );
}
