/**
 * Copy and photos for this weekly recap, carried over verbatim from the
 * previous page.tsx. Rendered by app/highlights/_shared/WeekHighlightsPage.
 */
import type { WeekHighlight } from "@/app/highlights/_shared/types";

const BASE = "/assets/highlights/school_week_thirteen";

const WEEK_IMAGES: { src: string; caption: string }[] = [
  {
    src: `${BASE}/E9592AC5-43E4-4FE2-A6DC-4252DEA66F3B.JPG`,
    caption: "November sunshine — rain boots and jackets for outdoor play across the yard",
  },
  {
    src: `${BASE}/115B841E-75B5-41E3-A4BC-CA918C7D8725.JPG`,
    caption: "Upper elementary — notebooking and problem-solving at picnic tables under the trees",
  },
  {
    src: `${BASE}/D0093CD7-713C-477E-9152-780E53E67A19.JPG`,
    caption: "Field Friday — race cars and fraction grids at the outdoor lunch table",
  },
  {
    src: `${BASE}/9441DD41-0FE0-4392-B6DB-02541E27E6B0.JPG`,
    caption: "Upper elementary — percentage cards and pie charts with a teacher on the grass",
  },
  {
    src: `${BASE}/A743F6DE-5FCB-47E0-9CBF-65DF8BC603A1.JPG`,
    caption: "Upper elementary — popsicle-stick house engineering with glue guns and desk lamps",
  },
  {
    src: `${BASE}/E5B6CB15-19C7-489F-AE73-C389EFECD17A.JPG`,
    caption: "Cooking — pumpkin snickerdoodle batter scooped and baked into golden cookies",
  },
  {
    src: `${BASE}/48037449-91EB-42CC-8BED-C223EEB8198F.JPG`,
    caption: "Music circle — acoustic guitar and sing-along on the striped outdoor rug",
  },
  {
    src: `${BASE}/A3A4F91B-11BE-4522-8259-4ABCB31CA228.JPG`,
    caption: "Lower elementary — gravity fill-in-the-blank after the ball-drop lab",
  },
  {
    src: `${BASE}/1EFB779B-0CAF-4FBE-A77E-44A3D89668E1.JPG`,
    caption: "Primary — whiteboard circle time on the striped rug in cool November air",
  },
  {
    src: `${BASE}/44E55189-C3EB-43A6-9C1C-0233F3D5A141.JPG`,
    caption: "Lower elementary — pizzeria fraction game with topping tiles on the pizza mat",
  },
  {
    src: `${BASE}/36BBB44C-D2E2-4DA8-86BF-C299960DE9A4.JPG`,
    caption: "Cooking — measuring and mixing snickerdoodle dough on the porch table",
  },
  {
    src: `${BASE}/056BEB1D-0784-41FE-8BD7-29E59E4019CE.JPG`,
    caption: "Upper elementary — double-digit multiplication practice on outdoor whiteboards",
  },
  {
    src: `${BASE}/81B80BAE-33DB-4006-BDCB-7A42CCA609AD.JPG`,
    caption: "Primary — phases-of-the-moon worksheet modeled with Oreo cookies",
  },
  {
    src: `${BASE}/BD4BCE83-CE43-45A4-B11B-014DD35D094C.JPG`,
    caption: "Primary — scraping cookie cream to match each lunar phase on the chart",
  },
  {
    src: `${BASE}/6ED75E80-4CB9-436E-AD21-71FE4E6AD500.JPG`,
    caption: "Primary — splatter-painting a night sky beside moon-phase reference cards",
  },
  {
    src: `${BASE}/6E0F2732-89DC-45E0-895A-199D12052DA6.JPG`,
    caption: "Lower elementary — Veterans Day thank-you letter drafts at the picnic table",
  },
  {
    src: `${BASE}/735709B9-E1D0-451A-BE1C-099E5D87FA99.JPG`,
    caption: "Lower elementary — painting patriotic art for Veterans Day under the patio",
  },
  {
    src: `${BASE}/F9619621-6639-4468-BD60-0732607EADED.JPG`,
    caption: "Primary — coloring Veterans Day pages and writing thank-you notes",
  },
  {
    src: `${BASE}/FFE7E564-32A0-4E6A-A969-B1CC68ED79F8.JPG`,
    caption: "Lower elementary — flag coloring during branches-of-government reading",
  },
  {
    src: `${BASE}/2B1DEF94-2145-43F0-A2FA-CA5863298627.JPG`,
    caption: "Primary — clay and palette work at the science table with open reference books",
  },
  {
    src: `${BASE}/137DB17C-8A7D-445F-AF37-FE5DB05DB926.JPG`,
    caption: "Primary — sand-pit towers and molds in collaborative outdoor play",
  },
  {
    src: `${BASE}/9699E3DD-9F06-482A-8ABB-A3F7BED974E2.JPG`,
    caption: "Lower elementary — color-by-number math review on the classroom rug",
  },
  {
    src: `${BASE}/E96C67A6-7C01-4194-8C85-8D213E7B1AB0.JPG`,
    caption: "Upper elementary — Greek and Latin prefix-and-suffix word building in notebooks",
  },
  {
    src: `${BASE}/DECA4BDD-1EA1-487B-B64A-C701D5A81194.JPG`,
    caption: "Primary — National Geographic Kids readers spread across the research table",
  },
  {
    src: `${BASE}/D27F2E31-98B2-499D-BCB2-2E62AD9047DE.JPG`,
    caption: "Lower elementary — force-and-motion lesson at the easel before catapult builds",
  },
  {
    src: `${BASE}/99B16682-DC87-4EA5-82A4-99571A989C5D.JPG`,
    caption: "Lower elementary — hula-hoop spins and coordination games behind the schoolhouse",
  },
  {
    src: `${BASE}/E21C7173-D6F2-4D7E-985B-A29D7DE25288.JPG`,
    caption: "Lunch bunch — outdoor snack time inside the wooden play fort",
  },
];

const PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🦃",
    label: "Thanksgiving Gratitude",
    desc: "Talked about what thankfulness looks and feels like every day",
  },
  {
    emoji: "📖",
    label: "Story Elements",
    desc: "Named main characters and settings while retelling favorite tales",
  },
  {
    emoji: "🌍",
    label: "Earth & Space",
    desc: "Ant inquiry sparked planet layers and big wondering about space",
  },
  {
    emoji: "💡",
    label: "Light & Energy",
    desc: "November science on how light and energy show up around us",
  },
];

const LOWER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Pizzeria Fractions",
    desc: "Pizza orders and number lines built fraction fluency all week",
  },
  {
    emoji: "🚀",
    label: "Force & Motion Labs",
    desc: "Catapults, friction road tests, and gravity ball drops outdoors",
  },
  {
    emoji: "🦃",
    label: "Disguise-a-Turkey",
    desc: "Family creativity project packets sent home for November fun",
  },
  {
    emoji: "🎨",
    label: "Texture Collages",
    desc: "Rainbow-ordered materials finished multimedia art pieces",
  },
];

const UPPER_ELEMENTARY_HIGHLIGHTS = [
  {
    emoji: "📊",
    label: "Percentages",
    desc: "100-grids linked fractions, diagrams, and real-life word problems",
  },
  {
    emoji: "✍️",
    label: "Introduction Writing",
    desc: "Hooks, background, and thesis statements in persuasive drafts",
  },
  {
    emoji: "🫁",
    label: "Digestive System",
    desc: "Notebooking on how our bodies process food from bite to energy",
  },
  {
    emoji: "🏠",
    label: "Stick House Build",
    desc: "Engineering teams designed sturdy popsicle-stick structures",
  },
];

export const WEEK: WeekHighlight = {
  program: "school-year",
  badge: "School Year 2026–27 · Week 13",
  title: "Week 13 Highlights",
  dates: "November 9–13, 2026",
  intro:
    "Week thirteen leaned into November science, writing, and gratitude with sunny outdoor days across campus. Primary explored thankfulness, story elements, and Earth-and-space wonder; lower elementary ran fraction pizzerias, force-and-motion labs, and Veterans Day writing, then raced through Field Friday; upper elementary opened percentages and introduction paragraphs, studied the digestive system, and engineered popsicle-stick houses — with pumpkin snickerdoodles rounding out the week.",
  learned: {
    badge: "What We Learned",
    heading: "Science Labs, Writing & November Projects",
    sub: "Primary, lower elementary, and upper elementary connected academics to cooking, engineering challenges, and patriotic writing in the sunshine.",
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
        emoji: "🏎️",
        title: "Field Friday: Race Cars & Speedsters",
        desc: "Painted race cars, colored speed puzzles, and crafted pennant flags in the yard.",
      },
      {
        emoji: "🍪",
        title: "Pumpkin Snickerdoodles",
        desc: "Every grade measured, mixed, and baked cozy pumpkin cookies together.",
      },
      {
        emoji: "🌅",
        title: "Sunset Silhouette Art",
        desc: "Upper elementary rotated through paint, stencil, and cut stations for skyline scenes.",
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