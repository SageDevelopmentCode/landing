"use client";

import { motion, type MotionValue } from "framer-motion";

export const DESERT_THEME = {
  skyPeach: "#FFF3E4",
  skyGlow: "#FFE8CC",
  sunCore: "#FFF9E1",
  duneDeep: "#E07A2F",
  duneMid: "#F2A65A",
  duneLight: "#F7C98B",
  cactusGreen: "#4CAF50",
  rockOrange: "#D97706",
  inkBrown: "#5C3D2E",
  terracotta: "#C4603C",
} as const;

function Cactus({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="8" y="12" width="6" height="22" rx="3" fill={DESERT_THEME.cactusGreen} />
      <rect x="2" y="18" width="5" height="4" rx="2" fill={DESERT_THEME.cactusGreen} />
      <rect x="0" y="14" width="4" height="10" rx="2" fill={DESERT_THEME.cactusGreen} />
      <rect x="15" y="20" width="5" height="4" rx="2" fill={DESERT_THEME.cactusGreen} />
      <rect x="17" y="15" width="4" height="10" rx="2" fill={DESERT_THEME.cactusGreen} />
    </g>
  );
}

function Camel({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const sx = flip ? -1 : 1;
  return (
    <g transform={`translate(${x}, ${y}) scale(${sx}, 1)`}>
      <ellipse cx="0" cy="18" rx="22" ry="8" fill="#D4A574" />
      <ellipse cx="-8" cy="10" rx="6" ry="10" fill="#C4A070" />
      <ellipse cx="10" cy="8" rx="7" ry="11" fill="#C4A070" />
      <circle cx="-14" cy="4" r="4" fill="#C4A070" />
      <rect x="-3" y="16" width="3" height="8" rx="1" fill="#B8956A" />
      <rect x="6" y="16" width="3" height="8" rx="1" fill="#B8956A" />
    </g>
  );
}

function Tent({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <polygon points="0,0 28,0 14,-24" fill={DESERT_THEME.duneMid} />
      <polygon points="4,0 24,0 14,-20" fill={DESERT_THEME.duneLight} />
      <rect x="11" y="-8" width="6" height="8" rx="1" fill={DESERT_THEME.rockOrange} opacity="0.7" />
    </g>
  );
}

type DesertHeroSceneProps = {
  className?: string;
  compact?: boolean;
  duneParallaxX?: MotionValue<string>;
};

export default function DesertHeroScene({
  className = "",
  compact = false,
  duneParallaxX,
}: DesertHeroSceneProps) {
  const h = compact ? 280 : 520;
  const viewBox = compact ? "0 0 800 280" : "0 0 1440 520";

  const backDune = (
    <path
      d="M0,320 C200,280 400,340 600,300 C800,260 1000,320 1200,290 C1320,270 1440,300 1440,300 L1440,520 L0,520 Z"
      fill={DESERT_THEME.duneLight}
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
        <linearGradient id="desertSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={DESERT_THEME.skyPeach} />
          <stop offset="100%" stopColor={DESERT_THEME.skyGlow} />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="35%" r="35%">
          <stop offset="0%" stopColor={DESERT_THEME.sunCore} stopOpacity="1" />
          <stop offset="40%" stopColor="#FFE4B5" stopOpacity="0.6" />
          <stop offset="100%" stopColor={DESERT_THEME.skyGlow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1440" height={h} fill="url(#desertSky)" />

      {/* Sun glow */}
      <ellipse cx="720" cy={compact ? 90 : 160} rx={compact ? 120 : 200} ry={compact ? 80 : 140} fill="url(#sunGlow)" />
      <circle cx="720" cy={compact ? 85 : 155} r={compact ? 28 : 48} fill={DESERT_THEME.sunCore} />

      {/* Clouds */}
      <ellipse cx="200" cy={compact ? 60 : 100} rx="80" ry="24" fill="white" opacity="0.55" />
      <ellipse cx="260" cy={compact ? 55 : 95} rx="50" ry="18" fill="white" opacity="0.45" />
      <ellipse cx="1100" cy={compact ? 70 : 110} rx="90" ry="26" fill="white" opacity="0.5" />
      <ellipse cx="980" cy={compact ? 65 : 105} rx="60" ry="20" fill="white" opacity="0.4" />

      {/* Birds */}
      <path d="M120,50 Q130,42 140,50 Q130,48 120,50" fill={DESERT_THEME.inkBrown} opacity="0.35" />
      <path d="M1280,65 Q1290,57 1300,65 Q1290,63 1280,65" fill={DESERT_THEME.inkBrown} opacity="0.35" />

      {/* Branch frames */}
      <path
        d="M0,0 Q20,80 0,160 Q30,100 10,200"
        fill="none"
        stroke={DESERT_THEME.inkBrown}
        strokeWidth="3"
        opacity="0.15"
      />
      <path
        d="M1440,0 Q1420,80 1440,160 Q1410,100 1430,200"
        fill="none"
        stroke={DESERT_THEME.inkBrown}
        strokeWidth="3"
        opacity="0.15"
      />

      {/* Back dunes — optional parallax */}
      {duneParallaxX ? (
        <motion.g style={{ x: duneParallaxX }}>{backDune}</motion.g>
      ) : (
        backDune
      )}

      {/* Mid dunes */}
      <path
        d="M0,380 C180,350 360,400 540,370 C720,340 900,390 1080,360 C1260,330 1440,370 1440,370 L1440,520 L0,520 Z"
        fill={DESERT_THEME.duneMid}
      />

      {/* Foreground dunes */}
      <path
        d="M0,430 C240,400 480,450 720,420 C960,390 1200,440 1440,410 L1440,520 L0,520 Z"
        fill={DESERT_THEME.duneDeep}
      />

      {/* Rocks */}
      <ellipse cx="80" cy={compact ? 250 : 470} rx="36" ry="20" fill={DESERT_THEME.rockOrange} opacity="0.85" />
      <ellipse cx="1360" cy={compact ? 255 : 475} rx="42" ry="22" fill={DESERT_THEME.rockOrange} opacity="0.8" />

      {/* Grass tufts */}
      <ellipse cx="100" cy={compact ? 265 : 485} rx="12" ry="6" fill={DESERT_THEME.cactusGreen} opacity="0.7" />
      <ellipse cx="1340" cy={compact ? 268 : 488} rx="14" ry="7" fill={DESERT_THEME.cactusGreen} opacity="0.7" />

      {/* Cacti */}
      <Cactus x={compact ? 60 : 120} y={compact ? 210 : 400} scale={compact ? 0.9 : 1.2} />
      <Cactus x={compact ? 680 : 200} y={compact ? 220 : 420} scale={compact ? 0.7 : 1} />
      <Cactus x={compact ? 720 : 1180} y={compact ? 215 : 410} scale={compact ? 0.85 : 1.1} />

      {/* Tent & camels */}
      <Tent x={compact ? 580 : 980} y={compact ? 230 : 430} />
      <Camel x={compact ? 200 : 380} y={compact ? 235 : 430} />
      <Camel x={compact ? 420 : 720} y={compact ? 240 : 440} flip />
    </svg>
  );
}
