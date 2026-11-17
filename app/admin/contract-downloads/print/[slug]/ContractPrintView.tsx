"use client";

import type { ContractDownloadEntry } from "@/app/lib/contract-download-catalog";
import { getBlankEnrollmentItemProps } from "@/app/lib/blank-enrollment-props";
import {
  renderEnrollmentItemContent,
  ENROLLMENT_ITEM_TITLES,
} from "@/app/admin/components/enrollment-summary/EnrollmentSummarySections";
import { ParticipantAgreementBody } from "@/app/lib/participant-agreements/participant-agreement-body";
import { TermsDocument } from "@/app/legal/terms-sections";
import { ContractPrintToolbar } from "../../components/ContractPrintToolbar";
import { PrintDocumentShell } from "../../components/PrintDocumentShell";

export function ContractPrintView({ entry }: { entry: ContractDownloadEntry }) {
  let body: React.ReactNode = null;

  if (entry.kind === "enrollment-item" && entry.enrollmentItemId) {
    const props = getBlankEnrollmentItemProps(entry.enrollmentItemId);
    body = (
      <>
        <h1 className="text-xl font-bold font-heading text-gray-900 mb-1">
          {ENROLLMENT_ITEM_TITLES[entry.enrollmentItemId] ?? entry.title}
        </h1>
        <p className="text-xs text-gray-500 font-body mb-6">{entry.description}</p>
        {renderEnrollmentItemContent(props)}
      </>
    );
  } else if (entry.kind === "shadow") {
    body = (
      <>
        <h1 className="text-xl font-bold font-heading text-gray-900 mb-6">
          {entry.title}
        </h1>
        <ParticipantAgreementBody
          variant="shadow"
          mode="print"
          showBlankSignatureLine
        />
      </>
    );
  } else if (entry.kind === "friday") {
    body = (
      <>
        <h1 className="text-xl font-bold font-heading text-gray-900 mb-6">
          {entry.title}
        </h1>
        <ParticipantAgreementBody
          variant="friday"
          mode="print"
          showBlankSignatureLine
        />
      </>
    );
  } else if (entry.kind === "terms") {
    body = <TermsDocument />;
  }

  return (
    <>
      <ContractPrintToolbar title={entry.title} />
      <PrintDocumentShell>{body}</PrintDocumentShell>
    </>
  );
}