// Emergency Medication Plan (contract 4) — read-only Garden viewer.
import { Garden, GardenFonts, Pill } from "@/components/garden";
import {
  MEDICATION_PLAN_CONTRACT_ID,
  SIGNATURE_AUTHORIZATION,
} from "@/features/forms/content/medicationPlan";
import {
  fetchSignatures,
  formatDateOnly,
  MissingParamsError,
  unwrap,
} from "@/features/forms/formsUtils";
import {
  AcknowledgmentCard,
  FormCard,
  FormDetailScreen,
  FormEmpty,
  FormListHeading,
  InfoRow,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

interface MedicationPlan {
  id: string;
  special_instructions: string | null;
  emergency_procedure: string | null;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage_frequency: string | null;
  condition_reason: string | null;
  is_daily: boolean | null;
  is_emergency_only: boolean | null;
  physician_name: string | null;
  physician_phone: string | null;
  expiration_date: string | null;
}

export default function MedicationPlanScreen() {
  const { studentId, userId } = useLocalSearchParams<{ studentId: string; userId: string }>();
  useHideTabBar();

  const detail = useFormDetail(
    studentId && userId ? `${userId}:${studentId}` : null,
    async () => {
      if (!studentId || !userId) throw new MissingParamsError();
      const [planRes, medsRes, sigs] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_medication_plan")
          .select("id, special_instructions, emergency_procedure")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .schema("parent_app")
          .from("student_medications")
          .select(
            "id, medication_name, dosage_frequency, condition_reason, is_daily, is_emergency_only, physician_name, physician_phone, expiration_date",
          )
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("sort_order", { ascending: true }),
        fetchSignatures(studentId, userId, MEDICATION_PLAN_CONTRACT_ID),
      ]);
      return {
        plan: unwrap(planRes) as MedicationPlan | null,
        medications: (unwrap(medsRes) ?? []) as Medication[],
        sig: sigs[0] ?? null,
      };
    },
    "parent-forms-medication-plan",
  );

  return (
    <FormDetailScreen title="Medication Plan" detail={detail} isEmpty={(d) => !d.plan}>
      {({ plan, medications, sig }) => (
        <>
          {plan && (plan.special_instructions || plan.emergency_procedure) ? (
            <FormCard title="Plan Details">
              {plan.special_instructions ? (
                <InfoRow label="Special Instructions" value={plan.special_instructions} />
              ) : null}
              {plan.emergency_procedure ? (
                <InfoRow label="Emergency Procedure" value={plan.emergency_procedure} />
              ) : null}
            </FormCard>
          ) : null}

          <FormListHeading>{`Medications (${medications.length})`}</FormListHeading>

          {medications.length === 0 ? (
            <FormEmpty title="No medications listed in this plan." body="" />
          ) : (
            medications.map((med) => (
              <FormCard key={med.id}>
                <View style={st.medHead}>
                  <Text style={st.medName} maxFontSizeMultiplier={1.4}>
                    {med.medication_name}
                  </Text>
                  {med.is_daily || med.is_emergency_only ? (
                    <View style={st.tags}>
                      {med.is_daily ? <Pill tint="sky">Daily</Pill> : null}
                      {med.is_emergency_only ? <Pill tint="coral">Emergency Only</Pill> : null}
                    </View>
                  ) : null}
                </View>
                <InfoRow label="Dosage & Frequency" value={med.dosage_frequency} />
                <InfoRow label="Condition / Reason" value={med.condition_reason} />
                <InfoRow label="Prescribing Physician" value={med.physician_name} />
                <InfoRow label="Physician Phone" value={med.physician_phone} />
                <InfoRow label="Expiration Date" value={formatDateOnly(med.expiration_date)} />
              </FormCard>
            ))
          )}

          <AcknowledgmentCard title="Authorization" text={SIGNATURE_AUTHORIZATION} sig={sig} />
        </>
      )}
    </FormDetailScreen>
  );
}

const st = StyleSheet.create({
  medHead: { gap: 8, marginBottom: 8 },
  medName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 17, color: Garden.ink },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
