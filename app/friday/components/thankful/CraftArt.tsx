"use client";

import { useId } from "react";
import type { CraftId } from "./data";

const MASK_FEATHERS = [
  { angle: -62, color: "#B23A48" },
  { angle: -31, color: "#EE8434" },
  { angle: 0, color: "#F4C04E" },
  { angle: 31, color: "#EE8434" },
  { angle: 62, color: "#B23A48" },
];

function MaskArt({ active }: { active: boolean }) {
  return (
    <>
      <path d="M8 66 Q 16 60 26 64 M112 66 Q 104 60 94 64" stroke="#2b2a26" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="3 3" fill="none" />
      <g transform="translate(60 58)">
        {MASK_FEATHERS.map(({ angle, color }) => (
          <ellipse
            key={angle}
            className="tg-art-feather"
            cx="0"
            cy="-26"
            rx="10"
            ry="27"
            fill={color}
            stroke="#000"
            strokeOpacity="0.1"
            style={{ transform: `rotate(${active ? angle : angle * 0.35}deg)` }}
          />
        ))}
      </g>
      <path d="M24 66 C24 50 40 44 60 44 C80 44 96 50 96 66 C96 82 82 88 60 88 C38 88 24 82 24 66 Z" fill="#9A6143" />
      <ellipse cx="45" cy="63" rx="9" ry="7" fill="#fff8ef" stroke="#6E4229" strokeWidth="2.5" />
      <ellipse cx="75" cy="63" rx="9" ry="7" fill="#fff8ef" stroke="#6E4229" strokeWidth="2.5" />
      <path d="M53 70 L67 70 L60 81 Z" fill="#F4A93B" />
      <path d="M64 74 C 71 78, 71 90, 66 93 C 61 95, 59 86, 64 74 Z" fill="#D9434F" />
      <circle cx="34" cy="76" r="2" fill="#F4C04E" />
      <circle cx="88" cy="74" r="2" fill="#F4C04E" />
      <circle cx="40" cy="52" r="1.6" fill="#fff" opacity="0.8" />
    </>
  );
}

const BEADS = ["T", "H", "A", "N", "K", "S"];
const BEAD_COLORS = ["#EE8434", "#F4C04E", "#B23A48", "#6b9474", "#C8643B", "#5B8DC9"];

function KeychainArt() {
  return (
    <g className="tg-keychain">
      <circle cx="60" cy="12" r="9" fill="none" stroke="#9AA0A6" strokeWidth="4" />
      <circle cx="60" cy="12" r="9" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      <path d="M60 21 L60 96" stroke="#7A2333" strokeWidth="2" />
      {BEADS.map((letter, i) => (
        <g key={letter} transform={`translate(60 ${30 + i * 12.5})`}>
          <rect x="-7" y="-6" width="14" height="12" rx="3.5" fill={BEAD_COLORS[i]} stroke="#000" strokeOpacity="0.12" />
          <text
            x="0"
            y="3.4"
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#fff"
            style={{ fontFamily: "var(--font-sf-display), sans-serif" }}
          >
            {letter}
          </text>
        </g>
      ))}
      <path
        d="M60 116 C 46 106, 48 96, 55 96 C 58 96, 60 99, 60 101 C 60 99, 62 96, 65 96 C 72 96, 74 106, 60 116 Z"
        fill="#B23A48"
      />
      <circle cx="56" cy="101" r="1.6" fill="#fff" opacity="0.8" />
    </g>
  );
}

function CeramicArt({ active }: { active: boolean }) {
  const clip = `tg-clip${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <ellipse cx="40" cy="74" rx="22" ry="30" />
          <ellipse cx="80" cy="74" rx="22" ry="30" />
          <ellipse cx="60" cy="74" rx="24" ry="32" />
        </clipPath>
      </defs>
      <ellipse cx="60" cy="106" rx="44" ry="6" fill="#000" opacity="0.08" />
      <g stroke="#D8CFC4" strokeWidth="2.5" fill="#F7F2EA">
        <ellipse cx="40" cy="74" rx="22" ry="30" />
        <ellipse cx="80" cy="74" rx="22" ry="30" />
        <ellipse cx="60" cy="74" rx="24" ry="32" />
      </g>
      <g clipPath={`url(#${clip})`} fill="none" strokeLinecap="round">
        <path className="tg-paint" pathLength={1} d="M14 52 L106 52" stroke="#EE8434" strokeWidth="16" />
        <path className="tg-paint" pathLength={1} d="M106 68 L14 68" stroke="#EE8434" strokeWidth="16" style={{ transitionDelay: "0.25s" }} />
        <path className="tg-paint" pathLength={1} d="M14 84 L106 84" stroke="#E2742A" strokeWidth="16" style={{ transitionDelay: "0.5s" }} />
        <path className="tg-paint" pathLength={1} d="M106 100 L14 100" stroke="#E2742A" strokeWidth="16" style={{ transitionDelay: "0.75s" }} />
      </g>
      <g fill="none" stroke="#C4621C" strokeOpacity={active ? 0.55 : 0} strokeWidth="2" style={{ transition: "stroke-opacity 0.6s 1s" }}>
        <path d="M60 44 C 52 60, 52 90, 60 104" />
        <path d="M44 48 C 34 64, 36 92, 46 102" />
        <path d="M76 48 C 86 64, 84 92, 74 102" />
      </g>
      <path d="M58 44 C 56 36, 58 30, 64 26" stroke="#6b9474" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M64 34 C 74 26, 86 30, 88 36 C 78 40, 70 40, 64 34 Z" fill={active ? "#6b9474" : "#F7F2EA"} stroke="#4a6354" strokeWidth="1.5" style={{ transition: "fill 0.5s 1.1s" }} />
      <g
        className="tg-brush"
        style={{ transform: active ? "translate(34px, 34px) rotate(-28deg)" : "translate(-6px, 8px) rotate(-28deg)", opacity: active ? 0 : 1 }}
      >
        <rect x="70" y="10" width="7" height="34" rx="3" fill="#C8643B" />
        <rect x="69" y="42" width="9" height="8" rx="1.5" fill="#9AA0A6" />
        <path d="M69 50 Q 73.5 64 78 50 Z" fill="#EE8434" />
      </g>
    </>
  );
}

/** Illustrated craft for a station. `active` plays its "being made" animation. */
export default function CraftArt({ id, active, className = "" }: { id: CraftId; active: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`${active ? "tg-on " : ""}overflow-visible ${className}`} aria-hidden>
      {id === "mask" && <MaskArt active={active} />}
      {id === "keychain" && <KeychainArt />}
      {id === "ceramic" && <CeramicArt active={active} />}
    </svg>
  );
}
