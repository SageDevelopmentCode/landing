/**
 * Copy for the What We Offer page header, carried over verbatim from the
 * previous app/what-we-offer/page.tsx. The rest of the page reuses the home
 * Offer and Contact sections and their copy in app/_home/content.tsx.
 */
import { PHOTO_POOL } from "@/app/_home/content";

export const OFFER_HERO = {
  badge: "What We Offer",
  headingBefore: "What We Offer at",
  headingHighlight: "Sage Field",
  body: "Discover the programs, experiences, and opportunities we provide for every child at Sage Field Private School.",
  /** Decorative polaroids under the heading. */
  photos: [PHOTO_POOL[1], PHOTO_POOL[5], PHOTO_POOL[8]],
};
