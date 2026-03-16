"use client";

import { useState } from "react";
import { Receipt, CheckCircle2 } from "lucide-react";
import { DetailSidebar } from "@/app/admin/components/DetailSidebar";
import {
  SidebarField,
  SidebarSection,
} from "@/app/components/SidebarPrimitives";
import type { StripeTransaction } from "./page";

interface Props {
  transactions: StripeTransaction[];
  studentMap: Record<string, string>;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatPaymentType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === "completed";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isCompleted
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AllCaughtUpCard() {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
        style={{ backgroundColor: "#d4e6d0" }}
      >
        <CheckCircle2
          className="w-6 h-6"
          style={{ color: "#4a7c59" }}
          strokeWidth={1.5}
        />
      </div>
      <p className="text-base font-semibold font-heading text-gray-700 mb-1">
        All caught up!
      </p>
      <p className="text-sm font-body text-gray-400">
        You have no outstanding payments at this time.
      </p>
    </div>
  );
}

export default function BillingPage({ transactions, studentMap }: Props) {
  const [selectedTx, setSelectedTx] = useState<StripeTransaction | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
            Pending Payments
          </h2>
          <AllCaughtUpCard />
        </div>
        <div>
          <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
            Payment History
          </h2>
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ backgroundColor: "#d4e6d0" }}
            >
              <Receipt
                className="w-6 h-6"
                style={{ color: "#4a7c59" }}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-base font-semibold font-heading text-gray-700 mb-1">
              No transactions yet
            </p>
            <p className="text-sm font-body text-gray-400">
              Your payment history will appear here once a transaction is processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
            Pending Payments
          </h2>
          <AllCaughtUpCard />
        </div>
        <div>
          <h2 className="text-lg font-semibold font-heading text-gray-700 mb-4">
            Payment History
          </h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Date
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Description
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Student
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Type
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">
                Amount
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                  {formatDate(tx.created_at)}
                </td>
                <td className="px-5 py-4 text-gray-800 max-w-[240px] truncate">
                  {tx.description ?? "—"}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {studentMap[tx.student_id ?? ""] ?? "—"}
                </td>
                <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                  {formatPaymentType(tx.payment_type)}
                </td>
                <td className="px-5 py-4 text-gray-800 text-right whitespace-nowrap font-semibold">
                  {formatCents(tx.amount_cents)}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      </div>

      <DetailSidebar
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
      >
        {selectedTx && (
          <div className="space-y-2">
            <SidebarSection title="Payment">
              <SidebarField
                label="Amount"
                value={formatCents(selectedTx.amount_cents)}
              />
              {selectedTx.intended_amount_cents != null && (
                <SidebarField
                  label="Base Amount"
                  value={formatCents(selectedTx.intended_amount_cents)}
                />
              )}
              <SidebarField
                label="Type"
                value={formatPaymentType(selectedTx.payment_type)}
              />
              <SidebarField label="Status" value={selectedTx.status} />
              <SidebarField
                label="Student"
                value={
                  selectedTx.student_id
                    ? (studentMap[selectedTx.student_id] ?? "—")
                    : "—"
                }
              />
              <SidebarField
                label="Description"
                value={selectedTx.description}
              />
              <SidebarField
                label="Date"
                value={formatDate(selectedTx.created_at)}
              />
              <SidebarField
                label="Cover Fees"
                value={selectedTx.cover_fees ? "Yes" : "No"}
              />
            </SidebarSection>

            <SidebarSection title="Payer">
              <SidebarField label="Name" value={selectedTx.payer_name} />
              <SidebarField label="Email" value={selectedTx.payer_email} />
            </SidebarSection>

            <SidebarSection title="Stripe IDs">
              <SidebarField
                label="Session ID"
                value={selectedTx.stripe_session_id}
              />
              <SidebarField
                label="Payment Intent ID"
                value={selectedTx.stripe_payment_intent_id}
              />
            </SidebarSection>
          </div>
        )}
      </DetailSidebar>
    </>
  );
}
