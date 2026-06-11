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
  Download,
  Menu,
  X,
  SlidersHorizontal,
  Camera,
  Gift,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import HelpWidget from "../components/HelpWidget";
import ManageAccessModal from "./ManageAccessModal";

const primaryNavItems: { label: string; icon: LucideIcon; href: string; badge?: string; iconColor?: string }[] = [
  { label: "Home", icon: Home, href: "/parent/home", iconColor: "text-emerald-400" },
  { label: "My Children", icon: Users, href: "/parent/children", iconColor: "text-indigo-400" },
  { label: "Tuition", icon: CreditCard, href: "/parent/billing", iconColor: "text-green-400" },
  { label: "Messages", icon: MessageCircle, href: "/parent/messages", iconColor: "text-blue-400" },
  { label: "Calendar", icon: Calendar, href: "/parent/calendar", iconColor: "text-purple-400" },
  { label: "Photos", icon: Camera, href: "/parent/photos", badge: "New!", iconColor: "text-fuchsia-400" },
];

const moreItems: {
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: string;
  badge?: string;
  iconColor?: string;
}[] = [
  { label: "Feed", icon: Rss, href: "/parent/feed", iconColor: "text-sky-400" },
  { label: "Enrollment", icon: ClipboardCheck, href: "/parent/dashboard", iconColor: "text-violet-400" },
  { label: "Preferences", icon: SlidersHorizontal, href: "/parent/preferences", iconColor: "text-slate-400" },
  { label: "Forms & Documents", icon: FileText, href: "/parent/forms", iconColor: "text-amber-400" },
  { label: "Rewards", icon: Gift, href: "/parent/rewards", iconColor: "text-pink-400" },
  { label: "Volunteer Opportunities", icon: Heart, href: "/parent/volunteer", iconColor: "text-rose-400" },
  { label: "Emergency Contacts", icon: Phone, href: "/parent/emergency-contacts", iconColor: "text-red-400" },
  { label: "Download the App", icon: Download, href: "/download", badge: "New!", iconColor: "text-teal-400" },
  { label: "Need Help", icon: HelpCircle, action: "help", iconColor: "text-orange-400" },
  { label: "Manage Access", icon: Users, action: "manage-access" },
];

export default function DashboardNav({
  parentId,
  hasEnrolledStudent = true,
  isSharedAccess = false,
}: {
  parentId?: string;
  hasEnrolledStudent?: boolean;
  isSharedAccess?: boolean;
} = {}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [manageAccessOpen, setManageAccessOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  if (!hasEnrolledStudent) return null;

  const impersonateBase = parentId ? `/admin/impersonate/${parentId}` : null;

  function navHref(parentPath: string) {
    if (!impersonateBase) return parentPath;
    const slug = parentPath.replace("/parent/", "");
    return `${impersonateBase}/${slug}`;
  }

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
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden p-2 text-gray-600 hover:text-[#4a7c59] rounded-md transition-colors cursor-pointer"
        onClick={() => setMobileMenuOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop nav — unchanged */}
      <nav className="hidden md:flex items-center gap-2">
        {primaryNavItems.map(({ label, icon: Icon, href, badge, iconColor }) => {
          const resolvedHref = navHref(href);
          const isActive = href !== "#" && pathname === resolvedHref;
          return (
            <Link
              key={label}
              href={resolvedHref}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-body rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                  : "text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${!isActive ? (iconColor ?? "") : ""}`} />
              {label}
              {badge && (
                <span className="ml-1 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 shrink-0 bg-green-100 text-green-700">
                  {badge}
                </span>
              )}
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
            <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-72 bg-white border border-gray-100 rounded-xl shadow-sm z-50 p-2 grid grid-cols-3 gap-1">
              {moreItems.map(({ label, icon: Icon, href, action, badge, iconColor }) => {
                if (action === "manage-access") return null;
                const resolvedHref = href ? navHref(href) : undefined;
                const isActive = !!resolvedHref && pathname === resolvedHref;
                const baseClass = `flex flex-col items-center justify-center gap-1 w-full text-center px-1 py-3 rounded-lg text-xs font-body transition-colors cursor-pointer ${
                  isActive
                    ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#4a7c59]"
                }`;
                const tileContent = (
                  <>
                    <Icon className={`w-4 h-4 ${!isActive ? (iconColor ?? "") : ""}`} />
                    <span className="leading-tight">{label}</span>
                    {badge && (
                      <span className="text-[9px] font-semibold uppercase rounded-full px-1.5 py-px bg-green-100 text-green-700 whitespace-nowrap">
                        {badge}
                      </span>
                    )}
                  </>
                );
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
                      {tileContent}
                    </button>
                  );
                }
                return resolvedHref ? (
                  <Link
                    key={label}
                    href={resolvedHref}
                    onClick={() => setMoreOpen(false)}
                    className={baseClass}
                  >
                    {tileContent}
                  </Link>
                ) : (
                  <button
                    key={label}
                    onClick={() => setMoreOpen(false)}
                    className={baseClass}
                  >
                    {tileContent}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute inset-x-0 top-full z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 pt-2 pb-3 grid grid-cols-2 gap-1">
            {primaryNavItems.map(({ label, icon: Icon, href, badge, iconColor }) => {
              const resolvedHref = navHref(href);
              const isActive = href !== "#" && pathname === resolvedHref;
              return (
                <Link
                  key={label}
                  href={resolvedHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-body transition-colors ${
                    isActive
                      ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                      : "text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${!isActive ? (iconColor ?? "") : ""}`} />
                  {label}
                  {badge && (
                    <span className="ml-1 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 shrink-0 bg-green-100 text-green-700">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {moreItems.map(({ label, icon: Icon, href, action, badge }) => {
              if (action === "manage-access") return null;
              const resolvedHref = href ? navHref(href) : undefined;
              const isActive = !!resolvedHref && pathname === resolvedHref;
              const baseClass = `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-body transition-colors cursor-pointer ${
                isActive
                  ? "text-[#4a7c59] bg-[#4a7c59]/8 font-semibold"
                  : "text-gray-600 hover:text-[#4a7c59] hover:bg-gray-50"
              }`;
              if (action === "help") {
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setHelpOpen(true);
                    }}
                    className={baseClass}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              }
              return resolvedHref ? (
                <Link
                  key={label}
                  href={resolvedHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={baseClass}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge && (
                    <span className="ml-1 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 shrink-0 bg-green-100 text-green-700">
                      {badge}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  key={label}
                  onClick={() => setMobileMenuOpen(false)}
                  className={baseClass}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <HelpWidget
        hideFloatingButton
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />
      <ManageAccessModal
        isOpen={manageAccessOpen}
        onClose={() => setManageAccessOpen(false)}
      />
    </>
  );
}
