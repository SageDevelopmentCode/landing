/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_four";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/01C20017-202A-4B7C-ADA0-34086EC915F2.JPG`,
    caption: "Upper elementary — collaborative tornado-resistant structure engineering",
  },
  {
    src: `${BASE}/9A368F27-0C4F-4DD7-995B-98CC5DB2BE52.JPG`,
    caption: "Cutting cardboard for a tornado-resistant structure build",
  },
  {
    src: `${BASE}/C1390CB2-0CD0-4B86-8360-32B658D5E5E2.JPG`,
    caption: "Lower elementary — build-and-add with colorful gems",
  },
  {
    src: `${BASE}/818F2757-ACE1-41D0-A62F-52F47C9C59E2.JPG`,
    caption: "Primary students exploring pumpkin seeds and life cycle science",
  },
  {
    src: `${BASE}/B3A30FDD-AAB6-496E-802A-B30FA7CB4446.JPG`,
    caption: "Strawberry apple yogurt parfaits on the front steps",
  },
  {
    src: `${BASE}/6F80F35B-3B69-4D26-8868-92A93A382AE1.JPG`,
    caption: "Sandbox play under the shade sail on a sunny afternoon",
  },
  {
    src: `${BASE}/264087A9-CBD5-4099-95FC-1B49CC9517E7.JPG`,
    caption: "Addition practice with base-ten blocks and build-and-add mats",
  },
  {
    src: `${BASE}/070B83EA-9BF5-4BAA-8818-544F74A17D7D.JPG`,
    caption: "Primary science — observing an earthworm during chicken coop investigation",
  },
  {
    src: `${BASE}/0CB1B88B-28F6-40D0-932B-74464F657179.JPG`,
    caption: "Outdoor time together under the trees",
  },
  {
    src: `${BASE}/0F828667-233A-47E9-938E-4F8408DB305B.JPG`,
    caption: "Dot Day plate art with oil pastels and painted patterns",
  },
  {
    src: `${BASE}/14F261B7-D0EE-4B9F-A7BD-4AD46DF24F97.JPG`,
    caption: "Friends enjoying outdoor play on the playground",
  },
  {
    src: `${BASE}/189F9697-2F44-41CB-BF88-F45CFBDCD90A.JPG`,
    caption: "Hands-on learning at the classroom table",
  },
  {
    src: `${BASE}/1E3974E9-2C4E-4DF4-BF67-A340818CA09F.JPG`,
    caption: "Exploring a globe and identifying continents and oceans",
  },
  {
    src: `${BASE}/43B558AD-2EDC-4E8F-B1ED-7CCFD765F730.JPG`,
    caption: "Group photo on the playground after a busy week",
  },
  {
    src: `${BASE}/5E785DE4-8552-4D0B-A96D-85754832B6F0.JPG`,
    caption: "Multiplication practice with visual models and cubes",
  },
  {
    src: `${BASE}/84055570-13D0-4A73-95E2-84BFA0387408.JPG`,
    caption: "Outdoor learning and play in the sunshine",
  },
  {
    src: `${BASE}/9C5DFF55-97C6-4FEE-A82C-44A4BFB9BF5D.JPG`,
    caption: "Dragons & Mythical Creatures Field Friday — watercolor painting",
  },
  {
    src: `${BASE}/9E8CD956-4831-42F7-AAA0-F2D94DBF1C1D.JPG`,
    caption: "Personal writing — developing the Story of Me",
  },
  {
    src: `${BASE}/A6DB1350-9D81-456C-87DE-8FF7C4727661.JPG`,
    caption: "Chicken Cam observations and collaborative documentation",
  },
  {
    src: `${BASE}/B52828BB-4A7E-4F36-A133-1172281D5E59.JPG`,
    caption: "Field Friday fun — dragons, slime, and dragon eggs",
  },
  {
    src: `${BASE}/B75BE347-443C-4635-B998-6FE3C16B2E5E.JPG`,
    caption: "Number bonds and addition with manipulatives",
  },
  {
    src: `${BASE}/C7FBC6F6-803F-4663-AF3A-B18941AA7373.JPG`,
    caption: "Active play and movement outdoors",
  },
  {
    src: `${BASE}/E10B5084-3A5E-44CC-B113-2CD6FD96A460.JPG`,
    caption: "Measuring and modeling on a science tray",
  },
  {
    src: `${BASE}/E80B575A-31D0-4051-9685-1E058790F1D2.JPG`,
    caption: "Dot Day ombré plate art with dot patterns",
  },
  {
    src: `${BASE}/F90D4E80-7C91-4DEE-98F4-67F7FFB3F66B.JPG`,
    caption: "Outdoor games and community time together",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🐔",
    label: "Chicken Egg Investigation",
    desc: "Theories about why the chickens haven't laid yet — exploring life cycle science",
  },
  {
    emoji: "📹",
    label: "Chicken Cam",
    desc: "Observing chicken behavior and gathering evidence from the coop",
  },
  {
    emoji: "🔢",
    label: "Math Through Observation",
    desc: "Counting, sorting pumpkin seeds, and comparing quantities",
  },
  {
    emoji: "✍️",
    label: "Collaborative Documentation",
    desc: "Combining science, math, art, and writing into a shared piece",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➕",
    label: "Addition Foundations",
    desc: "Number bonds, base-10 blocks, and the 120 chart",
  },
  {
    emoji: "🌍",
    label: "Globe Geography",
    desc: "Seven continents, oceans, hemispheres, latitude and longitude",
  },
  {
    emoji: "🎨",
    label: "Dot Day Art",
    desc: "Painted paper plates with oil pastels for Dot Day",
  },
  {
    emoji: "🐉",
    label: "Dragons & Mythical Creatures",
    desc: "Watercolor dragons, mermaid slime, and dragon eggs on Field Friday",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "✖️",
    label: "Multiplication Unit",
    desc: "Array City, visual models, and building groups with cubes",
  },
  {
    emoji: "🌪️",
    label: "Tornado Engineering",
    desc: "Designing and building tornado-resistant structures",
  },
  {
    emoji: "🎨",
    label: "Dot Day Ombré Art",
    desc: "Dot patterns and ombré painting on plates for a mural",
  },
  {
    emoji: "🍓",
    label: "Cooking & Writing",
    desc: "Strawberry apple yogurt parfaits and Story of Me personal writing",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 4",
  title: "Week 4 Highlights",
  dates: "September 7–11, 2026",
  intro:
    "Week four was full of curiosity, creativity, and hands-on learning. From primary through upper elementary, students investigated chicken life cycles, built tornado-resistant structures, launched multiplication, explored globe geography, celebrated Dot Day, and closed the week with a Dragons & Mythical Creatures Field Friday.",
  learned: {
    badge: "What We Learned",
    heading: "Chickens, Tornadoes & Dot Day Across Every Grade",
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
        emoji: "🐉",
        title: "Field Day Friday: Dragons & Mythical Creatures",
        desc: "Watercolor dragons and unicorns, mermaid slime with ocean charms, and dragon eggs crafted together.",
      },
      {
        emoji: "🎨",
        title: "Dot Day Art",
        desc: "Dot patterns, ombré painting on plates, and mural prep celebrating creativity through something as simple as a dot.",
      },
      {
        emoji: "🔬",
        title: "Hands-On Science & Cooking",
        desc: "Tornado engineering builds, strawberry apple yogurt parfaits, and pumpkin and chicken investigations.",
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
