import { LeafShape, OvalLeaf } from "./ui";

/**
 * Pie-crust edge between two solid section colors: scallops of `top` drip
 * into `bottom`, with a few leaves tumbling across the seam.
 */
export function PieCrust({
  top,
  bottom,
  leaves = true,
  flip = false,
}: {
  top: string;
  bottom: string;
  leaves?: boolean;
  flip?: boolean;
}) {
  return (
    <div className="relative h-7" style={{ backgroundColor: bottom }} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 24px 0, ${top} 23.5px, transparent 24.5px)`,
          backgroundSize: "48px 28px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: flip ? "24px 0" : "0 0",
        }}
      />
      {leaves && (
        <>
          <LeafShape color="#EE8434" className="absolute left-[8%] -top-4 z-10 h-8 w-8 rotate-[-18deg]" />
          <OvalLeaf color="#B23A48" className="absolute left-[47%] -top-3 z-10 hidden h-8 w-6 rotate-[30deg] sm:block" />
          <LeafShape color="#F4C04E" className="absolute right-[10%] -top-2 z-10 h-7 w-7 rotate-[24deg]" />
        </>
      )}
    </div>
  );
}

const LEAF_COLORS = ["#EE8434", "#F4C04E", "#B23A48", "#C8643B", "#6b9474"];

/** CSS-only drifting leaves (hidden for reduced motion). Deterministic so SSR matches. */
export function FallingLeaves({ count = 12, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`tg-leaves ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i * 37 + 7) % 100;
        const size = 18 + ((i * 13) % 20);
        const dur = 11 + ((i * 7) % 9);
        const delay = -((i * 23) % 17);
        const drift = ((i % 2 ? 1 : -1) * (40 + ((i * 29) % 90))).toFixed(0);
        const style = {
          "--x": `${x}%`,
          "--s": `${size}px`,
          "--dur": `${dur}s`,
          "--delay": `${delay}s`,
          "--drift": `${drift}px`,
        } as React.CSSProperties;
        return (
          <span key={i} style={style} className={i % 3 === 2 ? "hidden md:block" : undefined}>
            {i % 2 ? (
              <OvalLeaf color={LEAF_COLORS[i % LEAF_COLORS.length]} />
            ) : (
              <LeafShape color={LEAF_COLORS[i % LEAF_COLORS.length]} />
            )}
          </span>
        );
      })}
    </div>
  );
}
