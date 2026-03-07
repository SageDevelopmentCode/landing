"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { saveApplicationStep4 } from "@/app/actions/saveApplicationStep4";

type InitialData = {
  learning_style?: string | null;
  strengths_interests?: string | null;
  current_challenges?: string | null;
  dysregulation_response?: string | null;
  regulation_strategies?: string | null;
  activities_to_avoid?: string | null;
} | null;

export default function Step4Form({
  initialData,
  applicationId,
}: {
  initialData: InitialData;
  applicationId: string | null;
}) {
  const d = initialData;

  const [learningStyle, setLearningStyle] = useState(d?.learning_style ?? "");
  const [strengthsInterests, setStrengthsInterests] = useState(d?.strengths_interests ?? "");
  const [currentChallenges, setCurrentChallenges] = useState(d?.current_challenges ?? "");
  const [dysregulationResponse, setDysregulationResponse] = useState(d?.dysregulation_response ?? "");
  const [regulationStrategies, setRegulationStrategies] = useState(d?.regulation_strategies ?? "");
  const [activitiesToAvoid, setActivitiesToAvoid] = useState(d?.activities_to_avoid ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveApplicationStep4({
        learningStyle,
        strengthsInterests,
        currentChallenges,
        dysregulationResponse,
        regulationStrategies,
        activitiesToAvoid,
        applicationId,
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
            href={applicationId ? `/apply/step/3?appId=${applicationId}` : "/apply/step/3"}
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
            Step 4 of 4
          </motion.span>
          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Tell us about how your child learns.
          </motion.h2>
          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            This helps us tailor our approach to your child&apos;s unique learning profile.
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
            Learning Profile &amp; Preferences
          </h1>
          <p className="text-sm text-gray-500 font-body mb-8">
            All fields are optional — share as much or as little as you&apos;d like.
          </p>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Learning Style */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                How would you describe your child&apos;s learning style and personality?
              </label>
              <textarea
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                placeholder="e.g., very active, quiet observer, hands-on, sensitive to noise, loves art..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
              />
            </div>

            {/* Strengths & Interests */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                What are your child&apos;s strengths, interests, and passions?
              </label>
              <textarea
                value={strengthsInterests}
                onChange={(e) => setStrengthsInterests(e.target.value)}
                placeholder="e.g., loves building, strong memory, kind to others, passionate about animals..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
              />
            </div>

            {/* Current Challenges */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                What are your child&apos;s current challenges or areas for support?
              </label>
              <textarea
                value={currentChallenges}
                onChange={(e) => setCurrentChallenges(e.target.value)}
                placeholder="e.g., reading comprehension, social interactions, emotional regulation..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
              />
            </div>

            {/* Dysregulation Response */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                How does your child typically respond when frustrated, overwhelmed, or dysregulated?
              </label>
              <textarea
                value={dysregulationResponse}
                onChange={(e) => setDysregulationResponse(e.target.value)}
                placeholder="e.g., shuts down, cries, runs, needs quiet time..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
              />
            </div>

            {/* Regulation Strategies */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                What helps your child feel safe and regulated?
              </label>
              <textarea
                value={regulationStrategies}
                onChange={(e) => setRegulationStrategies(e.target.value)}
                placeholder="e.g., movement breaks, quiet space, predictable routine, fidget tools..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
              />
            </div>

            {/* Activities to Avoid */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                Are there any activities or situations we should avoid?
              </label>
              <textarea
                value={activitiesToAvoid}
                onChange={(e) => setActivitiesToAvoid(e.target.value)}
                placeholder="e.g., loud group games, certain textures, competitive activities..."
                rows={4}
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
