import { notFound } from "next/navigation";
import { getCatalogEntry } from "@/app/lib/contract-download-catalog";
import { ContractPrintView } from "./ContractPrintView";

export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getCatalogEntry(slug);

  if (!entry || entry.kind === "static") {
    notFound();
  }

  return <ContractPrintView entry={entry} />;
}