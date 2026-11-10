"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/** Media query for "animate fully": desktop pointer + no reduced-motion preference. */
export const MQ_DESKTOP_MOTION =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
/** Any screen size, motion allowed. */
export const MQ_MOTION = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
