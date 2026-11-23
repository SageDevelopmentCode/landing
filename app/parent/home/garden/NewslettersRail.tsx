"use client";

import Link from "next/link";
import type { DBNewsletterListItem } from "@/app/actions/newsletter";
import NewsletterCard, { useNewsletterPasswordCopy } from "@/app/parent/newsletters/garden/NewsletterCard";
import { Arrow, SectionHeader, linkSoft } from "@/app/parent/_garden/ui";

/** Latest published newsletters. Hidden when there are none (same as mobile). */
export default function NewslettersRail({ newsletters }: { newsletters: DBNewsletterListItem[] }) {
  const { copyPassword, copiedId } = useNewsletterPasswordCopy();

  if (newsletters.length === 0) return null;

  return (
    <section aria-labelledby="home-newsletters">
      <SectionHeader
        id="home-newsletters"
        title="Newsletters"
        action={
          <Link href="/parent/newsletters" className={linkSoft}>
            View all <Arrow />
          </Link>
        }
      />
      <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 -mb-4 pb-8 pt-2 [scroll-padding-inline:1.5rem] scrollbar-hide" role="list">
        {newsletters.map((n, i) => (
          <div key={n.id} role="listitem" className="shrink-0 snap-start">
            <NewsletterCard newsletter={n} index={i} latest={i === 0} copied={copiedId === n.id} onCopyPassword={copyPassword} />
          </div>
        ))}
      </div>
    </section>
  );
}
