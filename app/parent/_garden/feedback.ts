"use client";

import { useCallback, useMemo } from "react";
import { useToast } from "@/app/_garden/toast";

export type SaveResult = { ok: boolean; error?: string };

type RunSaveOptions = {
  /** Optional loading toast while the request runs (for slower saves). */
  loadingTitle?: string;
  successTitle: string;
  successMessage?: string;
  errorTitle: string;
  /** Shown on the error toast as a Retry button. */
  retry?: () => void;
  fn: () => Promise<SaveResult>;
};

/**
 * Feedback for parent portal writes, after the mobile `useGardenFeedback`:
 * the UI calls these helpers and only reacts to the `{ ok, error }` they return.
 */
export function usePortalFeedback(readOnly: boolean | undefined) {
  const toast = useToast();

  const blockedByPreview = useCallback(() => {
    if (!readOnly) return false;
    toast.show({
      tone: "info",
      title: "Preview mode",
      message: "Changes can't be saved while previewing a parent's account.",
    });
    return true;
  }, [readOnly, toast]);

  const runSave = useCallback(
    async ({ loadingTitle, successTitle, successMessage, errorTitle, retry, fn }: RunSaveOptions): Promise<boolean> => {
      if (blockedByPreview()) return false;
      const loadingId = loadingTitle ? toast.show({ tone: "loading", title: loadingTitle }) : null;
      let result: SaveResult;
      try {
        result = await fn();
      } catch {
        result = { ok: false };
      }
      const payload = result.ok
        ? { tone: "success" as const, title: successTitle, message: successMessage, duration: undefined, action: undefined }
        : {
            tone: "error" as const,
            title: errorTitle,
            message: "Please check your connection and try again.",
            duration: undefined,
            action: retry ? { label: "Try again", onClick: retry } : undefined,
          };
      if (loadingId !== null) toast.update(loadingId, payload);
      else toast.show(payload);
      return result.ok;
    },
    [blockedByPreview, toast],
  );

  return useMemo(() => ({ toast, blockedByPreview, runSave }), [toast, blockedByPreview, runSave]);
}

/** Small celebratory burst for real milestones. Skipped under reduced motion. */
export async function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.75 },
    colors: ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"],
    zIndex: 95,
    disableForReducedMotion: true,
  });
}
