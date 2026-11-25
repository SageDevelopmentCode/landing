import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GardenRoot from "@/app/_garden/GardenRoot";
import { GardenToastProvider } from "@/app/_garden/toast";
import { getAgreementByToken, markAgreementViewed, toPublic } from "@/app/lib/contractor-agreement/queries";
import AgreementSigningPage from "./AgreementSigningPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contractor Agreement · Sage Field",
  robots: { index: false, follow: false },
};

export default async function AgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agreement = await getAgreementByToken(token);
  if (!agreement) notFound();

  if (agreement.status === "sent") {
    await markAgreementViewed(agreement.id);
    agreement.status = "viewed";
    agreement.viewed_at = new Date().toISOString();
  }

  return (
    <GardenRoot>
      <GardenToastProvider>
        <AgreementSigningPage agreement={toPublic(agreement)} token={token} />
      </GardenToastProvider>
    </GardenRoot>
  );
}
