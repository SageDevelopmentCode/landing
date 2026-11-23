"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { Segmented } from "@/app/parent/_garden/tabs";
import { Spinner, StepProgress, StepLabel, btnCoralSm, btnGhostSm, btnInkSm } from "@/app/parent/_garden/ui";
import { formatCents } from "@/shared/billing/school-year";
import type { CheckoutRequest, PaymentMethod, SiblingSelection } from "./payloads";
import { EmailUs, TotalRow } from "./parts";

// ─── Paying: one request, one navigation, no double submit ──────────────────

/**
 * Sends a checkout request built by `payloads.ts` and navigates to Stripe.
 * The busy state stays on until the browser leaves the page, so the button can't be
 * pressed twice. Errors (including a response without a `url`) show a toast with Try again.
 */
export function usePayCheckout(readOnly: boolean | undefined) {
  const { toast, blockedByPreview } = usePortalFeedback(readOnly);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const pay = useCallback(
    async function attempt(build: () => CheckoutRequest | null, retryLabel = "Couldn't open checkout"): Promise<void> {
      if (inFlight.current) return;
      if (blockedByPreview()) return;
      const req = build();
      if (!req) return;
      inFlight.current = true;
      setBusy(true);
      let message = "Please check your connection and try again.";
      try {
        const res = await fetch(req.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data?.url === "string" && data.url) {
          // Keep `busy` on: the page is navigating away.
          window.location.href = data.url;
          return;
        }
        if (typeof data?.error === "string" && data.error) message = data.error;
        else if (res.ok) message = "Checkout didn't start. Please try again.";
      } catch {
        /* network error: default message */
      }
      inFlight.current = false;
      setBusy(false);
      toast.show({
        tone: "error",
        title: retryLabel,
        message,
        action: { label: "Try again", onClick: () => void attempt(build, retryLabel) },
      });
    },
    [blockedByPreview, toast],
  );

  return { busy, pay };
}

/** Saves a note (summer / homeschool) with success and error toasts. */
export function useSaveNote(readOnly: boolean | undefined) {
  const { runSave } = usePortalFeedback(readOnly);
  const [saving, setSaving] = useState(false);
  const save = useCallback(
    async (build: () => CheckoutRequest) => {
      setSaving(true);
      const attempt = async (): Promise<boolean> =>
        runSave({
          successTitle: "Note saved",
          successMessage: "We'll hold your spot.",
          errorTitle: "Couldn't save your note",
          retry: () => void attempt(),
          fn: async () => {
            const req = build();
            const res = await fetch(req.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(req.body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) console.error("save note error:", data?.error);
            return { ok: res.ok };
          },
        });
      const ok = await attempt();
      setSaving(false);
      return ok;
    },
    [runSave],
  );
  return { saving, save };
}

// ─── Sheet shell ────────────────────────────────────────────────────────────

export function CheckoutSheet({
  open,
  onClose,
  title,
  icon,
  note,
  steps,
  step,
  busy,
  footer,
  toolbar,
  onBack,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  icon: string;
  note?: ReactNode;
  /** Short step labels; the progress bar is hidden for single-step sheets. */
  steps: string[];
  step: number;
  /** A request is in flight: Esc and the backdrop don't close the sheet. */
  busy?: boolean;
  footer?: ReactNode;
  toolbar?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <GardenSheet
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      icon={icon}
      note={note}
      onBack={onBack}
      toolbar={
        steps.length > 1 || toolbar ? (
          <div className="flex flex-col gap-3">
            {steps.length > 1 ? <StepProgress current={step} total={steps.length} labels={steps} /> : null}
            {toolbar}
          </div>
        ) : undefined
      }
      footer={footer}
    >
      {children}
    </GardenSheet>
  );
}

/** Back / Continue / Pay footer. */
export function CheckoutFooter({
  onBack,
  backLabel = "Back",
  primary,
  status,
}: {
  onBack?: () => void;
  backLabel?: string;
  primary: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div>
      <div className="flex gap-2.5">
        {onBack ? (
          <button type="button" onClick={onBack} className={`${btnGhostSm} min-h-[52px]`}>
            {backLabel}
          </button>
        ) : null}
        <div className="min-w-0 flex-1">{primary}</div>
      </div>
      {status ? <p className="mt-2 text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">{status}</p> : null}
    </div>
  );
}

export function ContinueButton({ disabled, onClick, children = "Continue" }: { disabled?: boolean; onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${btnInkSm} min-h-[52px] w-full text-base`}>
      {children}
    </button>
  );
}

export function PayButton({ disabled, busy, totalCents, onClick }: { disabled?: boolean; busy: boolean; totalCents: number; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={onClick}
      className={`${btnCoralSm} min-h-[52px] w-full text-base`}
    >
      {busy ? (
        <>
          <Spinner /> Opening secure checkout…
        </>
      ) : (
        `Pay Now · ${formatCents(totalCents)}`
      )}
    </button>
  );
}

// ─── Payment method step ────────────────────────────────────────────────────

export function PaymentMethodStep({
  method,
  onMethod,
  feeLine,
  coverFees,
  onCoverFees,
  totalCents,
  totalLabel = "Total",
  checkNote = "default",
  footnote,
  stepNumber,
  children,
}: {
  method: PaymentMethod;
  onMethod: (m: PaymentMethod) => void;
  feeLine: string;
  coverFees: boolean;
  onCoverFees: (v: boolean) => void;
  totalCents: number | null;
  totalLabel?: ReactNode;
  /** Which "Prefer to pay by check?" sentence the old modal used. */
  checkNote?: "default" | "noFee" | "short";
  footnote?: ReactNode;
  stepNumber?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      {children}
      <div>
        <StepLabel n={stepNumber ?? 1} done={false}>
          How will you be paying?
        </StepLabel>
        <Segmented
          label="Payment method"
          fullWidth
          value={method}
          onChange={onMethod}
          options={[
            { value: "card", label: "Credit/Debit Card" },
            { value: "ach", label: "ACH / US bank account" },
          ]}
        />
        <p className="mt-2 text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
          {feeLine}
        </p>
      </div>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[20px] bg-white px-4 py-3 ring-1 ring-[var(--sf-ink)]/10">
        <input
          type="checkbox"
          checked={coverFees}
          onChange={(e) => onCoverFees(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--sf-sage)]"
        />
        <span className="text-sm font-extrabold">I agree to pay the processing fee</span>
      </label>

      <p className="text-xs font-semibold leading-relaxed text-[var(--sf-soft)]">
        {checkNote === "noFee" ? (
          <>
            Prefer to pay by check? No processing fee — email us at <EmailUs /> and we&apos;ll send you instructions.
          </>
        ) : checkNote === "short" ? (
          <>
            Prefer to pay by check? Email us at <EmailUs />
          </>
        ) : (
          <>
            Prefer to pay by check? Email us at <EmailUs /> and we&apos;ll send you instructions.
          </>
        )}
      </p>

      {totalCents !== null ? <TotalRow label={totalLabel} value={formatCents(totalCents)} /> : null}
      {footnote ? <p className="text-xs font-semibold text-[var(--sf-soft)]">{footnote}</p> : null}
      {!coverFees ? <p className="sf-hand text-lg leading-tight text-[var(--sf-coral-deep)]">tick the box above to continue</p> : null}
    </div>
  );
}

// ─── Siblings ───────────────────────────────────────────────────────────────

/**
 * Sibling bundling state, copied from the three old sibling steps:
 * included defaults to true, untouched siblings follow the primary selection,
 * and a sibling you edited keeps its own months/weeks.
 */
export function useSiblingSelection({
  eligibleIds,
  primary,
  isPaid,
}: {
  eligibleIds: string[];
  primary: Set<number>;
  isPaid: (studentId: string, unit: number) => boolean;
}) {
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, Set<number>>>({});
  const [editorOpen, setEditorOpen] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  const eligibleKey = eligibleIds.join(",");
  const primaryKey = Array.from(primary)
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    setIncluded((prev) => Object.fromEntries(eligibleIds.map((id) => [id, prev[id] ?? true])));
    setDirty((prev) => Object.fromEntries(eligibleIds.map((id) => [id, prev[id] ?? false])));
    setOverrides((prev) =>
      Object.fromEntries(
        eligibleIds.map((id) => {
          if (dirty[id]) return [id, prev[id] ?? new Set()];
          const defaults = Array.from(primary).filter((u) => !isPaid(id, u));
          return [id, new Set(defaults)];
        }),
      ),
    );
    // Same dependencies as the old effect: the eligible ids and the primary selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleKey, primaryKey]);

  const toggleIncluded = (id: string) => {
    setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));
    setEditorOpen((prev) => ({ ...prev, [id]: false }));
  };
  const toggleUnit = (id: string, unit: number) => {
    if (isPaid(id, unit)) return;
    setDirty((prev) => ({ ...prev, [id]: true }));
    setOverrides((prev) => {
      const next = new Set(prev[id] ?? []);
      if (next.has(unit)) next.delete(unit);
      else next.add(unit);
      return { ...prev, [id]: next };
    });
  };
  const setEditor = (id: string, open: boolean) => setEditorOpen((prev) => ({ ...prev, [id]: open }));

  const selection: SiblingSelection = { included, overrides };
  return { selection, included, overrides, editorOpen, toggleIncluded, toggleUnit, setEditor };
}

export type SiblingRowView = {
  id: string;
  name: string;
  grade: string | null;
  amountCents: number;
  /** Show the amount even when it's 0 (full-summer plans). */
  showZero?: boolean;
  summary: string;
  /** Editor for this sibling's months/weeks, or null when it can't be edited. */
  editor: ReactNode | null;
  editLabel: string;
  editorTitle: string;
};

export function SiblingStep({
  rows,
  isIncluded,
  editorOpen,
  onToggle,
  onEditor,
  combinedCents,
  anyIncluded,
}: {
  rows: SiblingRowView[];
  isIncluded: (id: string) => boolean;
  editorOpen: Record<string, boolean>;
  onToggle: (id: string) => void;
  onEditor: (id: string, open: boolean) => void;
  combinedCents: number;
  anyIncluded: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="sf-display text-xl leading-tight">Add a sibling to this payment?</p>
        <p className="mt-1 text-sm font-semibold text-[var(--sf-soft)]">
          Pay for both children in one transaction and save the extra processing fee.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const on = isIncluded(r.id);
          const open = editorOpen[r.id] ?? false;
          return (
            <li key={r.id} className={`rounded-[22px] transition-colors ${on ? "bg-[var(--sf-mint)]/60 ring-2 ring-[var(--sf-sage)]" : "bg-white ring-1 ring-[var(--sf-ink)]/10"}`}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(r.id)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-[22px] p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${on ? "border-[var(--sf-sage)] bg-[var(--sf-sage)] text-white" : "border-[var(--sf-ink)]/25 bg-white"}`}
                  aria-hidden="true"
                >
                  {on ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-extrabold">{r.name}</span>
                    <span className="sf-display shrink-0 text-lg">{r.showZero || r.amountCents > 0 ? formatCents(r.amountCents) : "—"}</span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--sf-soft)]">
                    {r.grade ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10">{r.grade}</span> : null}
                    {r.summary}
                  </span>
                </span>
              </button>
              {on && r.editor ? (
                <div className="px-4 pb-4">
                  {!open ? (
                    <button
                      type="button"
                      onClick={() => onEditor(r.id, true)}
                      className="inline-flex min-h-11 cursor-pointer items-center text-sm font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 hover:underline"
                    >
                      {r.editLabel}
                    </button>
                  ) : (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-extrabold text-[var(--sf-soft)]">{r.editorTitle}</p>
                        <button
                          type="button"
                          onClick={() => onEditor(r.id, false)}
                          className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm font-extrabold text-[var(--sf-sage-deep)]"
                        >
                          Done
                        </button>
                      </div>
                      {r.editor}
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {anyIncluded ? <TotalRow label="Combined total" value={formatCents(combinedCents)} /> : null}
    </div>
  );
}
