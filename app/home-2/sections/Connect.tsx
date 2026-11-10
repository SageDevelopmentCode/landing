"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CONTACT, FAQ_HEADER, buildFaqs } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import FaqList from "@/app/_home-variants/FaqList";
import { Magnetic, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Label, btnCoral } from "../ui";

export function Contact() {
  const { openContact } = useDialogs();
  return (
    <section className="bg-[var(--h2-forest)] py-28 lg:py-40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <Label n="10">{CONTACT.badge}</Label>
        <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <WordsReveal text={CONTACT.heading} className="h2-display text-[18vw] lg:text-[11rem] leading-[0.85]" />
          <Magnetic strength={0.4}>
            <button
              onClick={openContact}
              className="flex h-40 w-40 md:h-48 md:w-48 items-center justify-center rounded-full bg-[var(--h2-coral)] text-center text-lg font-bold text-[var(--h2-night)] transition-transform duration-500 hover:scale-105 cursor-pointer"
            >
              {CONTACT.button}
            </button>
          </Magnetic>
        </div>
        <Reveal className="mt-16 grid gap-10 border-t border-[var(--h2-line)] pt-10 md:grid-cols-4" stagger={0.08}>
          <p className="text-[var(--h2-mute)] md:col-span-1">{CONTACT.body}</p>
          <a href={`mailto:${CONTACT.email}`} className="group">
            <span className="h2-label block text-[var(--h2-mute)]">Email</span>
            <span className="h2-display mt-2 block text-2xl group-hover:text-[var(--h2-coral)] transition-colors">{CONTACT.email}</span>
          </a>
          <a href={CONTACT.phoneHref} className="group">
            <span className="h2-label block text-[var(--h2-mute)]">Phone</span>
            <span className="h2-display mt-2 block text-2xl group-hover:text-[var(--h2-coral)] transition-colors">{CONTACT.phoneDisplay}</span>
          </a>
          <div>
            <a href={CONTACT.mapsHref} target="_blank" rel="noopener noreferrer" className="group block">
              <span className="h2-label block text-[var(--h2-mute)]">Location</span>
              <span className="h2-display mt-2 block text-2xl group-hover:text-[var(--h2-coral)] transition-colors">{CONTACT.address}</span>
            </a>
            <p className="mt-3 text-sm text-[var(--h2-mute)]">
              {CONTACT.moreInfo}{" "}
              <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4 text-[var(--h2-cream)]">
                {CONTACT.email}
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Faq() {
  const { openWaitlist } = useDialogs();
  const [query, setQuery] = useState("");
  const groups = buildFaqs(() => (
    <button onClick={openWaitlist} className={btnCoral}>
      Enroll Now
    </button>
  ));
  return (
    <section className="bg-[var(--h2-night)] py-28 lg:py-40">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        <div className="text-center">
          <Label>{FAQ_HEADER.badge}</Label>
          <WordsReveal text={FAQ_HEADER.heading} className="h2-display mt-6 text-5xl md:text-7xl" />
          <p className="mt-4 text-lg text-[var(--h2-mute)]">{FAQ_HEADER.sub}</p>
        </div>
        <label className="relative mx-auto mt-10 mb-16 block max-w-xl">
          <span className="sr-only">{FAQ_HEADER.searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--h2-mute)]" />
          <input
            type="text"
            placeholder={FAQ_HEADER.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-[var(--h2-line)] bg-white/5 py-4 pl-14 pr-5 text-[var(--h2-cream)] placeholder:text-[var(--h2-mute)] focus:border-[var(--h2-coral)] focus:outline-none focus:ring-4 focus:ring-[var(--h2-coral)]/20"
          />
        </label>
        <FaqList
          groups={groups}
          query={query}
          idPrefix="h2faq"
          theme={{
            group: "grid gap-4 md:grid-cols-[220px_1fr] md:gap-10",
            groupTitle: "h2-label pt-7 text-[var(--h2-coral)] md:sticky md:top-32 self-start",
            item: "border-b border-[var(--h2-line)]",
            question: "h2-display text-2xl md:text-3xl leading-snug",
            answer: "text-lg leading-relaxed text-[var(--h2-mute)]",
            icon: "border border-[var(--h2-line)] text-[var(--h2-coral)]",
            empty: "py-12 text-center text-lg text-[var(--h2-mute)]",
          }}
        />
      </div>
    </section>
  );
}
