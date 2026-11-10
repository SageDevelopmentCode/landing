import type { Livery } from "./data";

const INK = "#1C1F2B";

function Wheel({ cx, cy, r, rim }: { cx: number; cy: number; r: number; rim: string }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill="#101219" stroke="#4A5068" strokeWidth="2" />
      <circle r={r * 0.6} fill={rim} />
      <g className="rc-wheel">
        <rect x={-r * 0.56} y={-2} width={r * 1.12} height={4} fill={INK} />
        <rect x={-2} y={-r * 0.56} width={4} height={r * 1.12} fill={INK} />
      </g>
      <circle r={r * 0.17} fill={INK} />
    </g>
  );
}

export function CarArt({ livery, number }: { livery: Livery; number: number }) {
  return (
    <g>
      <rect x="28" y="38" width="7" height="24" fill={INK} />
      <path d="M12 26 H56 L50 40 H16 Z" fill={livery.trim} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="8" y="76" width="18" height="8" rx="3" fill="#9AA1B5" stroke={INK} strokeWidth="2" />
      <path
        d="M20 72 C18 58 30 52 46 52 L88 52 C94 38 130 36 136 54 L176 62 C196 65 210 72 212 80 C213 86 208 90 200 90 L34 90 C24 90 21 82 20 72 Z"
        fill={livery.body}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M86 77 L209 77 L211 83 L86 83 Z" fill={livery.trim} />
      <path d="M92 55 C98 45 126 45 132 56 Z" fill={INK} />
      <circle cx="112" cy="41" r="15" fill={livery.helmet} stroke={INK} strokeWidth="3" />
      <path d="M113 34 H125 C128 37 128 43 126 46 H113 C109 46 109 34 113 34 Z" fill="#8FD3FF" stroke={INK} strokeWidth="2.5" />
      <circle cx="68" cy="69" r="15" fill="#FFFDF5" stroke={INK} strokeWidth="3" />
      <text
        className="rc-car-num"
        x="68"
        y="76"
        textAnchor="middle"
        fontSize={number > 9 ? 17 : 20}
        fontWeight="900"
        fontStyle="italic"
        fill={INK}
        style={{ fontFamily: "var(--font-kanit), sans-serif" }}
      >
        {number}
      </text>
      <path d="M186 90 H218 L213 98 H190 Z" fill={livery.trim} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <Wheel cx={60} cy={86} r={21} rim={livery.trim} />
      <Wheel cx={176} cy={91} r={16} rim={livery.trim} />
    </g>
  );
}

export default function SpeedsterCar({
  livery,
  number,
  spinning = false,
  className = "",
  title,
}: {
  livery: Livery;
  number: number;
  spinning?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 224 110"
      xmlns="http://www.w3.org/2000/svg"
      className={`rc-car${spinning ? " rc-spinning" : ""} ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <CarArt livery={livery} number={number} />
    </svg>
  );
}

/** Seen from above, for the circuit map. Points along +x, centred on 0,0. */
export function TopCarArt({ livery }: { livery: Livery }) {
  return (
    <g>
      <rect x="-15" y="-16" width="9" height="6" rx="1.5" fill="#101219" />
      <rect x="-15" y="10" width="9" height="6" rx="1.5" fill="#101219" />
      <rect x="8" y="-15" width="8" height="5" rx="1.5" fill="#101219" />
      <rect x="8" y="10" width="8" height="5" rx="1.5" fill="#101219" />
      <path
        d="M-19 -9 C-19 -12 -16 -12 -14 -12 L8 -9 C18 -8 22 -4 22 0 C22 4 18 8 8 9 L-14 12 C-16 12 -19 12 -19 9 Z"
        fill={livery.body}
        stroke={INK}
        strokeWidth="2"
      />
      <rect x="-19" y="-2.5" width="41" height="5" fill={livery.trim} />
      <circle r="5.5" cx="-3" fill={livery.helmet} stroke={INK} strokeWidth="2" />
    </g>
  );
}

export function CheckeredFlagArt({ className = "" }: { className?: string }) {
  const cells = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      if ((row + col) % 2 === 0) {
        cells.push(<rect key={`${row}-${col}`} x={col * 9} y={row * 9} width={9} height={9} fill={INK} />);
      }
    }
  }
  return (
    <svg viewBox="0 0 64 110" className={className} aria-hidden>
      <rect x="0" y="0" width="5" height="110" rx="2" fill={INK} />
      <g className="rc-flag-cloth" transform="translate(5 3)">
        <rect width="54" height="36" fill="#FFFDF5" stroke={INK} strokeWidth="1.5" />
        {cells}
      </g>
    </svg>
  );
}
