"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion, type AnimationPlaybackControls } from "framer-motion";
import { Check } from "lucide-react";
import { TopCarArt } from "./SpeedsterCar";
import StationGlyph from "./StationGlyph";
import { STATIONS, liveryFor, type CarChoice, type StationId } from "./data";

const INK = "#1C1F2B";
const CIRCUIT =
  "M120,62 C200,30 300,58 380,58 C470,58 496,128 468,186 C444,238 382,228 342,252 C304,276 328,338 398,344 C456,350 462,392 402,392 L132,392 C62,392 30,346 40,288 C48,232 90,212 90,160 C90,118 84,84 120,62 Z";

/** Where the car parks for each station, and where its pin sits in the infield. */
const STOPS: Record<StationId, { road: [number, number]; pin: [number, number] }> = {
  relay: { road: [380, 58], pin: [380, 132] },
  cardboard: { road: [342, 252], pin: [446, 288] },
  trials: { road: [260, 392], pin: [250, 318] },
  art: { road: [90, 160], pin: [172, 168] },
};

export default function StationsCircuit({
  car,
  onReserve,
  children,
}: {
  car: CarChoice;
  onReserve: () => void;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { margin: "80px" });

  const position = useRef(0);
  const length = useRef(0);
  const stops = useRef<number[]>([]);
  const driving = useRef<AnimationPlaybackControls | null>(null);

  const [active, setActive] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<number>>(new Set());

  const place = useCallback((at: number) => {
    const path = pathRef.current;
    const carEl = carRef.current;
    const total = length.current;
    if (!path || !carEl || !total) return;
    const wrapped = ((at % total) + total) % total;
    position.current = wrapped;
    const a = path.getPointAtLength(wrapped);
    const b = path.getPointAtLength((wrapped + 3) % total);
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    carEl.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    length.current = total;
    stops.current = STATIONS.map(({ id }) => {
      const [x, y] = STOPS[id].road;
      let best = 0;
      let bestDist = Infinity;
      for (let at = 0; at < total; at += 2) {
        const p = path.getPointAtLength(at);
        const dist = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = at;
        }
      }
      return best;
    });
    place(stops.current[0]);
  }, [place]);

  // The car laps on its own until someone picks a station.
  useEffect(() => {
    if (!inView || reduced || active !== null) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      place(position.current + (now - last) * 0.09);
      last = now;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, active, place]);

  useEffect(() => () => driving.current?.stop(), []);

  const driveTo = (index: number) => {
    setActive(index);
    setVisited((prev) => new Set(prev).add(index));
    const total = length.current;
    const target = stops.current[index];
    if (!total || target === undefined) return;
    driving.current?.stop();
    if (reduced) {
      place(target);
      return;
    }
    const from = position.current;
    const distance = (((target - from) % total) + total) % total;
    driving.current = animate(0, distance, {
      duration: 0.45 + (distance / total) * 1.5,
      ease: "easeInOut",
      onUpdate: (v) => place(from + v),
    });
  };

  const allVisited = visited.size === STATIONS.length;

  return (
    <section id="what-we-do" className="rc-map">
      <div className="rc-wrap">
        <div className="rc-map-head">
          <div>
            <p className="rc-eyebrow">This Friday&apos;s Theme</p>
            <h2 className="rc-h2">
              Five Hours of Race Cars and Speedsters
            </h2>
          </div>
          <div className="rc-map-progress">
            <p>
              {allVisited
                ? "Green flag — every station is open"
                : `Tap a station · ${visited.size} of ${STATIONS.length}`}
            </p>
            <div className="rc-pips" aria-hidden>
              {STATIONS.map((station, i) => (
                <span key={station.id} className={`rc-pip${visited.has(i) ? " rc-pip-on" : ""}`} />
              ))}
            </div>
            {allVisited && (
              <button type="button" onClick={onReserve} className="rc-btn rc-btn-red">
                Reserve a spot →
              </button>
            )}
          </div>
        </div>

        <div className="rc-map-grid">
          <div ref={panelRef} className="rc-circuit">
            <svg viewBox="0 0 520 430" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d={CIRCUIT} className="rc-circuit-kerb" />
              <path d={CIRCUIT} className="rc-circuit-kerb-red" />
              <path ref={pathRef} d={CIRCUIT} className="rc-circuit-road" />
              <path d={CIRCUIT} className="rc-circuit-dash" />
              {STATIONS.map((station, i) => {
                const [x, y] = STOPS[station.id].pin;
                return (
                  <g
                    key={station.id}
                    transform={`translate(${x} ${y})`}
                    className={`rc-station-pin${active === i ? " rc-station-pin-on" : ""}`}
                    onClick={() => driveTo(i)}
                  >
                    <circle className="rc-pin-ring" r="32" fill={station.color} stroke={INK} strokeWidth="3" />
                    <g transform="translate(-20 -20) scale(0.625)">
                      <StationGlyph id={station.id} />
                    </g>
                  </g>
                );
              })}
              <g ref={carRef} transform="translate(380 58)">
                <g transform="scale(1.05)">
                  <TopCarArt livery={liveryFor(car.liveryIndex)} />
                </g>
              </g>
            </svg>
          </div>

          <div className="rc-station-list">
            {STATIONS.map((station, i) => (
              <button
                key={station.id}
                type="button"
                aria-pressed={active === i}
                onClick={() => driveTo(i)}
                className={`rc-station${active === i ? " rc-station-on" : ""}`}
                style={{ ["--station" as string]: station.color }}
              >
                <svg viewBox="0 0 64 64" className="rc-station-icon" aria-hidden>
                  <StationGlyph id={station.id} />
                </svg>
                <span>
                  <span className="rc-station-way block">{station.waypoint}</span>
                  <span className="rc-station-title block">{station.title}</span>
                  <span className="rc-station-desc block">{station.desc}</span>
                </span>
                {visited.has(i) ? (
                  <span className="rc-station-check">
                    <Check className="w-4 h-4" strokeWidth={3.5} />
                  </span>
                ) : (
                  <span className="rc-station-spacer" />
                )}
              </button>
            ))}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
