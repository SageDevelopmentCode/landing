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

const SCHOOL_YEAR_WEEKS: WeekEntry[] = [
  {
    week: 2,
    dates: "Aug 24–28",
    theme: "Gardening, Growing & Construction Zone",
    href: "/highlights/school-year/week-2",
    coverImage:
      "/assets/highlights/school_week_two/C789A2F8-D5D0-48AE-9C6C-153410CB374F.JPG",
  },
  {
    week: 1,
    dates: "Aug 17–21",
    theme: "First Week of School",
    href: "/highlights/school-year/week-1",
    coverImage:
      "/assets/highlights/school_week_one/B5E9BAE4-8895-4A91-BE6A-E8D0232594E0 2.JPG",
  },
];

const SUMMER_WEEKS: WeekEntry[] = [
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
    coverImage: "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  },
  {
    week: 3,
    dates: "Jun 9–13",
    theme: "Beach Day Bash",
    href: "/highlights/summer/week-3",
    coverImage: "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  },
  {
    week: 4,
    dates: "Jun 16–20",
    theme: "STEM Adventure Friday & Strawberry Jam",
    href: "/highlights/summer/week-4",
    coverImage: "/assets/highlights/summer_week_four/C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  },
  {
    week: 5,
    dates: "Jun 22–25",
    theme: "Safari Adventure & Animal Architects",
    href: "/highlights/summer/week-5",
    coverImage: "/assets/highlights/summer_week_five/077864BA-405A-4468-8A16-0FB0AFBC8CB0.JPG",
  },
  {
    week: 6,
    dates: "Jun 29–Jul 2",
    theme: "Cooking, Word Problems & Halfway There",
    href: "/highlights/summer/week-6",
    coverImage: "/assets/highlights/summer_week_six/1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
  },
  { week: 7, dates: "Jul 6–9", theme: "Dino Hunt" },
  { week: 8, dates: "Jul 13–16", theme: "Pirate Adventure" },
  { week: 9, dates: "Jul 20–23", theme: "You are a Superhero!" },
  {
    week: 10,
    dates: "Jul 27–30",
    theme: "Space Explorers: Mission to the Stars",
  },
  { week: 11, dates: "Aug 3–6", theme: "Down on the Farm" },
  {
    week: 12,
    dates: "Aug 10–13",
    theme: "Finale of Camp",
    href: "/highlights/summer/week-12",
    coverImage:
      "/assets/highlights/summer_week_twelve/8C3B1791-0B49-4B7E-B069-C746C7CF6F65.JPG",
  },
];

function WeekCardsGrid({
  weeks,
  sectionKey,
}: {
  weeks: WeekEntry[];
  sectionKey: string;
}) {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {weeks.map((entry, i) => {
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

              <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-full font-body shadow-sm">
                Week {entry.week}
              </span>

              {isLive && (
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-sage-700 text-xs font-bold rounded-full font-body shadow-sm">
                  ✓ Live
                </span>
              )}
            </div>

            <div className="p-5">
              <p className="text-xs text-gray-400 font-body mb-1">{entry.dates}</p>
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
          <Link key={`${sectionKey}-${entry.week}`} href={entry.href!} className="block">
            {cardInner}
          </Link>
        ) : (
          <div key={`${sectionKey}-${entry.week}`}>{cardInner}</div>
        );
      })}
    </div>
  );
}

export default function HighlightsIndexPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-1.5 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Highlights
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
            A look back at each week of our school year and summer programs —
            photos, lessons, and memories.
          </motion.p>
        </div>
      </section>

      <section className="pb-16 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold font-heading text-gray-800 mb-1">
            School Year 2026–27
          </h2>
          <p className="text-sm text-gray-500 font-body">
            Weekly recaps from our school year program.
          </p>
        </div>
        <WeekCardsGrid weeks={SCHOOL_YEAR_WEEKS} sectionKey="school-year" />
      </section>

      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold font-heading text-gray-800 mb-1">
            Summer 2026
          </h2>
          <p className="text-sm text-gray-500 font-body">
            Weekly recaps from our summer program.
          </p>
        </div>
        <WeekCardsGrid
          weeks={SUMMER_WEEKS.filter((entry) => !!entry.href)}
          sectionKey="summer"
        />
      </section>

      <Footer />

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>
    </div>
  );
}
