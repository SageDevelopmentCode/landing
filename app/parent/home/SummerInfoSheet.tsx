"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

const packChips = [
  { emoji: "🍱", label: "Snack + lunch" },
  { emoji: "💧", label: "Water bottle" },
  { emoji: "👕", label: "Change of clothes" },
  { emoji: "👟", label: "Closed-toe shoes" },
  { emoji: "🩴", label: "Open-toe shoes" },
  { emoji: "☀️", label: "Sunscreen" },
  { emoji: "🥾", label: "Boots" },
  { emoji: "🩱", label: "Swimsuit" },
  { emoji: "🏖️", label: "Towel" },
];

const deadlines = [
  { week: "Week 1", starts: "May 26", due: "May 22" },
  { week: "Week 2", starts: "June 1", due: "May 29" },
];

export default function SummerInfoSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Banner trigger */}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white">
              ☀️ Summer Checklist &amp; Important Tuition Info
            </span>
            <span className="text-xs text-white/80">
              Tap to view what to pack + tuition deadlines
            </span>
          </div>
          <ChevronRight size={18} className="text-white shrink-0 ml-2" />
        </div>
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[420px] bg-white shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Sticky header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">
                  ☀️ Summer Info
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 py-6 flex flex-col gap-7">

                {/* Section 1: Pack list */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-gray-800">
                    🎒 What to Send With Your Child
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {packChips.map(({ emoji, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        {emoji} {label}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    Extra shoes may be left at Sage Field — pick them up on your last day.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Section 2: Tuition */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-gray-800">
                    💳 Tuition Deadlines
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tuition is due the <span className="font-semibold text-gray-700">Friday before</span> each week begins.
                  </p>

                  {/* Deadline cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {deadlines.map(({ week, starts, due }) => (
                      <div
                        key={week}
                        className="rounded-xl border border-gray-100 bg-white p-3 flex flex-col gap-1.5 shadow-sm"
                      >
                        <span className="text-xs font-semibold text-gray-800">{week}</span>
                        <span className="text-[11px] text-gray-400">Starts {starts}</span>
                        <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 self-start">
                          Due {due}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Late fee */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                    <span className="text-base shrink-0">⚠️</span>
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">$30 late fee</span> if tuition is not received by Friday at 11:59 PM.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/parent/billing"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#3d6a4a] text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                >
                  View My Tuition <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
