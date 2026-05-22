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
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import HelpWidget from "../components/HelpWidget";
import ManageAccessModal from "./ManageAccessModal";

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
  badge?: string;
}[] = [
  { label: "Enrollment", icon: ClipboardCheck, href: "/parent/dashboard" },
  { label: "Forms & Documents", icon: FileText, href: "/parent/forms" },
  { label: "Volunteer Opportunities", icon: Heart, href: "/parent/volunteer" },
  {
    label: "Emergency Contacts",
    icon: Phone,
    href: "/parent/emergency-contacts",
  },
  { label: "Download the App", icon: Download, href: "/download", badge: "New!" },
  { label: "Need Help", icon: HelpCircle, action: "help" },
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
        {primaryNavItems.map(({ label, icon: Icon, href }) => {
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
              {moreItems.map(({ label, icon: Icon, href, action, badge }) => {
                if (action === "manage-access") return null;
                const resolvedHref = href ? navHref(href) : undefined;
                const isActive = !!resolvedHref && pathname === resolvedHref;
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
                if (action === "manage-access") {
                  return (
                    <button
                      key={label}
                      onClick={() => {
                        setMoreOpen(false);
                        setManageAccessOpen(true);
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
                    onClick={() => setMoreOpen(false)}
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
      </nav>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute inset-x-0 top-full z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 pt-2 pb-3 grid grid-cols-2 gap-1">
            {primaryNavItems.map(({ label, icon: Icon, href }) => {
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
                  <Icon className="w-4 h-4" />
                  {label}
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
