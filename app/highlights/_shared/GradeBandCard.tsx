import type { BandTint, HighlightItem } from "./types";

const PAPER: Record<BandTint, string> = {
  coral: "bg-[var(--sf-peach)]",
  sage: "bg-[var(--sf-mint)]",
  sky: "bg-[var(--sf-sky)]",
};
const TAPE: Record<BandTint, string> = {
  coral: "var(--sf-butter)",
  sage: "var(--sf-sky)",
  sky: "var(--sf-lav)",
};

/** A pastel paper card listing one grade band's highlights for the week. */
export default function GradeBandCard({
  title,
  subtitle,
  emoji,
  tint,
  items,
  tilt = 0,
  compact = false,
  headingLevel: H = "h3",
}: {
  title: string;
  subtitle?: string;
  emoji: string;
  tint: BandTint;
  items: HighlightItem[];
  tilt?: number;
  compact?: boolean;
  headingLevel?: "h3" | "h4";
}) {
  return (
    <article
      className={`relative h-full rounded-[28px] ${PAPER[tint]} ${compact ? "p-6" : "p-7 md:p-8"} shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)] transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:rotate-0`}
      style={{ rotate: `${tilt}deg` }}
    >
      <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90" style={{ background: TAPE[tint] }} aria-hidden="true" />
      <div className="flex items-center gap-3">
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${compact ? "h-10 w-10 text-lg" : "h-12 w-12 text-2xl"}`} aria-hidden="true">
          {emoji}
        </span>
        <div>
          <H className={`sf-display ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}>{title}</H>
          {subtitle && <p className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">{subtitle}</p>}
        </div>
      </div>
      <ul className={`divide-y-2 divide-dashed divide-[var(--sf-ink)]/10 ${compact ? "mt-4" : "mt-6"}`}>
        {items.map((item) => (
          <li key={item.label} className={`flex items-start gap-3 ${compact ? "py-2.5" : "py-3.5"}`}>
            <span className={`shrink-0 leading-none ${compact ? "text-lg" : "text-2xl"}`} aria-hidden="true">
              {item.emoji}
            </span>
            <div>
              <p className={`font-extrabold leading-snug ${compact ? "text-sm" : ""}`}>{item.label}</p>
              <p className={`mt-0.5 leading-relaxed text-[var(--sf-soft)] ${compact ? "text-xs" : "text-sm"}`}>{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
