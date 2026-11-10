/**
 * Copy and photo lists for the home page (app/page.tsx → app/_home/HomePage.tsx).
 *
 * The wording was carried over verbatim from the previous home page and its
 * components. Some of it also still appears in older components used on other
 * pages (e.g. MeetTheTeamSection), so update both if the copy changes.
 */
import type { ReactNode } from "react";
import type { FaqGroup, TeamMember } from "@/app/_garden/types";

export type { FaqGroup, FaqItem, Run, TeamMember } from "@/app/_garden/types";

// ─── Hero (app/components/Hero.tsx) ──────────────────────────────────────────

export type HeroSlide = {
  image: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref?: string;
  buttonAction?: "waitlist";
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/assets/Stock1.jpg",
    title: "Welcome to Sage Field!",
    description:
      "A small, outdoor-focused private microschool in Round Rock, Texas.",
    buttonLabel: "Interested in Joining?",
    buttonAction: "waitlist",
  },
  {
    image:
      "/assets/highlights/school_week_eleven/2D1BA87C-3BA1-4596-857A-D62FFFD3AEF6.JPG",
    title: "School Year Week 11 Highlights Are Live!",
    description:
      "F1 speed recap, juice-pop entrepreneurship, October unit wrap-ups, fraction fluency, mini apple pies, and Halloween Field Friday.",
    buttonLabel: "View Week 11 Recap →",
    buttonHref: "/highlights/school-year/week-11",
  },
  {
    image: "/assets/Stock4.jpg",
    title: "School Year 2026–2027",
    description:
      "Up to 4 days a week of enriched, Montessori-inspired learning for ages 4–11 starting August 17.",
    buttonLabel: "See the School Year",
    buttonHref: "/school-year-2026-2027",
  },
  {
    image: "/assets/Stock6.jpg",
    title: "Apply to Sage Field",
    description:
      "Spots are limited. Apply early to secure your child's place in our School Year program.",
    buttonLabel: "Apply Now",
    buttonHref: "/apply",
  },
  {
    image: "/assets/Stock7.jpg",
    title: "Book a Private Tour",
    description:
      "Walk the campus, meet Ms. Sabrina, and see Sage Field in person — free, private, 45 minutes.",
    buttonLabel: "Schedule a Tour",
    buttonHref: "/tour",
  },
  {
    image:
      "/assets/highlights/school_week_three/5DADF1CF-46A4-4F2E-95E6-FD0C5178DDDB.JPG",
    title: "Let Your Child Live a Day Here.",
    description:
      "A Shadow Day is a full school day at Sage Field — real lessons, outdoor time, and lunch with classmates. Not a tour. An experience. Mon–Thu, ages 4–11, $20.",
    buttonLabel: "Book a Shadow Day →",
    buttonHref: "/shadow",
  },
  {
    image: "/assets/Stock8.jpg",
    title: "Homeschool Drop-In",
    description:
      "1 to 5 days a week of flexible enrichment — academics, art, music, and Friday Field Days.",
    buttonLabel: "Learn More",
    buttonHref: "/homeschool",
  },
  {
    image: "/assets/Stock11.jpg",
    title: "Our Educational Philosophy",
    description:
      "Montessori, Waldorf, and Reggio Emilia methods woven together with TEKS-aligned academics.",
    buttonLabel: "Our Philosophy",
    buttonHref: "/educational-philosophy",
  },
  {
    image: "/assets/Kid2.jpg",
    title: "Our Story",
    description:
      "Sage Field was born from a belief that children deserve to learn through movement, wonder, and joy.",
    buttonLabel: "Read Our Story",
    buttonHref: "/our-story",
  },
];

// ─── Welcome (app/components/WelcomeSection.tsx) ─────────────────────────────

export const WELCOME = {
  badge: "Welcome",
  heading: "What is Sage Field?",
  body: "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas for children ages 4-11. Sage Field operates as a private microschool, not a child-care or daycare center. We offer small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom through personalised, hands-on learning.",
  cards: [
    {
      title: "Family Partnership",
      description:
        "We stay in close communication with families and invite parents to support the learning journey at home — while Sage Field handles the full in-school program.",
      icon: "🤝",
      image:
        "/assets/highlights/summer_week_three/4591E194-779B-46AC-A893-B9E75B6D64A7.JPG",
    },
    {
      title: "Hands-on Learning",
      description:
        "Hands-on outdoor and movement-based experiences that connect children to the world around them and foster real-world wisdom.",
      icon: "🌿",
      image:
        "/assets/highlights/summer_week_two/3E22E13E-859C-427A-9FA3-73F11B989B65.JPG",
    },
    {
      title: "Small Groups",
      description:
        "Personalized attention in intimate learning environments designed for learning and growth.",
      icon: "👥",
      image:
        "/assets/highlights/summer_week_four/A4107889-4FC8-4F4F-BE2E-5F49868F3AA4 2.JPG",
    },
    {
      title: "Wisdom Focus",
      description:
        "Beyond memorization - transforming knowledge into living wisdom through curiosity, reflection, and experience.",
      icon: "💡",
      image:
        "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
    },
  ],
};

// ─── What We Offer (WhatWeOfferSection, WeeklySchedule, ExploreOurPrograms) ─

export const OFFER = {
  badge: "What We Offer",
  heading: "What We Offer",
  subtitle: "Education Through Connection and Exploration",
  /** Paragraph 1; `highlight` phrases are emphasised in the live design. */
  p1: [
    { text: "Sage Field operates as a private microschool, not a child-care or daycare center. We focus on " },
    { text: "whole-child growth", highlight: true },
    { text: ", " },
    { text: "emotional regulation", highlight: true },
    { text: ", " },
    { text: "social development", highlight: true },
    { text: ", and " },
    { text: "hands-on experiences", highlight: true },
    { text: " that promote creativity and curiosity." },
  ],
  p2: [
    { text: "Our days are designed around " },
    { text: "movement", highlight: true },
    { text: ", " },
    { text: "outdoor exploration", highlight: true },
    { text: ", and " },
    { text: "project-based learning", highlight: true },
    { text: ", with minimal worksheets and a focus on real-world engagement. This structure supports emotional stability and helps children feel confident and connected each day." },
  ],
  schedule: {
    weekdays: "Monday - Thursday",
    blocks: [
      "Core learning & foundational subjects",
      "Enrichment block (STEAM, art, nature studies, movement)",
      "Structured academic support block that provides additional instruction, guided practice, and individualized support",
    ],
    friday: {
      title: "Field Day Friday",
      time: "9-1 pm",
      description: "Every Field Day Friday is an unique, outdoor experience!",
    },
  },
  programsBadge: "Our Programs",
  programsHeading: "Explore Our Programs",
  enrollmentOpen: "Enrollment is now open",
  programs: [
    {
      badge: "School Year",
      title: "School Year 2026–2027",
      dates: "August 17, 2026 – March 2027",
      details: [
        "Ages 4–11",
        "Mon-Thu",
        "6-month commitment",
        "~10 children per class",
        "Field Fridays",
        "Aftercare",
      ],
      description:
        "A full school-year microschool experience blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics.",
      href: "/school-year-2026-2027",
      image: "/assets/ImageTwo.jpg",
      ctaHref: "/apply?tab=school-year",
    },
    {
      badge: "Homeschool",
      title: "Homeschool Drop-In",
      dates: "Available for Both Programs",
      details: [
        "Ages 4–11",
        "1–3 Days/Week",
        "Field Fridays",
        "Flexible Scheduling",
      ],
      description:
        "Flexible drop-in program for homeschool families — choose 1 to 3 days per week with ability-based learning, enrichments, and Friday Field Days.",
      href: "/homeschool",
      image: "/assets/After1.png",
      ctaHref: "/apply?tab=homeschool",
    },
  ],
};

// ─── How We Learn (EducationalPhilosophySection) ─────────────────────────────

export const PHILOSOPHY = {
  badge: "How We Learn",
  heading: "How We Learn",
  subtitle: "Educational Philosophy",
  p1: [
    { text: "Our approach integrates elements of " },
    { text: "Montessori", highlight: true },
    { text: ", " },
    { text: "Waldorf", highlight: true },
    { text: ", and " },
    { text: "Reggio Emilia", highlight: true },
    { text: " methods with " },
    { text: "TEKS-aligned academics", highlight: true },
    { text: ". We enrich learning with social-emotional education, arts, music, and creative problem-solving." },
  ],
  p2: [
    { text: "We value " },
    { text: "emotional regulation", highlight: true },
    { text: ", both for students and educators. A calm, connected teacher creates a community where children thrive." },
  ],
  pillars: [
    {
      icon: "🌱",
      title: "Hands-on Learning",
      image: "/assets/Stock3.jpg",
      description: "Experiential activities that engage curiosity",
    },
    {
      icon: "🧘",
      title: "Emotional Regulation",
      image: "/assets/Stock6.jpg",
      description: "Mindfulness practices for students & educators",
    },
    {
      icon: "🎨",
      title: "Creative Expression",
      image: "/assets/Stock8.jpg",
      description: "Artistic and musical creativity flourish",
    },
    {
      icon: "🌳",
      title: "Movement & Nature",
      image: "/assets/Stock11.jpg",
      description: "Movement-based and outdoor education",
    },
  ],
};

// ─── Community Continuity (ContinuitySection) ────────────────────────────────

export const CONTINUITY = {
  badge: "Community Continuity",
  heading: "Keeping Our Community Together",
  subtitle: "Maintaining Continuity and Stability",
  body: [
    { text: "Sage Field was created to maintain the " },
    { text: "friendships, routines, and environment", highlight: true },
    { text: " that families and children already love. By keeping the same rhythm and structure as their previous school, students experience lower stress, smoother transitions, and greater emotional security." },
  ],
  whyTitle: "Why It Matters",
  why: [
    { lead: "Familiar structure", rest: "= lower cortisol and anxiety" },
    { lead: "Consistent friendships", rest: "= healthy social bonds" },
    { lead: "Trusted educators", rest: "= emotional safety and confidence" },
    { lead: "Same learning flow", rest: "= familiar learning approach" },
  ],
  roots: [
    { icon: "🏫", image: "/assets/Kid1.png", title: "Familiar Structure", description: "Same daily rhythm & routines" },
    { icon: "👥", image: "/assets/Stock4.jpg", title: "Consistent Friendships", description: "Same peer community" },
    { icon: "👨‍🏫", image: "/assets/Stock1.jpg", title: "Trusted Educators", description: "Same caring teachers" },
    { icon: "📚", image: "/assets/Stock2.jpg", title: "Same Learning Flow", description: "Familiar learning approach" },
  ],
  outcomes: [
    "Lower Stress & Anxiety",
    "Healthy Social Bonds",
    "Emotional Safety",
    "Greater Confidence",
  ],
};

// ─── Family Partnership (CoCreationSection) ──────────────────────────────────

export const PARTNERSHIP = {
  badge: "Family Partnership",
  heading: "Learning in Partnership",
  body: "Collecting projects and pieces of work are used to track student growth while nurturing each child's curiosity and confidence.",
  calloutTitle: "At Sage Field, we call our approach Family Partnership.",
  calloutBody:
    "We handle the full in-school program — curriculum, instruction, and daily learning are our responsibility. We do ask that families stay engaged and communicative: share important updates about your child, attend check-ins when scheduled, and support a culture of curiosity at home. Together, we create the conditions for every child to thrive.",
  tiles: ["Track Progress", "Collaborate Daily", "Grow Together"],
  nodes: [
    { id: "school", label: "School", icon: "🏫", description: "Expert Guidance" },
    { id: "student", label: "Student", icon: "🌱", description: "Growth & Curiosity" },
    { id: "family", label: "Family", icon: "🏠", description: "Home Extension" },
  ],
  center: "Partnership",
};

// ─── Tuition (DonationsSection, AfterCareCard, FieldDayFridayCard) ───────────

export type PriceOption = { label: string; price: number; unit: string; note?: string };

export const TUITION = {
  badge: "TUITION",
  heading: "Tuition & Enrollment",
  body: "We offer flexible enrollment options designed to support your family's needs and schedule.",
  full: {
    title: "Full Enrollment",
    image: "/assets/Stock7.jpg",
    schedule: "Monday – Thursday, 9:00am – 3:00pm",
    tiers: [
      { label: "2nd – 4th Grade", price: 1095, unit: "/mo", note: "School year" },
      { label: "Pre-K–1st Grade", price: 1195, unit: "/mo", note: "School year" },
    ],
    feesLabel: "Enrollment fees:",
    fees: "First-time registration $500 · Re-registration $300 · Annual supply fee $300",
    interested: "Interested in joining?",
    enroll: "Enroll Now →",
  },
  aftercare: {
    title: "Extended Learning",
    image: "/assets/Stock5.jpg",
    time: "3:00pm - 5:00pm",
    options: [{ label: "Drop-In", price: 35, unit: "/daily" }] as PriceOption[],
  },
  fieldDay: {
    title: "Field Day Friday",
    image: "/assets/Stock11.jpg",
    time: "9:00am - 1:00pm",
    options: [
      { label: "Package of 4", price: 160, unit: "/month", note: "$40 per session • Expires monthly" },
      { label: "Drop-In", price: 60, unit: "/session" },
    ] as PriceOption[],
  },
  homeschool: {
    badge: "Homeschool Drop-In",
    heading: "Flexible Enrollment Options",
    sub: "Join our community 1-3 days/week",
    bands: ["2nd – 4th Grade", "Pre-K–1st Grade"] as const,
    options: [
      { title: "1 Day / Week", note: "Attend one consistent day each week, paid monthly", prices: [440, 480] },
      { title: "2-Day/Week", prices: [600, 640] },
      { title: "3-Day/Week", prices: [850, 920] },
    ] as { title: string; note?: string; prices: [number, number] }[],
    getStarted: "Get Started",
    learnMore: "Learn More",
  },
};

// ─── Team (MeetTheTeamSection) ───────────────────────────────────────────────

export const TEAM = {
  badge: "The Team",
  heading: "Meet the Team",
  callout:
    "Together, we bring warmth, creativity, and experience to every student's learning experience. We are committed to continuing the supportive atmosphere families have come to trust.",
  lead: {
    name: "Sabrina Grace Obnamia",
    role: "Lead Teacher & Director",
    image: "/assets/team/sabrina.jpg",
    description:
      "Ms. Sabrina brings a wealth of experience to Sage Field. She holds a Bachelor's degree in Elementary Education with a concentration in Early Childhood Development from Biola University and a Teaching Credential. Her background includes working with children in a wide range of roles both in the U.S. and internationally—spanning special education, preschool, homeschooling, tutoring, coaching, traditional schooling, nature school guide, and more. She values movement, outdoor learning, and most importantly, the joy of slowing down to be present, intentional, and thankful.",
  } satisfies TeamMember,
  members: [
    {
      name: "Joy Paige",
      role: "Primary Lead Teacher",
      image: "/assets/team/Joy (1).png",
      description:
        "Ms. Joy is a passionate early childhood educator with experience in a Reggio Emilia-inspired microschool, where she worked closely with children through hands-on learning experiences in gardening, engineering, art, literacy, and science. She is dedicated to creating environments where children feel confident, curious, and empowered to take ownership of their learning. With a degree in Religious Studies from The University of Texas at El Paso, Ms. Joy brings a love of storytelling, history, and meaningful connections into the classroom.",
    },
    {
      name: "Zelinda Melo",
      role: "Lower Elementary Teacher",
      image: "/assets/team/Zelinda2.JPG",
      description:
        "Hello, Sage Field families!! My name is Zelinda and I am so excited to be a part of this incredible team. I have a deep love for children and a heart for nurturing their growth in a safe and encouraging environment. I look forward to supporting each child's learning journey and being a positive presence in their day.",
    },
    {
      name: "Edith DeLuna",
      role: "Primary and Lower Elementary Teacher Aide",
      image: "/assets/team/Edith.jpg",
      description:
        "Edith has been working with children from a young age and has experience with both nannying and working in schools. She has been especially influenced by the Montessori method, which focuses on independence, curiosity, and hands-on learning. Her goal is to help each child build confidence, discover their strengths, and become more independent in a caring environment. Edith also loves spending time outdoors and enjoys making learning fun, meaningful, and engaging for children.",
    },
    {
      name: "Craig Wilkerson",
      role: "Music Teacher",
      image: "/assets/team/Craig Wilkerson.JPG",
      description:
        "Craig Wilkerson is a singer-songwriter, music educator, husband, and father. He joins Sage Field as our music teacher for students ages 4–11, bringing experience as a pre-K music instructor alongside his work in administrative management and human resources at Opus One Music. His background in teaching and songwriting adds to Sage Field's emphasis on creative expression and hands-on learning.",
    },
    {
      name: "Julius Cecilia",
      role: "Director of Operations & Technology",
      image: "/assets/team/Julius.jpg",
      description:
        "Julius Cecilia, a University of Washington graduate, is a software engineer and startup builder with experience across early-stage startups and established tech companies like Adobe. He previously co-founded a sports social platform and continues to build software at the intersection of technology and schools.",
    },
  ] satisfies TeamMember[],
};

// ─── Enrollment CTA (EnrollmentCTASection) ───────────────────────────────────

export const ENROLL = {
  badge: "Enrollment Open",
  heading: "Enrollment is Now Open!",
  body: "Join our community and give your child the gift of hands-on, wisdom-focused learning in a nurturing environment. We're excited to welcome new families to Sage Field.",
};

// ─── Tour / Shadow Day / Highlights / Blog (inline in app/page.tsx) ──────────

export const TOUR = {
  badge: "Private Tours",
  heading: "See Where Your Child Will Thrive",
  body: "Come walk our outdoor campus, meet Ms. Sabrina, and feel the Sage Field difference for yourself. Private, personal, and 100% free.",
  chips: ["Private Tour", "~45 Minutes", "Mon – Sat", "100% Free"] as const,
  cta: "Schedule a Free Tour →",
  href: "/tour",
  image: "/assets/Stock3.jpg",
  host: {
    name: "Ms. Sabrina",
    role: "Lead Teacher & Director",
    image: "/assets/team/sabrina.jpg",
    tag: "Your Host",
  },
};

export const SHADOW = {
  badge: "Shadow Day · $20",
  heading: "Let Your Child Live a Day Here",
  body: "A full school day at Sage Field — real lessons, real outdoor time, real lunch with classmates. Not a tour. An experience.",
  items: [
    { emoji: "🕗", label: "Full School Day", desc: "9:00 AM – 3:00 PM, Monday through Thursday" },
    { emoji: "👧", label: "Ages 4–11", desc: "Mixed-age groups, individualized learning pace" },
    { emoji: "💰", label: "$20 Shadow Day Fee", desc: "Holds your child's spot for the day" },
    { emoji: "🌿", label: "Real Learning", desc: "Academics, outdoor time, cooking, and community" },
  ],
  cta: "Book a Shadow Day — $20 →",
  href: "/shadow",
};

export const HIGHLIGHTS = {
  badge: "Highlights",
  heading: "See What Kids Are Doing Here",
  body: "Weekly recaps from our school year and summer programs — photos, lessons, and memories from life at Sage Field.",
  schoolYear: { title: "School Year 2026–27", sub: "Weekly recaps from our school year program." },
  summer: { title: "Summer 2026", sub: "Weekly recaps from our summer program." },
  cta: "See All Highlights →",
  href: "/highlights",
};

export const BLOG = {
  badge: "From the Blog",
  heading: "Thoughts from Sage Field",
  body: "We write about child-led learning, outdoor education, family partnership, and what it really looks like to raise curious, confident kids. New posts added regularly by Ms. Sabrina and the team.",
  topics: ["Outdoor Learning", "Phonics & Reading", "Parenting Insights", "What We're Building"],
  cta: "Read the Blog →",
  href: "/blog",
  fallback: {
    author: "Ms. Sabrina",
    meta: " · Round Rock, TX",
    title: "Why Small Class Sizes Change Everything",
    excerpt:
      "When a teacher knows every child's name, learning style, and what lights them up — something shifts. Here's what 10 students per class looks like in practice at Sage Field...",
  },
  placeholderLabel: "Sage Field Blog",
  readOn: "Read on the blog →",
};

// ─── Social (SocialMediaSection) ─────────────────────────────────────────────

export const SOCIAL = {
  badge: "Follow Us",
  heading: "Follow Us on Social Media",
  body: "Join our community and stay connected! Follow us to see behind-the-scenes moments, educational insights, and the joyful learning experiences at Sage Field.",
  instagram: "https://www.instagram.com/sagefield.co",
  facebook: "https://www.facebook.com/sagefield.co",
};

// ─── Contact (ContactUsSection) ──────────────────────────────────────────────

export const CONTACT = {
  badge: "Contact",
  heading: "Get in Touch",
  body: "Have questions or want to learn more about Sage Field? Reach out anytime — we'd love to connect with you and your family.",
  button: "Contact Us",
  email: "sabrina@sagefield.co",
  phoneDisplay: "(512) 677-5872",
  phoneHref: "tel:+15126775872",
  address: "2760 Gattis School Rd, Round Rock, TX 78664",
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=2760+Gattis+School+Rd,+Round+Rock,+TX+78664",
  moreInfo: "For more information, please email us at",
};

// ─── FAQ (inline in app/page.tsx) ────────────────────────────────────────────

export const FAQ_HEADER = {
  badge: "FAQ",
  heading: "Frequently Asked Questions",
  sub: "Find answers to common questions about Sage Field",
  searchPlaceholder: "Search FAQs...",
};

/** The last answer contains the Enroll Now button, so the caller passes its renderer. */
export function buildFaqs(renderEnroll: () => ReactNode): FaqGroup[] {
  return [
    {
      title: "About Sage Field & Our Approach",
      items: [
        {
          question: "What is Sage Field?",
          answer:
            "Sage Field Private Microschool is an outdoor-focused private microschool in Round Rock, Texas. Sage Field operates as a private microschool, not a child-care or daycare center. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
        },
        {
          question: "Are you a school? Will Sage Field keep grades or transcripts?",
          answer:
            "Yes — Sage Field Private Microschool is a private microschool operating under Texas private school law. We are not a traditional accredited school and do not issue grades, report cards, or transcripts in the conventional sense. Instead, we provide descriptive, portfolio-based feedback on each child's growth and progress. We handle the in-school program; families manage any additional records they personally wish to keep.",
        },
        {
          question: "What is a microschool?",
          answer:
            "A microschool is a small, independent private school — typically serving no more than 10-12 students per class — that offers a more personalized, flexible alternative to traditional schooling. Microschools prioritize small class sizes, individualized pacing, and innovative approaches to learning.",
        },
        {
          question: "What is the Family Partnership model?",
          answer:
            "At Sage Field, we believe the best outcomes happen when school and family are aligned. Our Family Partnership model means we stay in close communication with parents about their child's strengths, needs, and growth — and we invite families to extend the curiosity and reflection we spark at school into everyday life at home. Parents are not expected to run the curriculum; that's our job. But we do ask that families stay engaged, communicative, and supportive of the learning journey,",
        },
        {
          question: "What does 'Wisdom vs. Knowledge' mean at Sage Field?",
          answer:
            "The name Sage Field carries two meanings. Sage represents wisdom — the kind of understanding that comes from curiosity, reflection, and experience. Field reminds us of the open ground where growth happens — a place to plant, tend, and harvest the potential in every child. We see children as seeds of endless possibility. Knowledge is the starting point, but wisdom is what transforms learning into living — helping children connect ideas to real experiences, build empathy, and make thoughtful choices. In this shared garden of growth, every child has the chance to blossom into their fullest, wisest self.",
        },
      ],
    },
    {
      title: "Program Details",
      items: [
        {
          question: "What ages do you serve and how big are the groups?",
          answer:
            "We serve children ages 4-11, with flexibility based on developmental fit. Students learn together in mixed-age groups so children can move at their own pace. We intentionally keep our groups small — typically no more than 10–12 children per class — so that our adults can stay closely attuned to each child's needs.",
        },
        {
          question: "What does a typical day at Sage Field look like?",
          answer:
            "Our days are designed to feel calm, connected, and alive with curiosity. Mornings are for focused academics in reading, writing, fluency, and math, individualized to each child's abilities rather than a grade label. Afternoons flow into nature exploration, science, art, movement, sports-like games, and social-emotional learning. We prioritize real-world, hands-on experiences, movement, and time outdoors over worksheets and repetition.  Sage Field operates as a private microschool, not a child-care or daycare center.",
        },
        {
          question: "What subjects does Sage Field teach?",
          answer:
            "Our school provides a comprehensive, bona fide education centered on a rigorous core curriculum that includes reading, spelling, grammar, mathematics, and good citizenship. We complement these foundations with nature study, art, music, movement, and social-emotional learning, drawing from Montessori, Waldorf, and Reggio-inspired approaches with broadly TEKS-aligned academics. We operate as an academic institution rather than a child care center, featuring structured, teacher-led instruction, formal attendance tracking, and consistent learning objectives for every student. Because we are a full drop-off school, families do not need to supplement our academic program at home unless they choose to. By prioritizing a set academic scope and sequence, we ensure that our students receive a formal education in a focused, classroom-based environment.",
        },
      ],
    },
    {
      title: "Supporting All Learners",
      items: [
        {
          question: "Do you support neurodivergent or high-sensitivity children?",
          answer:
            "We intentionally create a gentle, regulated environment that works well for many neurodivergent and outside-the-box thinkers. We focus on emotional regulation, clear rhythms, and relationship-based support. At the same time, we are not a therapeutic program or medical provider, and we cannot safely accommodate all needs (such as ongoing elopement/running away, significant medical fragility, or violent outbursts). In some situations, we may require a 1:1 aide provided by the family or may determine that Sage Field is not an appropriate fit to keep everyone safe.",
        },
        {
          question: "What is your approach to play, safety, and behavior?",
          answer:
            "We believe children grow when they're trusted to 'try risky things safely' with strong boundaries and supervision. We teach children to notice their bodies, respect their own limits, and consider others' safety. When behavior challenges arise, we prioritize regulation, connection, and collaborative problem-solving, but we also have clear lines: if a child's behavior repeatedly endangers themselves, others, or the environment (for example, serious aggression or ongoing unsafe actions), we issue a formal written warning and, if necessary, end enrollment to protect the community.",
        },
        {
          question: "Do you provide food, medications, or transportation?",
          answer:
            "Families send all snacks and lunches from home, and children do not share food except with siblings/household members. For health and allergy safety, we do not allow routine or over-the-counter medications at Sage Field, and staff do not administer them. The only exception is life-saving emergency medications (such as EpiPens or rescue inhalers) that parents provide and document; staff may assist in good faith during emergencies. We do not provide vehicle transportation. Any off-site experiences are limited to supervised walking field trips in the surrounding area, with prior parent consent.",
        },
      ],
    },
    {
      title: "Enrollment & Parent Partnership",
      items: [
        {
          question: "How does enrollment work and what is the financial commitment?",
          answer:
            "Families start by completing an application and connecting with us to ensure a good mutual fit. If we offer a place, enrollment is finalized when you: Sign our Enrollment Agreement (including a six-month commitment), Sign our risk, medical, and media forms, and Pay the non-refundable registration/materials fee. Because we keep groups small and hold a space for your child, tuition is committed for the six-month term, with limited, clearly stated exceptions.",
        },
        {
          question: "What role do parents play?",
          answer:
            "Sage Field handles the in-school program and we ask that families stay engaged and communicative: share important updates about your child, attend check-ins when scheduled, and support a culture of curiosity and reflection at home. We see parents as partners in their child's growth, not as co-teachers.",
        },
        {
          question: "How do we enroll?",
          answer: (
            <div>
              <p className="mb-4">
                Enrollment for Summer 2026 and School Year 2026-2027 is now open.
                Complete our interest form to begin the enrollment process.
              </p>
              {renderEnroll()}
            </div>
          ),
        },
      ],
    },
  ];
}

// ─── Photo pool (from app/gallery/page.tsx) ──────────────────────────────────

const sy = (week: string, files: string[]) =>
  files.map((f) => `/assets/highlights/school_week_${week}/${f}`);
const su = (week: string, files: string[]) =>
  files.map((f) => `/assets/highlights/summer_week_${week}/${f}`);

/** Curated real photos from school-year and summer weeks, used for collages and marquees. */
export const PHOTO_POOL: string[] = [
  ...sy("eleven", [
    "CFCC1BF1-A38B-494A-A5CC-EEFB52A70DCF.JPG",
    "A27CDDBC-D55F-4D28-B423-25A007194873.JPG",
    "84536C72-8BDE-4317-BC8D-DBF847371B06.JPG",
    "4730BACD-4FC9-43B0-91CB-9B8B291DA3EF.JPG",
  ]),
  ...sy("ten", [
    "2157652A-3FA6-4458-BD7C-E93F888BBA15 2.JPG",
    "4FBDDB9F-3CD9-4CDC-BE85-5747C8565143 2.JPG",
    "738F9C06-0FA2-4123-84DB-F02E783177C6 2.JPG",
  ]),
  ...sy("nine", [
    "1DF11F47-FF45-4C6C-ACBF-8FA1737F6448.JPG",
    "5AFDF08A-7240-47DD-B624-BB700019463A.JPG",
    "A8D2814B-BFF0-4078-ADB0-1269ACDB72B5.JPG",
  ]),
  ...sy("eight", [
    "12BA5C32-5A55-4546-9780-936ADFE81CD4.JPG",
    "3CFF9370-8290-47DA-AB68-AAE4C80DEDD4.JPG",
    "8617B92B-591B-410F-B3A0-E2767B7458B5.JPG",
  ]),
  ...sy("seven", [
    "1F6F0AAF-B89B-485C-AB7C-A2D3E48794DE.JPG",
    "6D7CCB1F-18C9-446A-A6BB-F6DF846AC750.JPG",
    "99590ABC-F1B4-4EE0-8C9F-D89FA69A067A.JPG",
  ]),
  ...sy("six", [
    "1D7D6AFE-DC1B-47A9-A062-263F421B93DC.JPG",
    "56E3D25A-E7EB-4736-9481-33A016535AB4.JPG",
    "A61A1CA3-C251-4DE9-9E1A-99B025791D3A.JPG",
  ]),
  ...sy("five", [
    "4182F696-085D-47CB-9021-8F8F5DC1BD9D.JPG",
    "96D93AFA-3B3B-4959-A75F-DD9624B41C29.JPG",
  ]),
  ...sy("four", [
    "189F9697-2F44-41CB-BF88-F45CFBDCD90A.JPG",
    "9A368F27-0C4F-4DD7-995B-98CC5DB2BE52.JPG",
  ]),
  ...sy("three", [
    "43D4D8D3-74AA-44FF-9ACE-AAE5200B488D.JPG",
    "929BF89E-E892-4CBA-BED0-15E615073B7C.JPG",
  ]),
  ...sy("two", [
    "21B55D40-53C5-4106-99A1-8E71CA1B6875.JPG",
    "80E5673A-9F91-449A-900C-4D3A86B7B4E7.JPG",
  ]),
  ...su("twelve", ["44B158CD-2668-4877-85F0-A45D4F56F958.JPG", "9CB7AFC5-A7A7-49C1-8417-5C17358D88AF.JPG"]),
  ...su("eleven", ["19757EE4-381F-4ADD-B6D5-1735915562F8.JPG", "7892E368-C227-4499-B5FD-0E6CEBAAE5FD.JPG"]),
  ...su("six", ["1D47ADF7-BFF8-4E74-8A51-E0444E1E5AB2.JPG", "6ED6BA87-AB2C-42FA-97F4-57719463AB1A.JPG"]),
  ...su("five", ["39A6CEAD-799A-4EC3-8F59-D95B4C419D9B.JPG", "7C6EB16F-E2C4-4E57-AD15-CCE8220ADEA6.JPG"]),
  ...su("four", ["27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG", "896A997D-C5D1-4443-9FAA-807FE4D6E7C4.JPG"]),
  ...su("two", ["2B58FEC3-CD58-40D9-93C5-A83D7DBB5A21.JPG", "9AF86705-559C-4F6C-ADC9-4F144413EC9C.JPG"]),
  ...su("one", ["2DE620A5-86E3-4A0D-8579-721D97615159.JPG", "C7665CCD-EB43-429C-AB7F-BA19FF9AE4A6.JPG"]),
];
