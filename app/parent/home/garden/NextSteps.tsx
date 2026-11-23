"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Arrow, CheckIcon, SectionHeader, TINT_BG, TINT_FG, btnInkSm, type HomeTint } from "@/app/parent/_garden/ui";

export type HomeStep = {
  key: string;
  emoji: string;
  tint: HomeTint;
  title: string;
  body: ReactNode;
  cta?: { label: string; onClick?: () => void; href?: string };
  /** Inline UI under the body (e.g. the drop-off picker). */
  extra?: ReactNode;
  /** Finished steps stay visible with a check but don't count as "needs you". */
  done?: boolean;
};

export default function NextSteps({ steps }: { steps: HomeStep[] }) {
  const reduce = useReducedMotion();
  const open = steps.filter((s) => !s.done);
  const ordered = [...open, ...steps.filter((s) => s.done)];

  return (
    <section id="next-steps" aria-labelledby="home-next-steps" className="scroll-mt-28">
      <SectionHeader
        id="home-next-steps"
        title="Your next steps"
        note={open.length ? `${open.length} thing${open.length > 1 ? "s" : ""} need${open.length > 1 ? "" : "s"} you ↓` : undefined}
      />

      {ordered.length === 0 ? (
        <div className="flex items-center gap-4 rounded-[28px] bg-[var(--sf-mint)]/70 px-6 py-6">
          <span className="text-4xl" aria-hidden="true">
            🌿
          </span>
          <div>
            <p className="sf-display text-2xl leading-tight text-[var(--sf-sage-deep)]">All caught up!</p>
            <p className="text-sm font-bold text-[var(--sf-sage-deep)]/80">Nothing needs your attention right now.</p>
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-3.5">
          <AnimatePresence initial={false}>
            {ordered.map((step) => {
              const n = open.indexOf(step) + 1;
              return (
                <motion.li
                  key={step.key}
                  layout={!reduce}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-[28px] p-4 sm:p-5 ${step.done ? "bg-white/70 ring-1 ring-[var(--sf-ink)]/[0.06]" : TINT_BG[step.tint]}`}
                >
                  <div className="flex gap-3.5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${
                        step.done ? "bg-[var(--sf-sage)] text-white" : "bg-white text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.12)]"
                      }`}
                      aria-hidden="true"
                    >
                      {step.done ? <CheckIcon className="h-4 w-4" /> : <span className="sf-display">{n}</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`sf-hand text-base leading-none ${step.done ? "text-[var(--sf-sage-deep)]" : TINT_FG[step.tint]}`}>
                        {step.done ? "done ✓" : `step ${n} of ${open.length}`}
                      </p>
                      <h3 className="mt-1 text-[17px] font-extrabold leading-snug">
                        <span aria-hidden="true">{step.emoji} </span>
                        {step.title}
                      </h3>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--sf-soft)]">{step.body}</div>
                    </div>
                  </div>
                  {step.extra ? <div className="mt-4 sm:ml-[54px]">{step.extra}</div> : null}
                  {step.cta && !step.done ? (
                    <div className="mt-4 sm:ml-[54px]">
                      {step.cta.href ? (
                        <Link href={step.cta.href} className={btnInkSm}>
                          {step.cta.label} <Arrow />
                        </Link>
                      ) : (
                        <button type="button" onClick={step.cta.onClick} className={btnInkSm}>
                          {step.cta.label} <Arrow />
                        </button>
                      )}
                    </div>
                  ) : null}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}
