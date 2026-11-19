// Health Information Form / Health Statement (contract 8) — read-only Garden viewer.
import { Display, Garden, GardenFonts, GardenTints } from "@/components/garden";
import {
  HEALTH_STATEMENT_CONTRACT_ID,
  OPTION_TYPE_CONTENT,
  SIGNATURE_ACKNOWLEDGMENT,
} from "@/features/forms/content/healthStatement";
import {
  fetchSignatures,
  formatDateTime,
  MissingParamsError,
  unwrap,
} from "@/features/forms/formsUtils";
import {
  AcknowledgmentCard,
  FormCard,
  FormDetailScreen,
  InfoRow,
  LegalSection,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

interface HealthStatement {
  id: string;
  option_type: string;
  created_at: string | null;
  updated_at: string | null;
}

export default function HealthStatementScreen() {
  const { studentId, userId } = useLocalSearchParams<{ studentId: string; userId: string }>();
  useHideTabBar();

  const detail = useFormDetail(
    studentId && userId ? `${userId}:${studentId}` : null,
    async () => {
      if (!studentId || !userId) throw new MissingParamsError();
      const [statementRes, sigs] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_health_statement")
          .select("id, option_type, created_at, updated_at")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        fetchSignatures(studentId, userId, HEALTH_STATEMENT_CONTRACT_ID),
      ]);
      return { statement: unwrap(statementRes) as HealthStatement | null, sig: sigs[0] ?? null };
    },
    "parent-forms-health-statement",
  );

  return (
    <FormDetailScreen
      title="Health Statement"
      detail={detail}
      skeletonCards={2}
      isEmpty={(d) => !d.statement}
    >
      {({ statement, sig }, fb) => {
        if (!statement) return null;
        const content = OPTION_TYPE_CONTENT[statement.option_type] ?? null;
        return (
          <>
            {/* Statement type card */}
            <View style={st.typeCard}>
              <View style={st.typeHead}>
                <View style={st.typeIcon}>
                  <Ionicons name="document-text-outline" size={18} color={GardenTints.sage.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Display size={19}>{content?.label ?? statement.option_type}</Display>
                </View>
              </View>
              <Text style={st.optionLabel} maxFontSizeMultiplier={1.4}>
                {content?.optionLabel ?? statement.option_type}
              </Text>
            </View>

            {content ? (
              <LegalSection
                title="Statement"
                section={{ paragraphs: [content.text] }}
                onEmail={fb.openEmail}
              />
            ) : null}

            <AcknowledgmentCard title="Certification" text={SIGNATURE_ACKNOWLEDGMENT} sig={sig} />

            <FormCard title="Record Details">
              <InfoRow label="Statement Type" value={content?.label ?? statement.option_type} />
              <InfoRow label="Submitted" value={formatDateTime(statement.created_at)} />
              <InfoRow label="Last Updated" value={formatDateTime(statement.updated_at)} />
            </FormCard>
          </>
        );
      }}
    </FormDetailScreen>
  );
}

const st = StyleSheet.create({
  typeCard: {
    backgroundColor: GardenTints.sage.bg,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  typeHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15,
    color: Garden.sageDeep,
  },
});
