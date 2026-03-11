"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, PenLine } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import {
  CONTRACT_1_SECTIONS,
  CONTRACT_2_SECTIONS,
} from "./contractContent";
import { CONTRACT_2_ID } from "@/app/types/enrollment-signatures";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import SectionSignatureBlock from "./SectionSignatureBlock";

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

  const sections = contractId === CONTRACT_2_ID ? CONTRACT_2_SECTIONS : CONTRACT_1_SECTIONS;
  const contractTitle = contractId === CONTRACT_2_ID
    ? "Community Agreement for Families and Staff"
    : "Program Description, Parent Responsibilities & Key Policies";

  const totalSections = sections.length;
  const signedCount = sections.filter(
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
                  {contractTitle}
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
                {sections.map((section) => {
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
