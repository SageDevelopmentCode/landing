/**
 * Copy for the Homeschool Drop-In page, carried over verbatim from the
 * previous app/homeschool/page.tsx. School-year drop-in prices are shared
 * with the Tuition page (app/tuition/content.ts).
 */
import type { Run } from "@/app/_garden/types";
import { DROP_IN } from "@/app/tuition/content";

export const HS_HERO = {
  badge: "Homeschool Drop-In",
  headingBefore: "Homeschool",
  headingHighlight: "Drop-In",
  headingAfter: "Program",
  subtitle: "1–3 Days/Week · Ages 4–11 · Fridays Are Field Days",
  apply: "Apply Now",
  tour: "🏡 Interested in a Tour?",
  photos: ["/assets/Stock3.jpg", "/assets/Kid1.png", "/assets/Stock11.jpg"],
};

export const HS_SUMMARY =
  "Sage Field's Homeschool Drop-In Program is built for families who want flexible, enriching academic support without a long-term commitment. Choose 1 to 3 days per week — and adjust as your family's schedule evolves.";

export const HS_DETAILS = [
  { label: "Schedule", value: "1–3 Days/Week" },
  { label: "Ages", value: "4–11 Years" },
  { label: "Fridays", value: "Field Days" },
  { label: "Class Size", value: "~10 Kids" },
];

export const HS_DESCRIPTION: Run[][] = [
  [
    { text: "Unlike traditional schools that group children by grade, Sage Field uses " },
    { text: "ability-based and interest-led grouping", highlight: true },
    { text: ". Every child gets individualized academic support in literacy and numeracy — exactly where they are, not where their birthday says they should be." },
  ],
  [
    { text: "Every child who attends — whether 1 day or 5 days a week — joins all enrichments: arts, music, movement, science, and social-emotional learning. No child misses out because of their schedule." },
  ],
];

export const HS_GALLERY = {
  alt: "Homeschool drop-in program photo",
  photos: ["/assets/Stock1.jpg", "/assets/Stock3.jpg", "/assets/Stock7.jpg", "/assets/Stock11.jpg", "/assets/Kid1.png"],
};

export const HS_SCHEDULE = {
  badge: "Flexible Scheduling",
  heading: "Choose Your Schedule",
  subtitle: "From one day a week to three — you decide",
  tiers: [
    {
      days: "1x/week",
      title: "Light Touch",
      description: "Perfect for families who want a taste of microschool enrichment without disrupting your home rhythm.",
    },
    {
      days: "2x/week",
      title: "Balanced Rhythm",
      description: "Two structured days create a consistent routine while leaving plenty of flexibility for family-led learning.",
    },
    {
      days: "3x/week",
      title: "Regular Learner",
      description: "Three days offers deep engagement with academics, enrichments, and peer connection each week.",
    },
  ],
};

export const HS_FRIDAY = {
  badge: "Every Friday",
  headingHighlight: "Field Day",
  headingAfter: "Fridays",
  body: "Every Friday is a unique, themed adventure — included for all families who attend on Fridays. No two Fridays are ever the same.",
  chips: [
    { emoji: "🌿", label: "Outdoor & Nature" },
    { emoji: "🎉", label: "Unique Every Friday" },
    { emoji: "🧒", label: "All Ages Welcome" },
    { emoji: "🎨", label: "Themed Adventures" },
  ],
};

export const HS_WHY = {
  badge: "Why Sage Field?",
  heading: "Why Microschool for Homeschoolers?",
  subtitle: "The best of both worlds",
  body: "Sage Field is a microschool built specifically for flexibility. With tiny class sizes and a family-centered approach, you get the structure and socialization of school — while your family keeps full control of the learning journey.",
  pillars: [
    {
      icon: "🎯",
      title: "Ability-Based Learning",
      description: "We group by ability and interest, not grade. Each child progresses at their own pace.",
    },
    {
      icon: "👥",
      title: "Tiny Class Sizes",
      description: "With ~10 kids per class, every child gets real attention and a genuine community.",
    },
    {
      icon: "🌱",
      title: "Interest-Led Academics",
      description: "Curiosity drives the curriculum. Kids learn more when they care about the subject.",
    },
    {
      icon: "🤝",
      title: "Real Socialization",
      description: "Mixed-age groups and collaborative projects build authentic friendships and social skills.",
    },
  ],
};

export const HS_PROGRAM = {
  badge: "Our Program",
  heading: "Drop-In Available for the School Year",
  body: "The Homeschool Drop-In option is part of our School Year 2026–2027 program — join us 1 to 3 days a week.",
  enrollmentOpen: "Enrollment is now open",
  learnMore: "Learn More",
  interest: "Interest Form",
  title: "School Year 2026–2027",
  dates: "August 17, 2026 – March 2027",
  details: ["Ages 4–11", "Mon-Thu", "6-month commitment", "~10 children per class", "Field Fridays", "Aftercare available"],
  description:
    "A full school-year microschool experience blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics.",
  href: "/school-year-2026-2027",
  image: "/assets/ImageTwo.jpg",
};

export const HS_PRICING = {
  badge: "Pricing",
  heading: "Flexible Enrollment Options",
  sub: "Join our community 1–3 days/week",
  bands: DROP_IN.bands,
  seasons: [
    { label: "School Year", options: DROP_IN.schoolYear },
  ],
};

export const HS_CTA = {
  heading: "Ready to drop in?",
  body: "Spots are limited — reach out to find the right schedule for your family.",
  apply: "Apply Now",
  contact: "Contact Us",
};
