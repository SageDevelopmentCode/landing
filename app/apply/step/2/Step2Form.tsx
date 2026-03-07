"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { saveApplicationStep2 } from "@/app/actions/saveApplicationStep2";

type InitialData = {
  g1_full_name?: string | null;
  g1_relationship?: string | null;
  g1_relationship_other?: string | null;
  g1_email?: string | null;
  g1_cell_phone?: string | null;
  g1_work_phone?: string | null;
  g1_preferred_contact?: string | null;
  g1_lives_with_child?: string | null;
  g1_has_custody?: string | null;
  g2_full_name?: string | null;
  g2_relationship?: string | null;
  g2_relationship_other?: string | null;
  g2_email?: string | null;
  g2_cell_phone?: string | null;
  g2_work_phone?: string | null;
  g2_preferred_contact?: string | null;
  g2_lives_with_child?: string | null;
  g2_has_custody?: string | null;
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

function GuardianSection({
  prefix,
  label,
  data,
  onChange,
}: {
  prefix: "g1" | "g2";
  label: string;
  data: {
    fullName: string;
    relationship: string;
    relationshipOther: string;
    email: string;
    cellPhone: string;
    workPhone: string;
    preferredContact: string;
    livesWithChild: string;
    hasCustody: string;
  };
  onChange: (field: string, value: string) => void;
}) {
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-semibold text-gray-700 font-body border-b border-gray-100 pb-2">
        {label}
      </h3>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
          Full Name
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
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
          value={data.relationship}
          onChange={(v) => onChange("relationship", v)}
        />
        {data.relationship === "other" && (
          <input
            type="text"
            value={data.relationshipOther}
            onChange={(e) => onChange("relationshipOther", e.target.value)}
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
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="jane@example.com"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
        />
      </div>

      {/* Phone row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Cell Phone
          </label>
          <input
            type="tel"
            value={data.cellPhone}
            onChange={(e) => onChange("cellPhone", formatPhone(e.target.value))}
            placeholder="(555) 000-0000"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
            Work Phone <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={data.workPhone}
            onChange={(e) => onChange("workPhone", formatPhone(e.target.value))}
            placeholder="(555) 000-0000"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 font-body text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary transition-colors bg-white"
          />
        </div>
      </div>

      {/* Preferred contact */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
          Preferred Contact Method
        </label>
        <RadioGroup
          options={preferredContactOptions}
          value={data.preferredContact}
          onChange={(v) => onChange("preferredContact", v)}
        />
      </div>

      {/* Lives with child */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
          Lives with child?
        </label>
        <RadioGroup
          options={["Yes", "No"]}
          value={data.livesWithChild}
          onChange={(v) => onChange("livesWithChild", v)}
        />
      </div>

      {/* Has custody */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
          Has legal custody?
        </label>
        <RadioGroup
          options={custodyOptions}
          value={data.hasCustody}
          onChange={(v) => onChange("hasCustody", v)}
        />
      </div>
    </div>
  );
}

export default function Step2Form({
  initialData,
  applicationId,
  guardianPrefill,
}: {
  initialData: InitialData;
  applicationId: string | null;
  guardianPrefill: InitialData;
}) {
  const d = initialData;
  // Use guardianPrefill for guardian fields if the current app has none
  const gp = guardianPrefill;

  const [g1, setG1] = useState({
    fullName: d?.g1_full_name ?? gp?.g1_full_name ?? "",
    relationship: d?.g1_relationship ?? gp?.g1_relationship ?? "",
    relationshipOther: d?.g1_relationship_other ?? gp?.g1_relationship_other ?? "",
    email: d?.g1_email ?? gp?.g1_email ?? "",
    cellPhone: d?.g1_cell_phone ?? gp?.g1_cell_phone ?? "",
    workPhone: d?.g1_work_phone ?? gp?.g1_work_phone ?? "",
    preferredContact: d?.g1_preferred_contact ?? gp?.g1_preferred_contact ?? "",
    livesWithChild: d?.g1_lives_with_child ?? gp?.g1_lives_with_child ?? "",
    hasCustody: d?.g1_has_custody ?? gp?.g1_has_custody ?? "",
  });

  const [g2, setG2] = useState({
    fullName: d?.g2_full_name ?? gp?.g2_full_name ?? "",
    relationship: d?.g2_relationship ?? gp?.g2_relationship ?? "",
    relationshipOther: d?.g2_relationship_other ?? gp?.g2_relationship_other ?? "",
    email: d?.g2_email ?? gp?.g2_email ?? "",
    cellPhone: d?.g2_cell_phone ?? gp?.g2_cell_phone ?? "",
    workPhone: d?.g2_work_phone ?? gp?.g2_work_phone ?? "",
    preferredContact: d?.g2_preferred_contact ?? gp?.g2_preferred_contact ?? "",
    livesWithChild: d?.g2_lives_with_child ?? gp?.g2_lives_with_child ?? "",
    hasCustody: d?.g2_has_custody ?? gp?.g2_has_custody ?? "",
  });

  const hasG2Data = !!(
    d?.g2_full_name || d?.g2_email || d?.g2_cell_phone ||
    gp?.g2_full_name || gp?.g2_email || gp?.g2_cell_phone
  );
  const [showG2, setShowG2] = useState(hasG2Data);
  const [hasCustodyOrders, setHasCustodyOrders] = useState(
    d?.has_custody_orders ?? gp?.has_custody_orders ?? ""
  );
  const [custodyOrdersDescription, setCustodyOrdersDescription] = useState(
    d?.custody_orders_description ?? gp?.custody_orders_description ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateG1 = (field: string, value: string) =>
    setG1((prev) => ({ ...prev, [field]: value }));
  const updateG2 = (field: string, value: string) =>
    setG2((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveApplicationStep2({
        g1FullName: g1.fullName,
        g1Relationship: g1.relationship,
        g1RelationshipOther: g1.relationshipOther,
        g1Email: g1.email,
        g1CellPhone: g1.cellPhone,
        g1WorkPhone: g1.workPhone,
        g1PreferredContact: g1.preferredContact,
        g1LivesWithChild: g1.livesWithChild,
        g1HasCustody: g1.hasCustody,
        g2FullName: showG2 ? g2.fullName : "",
        g2Relationship: showG2 ? g2.relationship : "",
        g2RelationshipOther: showG2 ? g2.relationshipOther : "",
        g2Email: showG2 ? g2.email : "",
        g2CellPhone: showG2 ? g2.cellPhone : "",
        g2WorkPhone: showG2 ? g2.workPhone : "",
        g2PreferredContact: showG2 ? g2.preferredContact : "",
        g2LivesWithChild: showG2 ? g2.livesWithChild : "",
        g2HasCustody: showG2 ? g2.hasCustody : "",
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
            href={applicationId ? `/apply/step/1?appId=${applicationId}` : "/apply/step/1"}
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
            Step 2 of 3
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
        transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          <span className="inline-block px-4 py-1.5 bg-badge-bg text-black text-xs font-semibold rounded-full mb-4 font-body">
            Application
          </span>
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Parent &amp; Guardian info
          </h1>
          <p className="text-sm text-gray-500 font-body mb-8">
            Tell us about the adults responsible for this child.
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Guardian 1 */}
            <GuardianSection
              prefix="g1"
              label="Guardian 1 (Primary Contact)"
              data={g1}
              onChange={updateG1}
            />

            {/* Guardian 2 toggle */}
            {!showG2 ? (
              <button
                type="button"
                onClick={() => setShowG2(true)}
                className="flex items-center gap-2 text-sm font-semibold text-primary font-body hover:underline mt-2"
              >
                <Plus size={16} />
                Add Guardian 2
              </button>
            ) : (
              <div className="flex flex-col gap-5">
                <GuardianSection
                  prefix="g2"
                  label="Guardian 2 (Optional)"
                  data={g2}
                  onChange={updateG2}
                />
                <button
                  type="button"
                  onClick={() => setShowG2(false)}
                  className="text-sm text-gray-400 font-body hover:text-gray-600 text-left"
                >
                  Remove Guardian 2
                </button>
              </div>
            )}

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
