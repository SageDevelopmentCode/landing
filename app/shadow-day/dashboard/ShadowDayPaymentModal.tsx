"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Booking {
  id: string;
  shadow_date: string;
  child_name: string;
}

function formatShadowDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ShadowDayPaymentModal({
  booking,
  userEmail,
  userId,
  onClose,
}: {
  booking: Booking;
  userEmail: string;
  userId: string;
  onClose: () => void;
}) {
  const [coverFees, setCoverFees] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBase = 95;
  const cardFee = Math.round((totalBase * 0.029 + 0.3) * 100) / 100;
  const achFee = Math.min(Math.round(totalBase * 0.008 * 100) / 100, 5.0);

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-shadow-day-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          bookingId: booking.id,
          coverFees,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
      >
        <h2 className="text-lg font-bold font-heading text-gray-800 mb-1">
          Pay Shadow Day Fee
        </h2>
        <p className="text-sm text-gray-500 font-body mb-5">
          {booking.child_name} &mdash; {formatShadowDate(booking.shadow_date)}
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm font-body">
            <span className="text-gray-600">Shadow day visit fee</span>
            <span className="font-semibold text-gray-800">$95.00</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 font-body mb-2">
            How will you be paying?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                paymentMethod === "card"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Credit/Debit Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("ach")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                paymentMethod === "ach"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ACH / US bank account
            </button>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1.5">
            {paymentMethod === "card"
              ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
              : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
          </p>
        </div>

        <label className="flex items-start gap-3 mb-5 cursor-pointer group">
          <input
            type="checkbox"
            checked={coverFees}
            onChange={(e) => setCoverFees(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
          />
          <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
            I agree to pay the processing fee
          </span>
        </label>

        <p className="text-xs text-gray-400 font-body mb-5">
          Prefer to pay by check? Email us at{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="underline hover:text-gray-600 transition-colors"
          >
            sabrina@sagefield.co
          </a>{" "}
          and we&apos;ll send you instructions.
        </p>

        {error && (
          <p className="text-sm text-red-600 font-body mb-4">{error}</p>
        )}

        <p className="text-xs text-gray-400 font-body mb-4">
          Shadow day fees are non-refundable. The $95 fee is waived if you enroll within 14 days of your child&apos;s visit.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={loading || !coverFees}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting…
              </>
            ) : (
              "Proceed to Payment"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
