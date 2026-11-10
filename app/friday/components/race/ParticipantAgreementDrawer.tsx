"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, PenLine, X } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { ChildEntry, FridayFormData } from "./PitStopForm";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const ACTIVITIES = [
  "Climbing trees, logs, rocks, play structures, and natural features",
  "Running, balancing, jumping, hiking, and exploring uneven terrain",
  "Outdoor games and physical activities",
  "Gardening and nature-based activities",
  "Interaction with insects, wildlife, plants, and natural materials",
  "Cooking and food preparation activities",
  "Use of age-appropriate tools, utensils, and equipment under supervision",
  "Water play activities",
  "Animal interactions",
  "Arts, crafts, building projects, and other hands-on learning experiences",
];

const RISKS = [
  "Slips, trips, falls, and collisions",
  "Cuts, scrapes, bruises, splinters, burns, and minor injuries",
  "Sprains, fractures, and other physical injuries",
  "Exposure to weather conditions including heat, cold, rain, wind, and sun",
  "Exposure to insects, including bees, wasps, mosquitoes, ants, ticks, and chiggers",
  "Contact with plants, soil, mud, and natural environments",
  "Allergic reactions",
  "Risks associated with cooking activities and use of cooking equipment",
  "Risks associated with supervised use of tools and equipment",
  "Risks associated with interactions with animals",
  "Risks arising from participation in active outdoor play and exploration",
];

function AgreementSectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

type Props = {
  agreementOpen: boolean;
  setAgreementOpen: Dispatch<SetStateAction<boolean>>;
  formData: FridayFormData;
  entries: ChildEntry[];
  agreementSigned: boolean;
  setAgreementSigned: Dispatch<SetStateAction<boolean>>;
  sigPrintedName: string;
  setSigPrintedName: Dispatch<SetStateAction<string>>;
  sigValue: string;
  setSigValue: Dispatch<SetStateAction<string>>;
  handleSaveSignature: () => void;
};

export default function ParticipantAgreementDrawer({
  agreementOpen,
  setAgreementOpen,
  formData,
  entries: children,
  agreementSigned,
  setAgreementSigned,
  sigPrintedName,
  setSigPrintedName,
  sigValue,
  setSigValue,
  handleSaveSignature,
}: Props) {
  useEffect(() => {
    if (!agreementOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAgreementOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agreementOpen, setAgreementOpen]);

  return (
    <AnimatePresence>
      {agreementOpen && (
        <div className={dancingScript.variable}>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAgreementOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Participant Agreement"
            className="fixed inset-y-0 right-0 w-full max-w-3xl z-[70] bg-white flex flex-col shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex-shrink-0 sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-bold font-heading text-gray-800">
                  Race Cars and Speedsters Participant Agreement
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {agreementSigned ? "1" : "0"} of 1 sections signed
                </p>
              </div>
              <button
                onClick={() => setAgreementOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold font-heading text-gray-800">
                    Sage Field Private Microschool
                  </p>
                  <p className="text-xs text-gray-500 font-body">
                    Location: Round Rock, Texas · Race Cars and Speedsters: November 13,
                    2026
                  </p>
                </div>

                <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      {
                        label: children.length > 1 ? "Children" : "Student Name",
                        value: children.map((c) => c.name).filter(Boolean).join(", ") || "—",
                      },
                      {
                        label: "Parent / Guardian",
                        value: formData.parentName || "—",
                      },
                      {
                        label: "Emergency Contact",
                        value: formData.emergencyName
                          ? `${formData.emergencyName}${formData.emergencyPhone ? ` · ${formData.emergencyPhone}` : ""}`
                          : "—",
                      },
                      {
                        label: "Photo Consent",
                        value: formData.consentPhoto
                          ? "✓ Authorized"
                          : "✗ Not authorized",
                      },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="text-xs font-semibold text-gray-400 font-body">
                          {row.label}
                        </p>
                        <p className="text-sm text-gray-800 font-body">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {formData.notes && (
                    <div className="border-t border-gray-200 pt-3 mt-1">
                      <p className="text-xs font-semibold text-gray-400 font-body mb-1">
                        Medical / Notes
                      </p>
                      <p className="text-sm text-gray-700 font-body leading-relaxed">
                        {formData.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <AgreementSectionHeader title="1. Acknowledgment of Program Activities" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I understand that my child is participating in a Race Cars and Speedsters
                    Field Day at an outdoor education program where
                    children learn through active exploration, hands-on
                    experiences, and supervised outdoor activities.
                    Activities may include, but are not limited to:
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {ACTIVITIES.map((a) => (
                      <li
                        key={a}
                        className="flex gap-2 text-sm text-gray-600 font-body"
                      >
                        <span className="text-[#E3241B] mt-0.5 flex-shrink-0">
                          •
                        </span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I understand that these activities involve inherent
                    risks that cannot be completely eliminated while
                    preserving the educational and developmental benefits of
                    participation.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <AgreementSectionHeader title="2. Assumption of Risk" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I knowingly and voluntarily assume all risks associated
                    with my child&apos;s participation in the Race Cars and Speedsters
                    Field Day, including but not limited to:
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {RISKS.map((r) => (
                      <li
                        key={r}
                        className="flex gap-2 text-sm text-gray-600 font-body"
                      >
                        <span className="text-[#E3241B] mt-0.5 flex-shrink-0">
                          •
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I understand that injury may occur despite reasonable
                    supervision and safety precautions.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <AgreementSectionHeader title="3. Release of Liability" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    In consideration of my child&apos;s participation in the
                    Race Cars and Speedsters Field Day, I release and hold harmless the
                    School, its owners, directors, employees, contractors,
                    volunteers, agents, and representatives from any claims,
                    demands, causes of action, damages, losses, costs, or
                    expenses arising out of or related to my child&apos;s
                    participation.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    This release applies to all claims based upon ordinary
                    negligence but does not apply to claims arising from
                    gross negligence, reckless conduct, or intentional
                    misconduct.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <AgreementSectionHeader title="4. Medical Authorization" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I authorize school personnel to obtain emergency medical
                    treatment for my child if I cannot be reached promptly.
                    I understand that:
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {[
                      "Emergency medical services may be contacted when deemed necessary.",
                      "I am responsible for all medical expenses incurred on behalf of my child.",
                      "School personnel may administer basic first aid as appropriate.",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-gray-600 font-body"
                      >
                        <span className="text-[#E3241B] mt-0.5 flex-shrink-0">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {formData.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-semibold text-yellow-700 font-body mb-1">
                        Allergies, Medical Conditions, or Special Notes
                      </p>
                      <p className="text-sm text-yellow-800 font-body">
                        {formData.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <AgreementSectionHeader title="5. Photography and Media Release" />
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                      formData.consentPhoto
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <span className="text-lg">
                      {formData.consentPhoto ? "✅" : "🚫"}
                    </span>
                    <p className="text-sm font-body text-gray-700">
                      {formData.consentPhoto
                        ? "I authorize the School to photograph and/or record my child and use such images or recordings for educational, promotional, website, social media, and marketing purposes."
                        : "I do not authorize the School to use photographs or recordings of my child."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <AgreementSectionHeader title="6. Emergency Contact Authorization" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    If the parent or guardian cannot be reached, the
                    following individual is authorized to make emergency
                    decisions regarding the child:
                  </p>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 font-body">
                          Name
                        </p>
                        <p className="text-sm text-gray-800 font-body">
                          {formData.emergencyName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 font-body">
                          Phone
                        </p>
                        <p className="text-sm text-gray-800 font-body">
                          {formData.emergencyPhone || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <AgreementSectionHeader title="7. Parent Acknowledgment & Signature" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    By signing below, I confirm that I have read this
                    Agreement in its entirety and understand its contents. I
                    certify that I am the parent or legal guardian of the
                    child named above and have authority to execute this
                    Agreement.
                  </p>

                  {agreementSigned ? (
                    <div className="mt-2 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <p
                          className="text-2xl text-gray-700 truncate"
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
                        className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
                        Sign this section
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
                          Full name{" "}
                          <span className="font-normal text-gray-400">
                            (print)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={sigPrintedName}
                          onChange={(e) =>
                            setSigPrintedName(e.target.value)
                          }
                          placeholder="Your full legal name"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#1456F0] transition-colors bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
                          Signature
                        </label>
                        {sigValue ? (
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-white">
                            <p
                              className="text-2xl text-gray-700 flex-1"
                              style={{
                                fontFamily: "var(--font-dancing-script)",
                              }}
                            >
                              {sigValue}
                            </p>
                            <button
                              type="button"
                              onClick={() => setSigValue("")}
                              className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0 cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSigValue(sigPrintedName)}
                            disabled={!sigPrintedName.trim()}
                            className="cursor-pointer w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-body text-[#E3241B] hover:bg-[#E3241B]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
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
                          className="px-4 py-2 bg-[#E3241B] text-white text-xs font-semibold font-body rounded-lg hover:bg-[#B91C14] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-100"
              }`}
            >
              {agreementSigned ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700 font-body">
                    Agreement signed — you&apos;re all set
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-[#E3241B]" />
                  <span className="text-sm text-gray-500 font-body">
                    Signature required to continue
                  </span>
                </div>
              )}
              <button
                onClick={() => setAgreementOpen(false)}
                className="px-4 py-2 text-xs font-semibold font-body text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
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
