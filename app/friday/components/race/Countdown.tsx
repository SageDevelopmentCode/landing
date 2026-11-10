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

function Flap({ value, label }: { value: number | null; label: string }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="rc-flap-unit">
      <div className="rc-flap-digits">
        {Array.from(text).map((ch, i) => (
          <span key={`${i}-${ch}`} className="rc-flap">
            {ch}
          </span>
        ))}
      </div>
      <span className="rc-flap-label">{label}</span>
    </div>
  );
}

export default function Countdown() {
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

  return (
    <div className="rc-countdown rc-on-dark">
      <p className="rc-eyebrow rc-countdown-title">Until Friday</p>
      <div className="rc-flap-row" role="timer" aria-live="off">
        <Flap value={parts?.days ?? null} label="days" />
        <Flap value={parts?.hours ?? null} label="hrs" />
        <Flap value={parts?.mins ?? null} label="min" />
        <Flap value={parts?.secs ?? null} label="sec" />
      </div>
    </div>
  );
}
