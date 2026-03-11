"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, Trash2, FileText, CheckCircle, ShieldCheck } from "lucide-react";
import { uploadImmunizationRecord } from "@/app/actions/uploadImmunizationRecord";
import { listImmunizationRecords } from "@/app/actions/listImmunizationRecords";
import { deleteImmunizationRecord } from "@/app/actions/deleteImmunizationRecord";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png,.webp,.heic";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  studentId: string;
  studentName: string;
  onUploadComplete: (studentId: string) => void;
}

function formatFileName(name: string): string {
  // Strip timestamp prefix (e.g. "1710000000000-filename.pdf" -> "filename.pdf")
  return name.replace(/^\d+-/, "");
}

export default function ImmunizationUploadModal({
  isOpen,
  onClose,
  parentId,
  studentId,
  studentName,
  onUploadComplete,
}: Props) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    const result = await listImmunizationRecords(parentId, studentId);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setFiles((result.files as StorageFile[]).filter((f) => f.name !== ".emptyFolderPlaceholder"));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setError(null);

    const toUpload = Array.from(selectedFiles);

    if (files.length + toUpload.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} files. You currently have ${files.length}.`);
      return;
    }

    for (const f of toUpload) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported file type. Please upload PDF, JPG, PNG, WEBP, or HEIC.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`"${f.name}" exceeds the 10MB limit.`);
        return;
      }
    }

    setIsUploading(true);
    for (const f of toUpload) {
      const fd = new FormData();
      fd.append("parentId", parentId);
      fd.append("studentId", studentId);
      fd.append("file", f);

      let result: { path?: string; error?: string };
      try {
        result = await uploadImmunizationRecord(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(
          msg.toLowerCase().includes('body exceeded') || msg.includes('413')
            ? `"${f.name}" is too large to upload. Please keep files under 10MB.`
            : `Upload failed: ${msg}`
        );
        setIsUploading(false);
        return;
      }
      if ("error" in result && result.error) {
        setError(result.error);
        setIsUploading(false);
        return;
      }
    }
    setIsUploading(false);
    await loadFiles();
    startTransition(() => {
      onUploadComplete(studentId);
    });
  };

  const handleDelete = async (fileName: string) => {
    const path = `${parentId}/${studentId}/${fileName}`;
    setDeletingPath(path);
    setError(null);
    const result = await deleteImmunizationRecord(path, parentId);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      await loadFiles();
    }
    setDeletingPath(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-lg z-[70] bg-white flex flex-col shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold font-heading text-gray-800">
                    Proof of Immunizations
                  </h2>
                  <p className="text-xs text-gray-400 font-body">{studentName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
              {/* Info */}
              <p className="text-sm text-gray-500 font-body">
                Upload your child&apos;s current immunization records. If your child has no current immunization record, you may instead upload a notarized religious exemption affidavit. Accepted formats: PDF, JPG, PNG, WEBP, HEIC. Max 10MB per file.
              </p>

              {/* File count */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 font-body">
                  Uploaded files
                </p>
                <span
                  className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${
                    files.length >= MAX_FILES
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {files.length} / {MAX_FILES}
                </span>
              </div>

              {/* File list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-sm text-gray-400 font-body text-center py-4">
                  No files uploaded yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {files.map((file) => {
                    const filePath = `${parentId}/${studentId}/${file.name}`;
                    const isDeleting = deletingPath === filePath;
                    return (
                      <div
                        key={file.id ?? file.name}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                      >
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="flex-1 text-sm font-body text-gray-700 truncate">
                          {formatFileName(file.name)}
                        </p>
                        <button
                          onClick={() => handleDelete(file.name)}
                          disabled={isDeleting}
                          className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload zone */}
              {files.length < MAX_FILES && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl px-6 py-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                    isDragging
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-green-50/30"
                  }`}
                >
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 font-heading">
                      {isUploading ? "Uploading..." : "Click or drag to upload"}
                    </p>
                    <p className="text-xs text-gray-400 font-body mt-0.5">
                      PDF, JPG, PNG, WEBP, HEIC — up to 10MB each
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_EXT}
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 font-body bg-red-50 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              {files.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-body text-emerald-700">
                    {files.length === 1
                      ? "1 file uploaded successfully."
                      : `${files.length} files uploaded successfully.`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold font-heading hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
