"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import OnboardingChecklist from "./OnboardingChecklist";

const TOTAL_TASKS = 7;

export default function OnboardingChecklistButton() {
  const [open, setOpen] = useState(false);
  // completed count will come from DB later; for now always show badge
  const completedCount = 0;
  const showBadge = completedCount < TOTAL_TASKS;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-1.5 rounded-md text-gray-500 hover:text-[#4a7c59] hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label="Onboarding checklist"
      >
        <ClipboardList className="w-5 h-5" />
        {showBadge && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#4a7c59]" />
        )}
      </button>
      <OnboardingChecklist open={open} onClose={() => setOpen(false)} />
    </>
  );
}
