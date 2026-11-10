"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Search } from "lucide-react";
import { CONTACT, FAQ_HEADER, buildFaqs } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import FaqList from "@/app/_home-variants/FaqList";
import { Magnetic, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Arrow, Draw, Pill, btnPop } from "../ui";

export function Contact() {
  const { openContact } = useDialogs();
  const rows = [
    { Icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}`, tint: "bg-[var(--h3-butter)]" },
    { Icon: Phone, label: "Phone", value: CONTACT.phoneDisplay, href: CONTACT.phoneHref, tint: "bg-[var(--h3-mint)]" },
    { Icon: MapPin, label: "Location", value: CONTACT.address, href: CONTACT.mapsHref, tint: "bg-[var(--h3-sky)]", external: true },
  ];
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-[44px] bg-[var(--h3-sage)] p-8 md:p-14 text-white">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 h3-spin-slow" aria-hidden="true" />
          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-extrabold">📮 {CONTACT.badge}</span>
              <WordsReveal text={CONTACT.heading} className="h3-display mt-5 text-6xl md:text-7xl" />
              <p className="mt-5 max-w-md text-lg text-white/90">{CONTACT.body}</p>
              <div className="mt-8 flex items-center gap-4">
                <Magnetic>
                  <button onClick={openContact} className={btnPop}>
                    {CONTACT.button}
                  </button>
                </Magnetic>
                <Draw className="hidden w-16 -scale-x-100 rotate-12 sm:block">
                  <Arrow color="#fff" />
                </Draw>
              </div>
            </div>
            <Reveal className="space-y-4" stagger={0.1} x={40} y={0}>
              {rows.map(({ Icon, label, value, href, tint, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-4 rounded-3xl bg-white p-4 text-[var(--h3-ink)] shadow-[0_6px_0_0_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-1"
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tint} transition-transform duration-300 group-hover:rotate-12`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-[var(--h3-soft)]">{label}</span>
                    <span className="block font-extrabold">{value}</span>
                  </span>
                </a>
              ))}
              <p className="px-2 text-sm text-white/90">
                {CONTACT.moreInfo}{" "}
                <a href={`mailto:${CONTACT.email}`} className="font-extrabold underline underline-offset-4">
                  {CONTACT.email}
                </a>
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { openWaitlist } = useDialogs();
  const [query, setQuery] = useState("");
  const groups = buildFaqs(() => (
    <button onClick={openWaitlist} className={btnPop}>
      Enroll Now
    </button>
  ));
  return (
    <section className="pb-28 pt-8">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="text-center">
          <Pill tint="sky">❓ {FAQ_HEADER.badge}</Pill>
          <WordsReveal text={FAQ_HEADER.heading} className="h3-display mt-5 text-5xl md:text-6xl" />
          <p className="mt-4 text-lg text-[var(--h3-soft)]">{FAQ_HEADER.sub}</p>
        </div>
        <label className="relative mx-auto mt-10 mb-14 block">
          <span className="sr-only">{FAQ_HEADER.searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--h3-soft)]" />
          <input
            type="text"
            placeholder={FAQ_HEADER.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border-2 border-[var(--h3-ink)]/15 bg-white py-4 pl-14 pr-5 text-lg font-semibold text-[var(--h3-ink)] placeholder:text-[var(--h3-ink)]/40 shadow-[0_6px_0_0_rgba(43,42,38,0.08)] focus:border-[var(--h3-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--h3-mint)]"
          />
        </label>
        <FaqList
          groups={groups}
          query={query}
          idPrefix="h3faq"
          theme={{
            group: "rounded-[32px] bg-white p-6 md:p-8 shadow-[0_20px_50px_-35px_rgba(43,42,38,0.5)]",
            groupTitle: "h3-display text-2xl md:text-3xl mb-1",
            item: "border-b-2 border-dashed border-[var(--h3-ink)]/10 last:border-0",
            question: "text-lg md:text-xl font-extrabold leading-snug",
            answer: "text-lg leading-relaxed text-[var(--h3-soft)]",
            icon: "bg-[var(--h3-butter)] text-[var(--h3-ink)]",
            empty: "py-12 text-center text-lg font-bold text-[var(--h3-soft)]",
          }}
        />
      </div>
    </section>
  );
}
