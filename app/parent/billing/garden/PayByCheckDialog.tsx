"use client";

import { GardenDialog } from "@/app/parent/_garden/sheet";
import { btnSageSm } from "@/app/parent/_garden/ui";

const STEPS: { n: number; title: string; body: string | null; link?: string }[] = [
  { n: 1, title: "Make the check out to", body: "Sage Field LLC" },
  {
    n: 2,
    title: "On the memo line, write",
    body: 'Include your child\'s name, weeks, and the program name — e.g. "Sage Field 2026 – Weeks 1, 2, 3"',
  },
  { n: 3, title: "Drop it off", body: "Bring it on the first day you come in." },
  { n: 4, title: "Questions?", body: null, link: "sabrina@sagefield.co" },
];

export default function PayByCheckDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <GardenDialog open={open} onClose={onClose} title="Pay by Check">
      <p className="sf-hand mt-0.5 text-lg text-[var(--sf-sage-deep)]">No processing fee</p>
      <div className="mt-4 flex flex-col gap-5">
        <figure>
          <div className="-rotate-1 rounded-[20px] bg-white p-4 shadow-[0_18px_40px_-28px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/10" aria-hidden="true">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="h-0.5 w-8 rounded-full bg-[var(--sf-ink)]/20" />
                <span className="h-0.5 w-5 rounded-full bg-[var(--sf-ink)]/20" />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-[var(--sf-soft)]">
                Date <span className="inline-block h-px w-14 bg-[var(--sf-ink)]/20" />
              </span>
            </div>
            <p className="mb-1 text-xs font-bold text-[var(--sf-soft)]">Pay to the Order of</p>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-lg bg-[var(--sf-butter)]/60 px-3 py-1 text-sm font-extrabold">Sage Field LLC</span>
              <span className="min-w-[80px] rounded-lg bg-[var(--sf-cream)] px-3 py-1 text-center text-sm font-bold text-[var(--sf-soft)]">$</span>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--sf-soft)]">Memo</span>
              <span className="rounded-lg bg-[var(--sf-butter)]/60 px-2.5 py-1 text-xs font-extrabold">Sage Field 2026 – Wks 1, 2, 3</span>
            </div>
            <p className="border-t border-dashed border-[var(--sf-ink)]/15 pt-2.5 text-center font-mono text-xs tracking-widest text-[var(--sf-soft)]">⋮ 0000 ⋮ 0000 0000 ⋮</p>
          </div>
          <figcaption className="sf-hand mt-2 text-center text-base text-[var(--sf-soft)]">Example — your check should look like this</figcaption>
        </figure>
        <ol className="flex flex-col gap-4">
          {STEPS.map(({ n, title, body, link }) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sf-mint)] text-sm font-extrabold text-[var(--sf-sage-deep)]" aria-hidden="true">
                {n}
              </span>
              <div className="pt-1">
                <p className="text-sm font-extrabold">{title}</p>
                {body ? <p className="mt-0.5 text-sm font-semibold text-[var(--sf-soft)]">{body}</p> : null}
                {link ? (
                  <a href={`mailto:${link}`} className="mt-0.5 block text-sm font-extrabold text-[var(--sf-sage-deep)] underline underline-offset-2">
                    {link}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <button type="button" onClick={onClose} className={`${btnSageSm} w-full`} data-autofocus>
          Got it
        </button>
      </div>
    </GardenDialog>
  );
}
