"use client";

import { useState } from "react";
import type { TuitionCode, ParentOption } from "./page";

// Minimal inline colors for client component
const c = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  elevated: "#F3F4F6",
  border: "#E5E7EB",
  accent: "#5E7C68",
  accentBright: "#6E9478",
  accentLight: "rgba(94,124,104,0.12)",
  accentMid: "#3D6B4F",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textTertiary: "#9CA3AF",
  success: "#16A34A",
  error: "#DC2626",
  errorBg: "rgba(220,38,38,0.08)",
  errorBorder: "rgba(220,38,38,0.25)",
};

function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function TuitionCodesClient({
  initialCodes,
  parents,
}: {
  initialCodes: TuitionCode[];
  parents: ParentOption[];
}) {
  const [codes, setCodes] = useState<TuitionCode[]>(initialCodes);
  const [parentSearch, setParentSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentOption | null>(null);

  const [form, setForm] = useState({
    code: "",
    label: "",
    amount_dollars: "",
    active: true,
  });

  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const filteredParents = parents.filter((p) => {
    const q = parentSearch.toLowerCase();
    return (
      (p.full_name?.toLowerCase().includes(q) ?? false) ||
      (p.email?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const amount_cents = Math.round(parseFloat(form.amount_dollars) * 100);
    if (isNaN(amount_cents) || amount_cents <= 0) {
      setCreateError("Amount must be a positive number.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/tuition-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          label: form.label.trim(),
          amount_cents,
          parent_id: selectedParent?.id ?? null,
          active: form.active,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error ?? "Failed to create code.");
        return;
      }

      const newCode: TuitionCode = {
        ...json.data,
        parent_name: selectedParent?.full_name ?? null,
        parent_email: selectedParent?.email ?? null,
      };
      setCodes((prev) => [newCode, ...prev]);
      setForm({ code: "", label: "", amount_dollars: "", active: true });
      setSelectedParent(null);
      setParentSearch("");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    setActionError(null);
    const res = await fetch("/api/admin/tuition-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (!res.ok) {
      const json = await res.json();
      setActionError(json.error ?? "Failed to update.");
      return;
    }
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
  }

  async function handleDelete(id: string) {
    setActionError(null);
    if (!confirm("Delete this tuition code? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/tuition-codes?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      setActionError(json.error ?? "Failed to delete.");
      return;
    }
    setCodes((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Create form */}
      <div
        style={{
          background: c.elevated,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: c.textPrimary,
            marginBottom: "1rem",
          }}
        >
          Create New Tuition Code
        </h2>

        <form onSubmit={handleCreate}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr 1fr",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div>
              <label style={labelStyle}>Code</label>
              <input
                required
                placeholder="e.g. SMITH900"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Label</label>
              <input
                required
                placeholder="e.g. Smith Family — Summer 2026"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Amount ($)</label>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 1500.00"
                value={form.amount_dollars}
                onChange={(e) => setForm((f) => ({ ...f, amount_dollars: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Parent selector */}
          <div style={{ marginBottom: "0.75rem", position: "relative" }}>
            <label style={labelStyle}>Parent (optional)</label>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={selectedParent ? `${selectedParent.full_name ?? ""} (${selectedParent.email ?? ""})` : parentSearch}
              onFocus={() => {
                if (selectedParent) {
                  setSelectedParent(null);
                  setParentSearch("");
                }
                setShowDropdown(true);
              }}
              onChange={(e) => {
                setParentSearch(e.target.value);
                setShowDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              style={inputStyle}
            />
            {showDropdown && filteredParents.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: c.elevated,
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  zIndex: 50,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {filteredParents.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => {
                      setSelectedParent(p);
                      setShowDropdown(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      background: "transparent",
                      border: "none",
                      color: c.textPrimary,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    {p.full_name ?? "(no name)"}{" "}
                    <span style={{ color: c.textTertiary }}>{p.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.82rem",
                color: c.textSecondary,
              }}
            >
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                style={{ accentColor: c.accent }}
              />
              Active
            </label>
          </div>

          {createError && (
            <p
              style={{
                fontSize: "0.8rem",
                color: c.error,
                marginBottom: "0.75rem",
              }}
            >
              {createError}
            </p>
          )}

          <button type="submit" disabled={creating} style={btnPrimaryStyle}>
            {creating ? "Creating…" : "Create Code"}
          </button>
        </form>
      </div>

      {/* Action error */}
      {actionError && (
        <div
          style={{
            background: c.errorBg,
            border: `1px solid ${c.errorBorder}`,
            borderRadius: 6,
            padding: "0.75rem 1rem",
            color: c.error,
            fontSize: "0.82rem",
            marginBottom: "1rem",
          }}
        >
          {actionError}
        </div>
      )}

      {/* Table */}
      {codes.length === 0 ? (
        <p style={{ color: c.textTertiary, fontSize: "0.875rem" }}>No tuition codes yet.</p>
      ) : (
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                {["Code", "Label", "Amount", "Parent", "Status", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 1rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: c.textTertiary,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((code, i) => (
                <tr
                  key={code.id}
                  style={{
                    borderBottom: i < codes.length - 1 ? `1px solid ${c.border}` : undefined,
                  }}
                >
                  <td style={cellStyle}>
                    <code
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: c.accentMid,
                        background: c.accentLight,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {code.code}
                    </code>
                  </td>
                  <td style={{ ...cellStyle, color: c.textPrimary }}>{code.label}</td>
                  <td style={{ ...cellStyle, color: c.textSecondary }}>
                    {formatDollars(code.amount_cents)}
                  </td>
                  <td style={cellStyle}>
                    {code.parent_name || code.parent_email ? (
                      <div>
                        {code.parent_name && (
                          <div style={{ fontSize: "0.8rem", color: c.textPrimary }}>
                            {code.parent_name}
                          </div>
                        )}
                        {code.parent_email && (
                          <div style={{ fontSize: "0.72rem", color: c.textTertiary }}>
                            {code.parent_email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: c.textTertiary, fontSize: "0.8rem" }}>Any parent</span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => handleToggle(code.id, !code.active)}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        background: code.active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
                        color: code.active ? c.success : c.error,
                      }}
                    >
                      {code.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(code.id)}
                      style={{
                        fontSize: "0.78rem",
                        padding: "4px 10px",
                        borderRadius: 5,
                        border: `1px solid ${c.border}`,
                        background: "transparent",
                        color: c.error,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.35rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: 6,
  padding: "0.45rem 0.65rem",
  color: "#111827",
  fontSize: "0.82rem",
  outline: "none",
  boxSizing: "border-box",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "#5E7C68",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 6,
  padding: "0.5rem 1.25rem",
  fontSize: "0.82rem",
  fontWeight: 600,
  cursor: "pointer",
};

const cellStyle: React.CSSProperties = {
  padding: "0.7rem 1rem",
  fontSize: "0.82rem",
  color: "#4B5563",
  verticalAlign: "middle",
};
