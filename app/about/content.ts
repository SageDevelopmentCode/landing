/**
 * Copy for the About page header (app/about/AboutHero.tsx), carried over
 * verbatim from the previous app/about/page.tsx. The rest of the page reuses
 * the home page sections and their copy in app/_home/content.tsx.
 */
import { PHOTO_POOL } from "@/app/_home/content";

export const ABOUT_HERO = {
  badge: "About Us",
  headingBefore: "About",
  headingHighlight: "Sage Field",
  headingAfter: "Private School",
  body: "Learn more about our private microschool, our mission, and the team behind Sage Field",
  /** Decorative polaroids beside the heading. */
  photos: [PHOTO_POOL[0], PHOTO_POOL[4], PHOTO_POOL[7]],
};
