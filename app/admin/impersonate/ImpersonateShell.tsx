"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DollarSign, Users } from "lucide-react";
import { cssColors as colors } from "../design-system";

type StudentEntry = { id: string; name: string; profileImageUrl: string | null; program: string | null };

const PROGRAM_BADGE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  summer_26:          { label: "Summer '26",  bg: "#FEF3C7", color: "#92400E" },
  school_year_26_27:  { label: "SY 26–27",    bg: "#DBEAFE", color: "#1E40AF" },
  both:               { label: "Summer & SY", bg: "#EDE9FE", color: "#5B21B6" },
  homeschool_drop_in: { label: "Drop-In",     bg: "#D1FAE5", color: "#065F46" },
};

function programBadge(program: string | null | undefined) {
  if (!program) return null;
  return PROGRAM_BADGE_CONFIG[program] ?? null;
}

type ParentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  lastSignIn: string | null;
  hasPaid: boolean;
  children: StudentEntry[];
  isSharedAccess: boolean;
  ownerName: string | null;
};

const AVATAR_COLORS = [
  "bg-rose-400", "bg-amber-400", "bg-teal-400", "bg-violet-400", "bg-sky-400",
];
function colorForId(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never signed in";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  enrolled: { label: "Enrolled", bg: "#D1FAE5", color: "#065F46" },
  enrolling: { label: "Enrolling", bg: "#DBEAFE", color: "#1E40AF" },
  in_review: { label: "In Review", bg: "#FEF3C7", color: "#92400E" },
  in_progress: { label: "In Progress", bg: "#F3F4F6", color: "#4B5563" },
  denied: { label: "Denied", bg: "#FEE2E2", color: "#991B1B" },
};

export default function ImpersonateShell({
  parents,
  children,
}: {
  parents: ParentRow[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const segments = pathname?.split("/") ?? [];
  const selectedId = segments.length >= 4 ? segments[3] : null;

  const filtered = parents.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.children.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  function groupPriority(p: ParentRow): number {
    if (p.hasPaid && p.status === "enrolled") return 0;
    if (p.status === "enrolled") return 1;
    if (p.status === "enrolling") return 2;
    if (p.status === "in_progress") return 3;
    return 4;
  }

  const sorted = [...filtered].sort((a, b) => {
    const diff = groupPriority(a) - groupPriority(b);
    if (diff !== 0) return diff;
    return (a.full_name ?? "").localeCompare(b.full_name ?? "");
  });

  return (
    <div className="flex h-full overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Left panel */}
      <div
        className="flex flex-col flex-shrink-0 overflow-hidden h-full"
        style={{
          width: 260,
          borderRight: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
        }}
      >
        <div
          className="px-4 pt-5 pb-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: colors.textQuaternary }}
          >
            Parents
          </p>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{
              backgroundColor: colors.elevated,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {sorted.map((parent) => {
            const isActive = parent.id === selectedId;
            const statusCfg = parent.status
              ? STATUS_CONFIG[parent.status]
              : null;
            return (
              <button
                key={parent.id}
                onClick={() => router.push(`/admin/impersonate/${parent.id}`)}
                className="w-full text-left px-4 py-3 transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive ? colors.accentLight : "transparent",
                  borderLeft: isActive
                    ? `2px solid ${colors.accent}`
                    : "2px solid transparent",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center gap-1">
                  {parent.hasPaid && (
                    <DollarSign
                      className="flex-shrink-0 w-3 h-3"
                      style={{ color: "#34D399" }}
                    />
                  )}
                  {parent.isSharedAccess && (
                    <Users
                      className="flex-shrink-0 w-3 h-3"
                      style={{ color: "#60A5FA" }}
                    />
                  )}
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: isActive ? colors.accent : colors.textPrimary }}
                  >
                    {parent.full_name ?? "—"}
                  </span>
                </div>
                {parent.children.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2 pl-1">
                    {parent.children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2">
                        {child.profileImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={child.profileImageUrl}
                            alt={child.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${colorForId(child.id)}`}
                            style={{ fontSize: "9px", color: "white", fontWeight: 600 }}
                          >
                            {initialsFor(child.name)}
                          </div>
                        )}
                        <span style={{ color: colors.textTertiary, fontSize: "12px" }}>
                          {child.name}
                        </span>
                        {programBadge(child.program) && (() => {
                          const cfg = programBadge(child.program)!;
                          return (
                            <span
                              className="flex-shrink-0 font-medium rounded-full"
                              style={{
                                backgroundColor: cfg.bg,
                                color: cfg.color,
                                fontSize: "9px",
                                padding: "1px 5px",
                                lineHeight: "1.4",
                              }}
                            >
                              {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {statusCfg && (
                    <span
                      className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: statusCfg.bg,
                        color: statusCfg.color,
                        fontSize: "10px",
                        lineHeight: "1.2",
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  )}
                  <span style={{ color: colors.textQuaternary, fontSize: "10px" }}>
                    {formatRelative(parent.lastSignIn)}
                  </span>
                </div>
                {parent.isSharedAccess && parent.ownerName && (
                  <p style={{ color: colors.textQuaternary, fontSize: "10px", marginTop: "2px" }}>
                    Shared · {parent.ownerName}
                  </p>
                )}
              </button>
            );
          })}
          {sorted.length === 0 && (
            <p
              className="px-4 py-8 text-xs text-center"
              style={{ color: colors.textTertiary }}
            >
              No parents found
            </p>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-auto h-full">{children}</div>
    </div>
  );
}
