import { getStripe } from "@/app/lib/stripe";
import SuccessCard from "../garden/SuccessCard";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SummerSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let planLabel = "Summer 2026";

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      const cents = session.amount_total ?? 0;
      amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "usd",
      }).format(cents / 100);

      const planType = session.metadata?.plan_type ?? "full";
      const weeksStr = session.metadata?.weeks ?? "";
      const weekCount = weeksStr ? weeksStr.split(",").filter(Boolean).length : 0;

      planLabel =
        planType === "full"
          ? "the Full Summer (12 weeks)"
          : `${weekCount} week${weekCount !== 1 ? "s" : ""} of Summer 2026`;
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
