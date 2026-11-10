"use client";

import Navbar from "@/app/components/Navbar";
import WeekRecapPreview from "@/app/components/WeekRecapPreview";
import FridayRacePreview from "@/app/friday/components/race/FridayRacePreview";
import VariantShell from "@/app/_home-variants/VariantShell";
import Hero from "./sections/Hero";
import { Welcome, Offer, Philosophy } from "./sections/Story";
import { Continuity, Partnership } from "./sections/Community";
import Tuition from "./sections/Tuition";
import Team from "./sections/Team";
import { Enroll, TourAndShadow } from "./sections/Visit";
import { Highlights, Blog, Social } from "./sections/Life";
import { Contact, Faq } from "./sections/Connect";
import { CursorBubble } from "./ui";

/** /home-2 — "Seasons": dark, cinematic, photography-first. */
export default function HomeSeasons() {
  return (
    <VariantShell navbar={<Navbar lightText />}>
      <CursorBubble />
      <Hero />
      <Welcome />
      <FridayRacePreview />
      <WeekRecapPreview className="bg-welcome-bg" />
      <Offer />
      <Philosophy />
      <Continuity />
      <Partnership />
      <Tuition />
      <Team />
      <Enroll />
      <TourAndShadow />
      <Highlights />
      <Blog />
      <Social />
      <Contact />
      <Faq />
    </VariantShell>
  );
}
