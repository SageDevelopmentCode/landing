export type MercuryAccountBalance = {
  id: string;
  name: string;
  kind: string;
  accountNumber: string;
  availableBalance: number;
  currentBalance: number;
  status: string;
};

export type CashSnapshotLine = {
  id: string;
  label: string;
  availableBalance: number;
  currentBalance: number;
  kind: string;
};

export type CashSnapshotSection = {
  title: string;
  lines: CashSnapshotLine[];
  subtotalAvailable: number;
  subtotalCurrent: number;
};

export type CashSnapshotReport = {
  fetchedAt: string;
  asOfLabel: string;
  assets: CashSnapshotSection;
  liabilities: CashSnapshotSection | null;
  totalCashAvailable: number;
  totalCashCurrent: number;
  totalLiabilities: number;
  netCashPosition: number;
};

const LIABILITY_KINDS = new Set(["credit"]);

function isLiabilityAccount(kind: string): boolean {
  const normalized = kind.toLowerCase();
  return LIABILITY_KINDS.has(normalized) || normalized.includes("credit");
}

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length >= 4) return `••${digits.slice(-4)}`;
  return accountNumber ? `••${accountNumber}` : "";
}

export function formatAccountLabel(account: MercuryAccountBalance): string {
  const last4 = maskAccountNumber(account.accountNumber);
  if (last4) return `${account.name} ${last4}`;
  return account.name;
}

function buildLine(account: MercuryAccountBalance): CashSnapshotLine {
  return {
    id: account.id,
    label: formatAccountLabel(account),
    availableBalance: account.availableBalance,
    currentBalance: account.currentBalance,
    kind: account.kind,
  };
}

export function buildCashSnapshot(
  accounts: MercuryAccountBalance[],
  fetchedAt: string,
): CashSnapshotReport {
  const assetAccounts = accounts.filter((a) => !isLiabilityAccount(a.kind));
  const liabilityAccounts = accounts.filter((a) => isLiabilityAccount(a.kind));

  const assetLines = assetAccounts.map(buildLine);
  const liabilityLines = liabilityAccounts.map(buildLine);

  const totalCashAvailable = assetLines.reduce(
    (sum, line) => sum + line.availableBalance,
    0,
  );
  const totalCashCurrent = assetLines.reduce(
    (sum, line) => sum + line.currentBalance,
    0,
  );
  const totalLiabilities = liabilityLines.reduce(
    (sum, line) => sum + Math.abs(line.availableBalance),
    0,
  );

  const fetchedDate = new Date(fetchedAt);
  const asOfLabel = fetchedDate.toLocaleString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const liabilities =
    liabilityLines.length > 0
      ? {
          title: "Liabilities",
          lines: liabilityLines,
          subtotalAvailable: -totalLiabilities,
          subtotalCurrent: liabilityLines.reduce(
            (sum, line) => sum + line.currentBalance,
            0,
          ),
        }
      : null;

  return {
    fetchedAt,
    asOfLabel,
    assets: {
      title: "Assets",
      lines: assetLines,
      subtotalAvailable: totalCashAvailable,
      subtotalCurrent: totalCashCurrent,
    },
    liabilities,
    totalCashAvailable,
    totalCashCurrent,
    totalLiabilities,
    netCashPosition: totalCashAvailable - totalLiabilities,
  };
}

export function formatCashCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLiabilityAmount(value: number): string {
  const abs = Math.abs(value);
  if (value < 0) return `(${formatCashCurrency(abs)})`;
  return formatCashCurrency(value);
}

export function cashSnapshotToCsv(report: CashSnapshotReport): string {
  const rows: string[][] = [
    ["Sage Field School"],
    ["Cash Snapshot"],
    [`As of ${report.asOfLabel}`],
    ["Cash-only snapshot — not a full Balance Sheet"],
    [],
    [report.assets.title],
    ["Cash and Cash Equivalents"],
  ];

  for (const line of report.assets.lines) {
    rows.push([
      line.label,
      formatCashCurrency(line.availableBalance),
      formatCashCurrency(line.currentBalance),
    ]);
  }
  rows.push([
    "Total Cash and Cash Equivalents",
    formatCashCurrency(report.totalCashAvailable),
    formatCashCurrency(report.totalCashCurrent),
  ]);
  rows.push([]);

  if (report.liabilities) {
    rows.push([report.liabilities.title]);
    for (const line of report.liabilities.lines) {
      rows.push([
        line.label,
        formatLiabilityAmount(-Math.abs(line.availableBalance)),
        formatLiabilityAmount(line.currentBalance),
      ]);
    }
    rows.push([
      "Total Liabilities",
      formatLiabilityAmount(-report.totalLiabilities),
      formatLiabilityAmount(report.liabilities.subtotalCurrent),
    ]);
    rows.push([]);
  }

  rows.push(["Net Cash Position", formatCashCurrency(report.netCashPosition)]);

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
