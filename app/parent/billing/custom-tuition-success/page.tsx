import { getStripe } from "@/app/lib/stripe";
import SuccessCard from "../garden/SuccessCard";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CustomTuitionSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let planLabel = "Custom Tuition";

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      const cents = session.amount_total ?? 0;
      amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "usd",
      }).format(cents / 100);

      planLabel = session.metadata?.label ?? "Custom Tuition";
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <SuccessCard amount={amountFormatted}>
      <p>Thank you! Your payment for <strong>{planLabel}</strong> has been confirmed.</p>
    </SuccessCard>
  );
}
