import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { buildCombinedStatement, resolveStatementPeriod } from "@/app/lib/mercury/buildCombinedStatement";
import { CombinedStatementToolbar } from "./CombinedStatementToolbar";
import { MercuryCombinedStatementDocument } from "./MercuryCombinedStatementDocument";

const mercuryStatementFont = Inter({
  subsets: ["latin"],
  variable: "--font-mercury-statement",
  display: "swap",
});

export default async function CombinedMercuryStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const { period } = resolveStatementPeriod(periodParam);

  let model;
  try {
    model = await buildCombinedStatement(period);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load statement";
    return (
      <div className="mercury-statement-print-root min-h-full bg-gray-50 pb-10">
        <CombinedStatementToolbar period={period} />
        <div className="mx-auto max-w-xl mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      </div>
    );
  }

  if (!model) {
    notFound();
  }

  return (
    <div
      className={`mercury-statement-print-root min-h-full bg-gray-50 pb-10 ${mercuryStatementFont.variable}`}
    >
      <CombinedStatementToolbar period={period} />
      <MercuryCombinedStatementDocument model={model} />
    </div>
  );
}
