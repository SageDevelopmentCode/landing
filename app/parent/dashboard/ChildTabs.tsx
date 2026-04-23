"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import EnrollmentCodeEntry from "@/app/apply/dashboard/EnrollmentCodeEntry";
import {
  FileText,
  Users,
  Heart,
  Pill,
  ShieldCheck,
  Camera,
  AlertTriangle,
  UserPlus,
  PenLine,
  CreditCard,
  CheckCircle,
  Upload,
  ClipboardList,
  PlusCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { Database } from "@/app/types/database.types";
import type {
  StudentSignatureMap,
  SignatureMap,
} from "@/app/types/enrollment-signatures";
import {
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_ID,
  CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_4_ID,
  CONTRACT_4_TOTAL_SECTIONS,
  CONTRACT_5_ID,
  CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_ID,
  CONTRACT_6_TOTAL_SECTIONS,
  CONTRACT_7_ID,
  CONTRACT_7_TOTAL_SECTIONS,
  CONTRACT_8_ID,
  CONTRACT_8_TOTAL_SECTIONS,
  isContractComplete,
} from "@/app/types/enrollment-signatures";
import type { EnrollmentSignature } from "@/app/types/enrollment-signatures";
import ContractModal from "./ContractModal";
import HealthFormModal from "./HealthFormModal";
import MedicationPlanModal from "./MedicationPlanModal";
import ImmunizationUploadModal from "./ImmunizationUploadModal";
import PhotoReleaseModal from "./PhotoReleaseModal";
import AssumptionOfRiskModal from "./AssumptionOfRiskModal";
import AuthorizedPickupModal from "./AuthorizedPickupModal";
import ApplicationViewSlideOver from "./ApplicationViewSlideOver";
import HealthStatementModal from "./HealthStatementModal";
import { enrollApplication } from "@/app/actions/enrollApplication";

type StudentHealthInfo =
  Database["parent_app"]["Tables"]["student_health_info"]["Row"];
type StudentMedicationPlan =
  Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication =
  Database["parent_app"]["Tables"]["student_medications"]["Row"];
type AuthorizedPickupPlan =
  Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson =
  Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

interface ChecklistItem {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  required: boolean;
  isContract: boolean;
  contractId?: number;
  contractSections?: number;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    title: "Program Description, Parent Responsibilities, and Key Policies",
    subtitle: "Review and sign the program contract",
    icon: <FileText className="w-4 h-4" />,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_1_ID,
    contractSections: CONTRACT_1_TOTAL_SECTIONS,
  },
  {
    id: 2,
    title: "Community Agreement for Families and Staff",
    subtitle: "Review and sign the community agreement",
    icon: <Users className="w-4 h-4" />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_2_ID,
    contractSections: CONTRACT_2_TOTAL_SECTIONS,
  },
  {
    id: 3,
    title: "Emergency Contact, Health, and Immunization Form",
    subtitle: "Complete and sign the health and emergency form",
    icon: <Heart className="w-4 h-4" />,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_3_ID,
    contractSections: CONTRACT_3_TOTAL_SECTIONS,
  },
  {
    id: 4,
    title: "Emergency Medication Plan on File",
    subtitle: "Submit if your child requires emergency medication",
    icon: <Pill className="w-4 h-4" />,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    required: false,
    isContract: true,
    contractId: CONTRACT_4_ID,
    contractSections: CONTRACT_4_TOTAL_SECTIONS,
  },
  {
    id: 5,
    title: "Submit Proof of Immunizations",
    subtitle: "Upload current immunization records",
    icon: <ShieldCheck className="w-4 h-4" />,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    required: true,
    isContract: false,
  },
  {
    id: 10,
    title: "Health Information Form",
    subtitle: "Complete and sign the health information statement",
    icon: <ClipboardList className="w-4 h-4" />,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_8_ID,
    contractSections: CONTRACT_8_TOTAL_SECTIONS,
  },
  {
    id: 6,
    title: "Photo Release Form",
    subtitle: "Review and sign the photo and media release",
    icon: <Camera className="w-4 h-4" />,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_5_ID,
    contractSections: CONTRACT_5_TOTAL_SECTIONS,
  },
  {
    id: 7,
    title: "Assumption of Risk and Liability Release",
    subtitle: "Review and sign the liability release",
    icon: <AlertTriangle className="w-4 h-4" />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    required: true,
    isContract: true,
    contractId: CONTRACT_6_ID,
    contractSections: CONTRACT_6_TOTAL_SECTIONS,
  },
  {
    id: 8,
    title: "Additional Authorized Pickup Person",
    subtitle: "Add authorized pickup contacts and sign",
    icon: <UserPlus className="w-4 h-4" />,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    required: false,
    isContract: true,
    contractId: CONTRACT_7_ID,
    contractSections: CONTRACT_7_TOTAL_SECTIONS,
  },
  {
    id: 9,
    title: "Pay Registration Fee",
    subtitle: "Submit the registration fee to complete enrollment",
    icon: <CreditCard className="w-4 h-4" />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    required: true,
    isContract: false,
  },
];

const totalCount = checklistItems.length;

function CombinedRegistrationFeeModal({
  apps,
  parentEmail,
  onClose,
  onAllPaid,
  onPayIndividually,
}: {
  apps: Application[];
  parentEmail: string;
  onClose: () => void;
  onAllPaid: () => void;
  onPayIndividually: () => void;
}) {
  const [coverFees, setCoverFees] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getBaseFee(program: string | null, dropInProgram?: string | null): number {
    const billing = program === "homeschool_drop_in" ? (dropInProgram ?? "summer_26") : program;
    if (billing === "both") return 575;
    if (billing === "school_year_26_27") return 500;
    return 75;
  }

  function getProgramLineLabel(program: string | null, dropInProgram?: string | null): string {
    if (program === "homeschool_drop_in") {
      const billing = dropInProgram ?? "summer_26";
      if (billing === "both") return "Homeschool Drop-In — Summer 2026 + School Year 2026–27";
      if (billing === "school_year_26_27") return "Homeschool Drop-In — School Year 2026–27";
      return "Homeschool Drop-In — Summer 2026";
    }
    if (program === "both") return "Summer 2026 + School Year 2026–27";
    if (program === "school_year_26_27") return "School Year 2026–27";
    return "Summer 2026";
  }

  const combinedTotal = apps.reduce((sum, a) => sum + getBaseFee(a.program, (a as Record<string, unknown>).drop_in_program as string | null), 0);
  const cardFee = Math.round((combinedTotal * 0.029 + 0.3) * 100) / 100;
  const achFee = Math.min(Math.round(combinedTotal * 0.008 * 100) / 100, 5.0);

  const handlePayAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/stripe/create-combined-registration-checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: apps[0].user_id,
            parentEmail,
            coverFees,
            paymentMethod,
            children: apps.map((a) => ({
              studentId: a.student_id ?? "",
              applicationId: a.id,
              program: a.program ?? "summer_26",
              dropInProgram: (a as Record<string, unknown>).drop_in_program as string | undefined,
              childName: a.preferred_name ?? a.child_legal_name ?? "Student",
            })),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      onAllPaid();
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
      >
        <h2 className="text-lg font-bold font-heading text-gray-800 mb-1">
          Pay Registration Fees
        </h2>
        <p className="text-sm text-gray-500 font-body mb-5">
          You have {apps.length} children with unpaid registration fees. Save on
          processing by paying together.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
          {apps.map((a) => {
            const name = a.preferred_name ?? a.child_legal_name ?? "Student";
            const fee = getBaseFee(a.program, (a as Record<string, unknown>).drop_in_program as string | null);
            const programLine = getProgramLineLabel(a.program, (a as Record<string, unknown>).drop_in_program as string | null);
            return (
              <div
                key={a.id}
                className="flex justify-between text-sm font-body"
              >
                <span className="text-gray-600">
                  {name} <span className="text-gray-400">({programLine})</span>
                </span>
                <span className="font-semibold text-gray-800">
                  ${fee.toFixed(2)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between text-sm font-body border-t border-gray-200 pt-2 mt-1">
            <span className="text-gray-700 font-medium">Combined Total</span>
            <span className="font-semibold text-gray-800">
              ${combinedTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 font-body mb-2">
            How will you be paying?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                paymentMethod === "card"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Credit/Debit Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("ach")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                paymentMethod === "ach"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ACH / US bank account
            </button>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1.5">
            {paymentMethod === "card"
              ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
              : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
          </p>
        </div>

        <label className="flex items-start gap-3 mb-5 cursor-pointer group">
          <input
            type="checkbox"
            checked={coverFees}
            onChange={(e) => setCoverFees(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
          />
          <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
            I agree to pay the processing fee
          </span>
        </label>
        <p className="text-xs text-gray-400 font-body mb-5">
          Prefer to pay by check? Email us at{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="underline hover:text-gray-600 transition-colors"
          >
            sabrina@sagefield.co
          </a>{" "}
          and we&apos;ll send you instructions.
        </p>

        {error && (
          <p className="text-sm text-red-600 font-body mb-4">{error}</p>
        )}

        <p className="text-xs text-gray-400 font-body mb-4">
          Registration fees are non-refundable.
        </p>
        <div className="flex gap-3 mb-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handlePayAll}
            disabled={loading || !coverFees}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting…
              </>
            ) : (
              "Pay All Together"
            )}
          </button>
        </div>
        <button
          onClick={onPayIndividually}
          disabled={loading}
          className="w-full px-4 py-2 rounded-xl text-sm font-semibold font-body text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Pay individually instead
        </button>
      </motion.div>
    </motion.div>
  );
}

function RegistrationFeeModal({
  app,
  parentEmail,
  onClose,
  onPaid,
}: {
  app: Application;
  parentEmail: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [coverFees, setCoverFees] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach">("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childName = app.preferred_name ?? app.child_legal_name ?? "Student";
  const dropIn = app.drop_in_program as string | null;
  const billingProgram = app.program === "homeschool_drop_in" ? (dropIn ?? "summer_26") : app.program;
  const isSummer = billingProgram === "summer_26";
  const isSchool = billingProgram === "school_year_26_27";
  const isBoth = billingProgram === "both";
  const totalBase = isBoth ? 575 : isSummer ? 75 : 500;
  const cardFee = Math.round((totalBase * 0.029 + 0.3) * 100) / 100;
  const achFee = Math.min(Math.round(totalBase * 0.008 * 100) / 100, 5.0);

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-registration-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: app.user_id,
          parentEmail,
          studentId: app.student_id,
          applicationId: app.id,
          coverFees,
          paymentMethod,
          program: app.program,
          dropInProgram: dropIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      onPaid();
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
      >
        <h2 className="text-lg font-bold font-heading text-gray-800 mb-1">
          Pay Registration Fee
        </h2>
        <p className="text-sm text-gray-500 font-body mb-5">
          {childName} &mdash;{" "}
          {isBoth
            ? "Summer 2026 + School Year 2026–27"
            : isSummer
              ? "Summer 2026"
              : "School Year 2026–27"}
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
          {isBoth ? (
            <>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-600">Summer 2026 registration</span>
                <span className="font-semibold text-gray-800">$75.00</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-600">
                  School Year 2026–27 registration
                </span>
                <span className="font-semibold text-gray-800">$500.00</span>
              </div>
              <div className="flex justify-between text-sm font-body border-t border-gray-200 pt-2 mt-1">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="font-semibold text-gray-800">$575.00</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-600">Registration fee</span>
              <span className="font-semibold text-gray-800">
                ${totalBase.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 font-body mb-2">
            How will you be paying?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                paymentMethod === "card"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Credit/Debit Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("ach")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold font-body border transition-colors cursor-pointer ${
                paymentMethod === "ach"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ACH / US bank account
            </button>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1.5">
            {paymentMethod === "card"
              ? `Processing fee (est.): ~$${cardFee.toFixed(2)}`
              : `Processing fee (est.): ~$${achFee.toFixed(2)} (0.8%, max $5.00)`}
          </p>
        </div>

        <label className="flex items-start gap-3 mb-5 cursor-pointer group">
          <input
            type="checkbox"
            checked={coverFees}
            onChange={(e) => setCoverFees(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
          />
          <span className="text-sm text-gray-600 font-body group-hover:text-gray-800 transition-colors">
            I agree to pay the processing fee
          </span>
        </label>
        <p className="text-xs text-gray-400 font-body mb-5">
          Prefer to pay by check? Email us at{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="underline hover:text-gray-600 transition-colors"
          >
            sabrina@sagefield.co
          </a>{" "}
          and we&apos;ll send you instructions.
        </p>

        {error && (
          <p className="text-sm text-red-600 font-body mb-4">{error}</p>
        )}

        <p className="text-xs text-gray-400 font-body mb-4">
          Registration fees are non-refundable.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={loading || !coverFees}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold font-body bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting…
              </>
            ) : (
              "Proceed to Payment"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const STUDENT_AVATAR_COLORS = [
  "bg-[#4a7c59]",
  "bg-[#7c6b4a]",
  "bg-[#5a6b8a]",
  "bg-[#8a5a6b]",
  "bg-[#6b7c4a]",
  "bg-[#4a6b7c]",
];

function colorForStudentId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return STUDENT_AVATAR_COLORS[Math.abs(hash) % STUDENT_AVATAR_COLORS.length];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StudentTabAvatar({
  id,
  name,
  profileImageUrl,
  size = "sm",
}: {
  id: string;
  name: string;
  profileImageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const dims = size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]";
  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={name}
        className={`${dims} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${colorForStudentId(id)}`}
    >
      {getInitials(name)}
    </div>
  );
}

function getProgramLabel(program: string | null): string {
  if (program === "summer_26") return "Summer '26";
  if (program === "school_year_26_27") return "School Yr '26–'27";
  if (program === "both") return "Summer + School Yr '26–'27";
  if (program === "homeschool_drop_in") return "Homeschool Drop-In";
  return "the program";
}

function getProgramLabelWithEmoji(program: string | null): string | null {
  if (program === "summer_26") return "Summer '26";
  if (program === "school_year_26_27") return "School Yr '26–'27";
  if (program === "both") return "Summer + School Yr '26–'27";
  if (program === "homeschool_drop_in") return "Homeschool Drop-In";
  return null;
}

function computeIsEnrollmentComplete(
  signatureMap: SignatureMap,
  immunizationFileCount: number,
  registrationFeePaid: boolean,
): boolean {
  const requiredItems = checklistItems.filter((i) => i.required);
  return requiredItems.every((item) => {
    if (item.id === 5) return immunizationFileCount > 0;
    if (item.id === 9) return registrationFeePaid;
    if (item.contractId && item.contractSections)
      return isContractComplete(
        signatureMap,
        item.contractId,
        item.contractSections,
      );
    return false;
  });
}

function Checklist({
  childName,
  signatureMap,
  onContractClick,
  onImmunizationClick,
  immunizationFileCount,
  onViewApplication,
  onRegistrationFeeClick,
  registrationFeePaid,
  program,
  applicationId,
  applicationStatus,
  profileImageUrl,
}: {
  childName: string;
  signatureMap: SignatureMap;
  onContractClick: (contractId: number) => void;
  onImmunizationClick: () => void;
  immunizationFileCount: number;
  onViewApplication: () => void;
  onRegistrationFeeClick: () => void;
  registrationFeePaid: boolean;
  program: string | null;
  applicationId: string;
  applicationStatus: string | null;
  profileImageUrl: string | null;
}) {
  const completedCount = checklistItems.filter((item) => {
    if (item.id === 5) return immunizationFileCount > 0;
    if (item.id === 9) return registrationFeePaid;
    if (item.contractId && item.contractSections) {
      return isContractComplete(
        signatureMap,
        item.contractId,
        item.contractSections,
      );
    }
    return false;
  }).length;

  const isEnrollmentComplete = applicationStatus === 'enrolled' || computeIsEnrollmentComplete(
    signatureMap,
    immunizationFileCount,
    registrationFeePaid,
  );

  const programLabel = getProgramLabel(program);
  const programLabelWithEmoji = getProgramLabelWithEmoji(program);
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const firedRef = useRef(false);
  useEffect(() => {
    if (!isEnrollmentComplete || firedRef.current) return;
    firedRef.current = true;

    enrollApplication(applicationId);

    const fire = async () => {
      const confetti = (await import("canvas-confetti")).default;
      const colors = [
        "#ff595e",
        "#ffca3a",
        "#6a4c93",
        "#1982c4",
        "#8ac926",
        "#ff924c",
        "#ffffff",
        "#ff6b9d",
      ];

      const burst = (opts: Parameters<typeof confetti>[0]) =>
        confetti({ particleCount: 60, spread: 70, colors, ...opts });

      burst({ origin: { x: 0.3, y: 0.55 } });
      setTimeout(() => burst({ origin: { x: 0.7, y: 0.55 } }), 180);
      setTimeout(
        () =>
          burst({ origin: { x: 0.5, y: 0.4 }, particleCount: 80, spread: 90 }),
        360,
      );
    };

    fire();
  }, [isEnrollmentComplete, applicationId]);

  return (
    <div>
      {isEnrollmentComplete && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">🎉</span>
            <div>
              <h3 className="text-base font-bold font-heading text-emerald-800 mb-0.5">
                Enrollment Confirmed!
              </h3>
              <p className="text-sm font-semibold font-body text-emerald-700 mb-2">
                {childName} is confirmed and received for the{" "}
                <span className="font-bold">{programLabel}</span> at Sage Field
                Private School. ✨
              </p>
              <p className="text-sm font-body text-emerald-700/90 mb-2">
                Your child&apos;s spot is now secured and we cannot wait to
                welcome them. Our team will be in touch soon with more details
                about what to expect next.
              </p>
              <p className="text-sm font-body text-emerald-700/80">
                If you have any questions in the meantime, please don&apos;t
                hesitate to reach out at{" "}
                <a
                  href="mailto:sabrina@sagefield.co"
                  className="font-semibold underline underline-offset-2 hover:text-emerald-900 transition-colors"
                >
                  sabrina@sagefield.co
                </a>
                .
              </p>
            </div>
          </div>
        </motion.div>
      )}
      <div className="mb-5 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <StudentTabAvatar id={applicationId} name={childName} profileImageUrl={profileImageUrl} size="md" />
            <div>
              <h2 className="text-xl font-semibold font-heading text-gray-800 mb-0.5">
                Enrollment Checklist
              </h2>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                {completedCount} of {totalCount} steps completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {programLabelWithEmoji && (
              <span className="text-xs font-medium font-body text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                {programLabelWithEmoji}
              </span>
            )}
            <button
              onClick={onViewApplication}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-body bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Application
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400 font-body">
          {isEnrollmentComplete
            ? "All steps complete — enrollment is finalized!"
            : `${totalCount - completedCount} step${totalCount - completedCount !== 1 ? "s" : ""} remaining`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {checklistItems.map((item) => {
          const isImmunization = item.id === 5;
          const isRegistrationFee = item.id === 9;
          const isComplete = isImmunization
            ? immunizationFileCount > 0
            : isRegistrationFee
              ? registrationFeePaid
              : item.contractId && item.contractSections
                ? isContractComplete(
                    signatureMap,
                    item.contractId,
                    item.contractSections,
                  )
                : false;

          const signedCount =
            item.contractId && item.contractSections
              ? Object.keys(signatureMap).filter((k) =>
                  k.startsWith(`${item.contractId}-`),
                ).length
              : 0;

          const isInProgress =
            item.isContract &&
            item.contractId != null &&
            signedCount > 0 &&
            !isComplete;

          const isClickable =
            isImmunization ||
            isRegistrationFee ||
            (item.isContract && item.contractId != null);

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isImmunization) {
                  onImmunizationClick();
                } else if (isRegistrationFee) {
                  onRegistrationFeeClick();
                } else if (isClickable && item.contractId != null) {
                  onContractClick(item.contractId);
                }
              }}
              className={`rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 border transition-all ${
                isComplete
                  ? "bg-emerald-50 border-emerald-200 cursor-pointer hover:border-emerald-300 hover:shadow-md"
                  : isClickable
                    ? "bg-white border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-md"
                    : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isComplete
                    ? "bg-emerald-100 text-emerald-600"
                    : `${item.iconBg} ${item.iconColor}`
                }`}
              >
                {isComplete ? <CheckCircle className="w-4 h-4" /> : item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold font-heading truncate ${isComplete ? "text-emerald-800" : "text-gray-800"}`}
                >
                  {item.title}
                </p>
                <p
                  className={`text-xs font-body truncate ${isComplete ? "text-emerald-600/70" : "text-gray-400"}`}
                >
                  {item.subtitle}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {isRegistrationFee ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <CreditCard className="w-3 h-3" />
                      Pay
                    </span>
                  )
                ) : isImmunization ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <Upload className="w-3 h-3" />
                      Upload
                    </span>
                  )
                ) : item.isContract ? (
                  isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      <PenLine className="w-3 h-3" />
                      {signedCount} / {item.contractSections} signed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <PenLine className="w-3 h-3" />
                      Sign
                    </span>
                  )
                ) : null}
                {!item.required && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                    Optional
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-400 font-body text-center">
        Have another kid?{" "}
        <Link
          href="/apply/step/1?new=1"
          className="text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
        >
          Create an application for them
        </Link>{" "}
        — you can pay a combined registration fee for all children in one
        transaction.
      </p>
    </div>
  );
}


interface ChildTabsProps {
  apps: Application[];
  pendingApps: Application[];
  signaturesByStudent: StudentSignatureMap;
  healthInfoByStudent: Record<string, StudentHealthInfo>;
  medicationPlanByStudent: Record<
    string,
    { plan: StudentMedicationPlan | null; medications: StudentMedication[] }
  >;
  parentName: string;
  parentId: string;
  parentEmail: string;
  immunizationFileCountByStudent: Record<string, number>;
  consentByStudent: Record<string, "FULL" | "LIMITED" | "NO">;
  authorizedPickupByStudent: Record<
    string,
    { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }
  >;
  registrationFeePaidByStudent: Record<string, boolean>;
  healthStatementByStudent: Record<string, { option_type: string } | null>;
  religiousExemptionCountByStudent: Record<string, number>;
  profileImageByStudent: Record<string, string | null>;
}

export default function ChildTabs({
  apps,
  pendingApps,
  signaturesByStudent,
  healthInfoByStudent,
  medicationPlanByStudent,
  parentName,
  parentId,
  parentEmail,
  immunizationFileCountByStudent,
  consentByStudent,
  authorizedPickupByStudent,
  registrationFeePaidByStudent,
  healthStatementByStudent,
  religiousExemptionCountByStudent,
  profileImageByStudent,
}: ChildTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAppId = searchParams.get("app");
  const [activeTabId, setActiveTabId] = useState<string>(
    initialAppId && apps.find((a) => a.id === initialAppId) ? initialAppId : apps[0].id
  );
  const [appViewOpen, setAppViewOpen] = useState(false);
  const [openContractId, setOpenContractId] = useState<number | null>(null);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [healthFormOpen, setHealthFormOpen] = useState(false);
  const [healthFormStudentId, setHealthFormStudentId] = useState<string | null>(
    null,
  );
  const [medicationPlanOpen, setMedicationPlanOpen] = useState(false);
  const [medicationPlanStudentId, setMedicationPlanStudentId] = useState<
    string | null
  >(null);
  const [immunizationOpen, setImmunizationOpen] = useState(false);
  const [immunizationStudentId, setImmunizationStudentId] = useState<
    string | null
  >(null);
  const [localSigs, setLocalSigs] =
    useState<StudentSignatureMap>(signaturesByStudent);
  const [localHealthInfo, setLocalHealthInfo] =
    useState<Record<string, StudentHealthInfo>>(healthInfoByStudent);
  const [localMedicationPlan, setLocalMedicationPlan] = useState<
    Record<
      string,
      { plan: StudentMedicationPlan | null; medications: StudentMedication[] }
    >
  >(medicationPlanByStudent);
  const [localImmunizationCounts, setLocalImmunizationCounts] = useState<
    Record<string, number>
  >(immunizationFileCountByStudent);
  const [localConsent, setLocalConsent] =
    useState<Record<string, "FULL" | "LIMITED" | "NO">>(consentByStudent);
  const [photoReleaseOpen, setPhotoReleaseOpen] = useState(false);
  const [photoReleaseStudentId, setPhotoReleaseStudentId] = useState<
    string | null
  >(null);
  const [assumptionOfRiskOpen, setAssumptionOfRiskOpen] = useState(false);
  const [assumptionOfRiskStudentId, setAssumptionOfRiskStudentId] = useState<
    string | null
  >(null);
  const [authorizedPickupOpen, setAuthorizedPickupOpen] = useState(false);
  const [authorizedPickupStudentId, setAuthorizedPickupStudentId] = useState<
    string | null
  >(null);
  const [localAuthorizedPickup, setLocalAuthorizedPickup] = useState<
    Record<
      string,
      { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }
    >
  >(authorizedPickupByStudent);
  const [registrationFeeOpen, setRegistrationFeeOpen] = useState(false);
  const [combinedFeePromptOpen, setCombinedFeePromptOpen] = useState(false);
  const [localRegistrationFeePaid, setLocalRegistrationFeePaid] = useState<
    Record<string, boolean>
  >(registrationFeePaidByStudent);
  const [healthStatementOpen, setHealthStatementOpen] = useState(false);
  const [healthStatementStudentId, setHealthStatementStudentId] = useState<
    string | null
  >(null);
  const [localHealthStatements, setLocalHealthStatements] = useState<
    Record<string, { option_type: string } | null>
  >(healthStatementByStudent);
  const [localReligiousExemptionCounts, setLocalReligiousExemptionCounts] =
    useState<Record<string, number>>(religiousExemptionCountByStudent);
  const [pendingViewApp, setPendingViewApp] = useState<Application | null>(
    null,
  );

  if (apps.length === 0) {
    return (
      <p className="text-sm text-gray-500 font-body">No enrolled students.</p>
    );
  }

  const activeApprovedApp = apps.find((a) => a.id === activeTabId) ?? apps[0];
  const activePendingApp =
    pendingApps.find((a) => a.id === activeTabId) ?? null;
  const childName =
    activeApprovedApp.preferred_name ??
    activeApprovedApp.child_legal_name ??
    "Student";
  const activeStudentId = activeApprovedApp.student_id ?? "";

  const handleContractClick = (contractId: number) => {
    if (contractId === CONTRACT_3_ID) {
      setHealthFormStudentId(activeStudentId);
      setHealthFormOpen(true);
    } else if (contractId === CONTRACT_4_ID) {
      setMedicationPlanStudentId(activeStudentId);
      setMedicationPlanOpen(true);
    } else if (contractId === CONTRACT_5_ID) {
      setPhotoReleaseStudentId(activeStudentId);
      setPhotoReleaseOpen(true);
    } else if (contractId === CONTRACT_6_ID) {
      setAssumptionOfRiskStudentId(activeStudentId);
      setAssumptionOfRiskOpen(true);
    } else if (contractId === CONTRACT_7_ID) {
      setAuthorizedPickupStudentId(activeStudentId);
      setAuthorizedPickupOpen(true);
    } else if (contractId === CONTRACT_8_ID) {
      setHealthStatementStudentId(activeStudentId);
      setHealthStatementOpen(true);
    } else {
      setOpenContractId(contractId);
      setOpenStudentId(activeStudentId);
    }
  };

  const handleClose = () => {
    setOpenContractId(null);
    setOpenStudentId(null);
  };

  const handleHealthFormClose = () => {
    setHealthFormOpen(false);
    setHealthFormStudentId(null);
  };

  const handleMedicationPlanClose = () => {
    setMedicationPlanOpen(false);
    setMedicationPlanStudentId(null);
  };

  const handleImmunizationClose = () => {
    setImmunizationOpen(false);
    setImmunizationStudentId(null);
  };

  const handleImmunizationUploadComplete = (sid: string) => {
    setLocalImmunizationCounts((prev) => ({
      ...prev,
      [sid]: (prev[sid] ?? 0) + 1,
    }));
  };

  const handleSignaturesSaved = (updatedMap: SignatureMap) => {
    const sid = openStudentId ?? healthFormStudentId ?? medicationPlanStudentId;
    if (!sid) return;
    setLocalSigs((prev) => ({ ...prev, [sid]: updatedMap }));
  };

  const handlePhotoReleaseSectionSaved = (sig: EnrollmentSignature) => {
    if (!photoReleaseStudentId) return;
    const key = `${sig.contract_id}-${sig.section_id}`;
    setLocalSigs((prev) => ({
      ...prev,
      [photoReleaseStudentId]: {
        ...(prev[photoReleaseStudentId] ?? {}),
        [key]: sig,
      },
    }));
  };

  const handleConsentSaved = (level: "FULL" | "LIMITED" | "NO") => {
    if (!photoReleaseStudentId) return;
    setLocalConsent((prev) => ({ ...prev, [photoReleaseStudentId]: level }));
  };

  const handlePhotoReleaseClose = () => {
    setPhotoReleaseOpen(false);
    setPhotoReleaseStudentId(null);
  };

  const handleAssumptionOfRiskClose = () => {
    setAssumptionOfRiskOpen(false);
    setAssumptionOfRiskStudentId(null);
  };

  const handleAssumptionOfRiskSectionSaved = (sig: EnrollmentSignature) => {
    if (!assumptionOfRiskStudentId) return;
    const key = `${sig.contract_id}-${sig.section_id}`;
    setLocalSigs((prev) => ({
      ...prev,
      [assumptionOfRiskStudentId]: {
        ...(prev[assumptionOfRiskStudentId] ?? {}),
        [key]: sig,
      },
    }));
  };

  const handleAuthorizedPickupClose = () => {
    setAuthorizedPickupOpen(false);
    setAuthorizedPickupStudentId(null);
  };

  const handleAuthorizedPickupSectionSaved = (sig: EnrollmentSignature) => {
    if (!authorizedPickupStudentId) return;
    const key = `${sig.contract_id}-${sig.section_id}`;
    setLocalSigs((prev) => ({
      ...prev,
      [authorizedPickupStudentId]: {
        ...(prev[authorizedPickupStudentId] ?? {}),
        [key]: sig,
      },
    }));
  };

  const handleAuthorizedPickupPlanSaved = (plan: AuthorizedPickupPlan) => {
    if (!authorizedPickupStudentId) return;
    setLocalAuthorizedPickup((prev) => ({
      ...prev,
      [authorizedPickupStudentId]: {
        plan,
        persons: prev[authorizedPickupStudentId]?.persons ?? [],
      },
    }));
  };

  const handleHealthInfoSaved = (info: StudentHealthInfo) => {
    if (!healthFormStudentId) return;
    setLocalHealthInfo((prev) => ({ ...prev, [healthFormStudentId]: info }));
  };

  const handleMedicationPlanSaved = (plan: StudentMedicationPlan) => {
    if (!medicationPlanStudentId) return;
    setLocalMedicationPlan((prev) => ({
      ...prev,
      [medicationPlanStudentId]: {
        plan,
        medications: prev[medicationPlanStudentId]?.medications ?? [],
      },
    }));
  };

  const handleHealthStatementClose = () => {
    setHealthStatementOpen(false);
    setHealthStatementStudentId(null);
  };

  const handleHealthStatementSectionSaved = (sig: EnrollmentSignature) => {
    if (!healthStatementStudentId) return;
    const key = `${sig.contract_id}-${sig.section_id}`;
    setLocalSigs((prev) => ({
      ...prev,
      [healthStatementStudentId]: {
        ...(prev[healthStatementStudentId] ?? {}),
        [key]: sig,
      },
    }));
  };

  const handleImmunizationClick = () => {
    setImmunizationStudentId(activeStudentId);
    setImmunizationOpen(true);
  };

  const handleRegistrationFeeClick = () => {
    const unpaidApps = apps.filter(
      (a) => !(localRegistrationFeePaid[a.student_id ?? ""] ?? false),
    );
    if (unpaidApps.length >= 2) {
      setCombinedFeePromptOpen(true);
    } else {
      setRegistrationFeeOpen(true);
    }
  };

  const handleRegistrationFeePaid = () => {
    setLocalRegistrationFeePaid((prev) => ({
      ...prev,
      [activeStudentId]: true,
    }));
  };

  const handleAllRegistrationFeesPaid = () => {
    const updated: Record<string, boolean> = {};
    for (const app of apps) {
      if (app.student_id) updated[app.student_id] = true;
    }
    setLocalRegistrationFeePaid((prev) => ({ ...prev, ...updated }));
  };

  const checklist = (
    <Checklist
      key={activeApprovedApp.id}
      childName={childName}
      signatureMap={localSigs[activeStudentId] ?? {}}
      onContractClick={handleContractClick}
      onImmunizationClick={handleImmunizationClick}
      immunizationFileCount={localImmunizationCounts[activeStudentId] ?? 0}
      onViewApplication={() => setAppViewOpen(true)}
      onRegistrationFeeClick={handleRegistrationFeeClick}
      registrationFeePaid={localRegistrationFeePaid[activeStudentId] ?? false}
      program={activeApprovedApp.program ?? null}
      applicationId={activeApprovedApp.id}
      applicationStatus={activeApprovedApp.status ?? null}
      profileImageUrl={profileImageByStudent[activeStudentId] ?? null}
    />
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left: Children sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto px-3 pt-8 gap-1 bg-white border-r border-gray-100">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">
          Children
        </p>

        {apps.map((app) => {
          const label = app.preferred_name ?? app.child_legal_name ?? "Student";
          const programLabel = getProgramLabel(app.program ?? null);
          const isActive = app.id === activeTabId;
          const sid = app.student_id ?? "";
          const isComplete = computeIsEnrollmentComplete(
            localSigs[sid] ?? {},
            localImmunizationCounts[sid] ?? 0,
            localRegistrationFeePaid[sid] ?? false,
          );
          return (
            <button
              key={app.id}
              onClick={() => setActiveTabId(app.id)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              <StudentTabAvatar id={app.id} name={label} profileImageUrl={profileImageByStudent[app.student_id ?? ""] ?? null} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium truncate leading-tight">
                  {label}
                </p>
                {programLabel && programLabel !== "the program" && (
                  <p className="text-xs font-body text-gray-400 truncate leading-tight">
                    {programLabel}
                  </p>
                )}
              </div>
              {isComplete ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              )}
            </button>
          );
        })}

        {pendingApps.map((app) => {
          const label = app.preferred_name ?? app.child_legal_name ?? "Student";
          const isActive = app.id === activeTabId;
          return (
            <button
              key={app.id}
              onClick={() => setActiveTabId(app.id)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              <StudentTabAvatar id={app.id} name={label} profileImageUrl={profileImageByStudent[app.student_id ?? ""] ?? null} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium truncate leading-tight">
                  {label}
                </p>
                <p className="text-xs font-body text-gray-400 truncate leading-tight">
                  Under Review
                </p>
              </div>
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            </button>
          );
        })}

        <Link
          href="/apply/step/1?new=1"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors text-gray-400 hover:text-gray-600 hover:bg-black/5 border border-dashed border-gray-200 mt-1"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center border border-dashed border-gray-300 shrink-0">
            <PlusCircle className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-body font-medium truncate leading-tight">
            New Application
          </p>
        </Link>
      </aside>

      {/* ── Right: Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
      {activePendingApp
        ? (() => {
            const app = activePendingApp;
            const pendingChildName =
              app.preferred_name ?? app.child_legal_name ?? "Student";
            const isInProgress = app.status === "in_progress";
            const programLabel =
              app.program === "summer_26"
                ? "Summer 2026"
                : app.program === "school_year_26_27"
                  ? "School Year 2026–27"
                  : app.program === "both"
                    ? "Summer 2026 + School Year 2026–27"
                    : app.program === "homeschool_drop_in"
                      ? "Homeschool Drop-In"
                      : null;

            function getContinueStep(): number {
              if (!app.g1_full_name) return 2;
              if (
                !app.has_medical_conditions &&
                !app.medical_conditions_description
              )
                return 3;
              if (!app.learning_style) return 4;
              if (!app.g1_signature_name) return 5;
              return 1;
            }

            return (
              <div className="bg-white border border-amber-200 rounded-2xl p-8 flex flex-col items-center text-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-heading text-gray-800 mb-1">
                    {isInProgress
                      ? "Application Incomplete"
                      : "Application Under Review"}
                  </h2>
                  {programLabel && (
                    <p className="text-sm text-amber-600 font-body font-medium mb-2">
                      {programLabel}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 font-body max-w-sm">
                    {isInProgress
                      ? `${pendingChildName}'s application hasn't been submitted yet. Pick up where you left off to complete it.`
                      : `${pendingChildName}'s application has been submitted and is currently under review. We'll be in touch once a decision has been made.`}
                  </p>
                </div>
                {isInProgress ? (
                  <Link
                    href={`/apply/step/${getContinueStep()}?appId=${app.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-heading text-white bg-[#2C5F2E] hover:bg-[#234d25] transition-colors"
                  >
                    Continue Application
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => setPendingViewApp(app)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-heading text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
                    >
                      View Application
                    </button>
                    <EnrollmentCodeEntry
                      applicationId={app.id}
                      onSuccess={() => router.refresh()}
                    />
                  </div>
                )}
              </div>
            );
          })()
        : checklist}
            </motion.div>
          </AnimatePresence>

      {openContractId !== null && openStudentId !== null && (
        <ContractModal
          isOpen
          onClose={handleClose}
          contractId={openContractId}
          studentId={openStudentId}
          parentName={parentName}
          existingSignatures={localSigs[openStudentId] ?? {}}
          onSignaturesSaved={handleSignaturesSaved}
        />
      )}

      {healthFormOpen && healthFormStudentId !== null && (
        <HealthFormModal
          isOpen
          onClose={handleHealthFormClose}
          studentId={healthFormStudentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === healthFormStudentId)!}
          existingSignatures={localSigs[healthFormStudentId] ?? {}}
          existingHealthInfo={localHealthInfo[healthFormStudentId] ?? null}
          onSignaturesSaved={handleSignaturesSaved}
          onHealthInfoSaved={handleHealthInfoSaved}
        />
      )}

      {medicationPlanOpen && medicationPlanStudentId !== null && (
        <MedicationPlanModal
          isOpen
          onClose={handleMedicationPlanClose}
          studentId={medicationPlanStudentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === medicationPlanStudentId)!}
          existingSignatures={localSigs[medicationPlanStudentId] ?? {}}
          existingPlan={
            localMedicationPlan[medicationPlanStudentId] ?? {
              plan: null,
              medications: [],
            }
          }
          onSignaturesSaved={handleSignaturesSaved}
          onPlanSaved={handleMedicationPlanSaved}
        />
      )}

      {photoReleaseOpen && photoReleaseStudentId !== null && (
        <PhotoReleaseModal
          open
          onClose={handlePhotoReleaseClose}
          studentId={photoReleaseStudentId}
          studentName={
            apps.find((a) => a.student_id === photoReleaseStudentId)
              ?.preferred_name ??
            apps.find((a) => a.student_id === photoReleaseStudentId)
              ?.child_legal_name ??
            "Student"
          }
          parentId={parentId}
          parentName={parentName}
          signatures={localSigs[photoReleaseStudentId] ?? {}}
          onSectionSaved={handlePhotoReleaseSectionSaved}
          existingConsent={localConsent[photoReleaseStudentId] ?? null}
          onConsentSaved={handleConsentSaved}
        />
      )}

      {assumptionOfRiskOpen && assumptionOfRiskStudentId !== null && (
        <AssumptionOfRiskModal
          open
          onClose={handleAssumptionOfRiskClose}
          studentId={assumptionOfRiskStudentId}
          parentId={parentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === assumptionOfRiskStudentId)!}
          signatures={localSigs[assumptionOfRiskStudentId] ?? {}}
          onSectionSaved={handleAssumptionOfRiskSectionSaved}
        />
      )}

      {authorizedPickupOpen && authorizedPickupStudentId !== null && (
        <AuthorizedPickupModal
          open
          onClose={handleAuthorizedPickupClose}
          studentId={authorizedPickupStudentId}
          parentId={parentId}
          parentName={parentName}
          app={apps.find((a) => a.student_id === authorizedPickupStudentId)!}
          signatures={localSigs[authorizedPickupStudentId] ?? {}}
          onSectionSaved={handleAuthorizedPickupSectionSaved}
          existingPlan={
            localAuthorizedPickup[authorizedPickupStudentId] ?? {
              plan: null,
              persons: [],
            }
          }
          onPlanSaved={handleAuthorizedPickupPlanSaved}
        />
      )}

      {healthStatementOpen && healthStatementStudentId !== null && (
        <HealthStatementModal
          app={apps.find((a) => a.student_id === healthStatementStudentId)!}
          parentId={parentId}
          parentName={parentName}
          existingStatement={
            localHealthStatements[healthStatementStudentId] ?? null
          }
          initialReligiousExemptionCount={
            localReligiousExemptionCounts[healthStatementStudentId] ?? 0
          }
          existingSig={
            localSigs[healthStatementStudentId]?.[`${CONTRACT_8_ID}-1`]
          }
          onSectionSaved={handleHealthStatementSectionSaved}
          onClose={handleHealthStatementClose}
        />
      )}

      {immunizationOpen && immunizationStudentId !== null && (
        <ImmunizationUploadModal
          isOpen
          onClose={handleImmunizationClose}
          parentId={parentId}
          studentId={immunizationStudentId}
          studentName={
            apps.find((a) => a.student_id === immunizationStudentId)
              ?.preferred_name ??
            apps.find((a) => a.student_id === immunizationStudentId)
              ?.child_legal_name ??
            "Student"
          }
          onUploadComplete={handleImmunizationUploadComplete}
        />
      )}

      <AnimatePresence>
        {combinedFeePromptOpen && (
          <CombinedRegistrationFeeModal
            apps={apps.filter(
              (a) => !(localRegistrationFeePaid[a.student_id ?? ""] ?? false),
            )}
            parentEmail={parentEmail}
            onClose={() => setCombinedFeePromptOpen(false)}
            onAllPaid={handleAllRegistrationFeesPaid}
            onPayIndividually={() => {
              setCombinedFeePromptOpen(false);
              setRegistrationFeeOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {registrationFeeOpen && (
          <RegistrationFeeModal
            app={activeApprovedApp}
            parentEmail={parentEmail}
            onClose={() => setRegistrationFeeOpen(false)}
            onPaid={handleRegistrationFeePaid}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appViewOpen && (
          <ApplicationViewSlideOver
            app={activeApprovedApp}
            onClose={() => setAppViewOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingViewApp !== null && (
          <ApplicationViewSlideOver
            app={pendingViewApp}
            onClose={() => setPendingViewApp(null)}
          />
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
