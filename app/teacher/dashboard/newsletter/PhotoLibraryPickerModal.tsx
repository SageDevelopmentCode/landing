"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, CheckCircle2, ImageIcon, Loader2 } from "lucide-react";
import { getAllSchoolPhotos, getPhotoSignedUrlsBatch, type TeacherPhoto } from "@/app/actions/photos";
import { addLibraryPhotoToSection, type DBSectionImage } from "@/app/actions/newsletter";

type DateGroup = { date: string; label: string; photos: TeacherPhoto[] };

function groupPhotosByDate(photos: TeacherPhoto[]): DateGroup[] {
  const map = new Map<string, TeacherPhoto[]>();
  for (const p of photos) {
    const key = p.taken_on ?? "no-date";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === "no-date") return 1;
      if (b === "no-date") return -1;
      return b.localeCompare(a);
    })
    .map(([date, photos]) => ({
      date,
      label:
        date === "no-date"
          ? "No date"
          : new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
      photos,
    }));
}

interface LocalImage {
  id: string;
  dbId?: string;
  storagePath?: string;
  url: string;
  name: string;
  uploading?: boolean;
  sourceBucket?: string;
}

interface Props {
  sectionId: string;
  usedStoragePaths?: Set<string>;
  onConfirm: (images: LocalImage[]) => void;
  onClose: () => void;
  /** If provided, skip the addLibraryPhotoToSection call and return raw photo data instead */
  onSelectRaw?: (photos: TeacherPhoto[]) => void;
}

export default function PhotoLibraryPickerModal({ sectionId, usedStoragePaths, onConfirm, onClose, onSelectRaw }: Props) {
  const [photos, setPhotos] = useState<TeacherPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateGroups = useMemo(() => groupPhotosByDate(photos), [photos]);

  const urlObserverRef = useRef<IntersectionObserver | null>(null);
  const pendingPathsRef = useRef<Set<string>>(new Set());
  const observedPhotoIds = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const fetched = await getAllSchoolPhotos();
      setPhotos(fetched);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    return () => {
      urlObserverRef.current?.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function getUrlObserver() {
    if (!urlObserverRef.current) {
      urlObserverRef.current = new IntersectionObserver(
        (entries) => {
          let added = false;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const path = (entry.target as HTMLElement).dataset.storagePath;
            if (!path) return;
            urlObserverRef.current?.unobserve(entry.target);
            pendingPathsRef.current.add(path);
            added = true;
          });
          if (!added) return;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(async () => {
            const paths = [...pendingPathsRef.current];
            pendingPathsRef.current.clear();
            const urlMap = await getPhotoSignedUrlsBatch(paths);
            setPhotos((prev) =>
              prev.map((p) => (urlMap[p.storage_path] ? { ...p, signed_url: urlMap[p.storage_path] } : p))
            );
          }, 50);
        },
        { rootMargin: "200px" }
      );
    }
    return urlObserverRef.current;
  }

  function toggleSelect(photoId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  async function handleConfirm() {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    setError(null);

    const selected = photos.filter((p) => selectedIds.has(p.id));

    if (onSelectRaw) {
      setSubmitting(false);
      onSelectRaw(selected);
      return;
    }

    const results = await Promise.all(
      selected.map((p) => addLibraryPhotoToSection(sectionId, p.id))
    );

    const succeeded: LocalImage[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.data) {
        succeeded.push({
          id: r.data.id,
          dbId: r.data.id,
          storagePath: r.data.storage_path,
          url: r.data.signed_url ?? "",
          name: r.data.storage_path.split("/").pop() ?? "",
          sourceBucket: r.data.source_bucket,
        });
      } else if (r.error && r.error !== "This photo is already in the section") {
        errors.push(r.error);
      }
    }

    setSubmitting(false);

    if (errors.length > 0) {
      setError(`${errors.length} photo(s) could not be added: ${errors[0]}`);
    }

    if (succeeded.length > 0) {
      onConfirm(succeeded);
    } else if (errors.length === 0) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl flex flex-col w-full max-w-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 font-body">Choose from Library</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-body">Loading school photos…</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <ImageIcon className="w-8 h-8" />
              <p className="text-sm font-body text-center">
                No photos yet.{" "}
                <a href="/teacher/dashboard/photos" className="text-[#4a7c59] underline underline-offset-2">
                  Go to Photos
                </a>{" "}
                to upload some.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dateGroups.map((group) => (
                <div key={group.date}>
                  <div className="px-1 pb-2 flex items-baseline gap-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">
                      {group.label}
                    </h3>
                    <span className="text-xs text-gray-400 font-body">
                      {group.photos.length} photo{group.photos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {group.photos.map((photo) => {
                      const isSelected = selectedIds.has(photo.id);
                      const isAlreadyUsed = usedStoragePaths?.has(photo.storage_path) ?? false;
                      return (
                        <div
                          key={photo.id}
                          data-storage-path={photo.storage_path}
                          ref={(el) => {
                            if (!el || photo.signed_url) return;
                            if (observedPhotoIds.current.has(photo.id)) return;
                            observedPhotoIds.current.add(photo.id);
                            getUrlObserver().observe(el);
                          }}
                          onClick={() => toggleSelect(photo.id)}
                          className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer ring-2 transition-all ${
                            isSelected ? "ring-[#4a7c59]" : "ring-transparent hover:ring-gray-300"
                          }`}
                        >
                          {photo.signed_url ? (
                            <img
                              src={photo.signed_url}
                              alt={photo.caption ?? ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          {isAlreadyUsed && !isSelected && (
                            <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-2 pointer-events-none">
                              <span className="text-white text-[10px] font-semibold font-body bg-black/60 px-2 py-0.5 rounded-full">
                                Already added
                              </span>
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#4a7c59]/20 flex items-start justify-end p-1.5">
                              <CheckCircle2 className="w-5 h-5 text-[#4a7c59] drop-shadow" />
                            </div>
                          )}
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/40 px-2 py-1">
                              <p className="text-white text-xs font-body truncate">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500 font-body">
            {selectedIds.size > 0 ? (
              <span className="text-[#4a7c59] font-semibold">{selectedIds.size} selected</span>
            ) : (
              <span>Select photos to add</span>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-500 font-body flex-1 text-center">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold font-body text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold font-body text-white bg-[#4a7c59] rounded-lg hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add to Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
