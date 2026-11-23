"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getPhotoSignedUrlsBatch } from "@/app/actions/photos";
import type { TeacherPhoto } from "@/app/actions/photos";
import PortalShell from "@/app/parent/_garden/PortalShell";
import { SectionHeader } from "@/app/parent/_garden/ui";
import { EmptyState, ErrorCard } from "@/app/parent/_garden/states";
import { groupPhotosByDate, photoAlt, photoCountLabel, type DateGroup } from "./garden/photos";
import PhotoLightbox from "./garden/PhotoLightbox";

interface Props {
  initialPhotos: TeacherPhoto[];
}

export default function ParentPhotosClient(props: Props) {
  return (
    <PortalShell className="w-full">
      <PhotosContent {...props} />
    </PortalShell>
  );
}

const CHUNK_SIZE = 30;
/** Roughly how many photos to add each time the parent nears the bottom. */
const BATCH_PHOTOS = 180;

/** How many date groups to render to cover at least `photos` more photos after `from`. */
function groupsToCover(groups: DateGroup[], from: number, photos: number): number {
  let n = from;
  let count = 0;
  while (n < groups.length && (count < photos || n === from)) {
    count += groups[n].photos.length;
    n++;
  }
  return n;
}

function PhotosContent({ initialPhotos }: Props) {
  // Grouping and order are fixed for the page; signed URLs live in their own map so a batch of
  // URLs re-renders only the tiles, not a regrouping of every photo.
  const dateGroups = useMemo(() => groupPhotosByDate(initialPhotos), [initialPhotos]);
  // Grid order, so the lightbox arrows follow what the parent sees (not upload order).
  const ordered = useMemo(() => dateGroups.flatMap((g) => g.photos), [dateGroups]);
  const indexById = useMemo(() => new Map(ordered.map((p, i) => [p.id, i])), [ordered]);

  const [urls, setUrls] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const p of initialPhotos) if (p.signed_url) seed[p.storage_path] = p.signed_url;
    return seed;
  });
  const [failedPaths, setFailedPaths] = useState<Set<string>>(new Set());
  const [signAttempt, setSignAttempt] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(dateGroups[0]?.date ?? null);

  /* ─── Progressive rendering: dates render in batches as the parent scrolls ─── */

  const [renderCount, setRenderCount] = useState(() => groupsToCover(dateGroups, 0, BATCH_PHOTOS));
  const renderedGroups = useMemo(() => dateGroups.slice(0, renderCount), [dateGroups, renderCount]);
  const hasMore = renderCount < dateGroups.length;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setRenderCount((n) => groupsToCover(dateGroups, n, BATCH_PHOTOS));
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dateGroups, hasMore, renderCount]);

  /* ─── Signed URLs: only for rendered dates, in grid order, 30 at a time ─── */

  const requested = useRef<Set<string>>(new Set());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Requests are never cancelled when more dates render (results are idempotent); they are only
  // dropped after unmount. Each path is requested once unless it failed.
  useEffect(() => {
    const todo = renderedGroups
      .flatMap((g) => g.photos.map((p) => p.storage_path))
      .filter((path) => !requested.current.has(path));
    if (todo.length === 0) return;
    todo.forEach((path) => requested.current.add(path));
    void (async () => {
      for (let i = 0; i < todo.length; i += CHUNK_SIZE) {
        if (!mounted.current) return;
        const chunk = todo.slice(i, i + CHUNK_SIZE);
        let urlMap: Record<string, string> = {};
        try {
          urlMap = await getPhotoSignedUrlsBatch(chunk);
        } catch {
          urlMap = {};
        }
        if (!mounted.current) return;
        const missing = chunk.filter((p) => !urlMap[p]);
        if (Object.keys(urlMap).length > 0) setUrls((prev) => ({ ...prev, ...urlMap }));
        if (missing.length > 0) {
          missing.forEach((p) => requested.current.delete(p));
          setFailedPaths((prev) => new Set([...prev, ...missing]));
        }
      }
    })();
  }, [renderedGroups, signAttempt]);

  /** Re-sign a single tile whose URL expired or failed. */
  const resignOne = useCallback(async (path: string) => {
    try {
      const urlMap = await getPhotoSignedUrlsBatch([path]);
      if (urlMap[path]) {
        setUrls((prev) => ({ ...prev, [path]: urlMap[path] }));
        setFailedPaths((prev) => {
          if (!prev.has(path)) return prev;
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
      return !!urlMap[path];
    } catch {
      return false;
    }
  }, []);

  /* ─── Date rail ─── */

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const railRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pendingScroll = useRef<string | null>(null);

  /** Scrolls the page so a date section sits just under the sticky rail. DOM only, no state. */
  const scrollToSection = useCallback((date: string) => {
    const el = sectionRefs.current.get(date);
    if (!el) return false;
    const railH = railRef.current?.getBoundingClientRect().height ?? 0;
    const top = el.getBoundingClientRect().top + window.scrollY - railH - 12;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    return true;
  }, []);

  function jumpTo(date: string) {
    setActiveDate(date);
    const idx = dateGroups.findIndex((g) => g.date === date);
    if (idx >= renderCount) {
      // Render up to (and a little past) that date first, then scroll once it's in the DOM.
      pendingScroll.current = date;
      setRenderCount(groupsToCover(dateGroups, idx, 60));
      return;
    }
    scrollToSection(date);
  }

  useEffect(() => {
    const date = pendingScroll.current;
    if (date && scrollToSection(date)) pendingScroll.current = null;
  }, [renderCount, scrollToSection]);

  useEffect(() => {
    if (renderedGroups.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActiveDate((topmost.target as HTMLElement).dataset.date ?? null);
      },
      { threshold: 0, rootMargin: "-90px 0px -60% 0px" },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [renderedGroups]);

  // Keep the active chip visible inside the rail (horizontal scroll only, never the page).
  useEffect(() => {
    const rail = railRef.current?.querySelector<HTMLElement>("[data-rail-scroll]");
    const chip = activeDate ? chipRefs.current.get(activeDate) : null;
    if (!rail || !chip) return;
    const left = chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2;
    rail.scrollTo({ left, behavior: "smooth" });
  }, [activeDate]);

  const failedCount = failedPaths.size;

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_60%_at_12%_8%,rgba(232,216,241,0.6),transparent_70%),radial-gradient(50%_55%_at_92%_4%,rgba(207,230,251,0.6),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
        {/* Hero */}
        <header className="mb-6">
          <h1 className="sf-display text-[2.6rem] leading-none sm:text-[3.4rem]">Photos</h1>
          <p className="sf-hand mt-2 text-xl leading-tight text-[var(--sf-sage-deep)]">
            {initialPhotos.length > 0 ? photoCountLabel(initialPhotos.length) : "No photos have been shared yet"}
          </p>
        </header>

        {initialPhotos.length === 0 ? (
          <EmptyState emoji="📷" title="No photos yet" body="Photos shared by the school will appear here." tint="lav" />
        ) : (
          <>
            {/* Sticky date rail */}
            <div ref={railRef} className="sticky top-0 z-20 -mx-6 mb-2 bg-[var(--sf-cream)]/85 px-6 py-3 backdrop-blur-md">
              <nav aria-label="Jump to a date">
                <div data-rail-scroll className="-mx-6 flex snap-x gap-2 overflow-x-auto px-6 scrollbar-hide [scroll-padding-inline:1.5rem]">
                  {dateGroups.map((g) => {
                    const active = activeDate === g.date;
                    return (
                      <button
                        key={g.date}
                        ref={(el) => {
                          if (el) chipRefs.current.set(g.date, el);
                          else chipRefs.current.delete(g.date);
                        }}
                        type="button"
                        onClick={() => jumpTo(g.date)}
                        aria-current={active ? "true" : undefined}
                        className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                          active
                            ? "bg-[var(--sf-ink)] text-white shadow-[0_3px_0_0_#000]"
                            : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:bg-[var(--sf-butter)]/60"
                        }`}
                      >
                        {g.shortLabel}
                        <span
                          className={`rounded-full px-1.5 text-[11px] leading-5 ${active ? "bg-white/20" : "bg-[var(--sf-ink)]/[0.07] text-[var(--sf-soft)]"}`}
                        >
                          {g.photos.length}
                          <span className="sr-only"> {g.photos.length === 1 ? "photo" : "photos"}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            {failedCount > 0 ? (
              <ErrorCard
                className="mb-6"
                title="We couldn't load photos"
                body={`${photoCountLabel(failedCount)} didn't load. Please check your connection and try again.`}
                onRetry={() => {
                  setFailedPaths(new Set());
                  setSignAttempt((n) => n + 1);
                }}
              />
            ) : null}

            <div className="flex flex-col gap-12 pt-4">
              {renderedGroups.map((group) => (
                <DateSection
                  key={group.date}
                  group={group}
                  sectionRef={(el) => {
                    if (el) sectionRefs.current.set(group.date, el);
                    else sectionRefs.current.delete(group.date);
                  }}
                  failedPaths={failedPaths}
                  urls={urls}
                  onOpen={(p) => setLightboxIndex(indexById.get(p.id) ?? null)}
                  onResign={resignOne}
                />
              ))}
            </div>

            {hasMore ? (
              <div ref={sentinelRef} className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setRenderCount((n) => groupsToCover(dateGroups, n, BATCH_PHOTOS))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/10 shadow-[0_3px_0_0_rgba(43,42,38,0.12)] transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[var(--sf-sky)] cursor-pointer"
                >
                  Show earlier photos
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && ordered[lightboxIndex] ? (
          <PhotoLightbox
            key="lightbox"
            photos={ordered}
            urls={urls}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DateSection({
  group,
  sectionRef,
  failedPaths,
  urls,
  onOpen,
  onResign,
}: {
  group: DateGroup;
  sectionRef: (el: HTMLElement | null) => void;
  failedPaths: Set<string>;
  urls: Record<string, string>;
  onOpen: (p: TeacherPhoto) => void;
  onResign: (path: string) => Promise<boolean>;
}) {
  const headingId = `photos-${group.date}`;
  return (
    <section ref={sectionRef} data-date={group.date} aria-labelledby={headingId} className="scroll-mt-24">
      <SectionHeader id={headingId} title={group.label} note={photoCountLabel(group.photos.length)} />
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
        {group.photos.map((photo) => (
          <li key={photo.id}>
            <PhotoTile photo={photo} url={urls[photo.storage_path] ?? null} failed={failedPaths.has(photo.storage_path)} onOpen={onOpen} onResign={onResign} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PhotoTile({
  photo,
  url,
  failed,
  onOpen,
  onResign,
}: {
  photo: TeacherPhoto;
  url: string | null;
  failed: boolean;
  onOpen: (p: TeacherPhoto) => void;
  onResign: (path: string) => Promise<boolean>;
}) {
  // Track which URL finished loading / errored, so a re-signed URL starts fresh.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const loaded = !!url && loadedUrl === url;
  const broken = (failed && !url) || (!!url && erroredUrl === url);

  if (broken) {
    return (
      <button
        type="button"
        disabled={retrying}
        onClick={async () => {
          setRetrying(true);
          await onResign(photo.storage_path);
          setErroredUrl(null);
          setRetrying(false);
        }}
        className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[18px] bg-[var(--sf-coral)]/15 text-center text-xs font-extrabold text-[var(--sf-coral-deep)] ring-1 ring-[var(--sf-coral)]/30 transition hover:bg-[var(--sf-coral)]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
        aria-label={`Reload photo: ${photoAlt(photo)}`}
      >
        <span className="text-lg" aria-hidden="true">{retrying ? "⏳" : "↻"}</span>
        {retrying ? "Loading…" : "Reload"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className="group relative block aspect-square w-full overflow-hidden rounded-[18px] bg-[var(--sf-mint)]/40 shadow-[0_10px_24px_-18px_rgba(43,42,38,0.6)] ring-1 ring-[var(--sf-ink)]/[0.06] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_30px_-18px_rgba(43,42,38,0.6)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-zoom-in"
    >
      {!loaded ? <span className="absolute inset-0 animate-pulse bg-[var(--sf-ink)]/[0.06] motion-reduce:animate-none" aria-hidden="true" /> : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
        <img
          src={url}
          alt={photoAlt(photo)}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadedUrl(url)}
          onError={() => setErroredUrl(url)}
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <span className="sr-only">{photoAlt(photo)}</span>
      )}
      {photo.caption ? (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-6 text-left text-[11px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        >
          {photo.caption}
        </span>
      ) : null}
    </button>
  );
}
