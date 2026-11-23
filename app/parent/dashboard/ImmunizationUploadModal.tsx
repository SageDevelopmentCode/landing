"use client";

import { useCallback, useEffect, useState } from "react";
import { uploadImmunizationRecord } from "@/app/actions/uploadImmunizationRecord";
import { listImmunizationRecords } from "@/app/actions/listImmunizationRecords";
import { deleteImmunizationRecord } from "@/app/actions/deleteImmunizationRecord";
import GardenSheet from "@/app/parent/_garden/sheet";
import FileDropZone, { displayFileName, type DropZoneFile } from "@/app/parent/_garden/FileDropZone";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { ErrorCard } from "@/app/parent/_garden/states";
import { SavedNote } from "@/app/parent/_garden/fields";
import { btnGhostSm, btnSheetPrimary } from "@/app/parent/_garden/ui";
import { LegalText } from "./garden/sheetParts";

const MAX_FILES = 5;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  studentId: string;
  studentName: string;
  onUploadComplete: (studentId: string) => void;
  /** Called with the real file count every time the list reloads (uploads and deletes). */
  onFilesChanged?: (studentId: string, count: number) => void;
  readOnly?: boolean;
  readOnlyPreview?: boolean;
}

type StorageFile = { name: string; id: string | null };

export default function ImmunizationUploadModal({
  isOpen,
  onClose,
  parentId,
  studentId,
  studentName,
  onUploadComplete,
  onFilesChanged,
  readOnly,
  readOnlyPreview,
}: Props) {
  const { toast, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ current: number; total: number } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listImmunizationRecords(parentId, studentId);
      if ("error" in result && result.error) {
        setLoadError(result.error);
      } else {
        const list = (result.files as StorageFile[]).filter((f) => f.name !== ".emptyFolderPlaceholder");
        setFiles(list);
        onFilesChanged?.(studentId, list.length);
      }
    } catch {
      setLoadError("We couldn't load your files.");
    }
    setLoading(false);
  }, [parentId, studentId, onFilesChanged]);

  useEffect(() => {
    if (!isOpen) return;
    // Loading on open; setState happens after the awaited request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFiles();
    // Only reload when the sheet opens or the child changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, studentId]);

  const handleFiles = async (picked: File[]) => {
    if (blockedByPreview()) return;
    setError(null);
    let uploaded = 0;
    for (const [i, f] of picked.entries()) {
      setUploading({ current: i + 1, total: picked.length });
      const fd = new FormData();
      fd.append("parentId", parentId);
      fd.append("studentId", studentId);
      fd.append("file", f);
      let result: { path?: string; error?: string };
      try {
        result = await uploadImmunizationRecord(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result = {
          error:
            msg.toLowerCase().includes("body exceeded") || msg.includes("413")
              ? `"${f.name}" is too large to upload. Please keep files under 10MB.`
              : `Upload failed: ${msg}`,
        };
      }
      if (result.error) {
        setError(result.error);
        toast.show({ tone: "error", title: "Upload failed", message: result.error });
        break;
      }
      uploaded++;
    }
    setUploading(null);
    if (uploaded > 0) {
      toast.show({ tone: "success", title: uploaded === 1 ? "File uploaded" : `${uploaded} files uploaded`, message: studentName });
      await loadFiles();
      onUploadComplete(studentId);
    }
  };

  const handleDelete = async (file: DropZoneFile) => {
    if (blockedByPreview()) return;
    const path = `${parentId}/${studentId}/${file.key}`;
    setDeletingKey(file.key);
    setError(null);
    try {
      const result = await deleteImmunizationRecord(path, parentId);
      if ("error" in result && result.error) {
        setError(result.error);
        toast.show({ tone: "error", title: "Couldn't delete the file", message: result.error });
      } else {
        toast.show({ tone: "success", title: "File deleted", message: file.name });
        await loadFiles();
      }
    } catch {
      toast.show({ tone: "error", title: "Couldn't delete the file", message: "Please check your connection and try again." });
    }
    setDeletingKey(null);
  };

  const dropFiles: DropZoneFile[] = files.map((f) => ({ key: f.name, name: displayFileName(f.name) }));
  const busy = !!uploading || !!deletingKey;

  return (
    <GardenSheet
      open={isOpen}
      onClose={onClose}
      icon="🛡️"
      title="Proof of Immunizations"
      note={studentName}
      footer={
        <div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={files.length > 0 || readOnly ? btnSheetPrimary : `${btnGhostSm} w-full min-h-[52px] text-base`}
          >
            Done
          </button>
          <p className="mt-2 text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
            {files.length > 0 ? `✓ ${files.length} of ${MAX_FILES} files uploaded` : "No files uploaded yet"}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <LegalText>
          <p>
            Upload your child&apos;s current immunization records. If your child has no current immunization record, you may instead upload a
            notarized religious exemption affidavit. Accepted formats: PDF, JPG, PNG, WEBP, HEIC. Max 10MB per file.
          </p>
        </LegalText>
        {loadError && !loading ? (
          <ErrorCard title="We couldn't load your files" body={loadError} onRetry={() => void loadFiles()} />
        ) : (
          <FileDropZone
            files={dropFiles}
            maxFiles={MAX_FILES}
            loading={loading}
            uploading={uploading}
            deletingKey={deletingKey}
            error={error}
            readOnly={readOnly}
            onFiles={(picked) => void handleFiles(picked)}
            onDelete={(f) => void handleDelete(f)}
          />
        )}
        {files.length > 0 && !loading ? (
          <SavedNote>{files.length === 1 ? "1 file uploaded successfully." : `${files.length} files uploaded successfully.`}</SavedNote>
        ) : null}
      </div>
    </GardenSheet>
  );
}
