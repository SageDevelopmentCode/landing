"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import { Reveal } from "@/app/_garden/motion";
import { Draw, Leaf, Star, Sun } from "@/app/_garden/ui";
import { HERO, SUCCESS } from "../content";

/** Shadow Day booking confirmation (Stripe success return), in the Garden style. */
export default function SuccessPage() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"] });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false}>
      <section className="relative overflow-hidden pt-36 pb-24 lg:pt-44 lg:pb-32">
        <Draw className="absolute left-[10%] top-[24%] hidden w-20 lg:block" delay={0.4}>
          <Sun />
        </Draw>
        <Draw className="absolute right-[12%] top-[30%] hidden w-14 lg:block" delay={0.7}>
          <Leaf />
        </Draw>
        <Draw className="absolute bottom-[16%] left-[18%] hidden w-10 lg:block" delay={1}>
          <Star />
        </Draw>
        <div className="relative mx-auto max-w-xl px-6">
          <Reveal y={50}>
            <div className="rotate-1 transition-transform duration-500 hover:rotate-0">
              <div className="sf-ticket overflow-hidden rounded-[28px] bg-[var(--sf-coral)] text-white shadow-[0_30px_60px_-35px_rgba(43,42,38,0.6)]">
                <div className="relative h-44">
                  <Image src={HERO.photos[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 576px" preload />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-coral)] to-transparent" />
                  <span className="absolute left-1/2 top-full flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
                    <CheckCircle className="h-8 w-8 text-[var(--sf-sage-deep)]" aria-hidden="true" />
                  </span>
                </div>
                <div className="border-t-2 border-dashed border-white/50 px-8 pb-10 pt-12 text-center">
                  <h1 className="sf-display text-5xl md:text-6xl">{SUCCESS.heading}</h1>
                  <p className="mt-4 text-lg leading-relaxed text-white/90">{SUCCESS.body}</p>
                  <p className="sf-hand mt-5 text-2xl text-white">{SUCCESS.email}</p>
                  <Link
                    href="/"
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-extrabold text-[var(--sf-coral-deep)] shadow-[0_6px_0_0_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 active:translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                  >
                    {SUCCESS.back}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </GardenShell>
  );
}
