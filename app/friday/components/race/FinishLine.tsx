"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type RefObject } from "react";
import SpeedsterCar from "./SpeedsterCar";
import { liveryFor, type CarChoice } from "./data";

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
      className="rc-sticky lg:hidden rc-on-dark"
      initial={{ y: 110 }}
      animate={{ y: formVisible ? 110 : 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      style={{ pointerEvents: formVisible ? "none" : "auto" }}
    >
      <div className="rc-sticky-inner">
        <div>
          <p className="rc-sticky-title">Race Cars and Speedsters · Nov 13</p>
          <p className="rc-sticky-sub">{`$${price} drop-in — limited spots`}</p>
        </div>
        <button
          type="button"
          onClick={onReserve}
          className="rc-btn rc-btn-flag"
          tabIndex={formVisible ? -1 : undefined}
        >
          Reserve →
        </button>
      </div>
    </motion.div>
  );
}

export default function FinishLine({
  car,
  price,
  onReserve,
}: {
  car: CarChoice;
  price: number;
  onReserve: () => void;
}) {
  const reduced = useReducedMotion();
  // Watch the untransformed section: the car itself starts off-screen, so it can never be "in view".
  const sectionRef = useRef<HTMLElement>(null);
  const arrived = useInView(sectionRef, { once: true, margin: "-140px" });
  return (
    <section ref={sectionRef} className="rc-finish">
      <div className="rc-finish-band" aria-hidden />
      <div className="rc-finish-inner">
        <motion.div
          className="rc-finish-car"
          initial={reduced ? false : { x: "-100vw" }}
          animate={reduced || arrived ? { x: 0 } : { x: "-100vw" }}
          transition={{ type: "spring", stiffness: 60, damping: 13 }}
          aria-hidden
        >
          <SpeedsterCar livery={liveryFor(car.liveryIndex)} number={car.number} />
        </motion.div>
        <p className="rc-eyebrow">This Friday Only · Nov 13</p>
        <h2 className="rc-h2">Don&apos;t miss Race Cars and Speedsters.</h2>
        <p className="rc-finish-copy">
          November 13 is one day. Spots are limited. Reserve your child&apos;s spot now and join us for
          Pit Crew Relay, Cardboard Speedsters, Speed Trials, and Checkered Flag Art at Sage Field.
        </p>
        <button type="button" onClick={onReserve} className="rc-btn rc-btn-red">
          {`Reserve Spot · $${price} →`}
        </button>
        <p className="rc-finish-note">{`One Friday. $${price}. No commitment.`}</p>
      </div>
    </section>
  );
}
