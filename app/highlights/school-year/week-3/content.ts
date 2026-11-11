/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_three";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/BC3C9DF3-4ECB-4F82-B635-FA1455F6A791.JPG`,
    caption: "Wild West Field Friday — wanted posters pinned to the play structure",
  },
  {
    src: `${BASE}/6835EA49-0B94-4938-958E-EF8A928C37BC.JPG`,
    caption: "Primary students making fresh juice with a homemade juicer",
  },
  {
    src: `${BASE}/DE833B8B-C649-456F-B74D-DA35E0F98F35.JPG`,
    caption: "Watercolor horse painting during Wild West Field Friday",
  },
  {
    src: `${BASE}/0998A815-2BF1-4DC6-A090-9B435BAA86A0.JPG`,
    caption: "Watering tomato plants in the raised garden beds",
  },
  {
    src: `${BASE}/CEF8BE2C-4D30-46C1-B160-A35398EECBA5.JPG`,
    caption: "Outdoor storytime under the shade of the big trees",
  },
  {
    src: `${BASE}/82F510EF-6FD1-4DDD-9408-D9D4F92ECF2E.JPG`,
    caption: "Lower elementary — Order Up number sequencing game",
  },
  {
    src: `${BASE}/EF974DD3-7C8C-4F7F-8CB6-E2F7606D2492.JPG`,
    caption: "Partner addition practice with linking cubes and whiteboards",
  },
  {
    src: `${BASE}/43D4D8D3-74AA-44FF-9ACE-AAE5200B488D.JPG`,
    caption: "Upper elementary place value matching with base-ten blocks",
  },
  {
    src: `${BASE}/02629D21-AF3A-491F-A480-800E2BC9D13A.JPG`,
    caption: "Group circle time on the classroom rug",
  },
  {
    src: `${BASE}/3E2ADEA5-14E8-4425-BB70-DA7B961D6B81.JPG`,
    caption: "Sight word and handwriting practice in composition notebooks",
  },
  {
    src: `${BASE}/53022F5B-6203-4FDD-8D6D-4B75828F4FEC.JPG`,
    caption: "Friends posing together at the big tree on the playground",
  },
  {
    src: `${BASE}/58F5BDB7-F1F1-4845-B1C9-0164C3A3706C.JPG`,
    caption: "CVC word practice on whiteboards with flashcards",
  },
  {
    src: `${BASE}/5DADF1CF-46A4-4F2E-95E6-FD0C5178DDDB.JPG`,
    caption: "Outdoor picnic lunch on the field with bento boxes",
  },
  {
    src: `${BASE}/81287082-FDCF-46E1-85F5-C8E180CE2048.JPG`,
    caption: "Phonics practice — writing on a handheld whiteboard",
  },
  {
    src: `${BASE}/929BF89E-E892-4CBA-BED0-15E615073B7C.JPG`,
    caption: "Addition practice with a color-block worksheet and whiteboard",
  },
  {
    src: `${BASE}/A51200E9-A655-4DC4-86FC-7C61FD3DF569.JPG`,
    caption: "Climbing the big tree on a sunny outdoor afternoon",
  },
  {
    src: `${BASE}/CB1792E7-4ABF-4FEE-96C6-C5724F7F9F4B.JPG`,
    caption: "Outdoor coloring at the picnic table in the sunshine",
  },
  {
    src: `${BASE}/FBD9727C-AB5D-4217-8CFE-E2F1D6119641.JPG`,
    caption: "Outdoor learning stations set up under the trees",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🧃",
    label: "Homemade Making",
    desc: "Play-Doh, soup, juice, and a homemade juicer from scratch",
  },
  {
    emoji: "🎨",
    label: "Yayoi Kusama Patterns",
    desc: "Polka dots, repetition, and art-inspired creative expression",
  },
  {
    emoji: "✍️",
    label: "Writing & Documentation",
    desc: "Date writing, letter formation, and recording investigations",
  },
  {
    emoji: "🌱",
    label: "Garden Care",
    desc: "Watering tomato plants in the raised garden beds",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🔢",
    label: "Comparing Numbers",
    desc: "Greater than, less than, and equal to with base-10 blocks",
  },
  {
    emoji: "🎯",
    label: "Order Up Game",
    desc: "Arranging numbers from greatest to least and vice versa",
  },
  {
    emoji: "🪱",
    label: "Gummy Worm Science",
    desc: "24-hour water soak investigation using the scientific method",
  },
  {
    emoji: "🤠",
    label: "Wild West Friday",
    desc: "Wanted posters, watercolor horses, sheriff badges, and the Great Robbery",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "💧",
    label: "Project H2O",
    desc: "Designing, testing, and redesigning water filters with natural materials",
  },
  {
    emoji: "🥬",
    label: "Celery Science",
    desc: "Color-absorption experiment making invisible plant processes visible",
  },
  {
    emoji: "✍️",
    label: "CUPS Writing",
    desc: "Hypotheses, observations, and evidence tied to science investigations",
  },
  {
    emoji: "🔢",
    label: "Place Value & Operations",
    desc: "Expanded form through hundred thousands plus 4–5 digit addition and subtraction",
  },
  {
    emoji: "📚",
    label: "The Wild Robot & Cooking",
    desc: "Continued read-aloud and chicken bone broth noodle soup together",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 3",
  title: "Week 3 Highlights",
  dates: "August 31–September 4, 2026",
  intro:
    "Week three was all about making, creating, and exploring with our own hands. From primary through upper elementary, students built homemade juicers, studied patterns through art, launched science investigations, compared numbers, and closed the week with a Wild West Field Friday.",
  learned: {
    badge: "What We Learned",
    heading: "Making, Investigating & Exploring Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each built skills through curiosity, creativity, and hands-on experience.",
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
        emoji: "🤠",
        title: "Field Day Friday: Wild West",
        desc: "Wanted posters, a human claw machine with stuffies, watercolor horses, sheriff badges, and the Great Robbery chase game.",
      },
      {
        emoji: "🧃",
        title: "Hands-On Making",
        desc: "Homemade Play-Doh, soup, juice, and a juicer built from scratch — creating something from nothing.",
      },
      {
        emoji: "🔬",
        title: "Science Investigations",
        desc: "Project H2O water filters, celery color absorption, and gummy worm experiments using the scientific method.",
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
