import "server-only";

import { mercuryFetch } from "./mercuryClient";
import type {
  CombinedStatementAddress,
  CombinedStatementAccountSummary,
  CombinedStatementModel,
  CombinedStatementTransactionRow,
  MercuryStatementType,
} from "./combinedStatementTypes";

type MercuryAccount = {
  id: string;
  name: string;
  nickname?: string | null;
  kind: string;
  status: string;
  accountNumber: string;
};

type StatementRef = { id: string; postedAt?: string; createdAt?: string };

type MercuryStatement = {
  id: string;
  startDate: string;
  endDate: string;
  accountNumber?: string;
  routingNumber?: string;
  companyLegalName?: string;
  companyLegalAddress?: CombinedStatementAddress;
  ein?: string;
  endingBalance: number;
  transactions: StatementRef[];
  details?: {
    accountType?: string;
    accountDetails?: {
      startingBalance?: number;
      totalTransactions?: number;
      totalOneTimePayments?: number;
    };
  };
};

type MercuryTransaction = {
  id: string;
  amount: number;
  postedAt?: string | null;
  createdAt?: string | null;
  status?: string;
  kind?: string;
  bankDescription?: string | null;
  counterpartyName?: string | null;
  counterpartyNickname?: string | null;
  note?: string | null;
  accountId?: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function isCreditKind(kind: string): boolean {
  return kind.toLowerCase().includes("credit");
}

function last4(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  return digits.slice(-4) || "????";
}

function maskEin(ein: string | undefined): string {
  if (!ein) return "••••";
  const digits = ein.replace(/\D/g, "");
  return `••${digits.slice(-4)}`;
}

function accountLabel(account: MercuryAccount): string {
  const tail = last4(account.accountNumber);
  const base = account.name.includes("••") ? account.name : `${account.name} ••${tail}`;
  if (account.nickname && !base.toLowerCase().includes(account.nickname.toLowerCase())) {
    return `${account.nickname} · ${base}`;
  }
  return base;
}

export function resolveStatementPeriod(period?: string): {
  period: string;
  periodStart: string;
  periodEnd: string;
} {
  const match = period?.match(/^(\d{4})-(\d{2})$/);
  let year: number;
  let month: number;
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
  } else {
    const now = new Date();
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    year = prev.getUTCFullYear();
    month = prev.getUTCMonth() + 1;
  }
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0));
  const periodEnd = end.toISOString().slice(0, 10);
  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    periodStart,
    periodEnd,
  };
}

function periodLabels(period: string, periodStart: string, periodEnd: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(`${periodStart}T00:00:00Z`);
  const end = new Date(`${periodEnd}T00:00:00Z`);
  const monthName = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const days =
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const range = `${start.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}–${end.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })} (${days} days)`;
  return {
    periodLabel: `${monthName.split(" ")[0]} ${year} statement`,
    periodRangeLabel: range,
    periodDays: days,
    creditPeriodLabel: `${start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })} credit statement`,
  };
}

function mapStatementType(tx: MercuryTransaction): MercuryStatementType {
  const kind = tx.kind ?? "";
  const bank = tx.bankDescription ?? "";
  const counterparty = tx.counterpartyName ?? "";

  if (kind === "outgoingPayment") return "Real-Time Payment";
  if (kind === "internalTransfer") {
    return tx.amount > 0 ? "Transfer In" : "Transfer Out";
  }
  if (kind === "checkDeposit") return "Check Deposit";
  if (kind === "interestPayment") return "Interest";
  if (bank.includes("IO PAYMENT") || counterparty === "Mercury Credit") {
    return "Card Payment";
  }
  if (bank.includes("AMEX") || counterparty === "American Express") {
    return "ACH Payment";
  }
  return "Other";
}

function transactionDescription(
  tx: MercuryTransaction,
  accountsById: Map<string, MercuryAccount>,
): string {
  const kind = tx.kind ?? "";
  const counterparty = tx.counterpartyName ?? "";
  const note = tx.note?.trim() ?? "";

  if (kind === "outgoingPayment") {
    return counterparty || "Payment";
  }

  if (kind === "internalTransfer") {
    if (tx.amount > 0) {
      const source = counterparty.replace(/^Mercury /, "");
      return `Transfer from ${source}`;
    }
    const dest = counterparty.replace(/^Mercury /, "");
    return `Transfer to ${dest}`;
  }

  if (counterparty === "STRIPE" || tx.bankDescription === "SAGE FIELD LLC") {
    return "Stripe deposit";
  }
  if (counterparty === "Stripe") {
    return "Stripe transfer";
  }
  if (counterparty === "American Express") {
    return "American Express payment";
  }
  if (counterparty === "Savings Interest") {
    return "September interest payment";
  }
  if (counterparty === "Mercury IO Cashback") {
    return "Mercury IO cashback";
  }
  if (tx.bankDescription === "IO PAYMENT" && tx.amount < 0) {
    return "Mercury IO card payment";
  }
  if (tx.bankDescription === "IO PAYMENT" && tx.amount > 0) {
    return "Payment from Checking ••2710";
  }
  if (kind === "creditCardTransaction") {
    return tx.bankDescription || counterparty || "Card charge";
  }
  if (counterparty === "MUDKITCHEN") {
    return "MudKitchen transfer";
  }

  const parts: string[] = [];
  if (counterparty) parts.push(counterparty);
  if (note) parts.push(note);
  return parts.join(" · ") || tx.bankDescription || "Transaction";
}

async function fetchStatements(
  accountId: string,
  periodStart: string,
  periodEnd: string,
): Promise<MercuryStatement[]> {
  const data = await mercuryFetch<{ statements?: MercuryStatement[] }>(
    `/account/${accountId}/statements?start=${periodStart}&end=${periodEnd}&limit=100`,
  );
  return data.statements ?? [];
}

async function fetchTransactionsForPeriod(
  periodStart: string,
  periodEnd: string,
): Promise<Map<string, MercuryTransaction>> {
  const all: MercuryTransaction[] = [];
  let startAfter: string | undefined;

  for (let page = 0; page < 30; page++) {
    const params = new URLSearchParams({
      limit: "1000",
      postedStart: periodStart,
      postedEnd: periodEnd,
    });
    if (startAfter) params.set("start_after", startAfter);

    const data = await mercuryFetch<{
      transactions?: MercuryTransaction[];
      page?: { nextPage?: string | null };
    }>(`/transactions?${params.toString()}`);

    const batch = data.transactions ?? [];
    all.push(...batch);
    const next = data.page?.nextPage;
    if (!next || batch.length === 0) break;
    startAfter = next;
  }

  return new Map(all.map((tx) => [tx.id, tx]));
}

async function fetchTransactionById(id: string): Promise<MercuryTransaction | null> {
  try {
    return await mercuryFetch<MercuryTransaction>(`/transactions/${id}`);
  } catch {
    try {
      return await mercuryFetch<MercuryTransaction>(`/transaction/${id}`);
    } catch {
      return null;
    }
  }
}

function pickStatementForPeriod(
  statements: MercuryStatement[],
  periodStart: string,
): MercuryStatement | null {
  const target = periodStart.slice(0, 7);
  return (
    statements.find((s) => s.startDate.startsWith(target)) ??
    statements[0] ??
    null
  );
}

function buildRegisterRows(
  lines: MercuryTransaction[],
  openingBalance: number,
  accountsById: Map<string, MercuryAccount>,
): CombinedStatementTransactionRow[] {
  const sorted = [...lines].sort((a, b) => {
    const aAt = a.postedAt ?? a.createdAt ?? "";
    const bAt = b.postedAt ?? b.createdAt ?? "";
    const cmp = aAt.localeCompare(bAt);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });

  const lastIndexByDate = new Map<string, number>();
  sorted.forEach((tx, index) => {
    const dateUtc = (tx.postedAt ?? tx.createdAt ?? "").slice(0, 10);
    lastIndexByDate.set(dateUtc, index);
  });

  let running = openingBalance;
  let lastDate = "";
  const rows: CombinedStatementTransactionRow[] = [];

  sorted.forEach((tx, index) => {
    const postedAt = tx.postedAt ?? tx.createdAt ?? "";
    const dateUtc = postedAt.slice(0, 10);
    running = roundMoney(running + tx.amount);
    const showDate = dateUtc !== lastDate;
    lastDate = dateUtc;

    const account = tx.accountId ? accountsById.get(tx.accountId) : undefined;
    rows.push({
      id: tx.id,
      postedAt,
      dateUtc,
      showDate,
      description: transactionDescription(tx, accountsById),
      type: mapStatementType(tx),
      amount: tx.amount,
      endOfDayBalance: lastIndexByDate.get(dateUtc) === index ? running : null,
      accountLabel: account ? accountLabel(account) : "",
    });
  });

  return rows;
}

export async function buildCombinedStatement(
  periodArg?: string,
): Promise<CombinedStatementModel | null> {
  const { period, periodStart, periodEnd } = resolveStatementPeriod(periodArg);
  const labels = periodLabels(period, periodStart, periodEnd);

  const accountsData = await mercuryFetch<{ accounts?: MercuryAccount[] }>(
    "/accounts?limit=1000",
  );
  const accounts = accountsData.accounts ?? [];
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  const cashAccounts = accounts.filter((a) => !isCreditKind(a.kind));
  const creditAccounts = accounts.filter((a) => isCreditKind(a.kind));

  let legalName = "Sage Field LLC";
  let address: CombinedStatementAddress = {
    name: legalName,
    address1: "",
    city: "",
    region: "",
    postalCode: "",
    country: "US",
  };
  let einMasked = "••••";
  let routingNumber = "121145433";

  const accountSummaries: CombinedStatementAccountSummary[] = [];
  const cashLines: MercuryTransaction[] = [];
  const transactionsById = await fetchTransactionsForPeriod(periodStart, periodEnd);

  for (const account of cashAccounts) {
    const statements = await fetchStatements(account.id, periodStart, periodEnd);
    const statement = pickStatementForPeriod(statements, periodStart);
    if (!statement) continue;

    if (statement.companyLegalName) legalName = statement.companyLegalName;
    if (statement.companyLegalAddress) address = statement.companyLegalAddress;
    if (statement.ein) einMasked = maskEin(statement.ein);
    if (statement.routingNumber) routingNumber = statement.routingNumber;

    const ids = statement.transactions.map((t) => t.id);

    const accountLines: MercuryTransaction[] = [];
    for (const id of ids) {
      const tx =
        transactionsById.get(id) ?? (await fetchTransactionById(id));
      if (tx) {
        accountLines.push({ ...tx, accountId: tx.accountId ?? account.id });
      }
    }

    const activity = roundMoney(
      accountLines.reduce((sum, t) => sum + t.amount, 0),
    );
    const ending = roundMoney(statement.endingBalance);
    const opening = roundMoney(ending - activity);
    const deposits = roundMoney(
      accountLines.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    );
    const withdrawals = roundMoney(
      accountLines.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
    );

    accountSummaries.push({
      id: account.id,
      label: accountLabel(account),
      last4: last4(account.accountNumber),
      openingBalance: opening,
      endingBalance: ending,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      lineCount: accountLines.length,
    });

    cashLines.push(...accountLines);
  }

  if (accountSummaries.length === 0) {
    return null;
  }

  const beginningBalance = roundMoney(
    accountSummaries.reduce((s, a) => s + a.openingBalance, 0),
  );
  const statementBalance = roundMoney(
    accountSummaries.reduce((s, a) => s + a.endingBalance, 0),
  );
  const totalDeposits = roundMoney(
    cashLines.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
  );
  const totalWithdrawals = roundMoney(
    cashLines.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
  );

  const transactions = buildRegisterRows(
    cashLines,
    beginningBalance,
    accountsById,
  );

  const accountsIncludedLabel = accountSummaries
    .map((a) => `••${a.last4}`)
    .join(", ");

  let creditSection: CombinedStatementModel["credit"] = null;

  for (const creditAccount of creditAccounts) {
    const statements = await fetchStatements(
      creditAccount.id,
      periodStart,
      periodEnd,
    );
    const statement = pickStatementForPeriod(statements, periodStart);
    if (!statement) continue;

    const creditLines: MercuryTransaction[] = [];
    for (const ref of statement.transactions) {
      const tx =
        transactionsById.get(ref.id) ?? (await fetchTransactionById(ref.id));
      if (tx) creditLines.push(tx);
    }

    const starting =
      statement.details?.accountDetails?.startingBalance ?? 0;
    const endingOwed = -roundMoney(statement.endingBalance);
    const charges = roundMoney(
      creditLines.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
    );
    const payments = roundMoney(
      creditLines.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    );

    const creditOpening = roundMoney(-starting);
    const creditRows = buildRegisterRows(
      creditLines.map((tx) => ({ ...tx, accountId: creditAccount.id })),
      creditOpening,
      accountsById,
    ).map((row) => ({
      ...row,
      endOfDayBalance:
        row.endOfDayBalance === null
          ? null
          : roundMoney(Math.max(0, -row.endOfDayBalance)),
    }));

    creditSection = {
      periodLabel: labels.creditPeriodLabel,
      beginningBalanceOwed: roundMoney(-starting),
      totalCharges: charges,
      totalPayments: payments,
      endingBalanceOwed: endingOwed,
      transactions: creditRows,
    };
    break;
  }

  return {
    period,
    periodLabel: labels.periodLabel,
    periodRangeLabel: labels.periodRangeLabel,
    periodDays: labels.periodDays,
    legalName,
    address,
    einMasked,
    routingNumber,
    accountTypeLabel: "Combined cash",
    accountsIncludedLabel,
    accountSummaries,
    beginningBalance,
    totalWithdrawals,
    totalDeposits,
    statementBalance,
    transactions,
    credit: creditSection,
  };
}
