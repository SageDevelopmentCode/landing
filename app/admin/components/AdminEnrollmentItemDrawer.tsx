"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { AdminEnrollmentData } from "../../actions/getAdminEnrollmentData";
import type { ApprovedApplication } from "./EnrollmentProgressCard";
import {
  ENROLLMENT_ITEM_TITLES,
  ImmunizationFilesContent,
  SignatureFontProvider,
  renderEnrollmentItemContent,
  type EnrollmentSummaryApplication,
} from "./enrollment-summary/EnrollmentSummarySections";

type CachedEnrollmentData = AdminEnrollmentData & {
  registrationFeePaidByStudent: Record<string, boolean>;
  siblingApps: ApprovedApplication[];
};

type Application = EnrollmentSummaryApplication & {
  admin_notes: string | null;
  status: string;
  approved: boolean;
  approved_at: string | null;
  denied: boolean;
  denied_at: string | null;
  denied_reason: string | null;
  created_at: string | null;
  is_active: boolean | null;
  [key: string]: unknown;
};

interface AdminEnrollmentItemDrawerProps {
  itemId: number | null;
  studentId: string | null;
  app: Application | null;
  enrollmentData: CachedEnrollmentData | null;
  onClose: () => void;
}

export function AdminEnrollmentItemDrawer({
  itemId,
  studentId,
  app,
  enrollmentData,
  onClose,
}: AdminEnrollmentItemDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const show = itemId !== null && studentId !== null;
  const title = show ? (ENROLLMENT_ITEM_TITLES[itemId!] ?? "Enrollment Item") : "";

  const renderContent = () => {
    if (!show || !studentId) return null;

    if (itemId === 5) {
      if (!app) {
        return <p className="text-sm text-gray-400">No application data.</p>;
      }
      return (
        <ImmunizationFilesContent
          parentId={app.user_id}
          studentId={studentId}
        />
      );
    }

    if (!app) {
      return <p className="text-sm text-gray-400">No application data.</p>;
    }

    const signatureMap = enrollmentData?.signaturesByStudent[studentId] ?? {};
    const { plan: medicationPlan, medications } =
      enrollmentData?.medicationPlanByStudent[studentId] ?? {
        plan: null,
        medications: [],
      };
    const { plan: pickupPlan, persons: pickupPersons } =
      enrollmentData?.authorizedPickupByStudent[studentId] ?? {
        plan: null,
        persons: [],
      };
    const healthStatement =
      enrollmentData?.healthStatementByStudent[studentId] ?? null;

    return renderEnrollmentItemContent({
      itemId: itemId!,
      app,
      signatureMap,
      healthInfo: enrollmentData?.healthInfoByStudent[studentId] ?? null,
      medicationPlan,
      medications,
      photoConsentLevel:
        enrollmentData?.photoConsentByStudent[studentId] ?? null,
      pickupPlan,
      pickupPersons,
      registrationFeePaid:
        enrollmentData?.registrationFeePaidByStudent[studentId] ?? false,
      healthStatementOptionType: healthStatement?.option_type ?? null,
      religiousExemptionCount:
        enrollmentData?.religiousExemptionCountByStudent[studentId] ?? 0,
      immunizationFileNames: [],
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-[55]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl z-[60] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold font-body text-gray-900 leading-snug pr-4 line-clamp-2">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SignatureFontProvider className="flex-1 overflow-y-auto px-6 py-5">
              {renderContent()}
            </SignatureFontProvider>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
