"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaitlistDialog from "../components/WaitlistDialog";

const details = [
  { label: "Dates", value: "May 26 – Aug 20, 2026" },
  { label: "Ages", value: "4–10 years" },
  { label: "Schedule", value: "Mon–Thu, ~6 hrs/day" },
  { label: "Group Size", value: "15–20 children" },
];

const weeks = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Camp",
    highlights: ["Kick-off games & camp orientation", "Water balloon races", "Musical hula hoops"],
  },
  {
    week: 2,
    dates: "Jun 1–4",
    theme: "Mystery Escape & Foam Party",
    highlights: ["Giant slip & slide", "Crab soccer", "The floor is lava"],
  },
  {
    week: 3,
    dates: "Jun 8–11",
    theme: "Beach Day Bash",
    highlights: ["Ice cream bar", "Tug of war", "Ocean slime making"],
  },
  {
    week: 4,
    dates: "Jun 15–18",
    theme: "Science & Engineering Lab",
    highlights: ["Treasure map expedition", "Slime lab", "Bridge building challenge"],
  },
  {
    week: 5,
    dates: "Jun 22–25",
    theme: "Safari Adventure",
    highlights: ["Safari journals", "Habitat building", "Nature sketching"],
  },
  {
    week: 6,
    dates: "Jun 29–Jul 2",
    theme: "Splash Into Summer",
    highlights: ["Water relay races", "Sponge dodgeball", "Splash pad games"],
  },
  {
    week: 7,
    dates: "Jul 6–9",
    theme: "Dino Hunt",
    highlights: ["Dinosaur dig", "Dino egg hunt", "Dino tag"],
  },
  {
    week: 8,
    dates: "Jul 13–16",
    theme: "Pirate Adventure",
    highlights: ["Treasure hunt", "Plank walk challenge", "Pirate relay races"],
  },
  {
    week: 9,
    dates: "Jul 20–23",
    theme: "Superhero Week",
    highlights: ["Superhero obstacle course", "Strength games", "Team bingo"],
  },
  {
    week: 10,
    dates: "Jul 27–30",
    theme: "Space Explorers",
    highlights: ["Rocket launch games", "Alien tag", "Planet hunt"],
  },
  {
    week: 11,
    dates: "Aug 3–6",
    theme: "Down on the Farm",
    highlights: ["Sack races", "Garden scavenger hunt", "Egg & spoon relay"],
  },
  {
    week: 12,
    dates: "Aug 17–20",
    theme: "Camp Finale",
    highlights: ["Camp celebration", "Memory scrapbook", "Friendship activities"],
  },
];

export default function Summer2026Page() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const router = useRouter();

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
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Summer 2026
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Summer 2026 Program
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            May 26 – August 20, 2026 · 13 Weeks · Mon–Thu
          </motion.p>
        </div>
      </section>

      {/* Program Summary */}
      <section className="pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="space-y-4 mb-10"
          >
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              Our Summer 2026 program is a thirteen-week immersive experience designed for curious learners ages 4–10. Each day blends hands-on projects, nature exploration, literacy and math support, art, music, and plenty of time for creative play—all in a small, nurturing group setting of 15–20 children, Monday through Thursday, approximately six hours a day.
            </p>
            <p className="text-lg text-gray-600 font-body leading-relaxed">
              This is an ideal introduction to Sage Field before committing to a full school year. Families who complete the summer program will have priority consideration for School Year 2026–2027 enrollment.
            </p>
          </motion.div>

          {/* Key Details Cards */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
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

      {/* Weekly Activity Breakdown */}
      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
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
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-white bg-primary rounded-full px-2.5 py-0.5 font-body">
                    Week {w.week}
                  </span>
                  <span className="text-xs text-gray-400 font-body">{w.dates}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 font-heading mb-2 leading-snug">
                  {w.theme}
                </h3>
                <ul className="space-y-1">
                  {w.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-1.5 text-xs text-gray-600 font-body">
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

      {/* Enrollment CTA */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-bold text-gray-800 font-heading mb-2">
              Ready to join us this summer?
            </h2>
            <p className="text-gray-500 font-body text-sm mb-6">
              Spots are limited — apply early to secure your child&apos;s place in the Summer 2026 program.
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

      <WaitlistDialog isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </div>
  );
}
