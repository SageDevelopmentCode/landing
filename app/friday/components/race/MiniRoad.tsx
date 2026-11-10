"use client";

import { motion } from "framer-motion";
import SpeedsterCar, { CheckeredFlagArt } from "./SpeedsterCar";
import type { Livery } from "./data";

/** A short strip of road whose car moves forward as `progress` goes from 0 to 1. */
export default function MiniRoad({
  progress,
  livery,
  number,
  label,
}: {
  progress: number;
  livery: Livery;
  number: number;
  label: string;
}) {
  const percent = Math.round(progress * 100);
  return (
    <div
      className="rc-mini-road"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="rc-mini-lane">
        <motion.div
          className="rc-mini-car"
          initial={false}
          animate={{ x: `${percent}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{ ["--wheel" as string]: `${progress * 1080}deg` }}
        >
          <SpeedsterCar livery={livery} number={number} className="rc-mini-car-art rc-wheel-ease" />
        </motion.div>
      </div>
      <CheckeredFlagArt className="rc-mini-flag" />
    </div>
  );
}
