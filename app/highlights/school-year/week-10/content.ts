/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_ten";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/E9C8665F-3A5D-4D42-BBEE-A304AE89650C 2.JPG`,
    caption: "Field Friday — Fairytale Kingdom knight gear, crown, and shield on the schoolyard",
  },
  {
    src: `${BASE}/738F9C06-0FA2-4123-84DB-F02E783177C6 2.JPG`,
    caption: "Kitchen skills — peeling and slicing pineapple at shared prep tables",
  },
  {
    src: `${BASE}/36BA22E1-883A-4E3D-B4AA-59DDF3BB1D5D 2.JPG`,
    caption: "Lower elementary — crisp-morning lessons under the pecan tree",
  },
  {
    src: `${BASE}/500878B3-9A0E-40EC-98BE-90BCA4C5B3C2 2.JPG`,
    caption: "Social studies — Liberty Bell coloring on clipboards in the sunshine",
  },
  {
    src: `${BASE}/6A513DEA-DA53-4A0B-97F0-56CD8252239E 2.JPG`,
    caption: "Music circle — live guitar and songs on log cushions in Primary",
  },
  {
    src: `${BASE}/D6531363-0E64-47BD-BF46-74BB7AF1AF1D 2.JPG`,
    caption: "Upper elementary — popsicle-stick photo frames with hot glue and pom-poms",
  },
  {
    src: `${BASE}/4FBDDB9F-3CD9-4CDC-BE85-5747C8565143 2.JPG`,
    caption: "Upper elementary — Greek and Latin prefixes at the whiteboard",
  },
  {
    src: `${BASE}/2ED66DBE-D717-438E-9F23-2B6773BC53B9 2.JPG`,
    caption: "Lower elementary — Our American Symbols worksheets on the outdoor rug",
  },
  {
    src: `${BASE}/CF0580D0-E27D-4643-82AC-DA64589B4D5D 2.JPG`,
    caption: "Outdoor reading — picnic blankets and quiet choice time across campus",
  },
  {
    src: `${BASE}/5A0D8F13-F909-436C-920F-D0239845F44A 2.JPG`,
    caption: "Small-group math — whiteboards and number work on the classroom rug",
  },
  {
    src: `${BASE}/9C9E161E-C4A2-4D8F-9807-63E7A25DE79E 2.JPG`,
    caption: "Primary — equal parts and fraction coloring on dry-erase mats",
  },
  {
    src: `${BASE}/CD090DFB-4F87-44B0-8C3D-6BD63F38DAA7 2.JPG`,
    caption: "Primary — letter tracing and handwriting at wooden tables",
  },
  {
    src: `${BASE}/84F1CC69-0D48-4206-9A3C-1047209EDE1F 2.JPG`,
    caption: "Primary — name tracing practice and confident pencil grip",
  },
  {
    src: `${BASE}/76C5792B-D9E9-4D86-A280-DEC741EF9CD1 2.JPG`,
    caption: "Science outdoors — chemical change observations recorded on clipboards",
  },
  {
    src: `${BASE}/2157652A-3FA6-4458-BD7C-E93F888BBA15 2.JPG`,
    caption: "Campus life — gentle chicken care in the outdoor coop",
  },
  {
    src: `${BASE}/EC13D47B-9B4C-430B-AE2C-92B6530229E5 2.JPG`,
    caption: "STEM collaboration — engineering diagrams and builds at the table",
  },
  {
    src: `${BASE}/B7159973-EEFB-4EFD-8D26-FA00FCE67452 2.JPG`,
    caption: "Primary — dry-erase storytelling and handwriting warm-ups",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🏎️",
    label: "Speed & Ramps",
    desc: "F1-inspired ads, homemade ramps, and predictions about time and distance",
  },
  {
    emoji: "✍️",
    label: "Young Authors",
    desc: "National Writing Day peer stories sparked illustrator work and handwriting",
  },
  {
    emoji: "🍕",
    label: "Equal Parts",
    desc: "Hands-on fractions by dividing wholes into fair shares",
  },
  {
    emoji: "🕷️",
    label: "Spider Study",
    desc: "Life-cycle inquiry after wrapping up ants on campus",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➖",
    label: "Subtraction Lines",
    desc: "Number-line take-away for first grade and regrouping word problems for second",
  },
  {
    emoji: "🔤",
    label: "Word Families",
    desc: "CVC decoding on whiteboards during crisp outdoor mornings",
  },
  {
    emoji: "🇺🇸",
    label: "Landmarks & Symbols",
    desc: "Liberty Bell and Washington Monument history with big questions",
  },
  {
    emoji: "👑",
    label: "Fairytale Kingdom",
    desc: "Field Friday crowns, castle art, and take-home royal creations",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Unlike Denominators",
    desc: "LCM comparisons, equivalent fractions, and multi-step word problems",
  },
  {
    emoji: "✍️",
    label: "Stretch the Sentence",
    desc: "Prepositions, FANBOYS, and persuasive letters with supporting reasons",
  },
  {
    emoji: "❤️",
    label: "Heart Rate Lab",
    desc: "Calm meditation through vigorous play while tracking beats per minute",
  },
  {
    emoji: "🧵",
    label: "Community Making",
    desc: "Butternut squash soup, art frames, and intergenerational stuffed-animal sewing",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 10",
  title: "Week 10 Highlights",
  dates: "October 19–23, 2026",
  intro:
    "Week ten brought crisp outdoor mornings, real cooking, and creative making across campus. Primary chased speed with ramps and young-author stories while exploring equal-part fractions and spiders; lower elementary subtracted on number lines, decoded CVC words, and studied American landmarks before Fairytale Kingdom Field Friday; upper elementary compared unlike fractions, stretched sentences with grammar tools, and tested heart-rate hypotheses — plus butternut squash soup and intergenerational sewing with Enclave volunteers.",
  learned: {
    badge: "What We Learned",
    heading: "Speed, Symbols & Fairytale Kingdom Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each tied ramps, landmarks, grammar, cooking, and community connections to joyful outdoor learning.",
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
        emoji: "👑",
        title: "Field Friday: Fairytale Kingdom",
        desc: "Decorated crowns, painted castles, and royal creations students assembled to take home.",
      },
      {
        emoji: "🥣",
        title: "Butternut Squash Soup",
        desc: "Peeling, chopping, and simmering together — comfort food cooked with heart across grade bands.",
      },
      {
        emoji: "🧵",
        title: "Enclave Sewing Day",
        desc: "Stuffed animals stitched alongside senior volunteers — creativity, patience, and community connection.",
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
