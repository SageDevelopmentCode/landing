/**
 * Copy for the Team page header, carried over verbatim from the previous
 * app/team/page.tsx. The rest of the page reuses the home Team and Contact
 * sections and their copy in app/_home/content.tsx.
 */
import { TEAM } from "@/app/_home/content";

export const TEAM_HERO = {
  badge: "Our Team",
  headingBefore: "Meet the",
  headingHighlight: "Team",
  body: "The passionate educators and staff dedicated to nurturing every child at Sage Field Private School",
  /** Decorative portraits beside the heading (the lead sits in the middle). */
  photos: [TEAM.members[0].image, TEAM.lead.image, TEAM.members[3].image],
};
