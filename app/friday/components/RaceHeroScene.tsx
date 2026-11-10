"use client";

import { motion, type MotionValue } from "framer-motion";

export const RACE_THEME = {
  skyPeach: "#E8F3FF",
  skyGlow: "#C5DDF8",
  sunCore: "#FFF9E1",
  duneDeep: "#D62828",
  duneMid: "#F4C430",
  duneLight: "#FFF6D8",
  cactusGreen: "#3D8B4A",
  rockOrange: "#C9A227",
  inkBrown: "#1B2838",
  terracotta: "#9B1C1C",
} as const;

function CheckeredFlag({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const cells = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={col * 7}
          y={row * 7}
          width={7}
          height={7}
          fill={(row + col) % 2 === 0 ? RACE_THEME.inkBrown : "#FFFFFF"}
        />,
      );
    }
  }
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="0" y="0" width="3.5" height="92" rx="1.5" fill={RACE_THEME.inkBrown} />
      <g transform="translate(3.5, 2)">{cells}</g>
    </g>
  );
}

function RaceCar({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="48" cy="42" rx="42" ry="7" fill={RACE_THEME.inkBrown} opacity="0.16" />
      <path
        d="M10,30 C16,30 22,16 34,14 L52,12 C64,11 72,18 78,24 L92,28 C98,30 98,36 92,36 L12,36 C6,36 6,32 10,30 Z"
        fill={RACE_THEME.duneDeep}
      />
      <path d="M34,16 L52,14 L56,26 L30,28 Z" fill="#F7FBFF" />
      <path d="M58,16 L72,20 L74,26 L56,26 Z" fill="#D6E8FA" />
      <rect x="20" y="24" width="62" height="5" rx="2" fill={RACE_THEME.duneMid} />
      <circle cx="26" cy="36" r="9" fill={RACE_THEME.inkBrown} />
      <circle cx="26" cy="36" r="3.5" fill={RACE_THEME.duneMid} />
      <circle cx="74" cy="36" r="9" fill={RACE_THEME.inkBrown} />
      <circle cx="74" cy="36" r="3.5" fill={RACE_THEME.duneMid} />
      <circle cx="62" cy="26" r="7" fill="#FFFFFF" stroke={RACE_THEME.inkBrown} strokeWidth="1.2" />
      <text
        x="62"
        y="29"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={RACE_THEME.inkBrown}
        fontFamily="sans-serif"
      >
        1
      </text>
    </g>
  );
}

type RaceHeroSceneProps = {
  className?: string;
  compact?: boolean;
  duneParallaxX?: MotionValue<string>;
};

export default function RaceHeroScene({
  className = "",
  compact = false,
  duneParallaxX,
}: RaceHeroSceneProps) {
  const h = compact ? 280 : 520;
  const w = compact ? 800 : 1440;
  const viewBox = compact ? "0 0 800 280" : "0 0 1440 520";
  const groundY = compact ? 168 : 330;

  const backHill = (
    <path
      d={`M0,${groundY} C${w * 0.18},${groundY - 48} ${w * 0.38},${groundY + 10} ${w * 0.55},${groundY - 36} C${w * 0.74},${groundY - 70} ${w * 0.88},${groundY - 8} ${w},${groundY - 28} L${w},${h} L0,${h} Z`}
      fill="#B9D7F6"
    />
  );

  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="raceSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={RACE_THEME.skyPeach} />
          <stop offset="100%" stopColor={RACE_THEME.skyGlow} />
        </linearGradient>
        <radialGradient id="raceSunGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={RACE_THEME.sunCore} stopOpacity="1" />
          <stop offset="42%" stopColor="#FFE9A8" stopOpacity="0.55" />
          <stop offset="100%" stopColor={RACE_THEME.skyGlow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={w} height={h} fill="url(#raceSky)" />

      <ellipse
        cx={w * 0.78}
        cy={compact ? 62 : 108}
        rx={compact ? 90 : 170}
        ry={compact ? 58 : 110}
        fill="url(#raceSunGlow)"
      />
      <circle cx={w * 0.78} cy={compact ? 58 : 100} r={compact ? 18 : 34} fill={RACE_THEME.sunCore} />

      <ellipse cx={w * 0.16} cy={compact ? 48 : 86} rx={compact ? 46 : 84} ry={compact ? 14 : 24} fill="white" opacity="0.7" />
      <ellipse cx={w * 0.22} cy={compact ? 44 : 78} rx={compact ? 28 : 52} ry={compact ? 11 : 18} fill="white" opacity="0.55" />
      <ellipse cx={w * 0.48} cy={compact ? 36 : 64} rx={compact ? 36 : 70} ry={compact ? 12 : 20} fill="white" opacity="0.45" />

      {duneParallaxX ? <motion.g style={{ x: duneParallaxX }}>{backHill}</motion.g> : backHill}

      <path
        d={`M0,${compact ? 198 : 390} C${w * 0.22},${compact ? 184 : 360} ${w * 0.48},${compact ? 210 : 414} ${w * 0.72},${compact ? 190 : 372} C${w * 0.88},${compact ? 178 : 350} ${w},${compact ? 196 : 384} ${w},${compact ? 196 : 384} L${w},${h} L0,${h} Z`}
        fill="#4E9A58"
      />
      <path
        d={`M0,${compact ? 214 : 430} L${w},${compact ? 206 : 412} L${w},${h} L0,${h} Z`}
        fill={RACE_THEME.cactusGreen}
      />

      <path
        d={`M0,${compact ? 228 : 456} L${w},${compact ? 220 : 438} L${w},${compact ? 258 : 508} L0,${compact ? 266 : 520} Z`}
        fill={RACE_THEME.inkBrown}
      />
      <path
        d={`M0,${compact ? 228 : 456} L${w},${compact ? 220 : 438} L${w},${compact ? 226 : 446} L0,${compact ? 234 : 464} Z`}
        fill="#FFFFFF"
        opacity="0.85"
      />
      <path
        d={`M0,${compact ? 252 : 500} L${w},${compact ? 244 : 484} L${w},${compact ? 250 : 492} L0,${compact ? 258 : 508} Z`}
        fill={RACE_THEME.duneDeep}
      />
      <path
        d={`M${w * 0.08},${compact ? 242 : 478} L${w * 0.92},${compact ? 232 : 462}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={compact ? 3 : 5}
        strokeDasharray={compact ? "16 14" : "28 22"}
        strokeLinecap="butt"
        opacity="0.9"
      />

      <g>
        {Array.from({ length: compact ? 6 : 10 }).map((_, i) => {
          const x = (w / (compact ? 6 : 10)) * i;
          const y = compact ? 228 : 456;
          return (
            <rect
              key={i}
              x={x}
              y={y - (compact ? 6 : 10)}
              width={compact ? 14 : 22}
              height={compact ? 8 : 12}
              fill={i % 2 === 0 ? RACE_THEME.duneDeep : "#FFFFFF"}
            />
          );
        })}
      </g>

      <CheckeredFlag x={compact ? 470 : 1000} y={compact ? 148 : 318} scale={compact ? 0.48 : 0.72} />
      <CheckeredFlag x={compact ? 680 : 1220} y={compact ? 152 : 336} scale={compact ? 0.4 : 0.58} />
      <RaceCar x={compact ? 430 : 860} y={compact ? 188 : 392} scale={compact ? 0.85 : 1.35} />
    </svg>
  );
}
