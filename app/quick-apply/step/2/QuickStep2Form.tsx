"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { saveQuickApplyStep2 } from "@/app/actions/saveQuickApplyStep2";

type InitialData = {
  g1_full_name?: string | null;
  g1_relationship?: string | null;
  g1_relationship_other?: string | null;
  g1_email?: string | null;
  g1_cell_phone?: string | null;
  g1_preferred_contact?: string | null;
  g1_lives_with_child?: string | null;
  g1_has_custody?: string | null;
  has_custody_orders?: string | null;
  custody_orders_description?: string | null;
} | null;

const relationshipOptions = ["Mother", "Father", "Legal Guardian", "Other"];
const preferredContactOptions = ["Email", "Text", "Phone Call"];
const custodyOptions = ["Yes", "No", "Joint"];

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option.toLowerCase())}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-body text-left transition-all cursor-pointer ${
            value === option.toLowerCase()
              ? "border-primary bg-primary/5 text-gray-800"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
              value === option.toLowerCase()
                ? "border-primary bg-primary"
                : "border-gray-300"
            }`}
          />
          {option}
        </button>
      ))}
    </div>
  );
}

export default function QuickStep2Form({
  initialData,
  applicationId,
  guardianPrefill,
  accountInfo,
}: {
  initialData: InitialData;
  applicationId: string | null;
  guardianPrefill: InitialData;
  accountInfo: { full_name?: string | null; email?: string | null } | null;
}) {
  const d = initialData;
  const gp = guardianPrefill;

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const [g1FullName, setG1FullName] = useState(
    d?.g1_full_name ?? gp?.g1_full_name ?? accountInfo?.full_name ?? ""
  );
  const [g1Relationship, setG1Relationship] = useState(
    d?.g1_relationship ?? gp?.g1_relationship ?? ""
  );
  const [g1RelationshipOther, setG1RelationshipOther] = useState(
    d?.g1_relationship_other ?? gp?.g1_relationship_other ?? ""
  );
  const [g1Email, setG1Email] = useState(
    d?.g1_email ?? gp?.g1_email ?? accountInfo?.email ?? ""
  );
  const [g1CellPhone, setG1CellPhone] = useState(
    d?.g1_cell_phone ?? gp?.g1_cell_phone ?? ""
  );
  const [g1PreferredContact, setG1PreferredContact] = useState(
    d?.g1_preferred_contact ?? gp?.g1_preferred_contact ?? ""
  );
  const [g1LivesWithChild, setG1LivesWithChild] = useState(
    d?.g1_lives_with_child ?? gp?.g1_lives_with_child ?? ""
  );
  const [g1HasCustody, setG1HasCustody] = useState(
    d?.g1_has_custody ?? gp?.g1_has_custody ?? ""
  );
  const [hasCustodyOrders, setHasCustodyOrders] = useState(
    d?.has_custody_orders ?? gp?.has_custody_orders ?? ""
  );
  const [custodyOrdersDescription, setCustodyOrdersDescription] = useState(
    d?.custody_orders_description ?? gp?.custody_orders_description ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveQuickApplyStep2({
        g1FullName,
        g1Relationship,
        g1RelationshipOther,
        g1Email,
        g1CellPhone,
        g1PreferredContact,
        g1LivesWithChild,
        g1HasCustody,
        hasCustodyOrders,
        custodyOrdersDescription: hasCustodyOrders === "yes" ? custodyOrdersDescription : "",
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
            href={applicationId ? `/quick-apply/step/1?appId=${applicationId}` : "/quick-apply/step/1"}
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
            Step 2 of 4
          </motion.span>
          <motion.h2
            className="text-3xl font-bold font-heading text-white leading-snug"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Tell us about the parent or guardian.
          </motion.h2>
          <motion.p
            className="text-white/75 font-body text-sm leading-relaxed max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            We&apos;ll use this to keep you informed throughout the application process.
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
        <div className="w-full max-w-md">
          <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
            Application
          </span>
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Parent &amp; Guardian info
          </h1>
          <p className="text-sm text-gray-500 font-body mb-8">
            Tell us about the primary guardian for this child.
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <h3 className="text-base font-semibold text-gray-700 font-body border-b border-gray-100 pb-2">
              Guardian 1 (Primary Contact)
            </h3>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={g1FullName}
                onChange={(e) => setG1FullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Relationship to Child
              </label>
              <RadioGroup
                options={relationshipOptions}
                value={g1Relationship}
                onChange={setG1Relationship}
              />
              {g1Relationship === "other" && (
                <input
                  type="text"
                  value={g1RelationshipOther}
                  onChange={(e) => setG1RelationshipOther(e.target.value)}
                  placeholder="Please specify"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
                />
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={g1Email}
                onChange={(e) => setG1Email(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Cell Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Cell Phone
              </label>
              <input
                type="tel"
                value={g1CellPhone}
                onChange={(e) => setG1CellPhone(formatPhone(e.target.value))}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
              />
            </div>

            {/* Preferred contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Preferred Contact Method
              </label>
              <RadioGroup
                options={preferredContactOptions}
                value={g1PreferredContact}
                onChange={setG1PreferredContact}
              />
            </div>

            {/* Lives with child */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Lives with child?
              </label>
              <RadioGroup
                options={["Yes", "No"]}
                value={g1LivesWithChild}
                onChange={setG1LivesWithChild}
              />
            </div>

            {/* Has custody */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                Has legal custody?
              </label>
              <RadioGroup
                options={custodyOptions}
                value={g1HasCustody}
                onChange={setG1HasCustody}
              />
            </div>

            {/* Custody Orders */}
            <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 font-body">
                Are there any custody orders or restrictions affecting who may pick up or communicate about this child?
              </label>
              <RadioGroup
                options={["Yes", "No"]}
                value={hasCustodyOrders}
                onChange={setHasCustodyOrders}
              />
              {hasCustodyOrders === "yes" && (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={custodyOrdersDescription}
                    onChange={(e) => setCustodyOrdersDescription(e.target.value)}
                    placeholder="Describe the custody restrictions or orders..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white resize-none"
                  />
                  <p className="text-xs text-gray-400 font-body">
                    Please also bring a copy of relevant court orders.
                  </p>
                </div>
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
