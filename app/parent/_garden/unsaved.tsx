"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import ConfirmDialog from "./ConfirmDialog";

/**
 * Protects unsaved edits in a sheet or page.
 *
 * ```tsx
 * const guard = useUnsavedGuard(dirty);
 * <GardenSheet onClose={() => guard.confirm(close)} …>…</GardenSheet>
 * {guard.dialog}
 * ```
 * `confirm(action)` runs `action` straight away when nothing is dirty; otherwise it asks
 * "Discard changes?" first. While dirty, leaving or reloading the tab triggers the
 * browser's own "Leave site?" prompt.
 */
export function useUnsavedGuard(
  dirty: boolean,
  {
    title = "Discard changes?",
    body = "You have changes that haven't been saved yet.",
    discardLabel = "Discard changes",
    keepLabel = "Keep editing",
  }: { title?: ReactNode; body?: ReactNode; discardLabel?: string; keepLabel?: string } = {},
) {
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers need a returnValue to show the prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const confirm = useCallback(
    (action: () => void) => {
      if (!dirty) {
        action();
        return;
      }
      pending.current = action;
      setOpen(true);
    },
    [dirty],
  );

  const dialog = (
    <ConfirmDialog
      open={open}
      onClose={() => {
        pending.current = null;
        setOpen(false);
      }}
      onConfirm={() => {
        const action = pending.current;
        pending.current = null;
        setOpen(false);
        action?.();
      }}
      title={title}
      body={body}
      confirmLabel={discardLabel}
      cancelLabel={keepLabel}
      tone="neutral"
    />
  );

  return { confirm, dialog };
}
