"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { DBNewsletterListItem } from "@/app/actions/newsletter";
import PortalShell from "@/app/parent/_garden/PortalShell";
import { EmptyState } from "@/app/parent/_garden/states";
import { btnGhostSm } from "@/app/parent/_garden/ui";
import { inputCls } from "@/app/parent/_garden/fields";
import NewsletterCard, { useNewsletterPasswordCopy } from "./garden/NewsletterCard";

interface Props {
  newsletters: DBNewsletterListItem[];
}

function countLabel(n: number) {
  return `${n} newsletter${n !== 1 ? "s" : ""}`;
}

export default function ParentNewslettersClient({ newsletters }: Props) {
  return (
    <PortalShell>
      <NewslettersBody newsletters={newsletters} />
    </PortalShell>
  );
}

function NewslettersBody({ newsletters }: Props) {
  const { copyPassword, copiedId } = useNewsletterPasswordCopy();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const searchId = useId();
  const latestId = newsletters[0]?.id;

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return newsletters;
    return newsletters.filter((n) => n.title.toLowerCase().includes(q) || n.week_range.toLowerCase().includes(q));
  }, [deferred, newsletters]);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_60%_at_12%_8%,rgba(207,230,251,0.65),transparent_70%),radial-gradient(50%_55%_at_92%_4%,rgba(232,216,241,0.6),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="sf-display text-[2.6rem] leading-none sm:text-[3.4rem]">Newsletters</h1>
            <p className="sf-hand mt-2 text-xl leading-tight text-[var(--sf-sage-deep)]">{countLabel(newsletters.length)}</p>
          </div>

          {newsletters.length > 0 ? (
            <div className="w-full sm:w-[320px]" role="search">
              <label htmlFor={searchId} className="sr-only">
                Search newsletters by title or week
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sf-soft)]" aria-hidden="true" />
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or week"
                  autoComplete="off"
                  className={`${inputCls} rounded-full pl-11 pr-12 [&::-webkit-search-cancel-button]:hidden`}
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--sf-soft)] transition hover:bg-[var(--sf-ink)]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 px-1 text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
                Showing {filtered.length} of {newsletters.length}
              </p>
            </div>
          ) : null}
        </header>

        {newsletters.length === 0 ? (
          <EmptyState emoji="📰" title="No newsletters yet" body="Newsletters published by the school will appear here." tint="sky" />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title={`No newsletters match “${deferred.trim()}”`}
            body="Try a different title or week."
            tint="butter"
            action={
              <button type="button" onClick={() => setQuery("")} className={btnGhostSm}>
                Clear search
              </button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-x-7 gap-y-9 px-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Newsletters">
            {filtered.map((n, i) => (
              <li key={n.id} className="min-w-0">
                <NewsletterCard
                  newsletter={n}
                  index={i}
                  latest={n.id === latestId}
                  copied={copiedId === n.id}
                  onCopyPassword={copyPassword}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
