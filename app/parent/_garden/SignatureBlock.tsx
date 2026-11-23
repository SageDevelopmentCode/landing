"use client";

import { useId, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { saveEnrollmentSignature } from "@/app/actions/saveEnrollmentSignature";
import type { EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { usePortalFeedback } from "./feedback";
import { FieldError, inputCls } from "./fields";
import { CheckIcon, Spinner, btnGhostSm, btnSageSm } from "./ui";

const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });
const scriptStyle = { fontFamily: "var(--font-dancing-script)" } as const;

export interface SignatureBlockProps {
  sectionId: number;
  contractId: number;
  studentId: string;
  parentName: string;
  existingSig?: EnrollmentSignature;
  onSectionSaved?: (sectionId: number, sig: EnrollmentSignature) => void;
  readOnly?: boolean;
  /** Names what was signed in the success toast, e.g. "Section 3". */
  label?: string;
  /** Admin "view as parent": the block renders but writes show the Preview toast. */
  readOnlyPreview?: boolean;
}

function formatSignedAt(iso: string | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Typed-signature block for enrollment contracts (Garden version of SectionSignatureBlock).
 * Steps: print your name → "Click to sign" (script preview) → Save. Saved state is a mint card with Edit.
 * Editing the printed name after signing clears the signature, so the two always match.
 */
export default function SignatureBlock({
  sectionId,
  contractId,
  studentId,
  parentName,
  existingSig,
  onSectionSaved,
  readOnly,
  label,
  readOnlyPreview,
}: SignatureBlockProps) {
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [printedName, setPrintedName] = useState(existingSig?.printed_name ?? parentName ?? "");
  const [signature, setSignature] = useState(existingSig?.signature ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameId = useId();
  const errId = `${nameId}-err`;

  const signedOn = formatSignedAt(existingSig?.signed_at);

  if (readOnly && !existingSig) {
    return (
      <p className="mt-4 rounded-[18px] border-2 border-dashed border-[var(--sf-ink)]/15 px-4 py-3 text-sm font-bold text-[var(--sf-soft)]">
        Not signed yet
      </p>
    );
  }

  if (existingSig && !isEditing) {
    return (
      <div className={`${dancingScript.variable} mt-4 flex items-center justify-between gap-4 rounded-[20px] bg-[var(--sf-mint)]/80 px-4 py-3`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white" aria-hidden="true">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl leading-tight text-[var(--sf-ink)]" style={scriptStyle}>
              {existingSig.signature}
            </p>
            <p className="text-xs font-extrabold text-[var(--sf-sage-deep)]">
              ✓ Signed{signedOn ? ` · ${signedOn}` : ""}
            </p>
          </div>
        </div>
        {!readOnly ? (
          <button type="button" onClick={() => setIsEditing(true)} className={`${btnGhostSm} !min-h-10 shrink-0 !px-4`}>
            Edit
          </button>
        ) : null}
      </div>
    );
  }

  const save = async () => {
    setError(null);
    if (!printedName.trim()) {
      setError("Please enter your printed name.");
      return;
    }
    if (!signature.trim()) {
      setError("Please click to sign before saving.");
      return;
    }
    setBusy(true);
    // Plain object so TS doesn't narrow these to `null` across the awaited callback.
    const out: { saved: EnrollmentSignature | null; serverError: string | null } = { saved: null, serverError: null };
    await runSave({
      successTitle: label ? `Signed · ${label}` : "Signature saved",
      errorTitle: "Couldn't save your signature",
      retry: () => void save(),
      fn: async () => {
        const result = await saveEnrollmentSignature({
          studentId,
          contractId,
          sectionId,
          printedName: printedName.trim(),
          signature: signature.trim(),
        });
        if (result.error || !result.data) {
          out.serverError = result.error ?? "Something went wrong. Please try again.";
          return { ok: false, error: out.serverError };
        }
        out.saved = result.data as EnrollmentSignature;
        return { ok: true };
      },
    });
    setBusy(false);
    if (out.saved) {
      setIsEditing(false);
      onSectionSaved?.(sectionId, out.saved);
    } else if (out.serverError) {
      setError(out.serverError);
    }
  };

  const signed = signature.trim().length > 0;

  return (
    <div className={`${dancingScript.variable} mt-4 flex flex-col gap-3 rounded-[22px] bg-white px-4 py-4 ring-1 ring-[var(--sf-ink)]/10 sm:px-5`}>
      <p className="text-sm font-extrabold text-[var(--sf-ink)]">
        Sign this section
        <span className="sf-hand ml-2 text-base font-normal text-[var(--sf-sage-deep)]">{signed ? "ready to save" : "type, then tap to sign"}</span>
      </p>

      <div>
        <label htmlFor={nameId} className="mb-1.5 block text-sm font-extrabold text-[var(--sf-ink)]">
          Full name <span className="font-bold text-[var(--sf-soft)]/80">(print)</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={printedName}
          autoComplete="name"
          onChange={(e) => {
            setPrintedName(e.target.value);
            // The signature is a copy of the printed name; changing the name un-signs.
            if (signature) setSignature("");
          }}
          placeholder="Your full legal name"
          className={inputCls}
          aria-describedby={error ? errId : undefined}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-extrabold text-[var(--sf-ink)]">Signature</p>
        {signed ? (
          <div className="flex items-center gap-3 rounded-[16px] border-2 border-dashed border-[var(--sf-sage)]/50 bg-[var(--sf-cream)] px-4 py-2">
            <p className="min-w-0 flex-1 truncate text-3xl leading-tight text-[var(--sf-ink)]" style={scriptStyle}>
              {signature}
            </p>
            <button
              type="button"
              onClick={() => setSignature("")}
              className="min-h-11 shrink-0 rounded-full px-3 text-xs font-extrabold text-[var(--sf-soft)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
            >
              Clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSignature(printedName.trim())}
            disabled={!printedName.trim()}
            className="flex min-h-[56px] w-full items-center gap-2 rounded-[16px] border-2 border-dashed border-[var(--sf-ink)]/20 bg-[var(--sf-cream)] px-4 text-left text-[15px] font-extrabold text-[var(--sf-sage-deep)] transition hover:border-[var(--sf-sage)] hover:bg-[var(--sf-mint)]/40 focus-visible:border-[var(--sf-sage)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <span aria-hidden="true">✍️</span> Click to sign
          </button>
        )}
      </div>

      <FieldError id={errId}>{error}</FieldError>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void save()} disabled={busy || !signed} aria-busy={busy || undefined} className={btnSageSm}>
          {busy ? <Spinner /> : null}
          {busy ? "Saving…" : "Save signature"}
        </button>
        {isEditing ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setIsEditing(false);
              setError(null);
              setPrintedName(existingSig?.printed_name ?? parentName ?? "");
              setSignature(existingSig?.signature ?? "");
            }}
            className={btnGhostSm}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
