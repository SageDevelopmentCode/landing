"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Offer } from "@/app/_home/sections/Story";
import { Contact } from "@/app/_home/sections/Connect";
import { OFFER_HERO } from "./content";

/** The What We Offer page, built with the Garden design system (app/_garden). */
export default function WhatWeOfferPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <PageHero
        badge={<>☀️ {OFFER_HERO.badge}</>}
        tint="butter"
        before={OFFER_HERO.headingBefore}
        highlight={OFFER_HERO.headingHighlight}
        body={OFFER_HERO.body}
        photos={OFFER_HERO.photos}
        note="a peek at our week ↓"
      />
      <Offer />
      <Contact />
    </GardenShell>
  );
}
