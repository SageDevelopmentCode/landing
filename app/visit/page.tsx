"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";
import WeekRecapPreview from "@/app/components/WeekRecapPreview";
import EducationalPhilosophySection from "@/app/components/EducationalPhilosophySection";
import MeetTheTeamSection from "@/app/components/MeetTheTeamSection";
import FAQAccordion from "@/app/components/FAQAccordion";
import { SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES } from "@/app/lib/highlights/school-year-latest-preview";

const ContactDialog = dynamic(
  () => import("@/app/components/ContactDialog"),
  { ssr: false },
);

const GALLERY_IMAGES = [
  "/assets/Stock3.jpg",
  "/assets/Kid1.png",
  ...SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES.slice(0, 8),
];

const BENTO_IMAGES = [
  "/assets/Stock3.jpg",
  SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES[0],
  SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES[2],
  SCHOOL_WEEK_ELEVEN_GALLERY_IMAGES[5],
];

const VISIT_FAQS = [
  {
    question: "Can we do both a tour and a shadow day?",
    answer:
      "Absolutely — and many families do. A campus tour is a great first step to see the space and meet Ms. Sabrina. A shadow day goes deeper: your child spends a full school day in class. There is no required order; choose what fits your timeline.",
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

const SCHOOL_FAQS = [
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

const COMPARISON_ROWS = [
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
];

function VisitFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-6 sm:px-12 lg:px-16 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-5 py-2 bg-sage-50 border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-4 font-body">
            Before You Book
          </span>
          <h2 className="text-3xl font-bold font-heading text-gray-800 mb-3">
            Common Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {VISIT_FAQS.map((faq, i) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="text-sm font-semibold text-gray-800 font-body pr-4">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-primary" />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-gray-600 font-body leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function VisitPage() {
  const [contactOpen, setContactOpen] = useState(false);
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
  }, []);

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

  const scrollToChoose = () => {
    document.getElementById("choose-path")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      {/* Mobile gallery strip */}
      <div className="sm:hidden pt-20">
        <div
          ref={galleryRef}
          className="overflow-x-auto flex gap-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onTouchStart={handleGalleryInteractionStart}
          onTouchEnd={handleGalleryInteractionEnd}
          onMouseDown={handleGalleryInteractionStart}
          onMouseUp={handleGalleryInteractionEnd}
        >
          {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative w-[88%] flex-shrink-0 aspect-square overflow-hidden"
            >
              <Image
                src={src}
                alt="Sage Field students learning outdoors"
                fill
                className="object-cover"
                sizes="88vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-8 sm:pt-28 pb-12 sm:pb-16 px-6 sm:px-12 lg:px-16 bg-welcome-bg overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-sage-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          <div className="text-center lg:text-left">
            <motion.span
              className="inline-block px-5 py-2 bg-badge-bg border border-primary/20 text-black text-sm font-semibold rounded-full mb-5 font-body"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              Visit Sage Field
            </motion.span>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-800 leading-tight mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              We&apos;d Love to Show You Around
            </motion.h1>

            <motion.p
              className="text-lg text-gray-600 font-body leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
            >
              Sage Field is an outdoor-focused microschool in Round Rock. Come
              walk our campus with Ms. Sabrina — or let your child live a real
              school day alongside classmates. Two paths, same warm welcome.
            </motion.p>

            <motion.button
              type="button"
              onClick={scrollToChoose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
            >
              Choose Your Visit
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          </div>

          <motion.div
            className="relative hidden sm:block w-full h-[380px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            <Image
              src="/assets/Stock3.jpg"
              alt="Children learning outdoors at Sage Field"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 90vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/45 to-transparent" />
            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/assets/team/sabrina.jpg"
                  alt="Ms. Sabrina"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 font-body">
                  Ms. Sabrina
                </p>
                <p className="text-[10px] text-gray-500 font-body">
                  Lead Teacher & Director
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Path cards */}
      <section
        id="choose-path"
        className="py-16 sm:py-20 px-6 sm:px-12 lg:px-16 scroll-mt-24 bg-gradient-to-b from-welcome-bg to-white"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              How Would You Like to Visit?
            </h2>
            <p className="text-base text-gray-500 font-body max-w-xl mx-auto">
              Pick the experience that fits where you are in your search. You can
              always come back for the other.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <Link
                href="/tour"
                className="group relative flex flex-col h-full bg-white rounded-3xl border-2 border-sage-200 hover:border-primary/40 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative h-48 sm:h-52 overflow-hidden">
                  <Image
                    src="/assets/Stock2.jpg"
                    alt="Family walking the outdoor campus at Sage Field"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <span className="absolute top-4 left-4 bg-white/95 text-sage-800 text-xs font-bold px-3 py-1.5 rounded-full font-body shadow-sm">
                    Free · No pressure
                  </span>
                </div>
                <div className="flex flex-col flex-1 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-gray-800">
                      Schedule a Campus Tour
                    </h3>
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-sage-50 border border-sage-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-colors duration-300">
                      <ArrowRight className="w-5 h-5 text-sage-600 group-hover:text-white transition-colors" />
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-body leading-relaxed mb-6 flex-1">
                    A private, ~45-minute walk through our outdoor campus. Meet
                    Ms. Sabrina, see the learning spaces, and feel whether Sage
                    Field feels like home.
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {[
                      { icon: Clock, text: "~45 min" },
                      { icon: Users, text: "Whole family" },
                      { icon: MapPin, text: "Outdoor campus" },
                      { icon: Sparkles, text: "Meet educators" },
                    ].map(({ icon: Icon, text }) => (
                      <li
                        key={text}
                        className="flex items-center gap-1.5 bg-sage-50 border border-sage-100 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 font-body"
                      >
                        <Icon className="w-3.5 h-3.5 text-sage-600" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <Link
                href="/shadow"
                className="group relative flex flex-col h-full bg-white rounded-3xl border-2 border-primary/25 hover:border-primary shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative h-48 sm:h-52 overflow-hidden">
                  <Image
                    src="/assets/Stock1.jpg"
                    alt="Children running and playing outdoors at Sage Field"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full font-body shadow-sm">
                    Save $500
                  </span>
                </div>
                <div className="flex flex-col flex-1 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-gray-800">
                      Book a Shadow Day
                    </h3>
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-body leading-relaxed mb-6 flex-1">
                    Not a tour — an experience. Your child joins real lessons,
                    outdoor time, and lunch with classmates. Mon–Thu, full day.
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {[
                      { icon: Sun, text: "9 AM – 3 PM" },
                      { icon: Calendar, text: "Mon – Thu" },
                      { icon: Users, text: "Ages 4–11" },
                      { icon: Sparkles, text: "$20 per child" },
                    ].map(({ icon: Icon, text }) => (
                      <li
                        key={text}
                        className="flex items-center gap-1.5 bg-primary/5 border border-primary/15 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 font-body"
                      >
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-5 py-2 bg-sage-50 border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-4 font-body">
              Which Is Right for You?
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-800">
              Tour vs. Shadow Day
            </h2>
          </motion.div>

          <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden sm:grid grid-cols-3 bg-sage-50 border-b border-sage-100 text-xs font-bold uppercase tracking-wide text-gray-500 font-body">
              <div className="p-4" />
              <div className="p-4 text-center text-sage-700">Campus Tour</div>
              <div className="p-4 text-center text-primary">Shadow Day</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 p-4 sm:p-5 ${
                  i < COMPARISON_ROWS.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <p className="text-sm font-bold text-gray-800 font-body sm:col-span-1">
                  {row.label}
                </p>
                <p className="text-sm text-gray-600 font-body sm:text-center pl-4 sm:pl-0 border-l-2 sm:border-l-0 border-sage-200 sm:border-none">
                  <span className="sm:hidden font-semibold text-sage-700">
                    Tour:{" "}
                  </span>
                  {row.tour}
                </p>
                <p className="text-sm text-gray-600 font-body sm:text-center pl-4 sm:pl-0 border-l-2 sm:border-l-0 border-primary/30 sm:border-none">
                  <span className="sm:hidden font-semibold text-primary">
                    Shadow:{" "}
                  </span>
                  {row.shadow}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo intro */}
      <section className="py-16 sm:py-20 px-6 sm:px-12 lg:px-16 bg-welcome-bg">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-white border border-sage-200 text-sage-700 text-sm font-semibold rounded-full mb-5 font-body">
              A Place Worth Seeing
            </span>
            <h2 className="text-3xl font-bold font-heading text-gray-800 mb-5">
              Small Classes. Big Outdoors. Real Community.
            </h2>
            <p className="text-base text-gray-600 font-body leading-relaxed mb-4">
              Pictures only go so far. When you visit Sage Field, you see
              mixed-age groups working together, children outside for science and
              play, and educators who know every student by name — not a
              polished showroom, but a living school day.
            </p>
            <p className="text-base text-gray-600 font-body leading-relaxed">
              Whether you start with a tour or a shadow day, you&apos;ll leave
              with a clearer sense of whether our rhythm, values, and community
              fit your family. No sales pitch — just an honest look at how we
              learn.
            </p>
          </motion.div>

          <motion.div
            className="lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-4 lg:sticky lg:top-28"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {BENTO_IMAGES.map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-2xl shadow-md ${
                  i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                }`}
              >
                <Image
                  src={src}
                  alt="Sage Field campus and students"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 px-6 sm:px-12 lg:px-16 bg-white border-y border-sage-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-sage-200 flex-shrink-0">
              <Image
                src="/assets/team/sabrina.jpg"
                alt="Ms. Sabrina"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 font-body">
                Ms. Sabrina welcomes every visit
              </p>
              <p className="text-xs text-gray-500 font-body">
                Lead Teacher & Director
              </p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-sage-200" />
          <div className="flex items-start gap-2 max-w-sm">
            <MapPin className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 font-body">
              2760 Gattis School Rd, Round Rock, TX 78664
            </p>
          </div>
        </div>
      </section>

      <VisitFAQ />

      <EducationalPhilosophySection />

      <MeetTheTeamSection featured={true} />

      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-welcome-bg">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-800 mb-3">
              Common Questions
            </h2>
            <p className="text-base text-gray-500 font-body max-w-xl mx-auto">
              Everything families ask before their first visit to Sage Field.
            </p>
          </motion.div>
          <FAQAccordion items={SCHOOL_FAQS} />
        </div>
      </section>

      <WeekRecapPreview className="bg-white" />

      {/* Closing CTA */}
      <section className="py-20 px-6 sm:px-12 lg:px-16 bg-gradient-to-r from-sage-800 to-sage-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sage-300 text-xs uppercase tracking-widest font-body mb-4">
              Ready when you are
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-8 leading-tight">
              Pick your visit — we&apos;ll take it from there
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/tour"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-sage-800 hover:bg-sage-50 font-semibold font-body px-8 py-4 rounded-xl shadow-lg transition-all duration-200"
              >
                Schedule a Tour
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shadow"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold font-body px-8 py-4 rounded-xl shadow-lg transition-all duration-200"
              >
                Book a Shadow Day
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-sm text-sage-400 font-body mt-8">
              Questions?{" "}
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="text-sage-200 hover:text-white underline-offset-2 hover:underline cursor-pointer"
              >
                Send us a message
              </button>
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
      <FloatingSMSButton />
      <ContactDialog
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}
