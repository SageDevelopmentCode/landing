"use client";

import { useRef, useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import { CheckIcon } from "@/app/parent/_garden/ui";
import { CONTRACT_1_SECTIONS, CONTRACT_2_SECTIONS } from "./contractContent";
import { CONTRACT_2_ID } from "@/app/types/enrollment-signatures";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { Bullets, LegalText, SheetStep, SigningFooter, signedLabel, stripNumber, useScrollToSection } from "./garden/sheetParts";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number;
  studentId: string;
  parentName: string;
  existingSignatures: SignatureMap;
  onSignaturesSaved: (updatedMap: SignatureMap) => void;
  readOnly?: boolean;
  /** Admin "view as parent": signing shows the Preview toast instead of saving. */
  readOnlyPreview?: boolean;
}

const sectionDomId = (contractId: number, sectionId: number) => `contract-${contractId}-sec-${sectionId}`;

/** Contracts 1 and 2: long legal text, one typed signature per section. */
export default function ContractModal({
  isOpen,
  onClose,
  contractId,
  studentId,
  parentName,
  existingSignatures,
  onSignaturesSaved,
  readOnly,
  readOnlyPreview,
}: ContractModalProps) {
  const [localSigs, setLocalSigs] = useState<SignatureMap>(existingSignatures);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollToSection(bodyRef);

  const sections = contractId === CONTRACT_2_ID ? CONTRACT_2_SECTIONS : CONTRACT_1_SECTIONS;
  const contractTitle =
    contractId === CONTRACT_2_ID
      ? "Community Agreement for Families and Staff"
      : "Program Description, Parent Responsibilities & Key Policies";

  const isSigned = (sectionId: number) => !!localSigs[`${contractId}-${sectionId}`];
  const totalSections = sections.length;
  const signedCount = sections.filter((s) => isSigned(s.id)).length;
  const firstUnsigned = (after?: number) => {
    const startIdx = after === undefined ? 0 : sections.findIndex((s) => s.id === after) + 1;
    return [...sections.slice(startIdx), ...sections.slice(0, startIdx)].find((s) => !isSigned(s.id)) ?? null;
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const key = `${contractId}-${sectionId}`;
    const updated = { ...localSigs, [key]: sig };
    setLocalSigs(updated);
    onSignaturesSaved(updated);
    // Carry the parent straight on to the next section that still needs a signature.
    const startIdx = sections.findIndex((s) => s.id === sectionId) + 1;
    const next = [...sections.slice(startIdx), ...sections.slice(0, startIdx)].find((s) => !updated[`${contractId}-${s.id}`]);
    if (next) window.setTimeout(() => scrollTo(sectionDomId(contractId, next.id)), 250);
  };

  const jumpList = (
    <nav aria-label="Jump to a section">
      <ol className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 scrollbar-hide sm:-mx-6 sm:px-6">
        {sections.map((s, i) => {
          const done = isSigned(s.id);
          return (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollTo(sectionDomId(contractId, s.id))}
                aria-label={`Section ${i + 1}: ${stripNumber(s.title)}${done ? " (signed)" : " (not signed)"}`}
                className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                  done
                    ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]"
                    : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:bg-[var(--sf-butter)]/60"
                }`}
              >
                {done ? <CheckIcon className="h-3 w-3" /> : null}
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <GardenSheet
      open={isOpen}
      onClose={onClose}
      size="wide"
      bodyRef={bodyRef}
      icon={contractId === CONTRACT_2_ID ? "🤝" : "📜"}
      title={contractTitle}
      note={signedLabel(signedCount, totalSections)}
      toolbar={jumpList}
      footer={
        <SigningFooter
          total={totalSections}
          signed={signedCount}
          readOnly={readOnly}
          onClose={onClose}
          onNext={() => {
            const next = firstUnsigned();
            if (next) scrollTo(sectionDomId(contractId, next.id));
          }}
        />
      }
    >
      <div className="flex flex-col gap-10 pt-2">
        {sections.map((section, i) => (
          <SheetStep key={section.id} n={i + 1} title={stripNumber(section.title)} done={isSigned(section.id)} id={sectionDomId(contractId, section.id)}>
            <LegalText>
              {section.paragraphs.map((p, pi) => (
                <p key={pi}>{p}</p>
              ))}
              {section.bullets && section.bullets.length > 0 ? <Bullets items={section.bullets} /> : null}
              {section.afterBullets?.map((p, pi) => (
                <p key={`a-${pi}`}>{p}</p>
              ))}
            </LegalText>
            <SignatureBlock
              sectionId={section.id}
              contractId={contractId}
              studentId={studentId}
              parentName={parentName}
              existingSig={localSigs[`${contractId}-${section.id}`]}
              onSectionSaved={handleSectionSaved}
              readOnly={readOnly}
              readOnlyPreview={readOnlyPreview}
              label={`Section ${i + 1} of ${totalSections}`}
            />
          </SheetStep>
        ))}
      </div>
    </GardenSheet>
  );
}
