"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import { formatPhone } from "../utils/formatPhone";

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors font-body text-base text-gray-900 placeholder:text-gray-500 bg-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3 font-body">
      {children}
    </p>
  );
}

const PRESET_AMOUNTS = [30, 50, 100, 150, 200];

export default function PayPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [payerName, setPayerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [memo, setMemo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [coverFees, setCoverFees] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const amountCents: number | null = isCustom
    ? customAmount
      ? Math.round(parseFloat(customAmount) * 100)
      : null
    : selectedPreset !== null
      ? selectedPreset * 100
      : null;

  const displayAmount =
    amountCents !== null ? `$${(amountCents / 100).toFixed(2)}` : null;

  const baseAmountDollars = amountCents !== null ? amountCents / 100 : 0;
  const cardFee = Math.round((baseAmountDollars * 0.029 + 0.3) * 100) / 100;
  const achFee = Math.min(Math.round(baseAmountDollars * 0.008 * 100) / 100, 5.0);
  const processingFee = paymentMethod === "card" ? cardFee : achFee;

  const isFormValid =
    !!payerName.trim() &&
    !!email.trim() &&
    amountCents !== null &&
    amountCents >= 100 &&
    coverFees;

  const handlePresetClick = (dollars: number) => {
    setSelectedPreset(dollars);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setSelectedPreset(null);
  };

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerName,
          email,
          phone: phone || undefined,
          childName: childName || undefined,
          childAge: childAge ? parseInt(childAge) : undefined,
          memo: memo || undefined,
          amountCents: amountCents!,
          coverFees,
          paymentMethod,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setSubmitError("Unexpected response. Please try again.");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkStyle={true} />

      {/* Hero */}
      <section className="bg-sage-50 pt-28 pb-6 sm:pt-32 sm:pb-8 px-4 sm:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4 font-body">
              Sage Field Private School
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-gray-800 mb-3">
              Make a Payment
            </h1>
            <p className="text-base text-gray-500 font-body leading-relaxed max-w-md mx-auto">
              Securely pay Sage Field for any amount. Cards and bank transfers accepted.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="pt-4 pb-10 sm:pt-6 sm:pb-14 px-4 sm:px-8 lg:px-16 bg-sage-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sm:p-8"
          >
            {/* Amount */}
            <SectionLabel>Amount</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_AMOUNTS.map((dollars) => (
                <button
                  key={dollars}
                  type="button"
                  onClick={() => handlePresetClick(dollars)}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm font-body border-2 transition-colors duration-150 cursor-pointer ${
                    !isCustom && selectedPreset === dollars
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  ${dollars}
                </button>
              ))}
              <button
                type="button"
                onClick={handleCustomClick}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm font-body border-2 transition-colors duration-150 cursor-pointer ${
                  isCustom
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:text-primary"
                }`}
              >
                Custom
              </button>
            </div>

            {isCustom && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-body text-base">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} pl-8`}
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* Payer Info */}
            <SectionLabel>Your Info</SectionLabel>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                  Your name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(512) 000-0000"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Child Info */}
            <SectionLabel>Child Info <span className="normal-case text-[10px] font-normal text-gray-400 ml-1">(optional)</span></SectionLabel>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                  Child&apos;s name
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="First and last name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                  Child&apos;s age
                </label>
                <select
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Select age</option>
                  {[4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                    <option key={age} value={age}>
                      {age} years old
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Memo */}
            <SectionLabel>Memo</SectionLabel>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">
                What is this payment for?
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="e.g. Discount, one-time payment, supply fee, tuition balance…"
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Payment Method + Fees */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 font-body mb-2">
                How will you be paying?
              </p>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold font-body border-2 transition-colors cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ach")}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold font-body border-2 transition-colors cursor-pointer ${
                    paymentMethod === "ach"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  ACH / US bank account
                </button>
              </div>
              {amountCents !== null && amountCents >= 100 && (
                <p className="text-xs text-gray-400 font-body mb-4">
                  {paymentMethod === "card"
                    ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
                    : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  className={`w-5 h-5 shrink-0 rounded border-2 mt-0.5 flex items-center justify-center transition-colors ${
                    coverFees ? "bg-primary border-primary" : "border-gray-300 bg-white"
                  }`}
                  onClick={() => setCoverFees((v) => !v)}
                >
                  {coverFees && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-600 font-body leading-snug">
                  I agree to pay the processing fee so Sage Field receives the full amount
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="mt-6 space-y-3">
              {submitError && (
                <p className="text-sm text-red-500 font-body text-center">{submitError}</p>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || submitting}
                className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body cursor-pointer shadow-md hover:shadow-lg text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting
                  ? "Submitting…"
                  : displayAmount
                    ? `Pay ${displayAmount} →`
                    : "Pay →"}
              </button>
              <p className="text-xs text-gray-400 font-body text-center">
                Secured by Stripe · Card and bank transfer accepted
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>
    </div>
  );
}
