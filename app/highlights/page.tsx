"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";

interface WeekEntry {
  week: number;
  dates: string;
  theme: string;
  href?: string;
  coverImage?: string;
}

const WEEKS: WeekEntry[] = [
  {
    week: 1,
    dates: "May 26–29",
    theme: "Welcome to Summer",
    href: "/highlights/summer/week-1",
    coverImage:
      "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  },
  { week: 2, dates: "Jun 1–4", theme: "Mystery Camp Escape Challenge" },
  { week: 3, dates: "Jun 8–11", theme: "Beach Day Bash" },
  { week: 4, dates: "Jun 15–18", theme: "Scientist and Space Engineering Lab" },
  { week: 5, dates: "Jun 22–25", theme: "Safari Escape" },
  { week: 6, dates: "Jun 29–Jul 2", theme: "Splash Into Summer" },
  { week: 7, dates: "Jul 6–9", theme: "Dino Hunt" },
  { week: 8, dates: "Jul 13–16", theme: "Pirate Adventure" },
  { week: 9, dates: "Jul 20–23", theme: "You are a Superhero!" },
  {
    week: 10,
    dates: "Jul 27–30",
    theme: "Space Explorers: Mission to the Stars",
  },
  { week: 11, dates: "Aug 3–6", theme: "Down on the Farm" },
  { week: 12, dates: "Aug 10–13", theme: "Finale of Camp" },
];

export default function HighlightsIndexPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      {/* Header */}
      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Summer 2026
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-bold font-heading text-gray-800 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Program Highlights
          </motion.h1>
          <motion.p
            className="text-lg text-gray-500 font-body max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A look back at each week of our Summer 2026 program — photos,
            lessons, and memories.
          </motion.p>
        </div>
      </section>

      {/* Week cards grid */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WEEKS.filter((entry) => !!entry.href).map((entry, i) => {
            const isLive = !!entry.href;

            const cardInner = (
              <motion.div
                className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 ${
                  isLive
                    ? "hover:shadow-md hover:scale-[1.02] cursor-pointer"
                    : "opacity-70"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                {/* Cover image */}
                <div className="relative w-full aspect-[4/3] bg-gray-100">
                  {isLive && entry.coverImage ? (
                    <Image
                      src={entry.coverImage}
                      alt={`Week ${entry.week} — ${entry.theme}`}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📅</span>
                      <span className="text-xs font-semibold text-gray-400 font-body">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {/* Week badge over image */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-full font-body shadow-sm">
                    Week {entry.week}
                  </span>

                  {/* Live indicator */}
                  {isLive && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-sage-700 text-xs font-bold rounded-full font-body shadow-sm">
                      ✓ Live
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <p className="text-xs text-gray-400 font-body mb-1">
                    {entry.dates}
                  </p>
                  <h3 className="text-base font-bold font-heading text-gray-800 mb-3 leading-snug">
                    {isLive ? entry.theme : "Coming Soon"}
                  </h3>
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary font-body group-hover:underline">
                      View Highlights →
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-body italic">
                      Recap will be posted after the week ends
                    </span>
                  )}
                </div>
              </motion.div>
            );

            return isLive ? (
              <Link key={entry.week} href={entry.href!} className="block">
                {cardInner}
              </Link>
            ) : (
              <div key={entry.week}>{cardInner}</div>
            );
          })}
        </div>
      </section>

      <Footer />

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>
    </div>
  );
}
