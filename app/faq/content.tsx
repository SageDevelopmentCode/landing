/**
 * Copy for the FAQ page, carried over verbatim from the previous
 * app/faq/page.tsx. This page's answers differ slightly from the home FAQ
 * (app/_home/content.tsx), so it keeps its own copy.
 */
import type { ReactNode } from "react";
import type { FaqGroup } from "@/app/_garden/types";

export const FAQ_PAGE = {
  badge: "FAQ",
  headingBefore: "Frequently Asked",
  headingHighlight: "Questions",
  sub: "Find answers to common questions about Sage Field",
  searchPlaceholder: "Search FAQs...",
  stillHeading: "Still have questions?",
  stillBody:
    "We're here to help! Reach out to us and we'll get back to you as soon as possible.",
  stillButton: "Contact Us",
  enrollButton: "Enroll Now",
};

/** The last answer contains the Enroll Now button, so the caller passes its renderer. */
export function buildFaqGroups(renderEnroll: () => ReactNode): FaqGroup[] {
  return [
    {
      title: "About Sage Field & Our Approach",
      items: [
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
      ],
    },
    {
      title: "Program Details",
      items: [
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
              {renderEnroll()}
            </div>
          ),
        },
      ],
    },
  ];
}
