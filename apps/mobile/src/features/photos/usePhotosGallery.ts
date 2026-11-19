// Data for the Photos gallery (parent + staff): all school photos grouped by
// day, lazy signed URLs for the rows on screen, and the date filter.
import { fetchSignedUrls, getAllSchoolPhotos, type TeacherPhoto } from "@/lib/photos-actions";
import { setPhotoGallerySession } from "@/lib/photo-gallery-session";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ViewToken } from "react-native";

export type Result = { ok: boolean; error?: string };

export type PhotoSection = {
  title: string;
  dateKey: string;
  count: number;
  data: TeacherPhoto[][];
};

const UNDATED = "__undated__";

export function formatSectionTitle(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function chunk<T>(arr: T[], n: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += n) rows.push(arr.slice(i, i + n));
  return rows;
}

function groupByDate(photos: TeacherPhoto[]): PhotoSection[] {
  const groups = new Map<string, TeacherPhoto[]>();
  for (const p of photos) {
    const key = p.taken_on ?? UNDATED;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const entries = [...groups.entries()].sort(([a], [b]) => {
    if (a === UNDATED) return 1;
    if (b === UNDATED) return -1;
    return b.localeCompare(a);
  });
  return entries.map(([key, ps]) => ({
    title: key === UNDATED ? "Undated" : formatSectionTitle(key),
    dateKey: key,
    count: ps.length,
    data: chunk(ps, 3),
  }));
}

/** How many photos get signed URLs right away, so the first screen never sits blank. */
const EAGER_SIGN = 30;

export function usePhotosGallery({
  openPath = "/(tabs)/photos/[photoId]",
}: { openPath?: string } = {}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<TeacherPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const signedUrlsRef = useRef<Record<string, string>>({});
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signMissing = useCallback(async (paths: string[]) => {
    const missing = [...new Set(paths)].filter((p) => p && !signedUrlsRef.current[p]);
    if (missing.length === 0) return;
    const newUrls = await fetchSignedUrls(missing);
    signedUrlsRef.current = { ...signedUrlsRef.current, ...newUrls };
    setSignedUrls((prev) => ({ ...prev, ...newUrls }));
  }, []);

  // Signed URLs last 24h and storage paths never change, so the cache is kept
  // across refreshes (clearing it used to leave visible tiles blank).
  const load = useCallback(async (): Promise<Result> => {
    try {
      const result = await getAllSchoolPhotos();
      setPhotos(result);
      setError(null);
      void signMissing(result.slice(0, EAGER_SIGN).map((p) => p.storage_path));
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return { ok: false, error: message };
    }
  }, [signMissing]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        const paths: string[] = [];
        for (const token of viewableItems) {
          const row = token.item as TeacherPhoto[];
          if (!Array.isArray(row)) continue;
          for (const p of row) paths.push(p.storage_path);
        }
        void signMissing(paths);
      }, 150);
    },
    [signMissing],
  );

  const openPhoto = useCallback(
    (photo: TeacherPhoto) => {
      setPhotoGallerySession(photos);
      router.push({
        pathname: openPath as never,
        params: {
          photoId: photo.id,
          storagePath: photo.storage_path,
          signedUrl: signedUrls[photo.storage_path] ?? "",
        },
      });
    },
    [photos, router, signedUrls, openPath],
  );

  /** Drop a photo locally (after a delete) without a full reload. */
  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const allSections = useMemo(() => groupByDate(photos), [photos]);

  const sections = useMemo(
    () =>
      selectedDates.size === 0
        ? allSections
        : allSections.filter((s) => selectedDates.has(s.dateKey)),
    [allSections, selectedDates],
  );

  const availableDates = useMemo(
    () => allSections.map((s) => ({ key: s.dateKey, title: s.title, count: s.count })),
    [allSections],
  );

  const toggleDate = useCallback((key: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearDates = useCallback(() => setSelectedDates(new Set()), []);

  const visibleCount = useMemo(() => sections.reduce((n, s) => n + s.count, 0), [sections]);

  return {
    photos,
    signedUrls,
    loading,
    error,
    sections,
    availableDates,
    selectedDates,
    visibleCount,
    toggleDate,
    clearDates,
    reload: load,
    openPhoto,
    removePhoto,
    onViewableItemsChanged,
  };
}

export type PhotosGallery = ReturnType<typeof usePhotosGallery>;
