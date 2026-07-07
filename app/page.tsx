"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, Clock, Calendar, Star, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import WelcomeSection from "./components/WelcomeSection";
import WhatWeOfferSection from "./components/WhatWeOfferSection";
import EducationalPhilosophySection from "./components/EducationalPhilosophySection";
import ContinuitySection from "./components/ContinuitySection";
import ImageGridShowcase from "./components/ImageGridShowcase";
import CoCreationSection from "./components/CoCreationSection";
import DonationsSection from "./components/DonationsSection";
import MeetTheTeamSection from "./components/MeetTheTeamSection";
import EnrollmentCTASection from "./components/EnrollmentCTASection";
import SocialMediaSection from "./components/SocialMediaSection";
import ContactUsSection from "./components/ContactUsSection";
import FAQAccordion from "./components/FAQAccordion";
import Footer from "./components/Footer";
import WaitlistDialog from "./components/WaitlistDialog";
import FloatingSMSButton from "./components/FloatingSMSButton";
import EnrollmentAnnouncementPopup from "./components/EnrollmentAnnouncementPopup";
import WeekRecapPreview from "./components/WeekRecapPreview";


interface LatestPost {
  title: string;
  slug: string;
  excerpt: string | null;
  author_name: string | null;
  published_at: string | null;
  cover_image_signed_url: string | null;
}

const PREVIEW_WEEKS = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Summer",
    href: "/highlights/summer/week-1",
    coverImage: "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  },
  {
    week: 2,
    dates: "Jun 1–4",
    theme: "Mystery Camp Escape Challenge",
    href: "/highlights/summer/week-2",
    coverImage: "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  },
  {
    week: 3,
    dates: "Jun 9–13",
    theme: "Beach Day Bash",
    href: "/highlights/summer/week-3",
    coverImage: "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  },
  {
    week: 4,
    dates: "Jun 15–19",
    theme: "STEM Adventure & Strawberry Jam",
    href: "/highlights/summer/week-4",
    coverImage: "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  },
  {
    week: 5,
    dates: "Jun 22–26",
    theme: "Safari Adventure & Snake Deep Dive",
    href: "/highlights/summer/week-5",
    coverImage: "/assets/highlights/summer_week_five/69BAEEC0-7C4B-4821-8595-02152DC7E7FB.JPG",
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [latestPost, setLatestPost] = useState<LatestPost | null>(null);

  useEffect(() => {
    const handleScroll = () =>
      setPastHero(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/blog/latest")
      .then((r) => r.json())
      .then((data) => {
        if (data?.title) setLatestPost(data as LatestPost);
      })
      .catch(() => {});
  }, []);


  const aboutSageFieldFAQs = [
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
  ];

  const programDetailsFAQs = [
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
            Enrollment for Summer 2026 and School Year 2026-2027 is now open.
            Complete our interest form to begin the enrollment process.
          </p>
          <button
            onClick={() => setIsWaitlistDialogOpen(true)}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
          >
            Enroll Now
          </button>
        </div>
      ),
    },
  ];
  return (
    <div>
      <Navbar />
      <Hero />
      <WelcomeSection />

      {/* ── Field Day Friday Preview ── */}
      <style>{`
        @keyframes fdf-jungle-sway {
          0%, 100% { transform: rotate(-4deg); transform-origin: bottom center; }
          50%       { transform: rotate(4deg);  transform-origin: bottom center; }
        }
        @keyframes fdf-firefly {
          0%   { transform: translate(0, 0) scale(1);       opacity: 0.8; }
          25%  { transform: translate(10px, -16px) scale(1.3); opacity: 1; }
          50%  { transform: translate(-6px, -26px) scale(0.8); opacity: 0.5; }
          75%  { transform: translate(14px, -12px) scale(1.1); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1);       opacity: 0.8; }
        }
        @keyframes fdf-animal-peek {
          0%, 100% { transform: translateY(0px) scale(1); }
          40%       { transform: translateY(-8px) scale(1.04); }
          70%       { transform: translateY(-4px) scale(1.02); }
        }
        @keyframes fdf-safari-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fdf-golden-glow {
          0%, 100% { text-shadow: 0 2px 16px rgba(245,158,11,0.4); }
          50%       { text-shadow: 0 2px 32px rgba(245,158,11,0.75), 0 0 40px rgba(251,191,36,0.35); }
        }
        @keyframes fdf-letter-drop {
          0%   { opacity: 0; transform: translateY(-24px) scale(0.85); filter: blur(4px); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.04); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .fdf-safari-shimmer-text {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 20%, #fde68a 45%, #fbbf24 70%, #f59e0b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: fdf-safari-shimmer 4s linear infinite, fdf-golden-glow 3s ease-in-out infinite;
        }
        .fdf-letter-drop span {
          display: inline-block;
          opacity: 0;
          animation: fdf-letter-drop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .fdf-jungle-sway { animation: fdf-jungle-sway 4s ease-in-out infinite; }
        .fdf-firefly     { animation: fdf-firefly 5s ease-in-out infinite; }
        .fdf-animal-peek { animation: fdf-animal-peek 3.5s ease-in-out infinite; }
      `}</style>

      {/* Top wave: cream → dark */}
      <div style={{ background: "#FFF9F5", marginBottom: "-1px" }}>
        <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block" style={{ height: "56px" }}>
          <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="#1a0a00" />
        </svg>
      </div>

      <section
        className="relative overflow-hidden py-16 px-8 sm:px-12 lg:px-16"
        style={{ background: "linear-gradient(180deg, #1a0a00 0%, #2d1500 40%, #1a0800 100%)" }}
      >
        {/* Left palm accent */}
        <div className="fdf-jungle-sway absolute bottom-0 left-0 w-16 sm:w-20 pointer-events-none opacity-50" style={{ zIndex: 1 }}>
          <svg viewBox="0 0 80 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M40 200 Q38 160 36 120 Q34 80 40 20" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M40 20 Q10 -5 0 30" stroke="#92400e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M40 20 Q70 -5 80 25" stroke="#92400e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M40 20 Q5 40 0 65" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M40 20 Q75 40 80 60" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Fireflies */}
        {[
          { top: "18%", right: "15%", size: 4, delay: "0s"   },
          { top: "55%", right: "5%",  size: 3, delay: "1.2s" },
          { top: "30%", right: "28%", size: 3, delay: "2.4s" },
        ].map((f, i) => (
          <div
            key={i}
            className="fdf-firefly absolute rounded-full pointer-events-none"
            style={{
              top: f.top,
              right: f.right,
              width: f.size,
              height: f.size,
              background: "radial-gradient(circle, #fde68a 0%, #f59e0b 60%, transparent 100%)",
              boxShadow: `0 0 ${f.size * 2}px rgba(251,191,36,0.9)`,
              animationDelay: f.delay,
              zIndex: 1,
            }}
          />
        ))}

        <div className="relative max-w-5xl mx-auto" style={{ zIndex: 2 }}>
          {/* Urgency badge */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-semibold text-amber-200 font-body uppercase tracking-wide">
              🦕 This Friday · Jul 10 · Limited Spots
            </span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left — headline + CTA */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="fdf-animal-peek text-4xl mb-4 inline-block">🦕</div>
              <h2
                className="font-heading font-bold leading-tight mb-3"
                style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)" }}
              >
                <span className="block italic fdf-safari-shimmer-text">Dino Hunt</span>
                <span className="fdf-letter-drop block">
                  {Array.from("Field Day 🦕").map((ch, i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${0.3 + i * 0.06}s`, color: "#fbbf24" }}
                    >
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </span>
              </h2>
              <p className="text-slate-300 font-body text-base leading-relaxed mb-6 max-w-md">
                One wild Friday of dino digging, fossil making, and an epic egg hunt. Drop off, we handle the magic, you pick up an excited paleontologist with a real take-home fossil!
              </p>

              {/* Event detail pills */}
              <div className="flex flex-wrap gap-2 mb-7">
                {[
                  { icon: "📅", text: "Jul 10, 2026" },
                  { icon: "🕗", text: "8:30 AM – 1:30 PM" },
                  { icon: "💰", text: "$60 / child" },
                  { icon: "👧", text: "Ages 4–11" },
                ].map((pill) => (
                  <span
                    key={pill.text}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-semibold text-white/90 font-body shadow-sm"
                  >
                    {pill.icon} {pill.text}
                  </span>
                ))}
              </div>

              <Link
                href="/friday"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-bold font-body rounded-2xl text-white text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)" }}
              >
                Reserve Your Spot →
              </Link>
              <p className="text-xs text-amber-400 font-body mt-3">
                No enrollment required · One-time drop-in
              </p>
            </motion.div>

            {/* Right — activity cards */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: "🦴", title: "Dino Dig",      accent: "#fef3c7" },
                  { emoji: "🪨", title: "Fossil Making", accent: "#dcfce7" },
                  { emoji: "🥚", title: "Dino Egg Hunt", accent: "#fed7aa" },
                ].map((act, i) => (
                  <motion.div
                    key={act.title}
                    className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 flex flex-col items-center text-center gap-2"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: act.accent }}
                    >
                      {act.emoji}
                    </div>
                    <p className="text-xs font-bold text-white font-body leading-tight">{act.title}</p>
                  </motion.div>
                ))}
              </div>
              <motion.p
                className="text-center text-xs text-amber-300 font-body mt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                All activities included · Everything provided · Take-home fossil!
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom wave: dark → cream */}
      <div style={{ background: "#1a0800", marginBottom: "-1px" }}>
        <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block" style={{ height: "56px" }}>
          <path d="M0,28 C360,0 1080,56 1440,28 L1440,56 L0,56 Z" fill="#FFF9F5" />
        </svg>
      </div>

      <WeekRecapPreview className="bg-welcome-bg" />

      <WhatWeOfferSection />
      {/* <div className="hidden md:block">
        <ImageGridShowcase
          images={[
            { src: "/assets/ImageOne.jpg", alt: "School environment" },
            { src: "/assets/ImageTwo.jpg", alt: "Students learning" },
            { src: "/assets/ImageThree.jpg", alt: "Classroom activities" },
          ]}
        />
      </div> */}
      <EducationalPhilosophySection />
      <ContinuitySection />
      {/* <div className="hidden md:block">
        <ImageGridShowcase
          images={[
            { src: "/assets/ImageFour.jpg", alt: "Children developing skills" },
            { src: "/assets/ImageFive.jpg", alt: "School community" },
          ]}
        />
      </div> */}
      <CoCreationSection />
      <DonationsSection />
      {/* <div className="hidden md:block">
        <ImageGridShowcase
          images={[
            { src: "/assets/ImageNine.jpg", alt: "Sage Field community" },
            { src: "/assets/ImageTen.jpg", alt: "Learning environment" },
            { src: "/assets/ImageEleven.jpg", alt: "Student activities" },
          ]}
        />
      </div> */}
      <MeetTheTeamSection />
      <EnrollmentCTASection />

      {/* ── Tour Preview ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-welcome-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-5 font-body">
                Private Tours
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 leading-tight mb-4">
                See Where Your Child Will Thrive
              </h2>
              <p className="text-base text-gray-600 font-body leading-relaxed mb-6 max-w-md">
                Come walk our outdoor campus, meet Ms. Sabrina, and feel the Sage Field difference for yourself. Private, personal, and 100% free.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: Shield, label: "Private Tour" },
                  { icon: Clock, label: "~45 Minutes" },
                  { icon: Calendar, label: "Mon – Sat" },
                  { icon: Star, label: "100% Free" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-2 bg-white border border-sage-200 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 font-body shadow-sm"
                  >
                    <Icon className="w-3.5 h-3.5 text-sage-600" />
                    {label}
                  </span>
                ))}
              </div>
              <Link
                href="/tour"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                Schedule a Free Tour →
              </Link>
            </motion.div>

            {/* Right: image with educator chip */}
            <motion.div
              className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-xl"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <Image
                src="/assets/Stock3.jpg"
                alt="Sage Field outdoor campus"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src="/assets/team/sabrina.jpg"
                    alt="Ms. Sabrina"
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 font-body">Ms. Sabrina</p>
                  <p className="text-[10px] text-gray-500 font-body">Lead Teacher & Director</p>
                </div>
                <span className="ml-1 bg-sage-100 text-sage-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-body">
                  Your Host
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Shadow Day Preview ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-5 font-body">
              Shadow Day · $20
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              Let Your Child Live a Day Here
            </h2>
            <p className="text-base text-gray-500 font-body max-w-xl mx-auto">
              A full school day at Sage Field — real lessons, real outdoor time, real lunch with classmates. Not a tour. An experience.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Left panel: value bullets */}
              <div className="md:col-span-3 p-8 md:p-10">
                <ul className="space-y-5 mb-8">
                  {[
                    { emoji: "🕗", label: "Full School Day", desc: "9:00 AM – 3:00 PM, Monday through Thursday" },
                    { emoji: "👧", label: "Ages 4–11", desc: "Mixed-age groups, individualized learning pace" },
                    { emoji: "💰", label: "$20 Shadow Day Fee", desc: "Holds your child's spot for the day" },
                    { emoji: "🌿", label: "Real Learning", desc: "Academics, outdoor time, cooking, and community" },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800 font-body">{item.label}</p>
                        <p className="text-xs text-gray-500 font-body mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/shadow"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Book a Shadow Day — $20 →
                </Link>
              </div>

              {/* Right panel: early-bird offer */}
              <div className="md:col-span-2 bg-amber-50 border-t-2 md:border-t-0 md:border-l-2 border-amber-200 p-8 md:p-10 flex flex-col justify-center">
                <span className="text-3xl mb-4">🎁</span>
                <h4 className="text-lg font-bold font-heading text-amber-900 mb-2 leading-snug">
                  Enroll within 5 days — your $500 enrollment fee is waived
                </h4>
                <p className="text-sm text-amber-800 font-body leading-relaxed mb-5">
                  Shadow families who enroll in the school year program within 5 days of their shadow day have the full $500 enrollment fee waived. No codes, no forms. Offer ends August 14, 2026.
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold font-heading text-gray-300 line-through decoration-red-300">$500</span>
                  <span className="text-amber-500 text-xl">→</span>
                  <span className="text-3xl font-bold font-heading text-emerald-600">$0</span>
                </div>
                <p className="text-xs text-amber-700 font-body mt-1">enrollment fee, if you enroll within 5 days</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Highlights Preview ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-5 font-body">
              Summer 2026
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              See What Kids Are Doing Here
            </h2>
            <p className="text-base text-gray-500 font-body max-w-xl mx-auto">
              12 weeks of outdoor learning, real academics, and joy. Take a look at our first three weeks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {PREVIEW_WEEKS.map((week, i) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  href={week.href}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image
                      src={week.coverImage}
                      alt={`Week ${week.week} — ${week.theme}`}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full font-body shadow-sm">
                      Week {week.week} · Live
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 font-body mb-1">{week.dates}</p>
                    <h3 className="text-sm font-bold font-heading text-gray-800 leading-snug mb-2">
                      {week.theme}
                    </h3>
                    <span className="text-xs font-semibold text-primary font-body group-hover:underline">
                      View Recap →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link
              href="/highlights"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              See All Highlights →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Blog Preview ── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-5 font-body">
                From the Blog
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 leading-tight mb-4">
                Thoughts from Sage Field
              </h2>
              <p className="text-base text-gray-600 font-body leading-relaxed mb-6 max-w-md">
                We write about child-led learning, outdoor education, family partnership, and what it really looks like to raise curious, confident kids. New posts added regularly by Ms. Sabrina and the team.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Outdoor Learning", "Phonics & Reading", "Parenting Insights", "What We're Building"].map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1.5 bg-sage-50 border border-sage-200 text-sage-700 text-xs font-semibold rounded-full font-body"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                Read the Blog →
              </Link>
            </motion.div>

            {/* Right: dynamic latest post card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Cover image or gradient placeholder */}
                <div className="relative w-full h-48 bg-gradient-to-br from-sage-50 to-badge-bg overflow-hidden">
                  {latestPost?.cover_image_signed_url ? (
                    <img
                      src={latestPost.cover_image_signed_url}
                      alt={latestPost.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <BookOpen className="w-10 h-10 text-sage-400 mb-2" />
                      <p className="text-xs text-sage-600 font-body font-semibold">Sage Field Blog</p>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-400 font-body mb-2">
                    {latestPost?.author_name ?? "Ms. Sabrina"}
                    {latestPost?.published_at
                      ? ` · ${new Date(latestPost.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                      : " · Round Rock, TX"}
                  </p>
                  <h3 className="text-base font-bold font-heading text-gray-800 mb-2 leading-snug">
                    {latestPost?.title ?? "Why Small Class Sizes Change Everything"}
                  </h3>
                  {(latestPost?.excerpt) && (
                    <p className="text-sm text-gray-500 font-body line-clamp-3 leading-relaxed">
                      {latestPost.excerpt}
                    </p>
                  )}
                  {!latestPost && (
                    <p className="text-sm text-gray-500 font-body line-clamp-3 leading-relaxed">
                      When a teacher knows every child&apos;s name, learning style, and what lights them up — something shifts. Here&apos;s what 10 students per class looks like in practice at Sage Field...
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={latestPost ? `/blog/${latestPost.slug}` : "/blog"}
                      className="text-xs font-semibold text-primary font-body hover:underline"
                    >
                      Read on the blog →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SocialMediaSection />
      <ContactUsSection />

      {/* FAQ Section */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              FAQ
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            className="text-lg text-center text-gray-600 mb-12 font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            Find answers to common questions about Sage Field
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="relative mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 font-body"
            />
          </motion.div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {/* About Sage Field & Our Approach */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" as const }}
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
                About Sage Field & Our Approach
              </h3>
              <FAQAccordion
                items={aboutSageFieldFAQs}
                searchQuery={searchQuery}
              />
            </motion.div>

            {/* Program Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: "easeOut" as const,
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
                Program Details
              </h3>
              <FAQAccordion
                items={programDetailsFAQs}
                searchQuery={searchQuery}
              />
            </motion.div>

            {/* Supporting All Learners */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut" as const,
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
                Supporting All Learners
              </h3>
              <FAQAccordion
                items={supportingLearnersFAQs}
                searchQuery={searchQuery}
              />
            </motion.div>

            {/* Enrollment & Parent Partnership */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut" as const,
              }}
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
                Enrollment & Parent Partnership
              </h3>
              <FAQAccordion items={enrollmentFAQs} searchQuery={searchQuery} />
            </motion.div>
          </div>
        </div>
      </section>
      <EnrollmentAnnouncementPopup />
      <Footer />
      <WaitlistDialog
        isOpen={isWaitlistDialogOpen}
        onClose={() => setIsWaitlistDialogOpen(false)}
      />
      <AnimatePresence>{pastHero && <FloatingSMSButton />}</AnimatePresence>
    </div>
  );
}
