"use client";

import type { ReactNode } from "react";
import { TINT_BG, btnGhostSm, type HomeTint } from "./ui";

/** Soft tint card for "nothing here yet". Use the page's real empty copy. */
export function EmptyState({
  emoji,
  title,
  body,
  action,
  tint = "mint",
  className = "",
}: {
  emoji?: string;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  tint?: HomeTint;
  className?: string;
}) {
  return (
    <div className={`rounded-[28px] ${TINT_BG[tint]} px-6 py-8 text-center ${className}`}>
      {emoji ? (
        <span className="mb-2 block text-4xl" aria-hidden="true">
          {emoji}
        </span>
      ) : null}
      <p className="sf-display text-2xl leading-tight">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-sm text-sm font-semibold text-[var(--sf-soft)]">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/**
 * Inline coral card for a section or sheet that failed to load. Never leave a blank area.
 * Announced politely so screen-reader users hear the failure.
 */
export function ErrorCard({
  title = "Something went wrong",
  body = "Please check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}: {
  title?: ReactNode;
  body?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-start gap-3 rounded-[24px] bg-[var(--sf-coral)]/20 px-5 py-4 sm:flex-row sm:items-center ${className}`}
    >
      <span className="text-2xl" aria-hidden="true">
        🌧️
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-extrabold text-[var(--sf-coral-deep)]">{title}</p>
        {body ? <p className="text-sm font-semibold text-[var(--sf-soft)]">{body}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={btnGhostSm}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Pulsing placeholder block. Static under reduced motion. */
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <span className={`block animate-pulse rounded-xl bg-[var(--sf-ink)]/[0.07] motion-reduce:animate-none ${className}`} aria-hidden="true" />;
}

/** A stack of skeleton rows with an sr-only "Loading…" label. */
export function SkeletonList({ rows = 3, rowClassName = "h-16", label = "Loading…" }: { rows?: number; rowClassName?: string; label?: string }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={`w-full rounded-[22px] ${rowClassName}`} />
      ))}
    </div>
  );
}
