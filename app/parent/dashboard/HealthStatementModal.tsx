"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, Trash2, FileText, Download, Mail } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import type { EnrollmentSignature } from "@/app/types/enrollment-signatures";
import { CONTRACT_8_ID } from "@/app/types/enrollment-signatures";
import SectionSignatureBlock from "./SectionSignatureBlock";
import { saveHealthStatement } from "@/app/actions/saveHealthStatement";
import { uploadReligiousExemption } from "@/app/actions/uploadReligiousExemption";
import { deleteReligiousExemption } from "@/app/actions/deleteReligiousExemption";
import { listReligiousExemptions } from "@/app/actions/listReligiousExemptions";
import type { Database } from "@/app/types/database.types";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

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
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png,.webp,.heic";

function formatFileName(name: string): string {
  return name.replace(/^\d+-/, "");
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-semibold font-body text-gray-500 w-36 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm font-body text-gray-800">{value}</span>
    </div>
  );
}

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
}: HealthStatementModalProps) {
  const studentId = app.student_id ?? "";
  const studentName = app.preferred_name ?? app.child_legal_name ?? "Student";
  const dob =
    app.dob_month && app.dob_day && app.dob_year
      ? `${app.dob_month}/${app.dob_day}/${app.dob_year}`
      : "—";

  const [selectedOption, setSelectedOption] = useState<"professional" | "religious" | null>(
    (existingStatement?.option_type as "professional" | "religious") ?? null
  );
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [religiousExemptionCount, setReligiousExemptionCount] = useState(initialReligiousExemptionCount);
  const [uploadedFiles, setUploadedFiles] = useState<StorageFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localSig, setLocalSig] = useState<EnrollmentSignature | undefined>(existingSig);
  const [, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedFiles = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const loadFiles = async () => {
    if (!studentId) return;
    setIsLoadingFiles(true);
    const result = await listReligiousExemptions(parentId, studentId);
    if ("files" in result) {
      const files = (result.files as StorageFile[]).filter((f) => f.name !== ".emptyFolderPlaceholder");
      setUploadedFiles(files);
      setReligiousExemptionCount(files.length);
    }
    setIsLoadingFiles(false);
  };

  useEffect(() => {
    if (selectedOption === "religious" && !hasFetchedFiles.current) {
      hasFetchedFiles.current = true;
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption]);

  const handleOptionChange = async (option: "professional" | "religious") => {
    setSelectedOption(option);
    startTransition(async () => {
      await saveHealthStatement(studentId, option);
    });
  };

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploadError(null);

    const toUpload = Array.from(selectedFiles);

    if (uploadedFiles.length + toUpload.length > MAX_FILES) {
      setUploadError(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const f of toUpload) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setUploadError(`"${f.name}" is not a supported file type.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setUploadError(`"${f.name}" exceeds the 10MB limit.`);
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
        result = await uploadReligiousExemption(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setUploadError(`Upload failed: ${msg}`);
        setIsUploading(false);
        return;
      }
      if ("error" in result && result.error) {
        setUploadError(result.error);
        setIsUploading(false);
        return;
      }
    }
    setIsUploading(false);
    await loadFiles();
  };

  const handleDelete = async (fileName: string) => {
    const path = `${parentId}/${studentId}/${fileName}`;
    setDeletingPath(path);
    setUploadError(null);
    const result = await deleteReligiousExemption(path, parentId);
    if ("error" in result && result.error) {
      setUploadError(result.error);
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

  const handleSectionSaved = (sectionId: number, sig: EnrollmentSignature) => {
    setLocalSig(sig);
    onSectionSaved(sig);
    // sectionId is always 1 for this contract
    void sectionId;
  };

  const sigEnabled =
    (selectedOption === "professional" && hasDownloaded) ||
    (selectedOption === "religious" && religiousExemptionCount > 0);

  return (
    <AnimatePresence>
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
          className="fixed inset-y-0 right-0 w-full max-w-lg z-[70] bg-white flex flex-col shadow-2xl"
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
                Health Information Form
              </h2>
              <p className="text-xs text-gray-400 font-body mt-0.5">{studentName}</p>
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
            <div className="flex flex-col gap-8">
              {/* Pre-filled info */}
              <div className="flex flex-col gap-3 bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                <InfoRow label="Name of Child" value={app.child_legal_name ?? "—"} />
                <InfoRow label="Date of Birth" value={dob} />
              </div>

              {/* Option selection */}
              {readOnly ? (
                selectedOption && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-sm font-semibold font-body text-gray-700">
                      {selectedOption === "professional"
                        ? "Option A: Health Care Professional Examination"
                        : "Option B: Religious Exemption Affidavit"}
                    </span>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold font-heading text-gray-800">
                    Select one of the following:
                  </p>
                  <label
                    className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-colors ${
                      selectedOption === "professional"
                        ? "border-teal-500 bg-teal-50/60"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="health-option"
                      value="professional"
                      checked={selectedOption === "professional"}
                      onChange={() => handleOptionChange("professional")}
                      className="accent-teal-600 cursor-pointer flex-shrink-0"
                    />
                    <span className="flex-1 text-sm font-body text-gray-700">
                      <span className="font-semibold">Option A:</span> My child has been examined by a health care professional within the past year
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-colors ${
                      selectedOption === "religious"
                        ? "border-purple-400 bg-purple-50/40"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="health-option"
                      value="religious"
                      checked={selectedOption === "religious"}
                      onChange={() => handleOptionChange("religious")}
                      className="accent-teal-600 cursor-pointer flex-shrink-0"
                    />
                    <span className="flex-1 text-sm font-body text-gray-700">
                      <span className="font-semibold">Option B:</span> Religious exemption — I object to physical examination of my child on religious grounds
                    </span>
                  </label>
                </div>
              )}

              {/* Option A section */}
              {selectedOption === "professional" && (
                <div className="flex flex-col gap-4 p-4 rounded-xl border border-teal-100 bg-teal-50/40">
                  <p className="text-sm font-semibold font-heading text-gray-800">
                    Option A: Health Care Professional Examination
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I hereby certify that my child, {app.child_legal_name ?? studentName}, has been examined by a licensed health care professional within the past year and is in satisfactory health to attend school. By signing below, I agree to have the Health Care Statement form signed by my child&apos;s health care professional and email the completed form to sabrina@sagefield.co within the current school year.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="/sage-field-health-care-statement.pdf"
                      download
                      onClick={() => setHasDownloaded(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold font-heading hover:bg-teal-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Health Care Statement
                    </a>
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                      <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 font-body">
                        After your health care professional signs it, email it to{" "}
                        <a
                          href="mailto:sabrina@sagefield.co"
                          className="font-semibold underline hover:text-amber-900"
                        >
                          sabrina@sagefield.co
                        </a>
                      </p>
                    </div>
                    {hasDownloaded && (
                      <p className="text-xs text-teal-700 font-body font-semibold">
                        ✓ PDF downloaded — you may sign below. Please email the completed form to sabrina@sagefield.co within the school year.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Option B section */}
              {selectedOption === "religious" && (
                <div className="flex flex-col gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/30">
                  <p className="text-sm font-semibold font-heading text-gray-800">
                    Option B: Religious Exemption Affidavit
                  </p>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    I object to the physical examination of my child on religious grounds. I understand that I must provide a signed, dated, and <span className="font-semibold text-gray-800">notarized</span> affidavit stating my religious objection to such examination. This affidavit must be uploaded below and will be kept on file with Sage Field Private School.
                  </p>

                  {/* File count */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 font-body">Uploaded affidavits</p>
                    <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${
                      uploadedFiles.length >= MAX_FILES ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {uploadedFiles.length} / {MAX_FILES}
                    </span>
                  </div>

                  {/* File list */}
                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : uploadedFiles.length === 0 ? (
                    <p className="text-sm text-gray-400 font-body text-center py-2">
                      No affidavits uploaded yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {uploadedFiles.map((file) => {
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
                            {!readOnly && (
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload zone */}
                  {!readOnly && uploadedFiles.length < MAX_FILES && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                        isDragging
                          ? "border-purple-400 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                      }`}
                    >
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400" />
                      )}
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-600 font-heading">
                          {isUploading ? "Uploading..." : "Click or drag to upload affidavit"}
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

                  {uploadError && (
                    <p className="text-sm text-red-500 font-body bg-red-50 rounded-xl px-4 py-3">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* Signature section */}
              {selectedOption !== null && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold font-heading text-gray-800 pb-2 border-b border-gray-100">
                    Parent / Guardian Signature
                  </h3>
                  <p className="text-sm text-gray-600 font-body leading-relaxed">
                    By signing below, I certify that the information provided is accurate and complete to the best of my knowledge, and I authorize Sage Field Private School to maintain this health information on file for my child.
                  </p>
                  {readOnly ? (
                    <SectionSignatureBlock
                      sectionId={1}
                      contractId={CONTRACT_8_ID}
                      studentId={studentId}
                      parentName={parentName}
                      existingSig={localSig}
                      onSectionSaved={handleSectionSaved}
                      readOnly
                    />
                  ) : sigEnabled ? (
                    <SectionSignatureBlock
                      sectionId={1}
                      contractId={CONTRACT_8_ID}
                      studentId={studentId}
                      parentName={parentName}
                      existingSig={localSig}
                      onSectionSaved={handleSectionSaved}
                    />
                  ) : (
                    <div className="mt-4 border border-gray-200 rounded-xl px-4 py-4 bg-gray-50 text-center">
                      <p className="text-sm text-gray-400 font-body">
                        {selectedOption === "professional"
                          ? "Download the Health Care Statement above to enable signing."
                          : "Upload your signed affidavit above to enable signing."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
