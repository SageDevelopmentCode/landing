"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
  PaidSchoolYearByStudent,
  SchoolYearOnlyApp,
  SummerEnrollment,
} from "./page";
import {
  getSchoolYearTuitionStudentIds,
  getTuitionActionSubtext,
  needsSchoolYearTuitionAction,
} from "@/shared/action-needed";

type Props = {
  hasActivityForPaidDay: boolean;
  onOpenActivityPrefs?: () => void;
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  summerEnrollments: SummerEnrollment[];
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
};

export default function ActionNeededCard({
  hasActivityForPaidDay,
  onOpenActivityPrefs,
  schoolYearOnlyApps,
  summerEnrollments,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
}: Props) {
  const schoolYearTuitionStudentIds = useMemo(
    () =>
      getSchoolYearTuitionStudentIds(
        schoolYearOnlyApps.map((a) => a.student_id),
        summerEnrollments
          .filter((e) => e.program === "both")
          .map((e) => e.student_id),
      ),
    [schoolYearOnlyApps, summerEnrollments],
  );

  const showTuition = needsSchoolYearTuitionAction(
    schoolYearTuitionStudentIds,
    paidSchoolYearByStudent,
  );
  const showActivity = hasActivityForPaidDay;

  if (!showTuition && !showActivity) {
    return null;
  }

  const tuitionSubtext = getTuitionActionSubtext(
    schoolYearTuitionStudentIds,
    paidSupplyFeeByStudent,
  );

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex flex-col gap-3 shadow-sm">
      <span className="self-start text-xs font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full font-body">
        Action Needed
      </span>

      <div className="flex flex-col gap-2">
        {showTuition && (
          <Link
            href="/parent/billing"
            className="rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors"
          >
            <span className="text-xl shrink-0">🏫</span>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-bold text-blue-900 leading-snug font-heading">
                School Year Tuition Available
              </span>
              <span className="text-xs text-blue-600 font-body">
                {tuitionSubtext}
              </span>
            </div>
            <ChevronRight size={16} className="text-blue-400 shrink-0" />
          </Link>
        )}

        {showActivity && (
          <button
            type="button"
            onClick={() => onOpenActivityPrefs?.()}
            className="w-full text-left rounded-xl border border-amber-200/60 bg-amber-100/60 px-3 py-3 flex flex-col gap-2 hover:bg-amber-100/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0">🍳</span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-semibold text-amber-900 font-heading">
                  Activity Preferences
                </span>
                <span className="text-xs text-amber-800 font-body leading-relaxed">
                  Your child has upcoming activities at Sage Field. Let us know
                  how they&apos;d like to participate.
                </span>
              </div>
              <ChevronRight size={16} className="text-amber-600 shrink-0" />
            </div>
            <div className="self-start inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors font-body ml-9">
              Set Preferences <ChevronRight size={13} />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
