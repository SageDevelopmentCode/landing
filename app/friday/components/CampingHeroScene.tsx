"use client";

import { motion, type MotionValue } from "framer-motion";

export const CAMPING_THEME = {
  skyPeach: "#FFF6E8",
  skyGlow: "#F3E6C8",
  sunCore: "#FFF9E1",
  duneDeep: "#C45C26",
  duneMid: "#E8A04A",
  duneLight: "#F6D7A8",
  cactusGreen: "#3E6B45",
  rockOrange: "#D97706",
  inkBrown: "#3F2E24",
  terracotta: "#B4532A",
} as const;

function Pine({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="11" y="36" width="6" height="16" rx="1" fill={CAMPING_THEME.inkBrown} />
      <polygon points="14,0 28,18 0,18" fill={CAMPING_THEME.cactusGreen} />
      <polygon points="14,12 32,30 -4,30" fill="#4E7A56" />
      <polygon points="14,24 36,44 -8,44" fill="#2F5436" />
    </g>
  );
}

function Tent({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <polygon points="0,0 72,0 36,-52" fill={CAMPING_THEME.duneMid} />
      <polygon points="10,0 62,0 36,-42" fill={CAMPING_THEME.duneLight} />
      <polygon points="28,0 44,0 36,-18" fill={CAMPING_THEME.inkBrown} opacity="0.35" />
      <line
        x1="36"
        y1="-52"
        x2="36"
        y2="0"
        stroke={CAMPING_THEME.inkBrown}
        strokeWidth="1.5"
        opacity="0.35"
      />
    </g>
  );
}

function Campfire({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="10" rx="18" ry="5" fill={CAMPING_THEME.rockOrange} opacity="0.35" />
      <rect x="-16" y="4" width="20" height="4" rx="2" transform="rotate(-22)" fill={CAMPING_THEME.inkBrown} />
      <rect x="-4" y="4" width="20" height="4" rx="2" transform="rotate(20)" fill={CAMPING_THEME.inkBrown} />
      <polygon points="0,2 -7,12 0,-12 7,12" fill={CAMPING_THEME.duneDeep} />
      <polygon points="0,5 -3,12 0,-4 3,12" fill={CAMPING_THEME.sunCore} />
    </g>
  );
}

type CampingHeroSceneProps = {
  className?: string;
  compact?: boolean;
  duneParallaxX?: MotionValue<string>;
};

export default function CampingHeroScene({
  className = "",
  compact = false,
  duneParallaxX,
}: CampingHeroSceneProps) {
  const h = compact ? 280 : 520;
  const w = compact ? 800 : 1440;
  const viewBox = compact ? "0 0 800 280" : "0 0 1440 520";

  const backHill = (
    <path
      d={`M0,${compact ? 170 : 320} C${w * 0.18},${compact ? 140 : 270} ${w * 0.36},${compact ? 185 : 350} ${w * 0.52},${compact ? 155 : 300} C${w * 0.7},${compact ? 125 : 255} ${w * 0.86},${compact ? 175 : 330} ${w},${compact ? 150 : 290} L${w},${h} L0,${h} Z`}
      fill="#6B9468"
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
        <linearGradient id="campingSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CAMPING_THEME.skyPeach} />
          <stop offset="100%" stopColor={CAMPING_THEME.skyGlow} />
        </linearGradient>
        <radialGradient id="campingSunGlow" cx="50%" cy="35%" r="35%">
          <stop offset="0%" stopColor={CAMPING_THEME.sunCore} stopOpacity="1" />
          <stop offset="40%" stopColor="#FFE4B5" stopOpacity="0.6" />
          <stop offset="100%" stopColor={CAMPING_THEME.skyGlow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={w} height={h} fill="url(#campingSky)" />

      <ellipse cx={w / 2} cy={compact ? 90 : 160} rx={compact ? 120 : 200} ry={compact ? 80 : 140} fill="url(#campingSunGlow)" />
      <circle cx={w / 2} cy={compact ? 85 : 155} r={compact ? 28 : 48} fill={CAMPING_THEME.sunCore} />

      <ellipse cx={w * 0.16} cy={compact ? 58 : 100} rx={compact ? 56 : 80} ry={compact ? 16 : 24} fill="white" opacity="0.55" />
      <ellipse cx={w * 0.22} cy={compact ? 52 : 95} rx={compact ? 36 : 50} ry={compact ? 12 : 18} fill="white" opacity="0.45" />
      <ellipse cx={w * 0.78} cy={compact ? 66 : 110} rx={compact ? 62 : 90} ry={compact ? 18 : 26} fill="white" opacity="0.5" />
      <ellipse cx={w * 0.7} cy={compact ? 60 : 105} rx={compact ? 40 : 60} ry={compact ? 14 : 20} fill="white" opacity="0.4" />

      <path d={`M${w * 0.08},48 Q${w * 0.08 + 10},40 ${w * 0.08 + 20},48 Q${w * 0.08 + 10},46 ${w * 0.08},48`} fill={CAMPING_THEME.inkBrown} opacity="0.35" />
      <path d={`M${w * 0.88},62 Q${w * 0.88 + 10},54 ${w * 0.88 + 20},62 Q${w * 0.88 + 10},60 ${w * 0.88},62`} fill={CAMPING_THEME.inkBrown} opacity="0.35" />

      <path
        d="M0,0 Q20,80 0,160 Q30,100 10,200"
        fill="none"
        stroke={CAMPING_THEME.inkBrown}
        strokeWidth="3"
        opacity="0.15"
      />
      <path
        d={`M${w},0 Q${w - 20},80 ${w},160 Q${w - 30},100 ${w - 10},200`}
        fill="none"
        stroke={CAMPING_THEME.inkBrown}
        strokeWidth="3"
        opacity="0.15"
      />

      {duneParallaxX ? (
        <motion.g style={{ x: duneParallaxX }}>{backHill}</motion.g>
      ) : (
        backHill
      )}

      <path
        d={`M0,${compact ? 210 : 390} C${w * 0.2},${compact ? 190 : 355} ${w * 0.4},${compact ? 220 : 410} ${w * 0.6},${compact ? 200 : 375} C${w * 0.8},${compact ? 185 : 345} ${w},${compact ? 205 : 385} ${w},${compact ? 205 : 385} L${w},${h} L0,${h} Z`}
        fill={CAMPING_THEME.cactusGreen}
      />

      <path
        d={`M0,${compact ? 235 : 445} C${w * 0.25},${compact ? 220 : 415} ${w * 0.5},${compact ? 245 : 460} ${w * 0.75},${compact ? 225 : 430} C${w * 0.88},${compact ? 218 : 418} ${w},${compact ? 230 : 440} ${w},${compact ? 230 : 440} L${w},${h} L0,${h} Z`}
        fill="#2F5436"
      />

      <ellipse cx={w * 0.08} cy={compact ? 248 : 478} rx={compact ? 22 : 36} ry={compact ? 12 : 18} fill={CAMPING_THEME.inkBrown} opacity="0.55" />
      <ellipse cx={w * 0.92} cy={compact ? 250 : 482} rx={compact ? 26 : 42} ry={compact ? 13 : 20} fill={CAMPING_THEME.inkBrown} opacity="0.5" />

      <Pine x={compact ? 18 : 70} y={compact ? 168 : 360} scale={compact ? 0.85 : 1.35} />
      <Pine x={compact ? 78 : 190} y={compact ? 182 : 390} scale={compact ? 0.65 : 1.05} />
      <Pine x={compact ? 620 : 1120} y={compact ? 170 : 365} scale={compact ? 0.9 : 1.4} />
      <Pine x={compact ? 690 : 1260} y={compact ? 186 : 395} scale={compact ? 0.6 : 1} />

      <Tent x={compact ? 300 : 620} y={compact ? 228 : 448} scale={compact ? 0.85 : 1.35} />
      <Campfire x={compact ? 430 : 820} y={compact ? 232 : 455} scale={compact ? 0.85 : 1.2} />
    </svg>
  );
}
