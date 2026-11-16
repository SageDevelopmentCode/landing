/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_twelve";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/4C91BE96-1DAA-442A-9D31-D18B017CBACC.JPG`,
    caption: "Field Friday — painting Hello Fall wreaths and autumn motifs together",
  },
  {
    src: `${BASE}/5F89FB6A-BC40-40AE-9CF5-AD11C088BCB3.JPG`,
    caption: "Upper elementary — Pizza My Heart fraction bingo to close the unit",
  },
  {
    src: `${BASE}/10CC9173-98B8-4C61-AC26-BC47AD794446.JPG`,
    caption: "Science — force and motion vocabulary in outdoor interactive notebooks",
  },
  {
    src: `${BASE}/AD71CA2A-A8E9-4463-A0A3-142CF28E77A5.JPG`,
    caption: "Social studies — coloring transportation timelines at the picnic table",
  },
  {
    src: `${BASE}/4843EA7B-0555-471A-980A-201D5D946C20.JPG`,
    caption: "Lower elementary — context-clues passages read on blankets in the sunshine",
  },
  {
    src: `${BASE}/93C77585-2766-4445-A567-36B1D8D5E528.JPG`,
    caption: "Primary — Earth collages and planet talk after ant inquiry sparked space questions",
  },
  {
    src: `${BASE}/3A2D9CC2-CBC0-4FB5-B939-1F5943B71917.JPG`,
    caption: "Sensory play — mud-kitchen mixing under the ribbon tree",
  },
  {
    src: `${BASE}/42204CE0-4F42-4137-86B2-EEAB2C602047.JPG`,
    caption: "Primary — messy science with bowls, spoons, and outdoor curiosity",
  },
  {
    src: `${BASE}/7F63D5AB-60B2-4394-9B75-05074B9928CA.JPG`,
    caption: "Primary — story elements circle with thankful sharing and raised hands",
  },
  {
    src: `${BASE}/3372BC8C-4A29-4604-A768-C788925A1CF2.JPG`,
    caption: "Writing — dry-erase boards and fall-room focus time",
  },
  {
    src: `${BASE}/48D42281-6276-4268-8D8A-D43437EF17C7.JPG`,
    caption: "Literacy — dot-inspired marks and letter tiles at the light table",
  },
  {
    src: `${BASE}/530085FA-8419-4772-B7BC-F8432A1A6C8B.JPG`,
    caption: "Primary math — wooden number tiles and tally practice",
  },
  {
    src: `${BASE}/23219CC1-98DB-4B4C-96D5-B770AF8E4EE4.JPG`,
    caption: "Outdoor kitchen — sand, mud, and colanders in collaborative play",
  },
  {
    src: `${BASE}/0A7EB988-ECAE-43A3-9DF0-F4373EF6C013.JPG`,
    caption: "Mud kitchen — stirring buckets and pots beside the garden beds",
  },
  {
    src: `${BASE}/EFB8DA43-FCA8-408E-ADAB-40F06498DCAB.JPG`,
    caption: "Social studies — cut-and-paste trains for evolving transportation study",
  },
  {
    src: `${BASE}/AD03DCE9-DC98-4011-B106-BA6076C1D929.JPG`,
    caption: "Upper elementary — notebooking and sentence work at the big table",
  },
  {
    src: `${BASE}/9C1D5E40-6AB7-45E9-96BD-117B95105520.JPG`,
    caption: "Garden — planting and tending herbs in the raised beds",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🦃",
    label: "Thanksgiving Gratitude",
    desc: "Talked about thankfulness and what gratitude looks like every day",
  },
  {
    emoji: "📖",
    label: "Story Elements",
    desc: "Named main characters and settings while retelling favorite tales",
  },
  {
    emoji: "🌍",
    label: "Earth & Space",
    desc: "Ant curiosity led into planets, layers of Earth, and big-space wonder",
  },
  {
    emoji: "💡",
    label: "Light & Energy",
    desc: "November science kicked off with how light and energy show up around us",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Models",
    desc: "Halves, thirds, and wholes matched to pictures and shape models",
  },
  {
    emoji: "🔍",
    label: "Context Clues",
    desc: "Daily passages built main-idea and vocabulary detective skills",
  },
  {
    emoji: "🚗",
    label: "Force & Motion Lab",
    desc: "Ramp-and-car trials recorded how far vehicles rolled after block bumps",
  },
  {
    emoji: "🍲",
    label: "Tomato Basil Soup",
    desc: "Diced garden veggies and simmered a cozy lunch with rosemary and thyme",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Pizza Finale",
    desc: "Recipe problems unlocked ingredient amounts to wrap the fractions unit",
  },
  {
    emoji: "🫁",
    label: "Human Anatomy",
    desc: "Skeletal IDs, model lungs, and muscular-system moves launched science",
  },
  {
    emoji: "📓",
    label: "Notebooking",
    desc: "Titles, labels, summaries, and guided sentence expansion in every subject",
  },
  {
    emoji: "🎨",
    label: "Roots & Watercolor",
    desc: "Greek and Latin tele- and pre- roots plus partner watercolor painting",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 12",
  title: "Week 12 Highlights",
  dates: "November 2–6, 2026",
  intro:
    "Week twelve opened November with fresh units, gratitude, and hands-on labs across campus. Primary explored thankfulness, story elements, and Earth and space after ant curiosity; lower elementary launched fractions, context clues, and force-and-motion ramps, then simmered tomato basil soup from garden herbs; upper elementary finished fraction pizza, started human anatomy with model lungs, and stretched notebooking and word roots — with Autumn Adventure Field Friday tying the week together.",
  learned: {
    badge: "What We Learned",
    heading: "Gratitude, New Units & Outdoor Labs",
    sub: "Primary, lower elementary, and upper elementary each connected November academics to cooking, science investigations, and autumn creativity outside.",
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
        emoji: "🍂",
        title: "Field Friday: Autumn Adventure",
        desc: "Seasonal stories, leaf wind chimes, tissue-paper sun catchers, and painted wreaths filled the yard.",
      },
      {
        emoji: "🍲",
        title: "Tomato Basil Soup",
        desc: "Chopped peppers and tomatoes, simmered broth and cream, and shared lunch with garden herbs.",
      },
      {
        emoji: "🫁",
        title: "Anatomy & Art",
        desc: "Model lungs proved how we breathe; watercolor afternoons with senior partners rounded out the week.",
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