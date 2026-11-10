"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function CombinedStatementToolbar({ period }: { period: string }) {
  const router = useRouter();

  return (
    <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <Link
        href="/admin/budget"
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back to Budget
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600 flex items-center gap-2">
          Statement month
          <input
            type="month"
            defaultValue={period}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900"
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              router.push(`/admin/budget/combined-statement?period=${value}`);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:bg-[#234d25]"
          style={{ backgroundColor: "#2C5F2E" }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
