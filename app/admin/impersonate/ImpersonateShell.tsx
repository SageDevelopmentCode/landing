"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cssColors as colors } from "../design-system";

type ParentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
};

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
      p.email?.toLowerCase().includes(q)
    );
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
          {filtered.map((parent) => {
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
                }}
              >
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: isActive ? colors.accent : colors.textPrimary }}
                >
                  {parent.full_name ?? "—"}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs truncate"
                    style={{ color: colors.textTertiary }}
                  >
                    {parent.email ?? "—"}
                  </span>
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
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
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
