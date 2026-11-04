"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EnrollmentCTASection from "../components/EnrollmentCTASection";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ContactDialog = dynamic(() => import("../components/ContactDialog"), {
  ssr: false,
});
import FloatingSMSButton from "../components/FloatingSMSButton";
import MeetTheTeamSection from "../components/MeetTheTeamSection";
import WeeklySchedule from "../components/WeeklySchedule";
import FAQAccordion from "../components/FAQAccordion";
import WeekRecapPreview from "../components/WeekRecapPreview";

type Tab = "school-year" | "homeschool";

const scheduleTiers = [
  {
    days: "1x/week",
    title: "Light Touch",
    description:
      "Perfect for families who want a taste of microschool enrichment without disrupting your home rhythm.",
  },
  {
    days: "2x/week",
    title: "Balanced Rhythm",
    description:
      "Two structured days create a consistent routine while leaving plenty of flexibility for family-led learning.",
  },
  {
    days: "3x/week",
    title: "Regular Learner",
    description:
      "Three days offers deep engagement with academics, enrichments, and peer connection each week.",
  },
  {
    days: "4x/week",
    title: "Deep Immersion",
    description:
      "Near-full-week immersion with the freedom and control of homeschooling still fully intact.",
  },
  {
    days: "5x/week",
    title: "Full Experience",
    description:
      "The complete Sage Field experience — every day, every enrichment, including Friday Field Days.",
  },
];

const homeschoolPillars = [
  {
    icon: "🎯",
    title: "Ability-Based Learning",
    description:
      "We group by ability and interest, not grade. Each child progresses at their own pace.",
  },
  {
    icon: "👥",
    title: "Tiny Class Sizes",
    description:
      "With ~10 kids per class, every child gets real attention and a genuine community.",
  },
  {
    icon: "🌱",
    title: "Interest-Led Academics",
    description:
      "Curiosity drives the curriculum. Kids learn more when they care about the subject.",
  },
  {
    icon: "🤝",
    title: "Real Socialization",
    description:
      "Mixed-age groups and collaborative projects build authentic friendships and social skills.",
  },
];

const tabContent = {
  "school-year": {
    badge: "School Year 2026",
    title: "School Year 2026–2027",
    description: [
      "The School Year 2026–2027 program runs as a six-month commitment, offering up to four days per week of enriched learning for children ages 4-11. Students receive individualized support in literacy and numeracy alongside science, art, movement, and social-emotional learning.",
      "Enrollment is limited to preserve the small-group environment that makes Sage Field special. Families begin with an application and a mutual-fit conversation to ensure the program is the right match for your child.",
    ],
    details: [
      { label: "Start Date", value: "August 17, 2026" },
      { label: "Ages", value: "4-11 years" },
      { label: "Schedule", value: "Up to 4 days/week" },
      { label: "Term", value: "6-month commitment" },
    ],
    images: [
      "/assets/Stock1.jpg",
      "/assets/Kid1.png",
      "/assets/Kid2.jpg",
      // "/assets/Stock2.jpg",
      "/assets/Stock3.jpg",
      "/assets/Stock4.jpg",
      "/assets/Stock5.jpg",
      "/assets/Stock6.jpg",
      "/assets/Stock7.jpg",
      "/assets/Stock8.jpg",
      "/assets/Stock9.jpg",
      "/assets/Stock10.jpg",
      "/assets/Stock11.jpg",
    ],
  },
  homeschool: {
    badge: "Homeschool Drop-In",
    title: "Homeschool Drop-In Program",
    description: [
      "Sage Field's Homeschool Drop-In Program is built for families who want flexible, enriching academic support without a long-term commitment. Choose 1 to 3 days per week — and adjust as your family's schedule evolves.",
      "Unlike traditional schools that group children by grade, Sage Field uses ability-based and interest-led grouping. Every child gets individualized academic support in literacy and numeracy — exactly where they are, not where their birthday says they should be.",
    ],
    details: [
      { label: "Schedule", value: "1–3 Days/Week" },
      { label: "Ages", value: "4–11 Years" },
      { label: "Fridays", value: "Field Days" },
      { label: "Class Size", value: "~10 Kids" },
    ],
    images: [
      "/assets/Stock1.jpg",
      "/assets/Kid1.png",
      "/assets/Kid2.jpg",
      // "/assets/Stock2.jpg",
      "/assets/Stock3.jpg",
      "/assets/Stock4.jpg",
      "/assets/Stock5.jpg",
      "/assets/Stock6.jpg",
      "/assets/Stock7.jpg",
      "/assets/Stock8.jpg",
      "/assets/Stock9.jpg",
      "/assets/Stock10.jpg",
      "/assets/Stock11.jpg",
    ],
  },
};

const aboutSageFieldFAQs = [
  {
    question: "What is Sage Field?",
    answer:
      "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. Sage Field operates as a private microschool, not a child-care or daycare center. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
  },
  {
    question: "Are you a school? Will Sage Field keep grades or transcripts?",
    answer:
      "Yes — Sage Field Private School is a private microschool operating under Texas private school law. We are not a traditional accredited school and do not issue grades, report cards, or transcripts in the conventional sense. Instead, we provide descriptive, portfolio-based feedback on each child's growth and progress. We handle the in-school program; families manage any additional records they personally wish to keep.",
  },
  {
    question: "What is a microschool?",
    answer:
      "A microschool is a small, independent private school — typically serving no more than 10 - 12 students per class — that offers a more personalized, flexible alternative to traditional schooling. Microschools prioritize small class sizes, individualized pacing, and innovative approaches to learning.",
  },
  {
    question: "What is the Family Partnership model?",
    answer:
      "At Sage Field, we believe the best outcomes happen when school and family are aligned. Our Family Partnership model means we stay in close communication with parents about their child's strengths, needs, and growth — and we invite families to extend the curiosity and reflection we spark at school into everyday life at home. Parents are not expected to run the curriculum; that's our job. But we do ask that families stay engaged, communicative, and supportive of the learning journey.",
  },
  {
    question: "What does 'Wisdom vs. Knowledge' mean at Sage Field?",
    answer:
      "The name Sage Field carries two meanings. Sage represents wisdom — the kind of understanding that comes from curiosity, reflection, and experience. Field reminds us of the open ground where growth happens — a place to plant, tend, and harvest the potential in every child. We see children as seeds of endless possibility. Knowledge is the starting point, but wisdom is what transforms learning into living — helping children connect ideas to real experiences, build empathy, and make thoughtful choices. In this shared garden of growth, every child has the chance to blossom into their fullest, wisest self.",
  },
];

const programDetailsFAQs = [
  {
    question: "What ages do you serve and how big are the groups?",
    answer:
      "We serve ages 4-11, with flexibility based on developmental fit. Students learn together in mixed-age groups so children can move at their own pace. We intentionally keep our groups small — typically no more than 10–12 children per class — so that our adults can stay closely attuned to each child's needs.",
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
];

const supportingLearnersFAQs = [
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
];

function InterestPageContent() {
  const scrollToInterestForm = () => {
    document.getElementById("interest-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const enrollmentFAQs = [
    {
      question:
        "How does enrollment work and what is the financial commitment?",
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
            Enrollment for School Year 2026-2027 is now open.
            Complete our interest form to begin the enrollment process.
          </p>
          <button
            onClick={scrollToInterestForm}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
          >
            Submit Interest Form
          </button>
        </div>
      ),
    },
  ];
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab = (
    ["school-year", "homeschool"] as Tab[]
  ).includes(tabParam as Tab)
    ? (tabParam as Tab)
    : "school-year";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [descExpanded, setDescExpanded] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const router = useRouter();

  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;

    let pos = el.scrollLeft;
    const tick = () => {
      if (!isPausedRef.current && el) {
        pos += 0.5;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeTab]);


  const handleGalleryInteractionStart = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleGalleryInteractionEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2500);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setDescExpanded(false);
  };

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      <div id="interest-form" className="pt-20 sm:pt-28 scroll-mt-24 sm:scroll-mt-32">
        <EnrollmentCTASection />
      </div>

      {/* Mobile hero gallery — above program content */}
      <div className="sm:hidden">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onTouchStart={handleGalleryInteractionStart}
          onTouchEnd={handleGalleryInteractionEnd}
          onMouseDown={handleGalleryInteractionStart}
          onMouseUp={handleGalleryInteractionEnd}
        >
          {[
            ...tabContent[activeTab].images,
            ...tabContent[activeTab].images,
          ].map((src, i) => (
            <div
              key={i}
              className="relative w-[88%] flex-shrink-0 aspect-square overflow-hidden"
            >
              <Image
                src={src}
                alt="Program photo"
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Content Section */}
      <section className="pb-16 pt-6 sm:pt-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
            >
              {/* LEFT COLUMN — content */}
              <div className="lg:col-span-7">
                {/* Tab Switcher */}
                <div className="flex gap-3 mb-6 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:flex-wrap">
                  {(["school-year", "homeschool"] as Tab[]).map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`flex-shrink-0 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-full font-semibold font-body transition-all duration-200 cursor-pointer ${
                          activeTab === tab
                            ? "bg-primary text-white shadow-md"
                            : "border-2 border-gray-300 text-gray-600 bg-white hover:border-primary"
                        }`}
                      >
                        {tab === "school-year"
                          ? "📚 School Year 2026"
                          : "🏡 Homeschool Drop-In"}
                      </button>
                    ),
                  )}
                </div>

                {/* Program Title */}
                <h2 className="text-3xl md:text-4xl font-bold mb-8 font-heading text-gray-800">
                  {tabContent[activeTab].title}
                </h2>

                {/* Description */}
                <div className="space-y-4 mb-10">
                  {tabContent[activeTab].description.map((para, i) => (
                    <p
                      key={i}
                      className={`text-lg text-gray-600 font-body leading-relaxed ${
                        i > 0
                          ? descExpanded
                            ? "block"
                            : "hidden sm:block"
                          : ""
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                  {tabContent[activeTab].description.length > 1 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="sm:hidden text-sm font-semibold text-primary font-body hover:underline cursor-pointer"
                    >
                      {descExpanded ? "Read less ↑" : "Read more ↓"}
                    </button>
                  )}
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                  {tabContent[activeTab].details.map((detail) => (
                    <div
                      key={detail.label}
                      className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100"
                    >
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 font-body">
                        {detail.label}
                      </p>
                      <p className="text-sm font-bold text-gray-800 font-body">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Image Gallery — desktop only (mobile version is above the heading) */}
                <div className="hidden sm:block mb-10">
                  <div className="sm:overflow-visible sm:grid sm:grid-cols-2 sm:gap-3">
                    {tabContent[activeTab].images.map((src, i) => (
                      <div
                        key={i}
                        className="relative sm:w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md"
                      >
                        <Image
                          src={src}
                          alt="Program photo"
                          fill
                          className="object-cover hover:scale-[1.02] transition-transform duration-500"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Educational Philosophy — School Year */}
                {activeTab === "school-year" && (
                  <motion.div
                    className="border-t border-gray-100 pt-10 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" as const }}
                  >
                    {/* Badge */}
                    <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                      How We Learn
                    </span>

                    {/* Heading */}
                    <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
                      How We Learn
                    </h2>

                    {/* Subtitle */}
                    <p className="text-lg font-semibold text-primary font-heading mb-6">
                      Educational Philosophy
                    </p>

                    {/* Paragraphs */}
                    <p className="text-base text-text-gray mb-4 leading-relaxed font-body">
                      Our approach integrates elements of{" "}
                      <span className="text-primary font-semibold">
                        Montessori
                      </span>
                      ,{" "}
                      <span className="text-primary font-semibold">
                        Waldorf
                      </span>
                      , and{" "}
                      <span className="text-primary font-semibold">
                        Reggio Emilia
                      </span>{" "}
                      methods with{" "}
                      <span className="text-primary font-semibold">
                        TEKS-aligned academics
                      </span>
                      . We enrich learning with social-emotional education,
                      arts, music, and creative problem-solving.
                    </p>

                    <p className="text-base text-text-gray mb-6 leading-relaxed font-body">
                      We value{" "}
                      <span className="text-primary font-semibold">
                        emotional regulation
                      </span>
                      , both for students and educators. A calm, connected
                      teacher creates a community where children thrive.
                    </p>

                    {/* Key Pillars Callout */}
                    <div className="mb-8 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <h3 className="text-base font-semibold text-black mb-3 font-heading">
                        Our Key Pillars
                      </h3>
                      <ul className="space-y-2 text-sm text-text-gray font-body">
                        {[
                          "Hands-on, experiential learning",
                          "Emotional regulation & mindfulness practices",
                          "Artistic and musical creativity",
                          "Movement-based and outdoor education",
                        ].map((item) => (
                          <li key={item} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pillar Cards 2×2 */}
                    <div className="overflow-x-auto flex snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:overflow-visible sm:grid sm:grid-cols-2">
                      {[
                        {
                          title: "Hands-on Learning",
                          image: "/assets/Stock3.jpg",
                          description:
                            "Experiential activities that engage curiosity",
                        },
                        {
                          title: "Emotional Regulation",
                          image: "/assets/Stock6.jpg",
                          description:
                            "Mindfulness practices for students & educators",
                        },
                        {
                          title: "Creative Expression",
                          image: "/assets/Stock8.jpg",
                          description:
                            "Artistic and musical creativity flourish",
                        },
                        {
                          title: "Movement & Nature",
                          image: "/assets/Stock11.jpg",
                          description: "Movement-based and outdoor education",
                        },
                      ].map((pillar, index) => (
                        <motion.div
                          key={index}
                          className="w-[80%] flex-shrink-0 snap-start sm:w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: 0.1 + index * 0.1,
                            ease: "easeOut" as const,
                          }}
                        >
                          <div className="relative w-full h-40 rounded-t-lg overflow-hidden">
                            <Image
                              src={pillar.image}
                              alt={pillar.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-5">
                            <h3 className="text-base font-semibold text-black mb-1 font-heading">
                              {pillar.title}
                            </h3>
                            <p className="text-sm text-text-gray font-body">
                              {pillar.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* What We Offer — School Year only */}
                {activeTab === "school-year" && (
                  <motion.div
                    className="border-t border-gray-100 pt-10 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" as const }}
                  >
                    <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                      What We Offer
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
                      What We Offer
                    </h2>
                    <p className="text-lg font-semibold text-primary font-heading mb-6">
                      Education Through Connection and Exploration
                    </p>
                    <p className="text-base text-text-gray mb-4 leading-relaxed font-body">
                      Sage Field operates as a private microschool, not a child-care or
                      daycare center. We focus on{" "}
                      <span className="text-primary font-semibold">whole-child growth</span>
                      ,{" "}
                      <span className="text-primary font-semibold">emotional regulation</span>
                      ,{" "}
                      <span className="text-primary font-semibold">social development</span>
                      , and{" "}
                      <span className="text-primary font-semibold">hands-on experiences</span>{" "}
                      that promote creativity and curiosity.
                    </p>
                    <p className="text-base text-text-gray mb-8 leading-relaxed font-body">
                      Our days are designed around{" "}
                      <span className="text-primary font-semibold">movement</span>,{" "}
                      <span className="text-primary font-semibold">outdoor exploration</span>
                      , and{" "}
                      <span className="text-primary font-semibold">project-based learning</span>
                      , with minimal worksheets and a focus on real-world engagement.
                      This structure supports emotional stability and helps children
                      feel confident and connected each day.
                    </p>
                    <WeeklySchedule />
                  </motion.div>
                )}

                {/* Meet the Team — School Year only */}
                {activeTab === "school-year" && (
                  <div className="-mx-8 sm:-mx-12 lg:-mx-16 mb-10">
                    <MeetTheTeamSection
                      featured={false}
                      exclude={["Nicole Elias", "Taylor Elias"]}
                    />
                  </div>
                )}

                {/* Homeschool-specific content */}
                {activeTab === "homeschool" && (
                  <motion.div
                    className="mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" as const }}
                  >
                    {/* Flexible Scheduling */}
                    <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                      Flexible Scheduling
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
                      Choose Your Schedule
                    </h2>
                    <p className="text-lg font-semibold text-primary font-heading mb-8">
                      From one day a week to three — you decide
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
                      {scheduleTiers.slice(0, 3).map((tier, index) => (
                        <motion.div
                          key={index}
                          className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: 0.1 + index * 0.1,
                            ease: "easeOut" as const,
                          }}
                        >
                          <div className="inline-block px-3 py-1 bg-primary/10 rounded-full mb-3">
                            <span className="text-xs font-bold text-primary font-body">
                              {tier.days}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-black mb-1 font-heading">
                            {tier.title}
                          </h3>
                          <p className="text-sm text-text-gray font-body">
                            {tier.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Friday Field Days */}
                    <div className="text-center mb-14">
                      <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4">
                        Every Friday
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4">
                        <span className="text-primary">Field Day</span> Fridays
                      </h2>
                      <p className="text-gray-500 font-body text-base mb-8 max-w-xl mx-auto">
                        Every Friday is a unique, themed adventure — included
                        for all families who attend on Fridays. No two Fridays
                        are ever the same.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {[
                          { emoji: "🌿", label: "Outdoor & Nature" },
                          { emoji: "🎉", label: "Unique Every Friday" },
                          { emoji: "🧒", label: "All Ages Welcome" },
                          { emoji: "🎨", label: "Themed Adventures" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full"
                          >
                            <span>{item.emoji}</span>
                            <span className="text-sm font-semibold text-primary font-body">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Why Microschool Pillars */}
                    <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                      Why Sage Field?
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
                      Why Microschool for Homeschoolers?
                    </h2>
                    <p className="text-lg font-semibold text-primary font-heading mb-6">
                      The best of both worlds
                    </p>
                    <p className="text-base text-text-gray mb-8 leading-relaxed font-body">
                      Sage Field is a microschool built specifically for
                      flexibility. With tiny class sizes and a family-centered
                      approach, you get the structure and socialization of
                      school — while your family keeps full control of the
                      learning journey.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                      {homeschoolPillars.map((pillar, index) => (
                        <motion.div
                          key={index}
                          className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: 0.1 + index * 0.1,
                            ease: "easeOut" as const,
                          }}
                        >
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors duration-200">
                            <span className="text-2xl">{pillar.icon}</span>
                          </div>
                          <h3 className="text-base font-semibold text-black mb-1 font-heading">
                            {pillar.title}
                          </h3>
                          <p className="text-sm text-text-gray font-body">
                            {pillar.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Meet the Team */}
                    <div className="-mx-8 sm:-mx-12 lg:-mx-16">
                      <MeetTheTeamSection featured={false} />
                    </div>
                  </motion.div>
                )}

              </div>

              {/* RIGHT COLUMN — sticky CTA */}
              <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-28">
                {/* CTA Card */}
                <div className="mt-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-xl text-gray-800 mb-2">
                    Interested in Sage Field?
                  </h3>
                  <p className="text-gray-500 font-body text-sm mb-4">
                    Spots are limited — share your interest and we&apos;ll be in
                    touch soon.
                  </p>
                  <button
                    onClick={scrollToInterestForm}
                    className="hidden lg:block w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
                  >
                    Submit Interest Form
                  </button>
                  <button
                    onClick={() => router.push("/tour")}
                    className="hidden lg:block w-full mt-3 px-8 py-3 border-2 border-gray-200 text-gray-600 font-semibold text-sm rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
                  >
                    🏡 Tour the campus first
                  </button>
                  <button
                    onClick={() => setContactOpen(true)}
                    className="hidden lg:block w-full mt-3 px-8 py-3 text-sm text-gray-500 font-body font-semibold hover:text-primary transition-colors duration-200 cursor-pointer"
                  >
                    Have any questions?
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <WeekRecapPreview className="bg-welcome-bg" />

      {/* FAQ Section */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              FAQ
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-heading text-gray-800">
            Frequently Asked Questions
          </h2>
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-bold mb-6 font-heading text-gray-800">
                About Sage Field & Our Approach
              </h3>
              <FAQAccordion items={aboutSageFieldFAQs} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 font-heading text-gray-800">
                Program Details
              </h3>
              <FAQAccordion items={programDetailsFAQs} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 font-heading text-gray-800">
                Supporting All Learners
              </h3>
              <FAQAccordion items={supportingLearnersFAQs} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 font-heading text-gray-800">
                Enrollment & Parent Partnership
              </h3>
              <FAQAccordion items={enrollmentFAQs} />
            </div>
          </div>
        </div>
      </section>

      {/* Have any questions? */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4">
              Questions?
            </span>
            <h2 className="text-2xl font-bold text-gray-800 font-heading mb-2">
              Have any questions?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-6 max-w-md mx-auto">
              We&apos;d love to hear from you. Reach out directly or send us a
              message.
            </p>
            <a
              href="mailto:sabrina@sagefield.co"
              className="inline-flex items-center gap-2 text-primary font-semibold font-body text-sm mb-6 hover:underline"
            >
              sabrina@sagefield.co
            </a>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
              <button
                onClick={() => setContactOpen(true)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                Contact Us
              </button>
              <button
                onClick={scrollToInterestForm}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Fill out Interest Form
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Floating footer CTA — mobile only */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" as const }}
      >
        <div className="bg-sage-700 rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">
              Interested in Sage Field?
            </p>
            <p className="text-white/75 font-body text-xs">
              Tell us about your family
            </p>
          </div>
          <button
            onClick={scrollToInterestForm}
            className="flex-shrink-0 bg-white text-sage-700 font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            Interest Form →
          </button>
        </div>
      </motion.div>

      <ContactDialog
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>
    </div>
  );
}

export default function InterestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-welcome-bg">
          <Navbar />
          <div className="pt-32 px-8 text-center text-gray-500 font-body">
            Loading…
          </div>
        </div>
      }
    >
      <InterestPageContent />
    </Suspense>
  );
}
