"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle, PenLine } from "lucide-react";
import MiniRoad from "./MiniRoad";
import SpeedsterCar from "./SpeedsterCar";
import { liveryFor, type CarChoice } from "./data";

export type FridayFormData = {
  parentName: string;
  email: string;
  phone: string;
  referralSource: string;
  notes: string;
  emergencyName: string;
  emergencyPhone: string;
  consentOutdoor: boolean;
  consentPhoto: boolean;
};

export type ChildEntry = { id: number; name: string; age: string };
export type PaymentMethod = "card" | "ach";

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

function Required() {
  return <em aria-hidden> *</em>;
}

function FormSection({ children }: { children: React.ReactNode }) {
  return <h3 className="rc-form-section">{children}</h3>;
}

function RaceCheckbox({
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
    <label className="rc-check">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="rc-check-box" aria-hidden>
        {checked && <Check className="w-4 h-4" strokeWidth={3.5} />}
      </span>
      <span>{children}</span>
    </label>
  );
}

export default function PitStopForm({
  car,
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
  car: CarChoice;
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

  return (
    <div className="rc-form">
      <div className="rc-form-progress rc-on-dark">
        <div className="rc-form-progress-row">
          <span>Your progress</span>
          <span>
            {done} of {checks.length} done
          </span>
        </div>
        <MiniRoad
          progress={done / checks.length}
          livery={liveryFor(car.liveryIndex)}
          number={car.number}
          label="Sign-up progress"
        />
      </div>

      <div className="rc-form-body">
        <FormSection>Your Info</FormSection>
        <div className="space-y-4">
          <div>
            <label htmlFor="friday-parent" className="rc-label">
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
              className="rc-input"
            />
          </div>
          <div>
            <label htmlFor="friday-email" className="rc-label">
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
              className="rc-input"
            />
          </div>
          <div>
            <label htmlFor="friday-phone" className="rc-label">
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
              className="rc-input"
            />
          </div>
        </div>

        <FormSection>
          Your Child{entries.length > 1 ? "ren" : ""} <small>{`$${price} per child`}</small>
        </FormSection>

        <div className="rc-grid-strip rc-on-dark" aria-hidden>
          <AnimatePresence initial={false}>
            {entries.map((child, i) => (
              <motion.div
                key={child.id}
                layout
                className="rc-grid-slot"
                initial={{ x: -180, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 16 }}
              >
                <SpeedsterCar livery={liveryFor(car.liveryIndex + i)} number={((car.number - 1 + i) % 99) + 1} />
                <span className="rc-grid-name">{child.name.trim() || `Racer ${i + 1}`}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          {entries.map((child, i) => (
            <div key={child.id} className="rc-child-card">
              <div className="rc-child-head">
                <span>Child {i + 1}</span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    className="rc-link-btn"
                    onClick={() => onRemoveChild(child.id)}
                    aria-label={`Remove child ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label htmlFor={`friday-child-${child.id}-name`} className="rc-label">
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
                  className="rc-input"
                />
              </div>
              <div>
                <label htmlFor={`friday-child-${child.id}-age`} className="rc-label">
                  Age
                  <Required />
                </label>
                <select
                  id={`friday-child-${child.id}-age`}
                  required
                  value={child.age}
                  onChange={(e) => onUpdateChild(child.id, "age", e.target.value)}
                  className="rc-input cursor-pointer"
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
          ))}

          <button type="button" onClick={onAddChild} className="rc-add-child">
            + Add Another Child
          </button>

          {entries.length > 1 && (
            <p className="rc-total">
              {entries.length} children · ${totalBase} total
            </p>
          )}
        </div>

        <FormSection>A Bit More</FormSection>
        <div className="space-y-4">
          <div>
            <label htmlFor="friday-referral" className="rc-label">
              How did you hear about us?
            </label>
            <select
              id="friday-referral"
              name="referralSource"
              value={formData.referralSource}
              onChange={onChange}
              className="rc-input cursor-pointer"
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
            <label htmlFor="friday-notes" className="rc-label">
              Anything we should know?
            </label>
            <textarea
              id="friday-notes"
              name="notes"
              value={formData.notes}
              onChange={onChange}
              rows={3}
              placeholder="Allergies, medical needs, sensitivities, or anything that helps us take great care of your child"
              className="rc-input resize-none"
            />
          </div>
        </div>

        <FormSection>Emergency Contact</FormSection>
        <div className="space-y-4">
          <div>
            <label htmlFor="friday-emergency-name" className="rc-label">
              Emergency contact name
            </label>
            <input
              id="friday-emergency-name"
              type="text"
              name="emergencyName"
              value={formData.emergencyName}
              onChange={onChange}
              placeholder="Name if you can't be reached"
              className="rc-input"
            />
          </div>
          <div>
            <label htmlFor="friday-emergency-phone" className="rc-label">
              Emergency contact phone
            </label>
            <input
              id="friday-emergency-phone"
              type="tel"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={onChange}
              placeholder="(512) 000-0000"
              className="rc-input"
            />
          </div>
        </div>

        <FormSection>Before we confirm your spot</FormSection>
        <div className="space-y-3">
          <RaceCheckbox name="consentOutdoor" checked={formData.consentOutdoor} onChange={onChange}>
            I give permission for my child to participate in outdoor activities and to have sunscreen
            applied if needed
            <Required />
          </RaceCheckbox>
          <RaceCheckbox name="consentPhoto" checked={formData.consentPhoto} onChange={onChange}>
            I&apos;m okay with photos of my child being taken and shared on Sage Field&apos;s social media
            (we cover all kids&apos; faces for privacy)
          </RaceCheckbox>
        </div>

        <FormSection>How will you be paying?</FormSection>
        <div className="rc-pay-options">
          {(
            [
              { id: "card", label: "Credit / Debit Card" },
              { id: "ach", label: "ACH / US bank account" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={paymentMethod === option.id}
              onClick={() => onPaymentMethod(option.id)}
              className={`rc-pay-option${paymentMethod === option.id ? " rc-pay-option-on" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="rc-fee-note">
          {paymentMethod === "card"
            ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
            : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
        </p>
        <RaceCheckbox checked={coverFees} onChange={(e) => onCoverFees(e.target.checked)}>
          I agree to pay the processing fee so Sage Field receives the full amount
          <Required />
        </RaceCheckbox>

        <div className="mt-6 space-y-3">
          <div className={`rc-agreement${agreementSigned ? " rc-agreement-done" : ""}`}>
            <div className="flex items-center gap-3">
              {agreementSigned ? (
                <CheckCircle className="w-6 h-6 flex-shrink-0 text-[#0E8A4F]" />
              ) : (
                <PenLine className="w-6 h-6 flex-shrink-0 text-[#E3241B]" />
              )}
              <div>
                <p className="text-sm font-bold">Participant Agreement</p>
                <p className="text-xs text-[#5B6172]">
                  {agreementSigned ? "Signed — ready to submit" : "Required before submitting"}
                </p>
              </div>
            </div>
            <button type="button" onClick={onOpenAgreement} disabled={!isFormValid}>
              {agreementSigned ? "View" : "Review & Sign →"}
            </button>
          </div>

          {needed.length > 0 && (
            <div className="rc-needed">
              <p>{isFormValid ? "One step left" : "Still needed"}</p>
              <ul>
                {needed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <p className="rc-error" role="alert">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isFormValid || !agreementSigned || submitting}
            className="rc-btn rc-btn-red rc-pay-btn"
          >
            {submitting ? "Submitting…" : `Pay $${payTotal.toFixed(2)} & Reserve My Spot →`}
          </button>
        </div>
      </div>
    </div>
  );
}
