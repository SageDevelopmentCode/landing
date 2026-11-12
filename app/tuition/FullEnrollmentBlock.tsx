"use client";

import Link from "next/link";
import { useDialogs } from "@/app/_garden/GardenShell";
import { FullEnrollment, Packages } from "@/app/_home/sections/Tuition";
import { btnOutline, btnPop } from "@/app/_garden/ui";
import { FULL_ENROLLMENT_ACTIONS as A } from "./content";

/**
 * Full Enrollment + the Extended Learning / Field Day Friday packages, with the
 * buttons and drop-in email note the legacy FullEnrollmentCard had. Shared by
 * /tuition and /school-year-2026-2027.
 */
export default function FullEnrollmentBlock({ headingAs = "h3" }: { headingAs?: "h2" | "h3" }) {
  const { openWaitlist } = useDialogs();
  return (
    <>
      <FullEnrollment
        headingAs={headingAs}
        actions={
          <>
            <Link href="/apply" className={btnPop}>
              {A.interested}
            </Link>
            <button onClick={openWaitlist} className={btnOutline}>
              {A.questions}
            </button>
          </>
        }
        footnote={
          <>
            {A.dropInNote}{" "}
            <a href={`mailto:${A.email}`} className="font-bold not-italic text-[var(--sf-coral-deep)] underline-offset-2 hover:underline focus-visible:underline">
              {A.email}
            </a>
          </>
        }
      />
      <Packages className="mt-8" />
    </>
  );
}
