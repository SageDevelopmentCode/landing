"use client";

export function PrintDocumentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="contract-print-root min-h-screen bg-white">
      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in;
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

          .contract-print-root {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .contract-print-document {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .summary-signature-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="contract-print-document max-w-3xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}