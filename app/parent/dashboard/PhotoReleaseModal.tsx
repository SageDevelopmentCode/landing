"use client";

import { useRef, useState } from "react";
import type { SignatureMap, EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_5_ID, CONTRACT_5_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import { savePhotoReleaseConsent } from "@/app/actions/savePhotoReleaseConsent";
import GardenSheet from "@/app/parent/_garden/sheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import { InlineError, LockedNote, RadioCardGroup } from "@/app/parent/_garden/fields";
import { Spinner, btnSageSm } from "@/app/parent/_garden/ui";
import { CONTRACT_5_SECTIONS } from "./contractContent";
import { LegalText, NoteCard, SheetStep, SigningFooter, signedLabel, stripNumber, useScrollToSection } from "./garden/sheetParts";

type ConsentLevel = "FULL" | "LIMITED" | "NO";

interface PhotoReleaseModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  signatures: SignatureMap;
  onSectionSaved: (sig: EnrollmentSignature) => void;
  existingConsent: ConsentLevel | null;
  onConsentSaved: (level: ConsentLevel) => void;
  readOnly?: boolean;
  readOnlyPreview?: boolean;
}

const CONSENT_OPTIONS: { value: ConsentLevel; label: string; emoji: string; description: string }[] = [
  {
    value: "FULL",
    label: "Full Consent",
    emoji: "🌻",
    description:
      "My child's image and name may be used in all School materials, including website, social media, newsletters, print, and presentations.",
  },
  {
    value: "LIMITED",
    label: "Limited Consent",
    emoji: "🏡",
    description:
      "My child's image may be used in internal School materials only (e.g., newsletters sent to enrolled families). My child's image may NOT be used on public-facing platforms such as the website or social media.",
  },
  {
    value: "NO",
    label: "No Consent",
    emoji: "🙈",
    description:
      "I do not consent to any photography or video recording of my child for School use. My child will be excluded from group photos and media captures.",
  },
];

const labelFor = (v: ConsentLevel) => CONSENT_OPTIONS.find((o) => o.value === v)?.label ?? v;

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
  readOnlyPreview,
}: PhotoReleaseModalProps) {
  const { runSave } = usePortalFeedback(readOnlyPreview);
  const [localSigs, setLocalSigs] = useState<SignatureMap>(signatures);
  const [selectedConsent, setSelectedConsent] = useState<ConsentLevel | null>(existingConsent);
  const [savedConsent, setSavedConsent] = useState<ConsentLevel | null>(existingConsent);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollToSection(bodyRef);

  const dirty = !readOnly && selectedConsent !== savedConsent;
  const guard = useUnsavedGuard(dirty);
  const close = () => guard.confirm(onClose);

  const signedCount = [1, 2].filter((i) => !!localSigs[`${CONTRACT_5_ID}-${i}`]).length;
  const nextUnsigned = () => [1, 2].find((i) => !localSigs[`${CONTRACT_5_ID}-${i}`]);

  const handleSaveConsent = async () => {
    if (!selectedConsent) {
      setConsentError("Please select a consent level before saving.");
      return;
    }
    const level = selectedConsent;
    setConsentError(null);
    setSaving(true);
    const firstSave = !savedConsent;
    const out: { error: string | null } = { error: null };
    const ok = await runSave({
      successTitle: `Saved · ${labelFor(level)}`,
      successMessage: firstSave ? "You can now sign this section." : undefined,
      errorTitle: "Couldn't save your consent level",
      retry: () => void handleSaveConsent(),
      fn: async () => {
        const result = await savePhotoReleaseConsent({ studentId, consentLevel: level });
        if (result.error) {
          out.error = result.error;
          return { ok: false, error: result.error };
        }
        return { ok: true };
      },
    });
    setSaving(false);
    if (ok) {
      setSavedConsent(level);
      onConsentSaved(level);
    } else if (out.error) {
      setConsentError(out.error);
    }
  };

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    const updated = { ...localSigs, [`${CONTRACT_5_ID}-${sectionId}`]: sig };
    setLocalSigs(updated);
    onSectionSaved(sig);
    if (sectionId === 1 && !updated[`${CONTRACT_5_ID}-2`]) window.setTimeout(() => scrollTo("photo-sec-ack"), 250);
  };

  const textSections = CONTRACT_5_SECTIONS.filter((s) => s.id !== 5);
  const sec5 = CONTRACT_5_SECTIONS.find((s) => s.id === 5)!;
  const before = textSections.filter((s) => s.id < 5);
  const after = textSections.filter((s) => s.id > 5);
  const textStep = (s: (typeof CONTRACT_5_SECTIONS)[number]) => (
    <SheetStep key={s.id} n={s.id} title={stripNumber(s.title)}>
      <LegalText>
        {s.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LegalText>
    </SheetStep>
  );

  return (
    <>
      <GardenSheet
        open={open}
        onClose={close}
        size="wide"
        bodyRef={bodyRef}
        icon="📸"
        title="Photo, Video, and Media Release"
        note={`${studentName} · ${dirty ? "Unsaved changes" : signedLabel(signedCount, CONTRACT_5_TOTAL_SECTIONS)}`}
        footer={
          <SigningFooter
            total={CONTRACT_5_TOTAL_SECTIONS}
            signed={signedCount}
            readOnly={readOnly}
            onClose={close}
            save={dirty ? { label: savedConsent ? "Update selection" : "Save selection", busy: saving, onClick: () => void handleSaveConsent() } : null}
            onNext={() => {
              const n = nextUnsigned();
              scrollTo(n === 2 ? "photo-sec-ack" : "photo-sec-5");
            }}
          />
        }
      >
        <div className="flex flex-col gap-10 pt-2">
          {before.map(textStep)}

          <SheetStep n={5} title={stripNumber(sec5.title)} done={!!localSigs[`${CONTRACT_5_ID}-1`]} id="photo-sec-5">
            <LegalText>
              <p>{sec5.paragraphs[0]}</p>
            </LegalText>
            {readOnly ? (
              savedConsent ? (
                <NoteCard tone="mint">
                  <span className="font-extrabold text-[var(--sf-ink)]">Consent level: {labelFor(savedConsent)}</span>
                </NoteCard>
              ) : (
                <NoteCard>Not selected yet</NoteCard>
              )
            ) : (
              <>
                <RadioCardGroup<ConsentLevel>
                  legend={<span className="sr-only">Consent level</span>}
                  value={selectedConsent}
                  onChange={(v) => {
                    setSelectedConsent(v);
                    setConsentError(null);
                  }}
                  options={CONSENT_OPTIONS.map((o) => ({ value: o.value, title: o.label, emoji: o.emoji, description: o.description }))}
                />
                {consentError ? <InlineError>{consentError}</InlineError> : null}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveConsent()}
                    disabled={saving || !selectedConsent || !dirty}
                    aria-busy={saving || undefined}
                    className={btnSageSm}
                  >
                    {saving ? <Spinner /> : null}
                    {saving ? "Saving…" : savedConsent ? "Update selection" : "Save selection"}
                  </button>
                  <span className="text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
                    {dirty ? "Unsaved changes" : savedConsent ? `✓ Consent level saved: ${labelFor(savedConsent)}` : "Not saved yet"}
                  </span>
                </div>
              </>
            )}
            {!readOnly && !savedConsent ? (
              <LockedNote>Save your consent selection above before completing this section.</LockedNote>
            ) : (
              <SignatureBlock
                sectionId={1}
                contractId={CONTRACT_5_ID}
                studentId={studentId}
                parentName={parentName}
                existingSig={localSigs[`${CONTRACT_5_ID}-1`]}
                onSectionSaved={handleSectionSaved}
                readOnly={readOnly}
                readOnlyPreview={readOnlyPreview}
                label="Consent level"
              />
            )}
          </SheetStep>

          {after.map(textStep)}

          <SheetStep n={8} title="Parent/Guardian Acknowledgment" done={!!localSigs[`${CONTRACT_5_ID}-2`]} id="photo-sec-ack">
            <LegalText>
              <p>
                By signing below, I confirm that I have read and understood this Photo, Video, and Media Release in its entirety. I acknowledge
                my selected consent level for my child&apos;s participation in photography and video recording at Sage Field Academy. I
                understand that this consent may be revoked at any time in writing and that revocation applies to future use only.
              </p>
              <p>
                I enter this agreement freely and on behalf of my child, and I have the legal authority to grant or withhold consent as described
                herein.
              </p>
            </LegalText>
            <SignatureBlock
              sectionId={2}
              contractId={CONTRACT_5_ID}
              studentId={studentId}
              parentName={parentName}
              existingSig={localSigs[`${CONTRACT_5_ID}-2`]}
              onSectionSaved={handleSectionSaved}
              readOnly={readOnly}
              readOnlyPreview={readOnlyPreview}
              label="Parent/Guardian Acknowledgment"
            />
          </SheetStep>
        </div>
      </GardenSheet>
      {guard.dialog}
    </>
  );
}
