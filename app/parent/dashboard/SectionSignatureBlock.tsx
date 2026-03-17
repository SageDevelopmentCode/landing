"use client";

import { useState, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import { saveEnrollmentSignature } from "@/app/actions/saveEnrollmentSignature";
import type { EnrollmentSignature } from "@/app/types/enrollment-signatures";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

export interface SectionSignatureBlockProps {
  sectionId: number;
  contractId: number;
  studentId: string;
  parentName: string;
  existingSig?: EnrollmentSignature;
  onSectionSaved?: (sectionId: number, sig: EnrollmentSignature) => void;
  readOnly?: boolean;
}

export default function SectionSignatureBlock({
  sectionId,
  contractId,
  studentId,
  parentName,
  existingSig,
  onSectionSaved,
  readOnly,
}: SectionSignatureBlockProps) {
  const [printedName, setPrintedName] = useState(
    existingSig?.printed_name ?? parentName ?? ""
  );
  const [signature, setSignature] = useState(existingSig?.signature ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (readOnly && !existingSig) return null;

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
        onSectionSaved?.(sectionId, result.data as EnrollmentSignature);
      }
    });
  };

  if (isSaved) {
    return (
      <div className={`${dancingScript.variable} mt-4 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3 min-w-0">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p
            className="text-2xl text-gray-700 truncate"
            style={{ fontFamily: "var(--font-dancing-script)" }}
          >
            {existingSig.signature}
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${dancingScript.variable} mt-4 border border-gray-200 rounded-xl px-4 py-4 flex flex-col gap-3 bg-gray-50`}>
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
