"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  Tag,
  Upload,
  Check,
  Newspaper,
  Share2,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PhotoUploadModal from "./PhotoUploadModal";
import { setPhotoTags, deletePhoto, updatePhotoMeta } from "@/app/actions/photos";
import type { TeacherPhoto, StudentWithConsent, ConsentLevel } from "@/app/actions/photos";

// ─── Publication Labels ───────────────────────────────────────────────────────

const PUBLICATION_LABELS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "newsletter",   label: "Newsletter",   icon: Newspaper },
  { id: "social_media", label: "Social Media", icon: Share2 },
  { id: "website",      label: "Website",      icon: Globe },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function ConsentBadge({ level }: { level: ConsentLevel | null }) {
  if (!level || level === "FULL") return null;
  if (level === "LIMITED")
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600 font-body whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
        Limited
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-red-500 font-body whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
      No consent
    </span>
  );
}

// ─── Student Tag Sidebar ──────────────────────────────────────────────────────

function StudentTagSidebar({
  students,
  selected,
  onChange,
  onClose,
}: {
  students: StudentWithConsent[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = students.filter((s) =>
    (s.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[59] bg-black/20"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-[60] w-full sm:w-80 bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold font-body text-gray-900">Tag Students</h3>
            {selected.length > 0 && (
              <span className="text-xs font-body text-[#4a7c59] bg-[#4a7c59]/10 px-2 py-0.5 rounded-full">
                {selected.length} selected
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm font-body text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 font-body text-center">No students found</p>
          ) : (
            filtered.map((s) => {
              const isSelected = selected.includes(s.student_id);
              return (
                <button
                  key={s.student_id}
                  onClick={() => toggle(s.student_id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 ${
                    isSelected ? "bg-[#4a7c59]/5" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-[#4a7c59] border-[#4a7c59]" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {s.profile_image_url ? (
                    <img src={s.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#4a7c59]/15 flex items-center justify-center text-xs font-bold text-[#4a7c59] flex-shrink-0">
                      {getInitials(s.name)}
                    </div>
                  )}
                  <span className="text-sm font-body text-gray-800 flex-1 text-left">{s.name ?? "Unknown"}</span>
                  <ConsentBadge level={s.consent_level} />
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] transition-colors cursor-pointer"
          >
            {selected.length > 0 ? `Done (${selected.length} tagged)` : "Done"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Photo Card ───────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  onEdit,
  teacherName,
  teacherProfileImageUrl,
}: {
  photo: TeacherPhoto;
  onEdit: (p: TeacherPhoto) => void;
  teacherName: string | null;
  teacherProfileImageUrl: string | null;
}) {
  const visibleTags = photo.tags.slice(0, 2);
  const extraCount = photo.tags.length - 2;
  const dateStr = formatDate(photo.taken_on);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative group break-inside-avoid mb-3 rounded-xl overflow-hidden bg-gray-100 shadow-sm"
    >
      {photo.signed_url ? (
        <img src={photo.signed_url} alt={photo.caption ?? ""} className="w-full h-auto block" loading="lazy" />
      ) : (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <button
        onClick={() => onEdit(photo)}
        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
      >
        <Pencil className="w-3.5 h-3.5 text-white" />
      </button>

      <div className="absolute top-2 left-2 z-10">
        {teacherProfileImageUrl ? (
          <img src={teacherProfileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#4a7c59]/80 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white">
            {getInitials(teacherName)}
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-white">
        {photo.caption && (
          <p className="text-sm font-body text-gray-700 line-clamp-2 mb-1">{photo.caption}</p>
        )}
        {dateStr && <p className="text-xs font-body text-gray-400 mb-1.5">{dateStr}</p>}

        {photo.tags.length === 0 ? (
          <button
            onClick={() => onEdit(photo)}
            className="text-xs font-body text-gray-400 hover:text-[#4a7c59] transition-colors cursor-pointer"
          >
            + Add tags
          </button>
        ) : (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((t) => (
              <span
                key={t.student_id}
                className={`flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded-full ${
                  t.consent_level === "NO"
                    ? "bg-red-50 text-red-600"
                    : "bg-[#4a7c59]/10 text-[#4a7c59]"
                }`}
              >
                {t.consent_level === "NO" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                )}
                {t.name ?? "Unknown"}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-xs font-body text-gray-400">+{extraCount} more</span>
            )}
          </div>
        )}

        {photo.publication_labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {photo.publication_labels.map((id) => {
              const meta = PUBLICATION_LABELS.find((l) => l.id === id);
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span key={id} className="flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditPhotoModal({
  photo,
  students,
  onClose,
  onSaved,
  onDeleted,
}: {
  photo: TeacherPhoto;
  students: StudentWithConsent[];
  onClose: () => void;
  onSaved: (updated: Partial<TeacherPhoto> & { id: string }) => void;
  onDeleted: (photoId: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [takenOn, setTakenOn] = useState(photo.taken_on ?? "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    photo.tags.map((t) => t.student_id)
  );
  const [selectedLabels, setSelectedLabels] = useState<string[]>(photo.publication_labels ?? []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const [metaResult, tagsResult] = await Promise.all([
        updatePhotoMeta({ photoId: photo.id, caption: caption.trim() || null, takenOn: takenOn || null, publicationLabels: selectedLabels }),
        setPhotoTags({ photoId: photo.id, studentIds: selectedStudentIds }),
      ]);

      if (metaResult.error || tagsResult.error) {
        setError(metaResult.error ?? tagsResult.error ?? "Failed to save");
        return;
      }

      const updatedTags = students
        .filter((s) => selectedStudentIds.includes(s.student_id))
        .map((s) => ({
          student_id: s.student_id,
          name: s.name,
          profile_image_url: s.profile_image_url,
          consent_level: s.consent_level,
        }));

      onSaved({ id: photo.id, caption: caption.trim() || null, taken_on: takenOn || null, tags: updatedTags, publication_labels: selectedLabels });
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deletePhoto(photo.id);
      if (result.error) { setError(result.error); return; }
      onDeleted(photo.id);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !confirmDelete) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="bg-white w-full sm:w-[440px] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold font-body text-gray-900">Edit Photo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {photo.signed_url && (
            <img src={photo.signed_url} alt="" className="w-full rounded-xl object-cover max-h-48" />
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 font-body mb-1.5">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption…"
              rows={2}
              className="w-full text-sm font-body text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 font-body mb-1.5">Date taken</label>
            <input
              type="date"
              value={takenOn}
              onChange={(e) => setTakenOn(e.target.value)}
              className="w-full text-sm font-body text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 font-body mb-1.5">Students in photo</label>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-h-[40px] flex flex-wrap items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                {selectedStudentIds.length === 0 ? (
                  <span className="text-sm text-gray-400 font-body flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    No students tagged
                  </span>
                ) : (
                  students
                    .filter((s) => selectedStudentIds.includes(s.student_id))
                    .map((s) => (
                      <span key={s.student_id} className="flex items-center gap-1 bg-[#4a7c59]/10 text-[#4a7c59] text-xs font-medium font-body px-2 py-0.5 rounded-full">
                        {s.name ?? "Unknown"}
                        <button
                          onClick={() => setSelectedStudentIds((prev) => prev.filter((id) => id !== s.student_id))}
                          className="text-[#4a7c59]/60 hover:text-[#4a7c59] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-3 py-2 text-sm font-body text-[#4a7c59] bg-[#4a7c59]/10 hover:bg-[#4a7c59]/15 rounded-xl transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                {selectedStudentIds.length === 0 ? "Tag" : "Edit"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 font-body mb-1.5">Publication</label>
            <div className="flex flex-wrap gap-2">
              {PUBLICATION_LABELS.map(({ id, label, icon: Icon }) => {
                const active = selectedLabels.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setSelectedLabels((prev) =>
                        active ? prev.filter((l) => l !== id) : [...prev, id]
                      )
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-body transition-colors cursor-pointer ${
                      active
                        ? "bg-[#4a7c59] text-white"
                        : "border border-gray-200 text-gray-600 hover:border-[#4a7c59] hover:text-[#4a7c59]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-body">{error}</p>}

          {confirmDelete ? (
            <div className="bg-red-50 rounded-xl p-3 space-y-2">
              <p className="text-sm text-red-700 font-body font-medium">Delete this photo?</p>
              <p className="text-xs text-red-500 font-body">This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold font-body rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 bg-white text-gray-600 text-sm font-semibold font-body rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-500 font-body transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete photo
            </button>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full py-2.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {sidebarOpen && (
          <StudentTagSidebar
            students={students}
            selected={selectedStudentIds}
            onChange={setSelectedStudentIds}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialPhotos: TeacherPhoto[];
  enrolledStudents: StudentWithConsent[];
  teacherName: string | null;
  teacherProfileImageUrl: string | null;
}

export default function PhotosPageClient({ initialPhotos, enrolledStudents, teacherName, teacherProfileImageUrl }: Props) {
  const [photos, setPhotos] = useState<TeacherPhoto[]>(initialPhotos);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<TeacherPhoto | null>(null);

  function handleUploaded(uploaded: TeacherPhoto[]) {
    setPhotos((prev) => [...uploaded, ...prev]);
    setIsUploadOpen(false);
  }

  function handleSaved(updated: Partial<TeacherPhoto> & { id: string }) {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    setEditingPhoto(null);
  }

  function handleDeleted(photoId: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setEditingPhoto(null);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold font-body text-gray-900">Photos</h1>
          <p className="text-sm text-gray-400 font-body mt-0.5">
            {photos.length > 0
              ? `${photos.length} photo${photos.length !== 1 ? "s" : ""}`
              : "Upload photos of your class"}
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Grid or empty state */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#4a7c59]/10 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-[#4a7c59]" />
          </div>
          <h2 className="text-base font-semibold font-body text-gray-800 mb-1">No photos yet</h2>
          <p className="text-sm text-gray-400 font-body mb-5">
            Upload photos from your class days and tag your students.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4a7c59] text-white text-sm font-semibold font-body rounded-xl hover:bg-[#3d6b4a] transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload your first photo
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 px-6 pb-6">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onEdit={setEditingPhoto} teacherName={teacherName} teacherProfileImageUrl={teacherProfileImageUrl} />
            ))}
          </div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {isUploadOpen && (
          <PhotoUploadModal
            key="upload-modal"
            onClose={() => setIsUploadOpen(false)}
            onUploaded={handleUploaded}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingPhoto && (
          <EditPhotoModal
            key={editingPhoto.id}
            photo={editingPhoto}
            students={enrolledStudents}
            onClose={() => setEditingPhoto(null)}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
