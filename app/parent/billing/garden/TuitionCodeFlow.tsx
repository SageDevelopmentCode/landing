"use client";

import { useId, useState } from "react";
import { formatCents } from "@/shared/billing/school-year";
import { CheckIcon, Spinner, StepLabel, btnInkSm } from "@/app/parent/_garden/ui";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { CheckoutFooter, CheckoutSheet, ContinueButton, PayButton, PaymentMethodStep, usePayCheckout } from "./checkout";
import {
  buildTuitionCodeCheckout,
  buildValidateTuitionCode,
  tuitionCodePaymentQuote,
  type PaymentMethod,
  type TuitionCodeResult,
} from "./payloads";

/** Enter → validate → pay, in one sheet. */
export default function TuitionCodeFlow({
  parentId,
  parentEmail,
  recentTuitionCodes,
  readOnly,
  onClose,
}: {
  parentId: string;
  parentEmail: string;
  recentTuitionCodes: string[];
  readOnly?: boolean;
  onClose: () => void;
}) {
  const inputId = useId();
  const errId = useId();
  const [step, setStep] = useState<"enter" | "pay">("enter");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TuitionCodeResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(readOnly);
  const { toast } = usePortalFeedback(readOnly);

  async function validate() {
    if (!code.trim() || checking) return;
    setChecking(true);
    setError(null);
    setResult(null);
    try {
      const req = buildValidateTuitionCode(code, parentId);
      const res = await fetch(req.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code. Please check and try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
      toast.show({ tone: "error", title: "Couldn't check that code", message: "Please check your connection and try again.", action: { label: "Try again", onClick: () => void validate() } });
    } finally {
      setChecking(false);
    }
  }

  const quote = result ? tuitionCodePaymentQuote(result.amount_cents, coverFees, paymentMethod) : null;

  return (
    <CheckoutSheet
      open
      onClose={onClose}
      busy={busy}
      title={step === "enter" ? "Enter Tuition Code" : "Confirm Payment"}
      icon="🏷️"
      steps={["Code", "Pay"]}
      step={step === "enter" ? 1 : 2}
      footer={
        step === "enter" ? (
          <CheckoutFooter
            primary={
              result ? (
                <ContinueButton onClick={() => setStep("pay")}>Continue · {formatCents(result.amount_cents)}</ContinueButton>
              ) : (
                <ContinueButton disabled onClick={() => {}}>Continue</ContinueButton>
              )
            }
            status={result ? null : "Apply a code to continue"}
          />
        ) : (
          <CheckoutFooter
            onBack={busy ? undefined : () => setStep("enter")}
            primary={<PayButton busy={busy} disabled={!coverFees} totalCents={quote?.totalWithFees ?? 0} onClick={() => result && pay(() => buildTuitionCodeCheckout({ parentId, parentEmail, result, coverFees, paymentMethod }))} />}
          />
        )
      }
    >
      {step === "enter" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void validate();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <StepLabel n={1} done={!!result}>
              <label htmlFor={inputId}>Enter the tuition code provided by the school.</label>
            </StepLabel>
            <div className="flex gap-2">
              <input
                id={inputId}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setResult(null);
                  setError(null);
                }}
                placeholder="e.g. SMITH900"
                aria-invalid={!!error || undefined}
                aria-describedby={error ? errId : undefined}
                autoComplete="off"
                data-autofocus
                className="min-h-11 min-w-0 flex-1 rounded-full border-0 bg-white px-4 text-sm font-extrabold uppercase tracking-widest ring-1 ring-[var(--sf-ink)]/15 placeholder:font-bold placeholder:tracking-normal placeholder:text-[var(--sf-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--sf-sage)]"
              />
              <button type="submit" disabled={checking || !code.trim()} className={btnInkSm}>
                {checking ? (
                  <>
                    <Spinner /> Checking…
                  </>
                ) : (
                  "Apply Code"
                )}
              </button>
            </div>
          </div>
          {recentTuitionCodes.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-extrabold text-[var(--sf-soft)]">Recently used</p>
              <div className="flex flex-wrap gap-2">
                {recentTuitionCodes.map((rc) => (
                  <button
                    key={rc}
                    type="button"
                    onClick={() => {
                      setCode(rc);
                      setError(null);
                      setResult(null);
                    }}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[var(--sf-sky)] px-4 text-xs font-extrabold tracking-widest text-[#2d5d86] transition hover:-translate-y-0.5"
                  >
                    {rc}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div aria-live="polite">
            {error ? (
              <p id={errId} className="rounded-[18px] bg-[var(--sf-coral)]/20 px-4 py-3 text-sm font-extrabold text-[var(--sf-coral-deep)]">
                {error}
              </p>
            ) : result ? (
              <div className="flex items-center gap-3 rounded-[22px] bg-[var(--sf-mint)]/70 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white">
                  <CheckIcon />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[var(--sf-soft)]">You&apos;re paying for</span>
                  <span className="block text-sm font-extrabold">{result.label}</span>
                </span>
                <span className="sf-display ml-auto text-xl">{formatCents(result.amount_cents)}</span>
              </div>
            ) : null}
          </div>
        </form>
      ) : result && quote ? (
        <PaymentMethodStep
          method={paymentMethod}
          onMethod={setPaymentMethod}
          feeLine={quote.feeLine}
          coverFees={coverFees}
          onCoverFees={setCoverFees}
          totalCents={null}
          checkNote="short"
          stepNumber={2}
        >
          <div className="rounded-[22px] bg-[var(--sf-sky)]/60 p-4">
            <p className="text-xs font-bold text-[var(--sf-soft)]">You&apos;re paying for</p>
            <p className="text-sm font-extrabold">{result.label}</p>
            <p className="sf-display mt-1 text-2xl">{formatCents(result.amount_cents)}</p>
          </div>
        </PaymentMethodStep>
      ) : null}
    </CheckoutSheet>
  );
}
