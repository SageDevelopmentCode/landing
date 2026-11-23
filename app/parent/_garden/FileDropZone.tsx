"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { FieldError, TrashIcon } from "./fields";
import { Skeleton } from "./states";
import { CheckIcon, Spinner } from "./ui";

export const UPLOAD_ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
export const UPLOAD_ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png,.webp,.heic";
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export type DropZoneFile = {
  /** Stable key (storage object name). */
  key: string;
  /** Name shown to the parent. */
  name: string;
};

/** Strip the upload timestamp prefix ("1710000000000-file.pdf" → "file.pdf"). */
export function displayFileName(name: string): string {
  return name.replace(/^\d+-/, "");
}

/**
 * Validate a picked batch against the slot limit, type list and size limit.
 * Returns the first problem as a parent-facing message, or null when the batch is fine.
 */
export function validateUploadBatch(
  picked: File[],
  existingCount: number,
  { maxFiles, acceptedTypes = UPLOAD_ACCEPTED_TYPES, maxBytes = UPLOAD_MAX_BYTES }: { maxFiles: number; acceptedTypes?: string[]; maxBytes?: number },
): string | null {
  if (existingCount + picked.length > maxFiles) {
    return `You can upload a maximum of ${maxFiles} files. You currently have ${existingCount}.`;
  }
  for (const f of picked) {
    if (!acceptedTypes.includes(f.type)) {
      return `"${f.name}" is not a supported file type. Please upload PDF, JPG, PNG, WEBP, or HEIC.`;
    }
    if (f.size > maxBytes) {
      return `"${f.name}" exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit.`;
    }
  }
  return null;
}

/**
 * Upload area + file list for sheets (immunization records, affidavits).
 * The parent component owns the network calls: `onFiles` receives a validated batch,
 * and `uploading` reports "n of N" progress back. Deleting asks first via ConfirmDialog.
 */
export default function FileDropZone({
  files,
  maxFiles,
  loading,
  uploading,
  deletingKey,
  error,
  readOnly,
  onFiles,
  onDelete,
  listLabel = "Uploaded files",
  emptyLabel = "No files uploaded yet",
  hint = "PDF, JPG, PNG, WEBP or HEIC · up to 10MB each",
  acceptedTypes,
  maxBytes,
}: {
  files: DropZoneFile[];
  maxFiles: number;
  loading?: boolean;
  /** Current upload progress, or null when idle. */
  uploading?: { current: number; total: number } | null;
  deletingKey?: string | null;
  /** Server / network error to show under the zone (validation errors are handled here). */
  error?: string | null;
  readOnly?: boolean;
  onFiles: (files: File[]) => void;
  onDelete?: (file: DropZoneFile) => void;
  listLabel?: string;
  emptyLabel?: string;
  hint?: string;
  acceptedTypes?: string[];
  maxBytes?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<DropZoneFile | null>(null);

  const full = files.length >= maxFiles;
  const busy = !!uploading;
  const shownError = localError ?? error ?? null;

  const take = (list: FileList | null) => {
    // Snapshot first: the input's FileList is live, so clearing the input empties it.
    const picked = list ? Array.from(list) : [];
    // Reset so picking the same file again (after an error) still fires onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (picked.length === 0 || busy) return;
    const problem = validateUploadBatch(picked, files.length, { maxFiles, acceptedTypes, maxBytes });
    setLocalError(problem);
    if (!problem) onFiles(picked);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    take(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-[var(--sf-ink)]">{listLabel}</p>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${
              full ? "bg-[var(--sf-coral)]/25 text-[var(--sf-coral-deep)]" : "bg-[var(--sf-ink)]/[0.06] text-[var(--sf-soft)]"
            }`}
          >
            {files.length} / {maxFiles}
            <span className="sr-only"> files{full ? ", limit reached" : ""}</span>
          </span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2" role="status">
            <span className="sr-only">Loading files…</span>
            <Skeleton className="h-14 w-full rounded-[18px]" />
            <Skeleton className="h-14 w-full rounded-[18px]" />
          </div>
        ) : files.length === 0 ? (
          <p className="rounded-[18px] bg-white/60 px-4 py-3 text-sm font-semibold italic text-[var(--sf-soft)]/80">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {files.map((f) => (
              <li key={f.key} className="flex min-w-0 items-center gap-3 rounded-[18px] bg-white px-3 py-2 ring-1 ring-[var(--sf-ink)]/[0.08]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" aria-hidden="true">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{f.name}</span>
                {!readOnly && onDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(f)}
                    disabled={!!deletingKey || busy}
                    aria-label={`Delete ${f.name}`}
                    aria-busy={deletingKey === f.key || undefined}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--sf-soft)] transition hover:bg-[var(--sf-coral)]/20 hover:text-[var(--sf-coral-deep)] focus-visible:text-[var(--sf-coral-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {deletingKey === f.key ? <Spinner /> : <TrashIcon />}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!readOnly && !full ? (
        <div>
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            aria-busy={busy || undefined}
            className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[24px] border-2 border-dashed px-5 py-6 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--sf-sky)] ${
              dragging
                ? "scale-[1.01] border-[var(--sf-sage)] bg-[var(--sf-mint)]/60"
                : "border-[var(--sf-ink)]/20 bg-white/70 hover:border-[var(--sf-sage)] hover:bg-[var(--sf-mint)]/30"
            } ${busy ? "pointer-events-none opacity-80" : ""}`}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              multiple
              accept={UPLOAD_ACCEPTED_EXT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => take(e.target.files)}
            />
            {busy ? (
              <>
                <Spinner className="h-6 w-6 text-[var(--sf-sage-deep)]" />
                <span className="text-[15px] font-extrabold" role="status">
                  Uploading {uploading!.current} of {uploading!.total}…
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl" aria-hidden="true">
                  {dragging ? "📥" : "📎"}
                </span>
                <span className="text-[15px] font-extrabold">{dragging ? "Drop to upload" : "Choose files or drag them here"}</span>
                <span className="text-xs font-semibold text-[var(--sf-soft)]">{hint}</span>
              </>
            )}
          </label>
        </div>
      ) : null}

      {!readOnly && full ? (
        <p className="text-sm font-bold text-[var(--sf-soft)]">You&apos;ve reached the {maxFiles}-file limit. Delete a file to add another.</p>
      ) : null}

      <div role="alert">
        <FieldError>{shownError}</FieldError>
      </div>

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming && onDelete) onDelete(confirming);
          setConfirming(null);
        }}
        title="Delete this file?"
        body={confirming ? <>“{confirming.name}” will be removed. You can upload it again later.</> : null}
        confirmLabel="Delete file"
      />
    </div>
  );
}
