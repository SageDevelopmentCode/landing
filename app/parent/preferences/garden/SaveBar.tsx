"use client";

import { Spinner, btnSageSm } from "@/app/parent/_garden/ui";

/** Sticky footer for the activity list: unsaved count + Save Preferences. */
export default function SaveBar({
  unsavedCount,
  canSave,
  saving,
  onSave,
}: {
  unsavedCount: number;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const dirty = unsavedCount > 0;
  return (
    <div className="sticky bottom-3 z-30 mt-2 sm:bottom-5">
      <div
        className={`flex flex-col gap-3 rounded-[24px] bg-white/95 p-3 pl-5 shadow-[0_20px_50px_-20px_rgba(43,42,38,0.55)] ring-1 backdrop-blur sm:flex-row sm:items-center sm:justify-between ${
          dirty ? "ring-[var(--sf-coral-deep)]/30" : "ring-[var(--sf-ink)]/10"
        }`}
      >
        <p className="flex min-w-0 items-center gap-2 text-sm font-bold" aria-live="polite">
          {saving ? (
            <span className="text-[var(--sf-soft)]">Saving…</span>
          ) : dirty ? (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-coral-deep)]" aria-hidden="true" />
              <span className="text-[var(--sf-coral-deep)]">
                {unsavedCount} unsaved {unsavedCount === 1 ? "change" : "changes"}
              </span>
            </>
          ) : (
            <span className="text-[var(--sf-soft)]">Changes are not saved until you click Save.</span>
          )}
        </p>
        <button type="button" onClick={onSave} disabled={!canSave || saving} aria-busy={saving || undefined} className={`${btnSageSm} w-full sm:w-auto`}>
          {saving ? <Spinner /> : null}
          {saving ? "Saving…" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
