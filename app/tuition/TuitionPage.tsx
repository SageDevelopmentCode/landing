"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
import PageHero from "@/app/_garden/PageHero";
import { Magnetic } from "@/app/_garden/motion";
import { btnPop, btnSage } from "@/app/_garden/ui";
import { DropInPricing } from "@/app/_home/sections/Tuition";
import FullEnrollmentBlock from "./FullEnrollmentBlock";
import { DROP_IN, TUITION_HERO } from "./content";

/** The Tuition page, built with the Garden design system (app/_garden). */
export default function TuitionPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <Hero />
      <section className="bg-[var(--sf-peach)]/45 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <FullEnrollmentBlock headingAs="h2" />
        </div>
      </section>
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <DropInPricing
            headingAs="h2"
            badge={DROP_IN.badge}
            heading={DROP_IN.heading}
            sub={DROP_IN.sub}
            bands={DROP_IN.bands}
            seasons={[{ label: "School Year", options: DROP_IN.schoolYear }]}
            actions={
              <>
                <Link href="/apply" className={btnPop}>
                  {DROP_IN.getStarted}
                </Link>
                <Link href="/homeschool" className={btnSage}>
                  {DROP_IN.learnMore}
                </Link>
              </>
            }
          />
        </div>
      </section>
    </GardenShell>
  );
}

function Hero() {
  const { openWaitlist } = useDialogs();
  return (
    <PageHero
      badge={<>💛 {TUITION_HERO.badge}</>}
      highlight={TUITION_HERO.heading}
      body={TUITION_HERO.body}
      photos={TUITION_HERO.photos}
    >
      <div className="mt-9 flex justify-center">
        <Magnetic>
          <button onClick={openWaitlist} className={btnPop}>
            {TUITION_HERO.cta}
          </button>
        </Magnetic>
      </div>
    </PageHero>
  );
}
