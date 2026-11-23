"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_8_ID, CONTRACT_8_TOTAL_SECTIONS } from "@/app/types/enrollment-signatures";
import { saveHealthStatement } from "@/app/actions/saveHealthStatement";
import { uploadReligiousExemption } from "@/app/actions/uploadReligiousExemption";
import { deleteReligiousExemption } from "@/app/actions/deleteReligiousExemption";
import { listReligiousExemptions } from "@/app/actions/listReligiousExemptions";
import type { Database } from "@/app/types/database.types";
import GardenSheet from "./garden/EnrollmentSheet";
import SignatureBlock from "@/app/parent/_garden/SignatureBlock";
import FileDropZone, { displayFileName, type DropZoneFile } from "@/app/parent/_garden/FileDropZone";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { ErrorCard } from "@/app/parent/_garden/states";
import { LockedNote, RadioCardGroup, SavedNote } from "@/app/parent/_garden/fields";
import { btnInkSm } from "@/app/parent/_garden/ui";
import { FactsCard, LegalText, NoteCard, SheetStep, SigningFooter, signedLabel } from "./garden/sheetParts";

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];
type HealthOption = "professional" | "religious";
type StorageFile = { name: string; id: string | null };

interface HealthStatementModalProps {
  app: Application;
  parentId: string;
  parentName: string;
  existingStatement: { option_type: string } | null;
  initialReligiousExemptionCount: number;
  existingSig: EnrollmentSignature | undefined;
  onSectionSaved: (sig: EnrollmentSignature) => void;
  onClose: () => void;
  readOnly?: boolean;
  /** Defaults to open: callers mount this sheet only while it's showing. */
  isOpen?: boolean;
  readOnlyPreview?: boolean;
  /** Fires after Option A / B is saved on the server. */
  onStatementSaved?: (option: HealthOption) => void;
  /** Fires with the real affidavit count after each reload. */
  onExemptionCountChange?: (count: number) => void;
}

const MAX_FILES = 3;

const OPTION_LABEL: Record<HealthOption, string> = {
  professional: "Option A: Health Care Professional Examination",
  religious: "Option B: Religious Exemption Affidavit",
};

export default function HealthStatementModal({
  app,
  parentId,
  parentName,
  existingStatement,
  initialReligiousExemptionCount,
  existingSig,
  onSectionSaved,
  onClose,
  readOnly,
  isOpen = true,
  readOnlyPreview,
  onStatementSaved,
  onExemptionCountChange,
}: HealthStatementModalProps) {
  const { toast, runSave, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const studentId = app.student_id ?? "";
  const studentName = app.preferred_name ?? app.child_legal_name ?? "Student";
  const dob = app.dob_month && app.dob_day && app.dob_year ? `${app.dob_month}/${app.dob_day}/${app.dob_year}` : "—";

  const [selectedOption, setSelectedOption] = useState<HealthOption | null>((existingStatement?.option_type as HealthOption) ?? null);
  const [savingOption, setSavingOption] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [religiousExemptionCount, setReligiousExemptionCount] = useState(initialReligiousExemptionCount);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ current: number; total: number } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localSig, setLocalSig] = useState<EnrollmentSignature | undefined>(existingSig);

  const loadFiles = useCallback(async () => {
    if (!studentId) return;
    setLoadingFiles(true);
    setLoadError(null);
    try {
      const result = await listReligiousExemptions(parentId, studentId);
      if ("files" in result && !("error" in result && result.error)) {
        const list = (result.files as StorageFile[]).filter((f) => f.name !== ".emptyFolderPlaceholder");
        setFiles(list);
        setReligiousExemptionCount(list.length);
        onExemptionCountChange?.(list.length);
      } else {
        setLoadError(("error" in result && result.error) || "We couldn't load your affidavits.");
      }
    } catch {
      setLoadError("We couldn't load your affidavits.");
    }
    setFilesLoaded(true);
    setLoadingFiles(false);
  }, [parentId, studentId, onExemptionCountChange]);

  useEffect(() => {
    if (isOpen && selectedOption === "religious" && !filesLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadFiles();
    }
  }, [isOpen, selectedOption, filesLoaded, loadFiles]);

  const handleOptionChange = async (option: HealthOption) => {
    if (option === selectedOption || savingOption) return;
    if (blockedByPreview()) return;
    const previous = selectedOption;
    setSelectedOption(option);
    setSavingOption(true);
    const ok = await runSave({
      successTitle: option === "professional" ? "Saved · Option A" : "Saved · Option B",
      errorTitle: "Couldn't save your choice",
      retry: () => void handleOptionChange(option),
      fn: async () => {
        const result = await saveHealthStatement(studentId, option);
        return result.error ? { ok: false, error: result.error } : { ok: true };
      },
    });
    setSavingOption(false);
    if (ok) onStatementSaved?.(option);
    else setSelectedOption(previous);
  };

  const handleFiles = async (picked: File[]) => {
    if (blockedByPreview()) return;
    setUploadError(null);
    let uploaded = 0;
    for (const [i, f] of picked.entries()) {
      setUploading({ current: i + 1, total: picked.length });
      const fd = new FormData();
      fd.append("parentId", parentId);
      fd.append("studentId", studentId);
      fd.append("file", f);
      let result: { path?: string; error?: string };
      try {
        result = await uploadReligiousExemption(fd);
      } catch (err) {
        result = { error: `Upload failed: ${err instanceof Error ? err.message : String(err)}` };
      }
      if (result.error) {
        setUploadError(result.error);
        toast.show({ tone: "error", title: "Upload failed", message: result.error });
        break;
      }
      uploaded++;
    }
    setUploading(null);
    if (uploaded > 0) {
      toast.show({ tone: "success", title: uploaded === 1 ? "Affidavit uploaded" : `${uploaded} affidavits uploaded`, message: studentName });
      await loadFiles();
    }
  };

  const handleDelete = async (file: DropZoneFile) => {
    if (blockedByPreview()) return;
    setDeletingKey(file.key);
    setUploadError(null);
    try {
      const result = await deleteReligiousExemption(`${parentId}/${studentId}/${file.key}`, parentId);
      if ("error" in result && result.error) {
        setUploadError(result.error);
        toast.show({ tone: "error", title: "Couldn't delete the affidavit", message: result.error });
      } else {
        toast.show({ tone: "success", title: "Affidavit deleted", message: file.name });
        await loadFiles();
      }
    } catch {
      toast.show({ tone: "error", title: "Couldn't delete the affidavit", message: "Please check your connection and try again." });
    }
    setDeletingKey(null);
  };

  const handleSectionSaved = (_sectionId: number, sig: EnrollmentSignature) => {
    setLocalSig(sig);
    onSectionSaved(sig);
  };

  // An existing 8-1 signature always shows, even though the download flag isn't stored (B7).
  const sigEnabled =
    !!localSig ||
    (selectedOption === "professional" && hasDownloaded) ||
    (selectedOption === "religious" && religiousExemptionCount > 0);
  const signedCount = localSig ? 1 : 0;
  const dropFiles: DropZoneFile[] = files.map((f) => ({ key: f.name, name: displayFileName(f.name) }));

  return (
    <GardenSheet
      open={isOpen}
      onClose={onClose}
      icon="📋"
      title="Health Information Form"
      note={`${studentName} · ${signedLabel(signedCount, CONTRACT_8_TOTAL_SECTIONS)}`}
      footer={<SigningFooter total={CONTRACT_8_TOTAL_SECTIONS} signed={signedCount} readOnly={readOnly} onClose={onClose} />}
    >
      <div className="flex flex-col gap-10 pt-2">
        <FactsCard
          rows={[
            { label: "Name of Child", value: app.child_legal_name ?? "—" },
            { label: "Date of Birth", value: dob },
          ]}
        />

        <SheetStep n={1} title="Select one of the following:" done={!!selectedOption}>
          {readOnly ? (
            selectedOption ? (
              <NoteCard tone="mint">
                <span className="font-extrabold text-[var(--sf-ink)]">{OPTION_LABEL[selectedOption]}</span>
              </NoteCard>
            ) : (
              <NoteCard>Not selected yet</NoteCard>
            )
          ) : (
            <>
              <RadioCardGroup<HealthOption>
                legend={<span className="sr-only">Health information option</span>}
                value={selectedOption}
                onChange={(v) => v && void handleOptionChange(v)}
                disabled={savingOption}
                options={[
                  {
                    value: "professional",
                    emoji: "🩺",
                    title: "Option A",
                    description: "My child has been examined by a health care professional within the past year",
                  },
                  {
                    value: "religious",
                    emoji: "🕊️",
                    title: "Option B",
                    description: "Religious exemption — I object to physical examination of my child on religious grounds",
                  },
                ]}
              />
              <p className="text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
                {savingOption ? "Saving your choice…" : selectedOption ? "✓ Choice saved" : "Not selected yet"}
              </p>
            </>
          )}
        </SheetStep>

        {selectedOption === "professional" ? (
          <SheetStep n={2} title="Option A: Health Care Professional Examination" done={hasDownloaded || !!localSig}>
            <LegalText>
              <p>
                I hereby certify that my child, {app.child_legal_name ?? studentName}, has been examined by a licensed health care professional
                within the past year and is in satisfactory health to attend school. By signing below, I agree to have the Health Care Statement
                form signed by my child&apos;s health care professional and email the completed form to sabrina@sagefield.co within the current
                school year.
              </p>
            </LegalText>
            <a href="/sage-field-health-care-statement.pdf" download onClick={() => setHasDownloaded(true)} className={`${btnInkSm} self-start`}>
              <span aria-hidden="true">⬇️</span> Download Health Care Statement
            </a>
            <NoteCard tone="butter">
              After your health care professional signs it, email it to{" "}
              <a href="mailto:sabrina@sagefield.co" className="font-extrabold text-[var(--sf-ink)] underline underline-offset-2">
                sabrina@sagefield.co
              </a>{" "}
              by the end of the school year.
            </NoteCard>
            {hasDownloaded ? (
              <SavedNote>PDF downloaded — you may sign below. Please email the completed form to sabrina@sagefield.co within the school year.</SavedNote>
            ) : null}
          </SheetStep>
        ) : null}

        {selectedOption === "religious" ? (
          <SheetStep n={2} title="Option B: Religious Exemption Affidavit" done={religiousExemptionCount > 0}>
            <LegalText>
              <p>
                I object to the physical examination of my child on religious grounds. I understand that I must provide a signed, dated, and{" "}
                <span className="font-extrabold text-[var(--sf-ink)]">notarized</span> affidavit stating my religious objection to such
                examination. This affidavit must be uploaded below and will be kept on file with Sage Field Private School.
              </p>
            </LegalText>
            {loadError && !loadingFiles ? (
              <ErrorCard title="We couldn't load your affidavits" body={loadError} onRetry={() => void loadFiles()} />
            ) : (
              <FileDropZone
                files={dropFiles}
                maxFiles={MAX_FILES}
                loading={loadingFiles || !filesLoaded}
                uploading={uploading}
                deletingKey={deletingKey}
                error={uploadError}
                readOnly={readOnly}
                onFiles={(picked) => void handleFiles(picked)}
                onDelete={(f) => void handleDelete(f)}
                listLabel="Uploaded affidavits"
                emptyLabel="No affidavits uploaded yet."
              />
            )}
          </SheetStep>
        ) : null}

        {selectedOption !== null || localSig ? (
          <SheetStep n={3} title="Parent / Guardian Signature" done={!!localSig}>
            <LegalText>
              <p>
                By signing below, I certify that the information provided is accurate and complete to the best of my knowledge, and I authorize
                Sage Field Private School to maintain this health information on file for my child.
              </p>
            </LegalText>
            {readOnly || sigEnabled ? (
              <SignatureBlock
                sectionId={1}
                contractId={CONTRACT_8_ID}
                studentId={studentId}
                parentName={parentName}
                existingSig={localSig}
                onSectionSaved={handleSectionSaved}
                readOnly={readOnly}
                readOnlyPreview={readOnlyPreview}
                label="Health Information Form"
              />
            ) : (
              <LockedNote>
                {selectedOption === "professional"
                  ? "Download the Health Care Statement above to enable signing."
                  : "Upload your signed affidavit above to enable signing."}
              </LockedNote>
            )}
          </SheetStep>
        ) : null}
      </div>
    </GardenSheet>
  );
}
