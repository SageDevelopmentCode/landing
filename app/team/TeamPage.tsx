"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import Team from "@/app/_home/sections/Team";
import { Contact } from "@/app/_home/sections/Connect";
import { TEAM_HERO } from "./content";

/** The Team page, built with the Garden design system (app/_garden). */
export default function TeamPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>👋 {TEAM_HERO.badge}</>}
        tint="butter"
        before={TEAM_HERO.headingBefore}
        highlight={TEAM_HERO.headingHighlight}
        body={TEAM_HERO.body}
        photos={TEAM_HERO.photos}
        photoPosition="object-top"
        note="say hi to everyone ↓"
      />
      <Team />
      <Contact />
    </GardenShell>
  );
}
