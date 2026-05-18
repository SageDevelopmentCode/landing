"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () =>
      setPastHero(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
