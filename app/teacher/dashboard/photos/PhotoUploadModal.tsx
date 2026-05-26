"use client";

import { useState, useRef, useTransition } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2, ImagePlus } from "lucide-react";
import { uploadPhoto } from "@/app/actions/photos";
import type { TeacherPhoto } from "@/app/actions/photos";

interface Props {
  onClose: () => void;
  onUploaded: (photos: TeacherPhoto[]) => void;
}

type CompressedFile = {
  file: File;
  previewUrl: string;
};

export default function PhotoUploadModal({ onClose, onUploaded }: Props) {
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState(new Date().toISOString().split("T")[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    if (!files.length) return;
    setIsCompressing(true);
    setError(null);

    try {
      const results = await Promise.all(
        Array.from(files).map(async (rawFile) => {
          let fileToCompress: File = rawFile;

          if (rawFile.type === "image/heic" || rawFile.name.toLowerCase().endsWith(".heic")) {
            const heic2any = (await import("heic2any")).default;
            const converted = await heic2any({ blob: rawFile, toType: "image/jpeg", quality: 0.9 });
            fileToCompress = new File(
              [converted as Blob],
              rawFile.name.replace(/\.heic$/i, ".jpg"),
              { type: "image/jpeg" }
            );
          }

          const imageCompression = (await import("browser-image-compression")).default;
          const compressed = await imageCompression(fileToCompress, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 2048,
            useWebWorker: true,
            fileType: "image/webp",
          });

          return { file: compressed, previewUrl: URL.createObjectURL(compressed) } as CompressedFile;
        })
      );
      setCompressedFiles((prev) => [...prev, ...results]);
    } catch {
      setError("Failed to process one or more images.");
    } finally {
      setIsCompressing(false);
    }
  }

  function removeFile(idx: number) {
    setCompressedFiles((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function handleUpload() {
    if (!compressedFiles.length) return;
    setError(null);

    startTransition(async () => {
      const results = await Promise.all(
        compressedFiles.map(async ({ file }) => {
          const fd = new FormData();
          fd.append("file", file);
          if (caption.trim()) fd.append("caption", caption.trim());
          if (takenOn) fd.append("taken_on", takenOn);
          return uploadPhoto(fd);
        })
      );

      const failed = results.filter((r) => r.error);
      if (failed.length) {
        setError(failed[0].error ?? `${failed.length} photo${failed.length > 1 ? "s" : ""} failed to upload.`);
        return;
      }

      const uploaded = results.map((r) => r.data!).filter(Boolean);
      compressedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      onUploaded(uploaded);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="bg-white w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold font-body text-gray-900">Upload Photos</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
              isDraggingOver
                ? "border-[#4a7c59] bg-[#4a7c59]/5"
                : "border-gray-200 hover:border-[#4a7c59]/50 hover:bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-6 h-6 text-[#4a7c59] animate-spin" />
                <p className="text-sm text-gray-500 font-body">Processing images…</p>
              </>
            ) : (
              <>
                <ImagePlus className={`w-6 h-6 ${isDraggingOver ? "text-[#4a7c59]" : "text-gray-400"}`} />
                <p className="text-sm text-gray-500 font-body">
                  <span className="text-[#4a7c59] font-medium">Click or drag</span> photos here
                </p>
                <p className="text-xs text-gray-400 font-body">JPEG, PNG, WebP, HEIC — multiple allowed</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* Thumbnail strip */}
          {compressedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {compressedFiles.map((cf, idx) => (
                <div
                  key={idx}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                >
                  <img src={cf.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#4a7c59]/50 hover:text-[#4a7c59] transition-colors flex-shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-medium text-gray-500 font-body mb-1.5">
              Caption <span className="text-gray-400">(optional, applies to all)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption…"
              rows={2}
              className="w-full text-sm font-body text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 font-body mb-1.5">
              Date taken
            </label>
            <input
              type="date"
              value={takenOn}
              onChange={(e) => setTakenOn(e.target.value)}
              className="w-full text-sm font-body text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] transition-colors"
            />
          </div>

          <p className="text-xs text-gray-400 font-body">
            You can tag students after uploading using the edit button on each photo.
          </p>

          {error && <p className="text-sm text-red-500 font-body">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleUpload}
            disabled={!compressedFiles.length || isPending || isCompressing}
            className="w-full py-2.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {compressedFiles.length > 1 ? `Upload ${compressedFiles.length} Photos` : "Upload Photo"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
