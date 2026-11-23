"use client";

import { useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { Segmented } from "@/app/parent/_garden/tabs";
import { CheckboxRow, InlineError } from "@/app/parent/_garden/fields";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { Spinner, btnCoralSm, btnGhostSm, cardBase } from "@/app/parent/_garden/ui";
import {
  getBillingProgramLabel,
  getProgramLineLabel,
  getRegistrationFeeCents,
  getRegistrationFeeLines,
} from "@/app/lib/application-programs";
import { childNameOf, type Application } from "./checklist";

type Method = "card" | "ach";

const dropInOf = (a: Application) => (a as Record<string, unknown>).drop_in_program as string | null;
const money = (n: number) => `$${n.toFixed(2)}`;

function feeEstimate(total: number, method: Method) {
  const cardFee = Math.round((total * 0.029 + 0.3) * 100) / 100;
  const achFee = Math.min(Math.round(total * 0.008 * 100) / 100, 5.0);
  return method === "card"
    ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
    : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`;
}

/**
 * Registration fee checkout in one sheet. `apps` with more than one entry is the combined
 * "pay together" flow; one entry is a single child. Nothing is marked paid here: the
 * checklist only flips to "✓ Paid" once Stripe sends the parent back and the server says so.
 */
export default function FeeSheet({
  open,
  apps,
  parentEmail,
  onClose,
  onPayIndividually,
  readOnlyPreview,
}: {
  open: boolean;
  apps: Application[];
  parentEmail: string;
  onClose: () => void;
  /** Combined flow only: switch to paying for the active child alone. */
  onPayIndividually?: () => void;
  readOnlyPreview?: boolean;
}) {
  const { toast, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const [method, setMethod] = useState<Method>("card");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const combined = apps.length > 1;
  const single = apps[0];
  const total = combined
    ? apps.reduce((sum, a) => sum + getRegistrationFeeCents(a.program, dropInOf(a)) / 100, 0)
    : single
      ? getRegistrationFeeCents(single.program, dropInOf(single)) / 100
      : 0;
  const lines = !combined && single ? getRegistrationFeeLines(single.program, dropInOf(single)) : [];

  const close = () => {
    if (!loading) onClose();
  };

  const pay = async () => {
    if (!single || blockedByPreview()) return;
    setLoading(true);
    setError(null);
    const loadingId = toast.show({ tone: "loading", title: "Opening secure checkout…" });
    try {
      const res = combined
        ? await fetch("/api/stripe/create-combined-registration-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentId: single.user_id,
              parentEmail,
              coverFees: agreed,
              paymentMethod: method,
              children: apps.map((a) => ({
                studentId: a.student_id ?? "",
                applicationId: a.id,
                program: a.program ?? "summer_26",
                dropInProgram: dropInOf(a) ?? undefined,
                childName: childNameOf(a),
              })),
            }),
          })
        : await fetch("/api/stripe/create-registration-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentId: single.user_id,
              parentEmail,
              studentId: single.student_id,
              applicationId: single.id,
              coverFees: agreed,
              paymentMethod: method,
              program: single.program ?? "summer_26",
              dropInProgram: dropInOf(single),
            }),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        const message = data.error ?? "Something went wrong. Please try again.";
        setError(message);
        toast.update(loadingId, {
          tone: "error",
          title: "Couldn't open checkout",
          message,
          action: { label: "Try again", onClick: () => void pay() },
        });
        setLoading(false);
        return;
      }
      toast.update(loadingId, { tone: "loading", title: "Taking you to checkout…" });
      window.location.assign(data.url);
    } catch {
      setError("Network error. Please try again.");
      toast.update(loadingId, {
        tone: "error",
        title: "Couldn't open checkout",
        message: "Please check your connection and try again.",
        action: { label: "Try again", onClick: () => void pay() },
      });
      setLoading(false);
    }
  };

  return (
    <GardenSheet
      open={open}
      onClose={close}
      icon="💳"
      title={combined ? "Pay Registration Fees" : "Pay Registration Fee"}
      note={combined ? `${apps.length} children · one checkout` : single ? `${childNameOf(single)} · ${getBillingProgramLabel(single.program, dropInOf(single))}` : undefined}
      footer={
        <div className="flex flex-col gap-2">
          <button type="button" className={`${btnCoralSm} min-h-[52px] w-full text-base`} onClick={() => void pay()} disabled={loading || !agreed} aria-busy={loading || undefined}>
            {loading ? <Spinner /> : null}
            {loading ? "Redirecting…" : combined ? "Pay All Together" : "Proceed to Payment"}
          </button>
          {combined && onPayIndividually ? (
            <button type="button" className={`${btnGhostSm} w-full`} onClick={onPayIndividually} disabled={loading}>
              Pay individually instead
            </button>
          ) : null}
          <p className="text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
            {agreed ? "Registration fees are non-refundable." : "Tick the processing fee box to continue"}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pt-1">
        {combined ? (
          <p className="text-[15px] font-semibold text-[var(--sf-soft)]">
            You have {apps.length} children with unpaid registration fees. Save on processing by paying together.
          </p>
        ) : null}

        {/* Receipt-style summary */}
        <div className={`${cardBase} px-5 py-4`}>
          <ul className="flex flex-col gap-2.5">
            {combined
              ? apps.map((a) => (
                  <li key={a.id} className="flex items-baseline justify-between gap-4 text-[15px]">
                    <span className="min-w-0 font-bold">
                      {childNameOf(a)} <span className="font-semibold text-[var(--sf-soft)]">({getProgramLineLabel(a.program, dropInOf(a))})</span>
                    </span>
                    <span className="shrink-0 font-extrabold tabular-nums">{money(getRegistrationFeeCents(a.program, dropInOf(a)) / 100)}</span>
                  </li>
                ))
              : lines.length > 1
                ? lines.map((line) => (
                    <li key={line.component} className="flex items-baseline justify-between gap-4 text-[15px]">
                      <span className="min-w-0 font-bold">{line.name.replace(" Registration Fee", " registration")}</span>
                      <span className="shrink-0 font-extrabold tabular-nums">{money(line.cents / 100)}</span>
                    </li>
                  ))
                : (
                    <li className="flex items-baseline justify-between gap-4 text-[15px]">
                      <span className="font-bold">Registration fee</span>
                      <span className="font-extrabold tabular-nums">{money(total)}</span>
                    </li>
                  )}
          </ul>
          {combined || lines.length > 1 ? (
            <div className="mt-3 flex items-baseline justify-between gap-4 border-t-2 border-dashed border-[var(--sf-ink)]/10 pt-3">
              <span className="text-[15px] font-extrabold">{combined ? "Combined Total" : "Total"}</span>
              <span className="sf-display text-2xl tabular-nums">{money(total)}</span>
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold">How will you be paying?</p>
          <Segmented
            label="Payment method"
            fullWidth
            value={method}
            onChange={setMethod}
            options={[
              { value: "card", label: "Credit/Debit Card" },
              { value: "ach", label: "ACH / US bank account" },
            ]}
          />
          <p className="mt-2 text-xs font-bold text-[var(--sf-soft)]">{feeEstimate(total, method)}</p>
        </div>

        <CheckboxRow checked={agreed} onChange={setAgreed} disabled={loading}>
          I agree to pay the processing fee
        </CheckboxRow>

        <p className="text-sm font-semibold text-[var(--sf-soft)]">
          Prefer to pay by check? Email us at{" "}
          <a href="mailto:sabrina@sagefield.co" className="font-extrabold text-[var(--sf-sage-deep)] underline underline-offset-2">
            sabrina@sagefield.co
          </a>{" "}
          and we&apos;ll send you instructions.
        </p>

        <InlineError>{error}</InlineError>
      </div>
    </GardenSheet>
  );
}
