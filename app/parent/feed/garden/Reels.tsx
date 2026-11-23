"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MessageCircle, Video, Volume2, VolumeX, Play } from "lucide-react";
import type { ReelPost } from "@/app/teacher/feed/reelActions";
import { EmptyState } from "@/app/parent/_garden/states";
import { AuthorLink, ReactionPill, RelTime } from "./FeedBits";
import { reactionList } from "./feedUtils";

/**
 * Vertical snap scroller of reels, sized to the space left under the header so each
 * reel fills the visible area and snapping lines up.
 */
export default function ReelsView({
  reels,
  muted,
  onMutedChange,
  suspended,
  linkAuthors,
  reactionsDisabled,
  onReact,
  onOpen,
}: {
  reels: ReelPost[];
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  /** A sheet or lightbox is open: pause everything. */
  suspended: boolean;
  linkAuthors: boolean;
  reactionsDisabled: boolean;
  onReact: (reelId: string, emoji: string) => void;
  onOpen: (reelId: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => {
      // Distance from the scroller's top (in the document) to the bottom of the viewport.
      const top = el.getBoundingClientRect().top + window.scrollY;
      setHeight(Math.max(420, Math.round(window.innerHeight - top - 12)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (reels.length === 0) {
    return <EmptyState emoji="🎬" title="No reels yet." tint="lav" />;
  }

  return (
    <div
      ref={scrollerRef}
      role="feed"
      aria-label="Class Reels"
      style={{ height: height ?? undefined }}
      className="h-[calc(100dvh-16rem)] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[32px] bg-[var(--sf-ink)]/[0.04] scrollbar-hide"
      data-lenis-prevent
    >
      {reels.map((reel, i) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          position={i + 1}
          total={reels.length}
          muted={muted}
          onMutedChange={onMutedChange}
          suspended={suspended}
          linkAuthors={linkAuthors}
          reactionsDisabled={reactionsDisabled}
          onReact={(emoji) => onReact(reel.id, emoji)}
          onOpen={() => onOpen(reel.id)}
        />
      ))}
    </div>
  );
}

function ReelCard({
  reel,
  position,
  total,
  muted,
  onMutedChange,
  suspended,
  linkAuthors,
  reactionsDisabled,
  onReact,
  onOpen,
}: {
  reel: ReelPost;
  position: number;
  total: number;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  suspended: boolean;
  linkAuthors: boolean;
  reactionsDisabled: boolean;
  onReact: (emoji: string) => void;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Refs mirror the latest props so the long-lived observer never reads stale values.
  const mutedRef = useRef(muted);
  const suspendedRef = useRef(suspended);
  const autoplayRef = useRef(!reduce);
  const inViewRef = useRef(false);
  const onMutedChangeRef = useRef(onMutedChange);

  useEffect(() => {
    onMutedChangeRef.current = onMutedChange;
    autoplayRef.current = !reduce;
  });

  /** Plays with the current mute setting; if the browser blocks sound, falls back to muted. */
  const playRef = useRef(() => {
    const v = videoRef.current;
    if (!v || !v.src) return;
    v.muted = mutedRef.current;
    v.play().catch(() => {
      if (v.muted) return;
      v.muted = true;
      onMutedChangeRef.current(true);
      v.play().catch(() => {});
    });
  });

  useEffect(() => {
    mutedRef.current = muted;
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    suspendedRef.current = suspended;
    const v = videoRef.current;
    if (!v) return;
    if (suspended) v.pause();
    else if (inViewRef.current && autoplayRef.current) playRef.current();
  }, [suspended]);

  // Lazy-load when near view, autoplay when mostly visible, pause when scrolled away.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setLoaded(true);
          if (autoplayRef.current && !suspendedRef.current) playRef.current();
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) playRef.current();
    else v.pause();
  }

  const reactions = reactionList(reel.reactions);
  const commentCount = reel.comments.length;

  return (
    <article
      ref={containerRef}
      aria-label={`Reel ${position} of ${total} from ${reel.teacher_name}`}
      aria-posinset={position}
      aria-setsize={total}
      className="relative flex h-full snap-start snap-always items-center justify-center gap-4 p-3 sm:p-4"
    >
      <div className="relative aspect-[9/16] h-full max-w-full overflow-hidden rounded-[28px] bg-[var(--sf-ink)] shadow-[0_30px_60px_-30px_rgba(43,42,38,0.7)]">
        {reel.storage_url ? (
          <video
            ref={videoRef}
            src={loaded ? reel.storage_url : undefined}
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => {
              if (inViewRef.current && autoplayRef.current && !suspendedRef.current) playRef.current();
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--sf-lav)]">
            <Video className="h-12 w-12 text-[#6b3f86]" aria-hidden="true" />
          </div>
        )}

        {/* Tap to play / pause */}
        {reel.storage_url ? (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? `Pause reel from ${reel.teacher_name}` : `Play reel from ${reel.teacher_name}`}
            className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--sf-sky)] cursor-pointer"
          >
            {!playing ? (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm" aria-hidden="true">
                <Play className="ml-1 h-8 w-8" fill="currentColor" />
              </span>
            ) : null}
          </button>
        ) : null}

        {/* Mute */}
        {reel.storage_url ? (
          <button
            type="button"
            onClick={() => onMutedChange(!muted)}
            aria-label={muted ? "Unmute reels" : "Mute reels"}
            aria-pressed={muted}
            className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:bg-black/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
          >
            {muted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
          </button>
        ) : null}

        {/* Author + caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-5 pt-16 pr-20 sm:pr-4">
          <AuthorLink post={reel} linked={linkAuthors} tone="light" avatarSize="h-9 w-9 text-xs" meta={<RelTime iso={reel.created_at} />} />
          {reel.caption ? <p className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-white/95 drop-shadow">{reel.caption}</p> : null}
        </div>
      </div>

      {/* Reactions + comments rail: over the video on phones, beside it from sm. */}
      <div className="absolute bottom-24 right-5 flex flex-col items-center gap-3 sm:static sm:self-end sm:pb-6" role="group" aria-label="Reactions">
        {reactions.map((r) => (
          <ReactionPill key={r.emoji} reaction={r} onToggle={onReact} disabled={reactionsDisabled} variant="rail" />
        ))}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Comments${commentCount ? `, ${commentCount}` : ""}`}
          className="group/rx flex flex-col items-center gap-1 rounded-full focus-visible:outline-none cursor-pointer"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.15)] ring-2 ring-transparent transition group-hover/rx:-translate-y-0.5 group-hover/rx:bg-white group-focus-visible/rx:-translate-y-0.5 group-focus-visible/rx:ring-[var(--sf-sky)]">
            <MessageCircle className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-white/80 px-1.5 text-xs font-extrabold tabular-nums text-[var(--sf-ink)]" aria-hidden="true">
            {commentCount}
          </span>
        </button>
      </div>
    </article>
  );
}
