"use client";

import { useState } from "react";
import type { AttendanceFilter, UnifiedAttendanceRecord } from "@/shared/parent/student-attendance";
import type { HomeStudent } from "../page";
import GardenSheet from "@/app/parent/_garden/sheet";
import { firstNameOf } from "@/app/parent/_garden/ui";
import {
  AttendanceFilters,
  AttendanceList,
  AttendanceRecordDetail,
  AttendanceSummary,
  attendanceNote,
  formatAttendanceDate,
  useAttendanceHistory,
} from "@/app/parent/children/garden/AttendanceHistory";

/** Home's attendance sheet. The list and record detail are shared with My Children (`AttendanceHistory`). */
export default function AttendanceSheet({
  student,
  open,
  onClose,
}: {
  student: HomeStudent | null;
  open: boolean;
  onClose: () => void;
}) {
  const att = useAttendanceHistory(student?.id, open);
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selected, setSelected] = useState<UnifiedAttendanceRecord | null>(null);
  const firstName = student ? firstNameOf(student.child_legal_name) : "";
  const ready = att.status === "ready" && att.records.length > 0;

  return (
    <GardenSheet
      open={open && !!student}
      onClose={onClose}
      icon="📋"
      title={selected ? "Attendance Record" : `${firstName}'s Attendance`}
      note={selected ? formatAttendanceDate(selected.date) : attendanceNote(att)}
      onBack={selected ? () => setSelected(null) : undefined}
      backLabel="Back to attendance list"
      toolbar={!selected && ready ? <AttendanceFilters value={filter} onChange={setFilter} /> : null}
    >
      {selected ? (
        <AttendanceRecordDetail record={selected} userMap={att.userMap} />
      ) : (
        <div className="flex flex-col gap-4">
          {ready ? <AttendanceSummary records={att.records} /> : null}
          <AttendanceList att={att} filter={filter} onSelect={setSelected} />
        </div>
      )}
    </GardenSheet>
  );
}
