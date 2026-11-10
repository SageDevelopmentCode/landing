import Link from "next/link";
import type { ReactNode } from "react";
import { ScriptTitle } from "@/app/_home-variants/motion";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--h1-coral)] px-7 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(217,119,107,0.8)] transition-all duration-300 hover:bg-[var(--h1-coral-deep)] hover:shadow-[0_14px_34px_-10px_rgba(217,119,107,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--h1-coral)] focus-visible:ring-offset-2 cursor-pointer";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-current px-7 py-4 text-sm font-semibold transition-colors duration-300 hover:bg-[var(--h1-ink)] hover:text-[var(--h1-cream)] hover:border-[var(--h1-ink)] cursor-pointer";
export const btnGhostLight =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-[var(--h1-ink)] cursor-pointer";

export function Badge({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`h1-eyebrow inline-flex items-center gap-2 ${dark ? "text-[var(--h1-coral)]" : "text-[var(--h1-moss)]"}`}
    >
      <span className={`h-px w-8 ${dark ? "bg-[var(--h1-coral)]" : "bg-[var(--h1-moss)]"}`} />
      {children}
    </span>
  );
}

export function Chapter({ eyebrow, word, dark = false }: { eyebrow: string; word: string; dark?: boolean }) {
  return (
    <ScriptTitle
      eyebrow={eyebrow}
      word={word}
      className="pt-24 pb-6 md:pt-32"
      eyebrowClassName={`h1-eyebrow ${dark ? "text-white/60" : "text-[var(--h1-moss)]"}`}
      wordClassName={`h1-script text-[22vw] md:text-[11rem] -mt-4 md:-mt-10 ${dark ? "text-[var(--h1-coral)]" : "text-[var(--h1-sage)]"}`}
    />
  );
}

export function ArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`h1-link-underline font-semibold pb-0.5 ${className}`}>
      {children}
    </Link>
  );
}
