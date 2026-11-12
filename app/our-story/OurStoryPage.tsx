"use client";

import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import { Contact } from "@/app/_home/sections/Connect";
import { Founders, StoryHero, StoryLetter } from "./sections";

/** The Our Story page, built with the Garden design system (app/_garden). */
export default function OurStoryPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <StoryHero />
      <StoryLetter />
      <Founders />
      <Contact />
    </GardenShell>
  );
}
