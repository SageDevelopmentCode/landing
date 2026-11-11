/**
 * Copy for the Partnerships page, carried over verbatim from the previous
 * app/partnerships/page.tsx. Partner names, logos, embeds, pull quotes and
 * CTA labels stay in app/lib/partnerships-data.ts (shared with the preview).
 */
import type { ReactNode } from "react";
import { PHOTO_POOL } from "@/app/_home/content";
import { ENCLAVE_HREF } from "@/app/lib/partnerships-data";

export const PARTNERS_HERO = {
  badge: "🤝 Community Partnerships",
  headingBefore: "Our",
  headingHighlight: "Partners",
  body: "It takes a village. We're grateful for the local businesses and organizations who believe in adventurous, community-rooted childhood education.",
  /** Decorative polaroids under the heading. */
  photos: [PHOTO_POOL[11], PHOTO_POOL[2], PHOTO_POOL[13]],
};

const link =
  "font-extrabold text-[var(--sf-coral-deep)] underline decoration-2 underline-offset-4 hover:text-[var(--sf-ink)] focus-visible:text-[var(--sf-ink)]";

export const PARTNER_BODIES: Record<string, ReactNode> = {
  "The Enclave at Round Rock Senior Living": (
    <>
      <p className="mb-4">
        We&apos;re partnering with{" "}
        <a href={ENCLAVE_HREF} target="_blank" rel="noopener noreferrer" className={link}>
          The Enclave at Round Rock Senior Living
        </a>
        , operated by Spectrum Retirement Communities, to connect our students
        with residents through shared activities and conversation across
        generations — from sewing days and creative making to time together on
        campus.
      </p>
      <p>
        For us, community isn&apos;t just a topic. It&apos;s something we want
        our students to participate in. 🌱
      </p>
    </>
  ),
  "Ally Medical ER": (
    <>
      We&apos;re so grateful to have a partnership with{" "}
      <a
        href="https://www.allymedical.com/locations/round-rock-emergency-room/"
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        Ally Medical ER Round Rock
      </a>
      , just 6 minutes from our school, who generously gifted us two fully
      stocked first aid kits and additional supplies to help keep our students
      prepared, protected, and cared for. It truly takes a village, and
      we&apos;re thankful to have community partners who support adventurous
      childhoods as much as we do. 🌿🩹💚
    </>
  ),
  "VELA Education Fund": (
    <>
      <p className="mb-4">
        Sage Field is a VELA Microgrant Recipient and part of the VELA Founder
        Network, a national community of founders building small, human-centered
        learning environments outside the traditional school system.
      </p>
      <p>
        <a href="https://vela.org/" target="_blank" rel="noopener noreferrer" className={link}>
          VELA Education Fund
        </a>{" "}
        is a national nonprofit that invests in &ldquo;indie&rdquo; education
        models — microschools, homeschool co&#8209;ops, after&#8209;school
        programs, and more — through flexible grants, technology, and a growing
        network of peers. Their support helps us expand our outdoor-based,
        small-group programs and reach more families who are looking for a
        different kind of school experience.
      </p>
    </>
  ),
};
