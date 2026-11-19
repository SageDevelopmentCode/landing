// The feature sheets the parent Home mounts (auto-fill, add-events intro,
// activity preference, parent-teacher conference). Wiring is identical to the
// original (tabs)/home.tsx; the optional callbacks let preview layouts add
// toasts without changing behaviour.
import { AutoFillPreferencesSheet } from "@/components/AutoFillPreferencesSheet";
import { ParentActivityPreferenceSheet } from "@/components/ParentActivityPreferenceSheet";
import { ParentAddEventsIntroSheet } from "@/components/ParentAddEventsIntroSheet";
import { ParentTeacherConferenceSheet } from "@/components/ParentTeacherConferenceSheet";
import type { ConferenceBookingRecord } from "@/lib/parent-teacher-conference";
import type { ParticipationLevel } from "@/lib/activity-preferences";
import type { ParentHome } from "./useParentHome";

type Props = {
  home: ParentHome;
  onDefaultSaved?: (
    studentId: string,
    level: ParticipationLevel | null,
    ok: boolean,
  ) => void;
  onActivitySaved?: () => void;
  onBookingsChanged?: (
    bookings: Record<string, ConferenceBookingRecord>,
    previous: Record<string, ConferenceBookingRecord>,
  ) => void;
};

export function ParentHomeExternalSheets({
  home: h,
  onDefaultSaved,
  onActivitySaved,
  onBookingsChanged,
}: Props) {
  return (
    <>
      {h.students.length > 0 && h.effectiveParentId && (
        <AutoFillPreferencesSheet
          ref={h.autoFillSheetRef}
          eligibleStudents={h.eligibleAutoFillStudents}
          studentDefaults={h.studentDefaults}
          defaultSaveStatusByStudent={h.defaultSaveStatusByStudent}
          onSetDefault={(studentId, level) =>
            void h.handleHomeSetDefault(studentId, level).then((r) => {
              if (!r.canceled) onDefaultSaved?.(studentId, level, r.ok);
            })
          }
          readOnly={h.isReadOnlyPreview}
        />
      )}

      <ParentAddEventsIntroSheet
        ref={h.calendarAddIntroSheetRef}
        onAcknowledge={() => void h.markCalendarAddIntroSeen()}
      />

      {h.students.length > 0 && h.effectiveParentId && (
        <ParentActivityPreferenceSheet
          ref={h.activityPrefSheetRef}
          activity={h.selectedActivity}
          students={h.students}
          parentId={h.effectiveParentId}
          userId={h.userId}
          readOnly={h.isReadOnlyPreview}
          onSaved={() => {
            void h.refreshActivityBanner();
            onActivitySaved?.();
          }}
        />
      )}

      {h.students.length > 0 && h.effectiveParentId && (
        <ParentTeacherConferenceSheet
          ref={h.ptcSheetRef}
          parentId={h.effectiveParentId}
          conferenceTeachers={h.conferenceTeachers}
          conferenceStudents={
            h.conferenceStudents.length > 0
              ? h.conferenceStudents
              : h.ptcStudentsForBanner
          }
          initialBookingsByStudent={h.conferenceBookingsByStudent}
          initialTakenSlotKeys={h.conferenceTakenSlotKeys}
          contextLoading={h.conferenceContextLoading}
          contextError={h.conferenceContextError}
          onRetryLoad={() => void h.loadConferenceContext()}
          onBookingsChange={(bookings, takenKeys) => {
            const previous = h.conferenceBookingsByStudent;
            h.setConferenceBookingsByStudent(bookings);
            h.setConferenceTakenSlotKeys(takenKeys);
            onBookingsChanged?.(bookings, previous);
          }}
        />
      )}
    </>
  );
}
