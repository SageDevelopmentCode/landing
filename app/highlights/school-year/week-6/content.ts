/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_six";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/CFFE7C16-F58B-4392-A325-165B53D36776.JPG`,
    caption: "Primary — storytime circle with picture books across the classroom",
  },
  {
    src: `${BASE}/9D2AC2BE-C4FB-4EA2-A3F3-50070DF3D6F6.JPG`,
    caption: "Primary — classroom Marketplace play inspired by the Sage Field Store",
  },
  {
    src: `${BASE}/E8A37B1E-B2E0-4459-935A-9F12BAB7ABA7.JPG`,
    caption: "Lower elementary — sink-or-float science outdoors with hypothesis charts",
  },
  {
    src: `${BASE}/A308BD2F-F8A5-4AC4-92B0-B4594010A2DA.JPG`,
    caption: "Lower elementary — double-digit addition with dry-erase math games",
  },
  {
    src: `${BASE}/56E3D25A-E7EB-4736-9481-33A016535AB4.JPG`,
    caption: "Primary — sequencing an ant picture puzzle during life-cycle study",
  },
  {
    src: `${BASE}/ADB81CFB-428A-4757-8B3D-EBAF8C6FC2E3.JPG`,
    caption: "Upper elementary — collaborative writing and drawing at the communal table",
  },
  {
    src: `${BASE}/1B03EB34-69A5-4D58-BBA8-5DEE9BC3AFEF.JPG`,
    caption: "Upper elementary — chopping harvest veggies for quinoa bowls in cooking",
  },
  {
    src: `${BASE}/D829EEC5-6E49-4EAF-8511-1A69149F8C29.JPG`,
    caption: "Field Friday — outdoor read-aloud before At the Zoo adventures",
  },
  {
    src: `${BASE}/D6E9103F-BB41-4498-B0A7-6179DE557DE3.JPG`,
    caption: "Cross-grade community circle — mixed ages learning together",
  },
  {
    src: `${BASE}/B0C1EC95-E5E6-428B-8FE6-685DFA48CED0.JPG`,
    caption: "Primary — ant tracing for fine motor practice and letter paths",
  },
  {
    src: `${BASE}/BB3406ED-E09C-4A77-93D6-CAFF3BAF4C19.JPG`,
    caption: "Lower elementary — number line and domino addition on write-and-wipe boards",
  },
  {
    src: `${BASE}/5187D3A3-90D3-49D4-B2F8-21A8CC91E646.JPG`,
    caption: "Lower elementary — proud moment after a double-digit addition challenge",
  },
  {
    src: `${BASE}/E4B434B6-5A11-4535-B4B4-5911AA09A99D.JPG`,
    caption: "Outdoor movement and teamwork on the basketball court",
  },
  {
    src: `${BASE}/1830BD01-9BFC-48C1-9E0D-6C5F53275E8A.JPG`,
    caption: "Lower elementary — two-digit addition with base-ten models on dry-erase sleeves",
  },
  {
    src: `${BASE}/3DE8BC89-5565-4251-916E-BA3C9D51D427.JPG`,
    caption: "Primary — pattern-building with colorful pebbles and wooden slices",
  },
  {
    src: `${BASE}/39E6D96A-BBC6-4EE9-BF83-1D10B336F641.JPG`,
    caption: "Lower elementary — moveable alphabet and ten-frame tokens for word building",
  },
  {
    src: `${BASE}/785EB6A4-5380-4D9F-9765-9CC4AA352181.JPG`,
    caption: "Reading buddies — The Biggest Pumpkin Ever and fall observations",
  },
  {
    src: `${BASE}/7B07976E-6BD7-4C60-A4F6-1DB68D77BBAD.JPG`,
    caption: "Primary — Curious George read-aloud on floor cushions",
  },
  {
    src: `${BASE}/84CC6B05-620A-41AD-A6E4-4899811A2F7F.JPG`,
    caption: "Friends sharing a picture book during quiet reading time",
  },
  {
    src: `${BASE}/9CBBE4DE-6DBC-473C-82D1-A55ECD8040AF.JPG`,
    caption: "Upper elementary — focused vocabulary writing with headphones on",
  },
  {
    src: `${BASE}/AAF4728D-B1F7-446F-9218-C6BCBEB5A2C2.JPG`,
    caption: "Collaborative search-and-find reading at the table",
  },
  {
    src: `${BASE}/C50A3C70-B9BC-44F6-B142-54718431E8F7.JPG`,
    caption: "Music circle with rhythm sticks during our ant investigation theme",
  },
  {
    src: `${BASE}/1F6084C2-6094-442D-81D1-AC9C3563ADAC.JPG`,
    caption: "Quiet reading spread across the primary classroom",
  },
  {
    src: `${BASE}/1D7D6AFE-DC1B-47A9-A062-263F421B93DC.JPG`,
    caption: "Primary — hands-on mixing during a science exploration",
  },
  {
    src: `${BASE}/A61A1CA3-C251-4DE9-9E1A-99B025791D3A.JPG`,
    caption: "Primary — marketplace writing with life-cycle vocabulary cards",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🍂",
    label: "Fall Nature Walks",
    desc: "Collecting leaves and sticks while counting by 5s and noticing patterns outdoors",
  },
  {
    emoji: "🐜",
    label: "Ant Life Cycle",
    desc: "Puzzles, tracing, and big questions about why ants matter in our ecosystem",
  },
  {
    emoji: "🎃",
    label: "Pumpkin Decomposition",
    desc: "Observing mold, compost, and what happens when we care for our environment",
  },
  {
    emoji: "🏪",
    label: "Classroom Marketplace",
    desc: "Store play tied to costs, buying, and reusing materials like the Sage Field Store",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➕",
    label: "Addition Strategies",
    desc: "Counting on, number lines, and two-digit regrouping with manipulatives",
  },
  {
    emoji: "📖",
    label: "Phonics & Sight Words",
    desc: "Short vowels, consonant sounds, and encoding words in daily reading",
  },
  {
    emoji: "💧",
    label: "States of Matter",
    desc: "Particle models plus sink-or-float tests with real hypotheses outdoors",
  },
  {
    emoji: "🎨",
    label: "Complementary Colors",
    desc: "Ocean-and-sun sketches for a color-wheel art project, plus end-of-week music",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "➗",
    label: "Division Foundations",
    desc: "Groups-of thinking with cubes — connecting division back to multiplication",
  },
  {
    emoji: "✏️",
    label: "Story Craft & How-To Writing",
    desc: "Literary elements and procedural PB&J directions with clear steps for readers",
  },
  {
    emoji: "🫖",
    label: "Clay & Buddy Learning",
    desc: "First clay exploration plus cross-grade buddy time with primary students",
  },
  {
    emoji: "🥗",
    label: "Harvest Quinoa Bowls",
    desc: "Cooking together — sequencing, measuring, and teamwork from prep to plate",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 6",
  title: "Week 6 Highlights",
  dates: "September 21–25, 2026",
  intro:
    "Week six brought a grounded rhythm — friendships growing, routines solid, and curiosity leading the way. From primary through upper elementary, students explored fall nature walks and ant investigations, strengthened addition and division, tested sink-or-float hypotheses, launched procedural writing, enjoyed music and buddy learning across grades, and closed the week with an At the Zoo Field Friday.",
  learned: {
    badge: "What We Learned",
    heading: "Fall Wonder & At the Zoo Across Every Grade",
    sub: "Primary, lower elementary, and upper elementary each followed fall observations into science, math, writing, and outdoor play.",
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
        title: "Field Day Friday: At the Zoo",
        desc: "Lion read-alouds, zoo animal painting, zoo bingo, and a zookeeper riddle hunt to return escaped animal stuffies to their habitats.",
      },
      {
        emoji: "🤝",
        title: "Buddy Learning Across Grades",
        desc: "Upper elementary paired with primary for shared lessons — leadership, patience, and learning side by side.",
      },
      {
        emoji: "🎵",
        title: "Music & Community Circles",
        desc: "Rhythm sticks and songs during ant investigations, plus storytime and reading circles that build belonging.",
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
