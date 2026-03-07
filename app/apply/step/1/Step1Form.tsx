"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { saveApplicationStep1 } from "@/app/actions/saveApplicationStep1";

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

type InitialData = {
  program?: string | null;
  child_legal_name?: string | null;
  preferred_name?: string | null;
  dob_month?: string | null;
  dob_day?: string | null;
  dob_year?: string | null;
  child_age?: number | null;
  child_grade?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  household_phone?: string | null;
  is_homeschooled?: string | null;
  homeschool_explanation?: string | null;
  previous_schools?: string | null;
  previous_schools_list?: string | null;
  special_interests?: string | null;
} | null;

export default function Step1Form({ initialData }: { initialData: InitialData }) {
  const d = initialData;
  const [program, setProgram] = useState<"summer" | "school_year" | "both" | "">(
    (d?.program as "summer" | "school_year" | "both") ?? ""
  );
  const [childLegalName, setChildLegalName] = useState(d?.child_legal_name ?? "");
  const [preferredName, setPreferredName] = useState(d?.preferred_name ?? "");
  const [dobMonth, setDobMonth] = useState(d?.dob_month ?? "");
  const [dobDay, setDobDay] = useState(d?.dob_day ?? "");
  const [dobYear, setDobYear] = useState(d?.dob_year ?? "");
  const [childAge, setChildAge] = useState(d?.child_age?.toString() ?? "");
  const [childGrade, setChildGrade] = useState(d?.child_grade ?? "");
  const [addressStreet, setAddressStreet] = useState(d?.address_street ?? "");
  const [addressCity, setAddressCity] = useState(d?.address_city ?? "");
  const [addressState, setAddressState] = useState(d?.address_state ?? "");
  const [addressZip, setAddressZip] = useState(d?.address_zip ?? "");
  const [householdPhone, setHouseholdPhone] = useState(d?.household_phone ?? "");
  const [isHomeschooled, setIsHomeschooled] = useState<"yes" | "no" | "">(
    (d?.is_homeschooled as "yes" | "no") ?? ""
  );
  const [homeschoolExplanation, setHomeschoolExplanation] = useState(d?.homeschool_explanation ?? "");
  const [previousSchools, setPreviousSchools] = useState<"yes" | "no" | "">(
    (d?.previous_schools as "yes" | "no") ?? ""
  );
  const [previousSchoolsList, setPreviousSchoolsList] = useState(d?.previous_schools_list ?? "");
  const [specialInterests, setSpecialInterests] = useState(d?.special_interests ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveApplicationStep1({
        program,
        childLegalName,
        preferredName,
        dobMonth,
        dobDay,
        dobYear,
        childAge,
        childGrade,
        addressStreet,
        addressCity,
        addressState,
        addressZip,
        householdPhone,
        isHomeschooled,
        homeschoolExplanation,
        previousSchools,
        previousSchoolsList,
        specialInterests,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-white lg:overflow-hidden">
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden"
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
        className="flex-1 flex flex-col items-center px-6 py-12 sm:px-12 bg-welcome-bg lg:h-screen lg:overflow-y-auto"
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

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

            {/* Child's Full Legal Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Child&apos;s Full Legal Name
              </label>
              <input
                type="text"
                value={childLegalName}
                onChange={(e) => setChildLegalName(e.target.value)}
                placeholder="Alex Smith"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Preferred Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Preferred Name{" "}
                <span className="font-normal text-gray-400">(if different)</span>
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Alex"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Date of Birth
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="MM"
                  maxLength={2}
                  className="w-16 px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white text-center"
                />
                <span className="text-gray-400 font-body">/</span>
                <input
                  type="text"
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="DD"
                  maxLength={2}
                  className="w-16 px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white text-center"
                />
                <span className="text-gray-400 font-body">/</span>
                <input
                  type="text"
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="YYYY"
                  maxLength={4}
                  className="w-20 px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white text-center"
                />
              </div>
            </div>

            {/* Age + Grade row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                  Age <span className="font-normal text-gray-400">(as of start date)</span>
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

            {/* Primary Home Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Primary Home Address
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  placeholder="Street Address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="City"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                  />
                  <input
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value.slice(0, 2).toUpperCase())}
                    placeholder="ST"
                    maxLength={2}
                    className="w-20 px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white text-center"
                  />
                  <input
                    type="text"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="Zip"
                    maxLength={5}
                    className="w-24 px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Household Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Primary Household Phone
              </label>
              <input
                type="tel"
                value={householdPhone}
                onChange={(e) => setHouseholdPhone(formatPhone(e.target.value))}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Is your child currently homeschooled? */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Is your child currently homeschooled?
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIsHomeschooled(option.value as "yes" | "no")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-body text-left transition-all cursor-pointer ${
                      isHomeschooled === option.value
                        ? "border-primary bg-primary/5 text-gray-800"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        isHomeschooled === option.value
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
              {isHomeschooled === "no" && (
                <div className="mt-3">
                  <textarea
                    value={homeschoolExplanation}
                    onChange={(e) => setHomeschoolExplanation(e.target.value)}
                    placeholder="Please explain current educational arrangement"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
                  />
                </div>
              )}
            </div>

            {/* Has your child previously attended any learning communities? */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Has your child previously attended any learning communities, co-ops, or schools?
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreviousSchools(option.value as "yes" | "no")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-body text-left transition-all cursor-pointer ${
                      previousSchools === option.value
                        ? "border-primary bg-primary/5 text-gray-800"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        previousSchools === option.value
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    />
                    {option.label}
                  </button>
                ))}
              </div>
              {previousSchools === "yes" && (
                <div className="mt-3">
                  <textarea
                    value={previousSchoolsList}
                    onChange={(e) => setPreviousSchoolsList(e.target.value)}
                    placeholder="List name(s) and approximate dates"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
                  />
                </div>
              )}
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

            {error && (
              <p className="text-sm text-red-500 font-body">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save & Continue"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
