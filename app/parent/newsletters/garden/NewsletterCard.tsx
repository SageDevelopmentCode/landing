"use client";

import { useCallback } from "react";
import { Copy, Lock } from "lucide-react";
import type { DBNewsletterListItem } from "@/app/actions/newsletter";
import { useCopy } from "@/app/parent/_garden/copy";
import { Arrow, CheckIcon } from "@/app/parent/_garden/ui";

export const NEWSLETTER_TILTS = ["-1.5deg", "1deg", "-0.5deg", "1.5deg", "-1deg"];

/**
 * Copy a newsletter password with Garden feedback. Shared by the Home rail and the
 * Newsletters page so both behave the same.
 * `opening`: copied on the way to the newsletter, so the parent can paste it when asked.
 */
export function useNewsletterPasswordCopy() {
  const { copy, copiedKey } = useCopy();
  const copyPassword = useCallback(
    (id: string, password: string, opening: boolean) => {
      void copy(id, password, {
        tone: opening ? "info" : "success",
        title: "Password copied",
        message: opening ? "Paste it when the page asks." : undefined,
        failMessage: `Password: ${password}`,
      });
    },
    [copy],
  );
  return { copyPassword, copiedId: copiedKey };
}

/**
 * Polaroid newsletter card: cover (📰 fallback), "Latest" tag, title link that opens
 * `/newsletter/{id}` in a new tab (copying the password on the way), and a password box with Copy.
 */
export default function NewsletterCard({
  newsletter: n,
  index = 0,
  latest = false,
  copied,
  onCopyPassword,
  className = "w-[256px]",
}: {
  newsletter: DBNewsletterListItem;
  /** Picks the polaroid tilt. */
  index?: number;
  latest?: boolean;
  copied: boolean;
  onCopyPassword: (id: string, password: string, opening: boolean) => void;
  /** Width classes: a fixed width in rails, `w-full` in grids. */
  className?: string;
}) {
  const password = n.access_password;
  return (
    // The title link stretches over the whole card; the password box sits above it so its button stays clickable.
    <div
      className={`sf-polaroid group relative transition-[rotate,translate] duration-300 hover:!rotate-0 hover:-translate-y-1 focus-within:!rotate-0 focus-within:-translate-y-1 ${className}`}
      style={{ rotate: NEWSLETTER_TILTS[index % NEWSLETTER_TILTS.length] }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-[var(--sf-sky)]">
        {n.cover_image_signed_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
          <img src={n.cover_image_signed_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">
            📰
          </div>
        )}
        {latest ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--sf-butter)] px-2.5 py-0.5 text-[11px] font-extrabold text-[#5c4400] shadow-sm">
            Latest
          </span>
        ) : null}
      </div>
      <div className="px-1 pb-0.5 pt-3">
        <a
          href={`/newsletter/${n.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (password) onCopyPassword(n.id, password, true);
          }}
          className="line-clamp-2 min-h-[2.6em] text-[15px] font-extrabold leading-snug text-[var(--sf-ink)] after:absolute after:inset-0 after:rounded-[6px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-[var(--sf-sky)]"
        >
          {n.title}
          <span className="sr-only">, {n.week_range}. Opens in a new tab</span>
        </a>
        <p className="sf-hand mt-0.5 text-base leading-tight text-[var(--sf-soft)]" aria-hidden="true">
          {n.week_range}
        </p>

        {password ? (
          <div className="relative z-10 mt-2.5 flex items-center gap-2 rounded-2xl border-2 border-dashed border-[#6b3f86]/30 bg-[var(--sf-lav)]/60 py-1.5 pl-3 pr-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0 text-[#6b3f86]" strokeWidth={2.5} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase leading-none tracking-wide text-[#6b3f86]">Password</p>
              <p className="mt-0.5 select-all break-all font-mono text-sm font-bold leading-tight text-[var(--sf-ink)]">{password}</p>
            </div>
            <button
              type="button"
              onClick={() => onCopyPassword(n.id, password, false)}
              aria-label={copied ? `Password for ${n.title} copied` : `Copy password for ${n.title}`}
              className={`inline-flex min-h-9 w-[78px] shrink-0 items-center justify-center gap-1 rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                copied
                  ? "bg-[var(--sf-sage)] text-white"
                  : "bg-white text-[#6b3f86] shadow-[0_2px_0_0_rgba(107,63,134,0.25)] hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {copied ? <CheckIcon className="h-3 w-3" /> : <Copy className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}

        <span
          className="mt-2.5 inline-flex min-h-8 items-center gap-1 rounded-full bg-[var(--sf-mint)] px-3 text-xs font-extrabold text-[var(--sf-sage-deep)] transition group-hover:bg-[var(--sf-sage)] group-hover:text-white group-focus-within:bg-[var(--sf-sage)] group-focus-within:text-white"
          aria-hidden="true"
        >
          Read <Arrow className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
