"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  ClipboardList,
  DollarSign,
  GraduationCap,
  CreditCard,
  Mail,
  BookOpen,
  Megaphone,
  TreePine,
  MessageSquare,
  CalendarDays,
  School,
} from "lucide-react";
import { colors, radius, shadows, spacing } from "../design-system";
import { Tooltip } from "./Tooltip";
import { Merriweather } from "next/font/google";
import { signOut } from "@/app/actions/auth";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  newTab?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    name: "Leads",
    href: "/admin/leads",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    name: "Parents",
    href: "/admin/parents",
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    name: "Programs",
    href: "/admin/programs",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    name: "Applications",
    href: "/admin/applications",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    name: "Budget",
    href: "/admin/budget",
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    name: "Messages",
    href: "/admin/messages",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    name: "Calendar",
    href: "/admin/calendar",
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    name: "Emails",
    href: "/admin/emails",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    name: "Marketing",
    href: "/admin/marketing",
    icon: <Megaphone className="w-4 h-4" />,
  },
  {
    name: "Teacher View",
    href: "/teacher/dashboard",
    icon: <School className="w-4 h-4" />,
    newTab: true,
  },
  // {
  //   name: "Property",
  //   href: "/admin/property",
  //   icon: <TreePine className="w-4 h-4" />,
  // },
];

export function Sidebar({
  pendingApplications = 0,
  userEmail,
}: {
  pendingApplications?: number;
  userEmail?: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href);
  };

  const avatarLetter = userEmail ? userEmail.charAt(0).toUpperCase() : "A";

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{
          backgroundColor: colors.warmLinen,
          boxShadow: shadows.soft,
        }}
        aria-label="Toggle menu"
      >
        <motion.div
          animate={isMobileMenuOpen ? "open" : "closed"}
          className="w-6 h-5 flex flex-col justify-between"
        >
          <motion.span
            className="w-full h-0.5 block origin-left"
            style={{ backgroundColor: colors.mistyForest }}
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: -1 },
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="w-full h-0.5 block"
            style={{ backgroundColor: colors.mistyForest }}
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="w-full h-0.5 block origin-left"
            style={{ backgroundColor: colors.mistyForest }}
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: 1 },
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 h-[100dvh] bg-black/20 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Icon Only */}
      <aside
        className="hidden lg:flex flex-col w-16 h-screen sticky top-0 py-6 z-10"
        style={{
          backgroundColor: colors.warmLinen,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/assets/Logo.png"
            alt="Sagefield School Logo"
            width={32}
            height={32}
            priority
          />
        </div>

        <nav className="flex-1 flex flex-col items-center space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href} content={item.name} side="right">
                <Link
                  href={item.href}
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noopener noreferrer" : undefined}
                  className="relative flex items-center justify-center p-2 transition-all duration-200"
                  style={{
                    backgroundColor: active ? colors.pastelSage : "transparent",
                    color: active ? colors.mistyForest : colors.textSecondary,
                    borderRadius: "12px",
                  }}
                >
                  {item.icon}
                  {item.href === "/admin/applications" &&
                    pendingApplications > 0 &&
                    !active && (
                      <span
                        className="absolute top-1 right-1 flex items-center justify-center text-white font-bold rounded"
                        style={{
                          backgroundColor: "#dc2626",
                          fontSize: "10px",
                          minWidth: "16px",
                          height: "16px",
                          padding: "0 3px",
                          lineHeight: 1,
                        }}
                      >
                        {pendingApplications}
                      </span>
                    )}
                </Link>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom: Notifications + Profile */}
        <div className="flex flex-col items-center gap-3 mt-4">
          {/* Notification Bell */}
          <Tooltip content="Notifications" side="right">
            <button
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: "white",
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.soft,
                cursor: "pointer",
              }}
              disabled
              aria-label="Notifications"
            >
              <svg
                className="w-4 h-4"
                style={{ color: colors.textSecondary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </Tooltip>

          {/* Profile Avatar with dropdown */}
          <div className="relative" ref={profileRef}>
            <Tooltip content="Account" side="right">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: colors.pastelSage,
                  color: colors.mistyForest,
                  boxShadow: shadows.soft,
                  cursor: "pointer",
                }}
                aria-label="Account menu"
              >
                {avatarLetter}
              </button>
            </Tooltip>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50"
                  style={{
                    left: "calc(100% + 12px)",
                    bottom: 0,
                    width: "220px",
                    backgroundColor: "white",
                    borderRadius: radius.lg,
                    border: `1px solid ${colors.border}`,
                    boxShadow: shadows.large,
                    padding: "12px",
                  }}
                >
                  {userEmail && (
                    <p
                      className="text-xs font-medium mb-3 truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      {userEmail}
                    </p>
                  )}
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full text-left px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:opacity-80 cursor-pointer"
                      style={{
                        color: colors.mistyForest,
                        backgroundColor: colors.warmLinen,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      Sign out
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 p-6 flex flex-col"
            style={{
              backgroundColor: colors.warmLinen,
              borderRight: `1px solid ${colors.border}`,
              boxShadow: shadows.large,
            }}
          >
            <div className="mb-10 mt-16 flex flex-col items-center">
              <Image
                src="/assets/Logo.png"
                alt="Sagefield School Logo"
                width={48}
                height={48}
                priority
              />
              <p
                className={`text-sm mt-3 ${merriweather.className}`}
                style={{ color: colors.textSecondary }}
              >
                Admin Portal
              </p>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.newTab ? "_blank" : undefined}
                    rel={item.newTab ? "noopener noreferrer" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-all duration-200"
                    style={{
                      backgroundColor: active
                        ? colors.pastelSage
                        : "transparent",
                      color: active ? colors.mistyForest : colors.textSecondary,
                      fontWeight: active ? 600 : 500,
                      borderRadius: "12px",
                    }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {item.href === "/admin/applications" &&
                      pendingApplications > 0 &&
                      !active && (
                        <span
                          className="flex items-center justify-center text-white font-bold rounded-full ml-auto"
                          style={{
                            backgroundColor: "#dc2626",
                            fontSize: "10px",
                            minWidth: "18px",
                            height: "18px",
                            padding: "0 4px",
                            lineHeight: 1,
                          }}
                        >
                          {pendingApplications}
                        </span>
                      )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile bottom: email + sign out */}
            <div
              className="mt-6 pt-4"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              {userEmail && (
                <p
                  className="text-xs mb-3 truncate"
                  style={{ color: colors.textSecondary }}
                >
                  {userEmail}
                </p>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl hover:opacity-80"
                  style={{
                    color: colors.mistyForest,
                    backgroundColor: "white",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  Sign out
                </button>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
