/**
 * Copy for the School Year 2026–2027 page, carried over verbatim from the
 * previous app/school-year-2026-2027/page.tsx. Pricing reuses the Tuition
 * page blocks (app/tuition) and the team reuses the home Team section.
 */
import type { Run } from "@/app/_garden/types";

export const SY_HERO = {
  badge: "School Year 2026–2027",
  headingBefore: "School Year",
  headingHighlight: "2026–2027",
  subtitle: "August 2026 – May 2027 · Up to 4 Days/Week · Ages 4–11",
  apply: "Apply Now",
  tour: "🏡 Interested in a Tour?",
  photos: ["/assets/Stock3.jpg", "/assets/Stock1.jpg", "/assets/Stock8.jpg"],
};

export const SY_SUMMARY =
  "Sage Field is a small outdoor learning microschool located in Round Rock, TX. Sage Field operates as a private microschool, not a child-care or daycare center. We blend elements of Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics to create a nurturing, nature-connected learning environment where children are always wondering, exploring, and growing.";

export const SY_DETAILS = [
  { label: "Start Date", value: "August 17, 2026" },
  { label: "Ages", value: "4–11 years" },
  { label: "Schedule", value: "Up to 4 days/week" },
  { label: "Term", value: "6-month commitment" },
];

export const SY_DESCRIPTION = [
  "The School Year 2026–2027 program runs as a six-month commitment, offering up to four days per week of enriched learning for children ages 4–11. Students receive individualized support in literacy and numeracy alongside science, art, movement, and social-emotional learning.",
  "Enrollment is limited to preserve the small-group environment that makes Sage Field special. Families begin with an application and a mutual-fit conversation to ensure the program is the right match for your child.",
];

export const SY_GALLERY = {
  alt: "School year program photo",
  photos: [
    "/assets/Stock1.jpg",
    "/assets/Stock3.jpg",
    "/assets/Stock6.jpg",
    "/assets/Stock7.jpg",
    "/assets/Stock8.jpg",
    "/assets/Stock11.jpg",
    "/assets/Kid1.png",
  ],
};

export const SY_PHILOSOPHY = {
  badge: "How We Learn",
  heading: "How We Learn",
  subtitle: "Educational Philosophy",
  p1: [
    { text: "Our approach integrates elements of " },
    { text: "Montessori", highlight: true },
    { text: ", " },
    { text: "Waldorf", highlight: true },
    { text: ", and " },
    { text: "Reggio Emilia", highlight: true },
    { text: " methods with " },
    { text: "TEKS-aligned academics", highlight: true },
    { text: ". We enrich learning with social-emotional education, arts, music, and creative problem-solving." },
  ] as Run[],
  p2: [
    { text: "We value " },
    { text: "emotional regulation", highlight: true },
    { text: ", both for students and educators. A calm, connected teacher creates a community where children thrive." },
  ] as Run[],
  pillars: [
    { icon: "🌱", title: "Hands-on Learning", description: "Experiential activities that engage curiosity" },
    { icon: "🧘", title: "Emotional Regulation", description: "Mindfulness practices for students & educators" },
    { icon: "🎨", title: "Creative Expression", description: "Artistic and musical creativity flourish" },
    { icon: "🌳", title: "Movement & Nature", description: "Movement-based and outdoor education" },
  ],
};

export const SY_HOMESCHOOL = {
  badge: "Homeschool Friendly",
  headingBefore: "Homeschool",
  headingHighlight: "Drop-In",
  headingAfter: "Available",
  body: "Homeschool families can join the School Year program on a flexible schedule — 1 to 5 days per week. Every child gets full access to all enrichments, no matter how many days they attend.",
  chips: [
    { emoji: "📅", label: "1–5 Days/Week" },
    { emoji: "🎯", label: "Ability-Based Learning" },
    { emoji: "🎨", label: "All Enrichments Included" },
    { emoji: "👥", label: "~10 Kids Per Class" },
  ],
  cta: "Learn More About Drop-In",
};

export const SY_PRICING = {
  badge: "Tuition & Pricing",
  heading: "School Year Pricing",
};

export const SY_CTA = {
  heading: "Ready to apply?",
  body: "Spots are limited — apply early to secure your child's place in the School Year 2026–2027 program.",
  start: "Start Application",
  interest: "Interest Form",
};
