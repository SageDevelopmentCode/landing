"use client";

import { useEffect, useRef, useState } from "react";

/** Replays a CSS animation class: off for a frame, then on, then off after `ms`. */
export function useReplay(ms: number) {
  const [on, setOn] = useState(false);
  const [n, setN] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const play = () => {
    window.clearTimeout(timer.current);
    setOn(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setOn(true);
        setN((x) => x + 1);
        timer.current = window.setTimeout(() => setOn(false), ms);
      }),
    );
  };
  return { on, n, play };
}
