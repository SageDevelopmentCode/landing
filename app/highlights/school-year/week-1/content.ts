/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_one";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/B5E9BAE4-8895-4A91-BE6A-E8D0232594E0 2.JPG`,
    caption: "Outdoor play at the CREATE station — week one is underway",
  },
  {
    src: `${BASE}/E2C30E1C-C188-483C-8827-21C07B932360 2.JPG`,
    caption: "Building safari binoculars for Field Day Friday",
  },
  {
    src: `${BASE}/DC828E1B-80B1-4E42-B26B-8AA4C51805EB 2.JPG`,
    caption: "Safari bingo with animal figurines and glass markers",
  },
  {
    src: `${BASE}/73200BCC-A2E2-40C8-8384-6AE2ACB43EEA 2.JPG`,
    caption: "Outdoor multiplication practice with flashcards and whiteboards",
  },
  {
    src: `${BASE}/B55A808A-F9A6-4416-952D-13C40FF9965D 2.JPG`,
    caption: "Domino addition under the porch — hands-on math in the sunshine",
  },
  {
    src: `${BASE}/5FEDD678-7E2D-4C92-9725-E6DC831BC365 2.JPG`,
    caption: "Preparing treats together on the patio",
  },
  {
    src: `${BASE}/74818037-37AF-4930-8C18-92691A53334B 2.JPG`,
    caption: "Show-and-tell — sharing what makes each of us unique",
  },
  {
    src: `${BASE}/FD347782-D7DE-45FA-B4D2-0B799616E300 2.JPG`,
    caption: "Writing outdoors at the picnic table",
  },
  {
    src: `${BASE}/2F0B71FB-E0AD-4209-BE75-A719A0047E0C 2.JPG`,
    caption: "Practicing \"My Name is\" on whiteboards",
  },
  {
    src: `${BASE}/FC5AB066-D63C-492A-8139-2D094C5748FD 2.JPG`,
    caption: "Name tracing and snap-cube math stations",
  },
  {
    src: `${BASE}/IMG_1480.JPG`,
    caption: "Building addition towers with linking cubes",
  },
  {
    src: `${BASE}/IMG_1481.JPG`,
    caption: "Counting domino dots and writing sums",
  },
  {
    src: `${BASE}/IMG_1473.JPG`,
    caption: "Sunset silhouette painting — process over product",
  },
  {
    src: `${BASE}/DCF92417-A0A8-475D-B72B-8DC12A38E2FA 2.JPG`,
    caption: "Free painting at the art table",
  },
  {
    src: `${BASE}/FE373840-6B74-4277-9FAB-3DABB054A295 2.JPG`,
    caption: "Montessori letter board word building on the rug",
  },
  {
    src: `${BASE}/A8F42BB7-2CE6-42A3-B041-1DB57DB764ED.JPG`,
    caption: "Outdoor read-aloud and group discussion",
  },
  {
    src: `${BASE}/5B897E55-D13D-4261-B962-469F27B02245 2.JPG`,
    caption: "Collaborative work at the outdoor learning table",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🤝",
    label: "Classroom Community",
    desc: "Learning expectations, exploring new spaces, and forming friendships from day one",
  },
  {
    emoji: "✏️",
    label: "Daily Name Writing",
    desc: "Handwriting practice that builds confidence and fine motor skills",
  },
  {
    emoji: "💡",
    label: "I Think, I Wonder, I Know",
    desc: "Inquiry routine where students share predictions and defend their thinking",
  },
  {
    emoji: "➕",
    label: "Organic Math",
    desc: "Number sense woven into everyday moments and classroom conversations",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🧘",
    label: "Rhythms & Routines",
    desc: "Quiet time, transitions, and understanding why each part of the day matters",
  },
  {
    emoji: "🔤",
    label: "Montessori Letter Board",
    desc: "Sounding out words and one-on-one reading to establish individual levels",
  },
  {
    emoji: "🎲",
    label: "Hands-On Math Stations",
    desc: "Dice, sticky-note equations, and manipulatives for addition and subtraction",
  },
  {
    emoji: "✍️",
    label: "Writing Mechanics",
    desc: "Pencil grip, letter formation, and basic punctuation through daily practice",
  },
  {
    emoji: "🎤",
    label: "Show-and-Tell",
    desc: "Five items that represent each student — building identity and peer connection",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "📝",
    label: "Writing & CUPS Editing",
    desc: "Directed writing, grammar conventions, and independent editing strategies",
  },
  {
    emoji: "📚",
    label: "The Wild Robot",
    desc: "Group read-aloud comparing book to film, building vocabulary and inferences",
  },
  {
    emoji: "🔢",
    label: "Math Review",
    desc: "Addition, subtraction, multiplication, rounding, PEMDAS, and number sense",
  },
  {
    emoji: "🎨",
    label: "Process vs. Product Art",
    desc: "Free painting focused on creative exploration, not a fixed end goal",
  },
  {
    emoji: "🐔",
    label: "Homesteading & Music",
    desc: "Respectful chicken care, keyboard exploration, and public speaking through Sharing",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 1",
  title: "Week 1 Highlights",
  dates: "August 17–21, 2026",
  intro:
    "The first week of our 2026–27 school year is complete — and what a wonderful start. From our primary classroom through upper elementary, students settled into routines, built community, and jumped into hands-on learning across writing, math, art, nature, and Field Day Friday.",
  learned: {
    badge: "What We Learned",
    heading: "A Strong Start Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each had a full, purposeful first week.",
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
        emoji: "🦁",
        title: "Field Day Friday: Wild Safari",
        desc: "Animal silhouettes, safari binoculars, safari bingo, and an animal hide-and-seek hunt across campus.",
      },
      {
        emoji: "🌳",
        title: "Movement & Nature",
        desc: "Outdoor lessons, patio cooking, and learning that extends far beyond the desk.",
      },
      {
        emoji: "🤝",
        title: "Small-Group Community",
        desc: "Roughly 10 students per class — known by name, strengths, and learning style from week one.",
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
