"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, PenLine } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import { saveEnrollmentSignature } from "@/app/actions/saveEnrollmentSignature";
import {
  CONTRACT_1_SECTIONS,
} from "./contractContent";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
  studentId: string;
  parentName: string;
  existingSignatures: SignatureMap;
  onSignaturesSaved: (updatedMap: SignatureMap) => void;
}

interface SectionSignatureBlockProps {
  sectionId: number;
  contractId: number;
  studentId: string;
  parentName: string;
  existingSig?: EnrollmentSignature;
  onSectionSaved: (sectionId: number, sig: EnrollmentSignature) => void;
}

function SectionSignatureBlock({
  sectionId,
  contractId,
  studentId,
  parentName,
  existingSig,
  onSectionSaved,
}: SectionSignatureBlockProps) {
  const [printedName, setPrintedName] = useState(
    existingSig?.printed_name ?? parentName ?? ""
  );
  const [signature, setSignature] = useState(existingSig?.signature ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSaved = !!existingSig && !isEditing;

  const handleSave = () => {
    setError(null);
    if (!printedName.trim()) {
      setError("Please enter your printed name.");
      return;
    }
    if (!signature.trim()) {
      setError("Please click to sign before saving.");
      return;
    }
    startTransition(async () => {
      const result = await saveEnrollmentSignature({
        studentId,
        contractId,
        sectionId,
        printedName: printedName.trim(),
        signature: signature.trim(),
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setIsEditing(false);
        onSectionSaved(sectionId, result.data as EnrollmentSignature);
      }
    });
  };

  if (isSaved) {
    return (
      <div className="mt-4 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p
            className="text-2xl text-gray-700 truncate"
            style={{ fontFamily: "var(--font-dancing-script)" }}
          >
            {existingSig.signature}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 font-body uppercase tracking-wide">
        Sign this section
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
          Full name <span className="font-normal text-gray-400">(print)</span>
        </label>
        <input
          type="text"
          value={printedName}
          onChange={(e) => setPrintedName(e.target.value)}
          placeholder="Your full legal name"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 font-body mb-1">
          Signature
        </label>
        {signature ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-white">
            <p
              className="text-2xl text-gray-700 flex-1"
              style={{ fontFamily: "var(--font-dancing-script)" }}
            >
              {signature}
            </p>
            <button
              type="button"
              onClick={() => setSignature("")}
              className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0"
            >
              Clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSignature(printedName)}
            disabled={!printedName.trim()}
            className="cursor-pointer w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-body text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            Click to sign
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-body">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !signature.trim()}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold font-body rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save signature"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setPrintedName(existingSig?.printed_name ?? parentName ?? "");
              setSignature(existingSig?.signature ?? "");
            }}
            className="px-4 py-2 text-xs font-semibold font-body text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function ContractModal({
  isOpen,
  onClose,
  contractId,
  studentId,
  parentName,
  existingSignatures,
  onSignaturesSaved,
}: ContractModalProps) {
  const [localSigs, setLocalSigs] = useState<SignatureMap>(existingSignatures);

  const totalSections = CONTRACT_1_SECTIONS.length;
  const signedCount = CONTRACT_1_SECTIONS.filter(
    (s) => !!localSigs[`${contractId}-${s.id}`]
  ).length;
  const allSigned = signedCount === totalSections;

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${contractId}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSignaturesSaved(updated);
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                  Program Description, Parent Responsibilities & Key Policies
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {signedCount} of {totalSections} sections signed
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
                {CONTRACT_1_SECTIONS.map((section) => {
                  const key = `${contractId}-${section.id}`;
                  const existingSig = localSigs[key];
                  return (
                    <div key={section.id} className="flex flex-col">
                      <h3 className="text-sm font-bold font-heading text-gray-800 mb-3 pb-2 border-b border-gray-100">
                        {section.title}
                      </h3>

                      <div className="flex flex-col gap-2 text-sm text-gray-600 font-body">
                        {section.paragraphs.map((p, i) => (
                          <p key={i} className="leading-relaxed">
                            {p}
                          </p>
                        ))}

                        {section.bullets && section.bullets.length > 0 && (
                          <ul className="flex flex-col gap-1.5 mt-1">
                            {section.bullets.map((b, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.afterBullets &&
                          section.afterBullets.map((p, i) => (
                            <p key={i} className="leading-relaxed mt-1">
                              {p}
                            </p>
                          ))}
                      </div>

                      <SectionSignatureBlock
                        sectionId={section.id}
                        contractId={contractId}
                        studentId={studentId}
                        parentName={parentName}
                        existingSig={existingSig}
                        onSectionSaved={handleSectionSaved}
                      />
                    </div>
                  );
                })}
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
                    All sections signed — contract complete
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-500 font-body">
                    {totalSections - signedCount} section
                    {totalSections - signedCount !== 1 ? "s" : ""} remaining
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
