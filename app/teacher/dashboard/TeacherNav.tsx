"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  ClipboardCheck,
  Clock,
  MessageCircle,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  UserCircle,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

const primaryNavItems: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/teacher/dashboard" },
  { label: "Attendance", icon: ClipboardCheck, href: "#" },
  { label: "My Hours", icon: Clock, href: "#" },
  { label: "Messages", icon: MessageCircle, href: "#" },
  { label: "Calendar", icon: Calendar, href: "#" },
];

const moreItems: { label: string; icon: LucideIcon }[] = [
  { label: "Payroll", icon: CreditCard },
  { label: "Class Updates", icon: BookOpen },
  { label: "Forms and Documents", icon: FileText },
  { label: "Profile", icon: UserCircle },
];

export default function TeacherNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  return (
    <nav className="flex items-center gap-2">
      {primaryNavItems.map(({ label, icon: Icon, href }) => {
        const isActive = href !== "#" && pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-body rounded-md transition-colors whitespace-nowrap ${
              isActive
                ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                : "text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}

      {/* More dropdown */}
      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-body text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
        >
          More
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
        </button>

        {moreOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-sm z-50 py-1.5">
            {moreItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-1.5 w-full text-left px-4 py-2 text-sm font-body text-gray-700 hover:bg-gray-50 hover:text-[#4a7c59] transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
