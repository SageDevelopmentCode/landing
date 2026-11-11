"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Philosophy } from "@/app/_home/sections/Story";
import { Contact } from "@/app/_home/sections/Connect";
import Inspirations from "./Inspirations";
import { PHILOSOPHY_HERO } from "./content";

/** The Educational Philosophy page, built with the Garden design system (app/_garden). */
export default function EducationalPhilosophyPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>🌿 {PHILOSOPHY_HERO.badge}</>}
        tint="sage"
        before={PHILOSOPHY_HERO.headingBefore}
        highlight={PHILOSOPHY_HERO.headingHighlight}
        body={PHILOSOPHY_HERO.body}
        photos={PHILOSOPHY_HERO.photos}
        note="how we learn, in a scroll ↓"
      />
      <Philosophy />
      <Inspirations />
      <Contact />
    </GardenShell>
  );
}
