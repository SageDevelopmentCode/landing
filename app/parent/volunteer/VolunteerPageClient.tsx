"use client";

import { useState } from "react";
import PortalShell from "@/app/parent/_garden/PortalShell";
import { btnInkSm, cardBase } from "@/app/parent/_garden/ui";
import { Reveal } from "@/app/_garden/motion";
import VolunteerSheet from "./garden/VolunteerSheet";

/**
 * Volunteer Opportunities. Shared by `/parent/volunteer` and the admin "view as parent"
 * page (`readOnlyPreview`: the sheet opens, but submitting shows the Preview mode toast).
 */
export default function VolunteerPageClient({ readOnlyPreview }: { readOnlyPreview?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <PortalShell>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_60%_at_12%_8%,rgba(255,229,138,0.45),transparent_70%),radial-gradient(50%_55%_at_92%_4%,rgba(205,238,213,0.6),transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
          <header className="mb-8">
            <h1 className="sf-display text-[2.6rem] leading-none sm:text-[3.4rem]">Volunteer Opportunities</h1>
          </header>

          <Reveal>
            <section aria-labelledby="volunteer-openings" className={`${cardBase} relative overflow-hidden px-6 py-12 text-center sm:px-12`}>
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--sf-mint)]/70"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[var(--sf-butter)]/50"
                aria-hidden="true"
              />
              <div className="relative flex flex-col items-center">
                <span
                  className="mb-5 flex h-16 w-16 -rotate-6 items-center justify-center rounded-[22px] bg-[var(--sf-coral)]/25 text-3xl shadow-[0_6px_0_0_rgba(224,122,110,0.25)]"
                  aria-hidden="true"
                >
                  💚
                </span>
                <h2 id="volunteer-openings" className="sf-display text-[1.9rem] leading-tight sm:text-[2.3rem]">
                  No openings right now
                </h2>
                <p className="mt-3 max-w-sm text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">
                  We&apos;ll notify you as soon as a volunteer opportunity becomes available. Thank you for your willingness
                  to get involved!
                </p>
                <div className="pointer-events-auto mt-7">
                  <button type="button" onClick={() => setOpen(true)} className={btnInkSm}>
                    <span aria-hidden="true">🙋</span>
                    Express Interest in Volunteering
                  </button>
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      <VolunteerSheet open={open} onClose={() => setOpen(false)} readOnlyPreview={readOnlyPreview} />
    </PortalShell>
  );
}
