import type { AccessoryId } from "./data";

/** Fan angles, left to right. */
const ANGLES = [-72, -48, -24, 0, 24, 48, 72];
/** Feathers grow from the middle out (used for progress meters). */
const GROW_ORDER = [3, 2, 4, 1, 5, 0, 6];
export const MAX_FEATHERS = ANGLES.length;

const CROWN_LEAVES: [number, number, number, string][] = [
  [97, 84, -55, "#EE8434"],
  [106, 75, -30, "#F4C04E"],
  [120, 71, 0, "#B23A48"],
  [134, 75, 30, "#6b9474"],
  [143, 84, 55, "#EE8434"],
];

/**
 * The page mascot. Pure SVG + CSS animation (see thankful.css), so it renders
 * its finished look without JavaScript.
 *  - `feathers`: how many tail feathers are showing (0–7), grown middle-out.
 *  - `fanKey`: change it to replay the feather fan-out.
 */
export default function Turkey({
  feathers: colors,
  accessory = "none",
  count = MAX_FEATHERS,
  fanKey,
  gobbling = false,
  waddling = false,
  className = "",
}: {
  feathers: string[];
  accessory?: AccessoryId;
  count?: number;
  fanKey?: string | number;
  gobbling?: boolean;
  waddling?: boolean;
  className?: string;
}) {
  const visible = new Set(GROW_ORDER.slice(0, Math.max(0, Math.min(MAX_FEATHERS, count))));
  return (
    <svg
      viewBox="0 0 240 236"
      className={`tg-turkey${gobbling ? " tg-gobbling" : ""}${waddling ? " tg-waddling" : ""} ${className}`}
      aria-hidden
    >
      <g className="tg-turkey-all">
        {/* Tail fan */}
        <g className="tg-fan" key={fanKey}>
          {ANGLES.map((angle, i) =>
            visible.has(i) ? (
              <g key={i} transform={`translate(120 150) rotate(${angle})`}>
                <g className="tg-feather" style={{ animationDelay: `${Math.abs(i - 3) * 70}ms` }}>
                  <ellipse cx="0" cy="-60" rx="19" ry="56" fill={colors[i % colors.length]} />
                  <ellipse cx="0" cy="-74" rx="8.5" ry="32" fill="#fff" opacity="0.28" />
                  <path d="M0 -8 L0 -104" stroke="#000" strokeOpacity="0.12" strokeWidth="2" strokeLinecap="round" />
                </g>
              </g>
            ) : null,
          )}
        </g>

        {/* Feet */}
        <g className="tg-feet" stroke="#E98A2C" strokeWidth="5" strokeLinecap="round" fill="none">
          <path className="tg-foot-l" d="M104 200 L104 222 M104 222 L94 230 M104 222 L104 232 M104 222 L114 230" />
          <path className="tg-foot-r" d="M136 200 L136 222 M136 222 L126 230 M136 222 L136 232 M136 222 L146 230" />
        </g>

        {/* Body */}
        <g className="tg-body">
          <ellipse cx="76" cy="166" rx="15" ry="28" fill="#6E4229" transform="rotate(22 76 166)" />
          <ellipse cx="164" cy="166" rx="15" ry="28" fill="#6E4229" transform="rotate(-22 164 166)" />
          <circle cx="120" cy="162" r="50" fill="#8A5636" />
          <ellipse cx="120" cy="174" rx="32" ry="30" fill="#B58058" />
          <path d="M106 168 q4 5 8 0 M120 176 q4 5 8 0 M110 184 q4 5 8 0" stroke="#8A5636" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.6" />
        </g>

        {/* Neckwear sits on the body, under the head */}
        {accessory === "scarf" && (
          <g>
            <path d="M136 138 L148 176 L134 179 L126 144 Z" fill="#B23A48" />
            <path d="M138 176 l-1 8 M142 175 l0 8 M146 174 l1 8" stroke="#B23A48" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M88 126 Q120 142 152 126 L154 140 Q120 158 86 140 Z" fill="#B23A48" />
            <path d="M96 133 Q120 146 144 133" stroke="#F4C04E" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}
        {accessory === "bowtie" && (
          <g>
            <path d="M120 138 L97 126 Q93 138 97 150 Z" fill="#5B8DC9" />
            <path d="M120 138 L143 126 Q147 138 143 150 Z" fill="#5B8DC9" />
            <circle cx="104" cy="134" r="2.4" fill="#fff" />
            <circle cx="102" cy="144" r="2.4" fill="#fff" />
            <circle cx="136" cy="134" r="2.4" fill="#fff" />
            <circle cx="138" cy="144" r="2.4" fill="#fff" />
            <rect x="114" y="131" width="12" height="14" rx="4" fill="#3F6FA8" />
          </g>
        )}

        {/* Head */}
        <g className="tg-head">
          <circle cx="120" cy="104" r="31" fill="#9A6143" />
          <circle cx="101" cy="113" r="5.5" fill="#F29A8F" opacity="0.75" />
          <circle cx="139" cy="113" r="5.5" fill="#F29A8F" opacity="0.75" />
          <g className="tg-eyes">
            <circle cx="109" cy="99" r="7.5" fill="#fff" />
            <circle cx="131" cy="99" r="7.5" fill="#fff" />
            <circle cx="110" cy="100" r="4" fill="#2b2a26" />
            <circle cx="132" cy="100" r="4" fill="#2b2a26" />
            <circle cx="111.5" cy="98.5" r="1.4" fill="#fff" />
            <circle cx="133.5" cy="98.5" r="1.4" fill="#fff" />
          </g>
          <path d="M113 109 L127 109 L120 121 Z" fill="#F4A93B" stroke="#E08A1F" strokeWidth="1.5" strokeLinejoin="round" />
          <path
            className="tg-wattle"
            d="M124 113 C 133 117, 134 131, 128 135 C 122 138, 119 126, 124 113 Z"
            fill="#D9434F"
          />
          {accessory === "glasses" && (
            <g fill="#fff" fillOpacity="0.18" stroke="#2b2a26" strokeWidth="3">
              <circle cx="109" cy="99" r="11" />
              <circle cx="131" cy="99" r="11" />
              <path d="M117 96 Q120 92 123 96" fill="none" />
              <path d="M98 97 L91 94 M142 97 L149 94" fill="none" strokeLinecap="round" />
            </g>
          )}
          {accessory === "crown" &&
            CROWN_LEAVES.map(([x, y, r, fill]) => (
              <path
                key={`${x}-${y}`}
                d="M0 0 C -7 -6 -7 -17 0 -24 C 7 -17 7 -6 0 0 Z"
                transform={`translate(${x} ${y}) rotate(${r})`}
                fill={fill}
                stroke="#000"
                strokeOpacity="0.12"
                strokeWidth="1.5"
              />
            ))}
        </g>
      </g>
    </svg>
  );
}
