import { Poppins } from "next/font/google";
import { cssColors as colors } from "../design-system";
import { listAgreements } from "@/app/lib/contractor-agreement/queries";
import ContractorAgreementsClient from "./ContractorAgreementsClient";

export const dynamic = "force-dynamic";

const poppins = Poppins({ weight: ["300", "400", "700", "900"], subsets: ["latin"] });

export default async function ContractorAgreementsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const [{ id }, agreements] = await Promise.all([searchParams, listAgreements()]);
  const awaiting = agreements.filter((a) => a.status === "signed").length;

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className={`text-2xl font-bold ${poppins.className}`} style={{ color: colors.mistyForest }}>
          Contractor Agreements
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
          Create a private signing link for each teacher. They sign online; you countersign here and download the PDF.
          {awaiting > 0 ? ` ${awaiting} awaiting your countersignature.` : ""}
        </p>
      </div>
      <ContractorAgreementsClient initialAgreements={agreements} initialOpenId={id ?? null} />
    </div>
  );
}
