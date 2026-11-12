/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
    caption: "New students, new friendships — Week 4 is off to a great start",
  },
  {
    src: "/assets/highlights/summer_week_four/4E560267-530C-43BF-BC4A-C586C9DBE40D.JPG",
    caption: "Welcoming new families into our Sage Field community",
  },
  {
    src: "/assets/highlights/summer_week_four/IMG_9586.JPG",
    caption: "Settling in and feeling at home",
  },
  {
    src: "/assets/highlights/summer_week_four/IMG_9531.JPG",
    caption: "Building connections on day one",
  },
  {
    src: "/assets/highlights/summer_week_four/C3E15299-9AB4-420A-BB46-2C998A4B1C38 2.JPG",
    caption: "Phonics work — letter sounds and CVC word building",
  },
  {
    src: "/assets/highlights/summer_week_four/1FEDBFAC-0CD4-4D95-8718-9F10D5531E71 2.JPG",
    caption: "Letter recognition practice in Primary",
  },
  {
    src: "/assets/highlights/summer_week_four/77A3BBA5-C885-4179-A944-6F9B005A6B0E.JPG",
    caption: "Early reading skills — blending sounds into words",
  },
  {
    src: "/assets/highlights/summer_week_four/8B8A8CAF-47F1-415E-B12D-0C1E2B5942FC.JPG",
    caption: "Addition and number sense exploration",
  },
  {
    src: "/assets/highlights/summer_week_four/6B6E75A3-57F1-4675-A79C-27A91E3CA8AE 2.JPG",
    caption: "Multi-digit multiplication with the area model",
  },
  {
    src: "/assets/highlights/summer_week_four/896A997D-C5D1-4443-9FAA-807FE4D6E7C4.JPG",
    caption: "Multiplication fact fluency — numbers 6 and up",
  },
  {
    src: "/assets/highlights/summer_week_four/EC369A3C-19C6-4263-BA9A-6586154D0990.JPG",
    caption: "Venn diagrams — comparing fiction and non-fiction texts",
  },
  {
    src: "/assets/highlights/summer_week_four/1276FB1A-AEEB-43D0-8028-E2419B2679AF.JPG",
    caption: "Summarizing passages — mastered by Thursday",
  },
  {
    src: "/assets/highlights/summer_week_four/1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
    caption: "Strawberry jam — maceration time!",
  },
  {
    src: "/assets/highlights/summer_week_four/27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG",
    caption: "Stirring and reducing on the stovetop",
  },
  {
    src: "/assets/highlights/summer_week_four/FF7095AC-1AFC-4011-9C27-8B2C0573121B 2.JPG",
    caption: "Our homemade strawberry jam — from scratch",
  },
  {
    src: "/assets/highlights/summer_week_four/FD2FCA61-D903-4059-B681-20AF2027754F.JPG",
    caption: "Tasting the results of our cooking class",
  },
  {
    src: "/assets/highlights/summer_week_four/5E38B790-B4AF-405D-BC71-0C6A367E4E57.JPG",
    caption: "STEM Friday — marshmallow and spaghetti tower structures",
  },
  {
    src: "/assets/highlights/summer_week_four/A4107889-4FC8-4F4F-BE2E-5F49868F3AA4 2.JPG",
    caption: "Baking soda volcanoes in action",
  },
  {
    src: "/assets/highlights/summer_week_four/EAFF91EE-8496-4132-AA3B-3587816CB2B8.JPG",
    caption: "Assembling take-home rockets",
  },
  {
    src: "/assets/highlights/summer_week_four/3F2A4707-D076-4AFE-9216-BD8EB3CAF5D9.JPG",
    caption: "STEM Adventure Friday energy — building and exploring",
  },
  {
    src: "/assets/highlights/summer_week_four/5D534B24-3173-420E-9800-FEB0454E3B43 2.JPG",
    caption: "Scientists at work",
  },
  {
    src: "/assets/highlights/summer_week_four/DFDDC9CF-2547-4219-9893-C3EB68F84E88 2.JPG",
    caption: "Week 4 memories at Sage Field",
  },
];

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "👋", label: "New Students & New Friendships", desc: "Week 4 brought new families into our community — welcomed with warmth and kindness by students and staff" },
  { emoji: "📖", label: "CVC Words & Early Reading", desc: "Phonics and early reading skills — letter recognition, letter sounds, and blending CVC words" },
  { emoji: "➕", label: "Addition & Number Sense", desc: "Hands-on addition practice alongside patterns and early math concepts" },
  { emoji: "🔢", label: "Patterns & Early Math", desc: "Identifying, extending, and creating patterns as a foundation for mathematical thinking" },
  { emoji: "🧹", label: "Life Skills & Independence", desc: "Practical life activities that build responsibility, coordination, and self-sufficiency" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "📚", label: "Summarizing Fiction & Non-Fiction", desc: "Reading passages and books, then summarizing key ideas — mastered by Thursday" },
  { emoji: "🔵", label: "Venn Diagrams: Compare & Contrast", desc: "Using Venn diagrams to compare fiction and non-fiction texts side by side" },
  { emoji: "✖️", label: "Multi-Digit Multiplication", desc: "Area model and standard algorithm for upper el; multiplication fact fluency (6+) for lower el" },
  { emoji: "🍓", label: "Strawberry Jam Cooking", desc: "Made jam from scratch — maceration, stovetop reduction, and a whole lot of pride" },
  { emoji: "🚀", label: "STEM Adventure Friday", desc: "Marshmallow-spaghetti towers, baking soda volcanoes, and take-home rockets" },
];

export const WEEK: WeekHighlight = {
  program: "summer",
  badge: "Summer 2026 · Week 4",
  title: "Week 4 Highlights ☀️",
  dates: "Jun 15–19, 2026",
  intro:
    "Week 4 at Sage Field brought new faces and new friendships alongside serious academic momentum. Primary students dove into CVC words, phonics, and early number sense while building the independence that defines our Montessori environment. Elementary students tackled multi-digit multiplication, compared fiction and non-fiction texts with Venn diagrams, cooked strawberry jam from scratch, and capped the week with STEM Adventure Friday — marshmallow towers, baking soda volcanoes, and take-home rockets.",
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
        emoji: "🍓",
        title: "Strawberry Jam Cooking",
        desc: "Students made jam from scratch — macerating strawberries, reducing on the stovetop, and tasting their creation.",
      },
      {
        emoji: "🚀",
        title: "STEM Adventure Friday",
        desc: "Marshmallow and spaghetti tower structures, baking soda volcanoes, and take-home rockets to launch at home.",
      },
      {
        emoji: "🌟",
        title: "Welcoming New Families",
        desc: "New students joined us this week — welcomed by returning students and teachers with open arms.",
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
