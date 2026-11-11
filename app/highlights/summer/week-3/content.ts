/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: "/assets/highlights/summer_week_three/B6F3BF45-573E-4C9E-90C7-DF0802E13E0E.JPG",
    caption: "Independent work time in our Montessori environment",
  },
  {
    src: "/assets/highlights/summer_week_three/059D446B-28E2-404A-AA9E-1C31ECA397C2.JPG",
    caption: "Choosing their own learning path",
  },
  {
    src: "/assets/highlights/summer_week_three/AFD7C6F5-A4E0-4EB6-9A81-931C53C1C814.JPG",
    caption: "Phonics practice — blends, digraphs, and Magic E",
  },
  {
    src: "/assets/highlights/summer_week_three/5B9A16B7-70BE-464B-9D57-20639BE6E55D 2.JPG",
    caption: "Letter identification and sound matching",
  },
  {
    src: "/assets/highlights/summer_week_three/CEADADE6-E43C-4A6D-8AB5-E8E2734423A9.JPG",
    caption: "Building CVC words together",
  },
  {
    src: "/assets/highlights/summer_week_three/4C53798C-920D-4497-B46C-1037E6FF21E4.JPG",
    caption: "Banana bread chocolate chip muffins in the making",
  },
  {
    src: "/assets/highlights/summer_week_three/ED35AB4E-8E56-43C6-ADA7-A7D9CDE3C95C.jpeg",
    caption: "Stirring, measuring, and mixing",
  },
  {
    src: "/assets/highlights/summer_week_three/2B11FA2F-F6BE-4184-B354-7B592E1FD313 2.JPG",
    caption: "Banana yogurt popsicles — a big hit!",
  },
  {
    src: "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
    caption: "Lunch with a Loved One — families together",
  },
  {
    src: "/assets/highlights/summer_week_three/IMG_9313.JPG",
    caption: "Our community shining bright",
  },
  {
    src: "/assets/highlights/summer_week_three/IMG_9138.jpg",
    caption: "Joy at the Lunch with a Loved One event",
  },
  {
    src: "/assets/highlights/summer_week_three/270406F4-D0DB-49C7-B0FD-893838BC93D6 2.JPG",
    caption: "Context clues and vocabulary games",
  },
  {
    src: "/assets/highlights/summer_week_three/2E90C4B5-CECC-4774-B9F9-65F11DF9A6D7 2.JPG",
    caption: "Charades — acting out vocabulary words",
  },
  {
    src: "/assets/highlights/summer_week_three/8CE3DD93-63A1-4FD4-A81C-B4949CA60664.JPG",
    caption: "Multiplication arrays in math",
  },
  {
    src: "/assets/highlights/summer_week_three/IMG_9275.jpg",
    caption: "Area and perimeter zoo project",
  },
  {
    src: "/assets/highlights/summer_week_three/5DD49FD0-D35F-4411-8171-65D816CA4934.JPG",
    caption: "Designing animal enclosures",
  },
  {
    src: "/assets/highlights/summer_week_three/FF4C9AB2-63DC-4FBC-BDDA-99D15C197948 2.JPG",
    caption: "Drawing and coloring our zoo animals",
  },
  {
    src: "/assets/highlights/summer_week_three/77048964-333A-426F-9E8C-69F51FB987D7.JPG",
    caption: "Our class zoo comes together",
  },
  {
    src: "/assets/highlights/summer_week_three/9AE171D2-072A-4BB0-9578-F4407CB2B26C 2.JPG",
    caption: "Life skills — learning to wash dishes",
  },
  {
    src: "/assets/highlights/summer_week_three/4591E194-779B-46AC-A893-B9E75B6D64A7.JPG",
    caption: "Beach bash water slide fun",
  },
  {
    src: "/assets/highlights/summer_week_three/BC68CF40-220C-48CE-8C63-D14F22100AAA.JPG",
    caption: "Ocean-themed slime and ice cream bar",
  },
  {
    src: "/assets/highlights/summer_week_three/BCC6DAA3-53B7-4343-8734-E38512D99959 2.JPG",
    caption: "Painting sea shells at Field Friday",
  },
  {
    src: "/assets/highlights/summer_week_three/3F03181F-5761-416B-8C7D-003DA143D804.JPG",
    caption: "Week 3 memories at Sage Field",
  },
];

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "🧠", label: "Montessori Independence", desc: "Choosing between phonics, math, writing, life skills, and art — managing their own time and pace" },
  { emoji: "📖", label: "Phonics: CVC, Blends & Magic E", desc: "From letter identification to digraphs and Magic E patterns — students blending sounds independently" },
  { emoji: "🍌", label: "Banana Bread Muffins & Popsicles", desc: "Banana bread chocolate chip muffins and banana yogurt popsicles — a real-world cooking hit" },
  { emoji: "👨‍👩‍👧", label: "Lunch with a Loved One", desc: "A joyful family event celebrating the community we're building together" },
  { emoji: "🌊", label: "Beach Bash Field Friday", desc: "Water slide, ocean-themed slime, ice cream bar, and painted sea shells" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "📝", label: "Context Clues & Vocabulary", desc: "Using context clues in passages and a charades game to act out vocabulary words" },
  { emoji: "✖️", label: "Multiplication Fluency", desc: "Arrays for lower el; 2-digit × 1-digit for upper el — refreshing multiplication facts 6–12" },
  { emoji: "📐", label: "Area & Perimeter Zoo Project", desc: "Two multiplication facts + a zoo animal → find area/perimeter, draw the enclosure, build a class zoo" },
  { emoji: "🍽️", label: "Life Skills: Dishwashing", desc: "Used play kitchens as real kitchens — each child responsible for washing two dishes" },
  { emoji: "👨‍👩‍👧", label: "Lunch with a Loved One", desc: "First family event of the summer — families got a glimpse into a day at Sage Field" },
];

export const WEEK: WeekHighlight = {
  program: "summer",
  badge: "Summer 2026 · Week 3",
  title: "Week 3 Highlights ☀️",
  dates: "Jun 8–12, 2026",
  intro:
    "Week 3 at Sage Field has been all about embracing independence and community. From Montessori work cycles where students chose their own path, to phonics breakthroughs, delicious cooking projects, a joyful Lunch with a Loved One, and a splashy beach bash Field Friday — it was a week full of growth, connection, and fun.",
  learned: {
    badge: "What We Learned",
    heading: "A Week of Discovery",
    sub: "Both our primary and elementary groups had a full, purposeful week.",
  },
  groups: [
    {
      title: "Primary",
      emoji: "🌱",
      tint: "coral",
      items: EARLY_LEARNER_HIGHLIGHTS,
    },
    {
      title: "Elementary",
      emoji: "📐",
      tint: "sage",
      items: ELEMENTARY_HIGHLIGHTS,
    },
  ],
  beyond: {
    label: "Beyond Academics",
    items: [
      {
        emoji: "🍌",
        title: "Cooking Class",
        desc: "Banana bread chocolate chip muffins + banana yogurt popsicles — real measuring, mixing, and pride in the finished product.",
      },
      {
        emoji: "🌊",
        title: "Beach Bash Field Friday",
        desc: "Inflatable water slide, ocean-themed slime, ice cream bar, and painted sea shells — a perfect summer afternoon.",
      },
      {
        emoji: "👨‍👩‍👧",
        title: "Lunch with a Loved One",
        desc: "Families joined us for a peek into daily life at Sage Field. Next up: Donuts with Grown Ups on July 6th (8:15–9:00am).",
      },
    ],
  },
  photos: {
    badge: "Photo Highlights",
    heading: "Moments from the Week",
    hint: "Click any photo to open the full gallery.",
  },
  images: WEEK_IMAGES,
  carouselCount: 8,
  cta: {
    badge: "Join Us",
    heading: "Want to join us this summer or next fall?",
    body:
      "Spots are still available for Summer 2026 and enrollment is open for School Year 2026–2027. Come see the campus for yourself — we'd love to meet your family.",
    primary: { label: "Enroll Now →", href: "/apply" },
    secondary: { label: "🏡 Tour the Campus", href: "/tour" },
  },
};
