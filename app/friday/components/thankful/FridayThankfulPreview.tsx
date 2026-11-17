"use client";

import Link from "next/link";
import { useState } from "react";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/shared/billing/school-year";
import { Reveal } from "@/app/_garden/motion";
import CraftArt from "./CraftArt";
import Turkey from "./Turkey";
import { PieCrust } from "./Dividers";
import { BG, CRAFTS, DEFAULT_TURKEY, EVENT, plumageFor } from "./data";
import { AutumnPill, btnPumpkin } from "./ui";
import { useReplay } from "./hooks";
import "../../thankful.css";

const PRICE = FUN_FRIDAY_DROPIN_CENTS / 100;

/** Homepage teaser for the current Friday event, in the /friday Thankful & Grateful style. */
export default function FridayThankfulPreview() {
  const [hovered, setHovered] = useState<number | null>(null);
  const gobble = useReplay(900);
  const plumage = plumageFor(DEFAULT_TURKEY.plumageIndex);

  return (
    <div className="tg-page">
      <PieCrust top={BG.cream} bottom={BG.wheat} />
      <section
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ backgroundColor: BG.wheat }}
        aria-labelledby="tg-promo-title"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:px-16">
          <div>
            <AutumnPill tone="cranberry">
              🦃 This Friday · {EVENT.shortDate} · Limited Spots
            </AutumnPill>
            <div className="mt-5 flex items-end gap-4">
              <h2
                id="tg-promo-title"
                className="sf-display text-5xl leading-[0.95] text-[var(--sf-ink)] md:text-7xl"
              >
                {EVENT.title}
                <span className="sf-hand ml-3 inline-block -rotate-6 rounded-xl bg-[#B23A48] px-3 py-0.5 align-middle text-2xl font-normal tracking-normal text-white">
                  {EVENT.tag}
                </span>
              </h2>
            </div>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--sf-soft)]">
              Make turkey face masks, gratitude keychains, and Thanksgiving
              ceramic paintings at Sage Field.
            </p>
            <dl className="mt-6 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { term: "Feast day", value: EVENT.longDate },
                { term: "Time", value: `${EVENT.dropOff} – ${EVENT.pickUp}` },
                { term: "Entry", value: `$${PRICE} / child` },
                { term: "Ages", value: EVENT.ages },
              ].map((spec) => (
                <div
                  key={spec.term}
                  className="rounded-2xl bg-white/80 px-3 py-2.5"
                >
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-[#C4621C]">
                    {spec.term}
                  </dt>
                  <dd className="mt-0.5 text-sm font-extrabold text-[var(--sf-ink)]">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/friday" className={btnPumpkin}>
                Join the Feast →
              </Link>
              <p className="text-sm font-bold text-[var(--sf-soft)]">
                No enrollment required · One-time drop-in
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={gobble.play}
              aria-label="Make the turkey gobble"
              className="absolute -right-2 -top-16 z-10 hidden w-32 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40 sm:block lg:-top-20"
            >
              <Turkey
                feathers={plumage.feathers}
                accessory={DEFAULT_TURKEY.accessory}
                gobbling={gobble.on}
                className="w-full"
              />
            </button>
            <Reveal className="grid gap-4 sm:grid-cols-3" stagger={0.1} y={40}>
              {CRAFTS.map((craft, i) => (
                // Reveal (GSAP) animates this plain wrapper; the Link keeps its hover lift.
                <div key={craft.id} className="h-full">
                  <Link
                    href="/friday#what-we-do"
                    onPointerEnter={() => setHovered(i)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                    className="group flex h-full flex-col items-center rounded-[28px] bg-white p-5 text-center shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40"
                  >
                    <span
                      className="grid aspect-square w-28 place-items-center rounded-full"
                      style={{ backgroundColor: craft.tint }}
                    >
                      <CraftArt
                        id={craft.id}
                        active={hovered === i}
                        className="h-[74%] w-[74%]"
                      />
                    </span>
                    <span className="sf-hand mt-3 text-lg text-[#B4561A]">
                      {craft.plate}
                    </span>
                    <span className="sf-display text-lg leading-tight text-[var(--sf-ink)]">
                      {craft.title}
                    </span>
                  </Link>
                </div>
              ))}
            </Reveal>
            <p className="sf-hand mt-5 text-center text-xl text-[var(--sf-sage-deep)]">
              All activities included · mask it, string it, paint it!
            </p>
          </div>
        </div>
      </section>
      <PieCrust top={BG.wheat} bottom={BG.sage} leaves={false} flip />
    </div>
  );
}
