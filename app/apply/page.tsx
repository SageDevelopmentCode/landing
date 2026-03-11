"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Tab = "summer" | "school-year";

const tabContent = {
  summer: {
    badge: "Summer 2026",
    title: "Summer 2026 Program",
    description: [
      "Our Summer 2026 program is a twelve-week immersive experience designed for curious learners ages 4–10. Each day blends hands-on projects, nature exploration, literacy and math support, and plenty of time for creative play—all in a small, nurturing group setting.",
      "This is an ideal way to experience Sage Field before committing to a full school year. Families who complete the summer program and wish to continue will have priority consideration for School Year 2026–2027 enrollment.",
    ],
    details: [
      { label: "Dates", value: "May 26 – August 20, 2026" },
      { label: "Ages", value: "4–10 years" },
      { label: "Schedule", value: "Mon–Thu, ~6 hrs/day" },
      { label: "Group Size", value: "10 children" },
    ],
    images: [
      "/assets/After1.png",
      "/assets/ImageOne.jpg",
      "/assets/After2.png",
    ],
  },
  "school-year": {
    badge: "School Year 2026",
    title: "School Year 2026–2027",
    description: [
      "The School Year 2026–2027 program runs as a six-month commitment, offering up to four days per week of enriched learning for children ages 4-11. Students receive individualized support in literacy and numeracy alongside science, art, movement, and social-emotional learning.",
      "Enrollment is limited to preserve the small-group environment that makes Sage Field special. Families begin with an application and a mutual-fit conversation to ensure the program is the right match for your child.",
    ],
    details: [
      { label: "Start Date", value: "September 8, 2026" },
      { label: "Ages", value: "4-11 years" },
      { label: "Schedule", value: "Up to 4 days/week" },
      { label: "Term", value: "6-month commitment" },
    ],
    images: ["/assets/After1.png", "/assets/After2.png", "/assets/After3.png"],
  },
};

export default function ApplyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("summer");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Enrollment
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Apply to Sage Field
          </motion.h1>
        </div>
      </section>

      {/* Two-Column Content Section */}
      <section className="pb-16 pt-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
            >
              {/* LEFT COLUMN — content */}
              <div className="lg:col-span-7">
                {/* Tab Switcher */}
                <div className="flex gap-3 flex-wrap mb-6">
                  {(["summer", "school-year"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 rounded-full font-semibold font-body transition-all duration-200 cursor-pointer ${
                        activeTab === tab
                          ? "bg-primary text-white shadow-md"
                          : "border-2 border-gray-300 text-gray-600 bg-white hover:border-primary"
                      }`}
                    >
                      {tab === "summer" ? "Summer 2026" : "School Year 2026"}
                    </button>
                  ))}
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
                      className="text-lg text-gray-600 font-body leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
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

                {/* Image Gallery */}
                <div className="mb-10">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg mb-3">
                    <img
                      src={tabContent[activeTab].images[0]}
                      alt="Program photo"
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                      <img
                        src={tabContent[activeTab].images[1]}
                        alt="Program photo"
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                      <img
                        src={tabContent[activeTab].images[2]}
                        alt="Program photo"
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Daily Schedule — Summer only */}
                {activeTab === "summer" && (
                  <div className="mb-10">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-heading font-bold text-lg text-gray-800">
                          Daily Schedule
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {[
                          {
                            time: "8:30 – 9:00 AM",
                            activity: "Check-In & Free Play 🌞",
                          },
                          {
                            time: "9:00 – 9:15 AM",
                            activity: "Good Citizenship Meeting 🌟",
                          },
                          {
                            time: "9:15 – 9:30 AM",
                            activity: "ELA Math Challenger Block 📚",
                          },
                          {
                            time: "9:30 – 9:45 AM",
                            activity: "Math Academic Block 🔢",
                          },
                          {
                            time: "9:45 – 10:15 AM",
                            activity: "Morning Snack Break 🍎",
                          },
                          {
                            time: "10:15 – 10:45 AM",
                            activity: "Daily Activity 🌟",
                          },
                          { time: "10:45 – 11:15 AM", activity: "Art 🎨" },
                          { time: "11:15 – 11:30 AM", activity: "Music 🎵" },
                          { time: "11:30 AM – 12:15 PM", activity: "Lunch 🍱" },
                          {
                            time: "12:15 – 1:15 PM",
                            activity: "Water Play 💦",
                          },
                          {
                            time: "1:15 – 1:45 PM",
                            activity: "Journaling & Reflection 📝",
                          },
                          {
                            time: "1:45 – 2:30 PM",
                            activity: "Homesteading 🌱",
                          },
                          {
                            time: "2:30 – 3:30 PM",
                            activity: "Outdoor Exploration & Dismissal 🧸",
                          },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-4 px-6 py-3 ${
                              i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                            }`}
                          >
                            <span className="text-xs text-gray-400 font-body whitespace-nowrap w-36 shrink-0">
                              {row.time}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 font-body">
                              {row.activity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Educational Philosophy — Summer 2026 only */}
                {activeTab === "summer" && (
                  <motion.div
                    className="border-t border-gray-100 pt-10 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          icon: "🌱",
                          title: "Hands-on Learning",
                          description:
                            "Experiential activities that engage curiosity",
                        },
                        {
                          icon: "🧘",
                          title: "Emotional Regulation",
                          description:
                            "Mindfulness practices for students & educators",
                        },
                        {
                          icon: "🎨",
                          title: "Creative Expression",
                          description:
                            "Artistic and musical creativity flourish",
                        },
                        {
                          icon: "🌳",
                          title: "Movement & Nature",
                          description: "Movement-based and outdoor education",
                        },
                      ].map((pillar, index) => (
                        <motion.div
                          key={index}
                          className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: 0.1 + index * 0.1,
                            ease: "easeOut",
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
                  </motion.div>
                )}

                {/* A Day in the Life — Summer 2026 only */}
                {activeTab === "summer" && (
                  <motion.div
                    className="mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    {/* Badge */}
                    <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-6">
                      Sample Curriculum
                    </span>

                    <h2 className="text-2xl md:text-3xl font-bold text-black font-heading mb-6">
                      A Day in the Life
                    </h2>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      {/* Active Adventures */}
                      <p className="text-sm font-bold text-gray-500 font-heading uppercase tracking-wide mb-4">
                        Active Adventures
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                          {
                            emoji: "💦",
                            title: "Giant Slip & Slide",
                            desc: "\u201cCool off and race down the big slide\u201d",
                          },
                          {
                            emoji: "🌈",
                            title: "Rainbow Foam Party",
                            desc: "\u201cSplash through colorful foam clouds\u201d",
                          },
                          {
                            emoji: "🏞️",
                            title: "Cross the River",
                            desc: "\u201cHop across lily pads without falling in\u201d",
                          },
                          {
                            emoji: "🌋",
                            title: "The Floor is Lava",
                            desc: "\u201cJump, dodge, and survive the eruption\u201d",
                          },
                          {
                            emoji: "🎶",
                            title: "Musical Hula Hoops",
                            desc: "\u201cDance, move, and claim your hoop\u201d",
                          },
                        ].map((activity) => (
                          <div
                            key={activity.title}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <span className="text-2xl leading-none">
                              {activity.emoji}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-gray-800 font-body leading-tight">
                                {activity.title}
                              </p>
                              <p className="text-xs text-text-gray font-body mt-0.5">
                                {activity.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 mb-6" />

                      {/* Creative Crafts */}
                      <p className="text-sm font-bold text-gray-500 font-heading uppercase tracking-wide mb-4">
                        Creative Crafts
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            emoji: "🎨",
                            title: "Nature Paint",
                            desc: "Use leaves, sticks & mud as your brush",
                          },
                          {
                            emoji: "🍃",
                            title: "Leaf Rubbing Art",
                            desc: "Reveal hidden patterns from nature",
                          },
                          {
                            emoji: "🪢",
                            title: "Friendship Bracelets",
                            desc: "Weave a bracelet to share with a friend",
                          },
                        ].map((craft) => (
                          <div
                            key={craft.title}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <span className="text-2xl leading-none">
                              {craft.emoji}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-gray-800 font-body leading-tight">
                                {craft.title}
                              </p>
                              <p className="text-xs text-text-gray font-body mt-0.5">
                                {craft.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mobile CTA — visible only below lg */}
                <div className="lg:hidden">
                  <button
                    onClick={() => router.push("/apply/start")}
                    className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
                  >
                    Start Application
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN — sticky CTA */}
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                {/* CTA Card */}
                <div className="mt-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-xl text-gray-800 mb-2">
                    Ready to apply?
                  </h3>
                  <p className="text-gray-500 font-body text-sm mb-4">
                    Spots are limited — apply early to secure your child&apos;s
                    place.
                  </p>
                  <button
                    onClick={() => router.push("/apply/start")}
                    className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer"
                  >
                    Start Application
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
}
