export type CombinedStatementAddress = {
  name: string;
  address1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type CombinedStatementAccountSummary = {
  id: string;
  label: string;
  last4: string;
  openingBalance: number;
  endingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lineCount: number;
};

export type MercuryStatementType =
  | "Real-Time Payment"
  | "Transfer In"
  | "Transfer Out"
  | "Check Deposit"
  | "Interest"
  | "Card Payment"
  | "ACH Payment"
  | "Other";

export type CombinedStatementTransactionRow = {
  id: string;
  postedAt: string;
  dateUtc: string;
  showDate: boolean;
  description: string;
  type: MercuryStatementType;
  amount: number;
  endOfDayBalance: number | null;
  accountLabel: string;
};

export type CombinedStatementModel = {
  period: string;
  periodLabel: string;
  periodRangeLabel: string;
  periodDays: number;
  legalName: string;
  address: CombinedStatementAddress;
  einMasked: string;
  routingNumber: string;
  accountTypeLabel: string;
  accountsIncludedLabel: string;
  accountSummaries: CombinedStatementAccountSummary[];
  beginningBalance: number;
  totalWithdrawals: number;
  totalDeposits: number;
  statementBalance: number;
  transactions: CombinedStatementTransactionRow[];
  credit: {
    periodLabel: string;
    beginningBalanceOwed: number;
    totalCharges: number;
    totalPayments: number;
    endingBalanceOwed: number;
    transactions: CombinedStatementTransactionRow[];
  } | null;
};
