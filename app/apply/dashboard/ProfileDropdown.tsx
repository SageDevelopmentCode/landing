"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { signOut } from "@/app/actions/auth";

interface ProfileDropdownProps {
  email: string;
  fullName: string | null;
}

export default function ProfileDropdown({
  email,
  fullName,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full cursor-pointer focus:outline-none"
        aria-label="Profile menu"
      >
        <span
          className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold"
          style={{ backgroundColor: "#d4e6d0", color: "#4a7c59" }}
        >
          {email.charAt(0).toUpperCase()}
        </span>
        {fullName && (
          <span className="text-sm font-medium text-gray-700 font-body">
            {fullName}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-sm z-50"
          >
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-body mb-0.5">
                Signed in as
              </p>
              <p className="text-sm font-medium text-gray-800 font-body truncate">
                {email}
              </p>
            </div>
            <div className="border-t border-gray-100" />
            <div className="px-3 py-2">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 text-sm font-body text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
