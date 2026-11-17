"use client";

import Link from "next/link";
import { ExternalLink, Download, FileText } from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";
import {
  getCatalogByCategory,
  type ContractDownloadEntry,
} from "@/app/lib/contract-download-catalog";

function DownloadRow({ entry }: { entry: ContractDownloadEntry }) {
  const isStatic = entry.kind === "static";

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <FileText
          className="w-4 h-4 flex-shrink-0 mt-0.5"
          style={{ color: colors.textTertiary }}
        />
        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: colors.textPrimary }}
          >
            {entry.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
            {entry.description}
          </p>
        </div>
      </div>
      {isStatic ? (
        <a
          href={entry.staticHref}
          download={entry.staticFilename}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0"
          style={{ backgroundColor: colors.accent, color: "#fff" }}
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </a>
      ) : (
        <Link
          href={`/admin/contract-downloads/print/${entry.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0"
          style={{
            borderColor: colors.border,
            color: colors.textSecondary,
            backgroundColor: colors.surface,
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open for PDF
        </Link>
      )}
    </div>
  );
}

export default function ContractDownloadsPage() {
  const groups = getCatalogByCategory();

  return (
    <div className="space-y-6 pt-6 max-w-3xl">
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Contract PDFs
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textTertiary }}>
          Download blank enrollment forms, event waivers, and site terms. Use{" "}
          <strong className="font-medium" style={{ color: colors.textSecondary }}>
            Open for PDF
          </strong>{" "}
          then Save as PDF from your browser print dialog.
        </p>
      </div>

      {groups.map((group) => (
        <section
          key={group.category}
          className="overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
          }}
        >
          <div
            className="px-4 py-3"
            style={{
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.elevated,
            }}
          >
            <h2
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: colors.textQuaternary }}
            >
              {group.label}
            </h2>
          </div>
          <div>
            {group.items.map((entry) => (
              <DownloadRow key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}