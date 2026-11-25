import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintDocumentShell } from "@/app/admin/contract-downloads/components/PrintDocumentShell";
import { ContractPrintToolbar } from "@/app/admin/contract-downloads/components/ContractPrintToolbar";
import AgreementDocument from "@/app/lib/contractor-agreement/AgreementDocument";
import { getAgreementByToken, toPublic } from "@/app/lib/contractor-agreement/queries";
import { isTeacherSigned } from "@/app/lib/contractor-agreement/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your signed agreement · Sage Field",
  robots: { index: false, follow: false },
};

export default async function TeacherAgreementPrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agreement = await getAgreementByToken(token);
  if (!agreement || !isTeacherSigned(agreement.status)) notFound();

  return (
    <>
      <ContractPrintToolbar title="Independent Contractor Agreement" backHref={`/agreement/${token}`} backLabel="← Back" />
      <PrintDocumentShell>
        <AgreementDocument agreement={toPublic(agreement)} />
      </PrintDocumentShell>
    </>
  );
}
