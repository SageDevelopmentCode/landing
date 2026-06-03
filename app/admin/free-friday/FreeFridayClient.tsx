"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";
import { FreeFridayDetailPanel, FreeFridayRow } from "./FreeFridayDetailPanel";

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  new:       { bg: "rgba(56,189,248,0.08)",  color: "var(--admin-info)",    border: "rgba(56,189,248,0.25)" },
  confirmed: { bg: "rgba(34,197,94,0.08)",   color: "var(--admin-success)", border: "rgba(34,197,94,0.25)" },
  attended:  { bg: "rgba(94,124,104,0.15)",  color: "var(--admin-accent)",  border: "var(--admin-accent)" },
  no_show:   { bg: "rgba(245,158,11,0.08)",  color: "var(--admin-warning)", border: "rgba(245,158,11,0.25)" },
  cancelled: { bg: "rgba(239,68,68,0.08)",   color: "var(--admin-error)",   border: "rgba(239,68,68,0.25)" },
};

export function FreeFridayClient({ rows: initial }: { rows: FreeFridayRow[] }) {
  const [rows, setRows] = useState<FreeFridayRow[]>(initial);
  const [selected, setSelected] = useState<FreeFridayRow | null>(null);
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<"all" | "enrolled" | "new">("all");

  const filtered = rows.filter((r) => {
    const childName = r.track === "enrolled" ? r.friend_child_name : r.child_name;
    const parentName = r.track === "enrolled" ? r.friend_parent_name : r.parent_name;
    const email = r.track === "enrolled" ? r.friend_parent_email : r.email;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      childName?.toLowerCase().includes(q) ||
      parentName?.toLowerCase().includes(q) ||
      email?.toLowerCase().includes(q);
    const matchesTrack = trackFilter === "all" || r.track === trackFilter;
    return matchesSearch && matchesTrack;
  });

  const handleUpdated = (updated: FreeFridayRow) => {
    setRows((prev) => {
      if (updated.is_deleted) return prev.filter((r) => r.id !== updated.id);
      return prev.map((r) => (r.id === updated.id ? updated : r));
    });
    if (selected?.id === updated.id) {
      if (updated.is_deleted) setSelected(null);
      else setSelected(updated);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
          <input
            type="text"
            placeholder="Search name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-44"
            style={{ color: colors.textSecondary }}
          />
        </div>

        {/* Track filter */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          {(["all", "enrolled", "new"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTrackFilter(t)}
              className="px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: trackFilter === t ? colors.accentLight : "transparent",
                color: trackFilter === t ? colors.accent : colors.textTertiary,
              }}
            >
              {t === "all" ? "All" : t === "enrolled" ? "🤝 Enrolled" : "🌱 New"}
            </button>
          ))}
        </div>

        <span className="text-xs ml-auto" style={{ color: colors.textTertiary }}>
          {filtered.length} registration{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
        {/* Header */}
        <div
          className="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "110px 1fr 1fr 60px 80px 100px",
            backgroundColor: colors.elevated,
            color: colors.textTertiary,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <span>Track</span>
          <span>Child</span>
          <span>Contact</span>
          <span>Age</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: colors.textTertiary }}>
            No registrations found.
          </div>
        ) : (
          filtered.map((r) => {
            const childName = r.track === "enrolled" ? r.friend_child_name : r.child_name;
            const parentName = r.track === "enrolled" ? r.friend_parent_name : r.parent_name;
            const email = r.track === "enrolled" ? r.friend_parent_email : r.email;
            const age = r.track === "enrolled" ? r.friend_child_age : r.child_age;
            const st = statusStyles[r.status] ?? statusStyles["new"];
            const isActive = selected?.id === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className="grid px-4 py-3 cursor-pointer transition-colors"
                style={{
                  gridTemplateColumns: "110px 1fr 1fr 60px 80px 100px",
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: isActive ? colors.accentLight : "transparent",
                }}
              >
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full self-center w-fit"
                  style={{
                    backgroundColor: r.track === "enrolled" ? colors.accentLight : colors.infoBg,
                    color: r.track === "enrolled" ? colors.accent : colors.info,
                  }}
                >
                  {r.track === "enrolled" ? "🤝 Enrolled" : "🌱 New"}
                </span>
                <div className="self-center min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: colors.textPrimary }}>{childName || "—"}</p>
                  {parentName && <p className="text-[10px] truncate mt-0.5" style={{ color: colors.textTertiary }}>{parentName}</p>}
                </div>
                <div className="self-center min-w-0">
                  <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{email || "—"}</p>
                </div>
                <span className="text-xs self-center" style={{ color: colors.textSecondary }}>{age ?? "—"}</span>
                <span className="text-xs self-center" style={{ color: colors.textTertiary }}>
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border self-center w-fit"
                  style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}
                >
                  {r.status.replace("_", " ")}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Detail panel backdrop */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setSelected(null)}
        />
      )}

      <FreeFridayDetailPanel
        row={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
