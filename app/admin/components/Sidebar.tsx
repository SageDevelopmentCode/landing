"use client";

import { useState } from "react";
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
  CreditCard,
  BookOpen,
  Megaphone,
  MessageSquare,
  CalendarDays,
  School,
  ChevronRight,
  Menu,
  Eye,
  X,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelLeftClose,
  Gift,
  PenLine,
  ArrowLeftRight,
  Shield,
  Camera,
} from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";
import { useTheme } from "./ThemeProvider";
import { signOut } from "@/app/actions/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  newTab?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard",    href: "/admin",               icon: <LayoutDashboard className="w-4 h-4" /> },
      { name: "Leads",        href: "/admin/leads",         icon: <TrendingUp className="w-4 h-4" /> },
      { name: "Shadow Days",  href: "/admin/shadow-days",   icon: <Sun className="w-4 h-4" /> },
      { name: "People",       href: "/admin/people",        icon: <Users className="w-4 h-4" /> },
      { name: "Programs",     href: "/admin/programs",      icon: <BookOpen className="w-4 h-4" /> },
      { name: "Applications", href: "/admin/applications",  icon: <ClipboardList className="w-4 h-4" /> },
      { name: "Transactions", href: "/admin/transactions",  icon: <CreditCard className="w-4 h-4" /> },
      { name: "Manual Payments", href: "/admin/payments",  icon: <PenLine className="w-4 h-4" /> },
      { name: "Week Swap",    href: "/admin/week-swap",     icon: <ArrowLeftRight className="w-4 h-4" /> },
      { name: "Referrals",    href: "/admin/referrals",     icon: <Gift className="w-4 h-4" /> },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Budget",    href: "/admin/budget",    icon: <DollarSign className="w-4 h-4" /> },
      { name: "Payroll",   href: "/admin/payroll",   icon: <CreditCard className="w-4 h-4" /> },
      { name: "Messages",  href: "/admin/messages",  icon: <MessageSquare className="w-4 h-4" /> },
      { name: "DM Monitor", href: "/admin/moderation", icon: <Shield className="w-4 h-4" /> },
      { name: "Photo Permissions", href: "/admin/photo-permissions", icon: <Camera className="w-4 h-4" /> },
      { name: "Calendar",  href: "/admin/calendar",  icon: <CalendarDays className="w-4 h-4" /> },
{ name: "Marketing", href: "/admin/marketing", icon: <Megaphone className="w-4 h-4" /> },
      { name: "Impersonate", href: "/admin/impersonate", icon: <Eye className="w-4 h-4" /> },
    ],
  },
  {
    label: "External",
    items: [
      { name: "Teacher View", href: "/teacher/dashboard", icon: <School className="w-4 h-4" />, newTab: true },
    ],
  },
];

function NavLink({
  item,
  active,
  expanded,
  pendingApplications,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  pendingApplications: number;
  onClick?: () => void;
}) {
  const showBadge = item.href === "/admin/applications" && pendingApplications > 0 && !active;

  return (
    <Link
      href={item.href}
      target={item.newTab ? "_blank" : undefined}
      rel={item.newTab ? "noopener noreferrer" : undefined}
      onClick={onClick}
      title={!expanded ? item.name : undefined}
      className="flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
      style={{
        padding: expanded ? "8px 12px" : "8px",
        justifyContent: expanded ? "flex-start" : "center",
        backgroundColor: active ? colors.accentLight : "transparent",
        color: active ? colors.accent : colors.textTertiary,
        borderLeft: expanded ? (active ? `2px solid ${colors.accent}` : "2px solid transparent") : "none",
      }}
    >
      <span style={{ color: active ? colors.accent : colors.textTertiary, flexShrink: 0, position: "relative" }}>
        {item.icon}
        {/* Badge dot when collapsed */}
        {!expanded && showBadge && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#DC2626",
            }}
          />
        )}
      </span>
      {expanded && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {showBadge && (
            <span
              className="flex items-center justify-center text-white font-bold rounded-full flex-shrink-0"
              style={{
                backgroundColor: "#DC2626",
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
          {item.newTab && (
            <ChevronRight className="w-3 h-3 opacity-40 flex-shrink-0" />
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar({
  pendingApplications = 0,
  userEmail,
}: {
  pendingApplications?: number;
  userEmail?: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  const avatarLetter = userEmail ? userEmail.charAt(0).toUpperCase() : "A";

  const SidebarContent = ({
    expanded,
    onLinkClick,
    onToggleExpand,
  }: {
    expanded: boolean;
    onLinkClick?: () => void;
    onToggleExpand?: () => void;
  }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center py-5 overflow-hidden"
        style={{
          borderBottom: `1px solid ${colors.border}`,
          padding: expanded ? "20px 16px" : "20px 0",
          justifyContent: expanded ? "flex-start" : "center",
          gap: expanded ? "12px" : 0,
        }}
      >
        <Image
          src="/assets/Logo.png"
          alt="Sagefield School"
          width={28}
          height={28}
          priority
          style={{ flexShrink: 0 }}
        />
        {expanded && (
          <div>
            <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Sagefield
            </div>
            <div className="text-xs" style={{ color: colors.textTertiary }}>
              Admin Portal
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-5 overflow-y-auto" style={{ padding: expanded ? "16px 12px" : "16px 6px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {expanded && (
              <div
                className="text-xs font-semibold uppercase tracking-wider px-3 mb-1.5"
                style={{ color: colors.textQuaternary }}
              >
                {group.label}
              </div>
            )}
            {!expanded && (
              <div
                style={{
                  height: "1px",
                  backgroundColor: colors.border,
                  margin: "0 6px 8px",
                  display: group.label === "Main" ? "none" : "block",
                }}
              />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  expanded={expanded}
                  pendingApplications={pendingApplications}
                  onClick={onLinkClick}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          padding: expanded ? "16px" : "12px 6px",
        }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={onToggleExpand}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="transition-colors duration-150"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: expanded ? '10px' : 0,
            width: '100%',
            padding: expanded ? '6px 8px' : '6px',
            borderRadius: radius.md,
            border: 'none',
            backgroundColor: 'transparent',
            color: colors.textTertiary,
            cursor: 'pointer',
            marginBottom: '4px',
          }}
        >
          {expanded
            ? <PanelLeftClose className="w-4 h-4" style={{ flexShrink: 0 }} />
            : <PanelLeftOpen className="w-4 h-4" style={{ flexShrink: 0 }} />
          }
          {expanded && (
            <span className="text-xs font-medium">Collapse</span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="transition-colors duration-150"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: expanded ? '10px' : 0,
            width: '100%',
            padding: expanded ? '6px 8px' : '6px',
            borderRadius: radius.md,
            border: 'none',
            backgroundColor: 'transparent',
            color: colors.textTertiary,
            cursor: 'pointer',
            marginBottom: '8px',
          }}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" style={{ flexShrink: 0 }} />
            : <Moon className="w-4 h-4" style={{ flexShrink: 0 }} />
          }
          {expanded && (
            <span className="text-xs font-medium">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          )}
        </button>

        <div
          className="flex items-center mb-3"
          style={{ justifyContent: expanded ? "flex-start" : "center", gap: expanded ? "12px" : 0 }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: colors.accentLight, color: colors.accent }}
          >
            {avatarLetter}
          </div>
          {expanded && userEmail && (
            <span className="text-xs truncate flex-1" style={{ color: colors.textTertiary }}>
              {userEmail}
            </span>
          )}
        </div>
        {expanded && (
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer"
              style={{
                color: colors.textSecondary,
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.border}`,
              }}
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{
          backgroundColor: colors.surface,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.border}`,
        }}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen
          ? <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
          : <Menu className="w-5 h-5" style={{ color: colors.textSecondary }} />
        }
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

      {/* Desktop Sidebar — manually collapsible */}
      <motion.aside
        className="hidden lg:flex flex-col h-screen sticky top-0 z-10 flex-shrink-0 overflow-hidden"
        animate={{ width: isExpanded ? 224 : 52 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <SidebarContent
          expanded={isExpanded}
          onToggleExpand={() => setIsExpanded((v) => !v)}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col"
            style={{
              backgroundColor: colors.surface,
              borderRight: `1px solid ${colors.border}`,
              boxShadow: shadows.large,
            }}
          >
            <div className="pt-16">
              <SidebarContent
                expanded={true}
                onLinkClick={() => setIsMobileMenuOpen(false)}
                onToggleExpand={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
