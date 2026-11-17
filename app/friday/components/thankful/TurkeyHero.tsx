"use client";

import { useState } from "react";
import { Draw, Squiggle, Arrow } from "@/app/_garden/ui";
import { Magnetic } from "@/app/_garden/motion";
import Countdown from "./Countdown";
import Turkey from "./Turkey";
import { useReplay } from "./hooks";
import { FallingLeaves } from "./Dividers";
import { ACCESSORIES, EVENT, PLUMAGES, plumageFor, type TurkeyChoice } from "./data";
import { AutumnPill, btnInk, btnPumpkin } from "./ui";

const BUBBLES = ["Gobble!", "Gobble gobble!", "So grateful!", "Thank you!", "See you Friday!"];

export default function TurkeyHero({
  turkey,
  onTurkeyChange,
  onReserve,
  price,
}: {
  turkey: TurkeyChoice;
  onTurkeyChange: (next: TurkeyChoice) => void;
  onReserve: () => void;
  price: number;
}) {
  const gobble = useReplay(1100);
  const [fanKey, setFanKey] = useState(0);
  const plumage = plumageFor(turkey.plumageIndex);

  const pickPlumage = (plumageIndex: number) => {
    onTurkeyChange({ ...turkey, plumageIndex });
    setFanKey((k) => k + 1);
  };
  const pickAccessory = (accessory: TurkeyChoice["accessory"]) => {
    onTurkeyChange({ ...turkey, accessory });
    gobble.play();
  };

  const specs = [
    { term: "Date", value: EVENT.longDate },
    { term: "Drop-off", value: EVENT.dropOff },
    { term: "Pick-up", value: EVENT.pickUp },
    { term: "Ages", value: EVENT.ages },
    { term: "Entry", value: `$${price} per child` },
  ];

  return (
    <section className="relative overflow-hidden bg-[#fff8ef] pb-16 pt-28 lg:pb-24 lg:pt-36">
      <FallingLeaves />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#F4C04E]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-48 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#EE8434]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-x-14 gap-y-12 px-6 sm:px-10 lg:grid-cols-[1.08fr_1fr] lg:px-16">
        {/* Copy */}
        <div className="lg:col-start-1 lg:row-start-1">
          <AutumnPill>🍂 Field Friday · {EVENT.shortDate} · Limited spots</AutumnPill>
          <h1 className="sf-display mt-6 text-[3.6rem] leading-[0.9] text-[var(--sf-ink)] sm:text-7xl lg:text-[6.4rem]">
            <span className="block">Thankful</span>
            <span className="relative inline-block">
              <span className="text-[#EE8434]">&amp;</span> Grateful
              <Draw className="absolute -bottom-3 left-0 block w-full" delay={0.4}>
                <Squiggle className="h-4 w-full" color="#F4C04E" />
              </Draw>
            </span>
            <span className="sf-hand ml-3 inline-block -rotate-6 rounded-xl bg-[#B23A48] px-3 py-1 align-middle text-2xl font-normal tracking-normal text-white shadow-[0_4px_0_0_#7A2333] sm:text-3xl">
              {EVENT.tag}
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)] sm:text-xl">
            Turkey face masks, gratitude keychains, and Thanksgiving ceramic paintings —{" "}
            <span className="font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,#F6E3BF_60%)]">
              one cozy, crafty Friday
            </span>{" "}
            at Sage Field.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic>
              <button type="button" onClick={onReserve} className={btnPumpkin}>
                Reserve a Spot · ${price} →
              </button>
            </Magnetic>
            <a href="#what-we-do" className={btnInk}>
              See the Crafts ↓
            </a>
          </div>
        </div>

        {/* Turkey builder */}
        <div className="relative lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            <div className="absolute inset-[6%] rounded-full bg-[#F6E3BF] shadow-[inset_0_-14px_0_0_rgba(200,100,59,0.12),0_30px_60px_-35px_rgba(74,52,38,0.6)]" aria-hidden />
            <div className="absolute inset-[11%] rounded-full border-[3px] border-dashed border-[#C8643B]/30" aria-hidden />

            <button
              type="button"
              onClick={gobble.play}
              aria-label="Make your turkey gobble"
              className="group absolute inset-[8%] cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40"
            >
              <Turkey
                feathers={plumage.feathers}
                accessory={turkey.accessory}
                fanKey={`${plumage.id}-${fanKey}`}
                gobbling={gobble.on}
                className="mx-auto w-full transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.03]"
              />
            </button>

            <div className="pointer-events-none absolute right-[2%] top-[4%]" aria-live="polite">
              {gobble.on && (
                <span
                  key={gobble.n}
                  className="tg-bubble sf-hand relative block origin-bottom-left rounded-2xl border-2 border-[var(--sf-ink)] bg-white px-4 py-2 text-2xl text-[var(--sf-ink)] shadow-[0_4px_0_0_var(--sf-ink)]"
                >
                  {BUBBLES[(gobble.n - 1) % BUBBLES.length]}
                  <span className="absolute -bottom-2 left-5 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[var(--sf-ink)] bg-white" />
                </span>
              )}
            </div>

            <div className="pointer-events-none absolute -left-2 top-[10%] hidden sm:block" aria-hidden>
              <p className="sf-hand -rotate-6 text-xl text-[var(--sf-sage-deep)]">psst — tap me!</p>
              <Draw className="ml-10 block">
                <Arrow className="h-12 w-16" color="var(--sf-sage-deep)" />
              </Draw>
            </div>
          </div>

          <div className="relative mx-auto -mt-4 max-w-[460px] rounded-[28px] border-2 border-[var(--sf-ink)]/10 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)]">
            <p className="sf-display text-xl text-[var(--sf-ink)]">Dress up your turkey</p>
            <p id="tg-feather-label" className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[var(--sf-soft)]">
              Feathers · <span className="text-[#C4621C]">{plumage.name}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-labelledby="tg-feather-label">
              {PLUMAGES.map((option, i) => {
                const on = turkey.plumageIndex === i;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={option.name}
                    title={option.name}
                    onClick={() => pickPlumage(i)}
                    className={`h-11 w-11 cursor-pointer rounded-full border-[3px] transition-transform duration-200 hover:-translate-y-0.5 hover:rotate-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40 ${
                      on ? "scale-110 border-[var(--sf-ink)] shadow-[0_4px_0_0_var(--sf-ink)]" : "border-white shadow-[0_2px_8px_rgba(43,42,38,0.25)]"
                    }`}
                    style={{ background: `conic-gradient(${option.feathers.join(", ")}, ${option.feathers[0]})` }}
                  />
                );
              })}
            </div>
            <p id="tg-acc-label" className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[var(--sf-soft)]">
              Outfit
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="tg-acc-label">
              {ACCESSORIES.map((option) => {
                const on = turkey.accessory === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pickAccessory(option.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40 ${
                      on
                        ? "border-[var(--sf-ink)] bg-[#F4C04E] text-[var(--sf-ink)] shadow-[0_3px_0_0_var(--sf-ink)]"
                        : "border-[var(--sf-ink)]/15 bg-[#fff8ef] text-[var(--sf-soft)] hover:border-[var(--sf-ink)]/40"
                    }`}
                  >
                    <span aria-hidden>{option.emoji}</span>
                    {option.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Place-card specs */}
        <div className="lg:col-start-1 lg:row-start-2">
          <div className="relative rounded-[28px] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] sm:p-7" style={{ rotate: "-1.2deg" }}>
            <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-[#F4C04E]/80" aria-hidden />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.term}>
                  <dt className="text-xs font-extrabold uppercase tracking-wider text-[#C4621C]">{spec.term}</dt>
                  <dd className="sf-display mt-0.5 text-xl text-[var(--sf-ink)]">{spec.value}</dd>
                </div>
              ))}
            </dl>
            <div className="my-5 border-t-2 border-dashed border-[var(--sf-ink)]/10" aria-hidden />
            <Countdown />
          </div>
        </div>
      </div>
    </section>
  );
}
