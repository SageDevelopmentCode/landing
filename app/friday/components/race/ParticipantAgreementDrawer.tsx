"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, PenLine, X } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { ChildEntry, FridayFormData } from "./PitStopForm";
import { ParticipantAgreementBody } from "@/app/lib/participant-agreements/participant-agreement-body";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

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
                  Thankful &amp; Grateful Participant Agreement
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
                <ParticipantAgreementBody
                  variant="friday"
                  mode="print"
                  sectionsThrough={6}
                  info={{
                    studentLabel:
                      children.length > 1 ? "Children" : "Student Name",
                    studentNames:
                      children.map((c) => c.name).filter(Boolean).join(", ") ||
                      "—",
                    parentName: formData.parentName || "—",
                    emergencyName: formData.emergencyName || "—",
                    emergencyPhone: formData.emergencyPhone || undefined,
                    photoConsent: formData.consentPhoto,
                    notes: formData.notes,
                  }}
                />

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
