/** Pumpkin toy button: the action color for this page (Garden shape, autumn paint). */
export const btnPumpkin =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#EE8434] px-7 py-4 text-base font-extrabold text-white shadow-[0_6px_0_0_#C4621C] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#C4621C] active:translate-y-1 active:shadow-[0_2px_0_0_#C4621C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EE8434]/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_#C4621C]";

export const btnInk =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--sf-ink)] bg-white px-7 py-[14px] text-base font-extrabold text-[var(--sf-ink)] shadow-[0_6px_0_0_var(--sf-ink)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_0_var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-ink)]/25 cursor-pointer";

/** Autumn eyebrow pill. */
export function AutumnPill({
  children,
  tone = "pumpkin",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "pumpkin" | "cranberry" | "mustard" | "sage" | "cream";
  className?: string;
}) {
  const tones = {
    pumpkin: "bg-[#EE8434]/18 text-[#B4561A]",
    cranberry: "bg-[#B23A48]/15 text-[#9A2E3B]",
    mustard: "bg-[#F4C04E] text-[#6E4E00]",
    sage: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
    cream: "bg-white/15 text-[#FFF8EF]",
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** A simple maple-ish leaf. */
export function LeafShape({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 3 L24 12 L33 9 L29 18 L37 22 L28 25 L30 34 L21 29 L20 38 L19 29 L10 34 L12 25 L3 22 L11 18 L7 9 L16 12 Z"
        fill={color}
        stroke="#000"
        strokeOpacity="0.12"
        strokeLinejoin="round"
      />
      <path d="M20 13 L20 37" stroke="#000" strokeOpacity="0.18" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** A soft oval leaf (used for the gratitude tree and crowns). */
export function OvalLeaf({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 52" className={className} aria-hidden>
      <path d="M20 2 C 34 12, 36 34, 20 50 C 4 34, 6 12, 20 2 Z" fill={color} />
      <path d="M20 8 L20 48" stroke="#000" strokeOpacity="0.18" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 20 L13 15 M20 28 L27 22 M20 36 L13 31" stroke="#000" strokeOpacity="0.14" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
