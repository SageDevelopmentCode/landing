"use client";

import PortalShell from "@/app/parent/_garden/PortalShell";
import AcademicCalendarGarden from "./garden/AcademicCalendarGarden";

/**
 * Parent-only Garden view of the academic calendar. The public `/academic-calendar`
 * page keeps the shared `AcademicCalendarView`.
 */
export default function ParentAcademicCalendarClient() {
  return (
    <PortalShell>
      <AcademicCalendarGarden />
    </PortalShell>
  );
}
