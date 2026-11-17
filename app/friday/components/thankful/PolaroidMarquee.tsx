"use client";

import Image from "next/image";
import { Marquee } from "@/app/_garden/motion";
import { BG, PHOTOS } from "./data";

const TILTS = [-4, 3, -2, 4, -3, 2];
const TAPE = ["#F4C04E", "#EE8434", "#B23A48", "#6b9474", "#F6E3BF"];

export default function PolaroidMarquee() {
  return (
    <section className="py-12 lg:py-16" style={{ backgroundColor: BG.wheat }} aria-label="Photos of students at Sage Field">
      <p className="sf-hand mb-6 text-center text-2xl text-[#B4561A]">a few things we’re grateful for 🧡</p>
      <Marquee duration={55} trackClassName="py-6">
        {PHOTOS.map((src, i) => (
          <figure
            key={src}
            className="sf-polaroid relative mx-3 w-48 shrink-0 transition-transform duration-300 hover:!rotate-0 hover:scale-105 sm:mx-4 sm:w-60"
            style={{ rotate: `${TILTS[i % TILTS.length]}deg` }}
          >
            <span
              className="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 -rotate-3 rounded-sm opacity-80"
              style={{ backgroundColor: TAPE[i % TAPE.length] }}
              aria-hidden
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[3px]">
              <Image src={src} alt="Students at Sage Field" fill className="object-cover" sizes="(max-width: 640px) 192px, 240px" />
            </div>
          </figure>
        ))}
      </Marquee>
    </section>
  );
}
