"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const DASHBOARD_ANNOUNCEMENTS = [
  {
    short: "💳 Tuition payment due",
    full: "💳 Your tuition payment is due — pay now to secure your child's spot.",
    buttonLabel: "Pay Now",
    href: "/parent/billing",
  },
  {
    short: "👨‍👩‍👧 Refer a family",
    full: "👨‍👩‍👧 Know a family who'd love Sage Field? Refer them and earn rewards!",
    buttonLabel: "Refer Now",
    href: "/parent/home",
  },
  {
    short: "📰 New post today",
    full: "📰 There's a new post in the parent feed — check it out!",
    buttonLabel: "View Feed",
    href: "/parent/feed",
  },
  {
    short: "📅 Upcoming events",
    full: "📅 Don't miss upcoming school events — view the calendar!",
    buttonLabel: "View Calendar",
    href: "/parent/calendar",
  },
  {
    short: "🏡 Meet other families",
    full: "🏡 Introduce yourself and connect with parents & teachers in the community!",
    buttonLabel: "Join Community",
    href: "/parent/messages?tab=community",
  },
  {
    short: "📱 Download our app!",
    full: "📱 The Sage Field app is now available — download it today!",
    buttonLabel: "Download",
    href: "/download",
  },
];

interface DashboardHeaderProps {
  sticky?: boolean;
  children: React.ReactNode;
}

export default function DashboardHeader({
  sticky = false,
  children,
}: DashboardHeaderProps) {
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementDirection, setAnnouncementDirection] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setAnnouncementDirection(1);
      setAnnouncementIndex((i) => (i + 1) % DASHBOARD_ANNOUNCEMENTS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={sticky ? "sticky top-0 z-50" : "relative"}>
      <div className="w-full bg-[#4a7c59] text-white text-sm py-1.5 px-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={announcementDirection}>
          <motion.div
            key={announcementIndex}
            custom={announcementDirection}
            variants={{
              enter: (dir: number) => ({ opacity: 0, y: dir * 16 }),
              center: { opacity: 1, y: 0 },
              exit: (dir: number) => ({ opacity: 0, y: dir * -16 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" as const }}
            className="flex items-center justify-center gap-3"
          >
            <span className="sm:hidden">
              {DASHBOARD_ANNOUNCEMENTS[announcementIndex].short}
            </span>
            <span className="hidden sm:inline">
              {DASHBOARD_ANNOUNCEMENTS[announcementIndex].full}
            </span>
            <Link
              href={DASHBOARD_ANNOUNCEMENTS[announcementIndex].href}
              className="shrink-0 bg-white text-[#4a7c59] font-semibold text-xs px-3 py-1 rounded-full hover:bg-welcome-bg transition-colors"
            >
              {DASHBOARD_ANNOUNCEMENTS[announcementIndex].buttonLabel}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center *:first:hidden *:first:md:flex">
        {children}
      </header>
    </div>
  );
}
