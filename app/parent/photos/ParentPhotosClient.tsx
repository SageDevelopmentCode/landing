"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getPhotoSignedUrlsBatch,
  getFullResSignedUrl,
} from "@/app/actions/photos";
import type { TeacherPhoto } from "@/app/actions/photos";

// ─── Date Grouping ────────────────────────────────────────────────────────────

type DateGroup = {
  date: string;
  label: string;
  shortLabel: string;
  photos: TeacherPhoto[];
};

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
      shortLabel:
        date === "no-date"
          ? "No date"
          : new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
      photos,
    }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────

function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: TeacherPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const photo = photos[idx];
  const fullResCacheRef = useRef<Map<string, string>>(new Map());
  const [displayUrl, setDisplayUrl] = useState<string | null>(() => {
    const initial = photos[initialIndex];
    if (!initial) return null;
    return initial.signed_url ?? null;
  });

  useEffect(() => {
    const current = photos[idx];
    if (!current) return;

    const cached = fullResCacheRef.current.get(current.storage_path);
    setDisplayUrl(cached ?? current.signed_url ?? null);

    let cancelled = false;
    const path = current.storage_path;

    if (!fullResCacheRef.current.has(path)) {
      getFullResSignedUrl(path).then((url) => {
        if (cancelled || !url) return;
        fullResCacheRef.current.set(path, url);
        setDisplayUrl(url);
      });
    }

    [-1, 1].forEach((d) => {
      const adj = photos[idx + d];
      if (!adj || fullResCacheRef.current.has(adj.storage_path)) return;
      getFullResSignedUrl(adj.storage_path).then((url) => {
        if (url) fullResCacheRef.current.set(adj.storage_path, url);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [idx, photos]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(photos.length - 1, i + 1));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white cursor-pointer transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <button
        onClick={() => setIdx((i) => Math.max(0, i - 1))}
        disabled={idx === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default cursor-pointer transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => setIdx((i) => Math.min(photos.length - 1, i + 1))}
        disabled={idx === photos.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default cursor-pointer transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {displayUrl ? (
        <motion.img
          key={photo.id}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          src={displayUrl}
          alt={photo.caption ?? ""}
          className="max-h-[90vh] max-w-[80vw] object-contain rounded-xl"
        />
      ) : (
        <div
          className="w-[72vw] max-w-[80vw] h-[55vh] rounded-xl bg-gray-700 animate-pulse"
          aria-hidden
        />
      )}

      {(photo.caption || photo.taken_on) && (
        <div className="absolute bottom-6 left-0 right-0 text-center px-4 space-y-0.5 pointer-events-none">
          {photo.caption && (
            <p className="text-sm text-white/80 font-body">{photo.caption}</p>
          )}
          {photo.taken_on && (
            <p className="text-xs text-white/50 font-body">
              {formatDate(photo.taken_on)}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Photo Card ───────────────────────────────────────────────────────────────

function ParentPhotoCard({
  photo,
  onOpen,
}: {
  photo: TeacherPhoto;
  onOpen: (p: TeacherPhoto) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      data-storage-path={photo.storage_path}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative aspect-square overflow-hidden cursor-pointer bg-gray-100"
      onClick={() => onOpen(photo)}
    >
      {(!photo.signed_url || !loaded) && (
        <div className="absolute inset-0 bg-[#e8ede9] animate-pulse" />
      )}
      {photo.signed_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.signed_url}
          alt={photo.caption ?? ""}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
        />
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialPhotos: TeacherPhoto[];
}

export default function ParentPhotosClient({ initialPhotos }: Props) {
  const [photos, setPhotos] = useState<TeacherPhoto[]>(initialPhotos);
  const [lightboxPhoto, setLightboxPhoto] = useState<TeacherPhoto | null>(null);

  const dateGroups = useMemo(() => groupPhotosByDate(photos), [photos]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [activeDate, setActiveDate] = useState<string | null>(() =>
    initialPhotos.length > 0 ? (initialPhotos[0].taken_on ?? "no-date") : null,
  );

  // ─── Signed-URL loading ───────────────────────────────────────────────────
  const CHUNK_SIZE = 30;

  // Fetch all signed URLs in parallel chunks on mount.
  // Earlier chunks resolve first, so photos near the top appear quickly.
  // Fetch all signed URLs in parallel chunks on mount.
  // Earlier chunks resolve first, so photos near the top appear quickly.
  useEffect(() => {
    if (initialPhotos.length === 0) return;

    const chunks: string[][] = [];
    for (let i = 0; i < initialPhotos.length; i += CHUNK_SIZE) {
      chunks.push(
        initialPhotos.slice(i, i + CHUNK_SIZE).map((p) => p.storage_path),
      );
    }

    let cancelled = false;
    chunks.forEach((chunkPaths) => {
      getPhotoSignedUrlsBatch(chunkPaths).then((urlMap) => {
        if (cancelled) return;
        setPhotos((prev) =>
          prev.map((p) =>
            urlMap[p.storage_path]
              ? { ...p, signed_url: urlMap[p.storage_path] }
              : p,
          ),
        );
      });
    });
    return () => {
      cancelled = true;
    };
  }, [initialPhotos]);

  // ─── TOC scroll tracking ──────────────────────────────────────────────────
  function scrollToSection(date: string) {
    const el = sectionRefs.current.get(date);
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: el.offsetTop - 72, behavior: "smooth" });
    setActiveDate(date);
  }

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || dateGroups.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
          );
          setActiveDate((topmost.target as HTMLElement).dataset.date ?? null);
        }
      },
      { root: container, threshold: 0, rootMargin: "-60px 0px -60% 0px" },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dateGroups]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* TOC sidebar */}
      {photos.length > 0 && (
        <aside className="w-44 flex-shrink-0 border-r border-gray-100 overflow-y-auto py-4 hidden md:flex flex-col">
          <p className="px-4 mb-2 text-xs font-medium text-gray-400 font-body uppercase tracking-wide">
            Dates
          </p>
          {dateGroups.map(({ date, shortLabel, photos: groupPhotos }) => (
            <button
              key={date}
              onClick={() => scrollToSection(date)}
              className={`w-full text-left px-4 py-2 transition-colors cursor-pointer ${
                activeDate === date
                  ? "text-[#4a7c59] font-semibold bg-[#4a7c59]/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="text-xs font-body block leading-tight">
                {shortLabel}
              </span>
              <span className="text-xs text-gray-400 font-body">
                {groupPhotos.length} photo{groupPhotos.length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </aside>
      )}

      {/* Main content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-semibold font-body text-gray-900">
            Photos
          </h1>
          <p className="text-sm text-gray-400 font-body mt-0.5">
            {photos.length > 0
              ? `${photos.length} photo${photos.length !== 1 ? "s" : ""}`
              : "No photos have been shared yet"}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#4a7c59]/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-[#4a7c59]" />
            </div>
            <h2 className="text-base font-semibold font-body text-gray-800 mb-1">
              No photos yet
            </h2>
            <p className="text-sm text-gray-400 font-body">
              Photos shared by the school will appear here.
            </p>
          </div>
        ) : (
          <div className="pb-8">
            {dateGroups.map((group) => (
              <section
                key={group.date}
                data-date={group.date}
                ref={(el) => {
                  if (el) sectionRefs.current.set(group.date, el);
                  else sectionRefs.current.delete(group.date);
                }}
              >
                <div className="px-6 pt-5 pb-2 flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold font-body text-gray-500">
                    {group.label}
                  </h2>
                  <span className="text-xs text-gray-400 font-body">
                    {group.photos.length} photo
                    {group.photos.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-0.5">
                  {group.photos.map((photo) => (
                    <ParentPhotoCard
                      key={photo.id}
                      photo={photo}
                      onOpen={setLightboxPhoto}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxPhoto && (
          <PhotoLightbox
            key={`${lightboxPhoto.id}-${photos.findIndex((p) => p.id === lightboxPhoto.id)}`}
            photos={photos}
            initialIndex={photos.findIndex((p) => p.id === lightboxPhoto.id)}
            onClose={() => setLightboxPhoto(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
