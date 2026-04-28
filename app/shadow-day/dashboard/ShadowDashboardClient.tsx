"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  CreditCard,
  Users,
  MapPin,
  AlertCircle,
} from "lucide-react";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import HelpWidget from "@/app/parent/components/HelpWidget";

const SHADOW_SCHEDULE = [
  { time: "9:00 – 9:15 AM", activity: "Morning Arrival & Welcome" },
  {
    time: "9:15 – 10:30 AM",
    activity: "Morning Lessons — circle time, collaborative work",
  },
  {
    time: "10:30 – 12:00 PM",
    activity: "Outdoor Learning — nature trails, garden, hands-on science",
  },
  { time: "12:00 – 1:00 PM", activity: "Lunch with Friends" },
  {
    time: "1:00 – 2:45 PM",
    activity: "Afternoon Projects — art, building, creative inquiry",
  },
  {
    time: "2:45 – 3:00 PM",
    activity: "Wrap-Up & Pickup · Ms. Sabrina debrief",
  },
];

interface Booking {
  id: string;
  shadow_date: string;
  first_name: string;
  last_name: string;
  child_name: string;
  child_grade: string | null;
  payment_status: string;
}

function formatShadowDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShadowDateShort(dateStr: string): {
  weekday: string;
  month: string;
  day: string;
  year: string;
} {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    month: d.toLocaleDateString("en-US", { month: "long" }),
    day: String(day),
    year: String(year),
  };
}

export default function ShadowDashboardClient({
  booking,
  userEmail,
  userId,
  fullName,
  profileImageUrl,
}: {
  booking: Booking | null;
  userEmail: string;
  userId: string;
  fullName: string;
  profileImageUrl: string | null;
}) {
  const isPaid = booking?.payment_status === "paid";
  const dateparts = booking ? formatShadowDateShort(booking.shadow_date) : null;

  const checklist = [
    {
      id: "scheduling",
      label: "Shadow Day Scheduled",
      description: booking
        ? `${booking.child_name} is booked for ${formatShadowDate(booking.shadow_date)}`
        : "Your booking has been received.",
      done: true,
      icon: Calendar,
      iconColor: "text-sage-600",
      iconBg: "bg-sage-100",
    },
    {
      id: "payment",
      label: "Complete Payment",
      description: "$95 shadow day fee · waived if you enroll within 14 days.",
      done: isPaid,
      icon: CreditCard,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      badge: isPaid ? undefined : "Coming Soon",
    },
  ];

  const completedCount = checklist.filter((c) => c.done).length;

  return (
    <div className="min-h-screen bg-welcome-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/assets/Logo.png"
            alt="Sage Field"
            width={50}
            height={24}
            className="object-contain"
          />
        </Link>
        <ProfileDropdown
          email={userEmail}
          fullName={fullName}
          userId={userId}
          profileImageUrl={profileImageUrl}
        />
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-10 max-w-6xl mx-auto w-full">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-sm text-gray-400 font-body mb-1">
            Shadow Day Dashboard
          </p>
          <h1 className="text-2xl font-bold font-heading text-gray-800">
            {fullName
              ? `Welcome, ${fullName.split(" ")[0]}!`
              : "Your Shadow Day"}
          </h1>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

            {/* Calendar-style booking card */}
            {booking && dateparts && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Green header strip */}
                <div className="bg-sage-600 px-5 py-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-80 font-body mb-1">
                    {dateparts.weekday}
                  </p>
                  <p className="text-4xl font-bold font-heading leading-none">
                    {dateparts.day}
                  </p>
                  <p className="text-sm font-semibold font-body mt-1 opacity-90">
                    {dateparts.month} {dateparts.year}
                  </p>
                </div>

                {/* Detail rows */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-sage-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-body">
                      Full Day · 9:00 AM – 3:00 PM
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sage-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-body">
                      {booking.child_name}
                      {booking.child_grade ? ` · ${booking.child_grade}` : ""}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 font-body leading-snug">
                      2760 Gattis School Rd
                      <br />
                      Round Rock, TX 78664
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Daily schedule card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide font-body">
                  Your Child&apos;s Day
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {SHADOW_SCHEDULE.map((row, i) => (
                  <div
                    key={i}
                    className={`px-5 py-2.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}
                  >
                    <p className="text-[11px] text-sage-600 font-body font-semibold mb-0.5">
                      {row.time}
                    </p>
                    <p className="text-xs text-gray-700 font-body leading-snug">
                      {row.activity}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT MAIN AREA */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Pending payment banner */}
            {!isPaid && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 }}
                className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-body leading-relaxed">
                  <span className="font-semibold">
                    Your shadow day is not officially confirmed yet.
                  </span>{" "}
                  Your spot is held, but please complete payment once it becomes
                  available to lock in your date. The $95 fee is fully waived if
                  you enroll within 14 days of your child&apos;s visit.
                </p>
              </motion.div>
            )}

            {/* Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide font-body">
                  Next Steps
                </p>
                <span className="text-xs font-semibold text-sage-600 font-body bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-full">
                  {completedCount} of {checklist.length} complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-sage-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(completedCount / checklist.length) * 100}%`,
                  }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                />
              </div>

              <div className="space-y-4">
                {checklist.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 + i * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      item.done
                        ? "bg-sage-50 border-sage-200"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                    >
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p
                          className={`text-sm font-semibold font-body ${item.done ? "text-sage-800" : "text-gray-800"}`}
                        >
                          {item.label}
                        </p>
                        {item.badge && (
                          <span className="text-[10px] font-bold font-body bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-body leading-relaxed ${item.done ? "text-sage-700" : "text-gray-500"}`}
                      >
                        {item.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 mt-0.5">
                      {item.done ? (
                        <CheckCircle2 className="w-5 h-5 text-sage-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-gray-400 font-body text-center pt-2"
            >
              Questions? Text Ms. Sabrina at{" "}
              <a href="sms:+15126775872" className="text-primary hover:underline">
                (512) 677-5872
              </a>{" "}
              or email{" "}
              <a
                href="mailto:sabrina@sagefield.co"
                className="text-primary hover:underline"
              >
                sabrina@sagefield.co
              </a>
            </motion.p>
          </div>
        </div>
      </main>

      <HelpWidget />
    </div>
  );
}
