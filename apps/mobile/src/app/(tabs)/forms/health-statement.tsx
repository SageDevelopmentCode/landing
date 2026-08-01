import { Brand, FontFamilies, floatingTabBarStyle } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HEALTH_STATEMENT_CONTRACT_ID = 8;

interface HealthStatement {
  id: string;
  option_type: string;
  created_at: string | null;
  updated_at: string | null;
}

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

// ---------------------------------------------------------------------------
// Static content
// ---------------------------------------------------------------------------

const OPTION_TYPE_CONTENT: Record<
  string,
  { label: string; optionLabel: string; text: string }
> = {
  professional: {
    label: "Health Care Professional Examination",
    optionLabel:
      "My child has been examined by a health care professional within the past year",
    text: "I hereby certify that my child has been examined by a licensed health care professional within the past year and is in satisfactory health to attend school. I agree to have the Health Care Statement form signed by my child's health care professional and email the completed form to sabrina@sagefield.co within the current school year.",
  },
  religious: {
    label: "Religious Exemption",
    optionLabel:
      "Religious exemption — I object to physical examination of my child on religious grounds",
    text: "I object to the physical examination of my child on religious grounds. I understand that I must provide a signed, dated, and notarized affidavit stating my religious objection to such examination. This affidavit must be kept on file with Sage Field Private School.",
  },
};

const SIGNATURE_ACKNOWLEDGMENT =
  "By signing below, I certify that the information provided is accurate and complete to the best of my knowledge, and I authorize Sage Field Private School to maintain this health information on file for my child.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function InfoRow({ label, value, signature }: { label: string; value: string | null; signature?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, signature && styles.infoValueSignature]}>{value || "—"}</Text>
    </View>
  );
}

function CompletedBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="checkmark-circle" size={12} color="#047857" />
      <Text style={styles.badgeText}>Completed</Text>
    </View>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HealthStatementScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [data, setData] = useState<HealthStatement | null>(null);
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
      };
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        setError(null);

        const [statementResult, sigsResult] = await Promise.all([
          supabase
            .schema("parent_app")
            .from("student_health_statement")
            .select("id, option_type, created_at, updated_at")
            .eq("student_id", studentId)
            .single(),
          supabase
            .schema("parent_app")
            .from("enrollment_signatures")
            .select("id, section_id, printed_name, signed_at")
            .eq("student_id", studentId)
            .eq("contract_id", HEALTH_STATEMENT_CONTRACT_ID)
            .order("section_id", { ascending: true }),
        ]);

        if (!cancelled) {
          if (statementResult.error) setError(statementResult.error.message);
          else {
            setData(statementResult.data);
            setSignatures(sigsResult.data ?? []);
          }
          setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [studentId]),
  );

  const content = data ? OPTION_TYPE_CONTENT[data.option_type] : null;
  const sig = signatures[0] ?? null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.stickyHeader}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={Brand.sage700} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Health Statement
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCard}>
            <SkeletonBox width={110} height={12} borderRadius={4} />
            <SkeletonBox width="85%" height={14} borderRadius={4} />
            <SkeletonBox width="70%" height={14} borderRadius={4} />
          </View>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      ) : data ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Statement type card */}
          <View style={styles.statementCard}>
            <View style={styles.statementHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={Brand.sage700}
              />
              <Text style={styles.statementLabel}>
                {content?.label ?? data.option_type}
              </Text>
            </View>
            <Text style={styles.optionLabel}>
              {content?.optionLabel ?? data.option_type}
            </Text>
          </View>

          {/* Statement text */}
          {content && (
            <View style={styles.docSection}>
              <Text style={styles.docSectionTitle}>Statement</Text>
              <Text style={styles.sectionParagraph}>{content.text}</Text>
            </View>
          )}

          {/* Signature record */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Certification</Text>
            <Text style={styles.acknowledgmentText}>
              {SIGNATURE_ACKNOWLEDGMENT}
            </Text>
            {sig && (
              <>
                <View style={styles.signatureDivider} />
                <InfoRow label="Signed By" value={sig.printed_name} signature />
                <InfoRow
                  label="Date Signed"
                  value={formatDate(sig.signed_at)}
                />
              </>
            )}
          </View>

          {/* Record details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Record Details</Text>
            <InfoRow label="Statement Type" value={data.option_type} />
            <InfoRow label="Submitted" value={formatDate(data.created_at)} />
            <InfoRow label="Last Updated" value={formatDate(data.updated_at)} />
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  pressed: { opacity: 0.5 },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: Brand.sage700,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#047857",
  },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  statementCard: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#C8DFCB",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statementLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    flex: 1,
  },
  optionLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },
  docSection: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  docSectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionParagraph: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 21,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  sectionCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 8,
  },
  acknowledgmentText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 21,
    fontStyle: "italic",
  },
  signatureDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 2,
  },
  infoLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#4b5563",
  },
  infoValue: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  infoValueSignature: {
    fontFamily: FontFamilies.signature,
    fontSize: 22,
    color: Brand.sage800,
    lineHeight: 28,
  },
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffe4e6",
    borderRadius: 12,
    padding: 16,
  },
  errorText: { fontFamily: FontFamilies.body, fontSize: 14, color: "#be123c" },
});
