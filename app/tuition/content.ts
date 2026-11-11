/**
 * Copy for the Tuition page, carried over verbatim from the previous
 * app/tuition/page.tsx and app/components/FullEnrollmentCard.tsx. Prices for
 * full enrollment and the packages come from TUITION in app/_home/content.tsx
 * (the same figures the legacy cards showed).
 */
import { TUITION, PHOTO_POOL } from "@/app/_home/content";
import type { DropInOption } from "@/app/_home/sections/Tuition";

export const TUITION_HERO = {
  badge: "TUITION",
  heading: "Tuition & Enrollment",
  body: "We offer flexible enrollment options designed to support your family's needs and schedule.",
  cta: "Interested in Joining?",
  photos: [TUITION.full.image, PHOTO_POOL[3], TUITION.fieldDay.image],
};

/** Buttons and small print under Full Enrollment (from FullEnrollmentCard). */
export const FULL_ENROLLMENT_ACTIONS = {
  interested: "Interested in joining?",
  questions: "Have any questions?",
  dropInNote: "For drop-in options, please email us at",
  email: "sabrina@sagefield.co",
};

/** Homeschool drop-in, school-year monthly pricing. */
export const DROP_IN = {
  badge: "Homeschool Drop-In",
  heading: "Flexible Enrollment Options",
  sub: "Join our community 1-3 days/week",
  bands: ["2nd–4th", "Pre-K–1st"] as const,
  schoolYear: [
    { title: "1 Day / Week", kind: "Part-Time", prices: [440, 480], note: "Attend one consistent day each week, paid monthly" },
    { title: "2-Day/Week", kind: "Part-Time", prices: [600, 640] },
    { title: "3-Day/Week", kind: "Part-Time", prices: [850, 920] },
  ] as DropInOption[],
  getStarted: "Get Started",
  learnMore: "Learn More",
};
