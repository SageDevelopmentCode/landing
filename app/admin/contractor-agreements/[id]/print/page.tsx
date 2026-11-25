import { notFound } from "next/navigation";
import { PrintDocumentShell } from "@/app/admin/contract-downloads/components/PrintDocumentShell";
import { ContractPrintToolbar } from "@/app/admin/contract-downloads/components/ContractPrintToolbar";
import AgreementDocument from "@/app/lib/contractor-agreement/AgreementDocument";
import { getAgreementById } from "@/app/lib/contractor-agreement/queries";

export const dynamic = "force-dynamic";

export default async function AdminAgreementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agreement = await getAgreementById(id);
  if (!agreement) notFound();

  return (
    <>
      <ContractPrintToolbar
        title={`Contractor Agreement · ${agreement.signed_printed_name ?? agreement.contractor_name}`}
        backHref={`/admin/contractor-agreements?id=${agreement.id}`}
        backLabel="← Contractor Agreements"
      />
      <PrintDocumentShell>
        <AgreementDocument agreement={agreement} showAudit />
      </PrintDocumentShell>
    </>
  );
}
