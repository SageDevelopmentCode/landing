function formatPaymentTypeFallback(type: string): string {
  const labels: Record<string, string> = {
    registration_fee: "Registration Fee",
    donation: "Donation",
    tuition: "Tuition",
    deposit: "Deposit",
  };
  return (
    labels[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export type StripeTransactionForPnl = {
  payment_type: string;
  amount_cents: number;
  intended_amount_cents: number | null;
  cover_fees: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  exclude_from_revenue: boolean;
};

export type BudgetExpenseForPnl = {
  category: string;
  amount: number;
  expense_date: string;
};

export type PnlLine = { label: string; amount: number };
export type PnlSection = { title: string; lines: PnlLine[]; subtotal: number };

export type PnlDateRange = { startMonth: string; endMonth: string };

export type ProfitAndLossReport = {
  startMonth: string;
  endMonth: string;
  rangeKey: string;
  periodLabel: string;
  dateRange: string;
  income: PnlSection;
  expenses: PnlSection[];
  totalExpenses: number;
  netIncome: number;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  tuition: "Tuition",
  aftercare: "After Care",
  aftercare_tuition: "Aftercare Tuition",
  fun_friday: "Field Day Friday",
  fun_friday_tuition: "Fun Friday Tuition",
  summer: "Summer Program",
  summer_tuition: "Summer Tuition",
  registration_fee: "Registration Fee",
  supply_fee: "Supply Fee",
  late_fee: "Late Fee",
  donation: "Donation",
  fundraiser: "Fundraiser",
  grant: "Grant / Sponsorship",
  field_trip_fee: "Field Trip Fee",
  uniform_fee: "Uniform / Spirit Wear",
  extended_care: "Extended Care (Drop-in)",
  event: "Event / Workshop",
  school_year_tuition: "School Year Tuition",
  homeschool_dropin: "Homeschool Drop-in",
  one_time_payment: "One Time Payment",
  custom_tuition: "Custom Tuition",
  shadow_day_fee: "Shadow Day Fee",
  other: "Other",
};

export const EXPENSE_SECTIONS: { title: string; categories: string[] }[] = [
  {
    title: "Personnel",
    categories: ["Teacher Pay", "Staff Pay", "Contractor / 1099", "Payroll Taxes"],
  },
  {
    title: "Facilities",
    categories: [
      "Rent",
      "Utilities",
      "Maintenance & Repairs",
      "Furniture & Equipment",
    ],
  },
  {
    title: "Program",
    categories: [
      "Supplies & Materials",
      "Curriculum",
      "Field Trips",
      "Technology & Software",
    ],
  },
  {
    title: "Operations",
    categories: [
      "Insurance",
      "Marketing",
      "Professional Services",
      "Administrative",
    ],
  },
  {
    title: "Other",
    categories: ["Other"],
  },
];

const SAVINGS_CATEGORY = "Savings";

function isRevenueAttributionRow(tx: StripeTransactionForPnl): boolean {
  const meta = (tx.metadata ?? {}) as Record<string, string>;
  return (
    meta.is_sibling_split === "true" || meta.bundled_with_supply_fee === "true"
  );
}

export function filterRevenueTransactions(
  transactions: StripeTransactionForPnl[],
  { hideExcluded = true } = {},
): StripeTransactionForPnl[] {
  return transactions.filter(
    (tx) =>
      !isRevenueAttributionRow(tx) &&
      (!hideExcluded || !tx.exclude_from_revenue),
  );
}

export function txNet(tx: StripeTransactionForPnl): number {
  return (
    (tx.cover_fees
      ? (tx.intended_amount_cents ?? tx.amount_cents)
      : tx.amount_cents) / 100
  );
}

export function paymentTypeLabel(paymentType: string): string {
  return PAYMENT_TYPE_LABELS[paymentType] ?? formatPaymentTypeFallback(paymentType);
}

function formatDateLabel(d: Date): string {
  return d.toLocaleString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function monthBounds(monthKey: string): { start: Date; end: Date } {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0),
  };
}

export function normalizePnlDateRange(range: PnlDateRange): PnlDateRange {
  if (range.startMonth <= range.endMonth) {
    return range;
  }
  return { startMonth: range.endMonth, endMonth: range.startMonth };
}

export function isMonthInRange(monthKey: string, range: PnlDateRange): boolean {
  const { startMonth, endMonth } = normalizePnlDateRange(range);
  return monthKey >= startMonth && monthKey <= endMonth;
}

export function formatPnlDateRange(range: PnlDateRange): {
  periodLabel: string;
  dateRange: string;
  rangeKey: string;
} {
  const { startMonth, endMonth } = normalizePnlDateRange(range);
  const startBounds = monthBounds(startMonth);
  const endBounds = monthBounds(endMonth);
  const rangeKey = `${startMonth}_${endMonth}`;

  if (startMonth === endMonth) {
    const periodLabel = startBounds.start.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return {
      periodLabel,
      dateRange: `${formatDateLabel(startBounds.start)} – ${formatDateLabel(startBounds.end)}`,
      rangeKey,
    };
  }

  const periodLabel = `${startBounds.start.toLocaleString("default", {
    month: "short",
    year: "numeric",
  })} – ${endBounds.end.toLocaleString("default", {
    month: "short",
    year: "numeric",
  })}`;

  return {
    periodLabel,
    dateRange: `${formatDateLabel(startBounds.start)} – ${formatDateLabel(endBounds.end)}`,
    rangeKey,
  };
}

function buildIncomeSection(
  transactions: StripeTransactionForPnl[],
  range: PnlDateRange,
): PnlSection {
  const monthTx = filterRevenueTransactions(transactions).filter((tx) =>
    isMonthInRange(tx.created_at.slice(0, 7), range),
  );

  const byType = monthTx.reduce<Record<string, number>>((acc, tx) => {
    const t = tx.payment_type ?? "other";
    acc[t] = (acc[t] ?? 0) + txNet(tx);
    return acc;
  }, {});

  const lines = Object.entries(byType)
    .filter(([, amount]) => amount !== 0)
    .map(([type, amount]) => ({
      label: paymentTypeLabel(type),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);

  return { title: "Income", lines, subtotal };
}

function buildExpenseSections(
  expenses: BudgetExpenseForPnl[],
  range: PnlDateRange,
): PnlSection[] {
  const monthExpenses = expenses.filter(
    (e) =>
      isMonthInRange(e.expense_date.slice(0, 7), range) &&
      e.category !== SAVINGS_CATEGORY,
  );

  const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category ?? "Other";
    acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  const sections: PnlSection[] = [];

  for (const section of EXPENSE_SECTIONS) {
    const lines = section.categories
      .map((cat) => ({
        label: cat,
        amount: byCategory[cat] ?? 0,
      }))
      .filter((l) => l.amount !== 0);

    if (lines.length > 0) {
      sections.push({
        title: section.title,
        lines,
        subtotal: lines.reduce((s, l) => s + l.amount, 0),
      });
    }
  }

  const knownCategories = new Set(
    EXPENSE_SECTIONS.flatMap((s) => s.categories),
  );
  const uncategorized = Object.entries(byCategory)
    .filter(([cat, amount]) => !knownCategories.has(cat) && amount !== 0)
    .map(([cat, amount]) => ({ label: cat, amount }));

  if (uncategorized.length > 0) {
    sections.push({
      title: "Uncategorized",
      lines: uncategorized,
      subtotal: uncategorized.reduce((s, l) => s + l.amount, 0),
    });
  }

  return sections;
}

export function buildProfitAndLoss(
  stripeTransactions: StripeTransactionForPnl[],
  expenses: BudgetExpenseForPnl[],
  range: PnlDateRange,
): ProfitAndLossReport {
  const normalized = normalizePnlDateRange(range);
  const { periodLabel, dateRange, rangeKey } = formatPnlDateRange(normalized);
  const income = buildIncomeSection(stripeTransactions, normalized);
  const expensesSections = buildExpenseSections(expenses, normalized);
  const totalExpenses = expensesSections.reduce((s, sec) => s + sec.subtotal, 0);
  const netIncome = income.subtotal - totalExpenses;

  return {
    startMonth: normalized.startMonth,
    endMonth: normalized.endMonth,
    rangeKey,
    periodLabel,
    dateRange,
    income,
    expenses: expensesSections,
    totalExpenses,
    netIncome,
  };
}

export function formatPnlCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function profitAndLossToCsv(report: ProfitAndLossReport): string {
  const rows: string[][] = [
    ["Sage Field School"],
    ["Profit and Loss"],
    [report.dateRange],
    ["Cash Basis"],
    [],
    ["Income"],
  ];

  for (const line of report.income.lines) {
    rows.push([line.label, formatPnlCurrency(line.amount)]);
  }
  rows.push(["Total Income", formatPnlCurrency(report.income.subtotal)]);
  rows.push([]);

  for (const section of report.expenses) {
    rows.push([section.title]);
    for (const line of section.lines) {
      rows.push([line.label, formatPnlCurrency(line.amount)]);
    }
  }
  rows.push(["Total Expenses", formatPnlCurrency(report.totalExpenses)]);
  rows.push([]);
  rows.push(["Net Income", formatPnlCurrency(report.netIncome)]);

  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(",") || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(","),
    )
    .join("\n");
}
