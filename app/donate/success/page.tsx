import { stripe } from "@/app/lib/stripe";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Heart } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function DonateSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let amountFormatted = "";
  let donorName = "";

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const cents = session.amount_total ?? 0;
      amountFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "usd",
      }).format(cents / 100);
      donorName = session.metadata?.donor_name || "";
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      <section className="py-24 px-8 sm:px-12 lg:px-16 pt-40">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-badge-bg flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary" fill="currentColor" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-black font-heading mb-4">
            Thank You{donorName ? `, ${donorName}` : ""}!
          </h1>

          {amountFormatted && (
            <p className="text-2xl font-semibold text-primary font-body mb-4">
              {amountFormatted} donated
            </p>
          )}

          <p className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-10">
            Your generosity helps us build a thriving outdoor learning
            environment for children in Central Texas. We&apos;ll send a
            receipt to your email shortly.
          </p>

          <Link
            href="/"
            className="inline-block px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
          >
            Back to Home
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
