/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_nine";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/EF809D8C-9404-455C-B3B8-5EBCEBC0C6E4.JPG`,
    caption: "Summerween — water slides and splashes before cooler weather",
  },
  {
    src: `${BASE}/5B61166D-C91A-4B79-ADD8-FF06B9A30B0F.JPG`,
    caption: "Field Friday — lava lamp science experiment on the grass",
  },
  {
    src: `${BASE}/6B50348E-40ED-4F55-B432-7FF6D9CA7C78.JPG`,
    caption: "Tree climbing with holds on the campus climbing tree",
  },
  {
    src: `${BASE}/1F53EF70-F050-4AC6-A304-822E5EE2EDFF.JPG`,
    caption: "Primary — studying skid marks and fast vs. slow movement outdoors",
  },
  {
    src: `${BASE}/11366F5C-7187-4C36-AD89-0687FBD291F0.JPG`,
    caption: "Music circle — songs on log cushions in the Primary classroom",
  },
  {
    src: `${BASE}/F32080E0-3521-4AFF-A57D-54150F08E7B3.JPG`,
    caption: "Outdoor mud kitchen — mixing, pouring, and sensory play",
  },
  {
    src: `${BASE}/4D18C974-C767-4B38-82A3-5789268778A9.JPG`,
    caption: "Cooking skills — learning to use a can opener at the picnic table",
  },
  {
    src: `${BASE}/C86640D6-7F20-421C-89B3-6775099A18B3.JPG`,
    caption: "Upper elementary — focused writing around the communal table",
  },
  {
    src: `${BASE}/1DF11F47-FF45-4C6C-ACBF-8FA1737F6448.JPG`,
    caption: "Hands-on literacy and math workstations indoors",
  },
  {
    src: `${BASE}/23D69F7B-0A07-4C1F-A85B-881631471A46.JPG`,
    caption: "Lower elementary — build-and-take-away subtraction on dry-erase mats",
  },
  {
    src: `${BASE}/3C9B5D66-E3A1-4F28-BE70-4524DB18BD5D.JPG`,
    caption: "Small-group learning with manipulatives and worksheets",
  },
  {
    src: `${BASE}/5AFDF08A-7240-47DD-B624-BB700019463A.JPG`,
    caption: "Collaborative table work across grade bands",
  },
  {
    src: `${BASE}/8349A5F5-F987-4F93-A954-E193A45B76ED.JPG`,
    caption: "Outdoor exploration and movement on campus",
  },
  {
    src: `${BASE}/A4819157-73A1-4806-A16B-B3B8BF7B24E0.JPG`,
    caption: "Friends at play between lessons on the schoolyard",
  },
  {
    src: `${BASE}/A8D2814B-BFF0-4078-ADB0-1269ACDB72B5.JPG`,
    caption: "Creative projects and classroom choice time",
  },
  {
    src: `${BASE}/B983A704-FB05-4F6D-B8BF-B27961F5D816.JPG`,
    caption: "Board-game math — Monopoly money and strategy on the turf",
  },
  {
    src: `${BASE}/E6076A38-FD2A-4161-BB15-DAEDBC9F368B.JPG`,
    caption: "Fall sunshine — outdoor games and free play together",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🚛",
    label: "Force & Motion",
    desc: "Garbage trucks, speed, and community helpers who keep neighborhoods clean",
  },
  {
    emoji: "♻️",
    label: "Recycling & Literacy",
    desc: "Counting, number recognition, and CVC spelling tied to real-world inquiry",
  },
  {
    emoji: "👀",
    label: "Skid-Mark Science",
    desc: "Noticing pavement marks sparked talk about fast and slow movement",
  },
  {
    emoji: "🎵",
    label: "Music & Movement",
    desc: "Songs on log cushions and joyful rhythm in the Primary space",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🎃",
    label: "Summerween",
    desc: "Pumpkin muffins in the morning and one last sunny water day",
  },
  {
    emoji: "➖",
    label: "Subtraction Stories",
    desc: "Word problems with pictures, expanded form, and standard subtraction",
  },
  {
    emoji: "🇺🇸",
    label: "American Symbols",
    desc: "Statue of Liberty and the bald eagle on currency, seals, and documents",
  },
  {
    emoji: "⚗️",
    label: "Matter Changes",
    desc: "Physical vs. chemical change with real-life examples",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Stations",
    desc: "Small-group lessons and review with hands-on fraction tools",
  },
  {
    emoji: "✍️",
    label: "Persuasive Writing",
    desc: "Convincing paragraphs with reasons — creative Halloween opinions",
  },
  {
    emoji: "💤",
    label: "Why We Dream",
    desc: "Reading comprehension with highlighted key details on anchor charts",
  },
  {
    emoji: "🎨",
    label: "Clay & Music",
    desc: "Sculpting in art and live guitar songs during music time",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 9",
  title: "Week 9 Highlights",
  dates: "October 12–16, 2026",
  intro:
    "Week nine blended hands-on science with a midweek splash. Primary investigated force, motion, and sanitation trucks while weaving counting and CVC words into recycling inquiry; lower elementary celebrated Summerween, deepened subtraction, and contrasted physical and chemical changes; upper elementary sharpened fractions, persuasive writing, and dream-themed reading — then Little Scientists Field Friday filled the day with lava lamps, Oobleck, and eruptions.",
  learned: {
    badge: "What We Learned",
    heading: "Summerween, Science & Little Scientists Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each tied real-world questions to math, literacy, symbols, art, and joyful outdoor celebration.",
  },
  groups: [
    {
      title: "Primary",
      subtitle: "Pre-K & Kindergarten",
      emoji: "🌱",
      tint: "coral",
      items: PRIMARY_HIGHLIGHTS,
    },
    {
      title: "Lower Elementary",
      subtitle: "1st & 2nd Grade",
      emoji: "✨",
      tint: "sage",
      items: LOWER_ELEMENTARY_HIGHLIGHTS,
    },
    {
      title: "Upper Elementary",
      subtitle: "3rd & 4th Grade",
      emoji: "📐",
      tint: "sky",
      items: UPPER_ELEMENTARY_HIGHLIGHTS,
    },
  ],
  beyond: {
    label: "Beyond Academics",
    items: [
      {
        emoji: "💦",
        title: "Summerween Celebration",
        desc: "Water slides, water games, and outdoor splashes — one last sunny farewell to summer before Halloween season.",
      },
      {
        emoji: "🔬",
        title: "Field Day Friday: Little Scientists",
        desc: "Lava lamps, pepper-and-soap hand-washing demos, Oobleck non-Newtonian fluid, and a soda-and-Mentos eruption.",
      },
      {
        emoji: "🧁",
        title: "Pumpkin Muffins & Kitchen Skills",
        desc: "Morning baking before Summerween and can-opener practice for real cooking independence.",
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
    heading: "Interested in Sage Field for your family?",
    body:
      "Enrollment is open for School Year 2026–2027. Come see the campus for yourself — we'd love to meet your family.",
    primary: { label: "Enroll Now →", href: "/apply?tab=school-year" },
    secondary: { label: "Tour the Campus", href: "/tour" },
  },
};
