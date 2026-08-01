"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Camera,
  GraduationCap,
  MessageCircle,
  CreditCard,
  Smile,
  CalendarDays,
  UserCheck,
  ClipboardCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getOnboardingProgress } from "@/app/actions/getOnboardingProgress";
import { saveOnboardingProgress } from "@/app/actions/saveOnboardingProgress";

const TASKS: {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    id: "complete_enrollment",
    label: "Complete your enrollment checklist",
    description: "Sign contracts and upload records",
    href: "/parent/dashboard",
    icon: ClipboardCheck,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: "upload_photo",
    label: "Add your child's photo",
    description: "Upload a profile picture for your child",
    href: "/parent/children",
    icon: Camera,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
  },
  {
    id: "view_teachers",
    label: "Meet your child's teachers",
    description: "View who's teaching your child this year",
    href: "/parent/children?tab=teacher",
    icon: GraduationCap,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  {
    id: "send_message",
    label: "Send your first message",
    description: "Reach out to a teacher",
    href: "/parent/messages",
    icon: MessageCircle,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-500",
  },
  {
    id: "introduce_community",
    label: "Introduce yourself to the community",
    description: "Say hello in the community chat",
    href: "/parent/messages?tab=community",
    icon: Users,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-500",
  },
  {
    id: "setup_tuition",
    label: "Set up tuition",
    description: "Review your tuition & payment options",
    href: "/parent/billing",
    icon: CreditCard,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
  },
  {
    id: "react_post",
    label: "React to a post",
    description: "Engage with your child's classroom feed",
    href: "/parent/feed",
    icon: Smile,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
  },
  {
    id: "check_events",
    label: "Check upcoming events",
    description: "See what's coming up on the calendar",
    href: "/parent/calendar",
    icon: CalendarDays,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
  {
    id: "add_pickup",
    label: "Add an authorized pickup",
    description: "Add someone who can pick up your child",
    href: "/parent/children?tab=pickup",
    icon: UserCheck,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  initialCompleted?: string[];
}

export default function OnboardingChecklist({ open, onClose, initialCompleted }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCompleted ?? [])
  );
  const [loading, setLoading] = useState(initialCompleted === undefined);

  useEffect(() => {
    if (initialCompleted !== undefined) return;
    getOnboardingProgress().then((ids) => {
      setCompleted(new Set(ids));
      setLoading(false);
    });
  }, []);

  function toggle(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompleted(next);
    saveOnboardingProgress([...next]);
  }

  const completedCount = completed.size;
  const total = TASKS.length;
  const progressPct = Math.round((completedCount / total) * 100);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900 font-body">
                  Get Started
                </h2>
                <p className="text-xs text-gray-500 font-body mt-0.5">
                  {completedCount} of {total} completed
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#4a7c59] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto py-2">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 animate-pulse" />
                    </div>
                  ))
                : TASKS.map((task) => {
                    const done = completed.has(task.id);
                    const Icon = task.icon;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Colored icon bubble */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${done ? "bg-gray-100" : task.iconBg}`}
                        >
                          <Icon
                            className={`w-4 h-4 ${done ? "text-gray-400" : task.iconColor}`}
                          />
                        </div>

                        {/* Label + description — also navigates */}
                        <Link
                          href={task.href}
                          onClick={onClose}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <p
                            className={`text-sm font-body font-medium leading-snug ${done ? "text-gray-400 line-through" : "text-gray-800"}`}
                          >
                            {task.label}
                          </p>
                          <p className="text-xs text-gray-400 font-body mt-0.5 leading-snug">
                            {task.description}
                          </p>
                        </Link>

                        {/* Check toggle */}
                        <button
                          onClick={() => toggle(task.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                            done
                              ? "bg-[#4a7c59] border-[#4a7c59]"
                              : "border-gray-300 hover:border-[#4a7c59]"
                          }`}
                        >
                          {done && (
                            <Check
                              className="w-3 h-3 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
            </div>

            {/* Footer */}
            {completedCount === total && (
              <div className="px-5 py-4 border-t border-gray-100 bg-[#d4e6d0]/30">
                <p className="text-sm font-body font-semibold text-[#4a7c59] text-center">
                  You&apos;re all set! Welcome to Sage Field.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
