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
import SummerProgramCard from "../components/SummerProgramCard";
import AfterCareCard from "../components/AfterCareCard";
import FieldDayFridayCard from "../components/FieldDayFridayCard";
import MeetTheTeamSection from "../components/MeetTheTeamSection";

const details = [
  { label: "Dates", value: "May 26 – Aug 13, 2026" },
  { label: "Ages", value: "4–11 years" },
  { label: "Schedule", value: "Mon–Thu, ~6 hrs/day" },
  { label: "Group Size", value: "10 children" },
];

const weeks = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Camp",
    highlights: [
      "Camp Kick-Off Games",
      "Water Balloon Race and Toss",
      "Musical Hulahoops",
      "Cross the River",
      "Camp Name Tags",
      "Paper Plate Sun Craft",
      "Leaf Rubbing Art",
      "Friendship Bracelets",
    ],
  },
  {
    week: 2,
    dates: "Jun 1–4",
    theme: "Mystery Camp Escape Challenge",
    highlights: [
      "Giant Slip and Slide",
      "Chicken Enrichment Toys",
      "Crab Soccer",
      "The Floor is Lava",
      "Painted Stones",
      "Chicken Wood Painting",
      "Nature Paint",
      "DIY Camp Flags",
    ],
  },
  {
    week: 3,
    dates: "Jun 8–11",
    theme: "Beach Day Bash",
    highlights: [
      "Ice Cream Bar",
      "Tug of War & Field Games",
      "Ocean Slime",
      "Paper Plate Swimming Fish",
      "Medal Making",
      "Sports Jersey Art",
      "Seashell Painting",
      "DIY Sea Animal",
    ],
  },
  {
    week: 4,
    dates: "Jun 15–18",
    theme: "Scientist and Space Engineering Lab",
    highlights: [
      "Treasure Map Expedition",
      "Puppet Safari Skit",
      "Slime Lab",
      "Build a Bridge Challenge",
      "Volcano Model",
      "Rocket Ship Craft",
      "Galaxy Slime",
      "Popsicle Stick Bridge",
    ],
  },
  {
    week: 5,
    dates: "Jun 22–25",
    theme: "Safari Escape",
    highlights: [
      "Safari Journals",
      "Safari Bingo",
      "Build a Habitat",
      "Nature Sketching",
      "Animal Masks",
      "Paper Plate Lions",
      "Clay Animal Sculptures",
      "Animal Footprint Activity",
    ],
  },
  {
    week: 6,
    dates: "Jun 29–Jul 2",
    theme: "Splash Into Summer",
    highlights: [
      "Water Relay Races",
      "Sponge Dodgeball",
      "Splash Pad Games",
      "Beach Ball Volleyball",
      "Tie Dye Bandanas",
      "Paper Boats",
      "Paper Plate Jellyfish",
      "Sand Art",
    ],
  },
  {
    week: 7,
    dates: "Jul 6–9",
    theme: "Dino Hunt",
    highlights: [
      "Dinosaur Dig",
      "Dino Egg Hunt",
      "Build a Dino Habitat",
      "Dino Tag",
      "Dinosaur Fossils",
      "Paper Plate Dinosaurs",
      "Dino Footprint Clay Painting",
      "Moon Sand",
    ],
  },
  {
    week: 8,
    dates: "Jul 13–16",
    theme: "Pirate Adventure",
    highlights: [
      "X Marks the Spot",
      "Walk the Plank Game",
      "Build a Pirate Ship",
      "Pirate Relay Races",
      "Pirate Hats",
      "Treasure Maps",
      "Cardboard Boats",
      "Beaded Eye Patches",
    ],
  },
  {
    week: 9,
    dates: "Jul 20–23",
    theme: "You are a Superhero!",
    highlights: [
      "Trip to the 'Movies'",
      "Bingo",
      "Super Strength Games",
      "Hero Obstacle Course",
      "Design Your Superhero",
      "Superhero Masks",
      "Comic Strip Art",
      "Cape Decorating",
    ],
  },
  {
    week: 10,
    dates: "Jul 27–30",
    theme: "Space Explorers: Mission to the Stars",
    highlights: [
      "Space Trivia",
      "Rocket Launch Game",
      "Alien Tag",
      "Planet Scavenger Hunt",
      "Galaxy Paintings",
      "Straw Rockets",
      "Alien Headbands",
      "Planet Craft",
    ],
  },
  {
    week: 11,
    dates: "Aug 3–6",
    theme: "Down on the Farm",
    highlights: [
      "Sack Races",
      "Garden Scavenger Hunt",
      "Dance Party Games",
      "Egg and Spoon Relay",
      "Barn Collage",
      "Flower Pot Painting",
      "Paper Plate Chickens",
      "Vegetable Stamp Art",
    ],
  },
  {
    week: 12,
    dates: "Aug 10–13",
    theme: "Finale of Camp",
    highlights: [
      "Friendship Bracelets",
      "Group Banner",
      "Photo Booth",
      "Camp Celebration Party",
      "Decorate Camp T-Shirts",
      "Friendship Necklaces",
      "Camp Memory Scrapbook",
      "Thank-You Cards",
    ],
  },
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

export default function Summer2026Page() {
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
              Summer 2026
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Summer 2026 Program
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            May 26 – August 13, 2026 · 12 Weeks · Mon–Thu
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
            <p className="text-lg text-gray-600 font-body leading-relaxed text-center">
              Our Summer 2026 program is a twelve-week academic enrichment
              session designed for curious learners ages 4–11. Each day features
              structured, teacher-led instruction in literacy and mathematics,
              complemented by specialized modules in nature study, fine arts,
              music, cooking, and social-emotional development. We operate as a
              full-day school, maintaining a consistent academic schedule,
              attendance records, and small-group instructional cohorts from
              Monday through Thursday. This program is designed as a formal
              extension of our private-school curriculum to support student
              progress, and functions as an academic institution rather than a
              child care or camp program.
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

      {/* Week 1 Highlights Preview */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
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
            {/* Recap text — full width */}
            <p className="text-base text-gray-600 font-body leading-relaxed">
              Students spent the week learning by doing — building foundations in literacy and math, exploring science, expressing themselves through art, and growing into a real community together. They cooked pizzas, made strawberry ice cream, and were already using Spanish in daily conversations by Friday.
            </p>

            {/* Compact track cards — side by side */}
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

      {/* Daily Schedule */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Daily Schedule
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-8">
              A Typical Day at Sage Field
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-heading font-bold text-lg text-gray-800">
                  Daily Schedule
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  {
                    time: "8:15 – 9:00 AM",
                    activity: "Drop Off / Outdoor Play 🌞",
                  },
                  {
                    time: "9:00 – 9:15 AM",
                    activity: "Morning Meeting (Good Citizenship) 🌟",
                  },
                  {
                    time: "9:15 – 9:30 AM",
                    activity: "ELA Challenger Block 📚",
                  },
                  {
                    time: "9:30 – 9:45 AM",
                    activity: "Math Challenger Block 🔢",
                  },
                  { time: "9:45 – 10:15 AM", activity: "Snack 🍎" },
                  { time: "10:15 – 10:45 AM", activity: "Daily Activity 🌟" },
                  { time: "10:45 – 11:15 AM", activity: "Art 🎨" },
                  { time: "11:15 – 11:30 AM", activity: "Music 🎵" },
                  { time: "11:30 AM – 12:15 PM", activity: "Lunch 🍱" },
                  { time: "12:15 – 1:15 PM", activity: "Water Play 💦" },
                  {
                    time: "1:15 – 1:45 PM",
                    activity: "Journaling & Reflection 📝",
                  },
                  {
                    time: "1:45 – 2:30 PM",
                    activity:
                      "Cooking / Homesteading (Animal & Garden Care) 🌱",
                  },
                  {
                    time: "1:45 – 2:45 PM",
                    activity: "Outdoor Free Choice 🧸",
                  },
                  { time: "2:45 – 3:00 PM", activity: "Afternoon Meeting 🌤️" },
                  {
                    time: "2:45 – 3:00 PM",
                    activity: "Pick Up / Outdoor Play 🌳",
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-6 py-3 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-800 font-body">
                      {row.activity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Weekly Activity Breakdown */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
              Weekly Breakdown
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading">
              12 Weeks of Adventure
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weeks.map((w, i) => (
              <motion.div
                key={w.week}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + i * 0.05,
                  ease: "easeOut" as const,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-white bg-primary rounded-full px-2.5 py-0.5 font-body">
                    Week {w.week}
                  </span>
                  <span className="text-xs text-gray-400 font-body">
                    {w.dates}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 font-heading mb-2 leading-snug">
                  {w.theme}
                </h3>
                <ul className="space-y-1">
                  {w.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-1.5 text-xs text-gray-600 font-body"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Field Day Fridays */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4">
              Optional Add-On
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 font-heading mb-4">
              <span className="text-primary">Field Day</span> Fridays
            </h2>
            <p className="text-gray-500 font-body text-base mb-8 max-w-xl mx-auto">
              For families seeking additional experiential learning, we offer
              optional ‘Field Study Fridays’ from 9:00 a.m. to 1:00 p.m. These
              sessions provide an immersive, instructor-led outdoor curriculum
              designed to expand upon our nature-study modules. Each Friday
              serves as a purposeful field-learning experience where students
              engage in in-depth exploration, scientific inquiry, and
              environmental education within a structured academic framework.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🌿</span>
              <span className="text-sm font-semibold text-primary font-body">
                Outdoor &amp; Nature
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🕘</span>
              <span className="text-sm font-semibold text-primary font-body">
                9 am – 1 pm
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>✅</span>
              <span className="text-sm font-semibold text-primary font-body">
                Optional Add-On
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/10 rounded-full">
              <span>🎉</span>
              <span className="text-sm font-semibold text-primary font-body">
                Unique Each Week
              </span>
            </div>
          </motion.div>
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
              Not ready for a full summer commitment? Homeschool families can
              drop in 1–5 days per week and still get the full Sage Field
              experience — every enrichment, every adventure.
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

      {/* Summer Blurb */}
      {/* <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            <p className="text-base text-gray-600 font-body leading-relaxed">
              Summer at Sage Field is a season of sunshine, discovery, and play!
              Each day is filled with outdoor adventures, daily water play,
              music, art (both guided and free exploration), and ever-changing
              hands-on activities that spark imagination and joy. We focus on
              creating a space where children can explore, make friends, and
              simply enjoy being kids.
            </p>
            <p className="text-base text-gray-600 font-body leading-relaxed">
              Amid all the fun, we also keep minds curious and confident with
              short, engaging academic blocks—15 minutes each of reading and
              English, math, and writing. Our teachers individualize learning
              for every child, meeting them right where they are and turning
              lessons into exciting, achievable challenges. This gentle rhythm
              keeps learning meaningful and fun while helping students
              transition smoothly into the new school year.
            </p>
          </motion.div>
        </div>
      </section> */}

      {/* Meet the Team */}
      <MeetTheTeamSection featured={false} exclude={["Paige Wood"]} />

      {/* Summer Tuition */}
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
              Summer Program Pricing
            </h2>
          </motion.div>

          <div className="mb-8">
            <SummerProgramCard onQuestionsClick={() => setWaitlistOpen(true)} />
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
              Ready to join us this summer?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-6">
              Spots are limited — apply early to secure your child&apos;s place
              in the Summer 2026 program.
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

      <Footer />

      <WaitlistDialog
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
      <FloatingSMSButton />
    </div>
  );
}
