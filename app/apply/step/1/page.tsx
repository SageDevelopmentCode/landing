"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const gradeOptions = [
  "Pre-K",
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
];

export default function ApplicationStep1() {
  const [program, setProgram] = useState<
    "summer" | "school_year" | "both" | ""
  >("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [specialInterests, setSpecialInterests] = useState("");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParentPhone(formatPhone(e.target.value));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen flex-shrink-0 overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <img
          src="/assets/Hero.jpg"
          alt="Sage Field"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/10" />

        {/* Back link */}
        <motion.div
          className="absolute top-6 left-6 z-20"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link
            href="/apply/start"
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-body transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div
          className="absolute top-6 right-6 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Image
            src="/assets/Logo.png"
            alt="Sage Field"
            width={80}
            height={32}
            className="object-contain"
          />
        </motion.div>

        {/* Bottom content — hidden on mobile */}
        <div className="hidden lg:flex absolute bottom-0 left-0 right-0 z-20 flex-col p-10 gap-4">
          <motion.span
            className="inline-block self-start px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Step 1 of 3
          </motion.span>
          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Tell us about your child.
          </motion.h2>
          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            This helps us understand your family&apos;s needs and find the right
            fit for your child.
          </motion.p>
        </div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 bg-welcome-bg overflow-y-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
            Application
          </span>
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Your child&apos;s details
          </h1>
          <p className="text-sm text-gray-500 font-body mb-8">
            Fill in the information below to continue your application.
          </p>

          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Program */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Program Interest
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: "summer", label: "Summer Program" },
                  { value: "school_year", label: "School Year" },
                  { value: "both", label: "Both" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProgram(option.value as typeof program)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-body text-left transition-all cursor-pointer ${
                      program === option.value
                        ? "border-primary bg-primary/5 text-gray-800"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        program === option.value
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Child's Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Child&apos;s Full Name
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Alex Smith"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Age + Grade row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                  Child&apos;s Age
                </label>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="8"
                  min={1}
                  max={18}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                  Grade Level
                </label>
                <select
                  value={childGrade}
                  onChange={(e) => setChildGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 outline-none focus:border-primary transition-colors bg-white appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select grade
                  </option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Your Phone Number
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={handlePhoneChange}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Special Interests */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Special Learning Needs or Interests{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={specialInterests}
                onChange={(e) => setSpecialInterests(e.target.value)}
                placeholder="e.g. dyslexia, loves science, needs extra math support..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2"
            >
              Save &amp; Continue
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
