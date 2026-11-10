"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import Countdown from "./Countdown";
import SpeedsterCar, { CheckeredFlagArt } from "./SpeedsterCar";
import { LIVERIES, liveryFor, type CarChoice } from "./data";

type Phase = "intro" | "idle" | "arming" | "hold" | "go" | "result" | "jump";

const LIGHT_COUNT = 5;

function verdict(ms: number) {
  if (ms < 230) return "Pole position!";
  if (ms < 320) return "Front row start!";
  if (ms < 450) return "Strong launch!";
  return "Engine's warm. Go again!";
}

const formatTime = (ms: number) => `${(ms / 1000).toFixed(3)}s`;

export default function StartLineHero({
  car,
  onCarChange,
  onReserve,
  price,
}: {
  car: CarChoice;
  onCarChange: (next: CarChoice) => void;
  onReserve: () => void;
  price: number;
}) {
  const reduced = useReducedMotion();
  const controls = useAnimationControls();
  const stageRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const goAt = useRef(0);

  const [phase, setPhaseState] = useState<Phase>("intro");
  const phaseRef = useRef<Phase>("intro");
  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const [lit, setLit] = useState(0);
  const [time, setTime] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [smoke, setSmoke] = useState(0);

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const stageWidth = () => stageRef.current?.offsetWidth ?? 1200;

  const rollIn = async (from: number) => {
    controls.set({ x: from, y: 0, opacity: 1 });
    setSpinning(true);
    await controls.start({ x: 0, transition: { type: "spring", stiffness: 75, damping: 14 } });
    setSpinning(false);
    setSmoke((n) => n + 1);
  };

  const launch = async (duration: number) => {
    if (reduced) return;
    setSpinning(true);
    await controls.start({
      x: stageWidth(),
      transition: { duration, ease: [0.6, 0, 0.9, 0.35] },
    });
    await rollIn(-stageWidth() * 0.45);
  };

  // Opening sequence: lights on, lights out, car arrives. Never blocks content.
  useEffect(() => {
    if (reduced) {
      controls.set({ x: 0, opacity: 1 });
      after(0, () => setPhase("idle"));
      return clearTimers;
    }
    controls.set({ x: -stageWidth() * 0.45, opacity: 1 });
    for (let i = 1; i <= LIGHT_COUNT; i++) {
      after(350 + i * 300, () => setLit(i));
    }
    after(350 + LIGHT_COUNT * 300 + 500, () => {
      setLit(0);
      setPhase("idle");
      void rollIn(-stageWidth() * 0.45);
    });
    return clearTimers;
    // Runs once on mount; the helpers only touch refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const arm = () => {
    clearTimers();
    controls.stop();
    controls.set({ x: 0, y: 0, opacity: 1 });
    setSpinning(false);
    setTime(null);
    setLit(0);
    setPhase("arming");
    for (let i = 1; i <= LIGHT_COUNT; i++) {
      after(i * 420, () => setLit(i));
    }
    const allOn = LIGHT_COUNT * 420;
    after(allOn, () => setPhase("hold"));
    after(allOn + 500 + Math.random() * 2000, () => {
      setLit(0);
      goAt.current = performance.now();
      setPhase("go");
      after(5000, () => {
        if (phaseRef.current === "go") setPhase("idle");
      });
    });
  };

  const press = () => {
    const current = phaseRef.current;
    if (current === "arming" || current === "hold") {
      clearTimers();
      setLit(0);
      setPhase("jump");
      if (!reduced) void controls.start({ x: [0, 28, 0], transition: { duration: 0.35 } });
      return;
    }
    if (current === "go") {
      clearTimers();
      const ms = Math.round(performance.now() - goAt.current);
      setTime(ms);
      setBest((prev) => (prev === null ? ms : Math.min(prev, ms)));
      setPhase("result");
      void launch(Math.min(0.75, Math.max(0.35, ms / 700)));
      return;
    }
    arm();
  };

  const hop = () => {
    if (reduced) return;
    void controls.start({ y: [0, -22, 0], transition: { duration: 0.34 } });
    setSmoke((n) => n + 1);
  };

  const pickLivery = (liveryIndex: number) => {
    onCarChange({ ...car, liveryIndex });
    hop();
  };
  const stepNumber = (delta: number) => {
    const next = ((car.number - 1 + delta + 99) % 99) + 1;
    onCarChange({ ...car, number: next });
  };

  const livery = liveryFor(car.liveryIndex);
  const isWaiting = phase === "arming" || phase === "hold";

  const buttonLabel =
    phase === "go"
      ? "Go! Tap now!"
      : isWaiting
        ? "Wait for lights out…"
        : phase === "result"
          ? "Race again"
          : phase === "jump"
            ? "Try again"
            : "Start the lights";

  const status =
    phase === "go"
      ? "Lights out!"
      : phase === "jump"
        ? "Jump start! Wait until all five lights go out."
        : phase === "result" && time !== null
          ? verdict(time)
          : isWaiting
            ? "Keep your finger ready…"
            : "Five lights come on. When they all go out, tap fast.";

  return (
    <section className="rc-hero">
      <div className="rc-hero-copy">
        <h1 className="rc-title">
          <span className="rc-title-line">Race Cars</span>
          <span className="rc-title-line rc-title-line-2">
            <span className="rc-title-and">and </span>Speedsters
          </span>
          <span className="rc-title-tag">Field Day</span>
        </h1>

        <div className="rc-hero-grid">
          <div>
            <p className="rc-hero-lede">
              Rev up for relays, cardboard race cars, and checkered-flag fun at Sage Field.
            </p>
            <div className="rc-hero-cta">
              <button type="button" onClick={onReserve} className="rc-btn rc-btn-red">
                Join the Race →
              </button>
              <a href="#what-we-do" className="rc-btn rc-btn-ghost">
                See the Activities ↓
              </a>
            </div>
          </div>

          <div className="rc-hero-side">
            <dl className="rc-specs">
              {[
                { term: "Race day", value: "Nov 13, 2026" },
                { term: "Drop-off", value: "8:30 AM" },
                { term: "Pick-up", value: "1:30 PM" },
                { term: "Ages", value: "4–11" },
                { term: "Entry", value: `$${price} per child` },
              ].map((spec) => (
                <div key={spec.term} className="rc-spec">
                  <dt>{spec.term}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
            <Countdown />
          </div>
        </div>
      </div>

      <div ref={stageRef} className="rc-stage">
        <div className={`rc-gantry${phase === "go" ? " rc-gantry-go" : ""}`} aria-hidden>
          <div className="rc-gantry-bar">
            {Array.from({ length: LIGHT_COUNT }).map((_, i) => (
              <span key={i} className={`rc-light${i < lit ? " rc-light-on" : ""}`} />
            ))}
          </div>
          {phase === "go" && <span className="rc-go-burst rc-display">Go!</span>}
        </div>
        <CheckeredFlagArt className="rc-stage-flag" />
        <div className="rc-road">
          <div className="rc-road-kerb" />
          <div className={`rc-road-lane${spinning ? " rc-road-lane-moving" : ""}`} />
        </div>
        <motion.button
          type="button"
          className="rc-stage-car"
          animate={controls}
          initial={{ opacity: 0 }}
          onClick={hop}
          aria-label={`Bounce your ${livery.name} car, number ${car.number}`}
        >
          <SpeedsterCar livery={livery} number={car.number} spinning={spinning} />
          {smoke > 0 && (
            <span key={smoke} className="rc-smoke" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          )}
        </motion.button>
      </div>

      <div className="rc-console rc-on-dark">
        <div className="rc-console-inner">
          <div className="rc-console-pick">
            <p className="rc-eyebrow" id="rc-pick-label">
              Pick your car
            </p>
            <div className="rc-swatches" role="radiogroup" aria-labelledby="rc-pick-label">
              {LIVERIES.map((option, i) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={car.liveryIndex === i}
                  aria-label={option.name}
                  title={option.name}
                  onClick={() => pickLivery(i)}
                  className={`rc-swatch${car.liveryIndex === i ? " rc-swatch-on" : ""}`}
                  style={{ background: option.body }}
                />
              ))}
            </div>
          </div>

          <div className="rc-console-number">
            <p className="rc-eyebrow">Your number</p>
            <div className="rc-stepper">
              <button type="button" onClick={() => stepNumber(-1)} aria-label="Lower race number">
                <Minus className="w-4 h-4" strokeWidth={3} />
              </button>
              <output className="rc-display" aria-live="polite">
                {car.number}
              </output>
              <button type="button" onClick={() => stepNumber(1)} aria-label="Raise race number">
                <Plus className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="rc-console-game">
            <div className="rc-game-readout" aria-live="polite">
              <p className="rc-eyebrow">Reaction test</p>
              <p className="rc-game-status">{status}</p>
              {(time !== null || best !== null) && (
                <p className="rc-game-times">
                  {time !== null && phase === "result" && <strong>{formatTime(time)}</strong>}
                  {best !== null && <span>Best {formatTime(best)}</span>}
                </p>
              )}
            </div>
            <button
              type="button"
              className={`rc-btn rc-game-btn${phase === "go" ? " rc-game-btn-go" : ""}${isWaiting ? " rc-game-btn-wait" : ""}`}
              onPointerDown={press}
              onClick={(e) => {
                // Keyboard and screen readers fire click with detail 0 and no pointer event.
                if (e.detail === 0) press();
              }}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
