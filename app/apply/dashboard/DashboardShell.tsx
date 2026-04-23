"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import HelpWidget from "@/app/parent/components/HelpWidget";

export default function DashboardShell({ hasSubmitted }: { hasSubmitted: boolean }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      {hasSubmitted && (
        <motion.div
          className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm mb-6 flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E0EDE2] flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-4 h-4 text-[#2C5F2E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 font-body">
                Have a question about your application?
              </p>
              <p className="text-xs text-gray-500 font-body">
                Our admissions team is here to help.
              </p>
            </div>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="text-xs font-semibold text-white bg-[#2C5F2E] hover:bg-[#234d25] rounded-lg px-3 py-2 font-body transition-colors whitespace-nowrap flex-shrink-0"
          >
            Contact us
          </button>
        </motion.div>
      )}

      <HelpWidget
        open={helpOpen}
        onOpenChange={setHelpOpen}
        hideFloatingButton={hasSubmitted}
      />
    </>
  );
}
