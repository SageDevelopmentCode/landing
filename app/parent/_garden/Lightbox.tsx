"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { CloseButton, InPortal } from "./sheet";
import { Spinner } from "./ui";

const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

export type LightboxItem = {
  key: string;
  /** Best URL available right now (thumbnail while the full size loads). Null shows a placeholder. */
  url: string | null;
  alt: string;
  kind?: "image" | "video";
  /** URL for "Open full size". Defaults to `url`. */
  openUrl?: string | null;
  caption?: ReactNode;
  /** Short date shown in the hand font. */
  dateLabel?: string | null;
  /** Shows "Sharpening…" while a sharper version loads. */
  sharpening?: boolean;
  /** Loading failed: shows "We couldn't load this …" with Try again. */
  failed?: boolean;
  onRetry?: () => void;
};

/**
 * Full-screen media viewer for the portal. Accessible modal: focus moves in and returns
 * to the trigger, Tab is trapped, Esc closes (and stops there, so a sheet underneath stays
 * open), ←/→ and swipe move between items. Renders into the PortalShell container, so it
 * sits above sheets. Wrap it in `<AnimatePresence>` for the fade.
 */
export default function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  noun = "photo",
}: {
  items: LightboxItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  /** Used in labels: "Photo 2 of 5", "Next photo". */
  noun?: string;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const item = items[index] as LightboxItem | undefined;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);

  // Focus in on open, restore on close, lock page scroll.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus({ preventScroll: true });
    };
  }, []);

  const go = useCallback(
    (d: -1 | 1) => {
      const next = index + d;
      if (next >= 0 && next < items.length) onIndexChange(next);
    },
    [index, items.length, onIndexChange],
  );

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowLeft") {
      e.stopPropagation();
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.stopPropagation();
      e.preventDefault();
      go(1);
    } else if (e.key === "Tab" && panelRef.current) {
      e.stopPropagation();
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onTouchStart(e: TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: TouchEvent) {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  }

  if (!item) return null;

  const openUrl = item.openUrl ?? item.url;
  const isVideo = item.kind === "video";
  const single = items.length <= 1;

  return (
    <InPortal>
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${Noun} ${index + 1} of ${items.length}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="pointer-events-auto fixed inset-0 z-[70] flex flex-col bg-[var(--sf-ink)]/95 text-white outline-none backdrop-blur-sm"
      >
        {/* Top bar */}
        <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          {single ? null : (
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-extrabold tabular-nums" aria-live="polite">
              {index + 1} of {items.length}
            </span>
          )}
          {item.dateLabel ? <span className="sf-hand hidden text-lg text-white/75 sm:inline">{item.dateLabel}</span> : null}
          <div className="ml-auto flex items-center gap-2">
            {openUrl ? (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-extrabold transition hover:bg-white/25 focus-visible:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                <span className="hidden sm:inline">Open full size</span>
                <span className="sr-only sm:hidden">Open full size</span>
              </a>
            ) : null}
            <CloseButton onClick={onClose} label={`Close ${noun}`} />
          </div>
        </div>

        {/* Media */}
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {item.url && isVideo ? (
            <video
              key={item.key}
              src={item.url}
              controls
              playsInline
              autoPlay={!reduce}
              aria-label={item.alt}
              className="max-h-full max-w-full rounded-[18px] bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
            />
          ) : item.url ? (
            <motion.img
              key={item.key}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={item.url}
              alt={item.alt}
              className="max-h-full max-w-full select-none rounded-[18px] object-contain shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
              draggable={false}
            />
          ) : item.failed ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white/10 px-6 py-8 text-center">
              <span className="text-3xl" aria-hidden="true">
                🌧️
              </span>
              <p className="font-extrabold">We couldn&apos;t load this {noun}</p>
              {item.onRetry ? (
                <button
                  type="button"
                  onClick={item.onRetry}
                  className="min-h-11 rounded-full bg-white px-5 text-sm font-extrabold text-[var(--sf-ink)] transition hover:bg-[var(--sf-butter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : (
            <div className="h-[55vh] w-[min(72vw,640px)] animate-pulse rounded-[18px] bg-white/10 motion-reduce:animate-none" aria-hidden="true" />
          )}

          {item.sharpening && item.url ? (
            <span className="absolute bottom-3 right-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white/80">
              <Spinner className="h-3 w-3" /> Sharpening…
            </span>
          ) : null}

          {single ? null : (
            <>
              <NavButton side="left" label={`Previous ${noun}`} disabled={!hasPrev} onClick={() => go(-1)} />
              <NavButton side="right" label={`Next ${noun}`} disabled={!hasNext} onClick={() => go(1)} />
            </>
          )}
        </div>

        {/* Caption */}
        <div className="shrink-0 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center">
          {item.caption ? <p className="mx-auto max-w-2xl text-[15px] font-semibold text-white/90">{item.caption}</p> : null}
          {item.dateLabel ? <p className="sf-hand text-lg text-white/60 sm:hidden">{item.dateLabel}</p> : null}
          <p className="mt-1 hidden text-xs font-bold text-white/40 sm:block">{single ? "Esc to close" : "← → to browse · Esc to close"}</p>
          {/* Phones: swipe, or these buttons */}
          {single ? null : (
            <div className="mt-3 flex items-center justify-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={!hasPrev}
                aria-label={`Previous ${noun}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition active:bg-white/25 disabled:opacity-25 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
              </button>
              <span className="text-xs font-bold text-white/50">swipe to browse</span>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={!hasNext}
                aria-label={`Next ${noun}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition active:bg-white/25 disabled:opacity-25 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </InPortal>
  );
}

function NavButton({ side, label, disabled, onClick }: { side: "left" | "right"; label: string; disabled: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] shadow-[0_4px_0_0_rgba(0,0,0,0.35)] transition hover:-translate-y-[calc(50%+2px)] hover:bg-[var(--sf-butter)] focus-visible:bg-[var(--sf-butter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:pointer-events-none disabled:opacity-25 sm:flex cursor-pointer ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
    </button>
  );
}
