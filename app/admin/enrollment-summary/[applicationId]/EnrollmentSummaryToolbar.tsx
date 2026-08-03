"use client";

import Link from "next/link";

export function EnrollmentSummaryToolbar() {
  return (
    <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
      <Link
        href="/admin/applications"
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back to Applications
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25]"
        style={{ backgroundColor: "#2C5F2E" }}
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
