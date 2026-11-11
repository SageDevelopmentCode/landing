/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_eight";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/55472D86-11D0-4665-9263-D88E6DD8BCC0.JPG`,
    caption: "Field Friday — Wizard Academy hats and robes before pickup",
  },
  {
    src: `${BASE}/75DB2D5E-0D14-4F2B-9A8E-F3BB46011A8C.JPG`,
    caption: "Tree climbing and confidence-building across the schoolyard",
  },
  {
    src: `${BASE}/2313D82D-FDDB-405E-B126-A3D2F8535C14.JPG`,
    caption: "Upper elementary — flag football huddle on the open field",
  },
  {
    src: `${BASE}/12BA5C32-5A55-4546-9780-936ADFE81CD4.JPG`,
    caption: "Primary — ant maze worksheets during ecosystem inquiry",
  },
  {
    src: `${BASE}/62F3ACE5-FB5D-433D-9A38-C65CED1FDD7C.JPG`,
    caption: "Clay sculpting during a senior-partner community lesson",
  },
  {
    src: `${BASE}/C56A5ED2-BB79-43B6-A073-A8CA5E12BDFF.JPG`,
    caption: "Upper elementary — collaborative writing around the communal table",
  },
  {
    src: `${BASE}/A74450BE-1E7C-40C1-8E90-4791D847F939.JPG`,
    caption: "Outdoor play — perched high in a campus climbing tree",
  },
  {
    src: `${BASE}/E0C8FFD0-A9C1-4C3F-95A2-5CAC259400EC.JPG`,
    caption: "Primary — gentle hands-on time with a campus chicken",
  },
  {
    src: `${BASE}/014C2A1B-4E36-4A24-93A7-29854C856E90.JPG`,
    caption: "Outdoor circle — shared snack and conversation under the trees",
  },
  {
    src: `${BASE}/1ACD0A6E-BE06-48C6-9925-D9CA75E4D31B.JPG`,
    caption: "PE on the field — listening for the next drill under open sky",
  },
  {
    src: `${BASE}/3381E67D-508A-4516-887C-279A6A615851.JPG`,
    caption: "Lower elementary — small-group literacy at the wooden table",
  },
  {
    src: `${BASE}/3CFF9370-8290-47DA-AB68-AAE4C80DEDD4.JPG`,
    caption: "Lower elementary — CVC word building with letter tiles on the rug",
  },
  {
    src: `${BASE}/3FCF48F8-2E23-4B9B-8B40-24ED8C0C2757.JPG`,
    caption: "Flag football practice with cones across the campus field",
  },
  {
    src: `${BASE}/4DB07FA9-6E6E-46DA-A885-884969440DD2.JPG`,
    caption: "One-on-one reading with a National Geographic Kids book outdoors",
  },
  {
    src: `${BASE}/8617B92B-591B-410F-B3A0-E2767B7458B5.JPG`,
    caption: "Independent reading — Weird Sea Creatures at the picnic table",
  },
  {
    src: `${BASE}/90907B25-7288-4882-A6C6-5CC0891CD672.JPG`,
    caption: "Primary partners tracing paths on an ant maze worksheet",
  },
  {
    src: `${BASE}/9FABA5E8-0D39-483F-B621-6FDB461DBA44.JPG`,
    caption: "Lower elementary — build-and-subtract with cubes and dry-erase mats",
  },
  {
    src: `${BASE}/A5DE52D7-4673-4447-BC64-8DD00521AFF4.JPG`,
    caption: "Outdoor subtraction — cookie-themed word problems at the picnic table",
  },
  {
    src: `${BASE}/D52D07CB-9A24-4231-B7D6-924F9DE1958A.JPG`,
    caption: "Fish-bowl subtraction with manipulatives on a sunny outdoor table",
  },
  {
    src: `${BASE}/E7405D91-8984-4818-804C-3E00CA19D87D.JPG`,
    caption: "Two-digit subtraction practice in dry-erase sleeves outdoors",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "♻️",
    label: "Recycling & Earth Care",
    desc: "Plastic, glass, metal, and food scraps — what can be made new again",
  },
  {
    emoji: "🐜",
    label: "Ants & Ecosystems",
    desc: "What would the world look like without ants? Inquiry into roles in nature",
  },
  {
    emoji: "🍰",
    label: "Fractions Begin",
    desc: "Dividing and sharing quantities into equal parts through ant study",
  },
  {
    emoji: "🌳",
    label: "Outdoor Classrooms",
    desc: "Crisp mornings moved reading, math, and play into fresh air",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➖",
    label: "Subtraction Units",
    desc: "Number bonds, manipulatives, and two-digit subtraction without regrouping",
  },
  {
    emoji: "📖",
    label: "CVC & Blending",
    desc: "Stretching sounds and building consonant-vowel-consonant words",
  },
  {
    emoji: "🇺🇸",
    label: "Flag & Matter",
    desc: "What the U.S. flag represents plus physical changes in materials",
  },
  {
    emoji: "🎨",
    label: "Shape & Color",
    desc: "Geometric and organic shapes painted so overlaps mix new hues",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Deep Dive",
    desc: "Equivalence, number lines, and fraction blocks for parts of a whole",
  },
  {
    emoji: "✨",
    label: "Similes & Long-O",
    desc: "Creative comparisons plus Definition Detective spelling routines",
  },
  {
    emoji: "🖼️",
    label: "Symmetry Portraits",
    desc: "Warm or cool backgrounds paired with half-photo, half-drawn faces",
  },
  {
    emoji: "🏈",
    label: "Chili & Flag Football",
    desc: "Hearty cooking lab and organized movement on the field",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 8",
  title: "Week 8 Highlights",
  dates: "October 5–9, 2026",
  intro:
    "Week eight followed curiosity about the living world. Primary explored recycling, decomposition, and ants — with early fractions woven into equal sharing; lower elementary opened October units in subtraction, phonics, flag symbolism, and shape painting; upper elementary stretched fractions, similes, and symmetry portraits — then the whole school closed with Wizard Academy Field Friday and a hearty chili cook-along.",
  learned: {
    badge: "What We Learned",
    heading: "Recycling, Fractions & Wizard Academy Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each turned Earth-care questions into math, literacy, art, cooking, and community connections.",
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
        emoji: "🧙",
        title: "Field Day Friday: Wizard Academy",
        desc: "Painted wands, glitter potion necklaces, decorated wizard hats, spell practice, and a closing potion experiment.",
      },
      {
        emoji: "🌶️",
        title: "Little Chefs: Chili",
        desc: "Chopped peppers and onions, opened cans of beans, simmered with broth and spices, then topped bowls with cheese and Fritos.",
      },
      {
        emoji: "🤝",
        title: "Intergenerational Clay",
        desc: "Clay lesson with senior living partners — sculpting side by side and building community beyond campus.",
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
