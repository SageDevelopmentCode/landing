"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import SpeedsterCar from "./SpeedsterCar";
import { liveryFor, type CarChoice } from "./data";

const VB_W = 1440;
const VB_H = 240;

const ROADS = {
  ltr: {
    road: "M-60,100 C240,70 380,170 660,160 C930,150 1040,70 1500,118",
    ground: "L1500,260 L-60,260 Z",
  },
  rtl: {
    road: "M1500,100 C1200,70 1060,170 780,160 C510,150 400,70 -60,118",
    ground: "L-60,260 L1500,260 Z",
  },
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * A stretch of road between two sections. The chosen car drives it as the
 * band passes through the viewport; `dir` alternates so the road appears to
 * snake down the page.
 */
export default function RoadBend({
  from,
  to,
  dir,
  car,
}: {
  from: string;
  to: string;
  dir: "ltr" | "rtl";
  car: CarChoice;
}) {
  const reduced = useReducedMotion();
  const bandRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const rivalRef = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 0, h: 0, len: 0 });

  const { scrollYProgress } = useScroll({
    target: bandRef,
    offset: ["start end", "end start"],
  });

  const placeOne = useCallback(
    (el: HTMLDivElement | null, progress: number) => {
      const path = pathRef.current;
      if (!el || !path || !size.current.w) return;
      const { w, h, len } = size.current;
      const at = clamp(progress) * len;
      const a = path.getPointAtLength(at);
      const b = path.getPointAtLength(Math.min(len, at + 6));
      const sx = w / VB_W;
      const sy = h / VB_H;
      const dx = (b.x - a.x) * sx;
      const dy = (b.y - a.y) * sy;
      const angle = (Math.atan2(dir === "rtl" ? -dy : dy, dir === "rtl" ? -dx : dx) * 180) / Math.PI;
      el.style.transform = `translate3d(${a.x * sx}px, ${a.y * sy}px, 0) rotate(${angle}deg)`;
      el.style.setProperty("--wheel", `${at * 2.4}deg`);
    },
    [dir],
  );

  const place = useCallback(
    (progress: number) => {
      const p = reduced ? 0.5 : progress;
      placeOne(carRef.current, p);
      placeOne(rivalRef.current, reduced ? 0.36 : p - 0.13);
    },
    [placeOne, reduced],
  );

  useMotionValueEvent(scrollYProgress, "change", place);

  useEffect(() => {
    const band = bandRef.current;
    const path = pathRef.current;
    if (!band || !path) return;
    const measure = () => {
      size.current = {
        w: band.offsetWidth,
        h: band.offsetHeight,
        len: path.getTotalLength(),
      };
      place(scrollYProgress.get());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(band);
    return () => observer.disconnect();
  }, [place, scrollYProgress]);

  const { road, ground } = ROADS[dir];
  const flipClass = dir === "rtl" ? " rc-road-car-flip" : "";

  return (
    <div ref={bandRef} className="rc-bend" style={{ background: from }} aria-hidden>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="rc-bend-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={`${road} ${ground}`} fill={to} />
        <path d={road} className="rc-bend-kerb-base" />
        <path d={road} className="rc-bend-kerb" />
        <path d={road} className="rc-bend-asphalt" />
        <path ref={pathRef} d={road} className="rc-bend-dash" />
      </svg>
      <div ref={rivalRef} className={`rc-road-car rc-road-rival${flipClass}`}>
        <SpeedsterCar livery={liveryFor(car.liveryIndex + 2)} number={(car.number % 99) + 1} />
      </div>
      <div ref={carRef} className={`rc-road-car${flipClass}`}>
        <SpeedsterCar livery={liveryFor(car.liveryIndex)} number={car.number} />
      </div>
    </div>
  );
}
