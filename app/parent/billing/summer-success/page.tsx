import { getStripe } from "@/app/lib/stripe";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-welcome-bg flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#fde8d8" }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: "#e07a3a" }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold font-heading text-gray-800 mb-2">
          Payment received!
        </h1>

        {amountFormatted && (
          <p className="text-lg font-semibold font-body mb-3" style={{ color: "#e07a3a" }}>
            {amountFormatted} received
          </p>
        )}

        <p className="text-sm text-gray-500 font-body mb-2">
          Thank you! Your child is registered for {planLabel}. We&apos;ll be in touch with details soon.
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
