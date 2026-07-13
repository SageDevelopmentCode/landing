import { createAdminClient } from "@/app/lib/supabase-server";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";

interface Commitment {
  id: string;
  first_name: string | null;
  email: string | null;
  phone: string | null;
  intent: string;
  children: string[];
  program_type: string | null;
  notes: string | null;
  contact_method: string;
  created_at: string;
}

const INTENT_META: Record<string, { label: string; bg: string; text: string }> = {
  yes: { label: "Yes, we're in!", bg: "#dcfce7", text: "#166534" },
  maybe: { label: "Still deciding", bg: "#fef9c3", text: "#854d0e" },
  no: { label: "Just summer", bg: "#fee2e2", text: "#991b1b" },
};

const PROGRAM_LABELS: Record<string, string> = {
  homeschool_dropin: "Homeschool Drop-In",
  full_time: "Full-Time Program",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Chicago",
  });
}

export default async function SchoolYearCommitmentsPage() {
  const supabase = createAdminClient();

  const { data: commitments, error } = await supabase
    .schema("marketing")
    .from("school_year_2026_commitments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: "32px", color: colors.textPrimary }}>
        <p style={{ color: "#dc2626" }}>Failed to load commitments: {error.message}</p>
      </div>
    );
  }

  const rows = (commitments ?? []) as Commitment[];

  const counts = {
    yes: rows.filter((r) => r.intent === "yes").length,
    maybe: rows.filter((r) => r.intent === "maybe").length,
    no: rows.filter((r) => r.intent === "no").length,
  };

  return (
    <div style={{ padding: "32px", color: colors.textPrimary, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          School Year 2026–2027 Commitments
        </h1>
        <p style={{ fontSize: 13, color: colors.textSecondary }}>
          {rows.length} total response{rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Summary badges */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {(["yes", "maybe", "no"] as const).map((k) => {
          const meta = INTENT_META[k];
          return (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: radius.lg,
                backgroundColor: meta.bg,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: meta.text }}>
                {meta.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: meta.text,
                  backgroundColor: "rgba(0,0,0,0.08)",
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                {counts[k]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.small,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {["Submitted", "Name", "Contact", "Intent", "Children", "Program", "Notes"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: colors.textTertiary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: colors.textTertiary,
                      fontSize: 13,
                    }}
                  >
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const meta = INTENT_META[row.intent] ?? { label: row.intent, bg: "#f3f4f6", text: "#374151" };
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: i < rows.length - 1 ? `1px solid ${colors.border}` : "none",
                        backgroundColor: "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 16px", color: colors.textSecondary, whiteSpace: "nowrap" }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                        {row.first_name || <span style={{ color: colors.textTertiary }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.textSecondary }}>
                        {row.contact_method === "email" ? (
                          row.email ? (
                            <a href={`mailto:${row.email}`} style={{ color: colors.accent }}>
                              {row.email}
                            </a>
                          ) : (
                            <span style={{ color: colors.textTertiary }}>—</span>
                          )
                        ) : (
                          row.phone || <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: meta.bg,
                            color: meta.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.textSecondary }}>
                        {row.children.length > 0
                          ? row.children.join(", ")
                          : <span style={{ color: colors.textTertiary }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.textSecondary, whiteSpace: "nowrap" }}>
                        {row.program_type
                          ? PROGRAM_LABELS[row.program_type] ?? row.program_type
                          : <span style={{ color: colors.textTertiary }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.textSecondary, maxWidth: 200 }}>
                        {row.notes
                          ? <span title={row.notes} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.notes}</span>
                          : <span style={{ color: colors.textTertiary }}>—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
