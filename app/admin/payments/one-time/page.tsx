import { createAdminClient } from "@/app/lib/supabase-server";
import { cssColors as colors } from "../../design-system";

export default async function OneTimePaymentsPage() {
  const client = createAdminClient();

  const { data: payments, error } = await client
    .schema("billing")
    .from("one_time_payments")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        fontFamily: "'Poppins', sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: colors.textPrimary,
              marginBottom: "0.25rem",
            }}
          >
            One-Time Payments
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "0.875rem" }}>
            All payments submitted through{" "}
            <span style={{ color: colors.accentMid }}>/pay</span>
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem",
              borderRadius: 8,
              backgroundColor: colors.errorBg ?? "rgba(239,68,68,0.1)",
              border: `1px solid ${colors.errorBorder ?? "rgba(239,68,68,0.3)"}`,
              color: colors.error,
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
            }}
          >
            Failed to load payments: {error.message}
          </div>
        )}

        {!error && (!payments || payments.length === 0) && (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: colors.textTertiary,
              fontSize: "0.875rem",
            }}
          >
            No payments yet.
          </div>
        )}

        {payments && payments.length > 0 && (
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: colors.elevated,
                  }}
                >
                  {[
                    "Date",
                    "Payer",
                    "Child",
                    "Memo",
                    "Amount",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: colors.textTertiary,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const isCompleted = p.payment_status === "completed";
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom:
                          i < payments.length - 1
                            ? `1px solid ${colors.border}`
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          fontSize: "0.8rem",
                          color: colors.textSecondary,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: colors.textPrimary,
                          }}
                        >
                          {p.payer_name}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: colors.textSecondary,
                          }}
                        >
                          {p.payer_email}
                        </p>
                        {p.payer_phone && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: colors.textTertiary,
                            }}
                          >
                            {p.payer_phone}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        {p.child_name ? (
                          <>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: colors.textPrimary,
                              }}
                            >
                              {p.child_name}
                            </p>
                            {p.child_age && (
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: colors.textSecondary,
                                }}
                              >
                                Age {p.child_age}
                              </p>
                            )}
                          </>
                        ) : (
                          <span style={{ color: colors.textTertiary, fontSize: "0.8rem" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          maxWidth: 200,
                        }}
                      >
                        {p.memo ? (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: colors.textSecondary,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            } as React.CSSProperties}
                          >
                            {p.memo}
                          </p>
                        ) : (
                          <span style={{ color: colors.textTertiary, fontSize: "0.8rem" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 1rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: colors.textPrimary,
                          }}
                        >
                          ${(p.amount_cents / 100).toFixed(2)}
                        </p>
                        {p.cover_fees && (
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: colors.textTertiary,
                            }}
                          >
                            fees covered
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.65rem",
                            borderRadius: 20,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: isCompleted
                              ? colors.successBg
                              : colors.warningBg,
                            color: isCompleted ? colors.success : colors.warning,
                            border: `1px solid ${isCompleted ? colors.successBorder : colors.warningBorder}`,
                          }}
                        >
                          {isCompleted ? "Completed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
