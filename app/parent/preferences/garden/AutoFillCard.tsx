"use client";

import { RadioCardGroup } from "@/app/parent/_garden/fields";
import { Spinner, cardBase } from "@/app/parent/_garden/ui";
import { LEVEL_CARDS, levelLabel, type ParticipationLevel } from "./levels";

/**
 * Per-child default level. Picking a tile saves straight away (toast), picking it again
 * or pressing Clear removes it. Every not-yet-saved activity is pre-set to it locally.
 */
export default function AutoFillCard({
  childName,
  level,
  saving,
  onSet,
}: {
  childName: string;
  level: ParticipationLevel | null;
  saving: boolean;
  onSet: (level: ParticipationLevel | null) => void;
}) {
  return (
    <section aria-labelledby="autofill-title" className={`${cardBase} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <h2 id="autofill-title" className="flex flex-wrap items-center gap-2 text-base font-extrabold leading-snug">
          Auto-fill preference
          <span className="rounded-full bg-[var(--sf-mint)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--sf-sage-deep)]">New</span>
        </h2>
        {saving ? (
          <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-xs font-bold text-[var(--sf-soft)]" role="status">
            <Spinner className="h-3.5 w-3.5" /> Saving…
          </span>
        ) : level ? (
          <button
            type="button"
            onClick={() => onSet(null)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-extrabold text-[var(--sf-soft)] transition hover:bg-[var(--sf-coral)]/15 hover:text-[var(--sf-coral-deep)] focus-visible:bg-[var(--sf-coral)]/15 focus-visible:text-[var(--sf-coral-deep)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
            aria-label="Clear auto-fill preference"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-[var(--sf-soft)]">
        Pick a level and every new activity for {childName} will be automatically pre-selected — you can still change any
        activity individually.
      </p>
      <div className="mt-4">
        <RadioCardGroup
          legend={<span className="sr-only">Auto-fill level for {childName}</span>}
          options={LEVEL_CARDS}
          value={level}
          onChange={(v) => onSet(v)}
          allowDeselect
          disabled={saving}
        />
      </div>
      {level ? (
        <p className="mt-3 text-[13px] font-extrabold text-[var(--sf-sage-deep)]">
          ✓ Auto-fill active · New activities will be pre-set to &ldquo;{levelLabel(level)}&rdquo;
        </p>
      ) : null}
    </section>
  );
}
