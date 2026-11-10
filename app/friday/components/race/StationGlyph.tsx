import type { StationId } from "./data";

const INK = "#1C1F2B";

/** Station icons drawn on a 64×64 grid. */
export default function StationGlyph({ id }: { id: StationId }) {
  if (id === "relay") {
    return (
      <g>
        <circle cx="32" cy="32" r="29" fill="#101219" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#4A5068" strokeWidth="5" strokeDasharray="6 6" />
        <circle cx="32" cy="32" r="15" fill="#FFC800" stroke={INK} strokeWidth="3" />
        <circle cx="32" cy="32" r="5" fill={INK} />
      </g>
    );
  }
  if (id === "cardboard") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M21 28 L27 13 H44 L47 28 Z" fill="#E0B77A" />
        <rect x="6" y="27" width="52" height="20" rx="2" fill="#C99A5B" />
        <circle cx="33" cy="37" r="6.5" fill="#FFFDF5" strokeWidth="2.5" />
        <circle cx="18" cy="49" r="8.5" fill="#101219" />
        <circle cx="47" cy="49" r="8.5" fill="#101219" />
      </g>
    );
  }
  if (id === "trials") {
    return (
      <g>
        <rect x="26" y="2" width="12" height="8" rx="2" fill={INK} />
        <rect x="47" y="11" width="9" height="7" rx="2" transform="rotate(42 51 14)" fill={INK} />
        <circle cx="32" cy="37" r="24" fill="#FFFDF5" stroke={INK} strokeWidth="4" />
        <path d="M32 37 L44 24" stroke="#E3241B" strokeWidth="4" strokeLinecap="round" />
        <circle cx="32" cy="37" r="3.5" fill={INK} />
      </g>
    );
  }
  const cells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if ((row + col) % 2 === 0) {
        cells.push(<rect key={`${row}-${col}`} x={17 + col * 10} y={8 + row * 10} width={10} height={10} fill={INK} />);
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
