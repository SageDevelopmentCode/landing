"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md text-gray-500 hover:text-[#4a7c59] hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label="Share feedback"
      >
        <Sparkles className="w-5 h-5" />
      </button>
      <FeedbackModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
