"use client";

import { motion, useReducedMotion, type MotionValue } from "framer-motion";

export const WIZARD_THEME = {
  skyPeach: "#F7F2FF",
  skyGlow: "#EDE4FF",
  sunCore: "#FFF8E7",
  duneDeep: "#5C3D8F",
  duneMid: "#C4A35A",
  duneLight: "#E8D9FF",
  cactusGreen: "#6B4C9A",
  rockOrange: "#D4A84B",
  inkBrown: "#2E2444",
  terracotta: "#7B4BB0",
} as const;

function Star({
  x,
  y,
  scale = 1,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <motion.g
        animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <polygon
          points="0,-8 1.8,-1.8 8,0 1.8,1.8 0,8 -1.8,1.8 -8,0 -1.8,-1.8"
          fill={WIZARD_THEME.rockOrange}
        />
      </motion.g>
    </g>
  );
}

function Mote({
  x,
  y,
  delay = 0,
  drift = 18,
}: {
  x: number;
  y: number;
  delay?: number;
  drift?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={2.4}
      fill={WIZARD_THEME.rockOrange}
      animate={{ y: [0, -drift, 0], opacity: [0.2, 0.85, 0.2] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function Tower({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const reduce = useReducedMotion();
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="-22" y="-78" width="44" height="78" fill="#F3E6C8" />
      <rect x="-22" y="-78" width="44" height="10" fill={WIZARD_THEME.duneMid} opacity="0.45" />
      <polygon points="-28,-78 0,-118 28,-78" fill={WIZARD_THEME.duneDeep} />
      <polygon points="-8,-118 0,-132 8,-118" fill={WIZARD_THEME.terracotta} />
      <rect x="-7" y="-24" width="14" height="24" rx="7" fill={WIZARD_THEME.inkBrown} />
      <motion.rect
        x="-12"
        y="-52"
        width="9"
        height="12"
        rx="1"
        fill={WIZARD_THEME.sunCore}
        animate={reduce ? undefined : { opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="3"
        y="-52"
        width="9"
        height="12"
        rx="1"
        fill={WIZARD_THEME.sunCore}
        animate={reduce ? undefined : { opacity: [1, 0.45, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

function WizardHat({
  x,
  y,
  scale = 1,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <motion.g
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <ellipse cx="0" cy="2" rx="18" ry="5" fill={WIZARD_THEME.duneDeep} />
        <polygon points="-11,0 0,-40 11,0" fill={WIZARD_THEME.terracotta} />
        <rect x="-9" y="-8" width="18" height="4" rx="1" fill={WIZARD_THEME.duneMid} />
        <circle cx="0" cy="-22" r="2.2" fill={WIZARD_THEME.sunCore} />
      </motion.g>
    </g>
  );
}

function Wand({
  x,
  y,
  scale = 1,
  rotate = -28,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x="-1.6" y="-30" width="3.2" height="34" rx="1.6" fill={WIZARD_THEME.inkBrown} />
      <polygon points="0,-40 2.6,-30 0,-33 -2.6,-30" fill={WIZARD_THEME.rockOrange} />
    </g>
  );
}

function Potion({
  x,
  y,
  scale = 1,
  liquid,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  liquid: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {!reduce &&
        [0, 0.9, 1.7].map((bubbleDelay, i) => (
          <motion.circle
            key={i}
            cx={i === 1 ? 4 : i === 2 ? -3 : 0}
            cy={-20}
            r={2}
            fill="white"
            animate={{ y: [0, -26], opacity: [0, 0.85, 0] }}
            transition={{
              duration: 2.3,
              repeat: Infinity,
              ease: "easeOut",
              delay: delay + bubbleDelay,
            }}
          />
        ))}
      <rect x="-3.5" y="-26" width="7" height="8" rx="1" fill="#F3E6C8" />
      <path
        d="M-9,-16 Q-12,-4 -8,4 Q-4,12 0,12 Q4,12 8,4 Q12,-4 9,-16 Z"
        fill={liquid}
      />
      <path
        d="M-5,-8 Q-2,-2 1,-6"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        opacity="0.7"
      />
    </g>
  );
}

type WizardHeroSceneProps = {
  className?: string;
  compact?: boolean;
  duneParallaxX?: MotionValue<string>;
};

export default function WizardHeroScene({
  className = "",
  compact = false,
  duneParallaxX,
}: WizardHeroSceneProps) {
  const h = compact ? 280 : 520;
  const w = compact ? 800 : 1440;
  const viewBox = compact ? "0 0 800 280" : "0 0 1440 520";

  const backHill = (
    <path
      d={`M0,${compact ? 170 : 320} C${w * 0.18},${compact ? 140 : 270} ${w * 0.36},${compact ? 185 : 350} ${w * 0.52},${compact ? 155 : 300} C${w * 0.7},${compact ? 125 : 255} ${w * 0.86},${compact ? 175 : 330} ${w},${compact ? 150 : 290} L${w},${h} L0,${h} Z`}
      fill="#D9C8F0"
    />
  );

  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="wizardSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={WIZARD_THEME.skyPeach} />
          <stop offset="100%" stopColor={WIZARD_THEME.skyGlow} />
        </linearGradient>
        <radialGradient id="wizardSunGlow" cx="50%" cy="35%" r="35%">
          <stop offset="0%" stopColor={WIZARD_THEME.sunCore} stopOpacity="1" />
          <stop offset="40%" stopColor="#F6E7C1" stopOpacity="0.55" />
          <stop offset="100%" stopColor={WIZARD_THEME.skyGlow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={w} height={h} fill="url(#wizardSky)" />

      <ellipse cx={w / 2} cy={compact ? 90 : 160} rx={compact ? 120 : 200} ry={compact ? 80 : 140} fill="url(#wizardSunGlow)" />
      <circle cx={w / 2} cy={compact ? 85 : 155} r={compact ? 28 : 48} fill={WIZARD_THEME.sunCore} />

      <ellipse cx={w * 0.16} cy={compact ? 58 : 100} rx={compact ? 56 : 80} ry={compact ? 16 : 24} fill="white" opacity="0.55" />
      <ellipse cx={w * 0.22} cy={compact ? 52 : 95} rx={compact ? 36 : 50} ry={compact ? 12 : 18} fill="white" opacity="0.45" />
      <ellipse cx={w * 0.78} cy={compact ? 66 : 110} rx={compact ? 62 : 90} ry={compact ? 18 : 26} fill="white" opacity="0.5" />
      <ellipse cx={w * 0.7} cy={compact ? 60 : 105} rx={compact ? 40 : 60} ry={compact ? 14 : 20} fill="white" opacity="0.4" />

      <Star x={w * 0.08} y={compact ? 32 : 58} scale={compact ? 0.7 : 1} />
      <Star x={w * 0.18} y={compact ? 72 : 128} scale={compact ? 0.45 : 0.65} delay={0.6} />
      <Star x={w * 0.34} y={compact ? 28 : 48} scale={compact ? 0.4 : 0.55} delay={1.2} />
      <Star x={w * 0.72} y={compact ? 36 : 64} scale={compact ? 0.65 : 0.9} delay={0.4} />
      <Star x={w * 0.86} y={compact ? 78 : 138} scale={compact ? 0.4 : 0.55} delay={1.5} />
      <Star x={w * 0.93} y={compact ? 26 : 46} scale={compact ? 0.5 : 0.7} delay={0.9} />

      <Mote x={w * 0.12} y={compact ? 48 : 90} delay={0.2} />
      <Mote x={w * 0.28} y={compact ? 40 : 70} delay={1.4} drift={14} />
      <Mote x={w * 0.62} y={compact ? 34 : 60} delay={0.8} drift={22} />
      <Mote x={w * 0.8} y={compact ? 55 : 100} delay={1.8} />
      <Mote x={w * 0.48} y={compact ? 24 : 42} delay={2.2} drift={12} />

      {duneParallaxX ? (
        <motion.g style={{ x: duneParallaxX }}>{backHill}</motion.g>
      ) : (
        backHill
      )}

      <path
        d={`M0,${compact ? 210 : 390} C${w * 0.2},${compact ? 190 : 355} ${w * 0.4},${compact ? 220 : 410} ${w * 0.6},${compact ? 200 : 375} C${w * 0.8},${compact ? 185 : 345} ${w},${compact ? 205 : 385} ${w},${compact ? 205 : 385} L${w},${h} L0,${h} Z`}
        fill="#F3E6C8"
      />

      <path
        d={`M0,${compact ? 235 : 445} C${w * 0.25},${compact ? 220 : 415} ${w * 0.5},${compact ? 245 : 460} ${w * 0.75},${compact ? 225 : 430} C${w * 0.88},${compact ? 218 : 418} ${w},${compact ? 230 : 440} ${w},${compact ? 230 : 440} L${w},${h} L0,${h} Z`}
        fill="#E4D2A8"
      />

      <Tower x={compact ? 40 : 90} y={compact ? 222 : 430} scale={compact ? 0.85 : 1.35} />
      <Tower x={compact ? 690 : 1280} y={compact ? 226 : 440} scale={compact ? 0.7 : 1.1} />

      <WizardHat x={compact ? 250 : 520} y={compact ? 232 : 458} scale={compact ? 0.75 : 1.15} />
      <WizardHat x={compact ? 500 : 980} y={compact ? 238 : 468} scale={compact ? 0.6 : 0.95} delay={0.8} />

      <Wand x={compact ? 180 : 360} y={compact ? 236 : 462} scale={compact ? 0.75 : 1.15} rotate={-36} />
      <Wand x={compact ? 590 : 1120} y={compact ? 240 : 470} scale={compact ? 0.7 : 1.05} rotate={24} />

      <Potion x={compact ? 340 : 700} y={compact ? 236 : 462} scale={compact ? 0.75 : 1.1} liquid={WIZARD_THEME.terracotta} />
      <Potion x={compact ? 390 : 780} y={compact ? 240 : 472} scale={compact ? 0.55 : 0.85} liquid={WIZARD_THEME.duneMid} delay={0.6} />
    </svg>
  );
}
