"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  PenLine,
  DollarSign,
  CreditCard,
  Activity,
  Eye,
  School,
} from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";

const QUICK_ACTIONS = [
  { label: "Applications",    href: "/admin/applications", icon: ClipboardList, color: "#38BDF8" }, // sky blue
  { label: "Manual Payments", href: "/admin/payments",     icon: PenLine,       color: "#A78BFA" }, // violet
  { label: "Budget",          href: "/admin/budget",       icon: DollarSign,    color: "#22C55E" }, // green
  { label: "Payroll",         href: "/admin/payroll",      icon: CreditCard,    color: "#F59E0B" }, // amber
  { label: "Pipeline",        href: "/admin/pipeline",     icon: Activity,      color: "#EC4899" }, // pink
  { label: "Impersonate",     href: "/admin/impersonate",  icon: Eye,           color: "#F97316" }, // orange
  { label: "Teacher View",    href: "/teacher/dashboard",  icon: School,        color: "#5E7C68", newTab: true }, // sage
];

function ActionButton({ label, href, icon: Icon, color, newTab }: typeof QUICK_ACTIONS[number]) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-150"
      style={{
        padding: "14px 16px",
        borderRadius: radius.lg,
        backgroundColor: hovered ? colors.elevated : "transparent",
        border: `1px solid ${hovered ? colors.borderStrong : colors.border}`,
        color: hovered ? colors.textPrimary : colors.textSecondary,
        minWidth: "90px",
        textDecoration: "none",
        boxShadow: hovered ? shadows.card : "none",
      }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </Link>
  );
}

export function QuickActionsBar() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textQuaternary }}>
        Quick Actions
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {QUICK_ACTIONS.map((action) => (
          <ActionButton key={action.href} {...action} />
        ))}
      </div>
    </div>
  );
}
