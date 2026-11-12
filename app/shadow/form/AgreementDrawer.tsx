"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, PenLine, X } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import { ACTIVITIES, RISKS } from "../content";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

function AgreementSectionHeader({ title }: { title: string }) {
  return <h3 className="sf-display border-b-2 border-dashed border-[var(--sf-ink)]/10 pb-2 text-xl">{title}</h3>;
}

/** The Shadow Day Participant Agreement drawer (copy unchanged from the original page). */
export default function AgreementDrawer({
  agreementOpen,
  setAgreementOpen,
  agreementSigned,
  setAgreementSigned,
  sigPrintedName,
  setSigPrintedName,
  sigValue,
  setSigValue,
  handleSaveSignature,
  kids,
  guardianName,
  notesForAgreement,
  photoConsent,
  emergencyName,
  emergencyPhone,
}: {
  agreementOpen: boolean;
  setAgreementOpen: (open: boolean) => void;
  agreementSigned: boolean;
  setAgreementSigned: (signed: boolean) => void;
  sigPrintedName: string;
  setSigPrintedName: (v: string) => void;
  sigValue: string;
  setSigValue: (v: string) => void;
  handleSaveSignature: () => void;
  kids: { name: string; age: string }[];
  guardianName: string;
  notesForAgreement: string;
  photoConsent: boolean;
  emergencyName: string;
  emergencyPhone: string;
}) {
  return (
      <AnimatePresence>
        {agreementOpen && (
          <div className={dancingScript.variable}>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-[var(--sf-ink)]/60 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAgreementOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed inset-y-0 right-0 w-full max-w-3xl z-[70] bg-white sm:rounded-l-[32px] overflow-hidden flex flex-col shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="shadow-agreement-title"
            >
              {/* Sticky Header */}
              <div className="flex-shrink-0 sticky top-0 bg-white border-b-2 border-dashed border-[var(--sf-ink)]/10 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 id="shadow-agreement-title" className="sf-display text-2xl text-[var(--sf-ink)]">
                    Shadow Day Participant Agreement
                  </h2>
                  <p className="text-xs text-[var(--sf-soft)]/70 mt-0.5">
                    {agreementSigned ? "1" : "0"} of 1 sections signed
                  </p>
                </div>
                <button
                  onClick={() => setAgreementOpen(false)}
                  className="p-2 bg-[var(--sf-cream)] hover:bg-[var(--sf-butter)] rounded-full transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-[var(--sf-ink)]" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-8">
                  {/* School info header */}
                  <div className="flex flex-col gap-0.5">
                    <p className="sf-display text-lg text-[var(--sf-ink)]">
                      Sage Field Private Microschool
                    </p>
                    <p className="text-xs text-[var(--sf-soft)]">
                      Location: Round Rock, Texas · Shadow Day Date: Mon–Thu by
                      appointment
                    </p>
                  </div>

                  {/* Pre-filled participant info */}
                  <div className="flex flex-col gap-3 bg-[var(--sf-cream)] rounded-2xl px-4 py-4 border-2 border-dashed border-[var(--sf-ink)]/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        {
                          label: kids.length > 1 ? "Children" : "Student Name",
                          value: kids.map((c) => c.name).filter(Boolean).join(", ") || "—",
                        },
                        {
                          label: "Parent / Guardian",
                          value: guardianName || "—",
                        },
                        {
                          label: "Emergency Contact",
                          value: emergencyName
                            ? `${emergencyName}${emergencyPhone ? ` · ${emergencyPhone}` : ""}`
                            : "—",
                        },
                        {
                          label: "Photo Consent",
                          value: photoConsent
                            ? "✓ Authorized"
                            : "✗ Not authorized",
                        },
                      ].map((row) => (
                        <div key={row.label}>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70">
                            {row.label}
                          </p>
                          <p className="text-sm font-bold text-[var(--sf-ink)]">
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {notesForAgreement && (
                      <div className="border-t-2 border-dashed border-[var(--sf-ink)]/10 pt-3 mt-1">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70 mb-1">
                          Medical / Notes
                        </p>
                        <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                          {notesForAgreement}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 1. Acknowledgment of Program Activities */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="1. Acknowledgment of Program Activities" />
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      I understand that my child is participating in a Shadow
                      Day at an outdoor education program where children learn
                      through active exploration, hands-on experiences, and
                      supervised outdoor activities. Activities may include, but
                      are not limited to:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {ACTIVITIES.map((a) => (
                        <li
                          key={a}
                          className="flex gap-2 text-sm text-[var(--sf-soft)]"
                        >
                          <span className="text-[var(--sf-coral-deep)] mt-0.5 flex-shrink-0">
                            •
                          </span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      I understand that these activities involve inherent risks
                      that cannot be completely eliminated while preserving the
                      educational and developmental benefits of participation.
                    </p>
                  </div>

                  {/* 2. Assumption of Risk */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="2. Assumption of Risk" />
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      I knowingly and voluntarily assume all risks associated
                      with my child&apos;s participation in the Shadow Day,
                      including but not limited to:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {RISKS.map((r) => (
                        <li
                          key={r}
                          className="flex gap-2 text-sm text-[var(--sf-soft)]"
                        >
                          <span className="text-[var(--sf-coral-deep)] mt-0.5 flex-shrink-0">
                            •
                          </span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      I understand that injury may occur despite reasonable
                      supervision and safety precautions.
                    </p>
                  </div>

                  {/* 3. Release of Liability */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="3. Release of Liability" />
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      In consideration of my child&apos;s participation in the
                      Shadow Day, I release and hold harmless the School, its
                      owners, directors, employees, contractors, volunteers,
                      agents, and representatives from any claims, demands,
                      causes of action, damages, losses, costs, or expenses
                      arising out of or related to my child&apos;s
                      participation.
                    </p>
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      This release applies to all claims based upon ordinary
                      negligence but does not apply to claims arising from gross
                      negligence, reckless conduct, or intentional misconduct.
                    </p>
                  </div>

                  {/* 4. Medical Authorization */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="4. Medical Authorization" />
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      I authorize school personnel to obtain emergency medical
                      treatment for my child if I cannot be reached promptly. I
                      understand that:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {[
                        "Emergency medical services may be contacted when deemed necessary.",
                        "I am responsible for all medical expenses incurred on behalf of my child.",
                        "School personnel may administer basic first aid as appropriate.",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-sm text-[var(--sf-soft)]"
                        >
                          <span className="text-[var(--sf-coral-deep)] mt-0.5 flex-shrink-0">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {notesForAgreement && (
                      <div className="bg-[var(--sf-butter)]/50 rounded-2xl px-4 py-3">
                        <p className="text-xs font-semibold text-[#7a5b00] mb-1">
                          Allergies, Medical Conditions, or Special Notes
                        </p>
                        <p className="text-sm text-[var(--sf-ink)]">
                          {notesForAgreement}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Photography and Media Release */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="5. Photography and Media Release" />
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${
                        photoConsent
                          ? "bg-[var(--sf-mint)]/60 border-[var(--sf-mint)]"
                          : "bg-[var(--sf-cream)] border-[var(--sf-ink)]/10"
                      }`}
                    >
                      <span className="text-lg">
                        {photoConsent ? "✅" : "🚫"}
                      </span>
                      <p className="text-sm text-[var(--sf-ink)]">
                        {photoConsent
                          ? "I authorize the School to photograph and/or record my child and use such images or recordings for educational, promotional, website, social media, and marketing purposes."
                          : "I do not authorize the School to use photographs or recordings of my child."}
                      </p>
                    </div>
                  </div>

                  {/* 6. Emergency Contact */}
                  <div className="flex flex-col gap-3">
                    <AgreementSectionHeader title="6. Emergency Contact Authorization" />
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      If the parent or guardian cannot be reached, the following
                      individual is authorized to make emergency decisions
                      regarding the child:
                    </p>
                    <div className="bg-[var(--sf-cream)] rounded-2xl px-4 py-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70">
                            Name
                          </p>
                          <p className="text-sm font-bold text-[var(--sf-ink)]">
                            {emergencyName || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/70">
                            Phone
                          </p>
                          <p className="text-sm font-bold text-[var(--sf-ink)]">
                            {emergencyPhone || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Parent Acknowledgment & Signature */}
                  <div className="flex flex-col gap-4">
                    <AgreementSectionHeader title="7. Parent Acknowledgment & Signature" />
                    <p className="text-sm text-[var(--sf-soft)] leading-relaxed">
                      By signing below, I confirm that I have read this
                      Agreement in its entirety and understand its contents. I
                      understand that participation in outdoor educational
                      activities involves inherent risks and that I am
                      voluntarily permitting my child to participate. I certify
                      that I am the parent or legal guardian of the child named
                      above and have authority to execute this Agreement.
                    </p>

                    {agreementSigned ? (
                      <div className="mt-2 border-2 border-[var(--sf-mint)] bg-[var(--sf-mint)]/60 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle className="w-4 h-4 text-[var(--sf-sage-deep)] flex-shrink-0" />
                          <p
                            className="text-2xl text-[var(--sf-ink)] truncate"
                            style={{
                              fontFamily: "var(--font-dancing-script)",
                            }}
                          >
                            {sigValue}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAgreementSigned(false);
                            setSigValue("");
                          }}
                          className="text-xs font-bold text-[var(--sf-soft)] hover:text-[var(--sf-ink)] underline shrink-0 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 border-2 border-dashed border-[var(--sf-coral)]/50 rounded-2xl px-4 py-4 flex flex-col gap-3 bg-[var(--sf-cream)]">
                        <p className="text-xs font-semibold text-[var(--sf-soft)] uppercase tracking-wide">
                          Sign this section
                        </p>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--sf-soft)] mb-1">
                            Full name{" "}
                            <span className="font-normal text-[var(--sf-soft)]/70">
                              (print)
                            </span>
                          </label>
                          <input
                            type="text"
                            value={sigPrintedName}
                            onChange={(e) => setSigPrintedName(e.target.value)}
                            placeholder="Your full legal name"
                            className="w-full px-3 py-2.5 rounded-2xl border-2 border-[var(--sf-ink)]/15 text-base text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 outline-none focus:border-[var(--sf-sage)] focus:ring-4 focus:ring-[var(--sf-mint)] transition bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--sf-soft)] mb-1">
                            Signature
                          </label>
                          {sigValue ? (
                            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl border-2 border-dashed border-[var(--sf-ink)]/15 bg-white">
                              <p
                                className="text-2xl text-[var(--sf-ink)] flex-1"
                                style={{
                                  fontFamily: "var(--font-dancing-script)",
                                }}
                              >
                                {sigValue}
                              </p>
                              <button
                                type="button"
                                onClick={() => setSigValue("")}
                                className="text-xs font-bold text-[var(--sf-soft)] hover:text-[var(--sf-ink)] underline shrink-0 cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSigValue(sigPrintedName)}
                              disabled={!sigPrintedName.trim()}
                              className="cursor-pointer w-full px-3 py-3 rounded-2xl border-2 border-[var(--sf-ink)]/15 bg-white text-base font-extrabold text-[var(--sf-coral-deep)] hover:bg-[var(--sf-coral)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                            >
                              Click to sign
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveSignature}
                            disabled={!sigValue.trim()}
                            className="px-5 py-2.5 bg-[var(--sf-coral)] text-white text-sm font-extrabold rounded-full shadow-[0_4px_0_0_var(--sf-coral-deep)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Save signature
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className={`flex-shrink-0 border-t px-6 py-4 flex items-center justify-between ${
                  agreementSigned
                    ? "bg-[var(--sf-mint)]/60 border-[var(--sf-mint)]"
                    : "bg-white border-[var(--sf-ink)]/10"
                }`}
              >
                {agreementSigned ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--sf-sage-deep)]" />
                    <span className="text-sm font-semibold text-[var(--sf-sage-deep)]">
                      Agreement signed — you&apos;re all set
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-[var(--sf-coral-deep)]" />
                    <span className="text-sm text-[var(--sf-soft)]">
                      Signature required to continue
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setAgreementOpen(false)}
                  className="px-4 py-2 rounded-full bg-white text-xs font-extrabold text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.15)] hover:-translate-y-0.5 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}
