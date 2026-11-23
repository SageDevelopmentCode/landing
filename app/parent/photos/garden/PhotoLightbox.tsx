"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFullResSignedUrl, type TeacherPhoto } from "@/app/actions/photos";
import Lightbox, { type LightboxItem } from "@/app/parent/_garden/Lightbox";
import { formatShortDate, photoAlt } from "./photos";

/**
 * Photos-page lightbox: loads full-size signed URLs (current photo first, then its
 * neighbours) and hands them to the shared portal Lightbox.
 */
export default function PhotoLightbox({
  photos,
  urls,
  index,
  onIndexChange,
  onClose,
}: {
  /** Photos in grid order (grouped by date), so arrows follow what the parent sees. */
  photos: TeacherPhoto[];
  /** Thumbnail signed URLs by storage path, shown while the full-size URL loads. */
  urls: Record<string, string>;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [fullRes, setFullRes] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const requested = useRef<Set<string>>(new Set());

  const fetchFullRes = useCallback((path: string, force = false) => {
    if (!force && requested.current.has(path)) return;
    requested.current.add(path);
    setFailed((f) => (f[path] ? { ...f, [path]: false } : f));
    getFullResSignedUrl(path)
      .then((url) => {
        if (url) setFullRes((prev) => (prev[path] ? prev : { ...prev, [path]: url }));
        else setFailed((f) => ({ ...f, [path]: true }));
      })
      .catch(() => setFailed((f) => ({ ...f, [path]: true })));
  }, []);

  // Current photo, then its neighbours, so arrowing feels instant.
  useEffect(() => {
    [0, -1, 1].forEach((d) => {
      const p = photos[index + d];
      if (p) fetchFullRes(p.storage_path);
    });
  }, [index, photos, fetchFullRes]);

  const items: LightboxItem[] = photos.map((photo) => {
    const path = photo.storage_path;
    const url = fullRes[path] ?? urls[path] ?? photo.signed_url ?? null;
    return {
      key: path,
      url,
      openUrl: fullRes[path] ?? url,
      alt: photoAlt(photo),
      kind: "image",
      caption: photo.caption || null,
      dateLabel: photo.taken_on ? formatShortDate(photo.taken_on) : null,
      sharpening: !fullRes[path] && !failed[path],
      failed: !!failed[path],
      onRetry: () => fetchFullRes(path, true),
    };
  });

  return <Lightbox items={items} index={index} onIndexChange={onIndexChange} onClose={onClose} noun="photo" />;
}
