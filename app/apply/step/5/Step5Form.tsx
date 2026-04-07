"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Dancing_Script } from "next/font/google";
import { saveApplicationStep5 } from "@/app/actions/saveApplicationStep5";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

type InitialData = {
  g1_full_name?: string | null;
  g1_signature_name?: string | null;
  g1_signature?: string | null;
  g1_signature_date?: string | null;
  g2_full_name?: string | null;
  g2_signature_name?: string | null;
  g2_signature?: string | null;
  g2_signature_date?: string | null;
} | null;

const todayISO = new Date().toISOString().split("T")[0];

export default function Step5Form({
  initialData,
  applicationId,
}: {
  initialData: InitialData;
  applicationId: string | null;
}) {
  const d = initialData;
  const hasG2 = !!d?.g2_full_name;

  const [g1SignatureName, setG1SignatureName] = useState(
    d?.g1_signature_name ?? d?.g1_full_name ?? "",
  );
  const [g1Signature, setG1Signature] = useState(d?.g1_signature ?? "");
  const [g1SignatureDate] = useState(d?.g1_signature_date ?? todayISO);

  const [g2SignatureName, setG2SignatureName] = useState(
    d?.g2_signature_name ?? d?.g2_full_name ?? "",
  );
  const [g2Signature, setG2Signature] = useState(d?.g2_signature ?? "");
  const [g2SignatureDate] = useState(d?.g2_signature_date ?? todayISO);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!g1Signature.trim()) {
      setError("Guardian 1 signature is required.");
      return;
    }
    if (hasG2 && !g2Signature.trim()) {
      setError("Guardian 2 signature is required.");
      return;
    }

    startTransition(async () => {
      const result = await saveApplicationStep5({
        g1SignatureName,
        g1Signature,
        g1SignatureDate,
        g2SignatureName: hasG2 ? g2SignatureName : "",
        g2Signature: hasG2 ? g2Signature : "",
        g2SignatureDate: hasG2 ? g2SignatureDate : "",
        applicationId,
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div
      className={`${dancingScript.variable} flex flex-col lg:flex-row min-h-screen lg:h-screen bg-white lg:overflow-hidden`}
    >
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="relative lg:w-1/2 h-64 sm:h-80 lg:h-screen lg:sticky lg:top-0 flex-shrink-0 overflow-hidden"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" as const }}
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
            href={
              applicationId
                ? `/apply/step/4?appId=${applicationId}`
                : "/apply/step/4"
            }
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
            Step 5 of 5
          </motion.span>
          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Review and sign.
          </motion.h2>
          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            Please read the agreement below and sign to submit your application.
          </motion.p>
        </div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <motion.div
        className="flex-1 flex flex-col items-center px-6 py-12 sm:px-12 bg-welcome-bg lg:h-screen lg:overflow-y-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" as const }}
      >
        <div className="w-full max-w-xl">
          <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
            Application
          </span>
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Confirmation & Agreements
          </h1>
          <p className="text-sm text-gray-500 font-body mb-8">
            Read the statements below, then sign to submit your application.
          </p>

          {/* Agreement Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 font-body mb-4 uppercase tracking-wide">
              Section 8 — Confirmation and Initial Agreements
            </h2>
            <p className="text-sm text-gray-600 font-body mb-3">
              By signing below, I confirm that:
            </p>
            <ul className="flex flex-col gap-3 text-sm text-gray-600 font-body">
              <li className="flex gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>
                  The information provided in this application is true and
                  complete to the best of my knowledge.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>
                  Submitting this application does not guarantee enrollment.
                  Sage Field School will review each application to determine
                  fit and will contact families regarding next steps.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>
                  If offered a place, enrollment is only finalized after
                  completing all of the following:
                </span>
              </li>
              <li className="ml-4">
                <ol className="flex flex-col gap-1.5 list-none text-gray-500">
                  {[
                    "Sign Enrollment Agreement",
                    "Sign Liability Waiver",
                    "Complete Medical & Emergency Authorization",
                    "Sign Policies Acknowledgment",
                    "Complete supplemental, required documents that may be provided",
                    "Pay registration/materials fee",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray-400 flex-shrink-0">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>
                  I agree to notify Sage Field School in writing if any
                  information provided in this application changes prior to
                  enrollment.
                </span>
              </li>
            </ul>
          </div>

          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
            {/* Guardian 1 Signature Block */}
            <SignatureBlock
              label="Guardian 1"
              printedName={g1SignatureName}
              onPrintedNameChange={setG1SignatureName}
              signature={g1Signature}
              onSignatureChange={setG1Signature}
              date={g1SignatureDate}
            />

            {/* Guardian 2 Signature Block (conditional) */}
            {hasG2 && (
              <SignatureBlock
                label="Guardian 2"
                printedName={g2SignatureName}
                onPrintedNameChange={setG2SignatureName}
                signature={g2Signature}
                onSignatureChange={setG2Signature}
                date={g2SignatureDate}
              />
            )}

            {error && <p className="text-sm text-red-500 font-body">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function SignatureBlock({
  label,
  printedName,
  onPrintedNameChange,
  signature,
  onSignatureChange,
  date,
}: {
  label: string;
  printedName: string;
  onPrintedNameChange: (v: string) => void;
  signature: string;
  onSignatureChange: (v: string) => void;
  date: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-700 font-body uppercase tracking-wide border-b border-gray-100 pb-2">
        {label} Signature
      </h3>

      {/* Full Name (print) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
          Full name <span className="font-normal text-gray-400">(print)</span>
        </label>
        <input
          type="text"
          value={printedName}
          onChange={(e) => onPrintedNameChange(e.target.value)}
          placeholder="Your full legal name"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
        />
      </div>

      {/* Click to sign */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
          Type your name to sign
        </label>
        {signature ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-gray-200 bg-gray-50">
            <p
              className="text-2xl text-gray-700 flex-1"
              style={{ fontFamily: "var(--font-dancing-script)" }}
            >
              {signature}
            </p>
            <button
              type="button"
              onClick={() => onSignatureChange("")}
              className="text-xs text-gray-400 hover:text-gray-600 font-body underline shrink-0"
            >
              Clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSignatureChange(printedName)}
            disabled={!printedName}
            className="cursor-pointer w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm font-body text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            Click to sign
          </button>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
          Date
        </label>
        <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 font-body">
          {date}
        </div>
      </div>
    </div>
  );
}
