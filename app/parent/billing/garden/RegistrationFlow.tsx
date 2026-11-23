"use client";

import { useState } from "react";
import { CheckoutFooter, CheckoutSheet, PayButton, PaymentMethodStep, usePayCheckout } from "./checkout";
import { buildRegistrationCheckout, registrationPaymentQuote, type PaymentMethod } from "./payloads";
import { TotalRow } from "./parts";

/** "Commit to School Year": the $500 School Year 2026–2027 registration fee. */
export default function RegistrationFlow({
  app,
  type,
  studentName,
  parentId,
  parentEmail,
  readOnly,
  onClose,
}: {
  app: { student_id: string; id: string };
  type: "drop_in" | "full_time";
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(readOnly);
  const quote = registrationPaymentQuote(coverFees, paymentMethod);

  return (
    <CheckoutSheet
      open
      onClose={onClose}
      busy={busy}
      title="School Year 2026–2027 Registration Fee"
      icon="🌱"
      note={studentName ?? undefined}
      steps={[]}
      step={1}
      footer={
        <CheckoutFooter
          primary={
            <PayButton
              busy={busy}
              disabled={!coverFees}
              totalCents={quote.totalWithFees}
              onClick={() => pay(() => buildRegistrationCheckout({ parentId, parentEmail, app, type, coverFees, paymentMethod }))}
            />
          }
        />
      }
    >
      <PaymentMethodStep
        method={paymentMethod}
        onMethod={setPaymentMethod}
        feeLine={quote.feeLine}
        coverFees={coverFees}
        onCoverFees={setCoverFees}
        totalCents={null}
        stepNumber={1}
      >
        <TotalRow label="Registration fee" value="$500.00" />
        <div className="rounded-[22px] bg-white px-4 py-3 ring-1 ring-[var(--sf-ink)]/10">
          <p className="text-sm font-extrabold">What this covers</p>
          <p className="mt-1 text-sm font-semibold text-[var(--sf-soft)]">
            {studentName ? `${studentName} will` : "Your child will"} remain enrolled as a{" "}
            <span className="font-extrabold text-[var(--sf-ink)]">{type === "full_time" ? "Full Time" : "Homeschool Drop-In"}</span> student and will also be
            secured for the <span className="font-extrabold text-[var(--sf-ink)]">2026–2027 School Year</span> program. This $500 registration fee holds their
            spot.
          </p>
        </div>
      </PaymentMethodStep>
    </CheckoutSheet>
  );
}
