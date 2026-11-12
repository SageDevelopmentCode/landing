/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_two";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/C789A2F8-D5D0-48AE-9C6C-153410CB374F.JPG`,
    caption: "Community garden event — families planting herbs and vegetables together",
  },
  {
    src: `${BASE}/IMG_1992.JPG`,
    caption: "Construction Zone Field Friday — digging through oobleck cement for 3D-printed blocks",
  },
  {
    src: `${BASE}/026E8AEA-C44F-4246-A9F9-AF45B8C3289B.JPG`,
    caption: "Hard-hat builders at the LEGO construction station",
  },
  {
    src: `${BASE}/C2440A5D-713E-44B4-82D6-A59AC8EDB294.JPG`,
    caption: "Outdoor directed writing — \"The Magic Pencil\" at the picnic table",
  },
  {
    src: `${BASE}/3BAB944C-5EBB-4147-BA3B-BA7EE61079C8.JPG`,
    caption: "Jungle Movement — parkour jumps onto the landing mat",
  },
  {
    src: `${BASE}/82794259-4C23-43AE-8706-E5EDF34F05FA.JPG`,
    caption: "Making pizza together — measuring, spreading sauce, and choosing toppings",
  },
  {
    src: `${BASE}/E4BE89E9-7A5D-4DE4-A445-39DC1DDC0C9B.JPG`,
    caption: "Nature-inspired garden paintings drying on the patio table",
  },
  {
    src: `${BASE}/B8409633-2A82-4A18-95FF-7BC65FDA8898.JPG`,
    caption: "Preparing fresh watermelon for the community garden event",
  },
  {
    src: `${BASE}/74160CB8-12DB-49C1-BF5D-873BECCA182C.JPG`,
    caption: "Primary students exploring a wooden clock puzzle together",
  },
  {
    src: `${BASE}/0692B9CB-AF89-4CC3-99C9-C3797795D04A.JPG`,
    caption: "Outdoor addition practice with linking cubes on the striped mat",
  },
  {
    src: `${BASE}/074E1AE7-4DA4-4D03-935C-47E4AEF7B279.JPG`,
    caption: "Garden-inspired canvas painting on the outdoor art table",
  },
  {
    src: `${BASE}/09FAA73A-CA85-4102-80F9-46B1C37D95C8.JPG`,
    caption: "Nature scavenger hunt — recording observations near the garden beds",
  },
  {
    src: `${BASE}/21B55D40-53C5-4106-99A1-8E71CA1B6875.JPG`,
    caption: "Name tracing and alphabet practice on dry-erase sleeves",
  },
  {
    src: `${BASE}/28DE4C5C-2A83-44E2-80A5-EFF344A8F277.JPG`,
    caption: "Proud artists showing their collaborative outdoor painting",
  },
  {
    src: `${BASE}/384DD291-FF63-42C8-BA02-404BD4F4A920.JPG`,
    caption: "Construction Zone Friday — decorating hard hats with gems and paint markers",
  },
  {
    src: `${BASE}/50FE921A-9B54-4862-8B27-6719EC23FA1E.JPG`,
    caption: "Sensory play with foam at the outdoor picnic table",
  },
  {
    src: `${BASE}/5C76F9A0-69BB-459A-A74E-3F3ABE317D3D.JPG`,
    caption: "Lower elementary — building numbers with popsicle-stick tens and gem ones",
  },
  {
    src: `${BASE}/7A908B6B-CBDD-4FD5-B452-DDE91EB07BA5.JPG`,
    caption: "Creative writing outdoors — \"I woke up on the moon\"",
  },
  {
    src: `${BASE}/80E5673A-9F91-449A-900C-4D3A86B7B4E7.JPG`,
    caption: "Linking cubes scattered across the outdoor lunch blanket",
  },
  {
    src: `${BASE}/95C71CF1-9A7A-4D73-A80E-981044348D01.JPG`,
    caption: "Shaded outdoor writing under the big tree",
  },
  {
    src: `${BASE}/A791AF61-0CB3-4287-9132-177755B18010.JPG`,
    caption: "Sensory letter practice pressed into kinetic sand trays",
  },
  {
    src: `${BASE}/B348E338-44E0-44AC-842F-DBED49294864.JPG`,
    caption: "Partner work at the raised garden beds during the community event",
  },
  {
    src: `${BASE}/B7149464-D795-4207-94FB-74F90D319DC4.JPG`,
    caption: "Place value matching — connecting numbers to base-ten representations",
  },
  {
    src: `${BASE}/C27EE9B7-D9A8-4DC6-8127-682E6DEB16F3.JPG`,
    caption: "Name tracing practice at the outdoor picnic table",
  },
  {
    src: `${BASE}/D69B578C-7F6B-4F85-A7AB-C86C0BE8BD33.JPG`,
    caption: "Drawing on whiteboards in the shade of the big tree",
  },
  {
    src: `${BASE}/D7EC0B6B-4515-4C88-BBEE-447FB46572B3.JPG`,
    caption: "Studying seeds and building a bird's nest from natural materials",
  },
  {
    src: `${BASE}/DD50BC8D-7A05-4C98-B0EE-FCD27061FEBC.JPG`,
    caption: "Upper elementary on a partner nature scavenger hunt",
  },
  {
    src: `${BASE}/F221FC0F-31C1-45DB-846D-7286FE7CC199.JPG`,
    caption: "Life-cycle sequencing cards beside a bowl of harvested grasses",
  },
  {
    src: `${BASE}/IMG_1991.JPG`,
    caption: "Construction Zone play table — foam blocks, toy trucks, and building toys",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🌱",
    label: "Gardening & Growing",
    desc: "Studying seeds, exploring how plants grow, and caring for living things",
  },
  {
    emoji: "🔟",
    label: "Groups of 10",
    desc: "Building sets of ten with blocks, sticks, buttons, and rocks",
  },
  {
    emoji: "🧱",
    label: "Fine Motor & Perseverance",
    desc: "Block building through frustration to creative solutions",
  },
  {
    emoji: "🪴",
    label: "Community Garden",
    desc: "Caring for new plants students will watch grow all year",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🔢",
    label: "Place Value Foundations",
    desc: "Standard and expanded form with base-10 models and popsicle-stick tens",
  },
  {
    emoji: "📖",
    label: "UFLI & Reading Foundations",
    desc: "Sight words, letter-sound relationships, and phonological awareness",
  },
  {
    emoji: "🔬",
    label: "Science Kickoff",
    desc: "Safety rules and a scientific method foldable for future labs",
  },
  {
    emoji: "🚧",
    label: "Construction Zone Friday",
    desc: "Hard-hat decorating, oobleck digs, and LEGO building",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🔢",
    label: "Place Value & Rounding",
    desc: "Expanded and word form through the hundred thousands place",
  },
  {
    emoji: "📚",
    label: "The Wild Robot",
    desc: "Continued read-aloud building comprehension and deeper connections",
  },
  {
    emoji: "✍️",
    label: "CUPS Writing",
    desc: "Directed prompts with capitalization, understanding, punctuation, and spelling",
  },
  {
    emoji: "🌿",
    label: "Nature & Movement",
    desc: "Jungle Movement, partner scavenger hunts, and garden-inspired art",
  },
  {
    emoji: "🍕",
    label: "Cooking & Garden Prep",
    desc: "Pizza together and watermelon for the community garden event",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 2",
  title: "Week 2 Highlights",
  dates: "August 24–28, 2026",
  intro:
    "Week two brought gardening, growing, and a joyful community garden event. From primary through upper elementary, students dug into place value, science foundations, nature art, cooking, and a Construction Zone Field Friday.",
  learned: {
    badge: "What We Learned",
    heading: "Growing Together Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each dug into purposeful, hands-on learning.",
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
        emoji: "🚧",
        title: "Field Day Friday: Construction Zone",
        desc: "Oobleck cement digs for 3D-printed blocks, hard-hat decorating, and LEGO building stations.",
      },
      {
        emoji: "🪴",
        title: "Community Garden Event",
        desc: "Families planted herbs and vegetables together — building the garden students will care for all year.",
      },
      {
        emoji: "🌳",
        title: "Movement, Cooking & Nature",
        desc: "Parkour, partner scavenger hunts, pizza making, and learning that extends far beyond the desk.",
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
