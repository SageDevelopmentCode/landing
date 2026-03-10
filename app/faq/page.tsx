"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import FAQAccordion from "../components/FAQAccordion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactDialog from "../components/ContactDialog";
import WaitlistDialog from "../components/WaitlistDialog";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  const aboutSageFieldFAQs = [
    {
      question: "What is Sage Field?",
      answer:
        "Sage Field Private School is an outdoor-focused private microschool in Round Rock, Texas. We are a small-group, outdoor-centered education that fosters curiosity, confidence, and wisdom — a structured drop-off program without the rigidity of traditional school.",
    },
    {
      question: "Are you a school? Will Sage Field keep grades or transcripts?",
      answer:
        "Yes — Sage Field Private School is a private microschool operating under Texas private school law. We are not a traditional accredited school and do not issue grades, report cards, or transcripts in the conventional sense. Instead, we provide descriptive, portfolio-based feedback on each child's growth and progress. We handle the in-school program; families manage any additional records they personally wish to keep.",
    },
    {
      question: "What is a microschool?",
      answer:
        "A microschool is a small, independent private school — typically serving fewer than 15–20 students — that offers a more personalized, flexible alternative to traditional schooling. Microschools prioritize small class sizes, individualized pacing, and innovative approaches to learning. Sage Field fits this model: we are a licensed private school with intentional, nature-based education at our core.",
    },
    {
      question: "What is the Family Partnership model?",
      answer:
        "At Sage Field, we believe the best outcomes happen when school and family are aligned. Our Family Partnership model means we stay in close communication with parents about their child's strengths, needs, and growth — and we invite families to extend the curiosity and reflection we spark at school into everyday life at home. Parents are not expected to run the curriculum; that's our job. But we do ask that families stay engaged, communicative, and supportive of the learning journey.",
    },
  ];

  const programDetailsFAQs = [
    {
      question: "What ages do you serve and how big are the groups?",
      answer:
        "We serve ages 4-11, with flexibility based on developmental fit. Students learn together in mixed-age groups so children can move at their own pace. We intentionally keep our groups small — typically no more than 10–12 children per class — so that two adults can stay closely attuned to each child's needs.",
    },
    {
      question: "What does a typical day at Sage Field look like?",
      answer:
        "Our days are designed to feel calm, connected, and alive with curiosity. Mornings are for focused academics in reading, writing, fluency, and math, individualized to each child's abilities rather than a grade label. Afternoons flow into nature exploration, science, art, movement, sports-like games, and social-emotional learning. We prioritize real-world, hands-on experiences, movement, and time outdoors over worksheets and rote repetition.",
    },
    {
      question: "What subjects does Sage Field teach?",
      answer:
        "At Sage Field, we cover literacy, numeracy, science, nature study, art, music, movement, and social-emotional learning — drawing from Montessori, Waldorf, and Reggio-inspired approaches with broadly TEKS-aligned academics. We are a full drop-off program; families do not need to supplement our academic program at home unless they choose to.",
    },
    {
      question: "How often can my child attend? Is there a minimum?",
      answer:
        "Sage Field is open up to four days per week for approximately six hours each day. You choose the schedule option that best fits your family's rhythm. Tuition is based on the enrollment option you select, not on day-to-day attendance, and enrollment is set in six-month terms.",
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
        "Sage Field handles the full in-school program — parents do not teach, volunteer, or manage curriculum here. What we do ask is that families stay engaged and communicative: share important updates about your child, attend check-ins when scheduled, and support a culture of curiosity and reflection at home. We see parents as partners in their child's growth, not as co-teachers.",
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
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              FAQ
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Frequently Asked Questions
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-center text-gray-600 mb-12 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Find answers to common questions about Sage Field
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
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
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* About Sage Field & Our Approach */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
              About Sage Field & Our Approach
            </h2>
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
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
              Program Details
            </h2>
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
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
              Supporting All Learners
            </h2>
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
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading text-gray-800">
              Enrollment & Parent Partnership
            </h2>
            <FAQAccordion items={enrollmentFAQs} searchQuery={searchQuery} />
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading text-gray-800">
            Still have questions?
          </h2>
          <p className="text-lg text-gray-600 mb-8 font-body">
            We&apos;re here to help! Reach out to us and we&apos;ll get back to
            you as soon as possible.
          </p>
          <button
            onClick={() => setIsContactDialogOpen(true)}
            className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
          >
            Contact Us
          </button>
        </motion.div>
      </section>
      <Footer />
      <ContactDialog
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
      <WaitlistDialog
        isOpen={isWaitlistDialogOpen}
        onClose={() => setIsWaitlistDialogOpen(false)}
      />
    </div>
  );
}
