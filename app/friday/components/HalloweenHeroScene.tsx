"use client";

import { motion, useReducedMotion, type MotionValue } from "framer-motion";

export const HALLOWEEN_THEME = {
  skyPeach: "#1A1030",
  skyGlow: "#2A1848",
  sunCore: "#FFF8DC",
  duneDeep: "#E85D04",
  duneMid: "#F4A261",
  duneLight: "#2A1844",
  cactusGreen: "#6B8F71",
  rockOrange: "#C2410C",
  inkBrown: "#4A2C2A",
  terracotta: "#D4532B",
} as const;

const GLOW = "#FFE08A";
const NIGHT = "#07040F";

function Star({
  x,
  y,
  delay = 0,
  r = 1.6,
}: {
  x: number;
  y: number;
  delay?: number;
  r?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={r}
      fill={HALLOWEEN_THEME.sunCore}
      animate={reduce ? { opacity: 0.85 } : { opacity: [0.2, 1, 0.2] }}
      transition={reduce ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function BareTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} fill="none" stroke={NIGHT} strokeLinecap="round">
      <path d="M0,8 L2,-78" strokeWidth="5" />
      <path d="M2,-34 L-24,-52 M1,-48 L22,-66 M2,-60 L-14,-78 M0,-22 L16,-34" strokeWidth="2.4" />
    </g>
  );
}

function Fence({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} fill={NIGHT}>
      <path d="M0,0 L88,-10" stroke={NIGHT} strokeWidth="3" />
      <path d="M4,-16 L80,-24" stroke={NIGHT} strokeWidth="2.4" />
      {[0, 22, 44, 66, 86].map((post) => (
        <rect key={post} x={post} y={-28 - post * 0.08} width="4" height="32" rx="1" />
      ))}
    </g>
  );
}

function Fog({
  cx,
  cy,
  rx,
  delay = 0,
}: {
  cx: number;
  cy: number;
  rx: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry="16"
      fill="#E4D8F5"
      animate={reduce ? { x: 0, opacity: 0.16 } : { x: [-28, 36, -28], opacity: [0.1, 0.22, 0.1] }}
      transition={reduce ? { duration: 0 } : { duration: 16, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function Pumpkin({
  x,
  y,
  scale = 1,
  startled = false,
}: {
  x: number;
  y: number;
  scale?: number;
  startled?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="16" ry="10" fill={GLOW} opacity="0.45" filter="url(#lanternGlow)" />
      <ellipse cx="0" cy="6" rx="16" ry="4" fill={NIGHT} opacity="0.35" />
      <ellipse cx="0" cy="-2" rx="14" ry="12" fill={HALLOWEEN_THEME.duneDeep} />
      <ellipse cx="-7" cy="-1" rx="6" ry="11" fill={HALLOWEEN_THEME.terracotta} />
      <ellipse cx="7" cy="-1" rx="6" ry="11" fill={HALLOWEEN_THEME.rockOrange} />
      <path
        d="M-2,-12 Q0,-18 3,-11"
        fill="none"
        stroke={HALLOWEEN_THEME.cactusGreen}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <ellipse cx="4" cy="-14" rx="3.2" ry="1.6" fill={HALLOWEEN_THEME.cactusGreen} transform="rotate(-30 4 -14)" />
      <motion.g
        animate={
          reduce
            ? { opacity: startled ? 1 : 0.8 }
            : startled
              ? { opacity: [0.4, 1, 0.3, 1] }
              : { opacity: [0.55, 1, 0.55] }
        }
        transition={
          reduce || !startled
            ? { duration: 2.4, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }
            : { duration: 0.7, ease: "easeInOut" }
        }
      >
        <polygon points="-6,-5 -2,-1 -8,-1" fill={GLOW} />
        <polygon points="6,-5 8,-1 2,-1" fill={GLOW} />
        <polygon points="-5,2 -2,5 0,3 2,5 5,2 2,6 -2,6" fill={GLOW} />
      </motion.g>
    </g>
  );
}

function Bat({
  y,
  from,
  to,
  delay = 0,
  duration = 16,
}: {
  y: number;
  from: number;
  to: number;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      animate={reduce ? { x: from, y } : { x: [from, to], y: [y, y - 16, y + 8, y] }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration, repeat: Infinity, ease: "linear", delay }
      }
    >
      <motion.g
        animate={reduce ? undefined : { scaleY: [1, 0.35, 1] }}
        transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <path
          d="M0,0 C-4,-1 -12,-9 -16,-3 C-12,1 -6,2 0,2 C6,2 12,1 16,-3 C12,-9 4,-1 0,0 Z"
          fill="#D9CCEF"
        />
      </motion.g>
      <ellipse cx="0" cy="1" rx="2.2" ry="2.6" fill="#D9CCEF" />
    </motion.g>
  );
}

function Ghost({
  x,
  y,
  scale = 1,
  delay = 0,
  interactive = false,
  startled = false,
  onSayBoo,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
  interactive?: boolean;
  startled?: boolean;
  onSayBoo?: () => void;
}) {
  const reduce = useReducedMotion();
  const hop = startled && !reduce;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Say boo" : undefined}
      className={interactive ? "halloween-ghost-btn" : undefined}
      onClick={interactive ? onSayBoo : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSayBoo?.();
              }
            }
          : undefined
      }
    >
      {interactive && (
        <circle className="halloween-ghost-ring" cx="0" cy="-8" r="26" fill="none" stroke={HALLOWEEN_THEME.duneDeep} strokeWidth="2" />
      )}
      <motion.g
        animate={reduce ? undefined : hop ? { y: [0, -28, 0] } : { y: [0, -10, 0] }}
        transition={
          hop
            ? { duration: 0.45, ease: "easeOut" }
            : { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay }
        }
      >
        <ellipse cx="0" cy="-6" rx="22" ry="26" fill="#FFF6EB" opacity="0.28" />
        <path
          d="M-16,10 Q-16,-22 0,-30 Q16,-22 16,10 Q10,4 6,10 Q2,4 -2,10 Q-8,4 -16,10 Z"
          fill="#FFFDF8"
        />
        <motion.ellipse
          cx="-5"
          cy="-8"
          rx="2.1"
          ry="2.4"
          fill={HALLOWEEN_THEME.inkBrown}
          animate={reduce ? undefined : { scaleY: [1, 1, 0.12, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.86, 0.92, 1], delay }}
        />
        <motion.ellipse
          cx="5"
          cy="-8"
          rx="2.1"
          ry="2.4"
          fill={HALLOWEEN_THEME.inkBrown}
          animate={reduce ? undefined : { scaleY: [1, 1, 0.12, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.86, 0.92, 1], delay }}
        />
        <path
          d="M-4,-1 Q0,3 4,-1"
          fill="none"
          stroke={HALLOWEEN_THEME.inkBrown}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {startled && (
          <text
            x="-46"
            y="-16"
            aria-hidden
            fill="#FFF6EB"
            fontSize="16"
            fontWeight="700"
            fontFamily="var(--font-bebas-neue), sans-serif"
          >
            Boo!
          </text>
        )}
      </motion.g>
    </g>
  );
}

type HalloweenHeroSceneProps = {
  className?: string;
  compact?: boolean;
  duneParallaxX?: MotionValue<string>;
  interactive?: boolean;
  startled?: boolean;
  onSayBoo?: () => void;
};

export default function HalloweenHeroScene({
  className = "",
  compact = false,
  duneParallaxX,
  interactive = false,
  startled = false,
  onSayBoo,
}: HalloweenHeroSceneProps) {
  const h = compact ? 280 : 520;
  const w = compact ? 800 : 1440;
  const viewBox = compact ? "0 0 800 280" : "0 0 1440 520";

  const backHill = (
    <path
      d={`M0,${compact ? 170 : 320} C${w * 0.18},${compact ? 140 : 270} ${w * 0.36},${compact ? 185 : 350} ${w * 0.52},${compact ? 155 : 300} C${w * 0.7},${compact ? 125 : 255} ${w * 0.86},${compact ? 175 : 330} ${w},${compact ? 150 : 290} L${w},${h} L0,${h} Z`}
      fill="#3A2468"
    />
  );

  return (
    <>
      {interactive && (
        <style>{`
          .halloween-ghost-btn { cursor: pointer; pointer-events: auto; }
          .halloween-ghost-btn:focus { outline: none; }
          .halloween-ghost-ring { opacity: 0; }
          .halloween-ghost-btn:focus-visible .halloween-ghost-ring { opacity: 1; }
        `}</style>
      )}
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        aria-hidden={interactive ? undefined : true}
      >
        <g aria-hidden={interactive ? true : undefined}>
          <defs>
            <linearGradient id="halloweenSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12081F" />
              <stop offset="100%" stopColor="#2A1848" />
            </linearGradient>
            <radialGradient id="halloweenMoonGlow" cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor={HALLOWEEN_THEME.sunCore} stopOpacity="0.95" />
              <stop offset="28%" stopColor="#FFF6EB" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#2A1848" stopOpacity="0" />
            </radialGradient>
            <filter id="lanternGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>

          <rect width={w} height={h} fill="url(#halloweenSky)" />

          <ellipse cx={w * 0.72} cy={compact ? 72 : 128} rx={compact ? 120 : 210} ry={compact ? 78 : 140} fill="url(#halloweenMoonGlow)" />
          <circle cx={w * 0.72} cy={compact ? 68 : 118} r={compact ? 22 : 40} fill={HALLOWEEN_THEME.sunCore} />
          <circle cx={w * 0.72 - (compact ? 6 : 10)} cy={compact ? 62 : 108} r={compact ? 4 : 7} fill="#F0DDB4" />
          <circle cx={w * 0.72 + (compact ? 7 : 12)} cy={compact ? 74 : 128} r={compact ? 2.5 : 4.5} fill="#F3E4C0" />

          <Star x={w * 0.08} y={compact ? 28 : 48} delay={0.2} />
          <Star x={w * 0.16} y={compact ? 52 : 92} delay={1.1} r={1.2} />
          <Star x={w * 0.28} y={compact ? 24 : 40} delay={0.6} r={2} />
          <Star x={w * 0.4} y={compact ? 46 : 78} delay={1.6} />
          <Star x={w * 0.52} y={compact ? 22 : 36} delay={0.4} r={1.3} />
          <Star x={w * 0.62} y={compact ? 40 : 70} delay={1.3} />
          <Star x={w * 0.86} y={compact ? 30 : 52} delay={0.8} r={1.8} />
          <Star x={w * 0.93} y={compact ? 58 : 96} delay={1.8} r={1.1} />

          <Bat y={compact ? 48 : 88} from={-24} to={w + 24} duration={compact ? 12 : 18} />
          <Bat y={compact ? 78 : 140} from={w + 20} to={-30} delay={1.4} duration={compact ? 15 : 22} />

          {duneParallaxX ? (
            <motion.g style={{ x: duneParallaxX }}>{backHill}</motion.g>
          ) : (
            backHill
          )}

          <path
            d={`M0,${compact ? 210 : 390} C${w * 0.2},${compact ? 190 : 355} ${w * 0.4},${compact ? 220 : 410} ${w * 0.6},${compact ? 200 : 375} C${w * 0.8},${compact ? 185 : 345} ${w},${compact ? 205 : 385} ${w},${compact ? 205 : 385} L${w},${h} L0,${h} Z`}
            fill="#241438"
          />

          <path
            d={`M0,${compact ? 235 : 445} C${w * 0.25},${compact ? 220 : 415} ${w * 0.5},${compact ? 245 : 460} ${w * 0.75},${compact ? 225 : 430} C${w * 0.88},${compact ? 218 : 418} ${w},${compact ? 230 : 440} ${w},${compact ? 230 : 440} L${w},${h} L0,${h} Z`}
            fill="#1A1030"
          />

          <BareTree x={compact ? 70 : 140} y={compact ? 228 : 448} scale={compact ? 0.7 : 1.15} />
          <BareTree x={compact ? 730 : 1320} y={compact ? 232 : 456} scale={compact ? 0.5 : 0.85} />
          <Fence x={compact ? 250 : 460} y={compact ? 236 : 458} scale={compact ? 0.7 : 1.1} />

          <Fog cx={w * 0.3} cy={compact ? 230 : 450} rx={compact ? 90 : 160} />
          <Fog cx={w * 0.7} cy={compact ? 240 : 470} rx={compact ? 110 : 200} delay={2} />

          <Pumpkin x={compact ? 90 : 180} y={compact ? 228 : 448} scale={compact ? 0.7 : 1.05} startled={startled} />
          <Pumpkin x={compact ? 150 : 280} y={compact ? 234 : 462} scale={compact ? 0.5 : 0.75} startled={startled} />
          <Pumpkin x={compact ? 420 : 760} y={compact ? 232 : 456} scale={compact ? 0.85 : 1.25} startled={startled} />
          <Pumpkin x={compact ? 490 : 900} y={compact ? 238 : 470} scale={compact ? 0.55 : 0.85} startled={startled} />
          <Pumpkin x={compact ? 640 : 1180} y={compact ? 230 : 452} scale={compact ? 0.75 : 1.1} startled={startled} />
          <Pumpkin x={compact ? 700 : 1300} y={compact ? 236 : 466} scale={compact ? 0.48 : 0.7} startled={startled} />
        </g>

        <Ghost
          x={compact ? 520 : 1040}
          y={compact ? 188 : 392}
          scale={compact ? 0.8 : 1.2}
          interactive={interactive}
          startled={startled}
          onSayBoo={onSayBoo}
        />
      </svg>
    </>
  );
}
