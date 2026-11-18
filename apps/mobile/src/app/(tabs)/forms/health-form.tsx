// Emergency Contact, Health, and Immunization Form (contract 3) — read-only
// Garden viewer. When only the contract-3 signatures exist (no health-info
// row), the signatures still show with a "details not on file" note.
import { HEALTH_FORM_CONTRACT_ID, SIGNATURE_SECTIONS } from "@/features/forms/content/healthForm";
import { fetchSignatures, MissingParamsError, unwrap } from "@/features/forms/formsUtils";
import {
  AcknowledgmentCard,
  FormCard,
  FormDetailScreen,
  FormEmpty,
  InfoRow,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";

interface HealthInfo {
  student_id: string;
  physician_name: string | null;
  physician_phone: string | null;
  clinic_name: string | null;
  preferred_hospital: string | null;
  in_state_contact_name: string | null;
  in_state_contact_phone: string | null;
  in_state_contact_relation: string | null;
  out_of_state_contact_name: string | null;
  out_of_state_contact_phone: string | null;
  out_of_state_contact_relation: string | null;
  insurance_provider: string | null;
  policy_number: string | null;
  group_number: string | null;
  health_conditions: string | null;
  immunization_status: string | null;
  ongoing_care: boolean | null;
  ongoing_care_description: string | null;
  emergency_medication_required: boolean | null;
  emergency_medication_description: string | null;
}

// Labels from the web Health Form (app/parent/dashboard/HealthFormModal.tsx).
const IMMUNIZATION_STATUS_LABELS: Record<string, string> = {
  record: "Immunization record on file",
  exemption: "Exemption affidavit",
};

function yesNo(flag: boolean | null, description: string | null): string {
  if (flag === true) return description?.trim() || "Yes";
  if (flag === false) return "No";
  return "—";
}

export default function HealthFormScreen() {
  const { studentId, userId } = useLocalSearchParams<{ studentId: string; userId: string }>();
  useHideTabBar();

  const detail = useFormDetail(
    studentId && userId ? `${userId}:${studentId}` : null,
    async () => {
      if (!studentId || !userId) throw new MissingParamsError();
      const [healthRes, signatures] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_health_info")
          .select("*")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        fetchSignatures(studentId, userId, HEALTH_FORM_CONTRACT_ID),
      ]);
      return { info: unwrap(healthRes) as HealthInfo | null, signatures };
    },
    "parent-forms-health-form",
  );

  return (
    <FormDetailScreen
      title="Health Information"
      detail={detail}
      skeletonCards={4}
      isEmpty={(d) => !d.info && d.signatures.length === 0}
    >
      {({ info, signatures }) => (
        <>
          {info ? (
            <>
              <FormCard title="In-State Emergency Contact">
                <InfoRow label="Name" value={info.in_state_contact_name} />
                <InfoRow label="Relationship" value={info.in_state_contact_relation} />
                <InfoRow label="Phone" value={info.in_state_contact_phone} />
              </FormCard>

              <FormCard title="Out-of-State Emergency Contact">
                <InfoRow label="Name" value={info.out_of_state_contact_name} />
                <InfoRow label="Relationship" value={info.out_of_state_contact_relation} />
                <InfoRow label="Phone" value={info.out_of_state_contact_phone} />
              </FormCard>

              <FormCard title="Physician & Hospital">
                <InfoRow label="Physician" value={info.physician_name} />
                <InfoRow label="Phone" value={info.physician_phone} />
                <InfoRow label="Clinic / Practice" value={info.clinic_name} />
                <InfoRow label="Preferred Hospital" value={info.preferred_hospital} />
              </FormCard>

              <FormCard title="Insurance">
                <InfoRow label="Provider" value={info.insurance_provider} />
                <InfoRow label="Policy #" value={info.policy_number} />
                <InfoRow label="Group #" value={info.group_number} />
              </FormCard>

              <FormCard title="Medical">
                <InfoRow label="Health Conditions" value={info.health_conditions} />
                <InfoRow
                  label="Immunization Status"
                  value={
                    info.immunization_status
                      ? (IMMUNIZATION_STATUS_LABELS[info.immunization_status] ?? info.immunization_status)
                      : null
                  }
                />
                <InfoRow
                  label="Ongoing Care"
                  value={yesNo(info.ongoing_care, info.ongoing_care_description)}
                />
                <InfoRow
                  label="Emergency Medication"
                  value={yesNo(info.emergency_medication_required, info.emergency_medication_description)}
                />
              </FormCard>
            </>
          ) : (
            <FormEmpty
              title="Health details aren't on file"
              body="Your signed acknowledgments are below."
            />
          )}

          {signatures.map((sig) => {
            const section = SIGNATURE_SECTIONS[sig.section_id];
            if (!section) return null;
            return (
              <AcknowledgmentCard key={sig.id} title={section.title} text={section.text} sig={sig} />
            );
          })}
        </>
      )}
    </FormDetailScreen>
  );
}
