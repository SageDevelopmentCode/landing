"use client";

import { useRef, useState, type RefObject } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Turkey from "./Turkey";
import { FallingLeaves } from "./Dividers";
import { BG, EVENT, craftTitleList, plumageFor, type TurkeyChoice } from "./data";
import { btnPumpkin } from "./ui";

export function MobileReserveBar({
  price,
  onReserve,
  formRef,
}: {
  price: number;
  onReserve: () => void;
  formRef: RefObject<HTMLDivElement | null>;
}) {
  // Keeps the bar from sitting on top of the form and its pay button.
  const formVisible = useInView(formRef, { margin: "0px 0px -120px 0px" });
  return (
    <motion.div
      className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
      initial={{ y: 120 }}
      animate={{ y: formVisible ? 120 : 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      style={{ pointerEvents: formVisible ? "none" : "auto" }}
    >
      <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[var(--sf-ink)] py-3 pl-5 pr-3 text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">
            🦃 {EVENT.title}
          </p>
          <p className="text-xs font-bold text-white/70">{`${EVENT.shortDate} · $${price} drop-in`}</p>
        </div>
        <button
          type="button"
          onClick={onReserve}
          tabIndex={formVisible ? -1 : undefined}
          className="shrink-0 cursor-pointer rounded-full bg-[#EE8434] px-5 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_0_#C4621C] active:translate-y-0.5 active:shadow-[0_1px_0_0_#C4621C]"
        >
          Reserve →
        </button>
      </div>
    </motion.div>
  );
}

export default function FinaleTable({
  turkey,
  price,
  onReserve,
}: {
  turkey: TurkeyChoice;
  price: number;
  onReserve: () => void;
}) {
  const reduced = useReducedMotion();
  // Watch the untransformed section: the turkey starts off-screen, so it can never be "in view" itself.
  const sectionRef = useRef<HTMLElement>(null);
  const arrived = useInView(sectionRef, { once: true, margin: "-140px" });
  const [walking, setWalking] = useState(true);
  const plumage = plumageFor(turkey.plumageIndex);

  return (
    <section ref={sectionRef} className="relative overflow-hidden pb-28 pt-20 lg:pb-32" style={{ backgroundColor: BG.butter }}>
      <FallingLeaves count={8} />
      <div className="relative mx-auto max-w-3xl px-6 text-center sm:px-10">
        <motion.div
          className="mx-auto w-40 sm:w-48"
          initial={reduced ? false : { x: "-110vw" }}
          animate={reduced || arrived ? { x: 0 } : { x: "-110vw" }}
          transition={{ type: "spring", stiffness: 38, damping: 12 }}
          onAnimationComplete={() => {
            if (arrived) setWalking(false);
          }}
          aria-hidden
        >
          <Turkey
            feathers={plumage.feathers}
            accessory={turkey.accessory}
            waddling={walking && !reduced}
            gobbling={!walking && !reduced}
            className="w-full"
          />
        </motion.div>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-[#B4561A]">
          This Friday Only · {EVENT.shortDate}
        </p>
        <h2 className="sf-display mt-3 text-5xl text-[var(--sf-ink)] md:text-7xl">
          Don&apos;t miss {EVENT.title}.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">
          November 20 is one day. Spots are limited. Reserve your child&apos;s spot now and join us for{" "}
          {`${craftTitleList()} at Sage Field.`}
        </p>
        <div className="mt-8">
          <button type="button" onClick={onReserve} className={btnPumpkin}>
            {`Reserve Spot · $${price} →`}
          </button>
        </div>
        <p className="sf-hand mt-4 text-xl text-[var(--sf-soft)]">{`One Friday. $${price}. No commitment.`}</p>
      </div>
    </section>
  );
}
