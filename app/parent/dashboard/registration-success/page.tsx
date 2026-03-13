import { getStripe } from "@/app/lib/stripe";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function RegistrationSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let programLabel = "Summer 2026";

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      const cents = session.amount_total ?? 0;
      amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "usd",
      }).format(cents / 100);

      if (session.metadata?.application_ids) {
        // Combined payment — generic label
        programLabel = "all enrolled programs";
      } else {
        const program = session.metadata?.program ?? "summer_26";
        programLabel =
          program === "both"
            ? "Summer 2026 and the 2026–27 School Year"
            : program === "school_year_26_27"
            ? "the 2026–27 School Year"
            : "Summer 2026";
      }
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <div className="min-h-screen bg-welcome-bg flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold font-heading text-gray-800 mb-2">
          You&apos;re registered!
        </h1>

        {amountFormatted && (
          <p className="text-lg font-semibold text-emerald-600 font-body mb-3">
            {amountFormatted} received
          </p>
        )}

        <p className="text-sm text-gray-500 font-body mb-2">
          Thank you! Your child is now registered for {programLabel}. We&apos;ll be in touch with next steps soon.
        </p>
        <p className="text-sm text-gray-500 font-body mb-8">
          A receipt has been sent to your email.
        </p>

        <Link
          href="/parent/dashboard"
          className="inline-block px-6 py-3 bg-emerald-600 text-white text-sm font-semibold font-body rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
