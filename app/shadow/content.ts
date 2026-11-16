/**
 * Copy and data for the Shadow Day page, carried over verbatim from the
 * previous app/shadow/page.tsx.
 */
import { BookOpen, Heart, Leaf, Users } from "lucide-react";
import type { FaqItem } from "@/app/_garden/types";


// ─── Image Arrays ─────────────────────────────────────────────────────────────

export const WEEK12_IMAGES = [
  "/assets/highlights/school_week_twelve/4C91BE96-1DAA-442A-9D31-D18B017CBACC.JPG",
  "/assets/highlights/school_week_twelve/5F89FB6A-BC40-40AE-9CF5-AD11C088BCB3.JPG",
  "/assets/highlights/school_week_twelve/10CC9173-98B8-4C61-AC26-BC47AD794446.JPG",
  "/assets/highlights/school_week_twelve/AD71CA2A-A8E9-4463-A0A3-142CF28E77A5.JPG",
  "/assets/highlights/school_week_twelve/4843EA7B-0555-471A-980A-201D5D946C20.JPG",
  "/assets/highlights/school_week_twelve/93C77585-2766-4445-A567-36B1D8D5E528.JPG",
  "/assets/highlights/school_week_twelve/3A2D9CC2-CBC0-4FB5-B939-1F5943B71917.JPG",
  "/assets/highlights/school_week_twelve/42204CE0-4F42-4137-86B2-EEAB2C602047.JPG",
  "/assets/highlights/school_week_twelve/7F63D5AB-60B2-4394-9B75-05074B9928CA.JPG",
  "/assets/highlights/school_week_twelve/3372BC8C-4A29-4604-A768-C788925A1CF2.JPG",
  "/assets/highlights/school_week_twelve/48D42281-6276-4268-8D8A-D43437EF17C7.JPG",
  "/assets/highlights/school_week_twelve/530085FA-8419-4772-B7BC-F8432A1A6C8B.JPG",
  "/assets/highlights/school_week_twelve/23219CC1-98DB-4B4C-96D5-B770AF8E4EE4.JPG",
  "/assets/highlights/school_week_twelve/0A7EB988-ECAE-43A3-9DF0-F4373EF6C013.JPG",
  "/assets/highlights/school_week_twelve/EFB8DA43-FCA8-408E-ADAB-40F06498DCAB.JPG",
  "/assets/highlights/school_week_twelve/AD03DCE9-DC98-4011-B106-BA6076C1D929.JPG",
  "/assets/highlights/school_week_twelve/9C1D5E40-6AB7-45E9-96BD-117B95105520.JPG",
];

export const WEEK13_IMAGES = [
  "/assets/highlights/school_week_thirteen/E9592AC5-43E4-4FE2-A6DC-4252DEA66F3B.JPG",
  "/assets/highlights/school_week_thirteen/115B841E-75B5-41E3-A4BC-CA918C7D8725.JPG",
  "/assets/highlights/school_week_thirteen/D0093CD7-713C-477E-9152-780E53E67A19.JPG",
  "/assets/highlights/school_week_thirteen/9441DD41-0FE0-4392-B6DB-02541E27E6B0.JPG",
  "/assets/highlights/school_week_thirteen/A743F6DE-5FCB-47E0-9CBF-65DF8BC603A1.JPG",
  "/assets/highlights/school_week_thirteen/E5B6CB15-19C7-489F-AE73-C389EFECD17A.JPG",
  "/assets/highlights/school_week_thirteen/48037449-91EB-42CC-8BED-C223EEB8198F.JPG",
  "/assets/highlights/school_week_thirteen/A3A4F91B-11BE-4522-8259-4ABCB31CA228.JPG",
  "/assets/highlights/school_week_thirteen/1EFB779B-0CAF-4FBE-A77E-44A3D89668E1.JPG",
  "/assets/highlights/school_week_thirteen/44E55189-C3EB-43A6-9C1C-0233F3D5A141.JPG",
  "/assets/highlights/school_week_thirteen/36BBB44C-D2E2-4DA8-86BF-C299960DE9A4.JPG",
  "/assets/highlights/school_week_thirteen/056BEB1D-0784-41FE-8BD7-29E59E4019CE.JPG",
  "/assets/highlights/school_week_thirteen/81B80BAE-33DB-4006-BDCB-7A42CCA609AD.JPG",
  "/assets/highlights/school_week_thirteen/BD4BCE83-CE43-45A4-B11B-014DD35D094C.JPG",
  "/assets/highlights/school_week_thirteen/6ED75E80-4CB9-436E-AD21-71FE4E6AD500.JPG",
  "/assets/highlights/school_week_thirteen/6E0F2732-89DC-45E0-895A-199D12052DA6.JPG",
  "/assets/highlights/school_week_thirteen/735709B9-E1D0-451A-BE1C-099E5D87FA99.JPG",
  "/assets/highlights/school_week_thirteen/F9619621-6639-4468-BD60-0732607EADED.JPG",
  "/assets/highlights/school_week_thirteen/FFE7E564-32A0-4E6A-A969-B1CC68ED79F8.JPG",
  "/assets/highlights/school_week_thirteen/2B1DEF94-2145-43F0-A2FA-CA5863298627.JPG",
  "/assets/highlights/school_week_thirteen/137DB17C-8A7D-445F-AF37-FE5DB05DB926.JPG",
  "/assets/highlights/school_week_thirteen/9699E3DD-9F06-482A-8ABB-A3F7BED974E2.JPG",
  "/assets/highlights/school_week_thirteen/E96C67A6-7C01-4194-8C85-8D213E7B1AB0.JPG",
  "/assets/highlights/school_week_thirteen/DECA4BDD-1EA1-487B-B64A-C701D5A81194.JPG",
  "/assets/highlights/school_week_thirteen/D27F2E31-98B2-499D-BCB2-2E62AD9047DE.JPG",
  "/assets/highlights/school_week_thirteen/99B16682-DC87-4EA5-82A4-99571A989C5D.JPG",
  "/assets/highlights/school_week_thirteen/E21C7173-D6F2-4D7E-985B-A29D7DE25288.JPG",
];

export const CAROUSEL_IMAGES = [...WEEK12_IMAGES, ...WEEK13_IMAGES];

export const GALLERY_INITIAL_COUNT = 9;

// ─── Week 12 Highlights ───────────────────────────────────────────────────────

export const WEEK12_PRIMARY_HIGHLIGHTS = [
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

export const WEEK12_LOWER_ELEM_HIGHLIGHTS = [
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

export const WEEK12_UPPER_ELEM_HIGHLIGHTS = [
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

// ─── Week 13 Highlights ───────────────────────────────────────────────────────

export const WEEK13_PRIMARY_HIGHLIGHTS = [
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

export const WEEK13_LOWER_ELEM_HIGHLIGHTS = [
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

export const WEEK13_UPPER_ELEM_HIGHLIGHTS = [
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

// ─── Who It's For ─────────────────────────────────────────────────────────────

export const WHO_ITS_FOR = [
  {
    icon: BookOpen,
    headline: "Your child sits in a classroom all day",
    body: "At Sage Field, mornings are real academics — reading, writing, and math at your child's actual level. Afternoons are nature, cooking, animals, and art. It's a full school day, just built differently.",
  },
  {
    icon: Leaf,
    headline: "You want real learning, not just busy work",
    body: "We teach by ability, not grade. A 7-year-old and a 9-year-old can sit together and each work at the level where they actually are. No one gets left behind. No one gets bored waiting.",
  },
  {
    icon: Users,
    headline: "You want your child to actually be known",
    body: "With about 10 kids per class and mixed ages, there's no hiding. Every child has a name, a role, and a relationship with the teacher. Come see what that actually looks like in a day.",
  },
  {
    icon: Heart,
    headline: "Traditional school hasn't felt right",
    body: "Whether it's the pace, the structure, the size, or just the feeling — if your child hasn't thrived yet, a shadow day will tell you more than any website can.",
  },
];

// ─── Packing List ─────────────────────────────────────────────────────────────

export const PACKING_LIST = [
  { emoji: "🧴", item: "Sunscreen (applied before drop-off)" },
  { emoji: "👕", item: "Change of clothes" },
  { emoji: "💧", item: "Water bottle, labeled" },
  { emoji: "🦟", item: "Bug spray" },
  { emoji: "🥪", item: "Snack + lunch from home" },
];

// ─── Activities & Risks (for Agreement) ──────────────────────────────────────

export const ACTIVITIES = [
  "Climbing trees, logs, rocks, play structures, and natural features",
  "Running, balancing, jumping, hiking, and exploring uneven terrain",
  "Outdoor games and physical activities",
  "Gardening and nature-based activities",
  "Interaction with insects, wildlife, plants, and natural materials",
  "Cooking and food preparation activities",
  "Use of age-appropriate tools, utensils, and equipment under supervision",
  "Water play activities",
  "Animal interactions",
  "Arts, crafts, building projects, and other hands-on learning experiences",
];

export const RISKS = [
  "Slips, trips, falls, and collisions",
  "Cuts, scrapes, bruises, splinters, burns, and minor injuries",
  "Sprains, fractures, and other physical injuries",
  "Exposure to weather conditions including heat, cold, rain, wind, and sun",
  "Exposure to insects, including bees, wasps, mosquitoes, ants, ticks, and chiggers",
  "Contact with plants, soil, mud, and natural environments",
  "Allergic reactions",
  "Risks associated with cooking activities and use of cooking equipment",
  "Risks associated with supervised use of tools and equipment",
  "Risks associated with interactions with animals",
  "Risks arising from participation in active outdoor play and exploration",
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const SHADOW_FAQS = [
  {
    question: "Why does a shadow day cost $20?",
    answer:
      "The $20 fee ensures we can give every visiting child real teacher attention, materials, and a full outdoor experience — not a rushed tour. It also means we can keep the class environment exactly as it would be on any normal school day.",
    highlight: true,
  },
  {
    question: "What should my child bring?",
    answer:
      "Comfortable clothes they can get dirty in, closed-toe shoes (they'll be outdoors), a water bottle, a packed lunch, sunscreen already applied, and bug spray. We'll confirm specifics when we confirm your booking.",
    highlight: false,
  },
  {
    question: "What ages and grades can shadow?",
    answer:
      "Shadow days are open to children ages 4–11 (Pre-K through roughly 5th grade). Each child spends the day with their closest age group at Sage Field.",
    highlight: false,
  },
  {
    question: "What if the day doesn't feel like a fit?",
    answer:
      "That's completely fine. Ms. Sabrina will still spend time with you at pickup sharing honest observations about what she noticed and where your child might thrive. There's no pressure — just a real conversation.",
    highlight: false,
  },
];

export const SHADOW_FAQ_ITEMS: FaqItem[] = SHADOW_FAQS.map(({ question, answer }) => ({ question, answer }));

// ─── Page copy ───────────────────────────────────────────────────────────────

export const PHOTO_ALT = "Students at Sage Field";

export const HERO = {
  /** "Let Your Child Live a Day Here." */
  before: "Let Your Child",
  highlight: "Live a Day Here.",
  body: "Your child deserves to feel what learning can feel like. A Shadow Day is a full school day at Sage Field — real lessons, real outdoor time, real lunch with classmates. Not a tour. An experience.",
  pills: [
    { emoji: "📅", label: "Mon–Thu Only" },
    { emoji: "🕗", label: "Full Day 9AM–3PM" },
    { emoji: "👧", label: "Ages 4–11" },
    { emoji: "💰", label: "$20 Shadow Day" },
    { emoji: "📍", label: "Round Rock TX" },
  ],
  cta: "Book a Shadow Day →",
  secondary: "See a Day in Action",
  photos: [
    "/assets/highlights/school_week_thirteen/E9592AC5-43E4-4FE2-A6DC-4252DEA66F3B.JPG",
    "/assets/highlights/school_week_twelve/4C91BE96-1DAA-442A-9D31-D18B017CBACC.JPG",
    "/assets/highlights/school_week_thirteen/D0093CD7-713C-477E-9152-780E53E67A19.JPG",
  ],
};

export const RECAP = {
  badge: "Weeks 12 & 13 in Review",
  heading: "A Glimpse of What Kids Do Here",
  sub: "Weeks twelve and thirteen — November gratitude and anatomy labs meet motion investigations, percentages, stick-house builds, snickerdoodles, and Race Car Field Friday.",
  showFewer: "Show fewer photos",
  seeAll: (n: number) => `See all ${n} photos →`,
  week12: "Week 12",
  week13: "Week 13",
  bands: [
    { emoji: "🌱", title: "Primary", subtitle: "Pre-K & Kindergarten", tint: "coral" as const, week12: WEEK12_PRIMARY_HIGHLIGHTS, week13: WEEK13_PRIMARY_HIGHLIGHTS },
    { emoji: "✨", title: "Lower Elementary", subtitle: "1st & 2nd Grade", tint: "sage" as const, week12: WEEK12_LOWER_ELEM_HIGHLIGHTS, week13: WEEK13_LOWER_ELEM_HIGHLIGHTS },
    { emoji: "📐", title: "Upper Elementary", subtitle: "3rd & 4th Grade", tint: "sky" as const, week12: WEEK12_UPPER_ELEM_HIGHLIGHTS, week13: WEEK13_UPPER_ELEM_HIGHLIGHTS },
  ],
  links: [
    { label: "View Full Week 12 Recap →", href: "/highlights/school-year/week-12" },
    { label: "View Full Week 13 Recap →", href: "/highlights/school-year/week-13" },
  ],
};

export const WHO = {
  badge: "Is This Right for Us?",
  heading: "Shadow Days Are Made for These Families",
  sub: "You don't need to be sold. You need to see it.",
};

export const FORM = {
  badge: "Reserve Your Spot",
  heading: "Book Your Shadow Day",
  sub: "Takes 60 seconds. $20 holds your spot.",
  yourInfo: "Your Info",
  parentName: { label: "Parent / guardian name", placeholder: "Your full name" },
  email: { label: "Email", placeholder: "you@email.com" },
  phone: { label: "Phone", placeholder: "(512) 000-0000" },
  yourChild: "Your Child",
  childrenSuffix: "ren",
  perChild: "$20 per child",
  child: "Child",
  remove: "Remove",
  childName: { label: "Name", placeholder: "First and last name" },
  childAge: { label: "Age", placeholder: "Select age" },
  ages: [4, 5, 6, 7, 8, 9, 10, 11],
  ageSuffix: "years old",
  addChild: "+ Add Another Child",
  total: (n: number, total: number) => `${n} children · $${total} total`,
  preferredDay: "Preferred Shadow Day",
  dayChip: "Full Day · 9:00 AM – 3:00 PM",
  bitMore: "A Bit More",
  referral: {
    label: "How did you hear about us?",
    placeholder: "Select one",
    options: [
      { value: "friend", label: "Friend / Word of Mouth" },
      { value: "instagram", label: "Instagram" },
      { value: "facebook", label: "Facebook" },
      { value: "google", label: "Google" },
      { value: "nextdoor", label: "Nextdoor" },
      { value: "other", label: "Other" },
    ],
  },
  notes: {
    label: "Anything we should know?",
    placeholder: "Allergies, medical needs, sensitivities, or anything that helps us take great care of your child",
  },
  emergency: "Emergency Contact",
  emergencyName: { label: "Emergency contact name", placeholder: "Name if you can't be reached" },
  emergencyPhone: { label: "Emergency contact phone", placeholder: "(512) 000-0000" },
  confirm: "Before we confirm your spot",
  consents: {
    consentOutdoor: "I give permission for my child to participate in outdoor activities and to have sunscreen applied if needed",
    consentPhoto: "I'm okay with photos of my child being taken and shared on Sage Field's social media",
    interestedInEnrollment: "I'd love to learn more about joining Sage Field regularly",
  },
  agreement: {
    title: "Shadow Day Agreement",
    signed: "Signed — ready to submit",
    required: "Required before submitting",
    view: "View",
    sign: "Review & Sign →",
    locked: "Fill in required fields above to unlock the agreement",
  },
  submitting: "Submitting…",
  submit: (total: number) => `Book My Shadow Day — $${total} →`,
};

export const PACKING = {
  badge: "Day-of Checklist",
  heading: "What to Pack for Your Shadow Day",
  questions: "Questions? Text or call us: (512) 677-5872",
};

export const FAQ_HEADER = {
  badge: "Common Questions",
  heading: "Before You Book",
  sub: "Everything families ask before their child's shadow day.",
};

export const BOTTOM_CTA = {
  badge: "Shadow Day · $20",
  heading: "Ready to see if this is the right fit?",
  body: "Let your child be the judge. Book a shadow day and see what learning feels like when it's built around how they actually think.",
  cta: "Book Your Shadow Day — $20 →",
  note: "$20 shadow day fee",
};

export const STICKY = {
  title: "Shadow Day · $20",
  sub: "Mon–Thu · 9 AM–3 PM",
  cta: "Book Now →",
};

export const SUCCESS = {
  heading: "You're booked!",
  body: "Your shadow day at Sage Field is confirmed. We'll reach out shortly to confirm your date and share everything you need to know.",
  email: "Check your email — a confirmation with details is on its way.",
  back: "Back to Home",
};
