"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Camera, Loader2 } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { uploadProfileImage } from "@/app/actions/uploadProfileImage";

interface ProfileDropdownProps {
  email: string;
  fullName: string | null;
  userId?: string;
  profileImageUrl?: string | null;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfileDropdown({
  email,
  fullName,
  userId,
  profileImageUrl,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    profileImageUrl ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProfileImage(formData);
    setUploading(false);
    if ("error" in result) {
      setUploadError(result.error);
    } else {
      setCurrentImageUrl(result.url);
    }
    e.target.value = "";
  }

  const displayInitials = fullName
    ? initialsFor(fullName)
    : email.charAt(0).toUpperCase();

  const canUpload = !!userId;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button — whole pill opens dropdown */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full cursor-pointer focus:outline-none"
        aria-label="Profile menu"
      >
        <span
          className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden flex-shrink-0 text-sm font-semibold"
          style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
        >
          {currentImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            displayInitials
          )}
        </span>
        {fullName && (
          <span className="text-sm font-medium text-gray-700 font-body">
            {fullName}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
      </button>

      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-sm z-50"
          >
            {/* Avatar edit area — only shown when upload is enabled */}
            {canUpload && (
              <>
                <div className="flex flex-col items-center pt-5 pb-4 px-4">
                  <div
                    className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer"
                    onMouseEnter={() => setAvatarHovered(true)}
                    onMouseLeave={() => setAvatarHovered(false)}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    {currentImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: "#d4e6d0" }}
                      >
                        <span className="text-xl font-semibold" style={{ color: "#4a7c59" }}>
                          {displayInitials}
                        </span>
                      </div>
                    )}

                    {(avatarHovered || uploading) && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-white" />
                        )}
                      </div>
                    )}
                  </div>

                  {fullName && (
                    <p className="mt-2 text-sm font-semibold text-gray-800 font-heading text-center">
                      {fullName}
                    </p>
                  )}

                  {uploadError && (
                    <p className="mt-1 text-xs text-red-500 font-body text-center">{uploadError}</p>
                  )}
                </div>
                <div className="border-t border-gray-100" />
              </>
            )}

            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-body mb-0.5">Signed in as</p>
              <p className="text-sm font-medium text-gray-800 font-body truncate">{email}</p>
            </div>
            <div className="border-t border-gray-100" />
            <div className="px-3 py-2">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 text-sm font-body text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
