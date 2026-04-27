"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Home,
  Users,
  CreditCard,
  MessageCircle,
  Calendar,
  FileText,
  ClipboardCheck,
  Heart,
  Phone,
  Rss,
  HelpCircle,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import HelpWidget from "../components/HelpWidget";

const primaryNavItems: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Home", icon: Home, href: "/parent/home" },
  { label: "My Children", icon: Users, href: "/parent/children" },
  { label: "Tuition", icon: CreditCard, href: "/parent/billing" },
  { label: "Messages", icon: MessageCircle, href: "/parent/messages" },
  { label: "Calendar", icon: Calendar, href: "/parent/calendar" },
  { label: "Feed", icon: Rss, href: "/parent/feed" },
];

const moreItems: {
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: string;
}[] = [
  { label: "Enrollment", icon: ClipboardCheck, href: "/parent/dashboard" },
  { label: "Forms & Documents", icon: FileText, href: "/parent/forms" },
  { label: "Volunteer Opportunities", icon: Heart, href: "/parent/volunteer" },
  {
    label: "Emergency Contacts",
    icon: Phone,
    href: "/parent/emergency-contacts",
  },
  { label: "Need Help", icon: HelpCircle, action: "help" },
];

export default function DashboardNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
            {moreItems.map(({ label, icon: Icon, href, action }) => {
              const isActive = !!href && pathname === href;
              const baseClass = `flex items-center gap-1.5 w-full text-left px-4 py-2 text-sm font-body transition-colors cursor-pointer ${
                isActive
                  ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                  : "text-gray-700 hover:bg-gray-50 hover:text-[#4a7c59]"
              }`;
              if (action === "help") {
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setMoreOpen(false);
                      setHelpOpen(true);
                    }}
                    className={baseClass}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              }
              return href ? (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={baseClass}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ) : (
                <button
                  key={label}
                  onClick={() => setMoreOpen(false)}
                  className={baseClass}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <HelpWidget
        hideFloatingButton
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />
    </nav>
  );
}
