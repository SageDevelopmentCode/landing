"use client";

import { useMemo, useState } from "react";
import { DetailSidebar } from "./DetailSidebar";
import { sendBulkOutreachEmail } from "@/app/actions/sendBulkOutreachEmail";
import {
  OUTREACH_CATEGORY_LABELS,
  OUTREACH_EMAIL_CATALOG,
  type OutreachEmailCategory,
} from "@/app/admin/constants/outreachEmails";

type BulkOutreachResult = {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
};

export function ApplicationsBulkOutreachSidebar({
  isOpen,
  onClose,
  selectedAppIds,
  onClearSelection,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedAppIds: Set<string>;
  onClearSelection: () => void;
}) {
  const [activeTab, setActiveTab] = useState<OutreachEmailCategory>("enrollment");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [result, setResult] = useState<BulkOutreachResult | null>(null);

  const selectedCount = selectedAppIds.size;
  const emailsForTab = useMemo(
    () => OUTREACH_EMAIL_CATALOG.filter((entry) => entry.category === activeTab),
    [activeTab],
  );

  const handleSend = async (emailId: string, label: string) => {
    if (selectedCount === 0 || sendingEmailId) return;

    const confirmed = window.confirm(
      `Send "${label}" to ${selectedCount} selected application${selectedCount === 1 ? "" : "s"}?`,
    );
    if (!confirmed) return;

    setSendingEmailId(emailId);
    setResult(null);

    try {
      const response = await sendBulkOutreachEmail({
        emailKey: emailId,
        applicationIds: Array.from(selectedAppIds),
      });
      setResult(response);
      if (response.sent > 0 && response.failed === 0) {
        onClearSelection();
      }
    } catch (err) {
      setResult({
        sent: 0,
        failed: selectedCount,
        skipped: 0,
        errors: [String(err)],
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <DetailSidebar
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Outreach"
      footer={
        result ? (
          <div className="text-xs text-gray-600 space-y-2">
            <p>
              Sent {result.sent}
              {result.failed > 0 ? ` · ${result.failed} failed` : ""}
              {result.skipped > 0 ? ` · ${result.skipped} skipped` : ""}
            </p>
            {result.errors.length > 0 && (
              <ul className="list-disc pl-4 space-y-1 text-red-600">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {selectedCount === 0
            ? "Select applications from the table, board, or pipeline, then choose an email below."
            : `${selectedCount} application${selectedCount === 1 ? "" : "s"} selected`}
        </p>

        <div className="flex gap-1 flex-wrap">
          {(Object.keys(OUTREACH_CATEGORY_LABELS) as OutreachEmailCategory[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                activeTab === tab
                  ? "bg-[#2C5F2E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {OUTREACH_CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {emailsForTab.map((entry) => {
            const isSending = sendingEmailId === entry.id;
            const isDisabled = selectedCount === 0 || sendingEmailId !== null;

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleSend(entry.id, entry.label)}
                disabled={isDisabled}
                className="px-3 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25] disabled:opacity-50 disabled:cursor-not-allowed text-left"
                style={{ backgroundColor: "#2C5F2E", border: "none", borderRadius: "8px" }}
              >
                {isSending ? "Sending…" : entry.label}
              </button>
            );
          })}
        </div>
      </div>
    </DetailSidebar>
  );
}
