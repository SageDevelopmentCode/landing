"use client";

import { useEffect, useState } from "react";
import { FRIDAY_PAGE_EVENT_COUNTDOWN_ISO } from "@/shared/marketing/friday-page-event";

type Parts = { days: number; hours: number; mins: number; secs: number };

function remaining(): Parts {
  const diff = Math.max(0, new Date(FRIDAY_PAGE_EVENT_COUNTDOWN_ISO).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

const TILE_COLORS = ["#EE8434", "#B23A48", "#C8643B", "#6b9474"];

export default function Countdown({ className = "" }: { className?: string }) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(remaining());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const units: [number | undefined, string][] = [
    [parts?.days, "days"],
    [parts?.hours, "hrs"],
    [parts?.mins, "min"],
    [parts?.secs, "sec"],
  ];

  return (
    <div className={className}>
      <p className="sf-hand text-xl text-[var(--sf-soft)]">until Friday’s feast of fun…</p>
      <div className="mt-2 flex gap-2.5" role="timer" aria-live="off">
        {units.map(([value, label], i) => (
          <div key={label} className="flex flex-col items-center">
            <span
              className="sf-display relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl text-2xl text-white shadow-[0_4px_0_0_rgba(43,42,38,0.25)] sm:h-16 sm:w-16 sm:text-3xl"
              style={{ backgroundColor: TILE_COLORS[i] }}
            >
              <span key={value} className="tg-tick tabular-nums">
                {value === undefined ? "--" : String(value).padStart(2, "0")}
              </span>
              <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/15" aria-hidden />
            </span>
            <span className="mt-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--sf-soft)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
