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

export default async function FunFridaySuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let planLabel = "Fun Friday";

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
            ? `Fun Friday for ${months.join(", ")}`
            : "Fun Friday (Monthly)";
      } else {
        const fridays = session.metadata?.selected_fridays
          ? session.metadata.selected_fridays.split(",").filter(Boolean)
          : [];
        planLabel = `Fun Friday — ${fridays.length} session${fridays.length !== 1 ? "s" : ""}`;
      }
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <SuccessCard amount={amountFormatted}>
      <p>Thank you! Your child is registered for {planLabel}. We&apos;ll be in touch with details soon.</p>
    </SuccessCard>
  );
}
