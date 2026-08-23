"use client";

import {
  cssColors as colors,
  radius,
  cssShadows as shadows,
} from "../design-system";
import {
  FORECAST_2026_ROWS,
  FORECAST_MONTHS,
  FORECAST_MONTH_LABELS,
  FORECAST_TITLE,
  FORECAST_YEAR,
  formatForecastCurrency,
  type ForecastMonth,
  type ForecastRow,
  type ForecastRowKind,
} from "./forecast-2026-data";

const cardStyle = {
  backgroundColor: "white",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.soft,
};

function getRowBackground(kind: ForecastRowKind): string | undefined {
  switch (kind) {
    case "sectionHeader":
    case "subsection":
      return colors.warmLinen;
    case "netIncome":
      return colors.mistyForest + "18";
    default:
      return undefined;
  }
}

function formatCellValue(
  value: number | undefined,
  kind: ForecastRowKind,
  month: ForecastMonth,
): string {
  if (value === undefined) return "";
  if (value === 0 && kind === "data") return "";
  if (value === 0 && (kind === "spacer" || kind === "subsection")) return "";
  if (month === "total" && value === 0 && kind === "spacer") return "";
  return formatForecastCurrency(value);
}

function getValueColor(value: number | undefined, kind: ForecastRowKind): string {
  if (value === undefined) return colors.textSecondary;
  if (kind === "netIncome") {
    if (value > 0) return colors.success;
    if (value < 0) return colors.error;
    return colors.textPrimary;
  }
  if (value < 0) return colors.error;
  if (value > 0) return colors.textPrimary;
  return colors.textSecondary;
}

function ForecastTableRow({ row }: { row: ForecastRow }) {
  const bg = getRowBackground(row.kind);
  const isBold =
    row.kind === "sectionHeader" ||
    row.kind === "subtotal" ||
    row.kind === "netIncome";
  const isItalic = row.kind === "subsection";
  const hasTopBorder = row.kind === "subtotal" || row.kind === "netIncome";

  if (row.kind === "title") {
    return (
      <tr>
        <td
          colSpan={FORECAST_MONTHS.length + 1}
          className="py-4 px-4"
          style={{
            fontWeight: 700,
            fontSize: "16px",
            color: colors.textPrimary,
            letterSpacing: "0.01em",
          }}
        >
          {FORECAST_TITLE}
        </td>
      </tr>
    );
  }

  if (row.kind === "year") {
    return (
      <tr>
        <td className="py-1 px-4" />
        {FORECAST_MONTHS.map((month) => (
          <td
            key={month}
            className="py-1 px-3 text-center"
            style={{
              color: colors.textSecondary,
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            {month === "april" ? FORECAST_YEAR : ""}
          </td>
        ))}
      </tr>
    );
  }

  if (row.kind === "monthHeader") {
    return (
      <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
        <th
          className="py-2 px-4 text-left sticky left-0 z-20"
          style={{
            backgroundColor: colors.warmLinen,
            minWidth: "240px",
            fontWeight: 600,
            fontSize: "11px",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        />
        {FORECAST_MONTHS.map((month) => (
          <th
            key={month}
            className="py-2 px-3 text-right"
            style={{
              minWidth: month === "total" ? "100px" : "88px",
              fontWeight: 600,
              fontSize: "11px",
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              backgroundColor: colors.warmLinen,
              whiteSpace: "nowrap",
            }}
          >
            {FORECAST_MONTH_LABELS[month]}
          </th>
        ))}
      </tr>
    );
  }

  if (row.kind === "spacer" && !row.label && Object.keys(row.values).length === 0) {
    return (
      <tr>
        <td
          colSpan={FORECAST_MONTHS.length + 1}
          className="py-1"
          style={{ backgroundColor: bg }}
        />
      </tr>
    );
  }

  return (
    <tr
      style={{
        backgroundColor: bg,
        borderTop: hasTopBorder ? `2px solid ${colors.border}` : undefined,
        borderBottom:
          row.kind === "netIncome" ? `2px solid ${colors.mistyForest}44` : undefined,
      }}
    >
      <td
        className="py-2 px-4 sticky left-0 z-10"
        style={{
          minWidth: "240px",
          backgroundColor: bg ?? "white",
          color: colors.textPrimary,
          fontWeight: isBold ? 700 : 400,
          fontStyle: isItalic ? "italic" : "normal",
          fontSize: row.kind === "sectionHeader" ? "13px" : "12px",
          whiteSpace: "nowrap",
        }}
      >
        {row.label ?? ""}
      </td>
      {FORECAST_MONTHS.map((month) => {
        const value = row.values[month];
        const display = formatCellValue(value, row.kind, month);
        return (
          <td
            key={month}
            className="py-2 px-3 text-right tabular-nums"
            style={{
              minWidth: month === "total" ? "100px" : "88px",
              color: getValueColor(value, row.kind),
              fontWeight:
                isBold || (month === "total" && row.kind === "data") ? 600 : 400,
              fontSize: "12px",
              backgroundColor:
                month === "total" && row.kind !== "spacer"
                  ? colors.warmLinen + "88"
                  : undefined,
            }}
          >
            {display}
          </td>
        );
      })}
    </tr>
  );
}

export function ForecastTab() {
  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <div className="mb-4">
        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Budget Forecast
        </p>
        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          2026 forecast — static view from sample spreadsheet
        </p>
      </div>

      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: "13px",
            width: "max-content",
            minWidth: "100%",
          }}
        >
          <tbody>
            {FORECAST_2026_ROWS.map((row) => (
              <ForecastTableRow key={row.excelRow} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
