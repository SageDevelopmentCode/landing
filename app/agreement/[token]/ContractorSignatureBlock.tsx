"use client";

import { useEffect, useId, useState } from "react";
import { Dancing_Script } from "next/font/google";
import { FieldError, inputCls } from "@/app/parent/_garden/fields";
import { CheckIcon, btnGhostSm, btnSageSm } from "@/app/parent/_garden/ui";
import type { SectionSignature } from "@/app/lib/contractor-agreement/types";

const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });
const scriptStyle = { fontFamily: "var(--font-dancing-script)" } as const;

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

function formatSignedAt(iso: string | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Typed-signature block for the contractor agreement — same flow and look as the
 * parent enrollment `SignatureBlock` (print name → "Click to sign" → script preview →
 * Save; saved = mint card with Edit; editing the name clears the signature).
 * Differences: saves into page state (the whole agreement is submitted at the end),
 * and the printed name must match the legal name from "Your details".
 */
export default function ContractorSignatureBlock({
  legalName,
  existingSig,
  onSave,
  onClear,
  title = "Sign this section",
  saveLabel = "Save signature",
  disabledReason,
}: {
  legalName: string;
  existingSig?: SectionSignature;
  onSave: (sig: SectionSignature) => void;
  onClear?: () => void;
  title?: string;
  saveLabel?: string;
  /** When set, the block is shown but can't be signed yet (e.g. details missing). */
  disabledReason?: string | null;
}) {
  const [printedName, setPrintedName] = useState(existingSig?.printed_name ?? legalName);
  const [signature, setSignature] = useState(existingSig?.signature ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();
  const errId = `${nameId}-err`;

  // Keep the prefilled name in step with "Your details" until the person types here.
  useEffect(() => {
    if (!existingSig && !signature) setPrintedName(legalName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalName]);

  if (existingSig && !isEditing) {
    const signedOn = formatSignedAt(existingSig.signed_at);
    return (
      <div className={`${dancingScript.variable} mt-5 flex items-center justify-between gap-4 rounded-[20px] bg-[var(--sf-mint)]/80 px-4 py-3`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white" aria-hidden="true">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl leading-tight text-[var(--sf-ink)]" style={scriptStyle}>
              {existingSig.signature}
            </p>
            <p className="text-xs font-extrabold text-[var(--sf-sage-deep)]">✓ Signed{signedOn ? ` · ${signedOn}` : ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setPrintedName(existingSig.printed_name);
            setSignature(existingSig.signature);
            setIsEditing(true);
          }}
          className={`${btnGhostSm} !min-h-10 shrink-0 !px-4`}
        >
          Edit
        </button>
      </div>
    );
  }

  const save = () => {
    setError(null);
    if (!printedName.trim()) return setError("Please enter your printed name.");
    if (!signature.trim()) return setError("Please click to sign before saving.");
    if (norm(printedName) !== norm(legalName)) {
      return setError(`Please sign with the same legal name as in "Your details" (${legalName.trim() || "not filled in yet"}).`);
    }
    onSave({ printed_name: printedName.trim(), signature: signature.trim(), signed_at: new Date().toISOString() });
    setIsEditing(false);
  };

  const signed = signature.trim().length > 0;
  const disabled = Boolean(disabledReason);

  return (
    <div className={`${dancingScript.variable} mt-5 flex flex-col gap-3 rounded-[22px] bg-[var(--sf-cream)] px-4 py-4 ring-1 ring-[var(--sf-ink)]/10 sm:px-5`}>
      <p className="text-sm font-extrabold text-[var(--sf-ink)]">
        {title}
        <span className="sf-hand ml-2 text-base font-normal text-[var(--sf-sage-deep)]">
          {disabled ? "almost!" : signed ? "ready to save" : "type, then tap to sign"}
        </span>
      </p>

      {disabledReason ? <p className="text-sm font-bold text-[var(--sf-soft)]">{disabledReason}</p> : null}

      <div>
        <label htmlFor={nameId} className="mb-1.5 block text-sm font-extrabold text-[var(--sf-ink)]">
          Full name <span className="font-bold text-[var(--sf-soft)]/80">(print)</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={printedName}
          autoComplete="name"
          disabled={disabled}
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
          <div className="flex items-center gap-3 rounded-[16px] border-2 border-dashed border-[var(--sf-sage)]/50 bg-white px-4 py-2">
            <p className="min-w-0 flex-1 truncate text-3xl leading-tight text-[var(--sf-ink)]" style={scriptStyle}>
              {signature}
            </p>
            <button
              type="button"
              onClick={() => setSignature("")}
              className="min-h-11 shrink-0 cursor-pointer rounded-full px-3 text-xs font-extrabold text-[var(--sf-soft)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
            >
              Clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSignature(printedName.trim())}
            disabled={disabled || !printedName.trim()}
            className="flex min-h-[56px] w-full cursor-pointer items-center gap-2 rounded-[16px] border-2 border-dashed border-[var(--sf-ink)]/20 bg-white px-4 text-left text-[15px] font-extrabold text-[var(--sf-sage-deep)] transition hover:border-[var(--sf-sage)] hover:bg-[var(--sf-mint)]/40 focus-visible:border-[var(--sf-sage)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">✍️</span> Click to sign
          </button>
        )}
      </div>

      <FieldError id={errId}>{error}</FieldError>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={disabled || !signed} className={btnSageSm}>
          {saveLabel}
        </button>
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              className={btnGhostSm}
            >
              Cancel
            </button>
            {onClear ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSignature("");
                  onClear();
                }}
                className={btnGhostSm}
              >
                Remove signature
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
