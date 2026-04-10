"use client";

import { useState, useTransition, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, PenLine } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_5_ID, CONTRACT_5_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import { CONTRACT_5_SECTIONS } from "./contractContent";
import SectionSignatureBlock from "./SectionSignatureBlock";
import { savePhotoReleaseConsent } from "@/app/actions/savePhotoReleaseConsent";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

interface PhotoReleaseModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  signatures: SignatureMap;
  onSectionSaved: (sig: EnrollmentSignature) => void;
  existingConsent: "FULL" | "LIMITED" | "NO" | null;
  onConsentSaved: (level: "FULL" | "LIMITED" | "NO") => void;
  readOnly?: boolean;
}

const CONSENT_OPTIONS: { value: "FULL" | "LIMITED" | "NO"; label: string; description: string }[] = [
  {
    value: "FULL",
    label: "Full Consent",
    description:
      "My child's image and name may be used in all School materials, including website, social media, newsletters, print, and presentations.",
  },
  {
    value: "LIMITED",
    label: "Limited Consent",
    description:
      "My child's image may be used in internal School materials only (e.g., newsletters sent to enrolled families). My child's image may NOT be used on public-facing platforms such as the website or social media.",
  },
  {
    value: "NO",
    label: "No Consent",
    description:
      "I do not consent to any photography or video recording of my child for School use. My child will be excluded from group photos and media captures.",
  },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
      {title}
    </h3>
  );
}

export default function PhotoReleaseModal({
  open,
  onClose,
  studentId,
  studentName,
  parentName,
  signatures,
  onSectionSaved,
  existingConsent,
  onConsentSaved,
  readOnly,
}: PhotoReleaseModalProps) {
  const [localSigs, setLocalSigs] = useState<SignatureMap>(signatures);
  const [selectedConsent, setSelectedConsent] = useState<"FULL" | "LIMITED" | "NO" | null>(existingConsent);
  const [savedConsent, setSavedConsent] = useState<"FULL" | "LIMITED" | "NO" | null>(existingConsent);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isSavingConsent, startConsentSave] = useTransition();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const signedCount = Array.from(
    { length: CONTRACT_5_TOTAL_SECTIONS },
    (_, i) => i + 1
  ).filter((i) => !!localSigs[`${CONTRACT_5_ID}-${i}`]).length;
  const allSigned = signedCount === CONTRACT_5_TOTAL_SECTIONS;

  const handleSaveConsent = () => {
    if (!selectedConsent) {
      setConsentError("Please select a consent level before saving.");
      return;
    }
    setConsentError(null);
    startConsentSave(async () => {
      const result = await savePhotoReleaseConsent({
        studentId,
        consentLevel: selectedConsent,
      });
      if (result.error) {
        setConsentError(result.error);
      } else {
        setSavedConsent(selectedConsent);
        onConsentSaved(selectedConsent);
      }
    });
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${CONTRACT_5_ID}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSectionSaved(sig);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className={dancingScript.variable}>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Right-side drawer */}
          <motion.div
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
                  Photo, Video, and Media Release
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {studentName} · {signedCount} of {CONTRACT_5_TOTAL_SECTIONS} sections signed
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-10">
                {/* Sections 1–4 and 6–7: text only */}
                {CONTRACT_5_SECTIONS.filter((s) => s.id !== 5).map((section) => (
                  <div key={section.id} className="flex flex-col gap-3">
                    <SectionHeader title={section.title} />
                    {section.paragraphs.map((p, i) => (
                      <p key={i} className="text-sm text-gray-600 font-body leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                ))}

                {/* Section 5: Consent level selection */}
                {(() => {
                  const sec5 = CONTRACT_5_SECTIONS.find((s) => s.id === 5)!;
                  return (
                    <div className="flex flex-col gap-4">
                      <SectionHeader title={sec5.title} />
                      <p className="text-sm text-gray-600 font-body leading-relaxed">
                        {sec5.paragraphs[0]}
                      </p>

                      {readOnly ? (
                        savedConsent && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-sm font-semibold font-body text-gray-700">
                              Consent level: {savedConsent}
                            </span>
                          </div>
                        )
                      ) : (
                        <>
                          <div className="flex flex-col gap-3">
                            {CONSENT_OPTIONS.map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                  selectedConsent === opt.value
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="consentLevel"
                                  value={opt.value}
                                  checked={selectedConsent === opt.value}
                                  onChange={() => setSelectedConsent(opt.value)}
                                  className="sr-only"
                                />
                                <span
                                  className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    selectedConsent === opt.value
                                      ? "border-primary"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {selectedConsent === opt.value && (
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold font-heading text-gray-800">
                                    {opt.label}
                                  </p>
                                  <p className="text-xs text-gray-500 font-body mt-0.5 leading-relaxed">
                                    {opt.description}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>

                          {consentError && (
                            <p className="text-xs text-red-500 font-body">{consentError}</p>
                          )}

                          {savedConsent ? (
                            <div className="flex items-center gap-3">
                              <p className="text-xs text-emerald-600 font-body">
                                Consent level saved: <strong>{savedConsent}</strong>
                              </p>
                              {selectedConsent !== savedConsent && (
                                <button
                                  type="button"
                                  onClick={handleSaveConsent}
                                  disabled={isSavingConsent}
                                  className="px-3 py-1.5 bg-primary text-white text-xs font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {isSavingConsent ? "Saving..." : "Update selection"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSaveConsent}
                              disabled={isSavingConsent || !selectedConsent}
                              className="w-fit px-4 py-2 bg-primary text-white text-sm font-semibold font-body rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isSavingConsent ? "Saving..." : "Save selection"}
                            </button>
                          )}
                        </>
                      )}

                      {/* Section 5 initials block — unlocks after consent is saved */}
                      {!readOnly && !savedConsent ? (
                        <div className="mt-2 border border-dashed border-amber-200 rounded-xl px-4 py-3 bg-amber-50">
                          <p className="text-xs text-amber-700 font-body">
                            Save your consent selection above before completing this section.
                          </p>
                        </div>
                      ) : (
                        <SectionSignatureBlock
                          sectionId={1}
                          contractId={CONTRACT_5_ID}
                          studentId={studentId}
                          parentName={parentName}
                          existingSig={localSigs[`${CONTRACT_5_ID}-1`]}
                          onSectionSaved={handleSectionSaved}
                          readOnly={readOnly}
                        />
                      )}
                    </div>
                  );
                })()}

                {/* Final Parent/Guardian Acknowledgment */}
                <div className="flex flex-col gap-4">
                  <SectionHeader title="Parent/Guardian Acknowledgment" />
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    By signing below, I confirm that I have read and understood this Photo, Video,
                    and Media Release in its entirety. I acknowledge my selected consent level for
                    my child&apos;s participation in photography and video recording at Sage Field Academy.
                    I understand that this consent may be revoked at any time in writing and that
                    revocation applies to future use only.
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I enter this agreement freely and on behalf of my child, and I have the legal
                    authority to grant or withhold consent as described herein.
                  </p>
                  <SectionSignatureBlock
                    sectionId={2}
                    contractId={CONTRACT_5_ID}
                    studentId={studentId}
                    parentName={parentName}
                    existingSig={localSigs[`${CONTRACT_5_ID}-2`]}
                    onSectionSaved={handleSectionSaved}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className={`flex-shrink-0 sticky bottom-0 border-t px-6 py-4 flex items-center justify-between ${
                  allSigned
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-gray-100"
                }`}
              >
                {allSigned ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700 font-body">
                      All sections signed — form complete
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-500 font-body">
                      {CONTRACT_5_TOTAL_SECTIONS - signedCount} section
                      {CONTRACT_5_TOTAL_SECTIONS - signedCount !== 1 ? "s" : ""}{" "}
                      remaining
                    </span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold font-body text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
