"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, Phone } from "lucide-react";

const TIMELINE_STEPS = [
  { label: "Applied" },
  { label: "Under Review", active: true },
  { label: "Enrollment" },
];

const NEXT_STEPS = [
  {
    icon: <CheckCircle2 className="w-4 h-4 text-[#5E7C68]" />,
    title: "Application received",
    desc: "Your application is in our system and confirmed.",
  },
  {
    icon: <ClipboardList className="w-4 h-4 text-[#5E7C68]" />,
    title: "Team reviews",
    desc: "Our admissions team is reading through your submission.",
  },
  {
    icon: <Phone className="w-4 h-4 text-[#5E7C68]" />,
    title: "We'll give you a call",
    desc: "Someone from our team will reach out to learn more about your child, answer your questions, and make sure Sage Field is the right fit.",
  },
];

export default function ReviewStatusCard() {
  return (
    <motion.div
      className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
    >
      {/* Timeline */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-4">
          Application Progress
        </p>
        <div className="flex items-center gap-0">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative flex items-center justify-center">
                  {step.active ? (
                    <>
                      <motion.div
                        className="absolute w-7 h-7 rounded-full bg-[#2C5F2E]/20"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="w-4 h-4 rounded-full bg-[#2C5F2E] relative z-10" />
                    </>
                  ) : i < TIMELINE_STEPS.findIndex((s) => s.active) ? (
                    <div className="w-4 h-4 rounded-full bg-[#2C5F2E] flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                        <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white" />
                  )}
                </div>
                <span
                  className={`text-xs font-body whitespace-nowrap ${
                    step.active ? "text-[#2C5F2E] font-semibold" : i < TIMELINE_STEPS.findIndex((s) => s.active) ? "text-gray-600" : "text-gray-300"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-5 ${
                    i < TIMELINE_STEPS.findIndex((s) => s.active) ? "bg-[#2C5F2E]/40" : "bg-gray-100"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What Happens Next */}
      <div className="px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 font-body mb-4">
          What Happens Next
        </p>
        <div className="flex flex-col gap-4">
          {NEXT_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 + i * 0.07 }}
            >
              <div className="mt-0.5 w-8 h-8 rounded-full bg-[#E0EDE2] flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 font-body">{step.title}</p>
                <p className="text-xs text-gray-500 font-body mt-0.5">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
