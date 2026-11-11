/** Data for one weekly recap page (app/highlights/<program>/week-N/content.ts). */

export type HighlightItem = { emoji: string; label: string; desc: string };
export type BeyondItem = { emoji: string; title: string; desc: string };
export type WeekImage = { src: string; caption: string };
export type CtaLink = { label: string; href: string };

/** Card tint, matching the icon colours the old pages used per grade band. */
export type BandTint = "coral" | "sage" | "sky";

export type GradeGroup = {
  title: string;
  /** e.g. "Pre-K & Kindergarten" */
  subtitle?: string;
  emoji: string;
  tint: BandTint;
  items: HighlightItem[];
};

export type WeekHighlight = {
  program: "school-year" | "summer";
  badge: string;
  title: string;
  dates?: string;
  intro: string;
  learned: { badge: string; heading: string; sub: string };
  groups: GradeGroup[];
  beyond: { label: string; items: BeyondItem[] };
  /** Optional note for families under the learning cards. */
  callout?: { emoji: string; label: string; title: string; body: string };
  photos: { badge: string; heading: string; hint: string };
  images: WeekImage[];
  /** How many of the first images cycle in the hero slideshow. */
  carouselCount: number;
  cta: { badge: string; heading: string; body: string; primary: CtaLink; secondary: CtaLink };
};
