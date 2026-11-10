"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Droplets, Footprints, Sun } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Countdown from "../components/race/Countdown";
import SpeedsterCar, { CheckeredFlagArt } from "../components/race/SpeedsterCar";
import {
  ADDRESS,
  MAPS_URL,
  liveryFor,
  loadCarChoice,
  type CarChoice,
} from "../components/race/data";
import { kanit } from "../components/race/fonts";
import "../race.css";

const BRING = [
  { icon: Sun, item: "Sun hat" },
  { icon: Footprints, item: "Closed-toe shoes" },
  { icon: Droplets, item: "Water bottle" },
];

const RACE_DAY = [
  { term: "Date", value: "Friday, Nov 13" },
  { term: "Drop-off", value: "8:30 AM" },
  { term: "Pick-up", value: "1:30 PM" },
];

async function celebrate() {
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: 160,
    spread: 110,
    origin: { y: 0.55 },
    shapes: ["square"],
    colors: ["#1C1F2B", "#FFFDF5", "#E3241B", "#FFC800"],
  });
}

export default function RaceCarsSuccessPage() {
  const reduced = useReducedMotion();
  const [car, setCar] = useState<CarChoice | null>(null);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const load = setTimeout(() => setCar(loadCarChoice()), 0);
    const party = reduced ? undefined : setTimeout(() => void celebrate(), 900);
    return () => {
      clearTimeout(load);
      if (party) clearTimeout(party);
    };
  }, [reduced]);

  return (
    <div className={`${kanit.variable} race-page min-h-screen flex flex-col`}>
      <Navbar darkStyle />

      <main className="flex-1">
        <section className="rc-done">
          <div className="rc-done-inner">
            <h1 className="rc-done-title">You&apos;re registered!</h1>
            <p className="rc-done-lede">
              We&apos;ll see you Friday, November 13th for Race Cars and Speedsters at Sage Field. Get
              ready for Pit Crew Relay, Cardboard Speedsters, Speed Trials, and Checkered Flag Art!
            </p>
          </div>

          <div className="rc-stage rc-done-stage" aria-hidden>
            <CheckeredFlagArt className="rc-stage-flag rc-done-flag" />
            <div className="rc-road">
              <div className="rc-road-kerb" />
              <div className="rc-road-lane" />
              <div className="rc-done-line" />
            </div>
            {car && (
              <motion.div
                className="rc-done-car"
                initial={reduced ? false : { x: "-100vw" }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 55, damping: 13 }}
                onAnimationComplete={() => setArrived(true)}
              >
                <SpeedsterCar
                  livery={liveryFor(car.liveryIndex)}
                  number={car.number}
                  spinning={!arrived && !reduced}
                />
                {arrived && !reduced && (
                  <span className="rc-smoke">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </section>

        <section className="rc-done-lower rc-on-dark">
          <div className="rc-done-lower-inner">
            <div className="rc-pass">
              <div className="rc-pass-part">
                <p className="rc-eyebrow">Race day</p>
                <dl className="rc-pass-facts">
                  {RACE_DAY.map((fact) => (
                    <div key={fact.term}>
                      <dt>{fact.term}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Where</dt>
                    <dd className="rc-pass-where">
                      <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                        {ADDRESS}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rc-pass-part rc-pass-bring">
                <p className="rc-eyebrow">Bring</p>
                <ul>
                  {BRING.map(({ icon: Icon, item }) => (
                    <li key={item}>
                      <span className="rc-bag-icon" aria-hidden>
                        <Icon className="w-5 h-5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="rc-pass-note">Check your email for the full packing list.</p>
              </div>
            </div>

            <Countdown />

            <Link href="/" className="rc-btn rc-btn-flag rc-done-home">
              Back to Home
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
