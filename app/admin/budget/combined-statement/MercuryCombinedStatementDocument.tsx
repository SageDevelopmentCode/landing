"use client";

import type { CombinedStatementModel } from "@/app/lib/mercury/combinedStatementTypes";
import {
  formatAddressBlock,
  formatMercuryAmount,
  formatMercuryDateUtc,
  typeIconKind,
} from "./mercuryStatementTypes";

export type MercuryCombinedStatementDocumentProps = {
  model: CombinedStatementModel;
};

function MercuryLogo() {
  return (
    <div className="mercury-statement-logo flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <circle cx="14" cy="14" r="13" fill="#2C3E6B" />
        <path
          d="M14 5.5a8.5 8.5 0 1 1-5.6 14.8 1.2 1.2 0 0 0 1.6-1.2A6 6 0 1 0 14 8.2a1.2 1.2 0 0 0 0-2.7Z"
          fill="#F2C94C"
        />
        <circle cx="14" cy="14" r="2.2" fill="#F2C94C" />
      </svg>
      <span className="text-[15px] font-bold tracking-[0.28em] text-[#1a1a1a]">
        MERCURY
      </span>
    </div>
  );
}

function TypeCell({ type }: { type: CombinedStatementModel["transactions"][0]["type"] }) {
  const icon = typeIconKind(type);
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#666] whitespace-nowrap">
      {icon === "transfer" && (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0 text-[#666]">
          <path
            d="M2 7h8M7.5 4.5 10 7l-2.5 2.5M12 7H4M6.5 4.5 4 7l2.5 2.5"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {icon === "payment" && (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0 text-[#666]">
          <path
            d="m2 7 9-4.5v9L2 7Z"
            stroke="currentColor"
            strokeWidth="1.1"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {type}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 text-[15px] leading-7 text-[#333]">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function MercuryFooter() {
  return (
    <footer className="mercury-statement-footer mt-12 text-center text-[11px] leading-5 text-[#888]">
      <p>Banking services provided by Column N.A., Member FDIC</p>
      <p>
        Mercury | help@mercury.com | 2261 Market Street, Suite 86807, San Francisco,
        CA 94114
      </p>
    </footer>
  );
}

function TransactionTable({
  rows,
  totalLabel,
  totalAmount,
}: {
  rows: CombinedStatementModel["transactions"];
  totalLabel: string;
  totalAmount: number;
}) {
  return (
    <div className="mercury-statement-transactions">
      <h2 className="text-[22px] font-normal text-[#9aa5cc] mb-4 tracking-tight">
        All Transactions /
      </h2>
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="text-left text-[#666]">
            <th className="pb-3 font-medium w-[100px]">Date (UTC)</th>
            <th className="pb-3 font-medium">Description</th>
            <th className="pb-3 font-medium w-[170px]">Type</th>
            <th className="pb-3 font-medium text-right w-[110px]">Amount</th>
            <th className="pb-3 font-medium text-right w-[150px]">
              End of day balance
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#ebebeb]">
              <td className="py-3 pr-3 text-[#333] align-top whitespace-nowrap">
                {row.showDate ? formatMercuryDateUtc(row.dateUtc) : ""}
              </td>
              <td className="py-3 pr-4 text-[#333] align-top">{row.description}</td>
              <td className="py-3 pr-4 align-top">
                <TypeCell type={row.type} />
              </td>
              <td
                className={`py-3 pr-4 text-right tabular-nums align-top ${
                  row.amount > 0 ? "text-[#2f9e7a]" : "text-[#333]"
                }`}
              >
                {formatMercuryAmount(row.amount)}
              </td>
              <td className="py-3 text-right tabular-nums text-[#333] align-top">
                {row.endOfDayBalance === null
                  ? ""
                  : formatMercuryAmount(row.endOfDayBalance)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-[#333]">
            <td colSpan={3} className="pt-4 pb-2 font-semibold text-[#333]">
              {totalLabel}
            </td>
            <td colSpan={2} className="pt-4 pb-2 text-right font-semibold tabular-nums text-[#333]">
              {formatMercuryAmount(totalAmount)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function MercuryCombinedStatementDocument({
  model,
}: MercuryCombinedStatementDocumentProps) {
  const addressLines = formatAddressBlock(model.address);

  return (
    <>
      <div className="mercury-statement-document mx-auto bg-white text-[#1a1a1a]">
        <section className="mercury-statement-summary break-inside-avoid">
          <div className="flex items-start justify-between gap-8 mb-10">
            <MercuryLogo />
            <div className="text-right text-[15px] leading-6 text-[#666]">
              <p className="text-[#333]">{model.periodLabel}</p>
              <p>{model.periodRangeLabel}</p>
              <p>All dates in UTC</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div>
              <p className="text-[17px] font-semibold text-[#333] mb-3">
                {model.legalName}
              </p>
              {addressLines.map((line) => (
                <p key={line} className="text-[15px] leading-7 text-[#666]">
                  {line}
                </p>
              ))}
              <p className="text-[15px] leading-7 text-[#666] mt-1">
                EIN {model.einMasked}
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-[15px] font-medium text-[#9aa5cc] mb-3">
                  Account details
                </h3>
                <SummaryRow label="Account Type" value={model.accountTypeLabel} />
                <SummaryRow
                  label="Accounts included"
                  value={`${model.accountSummaries.length} (${model.accountsIncludedLabel})`}
                />
                <SummaryRow
                  label="Routing Number"
                  value={model.routingNumber}
                />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-[#9aa5cc] mb-3">
                  Account activity
                </h3>
                <SummaryRow
                  label="Beginning Balance"
                  value={formatMercuryAmount(model.beginningBalance)}
                />
                <SummaryRow
                  label="Total withdrawals"
                  value={formatMercuryAmount(model.totalWithdrawals)}
                />
                <SummaryRow
                  label="Total deposits"
                  value={formatMercuryAmount(model.totalDeposits)}
                />
                <SummaryRow
                  label="Statement balance"
                  value={formatMercuryAmount(model.statementBalance)}
                />
              </div>
            </div>
          </div>

          <MercuryFooter />
        </section>

        <section className="mercury-statement-page-break break-before-page pt-8">
          <TransactionTable
            rows={model.transactions}
            totalLabel="Total"
            totalAmount={model.statementBalance}
          />
          <MercuryFooter />
        </section>

        {model.credit && (
          <section className="mercury-statement-page-break break-before-page pt-8">
            <div className="mb-10">
              <div className="flex items-start justify-between gap-8 mb-8">
                <MercuryLogo />
                <div className="text-right text-[15px] leading-6 text-[#666]">
                  <p className="text-[#333]">{model.credit.periodLabel}</p>
                  <p>{model.periodRangeLabel}</p>
                  <p>All dates in UTC</p>
                </div>
              </div>
              <div className="max-w-md ml-auto space-y-2">
                <h3 className="text-[15px] font-medium text-[#9aa5cc] mb-3">
                  Account activity
                </h3>
                <SummaryRow
                  label="Starting balance owed"
                  value={formatMercuryAmount(model.credit.beginningBalanceOwed)}
                />
                <SummaryRow
                  label="Charges"
                  value={formatMercuryAmount(model.credit.totalCharges)}
                />
                <SummaryRow
                  label="Payments"
                  value={formatMercuryAmount(model.credit.totalPayments)}
                />
                <SummaryRow
                  label="Ending balance owed"
                  value={formatMercuryAmount(model.credit.endingBalanceOwed)}
                />
              </div>
            </div>

            <TransactionTable
              rows={model.credit.transactions}
              totalLabel="Total owed"
              totalAmount={model.credit.endingBalanceOwed}
            />
            <MercuryFooter />
          </section>
        )}
      </div>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in;
        }

        .mercury-statement-print-root {
          font-family: var(--font-mercury-statement), Inter, system-ui, sans-serif;
        }

        .mercury-statement-document {
          width: 612px;
          max-width: 100%;
          padding: 36px 40px 48px;
        }

        .mercury-statement-page-break {
          break-before: page;
          page-break-before: always;
        }

        @media print {
          aside,
          .lg\\:hidden.fixed.top-4 {
            display: none !important;
          }

          .h-screen.flex.overflow-hidden {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          main {
            padding: 0 !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }

          .mercury-statement-print-root {
            background: white !important;
            padding: 0 !important;
          }

          .mercury-statement-document {
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }

          .mercury-statement-footer {
            position: fixed;
            bottom: 0.35in;
            left: 0.5in;
            right: 0.5in;
          }
        }
      `}</style>
    </>
  );
}
