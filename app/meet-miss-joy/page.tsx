"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import WeekRecapPreview from "../components/WeekRecapPreview";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";
import WhatWeOfferSection from "../components/WhatWeOfferSection";

const PREVIEW_WEEKS = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Summer",
    href: "/highlights/summer/week-1",
    coverImage:
      "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  },
  {
    week: 2,
    dates: "Jun 1–4",
    theme: "Mystery Camp Escape Challenge",
    href: "/highlights/summer/week-2",
    coverImage:
      "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  },
  {
    week: 3,
    dates: "Jun 9–13",
    theme: "Beach Day Bash",
    href: "/highlights/summer/week-3",
    coverImage:
      "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  },
  {
    week: 4,
    dates: "Jun 15–19",
    theme: "STEM Adventure & Strawberry Jam",
    href: "/highlights/summer/week-4",
    coverImage:
      "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  },
  {
    week: 5,
    dates: "Jun 22–26",
    theme: "Safari Adventure & Snake Deep Dive",
    href: "/highlights/summer/week-5",
    coverImage:
      "/assets/highlights/summer_week_five/69BAEEC0-7C4B-4821-8595-02152DC7E7FB.JPG",
  },
  {
    week: 6,
    dates: "Jun 29–Jul 2",
    theme: "Cooking from Scratch & Halfway There",
    href: "/highlights/summer/week-6",
    coverImage: "/assets/highlights/summer_week_six/1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
  },
  {
    week: 12,
    dates: "Aug 10–13",
    theme: "Finale of Camp",
    href: "/highlights/summer/week-12",
    coverImage:
      "/assets/highlights/summer_week_twelve/8C3B1791-0B49-4B7E-B069-C746C7CF6F65.JPG",
  },
];

const AGENDA_ITEMS = [
  {
    icon: "👋",
    label: "Welcome & All About Miss Joy",
    desc: "Get to know Miss Joy's background, teaching philosophy, and what she brings to the Primary classroom every day.",
  },
  {
    icon: "🗓️",
    label: "A Day in Our Life at Sage Field",
    desc: "We'll walk you through a typical morning — from arrival to stations, outdoor time, and circle.",
  },
  {
    icon: "🧩",
    label: "How Primary Block Stations Work",
    desc: "See how students rotate through hands-on learning centers designed around the Reggio Emilia approach.",
  },
  {
    icon: "📚",
    label: "Our Weekly Curriculum",
    desc: "Reading, math, science, art, and nature — all woven together into a cohesive weekly rhythm.",
  },
  {
    icon: "🎂",
    label: "Birthday Circle Celebration",
    desc: "Join us for a special birthday circle — a beloved Sage Field tradition that closes every special gathering.",
  },
];

const PHILOSOPHY_PILLARS = [
  {
    icon: "🌱",
    title: "Hands-on Learning",
    desc: "Children learn best by doing — building, growing, experimenting.",
    image: "/assets/ImageOne.jpg",
  },
  {
    icon: "🧘",
    title: "Emotional Regulation",
    desc: "We teach children to name and navigate their feelings with confidence.",
    image: "/assets/Stock3.jpg",
  },
  {
    icon: "🎨",
    title: "Creative Expression",
    desc: "Art, storytelling, and music are core — not extras.",
    image: "/assets/ImageEleven.jpg",
  },
  {
    icon: "🌳",
    title: "Movement & Nature",
    desc: "Outside is a classroom. Daily outdoor time is non-negotiable.",
    image: "/assets/ImageSeven.jpg",
  },
];

export default function MeetMissJoyPage() {
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // RSVP form state
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [adultsAttending, setAdultsAttending] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const scrollToRSVP = () => {
    document
      .getElementById("rsvp-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/meet-miss-joy/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName,
          email,
          phone: phone || undefined,
          childName,
          childAge: parseInt(childAge, 10),
          adultsAttending,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar darkStyle />

      {/* ───────────────────────────────────────────
          1. HERO
      ─────────────────────────────────────────── */}
      <section className="bg-welcome-bg pt-32 sm:pt-36 pb-16 px-8 sm:px-12 lg:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Headline + CTA */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full lg:w-3/5 space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-gray font-heading leading-tight">
                You&apos;re Invited to Meet{" "}
                <span className="text-primary">Miss Joy</span>
              </h1>
              <p className="text-lg sm:text-xl text-text-gray font-body leading-relaxed max-w-xl">
                Join us for an evening with Miss Joy Paige — Sage Field&apos;s
                Primary Lead Teacher — where you&apos;ll learn about our
                classroom, curriculum, and the warm, intentional environment
                your child will thrive in.
              </p>

              {/* Event pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "📅", label: "Monday, July 13" },
                  { icon: "🕔", label: "5:30 PM – 6:30 PM" },
                  {
                    icon: "📍",
                    label: "2760 Gattis School Rd, Round Rock, TX 78664",
                  },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-text-gray font-body shadow-sm"
                  >
                    <span>{pill.icon}</span>
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={scrollToRSVP}
                  className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-xl text-base font-body shadow-lg transition-colors duration-200 cursor-pointer"
                >
                  RSVP — I&apos;ll Be There →
                </motion.button>
                <a
                  href="#about-sage-field"
                  className="text-sm text-text-gray underline underline-offset-2 font-body hover:text-primary transition-colors"
                >
                  Can&apos;t make it? Learn about Sage Field ↓
                </a>
              </div>
            </motion.div>

            {/* Right: Miss Joy photo card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full lg:w-2/5 flex justify-center"
            >
              <div className="relative">
                <motion.div
                  className="bg-white p-3 pb-8 shadow-2xl rounded-xl"
                  style={{ rotate: "2deg" }}
                  whileHover={{ rotate: 0, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-72 h-80 sm:w-80 sm:h-96 rounded-lg overflow-hidden">
                    <Image
                      src="/assets/team/Joy (1).png"
                      alt="Miss Joy Paige — Primary Lead Teacher"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 288px, 320px"
                      priority
                    />
                  </div>
                  <p className="text-center text-sm font-semibold text-gray-500 font-body mt-3 tracking-wide">
                    Miss Joy Paige
                  </p>
                </motion.div>
                <div className="absolute -top-4 -right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg font-body rotate-6">
                  Primary Lead Teacher ✨
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          2. ABOUT MISS JOY — Featured Bio Card
      ─────────────────────────────────────────── */}
      <section className="py-16 px-8 sm:px-12 lg:px-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3 mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-gray font-heading">
              About Miss Joy Paige
            </h2>
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full font-body">
              Primary Lead Teacher
            </span>
          </motion.div>

          {/* Strength pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {[
              { icon: "🌱", label: "Reggio Emilia" },
              { icon: "🎨", label: "Art & Creativity" },
              { icon: "🌿", label: "Gardening & Science" },
              { icon: "📚", label: "Storytelling" },
            ].map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 bg-sage-50 border border-sage-100 text-text-gray text-sm font-semibold px-4 py-1.5 rounded-full font-body"
              >
                <span>{pill.icon}</span>
                {pill.label}
              </span>
            ))}
          </motion.div>

          {/* Full bio paragraphs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-5 text-base md:text-lg text-text-gray leading-relaxed font-body text-left"
          >
            <p>
              Hi, I&apos;m Ms. Joy! I recently moved to Austin and quickly fell
              in love with the city. As someone who loves being outdoors, Austin
              feels like the perfect fit for me. I enjoy spending time on the
              trails, running, hiking, exploring local coffee shops, and finding
              new adventures around the city. I love that Austin encourages
              people to get outside, connect with nature, and build community.
            </p>
            {bioExpanded && (
              <>
                <p>
                  My love for teaching began when I was a little girl. I used to
                  gather my friends in my garage and spend hours playing
                  teacher. Looking back, it&apos;s no surprise that I followed
                  that passion into education. I find so much joy in creating a
                  safe place to learn. I&apos;ve had the opportunity to work
                  with children of all ages. While I loved many aspects of
                  traditional education, I found myself wanting to be in a space
                  where children&apos;s ideas could truly drive the learning.
                </p>
                <p>
                  That&apos;s what led me to Sage Field. I was drawn to the
                  Montessori approach because it respects children as capable,
                  independent learners. It creates an environment where children
                  can explore, make choices, and learn through hands-on
                  experiences. I appreciate how it fosters curiosity,
                  confidence, and a love of learning while allowing each child
                  to develop at their own pace.
                </p>
                <p>
                  I&apos;ve had the opportunity to learn alongside children
                  through projects involving gardening, engineering, art,
                  literacy, and scientific investigation. One of my favorite
                  parts of teaching is watching a simple question turn into a
                  meaningful project filled with discovery, collaboration, and
                  wonder. What excites me most is creating a classroom where
                  children feel safe enough to take risks, confident enough to
                  share their ideas, and supported enough to learn from one
                  another. Seeing children advocate for their peers, solve
                  problems together, and take ownership of their learning
                  reminds me why I chose this path.
                </p>
                <p>
                  I believe education is about more than preparing children for
                  the next grade; it&apos;s about helping them become
                  thoughtful, curious, resilient, and compassionate people. I am
                  grateful to be part of a school community that shares those
                  values, and I look forward to continuing to grow alongside the
                  children and families I connect with.
                </p>
              </>
            )}
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="text-primary font-semibold text-sm font-body underline underline-offset-2 hover:text-primary-hover transition-colors"
            >
              {bioExpanded ? "Read less ↑" : "Read more ↓"}
            </button>
          </motion.div>

          {/* Experience callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 p-5 bg-primary/10 rounded-xl border-l-4 border-primary"
          >
            <p className="text-base text-text-gray leading-relaxed font-body">
              <strong>Experience:</strong> I work at a Reggio Emilia-inspired
              microschool with a rich history of over 40 years. Many staff
              members have been part of the school community for more than 24
              years. In addition to classroom experience, I&apos;ve also worked
              on the business side of the school, giving me a strong
              understanding of both the educational and operational aspects of
              running a successful early childhood program.
            </p>
          </motion.div>

          {/* Quote callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-5 p-5 bg-primary/10 rounded-xl border-l-4 border-primary"
          >
            <p className="text-base text-text-gray leading-relaxed font-body italic">
              &ldquo;I&apos;m so excited to continue this journey with such an
              inspiring school community and can&apos;t wait to share my joy,
              creativity, and heart with all of you.&rdquo;
            </p>
            <p className="text-sm text-primary font-semibold mt-2 font-body">
              — Miss Joy Paige
            </p>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          3. EVENT AGENDA — "What to Expect"
      ─────────────────────────────────────────── */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="inline-block bg-badge-bg px-5 py-2 rounded-full text-sm font-semibold text-text-gray font-body mb-4">
              Event Agenda
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-gray font-heading">
              A Peek at the Evening
            </h2>
            <p className="text-base text-text-gray font-body mt-3 max-w-lg mx-auto">
              In just one hour, you&apos;ll come away knowing exactly what your
              child&apos;s day looks like and feel confident in your decision.
            </p>
          </motion.div>

          <div className="space-y-4">
            {AGENDA_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="bg-white rounded-xl border-l-4 border-primary p-5 shadow-sm flex items-start gap-4"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {item.icon}
                </span>
                <div>
                  <p className="text-base font-bold text-text-gray font-heading">
                    {item.label}
                  </p>
                  <p className="text-sm text-text-gray font-body mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          4. SUMMER IN ACTION — WeekRecapPreview
      ─────────────────────────────────────────── */}
      <section className="bg-white pt-10 pb-0 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-gray font-heading mb-2">
              Summer in Action
            </h2>
            <p className="text-base text-gray-500 font-body">
              Wondering what a day here really looks like? Here&apos;s a glimpse
              at our summer.
            </p>
          </motion.div>
        </div>
      </section>
      <WeekRecapPreview className="bg-white" />

      {/* ───────────────────────────────────────────
          5. ABOUT SAGE FIELD — "What We're Building"
      ─────────────────────────────────────────── */}
      <section
        id="about-sage-field"
        className="bg-white py-16 px-8 sm:px-12 lg:px-16"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-badge-bg px-5 py-2 rounded-full text-sm font-semibold text-text-gray font-body mb-4">
              Our School
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-gray font-heading">
              Sage Field Private Microschool
            </h2>
            <p className="text-base md:text-lg text-text-gray font-body mt-3">
              Outdoor-centered. Small-group. Deeply intentional.
            </p>

            {/* Stat pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {[
                { big: "Ages 4–11", label: "" },
                { big: "Max 10–12", label: "per class" },
                { big: "Round Rock", label: "TX" },
              ].map((stat) => (
                <span
                  key={stat.big}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-semibold px-5 py-2 rounded-full text-sm font-body"
                >
                  <strong>{stat.big}</strong>
                  {stat.label && (
                    <span className="text-text-gray font-normal">
                      {stat.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 3 Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🌿",
                title: "Outdoor-Centered",
                desc: "Real learning happens outside. Nature is woven into every part of our day.",
              },
              {
                icon: "📖",
                title: "We Love Learning",
                desc: "Reading, math, science, and citizenship — taught with depth and care.",
              },
              {
                icon: "🤝",
                title: "Family Partnership",
                desc: "We stay in close communication. You always know what your child experienced.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="bg-welcome-bg rounded-2xl p-6 shadow-sm text-center space-y-3"
              >
                <span className="text-4xl">{card.icon}</span>
                <h3 className="text-lg font-bold text-text-gray font-heading">
                  {card.title}
                </h3>
                <p className="text-sm text-text-gray font-body leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          6. EDUCATIONAL PHILOSOPHY PILLARS
      ─────────────────────────────────────────── */}
      <section className="bg-sage-50 py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-block bg-badge-bg px-5 py-2 rounded-full text-sm font-semibold text-text-gray font-body mb-4">
              Our Philosophy
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-gray font-heading">
              How We Teach
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {PHILOSOPHY_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xl">{pillar.icon}</p>
                  <p className="text-sm font-bold text-text-gray font-heading">
                    {pillar.title}
                  </p>
                  <p className="text-xs text-text-gray font-body leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          7. PROGRAMS SECTION
      ─────────────────────────────────────────── */}
      <WhatWeOfferSection />

      {/* ───────────────────────────────────────────
          8. RSVP SECTION (Bottom CTA)
      ─────────────────────────────────────────── */}
      <section
        id="rsvp-section"
        className="py-20 px-8 sm:px-12 lg:px-16 bg-welcome-bg"
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-block bg-badge-bg px-5 py-2 rounded-full text-sm font-semibold text-text-gray font-body mb-2">
              You&apos;re Invited
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading leading-tight text-text-gray">
              We&apos;d Love to See You There
            </h2>
            <p className="text-lg text-gray-500 font-body leading-relaxed">
              Come meet Miss Joy, see our classroom, and discover why Sage Field
              families love what we&apos;re building here.
            </p>
          </motion.div>

          {/* Event details pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: "📅", label: "Monday, July 13" },
              { icon: "🕔", label: "5:30 PM – 6:30 PM" },
              { icon: "📍", label: "2760 Gattis School Rd, Round Rock" },
            ].map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-text-gray font-body shadow-sm"
              >
                <span>{pill.icon}</span>
                {pill.label}
              </span>
            ))}
          </motion.div>

          {/* Inline RSVP Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {submitted ? (
              <div className="sm:bg-white sm:rounded-2xl sm:shadow-md sm:p-8 px-0 py-0 text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <h3 className="text-2xl font-bold text-text-gray font-heading">
                  You&apos;re on the list!
                </h3>
                <p className="text-base text-gray-500 font-body leading-relaxed">
                  We&apos;ve received your RSVP and sent a confirmation to your
                  email. We can&apos;t wait to see you on{" "}
                  <strong>Monday, July 13</strong>!
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleRSVPSubmit}
                className="text-left space-y-5 sm:bg-white sm:rounded-2xl sm:shadow-md sm:p-8 px-0 py-0"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-gray font-body">
                      Parent / Guardian Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-gray font-body">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-gray font-body">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="(512) 555-0100"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-gray font-body">
                      Child&apos;s Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Smith"
                      required
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-gray font-body">
                      Child&apos;s Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="4"
                      min={1}
                      max={12}
                      required
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-gray font-body">
                      Number of Adults Attending{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={adultsAttending}
                      onChange={(e) => setAdultsAttending(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Select…</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3+">3+</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-gray font-body">
                    Questions or Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Anything you'd like us to know…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-body text-text-gray placeholder-gray-400 bg-white sm:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                {formError && (
                  <p className="text-sm text-red-500 font-body">{formError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold px-8 py-4 rounded-xl text-base font-body shadow-md transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "RSVP — I'll Be There →"}
                </button>
              </form>
            )}
          </motion.div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500 font-body">
              No enrollment required. Free to attend. Open to all families.
            </p>
            <p className="text-sm text-gray-400 font-body">
              Questions?{" "}
              <Link
                href="/contact"
                className="text-primary underline underline-offset-2 hover:text-primary-hover transition-colors"
              >
                Reach out via our contact page
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────
          9. SUMMER HIGHLIGHTS — Week Cards
      ─────────────────────────────────────────── */}
      <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-block bg-badge-bg px-5 py-2 rounded-full text-sm font-semibold text-text-gray font-body mb-4">
              Summer Highlights
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-gray font-heading">
              6 Weeks of Learning & Adventure
            </h2>
            <p className="text-base text-text-gray font-body mt-3">
              We&apos;re 6 weeks in — see what your child has been up to.
            </p>
          </motion.div>

          {/* Mobile: horizontal scroll, sm+: 3-col grid */}
          <div className="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
            {PREVIEW_WEEKS.map((week, i) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="w-[72vw] shrink-0 sm:w-auto sm:shrink bg-white rounded-2xl overflow-hidden shadow-md"
              >
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={week.coverImage}
                    alt={`Week ${week.week} — ${week.theme}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 72vw, 33vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full font-body">
                      Week {week.week}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-xs text-gray-400 font-body">
                    {week.dates}
                  </p>
                  <p className="text-sm font-bold text-text-gray font-heading leading-snug">
                    {week.theme}
                  </p>
                  <Link
                    href={week.href}
                    className="inline-block text-xs text-primary font-semibold font-body mt-1 hover:underline"
                  >
                    View Recap →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/highlights"
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-7 py-3 rounded-xl text-sm font-body shadow-md transition-colors duration-200"
            >
              See All Summer Highlights →
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating RSVP bar — mobile only */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
      >
        <div className="bg-sage-700 rounded-2xl shadow-xl flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <p className="text-white font-heading font-bold text-sm leading-tight">
              Meet Miss Joy — July 13
            </p>
            <p className="text-white/75 font-body text-xs">
              Free event · RSVP today
            </p>
          </div>
          <button
            onClick={scrollToRSVP}
            className="flex-shrink-0 bg-white text-sage-700 font-semibold text-sm font-body px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            RSVP →
          </button>
        </div>
      </motion.div>

      <WaitlistDialog
        isOpen={isWaitlistDialogOpen}
        onClose={() => setIsWaitlistDialogOpen(false)}
      />
    </div>
  );
}
