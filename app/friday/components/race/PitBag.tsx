"use client";

import { useState } from "react";
import {
  Backpack,
  Check,
  Droplets,
  Flag,
  Footprints,
  Sandwich,
  Shirt,
  SprayCan,
  Sun,
  type LucideIcon,
} from "lucide-react";
import MiniRoad from "./MiniRoad";
import { liveryFor, type CarChoice } from "./data";

const PACKING_LIST: { icon: LucideIcon; item: string }[] = [
  { icon: Footprints, item: "Closed-toe shoes" },
  { icon: Sun, item: "Sun hat or cap" },
  { icon: SprayCan, item: "Sunscreen (applied before drop-off)" },
  { icon: Droplets, item: "Water bottle, labeled" },
  { icon: Sandwich, item: "Snack + lunch from home" },
  { icon: Shirt, item: "Old clothes for outdoor play" },
  { icon: Backpack, item: "Small backpack for paintings & creations" },
  { icon: Flag, item: "Optional racing colors or a checkered accessory" },
];

async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: 140,
    spread: 100,
    origin: { y: 0.7 },
    shapes: ["square"],
    colors: ["#1C1F2B", "#FFFDF5", "#E3241B", "#FFC800"],
  });
}

export default function PitBag({ car }: { car: CarChoice }) {
  const [packed, setPacked] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    const next = new Set(packed);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setPacked(next);
    if (next.size === PACKING_LIST.length && packed.size !== PACKING_LIST.length) void celebrate();
  };

  const allPacked = packed.size === PACKING_LIST.length;

  return (
    <section className="rc-bag">
      <div className="rc-bag-inner">
        <div className="rc-bag-head">
          <h2 className="rc-h2">Pit Bag</h2>
          <p>Tap each item to check it off — don&apos;t forget anything for Race Cars and Speedsters!</p>
        </div>

        <div className="rc-bag-grid">
          {PACKING_LIST.map(({ icon: Icon, item }, i) => {
            const isPacked = packed.has(i);
            return (
              <button
                key={item}
                type="button"
                role="checkbox"
                aria-checked={isPacked}
                onClick={() => toggle(i)}
                className={`rc-bag-item${isPacked ? " rc-bag-item-on" : ""}`}
              >
                <span className="rc-bag-icon" aria-hidden>
                  {isPacked ? <Check className="w-6 h-6" strokeWidth={3.5} /> : <Icon className="w-6 h-6" />}
                </span>
                <span>{item}</span>
              </button>
            );
          })}
        </div>

        <div className="rc-bag-progress rc-on-dark">
          <div className="rc-bag-progress-row">
            <span>Ready to Race</span>
            <span>
              {packed.size} / {PACKING_LIST.length} packed
            </span>
          </div>
          <MiniRoad
            progress={packed.size / PACKING_LIST.length}
            livery={liveryFor(car.liveryIndex)}
            number={car.number}
            label="Packing progress"
          />
        </div>

        {allPacked && <p className="rc-bag-done">All packed! See you Friday.</p>}

        <p className="rc-bag-phone rc-on-dark">
          Questions? Text or call us: <a href="tel:+15126775872">(512) 677-5872</a>
        </p>
      </div>
    </section>
  );
}
