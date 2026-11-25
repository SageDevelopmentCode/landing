"use client";

import Link from "next/link";

export function ContractPrintToolbar({
  title,
  backHref = "/admin/contract-downloads",
  backLabel = "← Contract PDFs",
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <Link
        href={backHref}
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        {backLabel}
      </Link>
      <span className="text-sm text-gray-500 truncate max-w-[40%] hidden sm:inline">
        {title}
      </span>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25]"
        style={{ backgroundColor: "#2C5F2E" }}
      >
        Download PDF
      </button>
    </div>
  );
}