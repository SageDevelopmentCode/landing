"use client";

import type { ReactNode } from "react";
import { GardenDialog } from "./sheet";
import { Spinner, btnCoralSm, btnGhostSm, btnSageSm } from "./ui";

/**
 * Replaces `window.confirm()` in the portal. Cancel gets initial focus so Enter never
 * destroys anything by accident. Renders above sheets (`layer="top"`).
 * While `busy`, both buttons are disabled and closing is ignored.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  busyLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel: string;
  /** Label while `busy`, e.g. "Removing…". Defaults to `confirmLabel`. */
  busyLabel?: string;
  cancelLabel?: string;
  /** `danger` = coral (delete/remove), `neutral` = sage (discard edits, leave). */
  tone?: "danger" | "neutral";
  busy?: boolean;
}) {
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <GardenDialog open={open} onClose={close} title={title} layer="top">
      {body ? <div className="mt-2 text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">{body}</div> : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={close} disabled={busy} className={btnGhostSm} data-autofocus>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy || undefined}
          className={tone === "danger" ? btnCoralSm : btnSageSm}
        >
          {busy ? <Spinner /> : null}
          {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
        </button>
      </div>
    </GardenDialog>
  );
}
