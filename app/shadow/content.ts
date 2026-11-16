/**
 * Copy and data for the Shadow Day page, carried over verbatim from the
 * previous app/shadow/page.tsx.
 */
import { BookOpen, Heart, Leaf, Users } from "lucide-react";
import type { FaqItem } from "@/app/_garden/types";


// ─── Image Arrays ─────────────────────────────────────────────────────────────

export const WEEK11_IMAGES = [
  "/assets/highlights/school_week_eleven/2D1BA87C-3BA1-4596-857A-D62FFFD3AEF6.JPG",
  "/assets/highlights/school_week_eleven/06323F77-4E26-4A28-AC58-36B018A0831D.JPG",
  "/assets/highlights/school_week_eleven/A27CDDBC-D55F-4D28-B423-25A007194873.JPG",
  "/assets/highlights/school_week_eleven/CFCC1BF1-A38B-494A-A5CC-EEFB52A70DCF.JPG",
  "/assets/highlights/school_week_eleven/1D2A5D92-CD84-4A03-BE62-245B61BBAB7C.JPG",
  "/assets/highlights/school_week_eleven/55E07E7B-A294-4309-BD0D-0A6F80407C09.JPG",
  "/assets/highlights/school_week_eleven/BB5BE812-A57A-479A-9518-EA35163807C1.JPG",
  "/assets/highlights/school_week_eleven/84536C72-8BDE-4317-BC8D-DBF847371B06.JPG",
  "/assets/highlights/school_week_eleven/12AA3FB4-39F5-4C0F-AE00-9333FA3F0C51.JPG",
  "/assets/highlights/school_week_eleven/2556ABDA-EB7C-4195-91C4-02B8ADFDFDDD.JPG",
  "/assets/highlights/school_week_eleven/284E3969-ABB3-4FE9-8058-77EC8EF3EBCE.JPG",
  "/assets/highlights/school_week_eleven/4730BACD-4FC9-43B0-91CB-9B8B291DA3EF.JPG",
  "/assets/highlights/school_week_eleven/4C5C311E-D73B-4828-B490-D5B89A4EEA4E.JPG",
  "/assets/highlights/school_week_eleven/57847C9B-0702-4522-A6A4-7D8505A532D4.JPG",
  "/assets/highlights/school_week_eleven/59C54FC7-BC37-44F1-8A21-BA69BFAC9332.JPG",
  "/assets/highlights/school_week_eleven/5E2F84E7-04BA-4559-B923-E80B20E89938.JPG",
  "/assets/highlights/school_week_eleven/5FBD2189-56B1-4A9A-87CF-8C71AF4D892A.JPG",
  "/assets/highlights/school_week_eleven/61B5F293-E511-4D59-9E3E-9B91175A283F.JPG",
  "/assets/highlights/school_week_eleven/98947A25-7134-47E8-91AB-7159066B8AC2.JPG",
  "/assets/highlights/school_week_eleven/A64B6AD5-4EDE-455D-B908-F3B7CBAD96A5.JPG",
  "/assets/highlights/school_week_eleven/CFAA206B-D9A7-4A14-B1DD-85361140163B.JPG",
  "/assets/highlights/school_week_eleven/D210D1F5-2433-42D7-B9CD-13A91277D0B0.JPG",
  "/assets/highlights/school_week_eleven/D5140BFA-7ABC-4F92-96A7-8CCB732C546A.JPG",
  "/assets/highlights/school_week_eleven/D785E404-2B65-43B0-BB5E-567E14434AD7.JPG",
  "/assets/highlights/school_week_eleven/DB2777F7-2C5A-4DCB-9E13-8E339309622E.JPG",
  "/assets/highlights/school_week_eleven/E7C3B417-1770-412A-BF5A-5C5DEE0AB62B.JPG",
  "/assets/highlights/school_week_eleven/E85EDE1E-ADFE-4F0D-861C-1427EB58E8AB.JPG",
];

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

export const CAROUSEL_IMAGES = [...WEEK11_IMAGES, ...WEEK12_IMAGES];

export const GALLERY_INITIAL_COUNT = 9;

// ─── Week 11 Highlights ───────────────────────────────────────────────────────

export const WEEK11_PRIMARY_HIGHLIGHTS = [
  {
    emoji: "🏎️",
    label: "F1 Speed Recap",
    desc: "Lap counting, stopwatch timing, and speedometer talk after the racing inquiry",
  },
  {
    emoji: "🍧",
    label: "Juice-Pop Plans",
    desc: "Young entrepreneurs mapped steps and pricing questions for a product idea",
  },
  {
    emoji: "🎃",
    label: "Papier-Mâché",
    desc: "Halloween hands-on building with newspaper, paste, and imagination",
  },
  {
    emoji: "🚗",
    label: "Future Transport",
    desc: "Flying-car sketches sparked big questions about how cities might move",
  },
];

export const WEEK11_LOWER_ELEM_HIGHLIGHTS = [
  {
    emoji: "➖",
    label: "Subtraction Review",
    desc: "Math games and a brain check closed out October number work",
  },
  {
    emoji: "🔤",
    label: "CVC Wrap-Up",
    desc: "Building, spelling, and reading consonant-vowel-consonant words all week",
  },
  {
    emoji: "🧪",
    label: "Pumpkin Science",
    desc: "Carved mini pumpkins powered elephant-toothpaste eruptions outdoors",
  },
  {
    emoji: "👻",
    label: "Halloween Field Friday",
    desc: "Pumpkin paint, spooky slime, witches’ brew, and yard games before pick-up",
  },
];

export const WEEK11_UPPER_ELEM_HIGHLIGHTS = [
  {
    emoji: "🍕",
    label: "Fraction Fluency",
    desc: "Like and unlike denominators, multiplication, equivalents, and ordering",
  },
  {
    emoji: "📓",
    label: "Notebooking",
    desc: "I Think, I Notice, I Wonder responses turned reading into research",
  },
  {
    emoji: "🔤",
    label: "Word Study",
    desc: "Compound words plus in-, im-, and dis- prefixes in vocabulary work",
  },
  {
    emoji: "🥧",
    label: "Pies & Dot Art",
    desc: "Mini apple pies, spiral dot drawings, music, and a classroom celebration",
  },
];

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
    "/assets/highlights/school_week_twelve/4C91BE96-1DAA-442A-9D31-D18B017CBACC.JPG",
    "/assets/highlights/school_week_eleven/2D1BA87C-3BA1-4596-857A-D62FFFD3AEF6.JPG",
    "/assets/highlights/school_week_twelve/5F89FB6A-BC40-40AE-9CF5-AD11C088BCB3.JPG",
  ],
};

export const RECAP = {
  badge: "Weeks 11 & 12 in Review",
  heading: "A Glimpse of What Kids Do Here",
  sub: "Weeks eleven and twelve — October wrap-ups meet November gratitude, anatomy labs, tomato basil soup, and Autumn Adventure Field Friday.",
  showFewer: "Show fewer photos",
  seeAll: (n: number) => `See all ${n} photos →`,
  week11: "Week 11",
  week12: "Week 12",
  bands: [
    { emoji: "🌱", title: "Primary", subtitle: "Pre-K & Kindergarten", tint: "coral" as const, week11: WEEK11_PRIMARY_HIGHLIGHTS, week12: WEEK12_PRIMARY_HIGHLIGHTS },
    { emoji: "✨", title: "Lower Elementary", subtitle: "1st & 2nd Grade", tint: "sage" as const, week11: WEEK11_LOWER_ELEM_HIGHLIGHTS, week12: WEEK12_LOWER_ELEM_HIGHLIGHTS },
    { emoji: "📐", title: "Upper Elementary", subtitle: "3rd & 4th Grade", tint: "sky" as const, week11: WEEK11_UPPER_ELEM_HIGHLIGHTS, week12: WEEK12_UPPER_ELEM_HIGHLIGHTS },
  ],
  links: [
    { label: "View Full Week 11 Recap →", href: "/highlights/school-year/week-11" },
    { label: "View Full Week 12 Recap →", href: "/highlights/school-year/week-12" },
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
