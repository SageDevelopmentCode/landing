import { getStripe } from "@/app/lib/stripe";
import SuccessCard from "../garden/SuccessCard";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

const MONTH_LABELS: Record<string, string> = {
  may: "May 2026",
  jun: "June 2026",
  jul: "July 2026",
  aug: "August 2026",
};

export default async function AftercareSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let planLabel = "After Care";

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      const cents = session.amount_total ?? 0;
      amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "usd",
      }).format(cents / 100);

      const planType = session.metadata?.plan_type ?? "monthly";

      if (planType === "monthly") {
        const months = session.metadata?.selected_months
          ? session.metadata.selected_months.split(",").filter(Boolean).map((k) => MONTH_LABELS[k] ?? k)
          : [];
        planLabel =
          months.length > 0
            ? `After Care for ${months.join(", ")}`
            : "After Care (Monthly)";
      } else {
        const days = session.metadata?.selected_days
          ? session.metadata.selected_days.split(",").filter(Boolean)
          : [];
        planLabel = `After Care — ${days.length} day${days.length !== 1 ? "s" : ""}`;
      }
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <SuccessCard amount={amountFormatted}>
      <p>Thank you! Your child is enrolled in {planLabel}. We&apos;ll be in touch with details soon.</p>
    </SuccessCard>
  );
}
