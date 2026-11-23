"use client";

import { useState } from "react";
import { formatCents } from "@/shared/billing/school-year";
import { StepLabel } from "@/app/parent/_garden/ui";
import { PillTabs } from "@/app/parent/_garden/tabs";
import { CheckoutFooter, CheckoutSheet, ContinueButton, PayButton, PaymentMethodStep, usePayCheckout } from "./checkout";
import { addonConfig, addonPaymentQuote, addonTotals, buildAddonCheckout, type AddonKind, type PaymentMethod } from "./payloads";
import { SelectTile, TotalRow } from "./parts";

/** Copy per add-on, word for word from the four old modals. */
const COPY: Record<
  AddonKind,
  {
    title: string;
    icon: string;
    monthlyTab: string;
    secondTab: string;
    monthsIntro: string;
    monthsHint?: string;
    itemsIntro: string;
    itemsHint?: string;
    itemNoun: [string, string];
    rateNoun: string;
    emptyItems: string;
    selectItems: string;
    paidNoun: [string, string];
    nonRefundable: string;
  }
> = {
  aftercare: {
    title: "Extended Learning — Summer 2026",
    icon: "🕒",
    monthlyTab: "Monthly",
    secondTab: "Daily",
    monthsIntro: "Select the months you'd like Extended Learning coverage for.",
    itemsIntro: "Select individual days you'd like Extended Learning. $35/day.",
    itemNoun: ["day", "days"],
    rateNoun: "day",
    emptyItems: "No days selected",
    selectItems: "Select days to continue",
    paidNoun: ["day", "days"],
    nonRefundable: "Extended Learning payments are non-refundable.",
  },
  aftercare_sy: {
    title: "Extended Learning — School Year 26–27",
    icon: "🕒",
    monthlyTab: "Monthly",
    secondTab: "Daily",
    monthsIntro: "Select the months you'd like Extended Learning coverage for.",
    itemsIntro: "Select individual days you'd like Extended Learning. $35/day.",
    itemNoun: ["day", "days"],
    rateNoun: "day",
    emptyItems: "No days selected",
    selectItems: "Select days to continue",
    paidNoun: ["day", "days"],
    nonRefundable: "Extended Learning payments are non-refundable.",
  },
  funfriday: {
    title: "Fun Friday — Summer 2026",
    icon: "🎉",
    monthlyTab: "Monthly · Save 33% 🎉",
    secondTab: "Drop-in",
    monthsIntro: "Select the months you'd like Fun Friday coverage for.",
    monthsHint: "9:00am – 1:00pm · Package of 4 Fridays per month",
    itemsIntro: "Select individual Fridays you'd like to attend. $50/session.",
    itemsHint: "9:00am – 1:00pm",
    itemNoun: ["session", "sessions"],
    rateNoun: "session",
    emptyItems: "No Fridays selected",
    selectItems: "Select Fridays to continue",
    paidNoun: ["Friday", "Fridays"],
    nonRefundable: "Fun Friday payments are non-refundable.",
  },
  funfriday_sy: {
    title: "Friday Enrichment — School Year 26–27",
    icon: "🎉",
    monthlyTab: "Monthly · Save 33% 🎉",
    secondTab: "Drop-in",
    monthsIntro: "Select the months you'd like Friday Enrichment coverage for.",
    monthsHint: "9:00am – 1:00pm · Package of 4 Fridays per month",
    itemsIntro: "Select individual Fridays you'd like to attend. $50/session.",
    itemsHint: "9:00am – 1:00pm",
    itemNoun: ["session", "sessions"],
    rateNoun: "session",
    emptyItems: "No Fridays selected",
    selectItems: "Select Fridays to continue",
    paidNoun: ["Friday", "Fridays"],
    nonRefundable: "Friday Enrichment payments are non-refundable.",
  },
};

const plural = (n: number, [one, many]: [string, string]) => (n !== 1 ? many : one);

type Props = {
  kind: AddonKind;
  enrollment: { student_id: string; id: string; child_grade: string | null };
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidMonths: Set<string>;
  paidItems: Set<string>;
  readOnly?: boolean;
  onClose: () => void;
};

export default function AddonFlow(p: Props) {
  const cfg = addonConfig(p.kind);
  const copy = COPY[p.kind];
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [tab, setTab] = useState<"monthly" | "daily" | "dropin">("monthly");
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(cfg.months.map((m) => m.key)));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(p.readOnly);

  const t = addonTotals(cfg, tab, selectedMonths, selectedItems);
  const quote = addonPaymentQuote(t.intendedAmountCents, coverFees, paymentMethod);

  const toggle = (set: (fn: (prev: Set<string>) => Set<string>) => void, key: string, paid: Set<string>) => {
    if (paid.has(key)) return;
    set((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const continueLabel =
    tab === "monthly"
      ? selectedMonths.size > 0
        ? `Continue · ${formatCents(t.monthlyTotal)}`
        : "Select months to continue"
      : selectedItems.size > 0
        ? `Continue · ${formatCents(t.itemTotal)}`
        : copy.selectItems;

  const onPay = () =>
    pay(() =>
      buildAddonCheckout({
        cfg,
        parentId: p.parentId,
        parentEmail: p.parentEmail,
        enrollment: p.enrollment,
        tab,
        selectedMonths,
        selectedItems,
        intendedAmountCents: t.intendedAmountCents,
        coverFees,
        paymentMethod,
      }),
    );

  const selMonths = cfg.months.filter((m) => selectedMonths.has(m.key));
  const allNormal = selMonths.every((m) => cfg.isNormalMonth(m.key));

  return (
    <CheckoutSheet
      open
      onClose={p.onClose}
      busy={busy}
      title={copy.title}
      icon={copy.icon}
      note={p.studentName ? `${p.studentName}${p.enrollment.child_grade ? ` · ${p.enrollment.child_grade}` : ""}` : undefined}
      steps={["Plan", "Pay"]}
      step={step === "plan" ? 1 : 2}
      toolbar={
        step === "plan" ? (
          <PillTabs
            label="Plan type"
            size="sm"
            className="!mx-0 !px-0"
            value={tab}
            onChange={setTab}
            options={[
              { value: "monthly", label: copy.monthlyTab },
              { value: cfg.secondTab, label: copy.secondTab },
            ]}
          />
        ) : null
      }
      footer={
        step === "plan" ? (
          <CheckoutFooter
            primary={
              <ContinueButton disabled={!t.canContinue} onClick={() => setStep("payment")}>
                {continueLabel}
              </ContinueButton>
            }
          />
        ) : (
          <CheckoutFooter
            onBack={busy ? undefined : () => setStep("plan")}
            primary={<PayButton busy={busy} disabled={!coverFees} totalCents={quote.totalWithFees} onClick={onPay} />}
          />
        )
      }
    >
      {step === "payment" ? (
        <PaymentMethodStep
          method={paymentMethod}
          onMethod={setPaymentMethod}
          feeLine={quote.feeLine}
          coverFees={coverFees}
          onCoverFees={setCoverFees}
          totalCents={quote.totalWithFees}
          footnote={copy.nonRefundable}
        />
      ) : tab === "monthly" ? (
        <div className="flex flex-col gap-4">
          <div>
            <StepLabel n={1} done={selectedMonths.size > 0}>
              {copy.monthsIntro}
            </StepLabel>
            {copy.monthsHint ? <p className="-mt-1 mb-3 text-xs font-bold text-[var(--sf-soft)]">{copy.monthsHint}</p> : null}
            <div role="group" aria-label="Months" className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {cfg.months.map((m) => {
                const isPaid = p.paidMonths.has(m.key);
                const paidInMonth = isPaid ? 0 : m.items.filter((d) => p.paidItems.has(d.date)).length;
                return (
                  <SelectTile
                    key={m.key}
                    checked={selectedMonths.has(m.key)}
                    paid={isPaid}
                    onToggle={() => toggle(setSelectedMonths, m.key, p.paidMonths)}
                    tint="peach"
                    sub={
                      <>
                        {cfg.monthLabel(m.key)}
                        {paidInMonth > 0 ? ` · ✓ ${paidInMonth} ${plural(paidInMonth, copy.paidNoun)} paid` : ""}
                      </>
                    }
                  >
                    {m.label}
                  </SelectTile>
                );
              })}
            </div>
          </div>
          <TotalRow
            tint="peach"
            label={
              selectedMonths.size === 0
                ? "No months selected"
                : allNormal
                  ? `${selMonths.length} month${selMonths.length !== 1 ? "s" : ""} × ${formatCents(cfg.normalMonthlyCents)}/mo`
                  : `${selMonths.length} month${selMonths.length !== 1 ? "s" : ""} selected`
            }
            value={selectedMonths.size > 0 ? formatCents(t.monthlyTotal) : "—"}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <StepLabel n={1} done={selectedItems.size > 0}>
              {copy.itemsIntro}
            </StepLabel>
            {copy.itemsHint ? <p className="-mt-1 mb-3 text-xs font-bold text-[var(--sf-soft)]">{copy.itemsHint}</p> : null}
            <div className="flex flex-col gap-2">
              {cfg.months.map((m) => {
                const isOpen = expanded.has(m.key);
                const selectedIn = m.items.filter((d) => selectedItems.has(d.date)).length;
                const paidIn = m.items.filter((d) => p.paidItems.has(d.date)).length;
                const panelId = `addon-${p.kind}-${m.key}`;
                return (
                  <div key={m.key} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[var(--sf-ink)]/10">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(m.key)) next.delete(m.key);
                          else next.add(m.key);
                          return next;
                        })
                      }
                      className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--sf-sky)]"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-extrabold">{m.label}</span>
                        {paidIn > 0 ? <span className="rounded-full bg-[var(--sf-mint)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--sf-sage-deep)]">✓ {paidIn} paid</span> : null}
                        {selectedIn > 0 ? <span className="rounded-full bg-[var(--sf-peach)] px-2 py-0.5 text-[11px] font-extrabold text-[#a2552e]">{selectedIn} selected</span> : null}
                      </span>
                      <span aria-hidden="true" className={`text-[var(--sf-soft)] transition-transform ${isOpen ? "rotate-90" : ""}`}>
                        ›
                      </span>
                    </button>
                    {isOpen ? (
                      <div id={panelId} role="group" aria-label={m.label} className="grid grid-cols-2 gap-1.5 px-3 pb-3 min-[420px]:grid-cols-3">
                        {m.items.map((d) => (
                          <SelectTile
                            key={d.date}
                            checked={selectedItems.has(d.date)}
                            paid={p.paidItems.has(d.date)}
                            onToggle={() => toggle(setSelectedItems, d.date, p.paidItems)}
                            tint="peach"
                          >
                            {d.label}
                          </SelectTile>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <TotalRow
            tint="peach"
            label={
              selectedItems.size === 0
                ? copy.emptyItems
                : `${selectedItems.size} ${plural(selectedItems.size, copy.itemNoun)} × ${formatCents(cfg.unitCents)}/${copy.rateNoun}`
            }
            value={selectedItems.size > 0 ? formatCents(t.itemTotal) : "—"}
          />
        </div>
      )}
    </CheckoutSheet>
  );
}
