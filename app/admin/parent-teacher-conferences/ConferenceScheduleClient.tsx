"use client";

import { useMemo, useState } from "react";
import type { AdminConferenceBooking } from "@/app/lib/get-all-conference-bookings";
import type { ConferenceTeacher } from "@/app/lib/parent-teacher-conference";
import { formatConferenceDateForDisplay } from "@/app/lib/parent-teacher-conference";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";

const FORMAT_META: Record<
  "in_person" | "virtual",
  { label: string; bg: string; text: string }
> = {
  in_person: { label: "In person", bg: "#dcfce7", text: "#166534" },
  virtual: { label: "Virtual", bg: "#dbeafe", text: "#1e40af" },
};

function formatBookedAt(iso: string) {
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

type Props = {
  bookings: AdminConferenceBooking[];
  teacherOptions: ConferenceTeacher[];
  countsByTeacherId: Record<string, number>;
};

export default function ConferenceScheduleClient({
  bookings,
  teacherOptions,
  countsByTeacherId,
}: Props) {
  const [teacherFilter, setTeacherFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (teacherFilter === "all") return bookings;
    return bookings.filter((b) => b.teacherId === teacherFilter);
  }, [bookings, teacherFilter]);

  return (
    <>
      {/* Summary badges */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {teacherOptions.map((teacher) => {
          const count = countsByTeacherId[teacher.id] ?? 0;
          const active = teacherFilter === teacher.id;
          return (
            <button
              key={teacher.id}
              type="button"
              onClick={() =>
                setTeacherFilter(
                  teacherFilter === teacher.id ? "all" : teacher.id,
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: radius.lg,
                backgroundColor: active ? colors.accentLight : colors.elevated,
                border: active
                  ? `1px solid ${colors.accent}`
                  : `1px solid ${colors.border}`,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? colors.accent : colors.textPrimary,
                }}
              >
                {teacher.name}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: active ? colors.accent : colors.textSecondary,
                  backgroundColor: "rgba(0,0,0,0.06)",
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
        {teacherFilter !== "all" && (
          <button
            type="button"
            onClick={() => setTeacherFilter("all")}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.accent,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 4px",
            }}
          >
            Show all
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {[
                  "Date",
                  "Time",
                  "Teacher",
                  "Child",
                  "Parent",
                  "Email",
                  "Format",
                  "Accommodation note",
                  "Booked",
                ].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: colors.textTertiary,
                      fontSize: 13,
                    }}
                  >
                    {bookings.length === 0
                      ? "No conferences scheduled yet."
                      : "No conferences for this teacher."}
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const formatMeta = FORMAT_META[row.format];
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom:
                          i < filtered.length - 1
                            ? `1px solid ${colors.border}`
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                      >
                        {formatConferenceDateForDisplay(row.conferenceDate)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          whiteSpace: "nowrap",
                          color: colors.textSecondary,
                        }}
                      >
                        {row.timeSlot}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {row.teacherName}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                        {row.childName}
                      </td>
                      <td style={{ padding: "12px 16px" }}>{row.parentName}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {row.parentEmail ? (
                          <a
                            href={`mailto:${row.parentEmail}`}
                            style={{ color: colors.accent }}
                          >
                            {row.parentEmail}
                          </a>
                        ) : (
                          <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: radius.md,
                            backgroundColor: formatMeta.bg,
                            color: formatMeta.text,
                          }}
                        >
                          {formatMeta.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: colors.textSecondary,
                          maxWidth: 220,
                        }}
                      >
                        {row.accommodationNote ? (
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={row.accommodationNote}
                          >
                            {row.accommodationNote}
                          </span>
                        ) : (
                          <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: colors.textSecondary,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatBookedAt(row.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
