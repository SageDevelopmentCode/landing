import { getStripe } from "@/app/lib/stripe";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-welcome-bg flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#ccfbf1" }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: "#0d9488" }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold font-heading text-gray-800 mb-2">
          Payment received!
        </h1>

        {amountFormatted && (
          <p className="text-lg font-semibold font-body mb-3" style={{ color: "#0d9488" }}>
            {amountFormatted} received
          </p>
        )}

        <p className="text-sm text-gray-500 font-body mb-2">
          Thank you! Your payment for <strong>{planLabel}</strong> has been confirmed.
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
