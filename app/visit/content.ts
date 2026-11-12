/**
 * Copy for the Visit page, carried over verbatim from the previous
 * app/visit/page.tsx. SCHOOL_FAQS is also used by /tour (identical copy).
 */
import { SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES } from "@/app/lib/highlights/school-year-latest-preview";
import type { FaqItem } from "@/app/_garden/types";

export const GALLERY_IMAGES = SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES;
export const GALLERY_ALT = "Sage Field school week 11";

export const BENTO_IMAGES = [
  "/assets/Stock3.jpg",
  SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES[0],
  SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES[2],
  SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES[5],
];
export const BENTO_ALT = "Sage Field campus and students";

export const HERO = {
  /** "How Would You Like to Visit?" */
  before: "How Would You Like to",
  highlight: "Visit?",
  body: "Pick the experience that fits where you are in your search. You can always come back for the other.",
};

export const PATHS = {
  tour: {
    href: "/tour",
    image: "/assets/Stock2.jpg",
    alt: "Family walking the outdoor campus at Sage Field",
    title: "Schedule a Campus Tour",
    body: "A private, ~45-minute walk through our outdoor campus. See the learning spaces, and feel whether Sage Field feels like home.",
  },
  shadow: {
    href: "/shadow",
    image: "/assets/Stock1.jpg",
    alt: "Children running and playing outdoors at Sage Field",
    title: "Book a Shadow Day",
    body: "Not a tour — an experience. Your child joins real lessons, outdoor time, and lunch with classmates. Mon–Thu, full day.",
  },
};

export const COMPARISON = {
  badge: "Which Is Right for You?",
  heading: "Tour vs. Shadow Day",
  tourHeader: "Campus Tour",
  shadowHeader: "Shadow Day",
  tourPrefix: "Tour:",
  shadowPrefix: "Shadow:",
  rows: [
    {
      label: "Best for",
      tour: "Your first look at campus and our approach",
      shadow: "When you are close to deciding and want your child’s perspective",
    },
    {
      label: "Who attends",
      tour: "Parents and family — walk the space together",
      shadow: "Your child joins class; you pick up at end of day",
    },
    {
      label: "Time commitment",
      tour: "~45 minutes",
      shadow: "Full school day · 9 AM – 3 PM",
    },
  ],
};

export const PLACE = {
  badge: "A Place Worth Seeing",
  heading: "Small Classes. Big Outdoors. Real Community.",
  body: [
    "Sage Field is a working microschool—not a staged open house. On a visit you'll see mixed-age groups in real lessons, kids moving between garden and trail, and teachers who greet every child by name. What you feel walking the campus matters more than any photo gallery.",
    "A campus tour is a relaxed first walk through our outdoor spaces. A shadow day lets your child spend a full school day in class. Both are no-pressure; we'd rather you know the fit early than enroll somewhere that isn't right.",
  ],
};

export const VISIT_FAQ_HEADER = { badge: "Before You Book", heading: "Common Questions" };

export const VISIT_FAQS: FaqItem[] = [
  {
    question: "Can we do both a tour and a shadow day?",
    answer:
      "Absolutely — and many families do. A campus tour is a great first step to see the space. A shadow day goes deeper: your child spends a full school day in class. There is no required order; choose what fits your timeline.",
  },
  {
    question: "What ages do you serve for visits?",
    answer:
      "We serve children ages 4–11 for our programs. Tours welcome the whole family. Shadow days are structured around one child in their appropriate age group so they get a real, personalized experience.",
  },
  {
    question: "Is there a fee to visit?",
    answer:
      "Campus tours are free — about 45 minutes, private, and no pressure. Shadow days are $20 per child for a full school day (Mon–Thu, 9 AM–3 PM). That fee supports real teacher time, materials, and outdoor learning for your child.",
  },
];

export const SCHOOL_FAQ_HEADER = {
  badge: "FAQ",
  heading: "Common Questions",
  sub: "Everything families ask before their first visit to Sage Field.",
};

export const SCHOOL_FAQS: FaqItem[] = [
  {
    question: "What is Sage Field?",
    answer:
      "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
  },
  {
    question: "What is a microschool?",
    answer:
      "A microschool is a small, independent private school — typically serving no more than 10–12 students per class — that offers a more personalized, flexible alternative to traditional schooling. Microschools prioritize small class sizes, individualized pacing, and innovative approaches to learning.",
  },
  {
    question: "What ages do you serve and how big are the groups?",
    answer:
      "We serve ages 4–11, with flexibility based on developmental fit. Students learn together in mixed-age groups so children can move at their own pace. We intentionally keep our groups small — typically no more than 10–12 children per class — so that our adults can stay closely attuned to each child's needs.",
  },
  {
    question: "What does a typical day at Sage Field look like?",
    answer:
      "Our days are designed to feel calm, connected, and alive with curiosity. Mornings are for focused academics in reading, writing, fluency, and math, individualized to each child's abilities. Afternoons flow into nature exploration, science, art, movement, and social-emotional learning. We prioritize real-world, hands-on experiences and time outdoors over worksheets and repetition.",
  },
  {
    question: "What subjects does Sage Field teach?",
    answer:
      "Our core curriculum includes reading, spelling, grammar, mathematics, and good citizenship. We complement these foundations with nature study, art, music, movement, and social-emotional learning, drawing from Montessori, Waldorf, and Reggio-inspired approaches with broadly TEKS-aligned academics.",
  },
  {
    question: "How does enrollment work and what is the financial commitment?",
    answer:
      "Families start by completing an application and connecting with us to ensure a good mutual fit. Enrollment is finalized when you sign our Enrollment Agreement (including a six-month commitment), sign our risk and media forms, and pay the non-refundable registration/materials fee.",
  },
];

export const CLOSING = {
  eyebrow: "Ready when you are",
  heading: "Pick your visit — we'll take it from there",
  tourCta: "Schedule a Tour",
  shadowCta: "Book a Shadow Day",
  questions: "Questions?",
  message: "Send us a message",
};
