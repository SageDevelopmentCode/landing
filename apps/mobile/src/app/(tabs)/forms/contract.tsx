// Enrollment contracts 1 & 2 — read-only Garden viewer. Each section card
// carries its own signature record, matched by section_id.
import { CONTRACT_CONTENT, CONTRACT_INFO, CONTRACT_TITLES } from "@/features/forms/content/contract";
import { bySection, fetchSignatures, MissingParamsError } from "@/features/forms/formsUtils";
import {
  FormCard,
  FormDetailScreen,
  FormEmpty,
  FormInfoCard,
  LegalSection,
  SignatureRecord,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { useLocalSearchParams } from "expo-router";

export default function ContractScreen() {
  const { studentId, userId, contractId } = useLocalSearchParams<{
    studentId: string;
    userId: string;
    contractId: string;
  }>();
  useHideTabBar();

  const contractNum = Number(contractId);
  const validContract = !!contractId && Number.isFinite(contractNum);
  const sections = CONTRACT_CONTENT[contractNum];
  const title = CONTRACT_TITLES[contractNum] ?? `Contract #${contractId ?? ""}`;

  const detail = useFormDetail(
    studentId && userId && validContract ? `${userId}:${studentId}:${contractNum}` : null,
    async () => {
      if (!studentId || !userId || !validContract) throw new MissingParamsError();
      return fetchSignatures(studentId, userId, contractNum);
    },
    "parent-forms-contract",
  );

  return (
    <FormDetailScreen title={title} detail={detail} skeletonCards={2}>
      {(signatures, fb) => {
        const sigMap = bySection(signatures);
        if (sections) {
          return (
            <>
              <FormInfoCard icon="document-text-outline">{CONTRACT_INFO}</FormInfoCard>
              {sections.map((section, idx) => {
                const sectionNum = idx + 1;
                return (
                  <LegalSection
                    key={sectionNum}
                    title={`Section ${sectionNum} — ${section.heading}`}
                    section={section}
                    onEmail={fb.openEmail}
                  >
                    <SignatureRecord sig={sigMap[sectionNum]} />
                  </LegalSection>
                );
              })}
            </>
          );
        }
        // Fallback for unknown contract IDs: signature-only display
        if (signatures.length === 0) {
          return <FormEmpty title="No signature records found for this contract." body="" />;
        }
        return (
          <>
            {signatures.map((sig) => (
              <FormCard key={sig.id} title={`Section ${sig.section_id}`}>
                <SignatureRecord sig={sig} />
              </FormCard>
            ))}
          </>
        );
      }}
    </FormDetailScreen>
  );
}
