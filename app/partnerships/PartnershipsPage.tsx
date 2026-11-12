"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Reveal } from "@/app/_garden/motion";
import { Draw, Star, btnPop } from "@/app/_garden/ui";
import { Contact } from "@/app/_home/sections/Connect";
import { PARTNERS } from "@/app/lib/partnerships-data";
import { PARTNERS_HERO, PARTNER_BODIES } from "./content";

const springy =
  "transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const WASHES = [
  "bg-[var(--sf-mint)]/45",
  "bg-[var(--sf-sky)]/35",
  "bg-[var(--sf-peach)]/45",
];
const TAPE = ["var(--sf-butter)", "var(--sf-lav)", "var(--sf-mint)"];

/** The Partnerships page, built with the Garden design system (app/_garden). */
export default function PartnershipsPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={PARTNERS_HERO.badge}
        tint="sage"
        before={PARTNERS_HERO.headingBefore}
        highlight={PARTNERS_HERO.headingHighlight}
        body={PARTNERS_HERO.body}
        photos={PARTNERS_HERO.photos}
        note="our village ✿"
      />

      {PARTNERS.map((partner, i) => {
        const reversed = i % 2 !== 0;
        const tilt = reversed ? 1.5 : -1.5;
        return (
          <section
            key={partner.name}
            className={`py-24 lg:py-28 ${WASHES[i % WASHES.length]}`}
          >
            <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16">
              {/* Facebook post embed, framed like a polaroid. Reveal moves the wrapper; the frame keeps its tilt. */}
              <Reveal className={reversed ? "lg:order-2" : "lg:order-1"} y={60}>
                <div
                  className={`sf-polaroid relative mx-auto w-full max-w-[520px] ${springy} hover:!rotate-0`}
                  style={{ rotate: `${tilt}deg` }}
                >
                  <span
                    className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm opacity-90"
                    style={{ background: TAPE[i % TAPE.length] }}
                    aria-hidden="true"
                  />
                  <div
                    className="flex w-full items-center justify-center overflow-hidden rounded-[3px] bg-[var(--sf-cream)]"
                    style={{ minHeight: partner.fbHeight }}
                  >
                    <iframe
                      src={partner.fbEmbed}
                      width="500"
                      height={partner.fbHeight}
                      className="block max-w-full"
                      style={{ border: "none", overflow: "hidden" }}
                      scrolling="no"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title={`${partner.name} Facebook post`}
                    />
                  </div>
                </div>
              </Reveal>

              {/* Content */}
              <Reveal
                className={reversed ? "lg:order-1" : "lg:order-2"}
                stagger={0.1}
              >
                <div>
                  <div className="inline-block rounded-[22px] bg-white px-5 py-4 shadow-[0_6px_0_0_rgba(43,42,38,0.08)]">
                    <div
                      className={partner.logoClassName ?? "relative h-14 w-44"}
                    >
                      <Image
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        fill
                        className="object-contain object-left"
                        sizes="256px"
                        unoptimized={partner.logo.endsWith(".svg")}
                      />
                    </div>
                  </div>
                </div>

                <h2 className="sf-display mt-7 text-4xl leading-tight md:text-5xl">
                  {partner.name}
                </h2>

                <div className="mt-8">
                  <figure
                    className="sf-wiggle relative rounded-md bg-[var(--sf-butter)] p-6 pt-8 shadow-[0_18px_40px_-24px_rgba(43,42,38,0.55)]"
                    style={{ rotate: `${reversed ? 1 : -1}deg` }}
                  >
                    <span
                      className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-1 rounded-sm bg-white/70"
                      aria-hidden="true"
                    />
                    <Draw
                      className={`absolute -top-6 hidden w-12 md:block ${reversed ? "-left-5" : "-right-5"}`}
                      delay={0.5}
                    >
                      <Star />
                    </Draw>
                    <blockquote className="text-lg font-bold leading-snug text-[var(--sf-ink)]">
                      &ldquo;{partner.pullQuote}&rdquo;
                    </blockquote>
                  </figure>
                </div>

                <div className="mt-8 text-lg leading-relaxed text-[var(--sf-soft)]">
                  {PARTNER_BODIES[partner.name]}
                </div>

                <div className="mt-9">
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnPop}
                  >
                    {partner.ctaLabel}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <Contact />
    </GardenShell>
  );
}
