"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { saveQuickApplyStep3 } from "@/app/actions/saveQuickApplyStep3";

type InitialData = {
  has_medical_conditions?: string | null;
  medical_conditions_description?: string | null;
  has_allergies?: string | null;
  allergies_description?: string | null;
  has_emergency_medications?: string | null;
  emergency_medications_description?: string | null;
} | null;

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-body text-left transition-all cursor-pointer ${
            value === option.value
              ? "border-primary bg-primary/5 text-gray-800"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
              value === option.value
                ? "border-primary bg-primary"
                : "border-gray-300"
            }`}
          />
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function QuickStep3Form({
  initialData,
  applicationId,
}: {
  initialData: InitialData;
  applicationId: string | null;
}) {
  const d = initialData;

  const [hasMedicalConditions, setHasMedicalConditions] = useState(d?.has_medical_conditions ?? "");
  const [medicalConditionsDescription, setMedicalConditionsDescription] = useState(d?.medical_conditions_description ?? "");
  const [hasAllergies, setHasAllergies] = useState(d?.has_allergies ?? "");
  const [allergiesDescription, setAllergiesDescription] = useState(d?.allergies_description ?? "");
  const [hasEmergencyMedications, setHasEmergencyMedications] = useState(d?.has_emergency_medications ?? "");
  const [emergencyMedicationsDescription, setEmergencyMedicationsDescription] = useState(d?.emergency_medications_description ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveQuickApplyStep3({
        hasMedicalConditions,
        medicalConditionsDescription: hasMedicalConditions === "yes" ? medicalConditionsDescription : "",
        hasAllergies,
        allergiesDescription: hasAllergies === "yes" ? allergiesDescription : "",
        hasEmergencyMedications,
        emergencyMedicationsDescription: hasEmergencyMedications === "yes" ? emergencyMedicationsDescription : "",
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
            href={applicationId ? `/quick-apply/step/2?appId=${applicationId}` : "/quick-apply/step/2"}
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
            Step 3 of 4
          </motion.span>
          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Health &amp; safety basics.
          </motion.h2>
          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            This helps us ensure we can fully support your child from day one.
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
            Health &amp; Support Needs
          </h1>
          <p className="text-sm text-gray-500 font-body mb-8">
            Help us understand how to best support your child.
          </p>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Medical Conditions */}
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                Does your child have any diagnosed medical conditions?
              </label>
              <RadioGroup
                options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
                value={hasMedicalConditions}
                onChange={setHasMedicalConditions}
              />
              {hasMedicalConditions === "yes" && (
                <textarea
                  value={medicalConditionsDescription}
                  onChange={(e) => setMedicalConditionsDescription(e.target.value)}
                  placeholder="Please describe the condition(s)..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
                />
              )}
            </div>

            {/* Allergies */}
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                Does your child have any allergies?
              </label>
              <RadioGroup
                options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
                value={hasAllergies}
                onChange={setHasAllergies}
              />
              {hasAllergies === "yes" && (
                <textarea
                  value={allergiesDescription}
                  onChange={(e) => setAllergiesDescription(e.target.value)}
                  placeholder="Please describe the allergy/allergies..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
                />
              )}
            </div>

            {/* Emergency Medications */}
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                Does your child use any life-saving emergency medications (e.g. EpiPen, rescue inhaler)?
              </label>
              <RadioGroup
                options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
                value={hasEmergencyMedications}
                onChange={setHasEmergencyMedications}
              />
              {hasEmergencyMedications === "yes" && (
                <textarea
                  value={emergencyMedicationsDescription}
                  onChange={(e) => setEmergencyMedicationsDescription(e.target.value)}
                  placeholder="Please describe the medication(s) and when they are used..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
                />
              )}
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
