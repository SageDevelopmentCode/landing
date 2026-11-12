"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import FaqList, { filterFaqs, groupId } from "@/app/_garden/FaqList";
import { Magnetic, Reveal, WordsReveal } from "@/app/_garden/motion";
import { Arrow, Draw, btnPop } from "@/app/_garden/ui";
import { FAQ_PAGE, buildFaqGroups } from "./content";

const TOPIC_TINTS = ["bg-[var(--sf-butter)]", "bg-[var(--sf-mint)]", "bg-[var(--sf-sky)]", "bg-[var(--sf-lav)]"];

/** The FAQ page, built with the Garden design system (app/_garden). */
export default function FaqPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <FaqBody />
    </GardenShell>
  );
}

// Inside GardenShell so useDialogs() reaches the shared dialogs.
function FaqBody() {
  const { openWaitlist, openContact } = useDialogs();
  const [query, setQuery] = useState("");
  const groups = buildFaqGroups(() => (
    <button type="button" onClick={openWaitlist} className={btnPop}>
      {FAQ_PAGE.enrollButton}
    </button>
  ));
  const visible = filterFaqs(groups, query);

  return (
    <>
      <PageHero
        badge={<>❓ {FAQ_PAGE.badge}</>}
        tint="sky"
        before={FAQ_PAGE.headingBefore}
        highlight={FAQ_PAGE.headingHighlight}
        body={FAQ_PAGE.sub}
      >
        <Reveal className="mx-auto mt-10 max-w-2xl" y={30} delay={0.3}>
          <label className="relative block">
            <span className="sr-only">{FAQ_PAGE.searchPlaceholder}</span>
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sf-soft)]" aria-hidden="true" />
            <input
              type="text"
              placeholder={FAQ_PAGE.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border-2 border-[var(--sf-ink)]/15 bg-white py-4 pl-14 pr-5 text-lg font-semibold text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 shadow-[0_6px_0_0_rgba(43,42,38,0.08)] focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)]"
            />
          </label>
        </Reveal>
      </PageHero>

      <section className="pb-24 lg:pb-32">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:px-10 lg:grid-cols-[230px_1fr] lg:gap-14 lg:px-16">
          {/* Topic rail: a wrapping row on phones, sticky column at lg */}
          <aside>
            <nav aria-label="FAQ topics" className="lg:sticky lg:top-32">
              <ul className="flex flex-wrap gap-3 lg:flex-col lg:items-start">
                {visible.map((g, i) => (
                  <li key={g.title}>
                    <a
                      href={`#${groupId("faq", g.title)}`}
                      className={`inline-block rounded-full px-4 py-2 text-sm leading-snug lg:rounded-2xl font-extrabold text-[var(--sf-ink)] shadow-[0_4px_0_0_rgba(43,42,38,0.12)] transition-transform duration-300 hover:-translate-y-0.5 hover:-rotate-2 focus-visible:-translate-y-0.5 focus-visible:-rotate-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 ${TOPIC_TINTS[i % TOPIC_TINTS.length]}`}
                    >
                      {g.title}
                    </a>
                  </li>
                ))}
              </ul>
              <div
                className="relative mt-8 hidden rounded-md bg-[var(--sf-butter)] p-5 pt-7 shadow-[0_14px_30px_-16px_rgba(43,42,38,0.5)] lg:block"
                style={{ rotate: "-2deg" }}
                aria-hidden="true"
              >
                <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-white/70" />
                <p className="sf-hand text-xl leading-snug text-[var(--sf-ink)]">psst — tap a topic to jump straight there ✿</p>
              </div>
            </nav>
          </aside>

          <FaqList
            groups={groups}
            query={query}
            idPrefix="faq"
            groupTitleAs="h2"
            theme={{
              group: "rounded-[32px] bg-white p-6 md:p-8 shadow-[0_20px_50px_-35px_rgba(43,42,38,0.5)]",
              groupTitle: "sf-display text-2xl md:text-3xl mb-1",
              item: "border-b-2 border-dashed border-[var(--sf-ink)]/10 last:border-0",
              question: "text-lg md:text-xl font-extrabold leading-snug",
              answer: "text-lg leading-relaxed text-[var(--sf-soft)]",
              icon: "bg-[var(--sf-butter)] text-[var(--sf-ink)]",
              empty: "rounded-[32px] bg-white py-12 text-center text-lg font-bold text-[var(--sf-soft)]",
            }}
          />
        </div>
      </section>

      {/* Still have questions? */}
      <section className="pb-24 lg:pb-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
          <div className="relative overflow-hidden rounded-[44px] bg-[var(--sf-peach)]/70 px-8 py-14 text-center md:px-14">
            <div className="sf-spin-slow absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/30" aria-hidden="true" />
            <div className="relative">
              <WordsReveal text={FAQ_PAGE.stillHeading} className="sf-display text-5xl md:text-6xl" />
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--sf-soft)]">{FAQ_PAGE.stillBody}</p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Draw className="hidden w-14 rotate-12 sm:block">
                  <Arrow />
                </Draw>
                <Magnetic>
                  <button type="button" onClick={openContact} className={btnPop}>
                    {FAQ_PAGE.stillButton}
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
