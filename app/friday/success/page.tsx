"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Droplets, Footprints, Sun } from "lucide-react";
import Navbar from "../../components/Navbar";
import GardenRoot from "@/app/_garden/GardenRoot";
import GardenShell from "@/app/_garden/GardenShell";
import Countdown from "../components/thankful/Countdown";
import Turkey from "../components/thankful/Turkey";
import { FallingLeaves, PieCrust } from "../components/thankful/Dividers";
import { AutumnPill, btnPumpkin } from "../components/thankful/ui";
import {
  ADDRESS,
  BG,
  EVENT,
  MAPS_URL,
  craftTitleList,
  leafConfetti,
  loadTurkeyChoice,
  plumageFor,
  type TurkeyChoice,
} from "../components/thankful/data";
import "../thankful.css";

const BRING = [
  { icon: Sun, item: "Sun hat" },
  { icon: Footprints, item: "Closed-toe shoes" },
  { icon: Droplets, item: "Water bottle" },
];

const FEAST_DAY = [
  { term: "Date", value: EVENT.weekdayDate },
  { term: "Drop-off", value: EVENT.dropOff },
  { term: "Pick-up", value: EVENT.pickUp },
];

export default function ThankfulSuccessPage() {
  const reduced = useReducedMotion();
  const [turkey, setTurkey] = useState<TurkeyChoice | null>(null);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const load = setTimeout(() => setTurkey(loadTurkeyChoice()), 0);
    const party = reduced ? undefined : setTimeout(() => void leafConfetti({ y: 0.55 }), 1200);
    return () => {
      clearTimeout(load);
      if (party) clearTimeout(party);
    };
  }, [reduced]);

  const plumage = turkey ? plumageFor(turkey.plumageIndex) : null;

  return (
    <GardenRoot>
      <GardenShell navbar={<Navbar darkStyle />} announcement={false} className="tg-page">
        <section className="relative overflow-hidden bg-[#fff8ef] pb-16 pt-32 text-center lg:pt-40">
          <FallingLeaves />
          <div className="relative mx-auto max-w-3xl px-6">
            <AutumnPill>🦃 Spot reserved</AutumnPill>
            <h1 className="sf-display mt-5 text-6xl text-[var(--sf-ink)] md:text-8xl">You&apos;re registered!</h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)] sm:text-xl">
              We&apos;ll see you {EVENT.ordinalDate} for {EVENT.title} at Sage Field. Get ready for{" "}
              {`${craftTitleList()}!`}
            </p>
          </div>

          <div className="relative mx-auto mt-10 h-64 max-w-3xl px-6" aria-hidden>
            <div className="absolute inset-x-6 bottom-0 h-16 rounded-[50%] bg-[#F6E3BF] shadow-[inset_0_-8px_0_0_rgba(200,100,59,0.15)]" />
            {turkey && plumage && (
              <motion.div
                className="absolute bottom-6 left-1/2 w-48 -ml-24"
                initial={reduced ? false : { x: "-100vw" }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 40, damping: 12 }}
                onAnimationComplete={() => setArrived(true)}
              >
                <Turkey
                  feathers={plumage.feathers}
                  accessory={turkey.accessory}
                  waddling={!arrived && !reduced}
                  gobbling={arrived && !reduced}
                  className="w-full"
                />
                {arrived && (
                  <span className="tg-bubble-stay sf-hand absolute -right-20 -top-2 block rounded-2xl border-2 border-[var(--sf-ink)] bg-white px-4 py-2 text-2xl text-[var(--sf-ink)] shadow-[0_4px_0_0_var(--sf-ink)]">
                    Gobble!
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </section>

        <PieCrust top={BG.cream} bottom={BG.wheat} />

        <section className="py-20" style={{ backgroundColor: BG.wheat }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-6 rounded-[36px] bg-white p-7 shadow-[0_30px_60px_-35px_rgba(74,52,38,0.55)] sm:p-10 md:grid-cols-2">
              <div>
                <p className="sf-hand text-2xl text-[#B23A48]">Feast day details</p>
                <dl className="mt-4 space-y-3">
                  {FEAST_DAY.map((fact) => (
                    <div key={fact.term} className="flex items-baseline gap-2">
                      <dt className="font-extrabold text-[var(--sf-ink)]">{fact.term}</dt>
                      <span className="mb-1 flex-1 border-b-2 border-dotted border-[var(--sf-ink)]/20" aria-hidden />
                      <dd className="sf-display text-lg text-[#C4621C]">{fact.value}</dd>
                    </div>
                  ))}
                  <div className="pt-1">
                    <dt className="font-extrabold text-[var(--sf-ink)]">Where</dt>
                    <dd className="mt-0.5">
                      <a
                        href={MAPS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[var(--sf-sage-deep)] underline decoration-[#F4C04E] decoration-[3px] underline-offset-4"
                      >
                        {ADDRESS} ↗
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-[28px] bg-[#fff8ef] p-6">
                <p className="sf-hand text-2xl text-[var(--sf-sage-deep)]">Bring</p>
                <ul className="mt-3 space-y-2.5">
                  {BRING.map(({ icon: Icon, item }) => (
                    <li key={item} className="flex items-center gap-3 font-extrabold text-[var(--sf-ink)]">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFE3CC] text-[#C4621C]" aria-hidden>
                        <Icon className="h-5 w-5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-bold text-[var(--sf-soft)]">Check your email for the full packing list.</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-8">
              <Countdown className="text-center [&>div]:justify-center" />
              <Link href="/" className={btnPumpkin}>
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </GardenShell>
    </GardenRoot>
  );
}
