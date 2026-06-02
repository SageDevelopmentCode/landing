"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";
import FloatingSMSButton from "../components/FloatingSMSButton";
import FullEnrollmentCard from "../components/FullEnrollmentCard";
import AfterCareCard from "../components/AfterCareCard";
import FieldDayFridayCard from "../components/FieldDayFridayCard";
import MeetTheTeamSection from "../components/MeetTheTeamSection";

const details = [
  { label: "Start Date", value: "August 17, 2026" },
  { label: "Ages", value: "4–11 years" },
  { label: "Schedule", value: "Up to 4 days/week" },
  { label: "Term", value: "6-month commitment" },
];

const WEEK1_PREVIEW_IMAGES = [
  "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  "/assets/highlights/summer_week_one/79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG",
  "/assets/highlights/summer_week_one/2B9964FA-0047-4590-880C-095C315B7DE8.JPG",
  "/assets/highlights/summer_week_one/AB176A40-3DE2-4856-8E87-2D169FB3F41A.JPG",
  "/assets/highlights/summer_week_one/341400BF-486B-43A0-912E-84623B6299D6.JPG",
  "/assets/highlights/summer_week_one/DDDA3AA2-CDF9-42CF-B8FF-AD61CED60065 2.JPG",
  "/assets/highlights/summer_week_one/1D2BF4A6-5081-4D51-B1E8-F6E0E3D820B3.JPG",
  "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2.JPG",
];

const EARLY_LEARNER_HIGHLIGHTS = [
  { emoji: "📖", label: "Letter Sounds & CVC Reading", desc: "Building phonics foundations through hands-on practice" },
  { emoji: "✏️", label: "Handwriting & Number Sense", desc: "Fine motor skills and early numeracy side by side" },
  { emoji: "➕", label: "Early Addition", desc: "Introducing addition concepts through play and manipulatives" },
  { emoji: "💧", label: "Water Cycle & Filtration", desc: "Science exploration that sparked curiosity all week" },
  { emoji: "🎨", label: "Art Creation", desc: "Self-expression through color, texture, and imagination" },
  { emoji: "🐥", label: "Caring for Our Chicks", desc: "Responsibility and empathy through animal care" },
  { emoji: "🎵", label: "Rhythm & Note Recognition", desc: "Music foundations woven into every morning" },
];

const ELEMENTARY_HIGHLIGHTS = [
  { emoji: "🔢", label: "Place Value Mastery", desc: "Expanded, word, and model forms — plus comparing numbers" },
  { emoji: "🎲", label: "Collaborative Math Game", desc: "Wrapped up the week by applying what we learned together" },
  { emoji: "📚", label: "SWBST Comprehension", desc: "Somebody, Wanted, But, So, Then — a framework for deep reading" },
  { emoji: "✍️", label: "Vocabulary & Sentence Structure", desc: "Building strong writing skills from the ground up" },
  { emoji: "🔄", label: "Synonyms & Antonyms", desc: "Expanding word knowledge through exploration" },
  { emoji: "📝", label: "Recipe Card Writing", desc: "Real experiences turned into structured, creative writing" },
];

const pillars = [
  {
    icon: "🌱",
    title: "Hands-on Learning",
    description: "Experiential activities that engage curiosity",
  },
  {
    icon: "🧘",
    title: "Emotional Regulation",
    description: "Mindfulness practices for students & educators",
  },
  {
    icon: "🎨",
    title: "Creative Expression",
    description: "Artistic and musical creativity flourish",
  },
  {
    icon: "🌳",
    title: "Movement & Nature",
    description: "Movement-based and outdoor education",
  },
];

export default function SchoolYear20262027Page() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const router = useRouter();

  const previewGalleryRef = useRef<HTMLDivElement>(null);
  const previewRafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = previewGalleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    let pos = 0;
    const tick = () => {
      if (el) {
        pos += 0.6;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      previewRafRef.current = requestAnimationFrame(tick);
    };
    previewRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              School Year 2026–2027
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            School Year 2026–2027
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            August 2026 – May 2027 · Up to 4 Days/Week · Ages 4–11
          </motion.p>
        </div>
      </section>

      {/* Program Summary */}
      <section className="pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
            className="space-y-4 mb-10"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Sage Field is a small outdoor learning microschool located in
              Round Rock, TX. Sage Field operates as a private microschool, not
              a child-care or daycare center. We blend elements of Montessori,
              Waldorf, and Reggio Emilia philosophies with TEKS-aligned
              academics to create a nurturing, nature-connected learning
              environment where children are always wondering, exploring, and
              growing.
            </p>
          </motion.div>

          {/* Key Details Cards */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" as const }}
          >
            {details.map((detail) => (
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
          </motion.div>
        </div>
      </section>

      {/* Description */}
      <section className="pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
            className="space-y-4"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              The School Year 2026–2027 program runs as a six-month commitment,
              offering up to four days per week of enriched learning for
              children ages 4–11. Students receive individualized support in
              literacy and numeracy alongside science, art, movement, and
              social-emotional learning.
            </p>
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Enrollment is limited to preserve the small-group environment that
              makes Sage Field special. Families begin with an application and a
              mutual-fit conversation to ensure the program is the right match
              for your child.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg mb-3">
              <img
                src="/assets/Stock1.jpg"
                alt="School year program photo"
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/Stock3.jpg"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/Stock6.jpg"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/Stock7.jpg"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/Stock8.jpg"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/Stock11.jpg"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                <img
                  src="/assets/Kid1.png"
                  alt="School year program photo"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Educational Philosophy */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              How We Learn
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-3">
              How We Learn
            </h2>
            <p className="text-lg font-semibold text-primary font-heading mb-6">
              Educational Philosophy
            </p>

            <p className="text-base text-text-gray mb-4 leading-relaxed font-body">
              Our approach integrates elements of{" "}
              <span className="text-primary font-semibold">Montessori</span>,{" "}
              <span className="text-primary font-semibold">Waldorf</span>, and{" "}
              <span className="text-primary font-semibold">Reggio Emilia</span>{" "}
              methods with{" "}
              <span className="text-primary font-semibold">
                TEKS-aligned academics
              </span>
              . We enrich learning with social-emotional education, arts, music,
              and creative problem-solving.
            </p>

            <p className="text-base text-text-gray mb-8 leading-relaxed font-body">
              We value{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              , both for students and educators. A calm, connected teacher
              creates a community where children thrive.
            </p>
          </motion.div>

          {/* Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, index) => (
              <motion.div
                key={index}
                className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
        </div>
      </section>

      {/* Homeschool Drop-In */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4">
              Homeschool Friendly
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4">
              Homeschool <span className="text-primary">Drop-In</span> Available
            </h2>
            <p className="text-gray-500 font-body text-base mb-8 max-w-xl mx-auto">
              Homeschool families can join the School Year program on a flexible
              schedule — 1 to 5 days per week. Every child gets full access to
              all enrichments, no matter how many days they attend.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
                <span>📅</span>
                <span className="text-sm font-semibold text-primary font-body">
                  1–5 Days/Week
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
                <span>🎯</span>
                <span className="text-sm font-semibold text-primary font-body">
                  Ability-Based Learning
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
                <span>🎨</span>
                <span className="text-sm font-semibold text-primary font-body">
                  All Enrichments Included
                </span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
                <span>👥</span>
                <span className="text-sm font-semibold text-primary font-body">
                  ~10 Kids Per Class
                </span>
              </div>
            </div>

            <Link
              href="/homeschool"
              className="inline-block px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body"
            >
              Learn More About Drop-In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Meet the Team */}
      <MeetTheTeamSection
        featured={false}
        exclude={["Nicole Elias", "Taylor Elias"]}
      />

      {/* Full Enrollment Tuition */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Tuition &amp; Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading">
              School Year Pricing
            </h2>
          </motion.div>

          <div className="mb-8">
            <FullEnrollmentCard
              onQuestionsClick={() => setWaitlistOpen(true)}
            />
          </div>

          {/* Extended Learning + Field Day Friday */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AfterCareCard />
            <FieldDayFridayCard />
          </div>
        </div>
      </section>

      {/* Enrollment CTA */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <h2 className="text-2xl font-bold text-gray-800 font-heading mb-2">
              Ready to apply?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-6">
              Spots are limited — apply early to secure your child&apos;s place
              in the School Year 2026–2027 program.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/apply/start")}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
              >
                Start Application
              </button>
              <button
                onClick={() => setWaitlistOpen(true)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 font-body cursor-pointer"
              >
                Interest Form
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Week 1 Recap */}
      <section className="pt-16 pb-16 px-8 sm:px-12 lg:px-16 bg-sage-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Week 1 Recap
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-2">
              See Week 1 in Action
            </h2>
            <p className="text-base text-gray-500 font-body">
              Week 1 is complete — and it was an incredible start. Here&apos;s a glimpse at what our students experienced.
            </p>
          </motion.div>
        </div>

        {/* Auto-scroll photo strip — full bleed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div
            ref={previewGalleryRef}
            className="overflow-x-auto flex gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] mb-8"
          >
            {[...WEEK1_PREVIEW_IMAGES, ...WEEK1_PREVIEW_IMAGES].map((src, i) => (
              <div
                key={i}
                className="relative w-64 flex-shrink-0 aspect-[4/3] rounded-xl overflow-hidden shadow-md"
              >
                <Image
                  src={src}
                  alt="Week 1 highlight"
                  fill
                  className="object-cover"
                  sizes="256px"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-base text-gray-600 font-body leading-relaxed">
              Students spent the week learning by doing — building foundations in literacy and math, exploring science, expressing themselves through art, and growing into a real community together. They cooked pizzas, made strawberry ice cream, and were already using Spanish in daily conversations by Friday.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* Early Learners */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🌱</span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-gray-800">Early Learners</h4>
                </div>
                <ul className="space-y-1.5">
                  {EARLY_LEARNER_HIGHLIGHTS.map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-800 font-body leading-tight">{item.label}</p>
                        <p className="text-[11px] text-gray-400 font-body">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Elementary */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📐</span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-gray-800">Elementary</h4>
                </div>
                <ul className="space-y-1.5">
                  {ELEMENTARY_HIGHLIGHTS.map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-800 font-body leading-tight">{item.label}</p>
                        <p className="text-[11px] text-gray-400 font-body">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center mt-7">
            <Link
              href="/highlights/summer/week-1"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body text-sm"
            >
              View Full Week 1 Recap →
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <WaitlistDialog
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
      <FloatingSMSButton />
    </div>
  );
}
