"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Search } from "lucide-react";
import { CONTACT, FAQ_HEADER, buildFaqs } from "@/app/_home-variants/content";
import { useDialogs } from "@/app/_home-variants/VariantShell";
import FaqList, { filterFaqs, groupId } from "@/app/_home-variants/FaqList";
import { Magnetic, Reveal, WordsReveal } from "@/app/_home-variants/motion";
import { Badge, btnPrimary } from "../ui";

export function Contact() {
  const { openContact } = useDialogs();
  const rows = [
    { Icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { Icon: Phone, label: "Phone", value: CONTACT.phoneDisplay, href: CONTACT.phoneHref },
    { Icon: MapPin, label: "Location", value: CONTACT.address, href: CONTACT.mapsHref, external: true },
  ];
  return (
    <section className="bg-[var(--h1-sage)] text-white py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:px-16">
        <div>
          <Badge dark>{CONTACT.badge}</Badge>
          <WordsReveal text={CONTACT.heading} className="h1-display mt-5 text-6xl md:text-8xl font-light leading-[0.95]" />
          <Reveal>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/80">{CONTACT.body}</p>
            <div className="mt-10">
              <Magnetic>
                <button onClick={openContact} className={`${btnPrimary} px-10 py-5 text-base`}>
                  {CONTACT.button}
                </button>
              </Magnetic>
            </div>
          </Reveal>
        </div>
        <Reveal className="divide-y divide-white/15 self-end" stagger={0.1}>
          {rows.map(({ Icon, label, value, href, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-6 py-7"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/25 transition-colors duration-500 group-hover:bg-[var(--h1-coral)] group-hover:border-[var(--h1-coral)]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="h1-eyebrow block text-[0.62rem] text-white/50">{label}</span>
                <span className="h1-display mt-1 block text-xl md:text-2xl transition-transform duration-500 group-hover:translate-x-2">{value}</span>
              </span>
            </a>
          ))}
          <p className="pt-7 text-sm text-white/70">
            {CONTACT.moreInfo}{" "}
            <a href={`mailto:${CONTACT.email}`} className="font-semibold text-white underline underline-offset-4">
              {CONTACT.email}
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Faq() {
  const { openWaitlist } = useDialogs();
  const [query, setQuery] = useState("");
  const groups = buildFaqs(() => (
    <button onClick={openWaitlist} className={btnPrimary}>
      Enroll Now
    </button>
  ));
  const visible = filterFaqs(groups, query);

  return (
    <section className="bg-[var(--h1-cream)] py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="grid gap-14 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Badge>{FAQ_HEADER.badge}</Badge>
              <WordsReveal text={FAQ_HEADER.heading} className="h1-display mt-5 text-5xl md:text-6xl font-light leading-[1.02]" />
              <p className="mt-4 text-lg text-[var(--h1-ink)]/70">{FAQ_HEADER.sub}</p>
              <label className="relative mt-8 block">
                <span className="sr-only">{FAQ_HEADER.searchPlaceholder}</span>
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--h1-ink)]/40" />
                <input
                  type="text"
                  placeholder={FAQ_HEADER.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-[var(--h1-ink)]/15 bg-white py-4 pl-14 pr-5 text-[var(--h1-ink)] placeholder:text-[var(--h1-ink)]/40 focus:border-[var(--h1-coral)] focus:outline-none focus:ring-4 focus:ring-[var(--h1-coral)]/20"
                />
              </label>
              <nav aria-label="FAQ categories" className="mt-8 hidden lg:block">
                <ul className="space-y-1">
                  {visible.map((g) => (
                    <li key={g.title}>
                      <a href={`#${groupId("h1faq", g.title)}`} className="group flex items-center gap-3 py-2 text-[var(--h1-ink)]/70 hover:text-[var(--h1-ink)]">
                        <span className="h-px w-5 bg-current transition-all duration-500 group-hover:w-10" />
                        {g.title}
                        <span className="text-xs text-[var(--h1-ink)]/40">{g.items.length}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
          <div className="lg:col-span-8">
            <FaqList
              groups={groups}
              query={query}
              idPrefix="h1faq"
              theme={{
                group: "",
                groupTitle: "h1-display text-3xl md:text-4xl font-light mb-2",
                item: "border-b border-[var(--h1-ink)]/10",
                question: "h1-display text-xl md:text-2xl leading-snug",
                answer: "text-lg leading-relaxed text-[var(--h1-ink)]/70",
                icon: "border border-[var(--h1-ink)]/15 text-[var(--h1-coral-deep)]",
                empty: "py-12 text-center text-lg text-[var(--h1-ink)]/50",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
