/**
 * Copy and data for the Shadow Day page, carried over verbatim from the
 * previous app/shadow/page.tsx.
 */
import { BookOpen, Heart, Leaf, Users } from "lucide-react";
import type { FaqItem } from "@/app/_garden/types";


// ─── Image Arrays ─────────────────────────────────────────────────────────────

export const WEEK10_IMAGES = [
  "/assets/highlights/school_week_ten/E9C8665F-3A5D-4D42-BBEE-A304AE89650C 2.JPG",
  "/assets/highlights/school_week_ten/738F9C06-0FA2-4123-84DB-F02E783177C6 2.JPG",
  "/assets/highlights/school_week_ten/36BA22E1-883A-4E3D-B4AA-59DDF3BB1D5D 2.JPG",
  "/assets/highlights/school_week_ten/500878B3-9A0E-40EC-98BE-90BCA4C5B3C2 2.JPG",
  "/assets/highlights/school_week_ten/6A513DEA-DA53-4A0B-97F0-56CD8252239E 2.JPG",
  "/assets/highlights/school_week_ten/D6531363-0E64-47BD-BF46-74BB7AF1AF1D 2.JPG",
  "/assets/highlights/school_week_ten/4FBDDB9F-3CD9-4CDC-BE85-5747C8565143 2.JPG",
  "/assets/highlights/school_week_ten/2ED66DBE-D717-438E-9F23-2B6773BC53B9 2.JPG",
  "/assets/highlights/school_week_ten/CF0580D0-E27D-4643-82AC-DA64589B4D5D 2.JPG",
  "/assets/highlights/school_week_ten/5A0D8F13-F909-436C-920F-D0239845F44A 2.JPG",
  "/assets/highlights/school_week_ten/9C9E161E-C4A2-4D8F-9807-63E7A25DE79E 2.JPG",
  "/assets/highlights/school_week_ten/CD090DFB-4F87-44B0-8C3D-6BD63F38DAA7 2.JPG",
  "/assets/highlights/school_week_ten/84F1CC69-0D48-4206-9A3C-1047209EDE1F 2.JPG",
  "/assets/highlights/school_week_ten/76C5792B-D9E9-4D86-A280-DEC741EF9CD1 2.JPG",
  "/assets/highlights/school_week_ten/2157652A-3FA6-4458-BD7C-E93F888BBA15 2.JPG",
  "/assets/highlights/school_week_ten/EC13D47B-9B4C-430B-AE2C-92B6530229E5 2.JPG",
  "/assets/highlights/school_week_ten/B7159973-EEFB-4EFD-8D26-FA00FCE67452 2.JPG",
];

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

export const CAROUSEL_IMAGES = [...WEEK10_IMAGES, ...WEEK11_IMAGES];

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

// ─── Week 10 Highlights ───────────────────────────────────────────────────────

export const WEEK10_PRIMARY_HIGHLIGHTS = [
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

export const WEEK10_LOWER_ELEM_HIGHLIGHTS = [
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

export const WEEK10_UPPER_ELEM_HIGHLIGHTS = [
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
    "/assets/highlights/school_week_eleven/2D1BA87C-3BA1-4596-857A-D62FFFD3AEF6.JPG",
    "/assets/highlights/school_week_ten/E9C8665F-3A5D-4D42-BBEE-A304AE89650C 2.JPG",
    "/assets/highlights/school_week_eleven/A27CDDBC-D55F-4D28-B423-25A007194873.JPG",
  ],
};

export const RECAP = {
  badge: "Weeks 10 & 11 in Review",
  heading: "A Glimpse of What Kids Do Here",
  sub: "Weeks ten and eleven — here's a real look at what your child would experience at Sage Field. October wrap-ups, Halloween Field Friday, and real community.",
  showFewer: "Show fewer photos",
  seeAll: (n: number) => `See all ${n} photos →`,
  week10: "Week 10",
  week11: "Week 11",
  bands: [
    { emoji: "🌱", title: "Primary", subtitle: "Pre-K & Kindergarten", tint: "coral" as const, week10: WEEK10_PRIMARY_HIGHLIGHTS, week11: WEEK11_PRIMARY_HIGHLIGHTS },
    { emoji: "✨", title: "Lower Elementary", subtitle: "1st & 2nd Grade", tint: "sage" as const, week10: WEEK10_LOWER_ELEM_HIGHLIGHTS, week11: WEEK11_LOWER_ELEM_HIGHLIGHTS },
    { emoji: "📐", title: "Upper Elementary", subtitle: "3rd & 4th Grade", tint: "sky" as const, week10: WEEK10_UPPER_ELEM_HIGHLIGHTS, week11: WEEK11_UPPER_ELEM_HIGHLIGHTS },
  ],
  links: [
    { label: "View Full Week 10 Recap →", href: "/highlights/school-year/week-10" },
    { label: "View Full Week 11 Recap →", href: "/highlights/school-year/week-11" },
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
