/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_five";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/96D93AFA-3B3B-4959-A75F-DD9624B41C29.JPG`,
    caption: "Primary students celebrating our first chicken eggs in the coop",
  },
  {
    src: `${BASE}/5246214C-00FC-4ED2-8369-7FD5DDCF29D3.JPG`,
    caption: "Upper elementary — multi-digit multiplication practice outdoors",
  },
  {
    src: `${BASE}/29AB0AD4-AEDD-4145-A6A9-5FA6D8FD605E.JPG`,
    caption: "Dot Day collaborative mural — a giant dot inspired by The Dot",
  },
  {
    src: `${BASE}/89C4E0CC-3A0E-479B-8DE9-2FA03D891A80.JPG`,
    caption: "Upper elementary — Kids Volcano Survival Guide research and design",
  },
  {
    src: `${BASE}/7A2E475F-76BD-4718-A484-854DA4FC48B5.JPG`,
    caption: "Lower elementary — number line addition with whiteboards",
  },
  {
    src: `${BASE}/FC66AAAA-7A33-4614-B36B-B553F5EAEF6D.JPG`,
    caption: "Watering seedlings in the raised garden bed",
  },
  {
    src: `${BASE}/9965B812-C19C-45DF-97DF-031DDDF9381E.JPG`,
    caption: "Dot Day plate art displayed beside The Dot book",
  },
  {
    src: `${BASE}/DEFE850C-99B6-4015-B419-89FDE3617DA0.JPG`,
    caption: "Desert Discovery Field Friday — dyed pasta for snake crafts",
  },
  {
    src: `${BASE}/4182F696-085D-47CB-9021-8F8F5DC1BD9D.JPG`,
    caption: "Primary science — researching what chickens need to lay eggs",
  },
  {
    src: `${BASE}/6F5B4460-BFF1-486C-9DAB-B7B1BB4C2FFD.JPG`,
    caption: "Building the chicken cam from recycled cardboard and materials",
  },
  {
    src: `${BASE}/1BDB4106-7495-45A8-9391-3BED523FA5C1.JPG`,
    caption: "Primary math — matching snap cubes to number cards",
  },
  {
    src: `${BASE}/F47AC380-A0C2-4C05-80B3-C3FC804976EF.JPG`,
    caption: "Collaborative engineering with recycled materials and rope",
  },
  {
    src: `${BASE}/F232DFAA-059D-4705-80AC-EDB763175364.JPG`,
    caption: "Upper elementary — highlighting key facts during volcano research",
  },
  {
    src: `${BASE}/F157BD53-B669-429C-8613-5634FA945599.JPG`,
    caption: "Desert Discovery Field Friday — painting pasta for snake crafts",
  },
  {
    src: `${BASE}/F855F2DE-4407-4A85-8F6A-52F5C8EAA910.JPG`,
    caption: "Primary students practicing writing on whiteboards",
  },
  {
    src: `${BASE}/03B0FFDA-ACC9-4F70-B82C-B16EBACD5636.JPG`,
    caption: "Friends together on the playground picnic table",
  },
  {
    src: `${BASE}/05A3BE7A-1DE2-4C9E-91EC-769F1888C0AD.JPG`,
    caption: "Outdoor community circle on the striped mat",
  },
  {
    src: `${BASE}/CCACC24E-0E7A-4442-99F4-F0596DCB4134.JPG`,
    caption: "Celebrating day 16 of school with tally marks outdoors",
  },
  {
    src: `${BASE}/BFF44DC7-3510-46E9-8D96-6DB9C96E90C5.JPG`,
    caption: "Persuasive writing practice outdoors under the trees",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🥚",
    label: "First Chicken Eggs",
    desc: "Student-led research on what chickens need — and our first eggs arrived",
  },
  {
    emoji: "📹",
    label: "Chicken Cam",
    desc: "Recycled-materials camera to observe coop behavior and gather evidence",
  },
  {
    emoji: "🐜",
    label: "Ant Investigation",
    desc: "Dot-art ants and new questions about where ants live and what they need",
  },
  {
    emoji: "🔢",
    label: "Counting Toward 100",
    desc: "Number recognition, writing bigger numbers, and math through observation",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➕",
    label: "Addition Practice",
    desc: "Two-digit plus single-digit numbers and addition with regrouping",
  },
  {
    emoji: "📖",
    label: "Sight Word Reading",
    desc: "Blending short vowels, consonants, and syllables while reading",
  },
  {
    emoji: "🗺️",
    label: "Map Skills Booklet",
    desc: "Interactive booklet breaking down continents, oceans, and map features",
  },
  {
    emoji: "🎨",
    label: "Color Theory & Dot Day",
    desc: "Color wheel lions, color mixing, and a collaborative Dot Day mural",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "✖️",
    label: "Multiplication Milestones",
    desc: "Facts for multiples 0–10 and multi-digit multiplication with regrouping",
  },
  {
    emoji: "🌋",
    label: "Volcano Science",
    desc: "Survival guides, town design, and eruption experiments with data collection",
  },
  {
    emoji: "✍️",
    label: "Persuasive Writing",
    desc: "Stating opinions with reasons, examples, and CUPS editing practice",
  },
  {
    emoji: "🍲",
    label: "Cooking & Nature Art",
    desc: "Potato and rice chicken bone broth soup and dried-flower creations",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 5",
  title: "Week 5 Highlights",
  dates: "September 14–18, 2026",
  intro:
    "Week five brought our first chicken eggs, a new ant investigation, and plenty of hands-on learning across every grade. From primary through upper elementary, students built chicken cams, strengthened addition and multiplication, researched volcanoes, celebrated Dot Day with a collaborative mural, enjoyed a special music visit, and closed the week with a Desert Discovery Field Friday.",
  learned: {
    badge: "What We Learned",
    heading: "Eggs, Ants & Desert Discovery Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each followed their questions into science, math, art, and writing.",
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
        emoji: "🏜️",
        title: "Field Day Friday: Desert Discovery",
        desc: "Sunset desert cactus painting, desert-themed bingo, a stuffy scavenger hunt, and painted pasta snakes with googly eyes.",
      },
      {
        emoji: "🎨",
        title: "Dot Day Celebration",
        desc: "A collaborative dot mural and plate art honoring creativity and self-expression inspired by The Dot.",
      },
      {
        emoji: "🎵",
        title: "Music & Garden Time",
        desc: "A special music lesson with instruments, color theory through art, and watering seedlings in the garden.",
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
