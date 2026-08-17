"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
  ConferenceTeacherDisplay,
  ConferenceBookingRecord,
} from "@/app/lib/parent-teacher-conference";
import type { ConferenceStudentContext } from "@/app/lib/get-conference-teacher-assignments";
import type {
  PaidSchoolYearByStudent,
  SchoolYearOnlyApp,
  SummerEnrollment,
} from "./page";
import ParentTeacherConferenceSection, {
  getPtcBannerSubtext,
} from "./ParentTeacherConferenceSheet";
import {
  getSchoolYearTuitionStudentIds,
  getTuitionActionSubtext,
  needsConferenceScheduling,
  needsSchoolYearTuitionAction,
} from "@/shared/action-needed";

type Props = {
  parentId: string;
  hasActivityForPaidDay: boolean;
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  summerEnrollments: SummerEnrollment[];
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  conferenceBookingsByStudent: Record<string, ConferenceBookingRecord>;
  conferenceTakenSlotKeys: string[];
  readOnly?: boolean;
};

export default function ActionNeededCard({
  parentId,
  hasActivityForPaidDay,
  schoolYearOnlyApps,
  summerEnrollments,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
  conferenceTeachers,
  conferenceStudents,
  conferenceBookingsByStudent,
  conferenceTakenSlotKeys,
  readOnly = false,
}: Props) {
  const [ptcOpen, setPtcOpen] = useState(false);

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
  const showPtc = needsConferenceScheduling(
    conferenceStudents.map((s) => s.studentId),
    conferenceBookingsByStudent,
  );
  const showActivity = hasActivityForPaidDay;

  if (!showTuition && !showPtc && !showActivity) {
    return null;
  }

  const tuitionSubtext = getTuitionActionSubtext(
    schoolYearTuitionStudentIds,
    paidSupplyFeeByStudent,
  );

  const ptcSubtext = getPtcBannerSubtext(
    conferenceStudents,
    conferenceBookingsByStudent,
  );

  return (
    <>
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

          {showPtc && (
            <button
              type="button"
              onClick={() => setPtcOpen(true)}
              className="w-full text-left rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <span className="text-xl shrink-0">📅</span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-bold text-emerald-900 leading-snug font-heading">
                  Schedule your parent-teacher conference
                </span>
                <span className="text-xs text-emerald-700 font-body">
                  {ptcSubtext}
                </span>
              </div>
              <ChevronRight size={16} className="text-emerald-500 shrink-0" />
            </button>
          )}

          {showActivity && (
            <Link
              href="/parent/preferences"
              className="rounded-xl border border-amber-200/60 bg-amber-100/60 px-3 py-3 flex flex-col gap-2 hover:bg-amber-100/80 transition-colors"
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
            </Link>
          )}
        </div>
      </div>

      {showPtc && (
        <ParentTeacherConferenceSection
          parentId={parentId}
          conferenceTeachers={conferenceTeachers}
          conferenceStudents={conferenceStudents}
          initialBookingsByStudent={conferenceBookingsByStudent}
          initialTakenSlotKeys={conferenceTakenSlotKeys}
          hideBanner
          open={ptcOpen}
          onOpenChange={setPtcOpen}
          readOnly={readOnly}
        />
      )}
    </>
  );
}
