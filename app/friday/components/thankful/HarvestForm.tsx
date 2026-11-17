"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle, PenLine } from "lucide-react";
import { fieldInput, fieldLabel } from "@/app/_garden/ui";
import type { ChildEntry, FridayFormData, PaymentMethod } from "../race/PitStopForm";
import Turkey, { MAX_FEATHERS } from "./Turkey";
import { plumageFor, type TurkeyChoice } from "./data";
import { OvalLeaf, btnPumpkin } from "./ui";

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

const input = `${fieldInput} focus:border-[#EE8434] focus:ring-[#FFE3CC]`;
const PLACE_CARD_COLORS = ["#EE8434", "#B23A48", "#6b9474", "#C8643B", "#F4C04E", "#5B8DC9"];

function Required() {
  return <em className="not-italic text-[#B23A48]" aria-hidden> *</em>;
}

function FormSection({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h3 className="mb-4 mt-10 flex items-center gap-3 text-[var(--sf-ink)] first:mt-0">
      <span className="sf-hand grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F4C04E] text-xl text-[var(--sf-ink)]" aria-hidden>
        {step}
      </span>
      <span className="sf-display text-2xl">{children}</span>
    </h3>
  );
}

function HarvestCheckbox({
  name,
  checked,
  onChange,
  children,
}: {
  name?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-sm leading-relaxed transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#EE8434]/30 ${
        checked ? "border-[#6b9474] bg-[var(--sf-mint)]/50" : "border-[var(--sf-ink)]/10 bg-white hover:border-[var(--sf-ink)]/25"
      }`}
    >
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all ${
          checked ? "scale-110 border-[#6b9474] bg-[#6b9474] text-white" : "border-[var(--sf-ink)]/25 bg-white"
        }`}
        aria-hidden
      >
        {checked && <Check className="h-4 w-4" strokeWidth={3.5} />}
      </span>
      <span className="text-[var(--sf-ink)]">{children}</span>
    </label>
  );
}

export default function HarvestForm({
  turkey,
  price,
  formData,
  onChange,
  entries,
  onAddChild,
  onRemoveChild,
  onUpdateChild,
  paymentMethod,
  onPaymentMethod,
  cardFee,
  achFee,
  payTotal,
  totalBase,
  coverFees,
  onCoverFees,
  agreementSigned,
  onOpenAgreement,
  isFormValid,
  submitting,
  submitError,
  onSubmit,
}: {
  turkey: TurkeyChoice;
  price: number;
  formData: FridayFormData;
  onChange: (e: ChangeEvent) => void;
  entries: ChildEntry[];
  onAddChild: () => void;
  onRemoveChild: (id: number) => void;
  onUpdateChild: (id: number, field: "name" | "age", value: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethod: (method: PaymentMethod) => void;
  cardFee: number;
  achFee: number;
  payTotal: number;
  totalBase: number;
  coverFees: boolean;
  onCoverFees: (value: boolean) => void;
  agreementSigned: boolean;
  onOpenAgreement: () => void;
  isFormValid: boolean;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const reduced = useReducedMotion();

  const needed: string[] = [];
  if (!formData.parentName.trim()) needed.push("Parent / guardian name");
  if (!formData.email.trim()) needed.push("Email");
  entries.forEach((child, i) => {
    const who = entries.length > 1 ? `Child ${i + 1}` : "Child";
    if (!child.name.trim()) needed.push(`${who}'s name`);
    if (!child.age) needed.push(`${who}'s age`);
  });
  if (!formData.consentOutdoor) needed.push("Outdoor activity permission");
  if (!coverFees) needed.push("Processing fee agreement");
  if (!agreementSigned) needed.push("Participant Agreement signature");

  const checks = [
    !!formData.parentName.trim(),
    !!formData.email.trim(),
    entries.length > 0 && entries.every((c) => !!c.name.trim() && !!c.age),
    formData.consentOutdoor,
    coverFees,
    agreementSigned,
  ];
  const done = checks.filter(Boolean).length;
  const complete = done === checks.length;
  const plumage = plumageFor(turkey.plumageIndex);

  return (
    <div className="overflow-hidden rounded-[36px] bg-white shadow-[0_30px_60px_-35px_rgba(74,52,38,0.6)]">
      {/* Progress: the turkey grows a feather per finished step */}
      <div className="flex items-center gap-5 bg-[var(--sf-ink)] px-6 py-5 text-white sm:px-8">
        <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`Sign-up progress: ${done} of ${checks.length} done`}>
          <Turkey
            feathers={plumage.feathers}
            accessory={turkey.accessory}
            count={complete ? MAX_FEATHERS : done}
            gobbling={complete}
            className="h-full w-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="sf-hand text-xl text-[#F4C04E]">
            {complete ? "fully feathered — ready to go!" : "every step grows a feather…"}
          </p>
          <p className="sf-display text-2xl">
            {done} of {checks.length} done
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {checks.map((ok, i) => (
              <span
                key={i}
                className="h-2 flex-1 rounded-full transition-colors duration-500"
                style={{ backgroundColor: ok ? plumage.feathers[i % plumage.feathers.length] : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="sf-paper px-6 py-8 sm:px-10 sm:py-10">
        <FormSection step={1}>Your Info</FormSection>
        <div className="space-y-4">
          <div>
            <label htmlFor="friday-parent" className={fieldLabel}>
              Parent / guardian name
              <Required />
            </label>
            <input
              id="friday-parent"
              type="text"
              name="parentName"
              autoComplete="name"
              required
              value={formData.parentName}
              onChange={onChange}
              placeholder="Your full name"
              className={input}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="friday-email" className={fieldLabel}>
                Email
                <Required />
              </label>
              <input
                id="friday-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={onChange}
                placeholder="you@email.com"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="friday-phone" className={fieldLabel}>
                Phone
              </label>
              <input
                id="friday-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={onChange}
                placeholder="(512) 000-0000"
                className={input}
              />
            </div>
          </div>
        </div>

        <FormSection step={2}>
          Your Child{entries.length > 1 ? "ren" : ""}{" "}
          <small className="ml-1 align-middle font-sans text-sm font-extrabold text-[#C4621C]">{`$${price} per child`}</small>
        </FormSection>

        {/* Place cards: one per guest at the table */}
        <div className="mb-5 flex flex-wrap justify-center gap-3 rounded-[24px] bg-[#F8E9CF] px-4 py-5" aria-hidden>
          <AnimatePresence initial={false}>
            {entries.map((child, i) => {
              const color = PLACE_CARD_COLORS[i % PLACE_CARD_COLORS.length];
              return (
                <motion.div
                  key={child.id}
                  layout={!reduced}
                  initial={reduced ? false : { y: 30, scale: 0.6, opacity: 0, rotate: -8 }}
                  animate={{ y: 0, scale: 1, opacity: 1, rotate: i % 2 ? 2 : -2 }}
                  exit={reduced ? { opacity: 0 } : { y: -30, scale: 0.6, opacity: 0, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="relative w-36"
                >
                  <div className="h-3 rounded-t-lg" style={{ backgroundColor: color, filter: "brightness(0.85)" }} />
                  <div className="flex min-h-[64px] flex-col items-center justify-center rounded-b-xl bg-white px-3 py-2 text-center shadow-[0_8px_16px_-10px_rgba(43,42,38,0.5)]">
                    <span className="flex items-center gap-1">
                      <OvalLeaf color={color} className="h-4 w-3" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--sf-soft)]">Guest {i + 1}</span>
                    </span>
                    <span className="sf-hand mt-0.5 w-full truncate text-xl leading-tight text-[var(--sf-ink)]">
                      {child.name.trim() || "your kiddo"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          {entries.map((child, i) => (
            <div key={child.id} className="rounded-[24px] border-2 border-[var(--sf-ink)]/10 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#C4621C]">Child {i + 1}</span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-bold text-[var(--sf-soft)] underline underline-offset-4 hover:text-[#B23A48]"
                    onClick={() => onRemoveChild(child.id)}
                    aria-label={`Remove child ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div>
                  <label htmlFor={`friday-child-${child.id}-name`} className={fieldLabel}>
                    Name
                    <Required />
                  </label>
                  <input
                    id={`friday-child-${child.id}-name`}
                    type="text"
                    required
                    value={child.name}
                    onChange={(e) => onUpdateChild(child.id, "name", e.target.value)}
                    placeholder="First and last name"
                    className={input}
                  />
                </div>
                <div>
                  <label htmlFor={`friday-child-${child.id}-age`} className={fieldLabel}>
                    Age
                    <Required />
                  </label>
                  <select
                    id={`friday-child-${child.id}-age`}
                    required
                    value={child.age}
                    onChange={(e) => onUpdateChild(child.id, "age", e.target.value)}
                    className={`${input} cursor-pointer`}
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
            </div>
          ))}

          <button
            type="button"
            onClick={onAddChild}
            className="w-full cursor-pointer rounded-[24px] border-2 border-dashed border-[#EE8434]/50 bg-[#FFF3E8] py-4 font-extrabold text-[#C4621C] transition hover:border-[#EE8434] hover:bg-[#FFE3CC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/30"
          >
            + Add Another Child
          </button>

          {entries.length > 1 && (
            <p className="text-right text-sm font-extrabold text-[var(--sf-ink)]">
              {entries.length} children · ${totalBase} total
            </p>
          )}
        </div>

        <FormSection step={3}>A Bit More</FormSection>
        <div className="space-y-4">
          <div>
            <label htmlFor="friday-referral" className={fieldLabel}>
              How did you hear about us?
            </label>
            <select
              id="friday-referral"
              name="referralSource"
              value={formData.referralSource}
              onChange={onChange}
              className={`${input} cursor-pointer`}
            >
              <option value="">Select one</option>
              <option value="friend">Friend / Word of Mouth</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="nextdoor">Nextdoor</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="friday-notes" className={fieldLabel}>
              Anything we should know?
            </label>
            <textarea
              id="friday-notes"
              name="notes"
              value={formData.notes}
              onChange={onChange}
              rows={3}
              placeholder="Allergies, medical needs, sensitivities, or anything that helps us take great care of your child"
              className={`${input} resize-none`}
            />
          </div>
        </div>

        <FormSection step={4}>Emergency Contact</FormSection>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="friday-emergency-name" className={fieldLabel}>
              Emergency contact name
            </label>
            <input
              id="friday-emergency-name"
              type="text"
              name="emergencyName"
              value={formData.emergencyName}
              onChange={onChange}
              placeholder="Name if you can't be reached"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="friday-emergency-phone" className={fieldLabel}>
              Emergency contact phone
            </label>
            <input
              id="friday-emergency-phone"
              type="tel"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={onChange}
              placeholder="(512) 000-0000"
              className={input}
            />
          </div>
        </div>

        <FormSection step={5}>Before we confirm your spot</FormSection>
        <div className="space-y-3">
          <HarvestCheckbox name="consentOutdoor" checked={formData.consentOutdoor} onChange={onChange}>
            I give permission for my child to participate in outdoor activities and to have sunscreen applied if
            needed
            <Required />
          </HarvestCheckbox>
          <HarvestCheckbox name="consentPhoto" checked={formData.consentPhoto} onChange={onChange}>
            I&apos;m okay with photos of my child being taken and shared on Sage Field&apos;s social media (we cover
            all kids&apos; faces for privacy)
          </HarvestCheckbox>
        </div>

        <FormSection step={6}>How will you be paying?</FormSection>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: "card", label: "Credit / Debit Card", emoji: "💳" },
              { id: "ach", label: "ACH / US bank account", emoji: "🏦" },
            ] as const
          ).map((option) => {
            const on = paymentMethod === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={on}
                onClick={() => onPaymentMethod(option.id)}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 px-3 py-4 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/30 ${
                  on
                    ? "border-[var(--sf-ink)] bg-[#FFE3CC] text-[var(--sf-ink)] shadow-[0_4px_0_0_var(--sf-ink)]"
                    : "border-[var(--sf-ink)]/10 bg-white text-[var(--sf-soft)] hover:border-[var(--sf-ink)]/30"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {option.emoji}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mb-3 mt-3 text-sm font-bold text-[var(--sf-soft)]">
          {paymentMethod === "card"
            ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
            : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
        </p>
        <HarvestCheckbox checked={coverFees} onChange={(e) => onCoverFees(e.target.checked)}>
          I agree to pay the processing fee so Sage Field receives the full amount
          <Required />
        </HarvestCheckbox>

        <div className="mt-8 space-y-4">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-[24px] border-2 p-4 transition-colors ${
              agreementSigned ? "border-[#6b9474] bg-[var(--sf-mint)]/50" : "border-[#B23A48]/25 bg-[#FDF0F1]"
            }`}
          >
            <div className="flex items-center gap-3">
              {agreementSigned ? (
                <CheckCircle className="h-7 w-7 flex-shrink-0 text-[#4a6354]" />
              ) : (
                <PenLine className="h-7 w-7 flex-shrink-0 text-[#B23A48]" />
              )}
              <div>
                <p className="text-sm font-extrabold text-[var(--sf-ink)]">Participant Agreement</p>
                <p className="text-xs font-bold text-[var(--sf-soft)]">
                  {agreementSigned ? "Signed — ready to submit" : "Required before submitting"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAgreement}
              disabled={!isFormValid}
              className="cursor-pointer rounded-full bg-[var(--sf-ink)] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-ink)]/25 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {agreementSigned ? "View" : "Review & Sign →"}
            </button>
          </div>

          {needed.length > 0 && (
            <div className="rounded-[24px] border-2 border-dashed border-[#B23A48]/35 bg-white p-5">
              <p className="sf-hand text-xl text-[#B23A48]">{isFormValid ? "One step left" : "Still needed"}</p>
              <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm font-bold text-[var(--sf-ink)] sm:grid-cols-2">
                {needed.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B23A48]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <p className="rounded-2xl bg-[#FDE8EA] px-4 py-3 text-sm font-bold text-[#9A2E3B]" role="alert">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isFormValid || !agreementSigned || submitting}
            className={`${btnPumpkin} w-full py-5 text-lg`}
          >
            {submitting ? "Submitting…" : `Pay $${payTotal.toFixed(2)} & Reserve My Spot →`}
          </button>
        </div>
      </div>
    </div>
  );
}
