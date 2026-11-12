/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: "/assets/highlights/summer_week_six/1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
    caption: "Week 6 kicks off — energy, warmth, and familiar faces back together",
  },
  {
    src: "/assets/highlights/summer_week_six/1D47ADF7-BFF8-4E74-8A51-E0444E1E5AB2.JPG",
    caption: "Banana oatmeal pancakes from scratch — food safety and careful movements",
  },
  {
    src: "/assets/highlights/summer_week_six/229F0F64-45E0-44C9-8EDE-E7F39D948130.JPG",
    caption: "Cooking together — following directions and taking pride in every step",
  },
  {
    src: "/assets/highlights/summer_week_six/337A7F28-CB3D-47AD-9B02-76706D3EC299.JPG",
    caption: "Pineapple popsicles — a highlight of learning and fun this week",
  },
  {
    src: "/assets/highlights/summer_week_six/5065B50D-86EC-4CD1-92CD-C4327D38CA14.JPG",
    caption: "Multi-step word problems — upper el using all four operations",
  },
  {
    src: "/assets/highlights/summer_week_six/6015040C-CE16-4977-A8FF-8243A4968654.JPG",
    caption: "Lower el tackles two-step equations with two-digit addition and subtraction",
  },
  {
    src: "/assets/highlights/summer_week_six/6A828A98-5226-4767-BDD7-6FC3133E19D8.JPG",
    caption: "Venn Diagrams — comparing and contrasting stories across texts",
  },
  {
    src: "/assets/highlights/summer_week_six/6ED6BA87-AB2C-42FA-97F4-57719463AB1A.JPG",
    caption: "Natural disaster research — final drafts and 3D shoe box models on the way",
  },
  {
    src: "/assets/highlights/summer_week_six/C40F5D0B-D238-425F-B29C-ABB8F47F8FC8.JPG",
    caption: "Reading and foundational skills — confidence growing week by week",
  },
  {
    src: "/assets/highlights/summer_week_six/D9C252D3-D1B9-43D5-8B1A-6F161765E253 2.JPG",
    caption: "Resilience in action — stretching brains and becoming thoughtful students",
  },
  {
    src: "/assets/highlights/summer_week_six/IMG_9916.JPG",
    caption: "Hands-on exploration — the freedom to learn through play",
  },
  {
    src: "/assets/highlights/summer_week_six/IMG_9918.JPG",
    caption: "Kind friends and curious minds — our community at its best",
  },
  {
    src: "/assets/highlights/summer_week_six/IMG_9919.JPG",
    caption: "Six weeks strong — and still going",
  },
  {
    src: "/assets/highlights/summer_week_six/sagefield_1783398462180.jpg",
    caption: "Halfway through summer — six weeks of showing up and building something beautiful",
  },
];

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "🍌", label: "Banana Oatmeal Pancakes", desc: "Made from scratch — students practiced food safety, careful movements, following directions, and took real pride in what they created" },
  { emoji: "🍍", label: "Pineapple Popsicles", desc: "Cooking together was a highlight of the week — fun, purposeful, and delicious all at once" },
  { emoji: "📖", label: "Core Foundations", desc: "Continued building reading and foundational skills; confidence is growing week by week and it shows" },
  { emoji: "💪", label: "Resilience & Growth", desc: "Students are becoming more resilient, stretching their brains, and showing up as thoughtful students and kind friends" },
  { emoji: "🌱", label: "Hands-On Learning", desc: "Strong foundations give our students the freedom to explore through play — and they're making the most of it" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "🧮", label: "Multi-Step Word Problems", desc: "Upper el used multiplication, subtraction, division, and addition together. Lower el tackled two-step equations with two-digit addition and subtraction" },
  { emoji: "📚", label: "Comparing & Contrasting", desc: "Used Venn Diagrams — a familiar tool from Week 5 — to compare and contrast stories across multiple texts" },
  { emoji: "🌋", label: "Natural Disaster Projects", desc: "Most students finishing final drafts this week, with 3D shoe box diorama models starting on Wednesday" },
  { emoji: "🎉", label: "Halfway Through Summer!", desc: "Six weeks of growth — students and families have adjusted beautifully and the energy in the room shows it" },
];

export const WEEK: WeekHighlight = {
  program: "summer",
  badge: "Summer 2026 · Week 6",
  title: "Week 6 Highlights ☀️",
  dates: "Jun 29–Jul 2, 2026",
  intro:
    "Week 6 hit the halfway mark — and what a six weeks it's been. Primary students made banana oatmeal pancakes and pineapple popsicles from scratch, continued building reading and foundational skills, and showed incredible growth in resilience and independence. Elementary students tackled multi-step word problems (upper el using all four operations; lower el working through two-step equations), explored comparing and contrasting with Venn Diagrams, and pushed forward on their natural disaster research projects — with 3D shoe box models on the horizon. Six weeks down, six to go.",
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
        title: "Cooking from Scratch",
        desc: "Banana oatmeal pancakes and pineapple popsicles built food safety habits, fine motor skills, and real kitchen confidence.",
      },
      {
        emoji: "📦",
        title: "3D Natural Disaster Models",
        desc: "Shoe box dioramas starting this week — students wrapping up final drafts and bringing their research to life.",
      },
      {
        emoji: "🌟",
        title: "Halfway Milestone",
        desc: "Six weeks of showing up, adjusting, and building something beautiful together — students and families alike.",
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
