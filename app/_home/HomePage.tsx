"use client";

import Navbar from "@/app/components/Navbar";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import FridayThankfulPreview from "@/app/friday/components/thankful/FridayThankfulPreview";
import GardenShell from "@/app/_garden/GardenShell";
import Hero from "./sections/Hero";
import { Welcome, Offer, Philosophy } from "./sections/Story";
import { Continuity, Partnership } from "./sections/Community";
import Tuition from "./sections/Tuition";
import Team from "./sections/Team";
import { Enroll, TourAndShadow } from "./sections/Visit";
import { Highlights, Blog, Social } from "./sections/Life";
import { Contact, Faq } from "./sections/Connect";

/** The Sage Field home page, built with the Garden design system (app/_garden). */
export default function HomePage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />}>
      <Hero />
      <Welcome />
      <FridayThankfulPreview />
      <LatestRecap />
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
    </GardenShell>
  );
}
