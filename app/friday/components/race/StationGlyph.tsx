import type { StationId } from "./data";

const INK = "#1C1F2B";

/** Station icons drawn on a 64×64 grid. */
export default function StationGlyph({ id }: { id: StationId }) {
  if (id === "paintCars") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M21 28 L27 13 H44 L47 28 Z" fill="#E0B77A" />
        <rect x="6" y="27" width="52" height="20" rx="2" fill="#C99A5B" />
        <circle cx="33" cy="37" r="6.5" fill="#FFFDF5" strokeWidth="2.5" />
        <circle cx="18" cy="49" r="8.5" fill="#101219" />
        <circle cx="47" cy="49" r="8.5" fill="#101219" />
        <path
          d="M8 8 L14 20"
          stroke="#E3241B"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }
  if (id === "checkeredFlags") {
    const cells = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if ((row + col) % 2 === 0) {
          cells.push(
            <rect
              key={`${row}-${col}`}
              x={17 + col * 10}
              y={8 + row * 10}
              width={10}
              height={10}
              fill={INK}
            />,
          );
        }
      }
    }
    return (
      <g>
        <rect x="11" y="4" width="6" height="56" rx="2" fill={INK} />
        <rect x="17" y="8" width="40" height="30" fill="#FFFDF5" stroke={INK} strokeWidth="2" />
        {cells}
      </g>
    );
  }
  return (
    <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
      <path
        d="M22 14 h14 v14 h-7 v7 h-7 V14z M36 28 h14 v14 H36V28z M22 42 h14 v14 H22V42z"
        fill="#8FC7FF"
      />
      <circle cx="29" cy="21" r="2.5" fill={INK} strokeWidth="0" />
      <circle cx="43" cy="35" r="2.5" fill={INK} strokeWidth="0" />
      <circle cx="29" cy="49" r="2.5" fill={INK} strokeWidth="0" />
    </g>
  );
}
