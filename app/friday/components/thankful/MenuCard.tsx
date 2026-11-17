import { ADDRESS, EVENT, MAPS_URL } from "./data";

/** Handwritten "Today's Menu" card with the day's logistics. */
export default function MenuCard({ price, className = "" }: { price: number; className?: string }) {
  const rows = [
    { term: "Drop-off", value: EVENT.dropOff },
    { term: "Pick-up", value: EVENT.pickUp },
    { term: "Entry", value: `$${price} per child` },
    { term: "Ages", value: EVENT.ages },
  ];
  return (
    <div
      className={`relative rounded-[28px] border-2 border-[#C8643B]/25 bg-[#fffdf8] p-7 shadow-[0_30px_60px_-35px_rgba(74,52,38,0.55)] transition-transform duration-300 hover:!rotate-0 ${className}`}
      style={{ rotate: "1.5deg" }}
    >
      <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 rounded-sm bg-[#B23A48]/70" aria-hidden />
      <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-dashed border-[#C8643B]/30" aria-hidden />
      <p className="sf-hand text-center text-3xl text-[#B23A48]">Today’s Menu</p>
      <p className="mt-1 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sf-soft)]">
        {EVENT.title} · {EVENT.weekdayDate}
      </p>
      <p className="my-3 text-center text-[#C8643B]" aria-hidden>
        ✦ ❦ ✦
      </p>
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.term} className="flex items-baseline gap-2">
            <dt className="font-extrabold text-[var(--sf-ink)]">{row.term}</dt>
            <span className="mb-1 flex-1 border-b-2 border-dotted border-[var(--sf-ink)]/20" aria-hidden />
            <dd className="sf-display text-lg text-[#C4621C]">{row.value}</dd>
          </div>
        ))}
        <div className="pt-2">
          <dt className="font-extrabold text-[var(--sf-ink)]">Where</dt>
          <dd className="mt-0.5">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--sf-sage-deep)] underline decoration-[#F4C04E] decoration-[3px] underline-offset-4 hover:decoration-[#EE8434]"
            >
              {ADDRESS} ↗
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
