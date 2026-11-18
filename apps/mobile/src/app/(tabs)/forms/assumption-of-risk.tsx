// Assumption of Risk (contract 6) — read-only Garden viewer.
import {
  AOR_INFO,
  AOR_SECTIONS,
  ASSUMPTION_OF_RISK_CONTRACT_ID,
  SIGNATURE_ACKNOWLEDGMENT,
} from "@/features/forms/content/assumptionOfRisk";
import { fetchSignatures, MissingParamsError } from "@/features/forms/formsUtils";
import {
  AcknowledgmentCard,
  FormDetailScreen,
  FormInfoCard,
  LegalSection,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { useLocalSearchParams } from "expo-router";

export default function AssumptionOfRiskScreen() {
  const { studentId, userId } = useLocalSearchParams<{ studentId: string; userId: string }>();
  useHideTabBar();

  const detail = useFormDetail(
    studentId && userId ? `${userId}:${studentId}` : null,
    async () => {
      if (!studentId || !userId) throw new MissingParamsError();
      const sigs = await fetchSignatures(studentId, userId, ASSUMPTION_OF_RISK_CONTRACT_ID);
      return { sig: sigs[0] ?? null };
    },
    "parent-forms-assumption-of-risk",
  );

  return (
    <FormDetailScreen title="Assumption of Risk" detail={detail}>
      {({ sig }, fb) => (
        <>
          <FormInfoCard icon="shield-checkmark-outline">{AOR_INFO}</FormInfoCard>
          {AOR_SECTIONS.map((section, idx) => (
            <LegalSection key={idx} title={section.heading} section={section} onEmail={fb.openEmail} />
          ))}
          <AcknowledgmentCard
            title="Releasor Acknowledgment"
            text={SIGNATURE_ACKNOWLEDGMENT}
            sig={sig}
          />
        </>
      )}
    </FormDetailScreen>
  );
}
