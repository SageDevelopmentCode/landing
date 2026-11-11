"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import { Welcome, Offer, Philosophy } from "@/app/_home/sections/Story";
import Tuition from "@/app/_home/sections/Tuition";
import Team from "@/app/_home/sections/Team";
import { Contact } from "@/app/_home/sections/Connect";
import { Social } from "@/app/_home/sections/Life";
import AboutHero from "./AboutHero";

/** The About page, built with the Garden design system (app/_garden). */
export default function AboutPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <AboutHero />
      <Welcome />
      <Offer />
      <Philosophy />
      <Tuition />
      <Team />
      <Contact />
      <Social />
    </GardenShell>
  );
}
