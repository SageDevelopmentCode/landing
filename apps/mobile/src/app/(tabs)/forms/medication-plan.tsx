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

const MEDICATION_PLAN_CONTRACT_ID = 4;

const SIGNATURE_AUTHORIZATION =
  "I hereby authorize Sage Field Private School staff to administer the medication(s) listed above to my child in accordance with the instructions provided. I agree to provide all medications in their original labeled container and to update this form whenever changes occur. I understand that Sage Field staff are not medical professionals and will administer medication only as directed by this plan. I release Sage Field Private School from liability for adverse reactions resulting from the administration of medication in strict compliance with the instructions provided herein.";

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

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

export default function MedicationPlanScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<MedicationPlan | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
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

        const [planResult, medsResult, sigsResult] = await Promise.all([
          supabase
            .schema("parent_app")
            .from("student_medication_plan")
            .select("id, special_instructions, emergency_procedure")
            .eq("student_id", studentId)
            .single(),
          supabase
            .schema("parent_app")
            .from("student_medications")
            .select(
              "id, medication_name, dosage_frequency, condition_reason, is_daily, is_emergency_only, physician_name, physician_phone, expiration_date",
            )
            .eq("student_id", studentId)
            .order("sort_order", { ascending: true }),
          supabase
            .schema("parent_app")
            .from("enrollment_signatures")
            .select("id, section_id, printed_name, signed_at")
            .eq("student_id", studentId)
            .eq("contract_id", MEDICATION_PLAN_CONTRACT_ID)
            .order("section_id", { ascending: true }),
        ]);

        if (!cancelled) {
          if (planResult.error) {
            setError(planResult.error.message);
          } else {
            setPlan(planResult.data);
            setMedications(medsResult.data ?? []);
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
          Medication Plan
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={120} height={12} borderRadius={4} />
              <SkeletonBox width="75%" height={14} borderRadius={4} />
              <SkeletonBox width="55%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      ) : plan ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {(plan.special_instructions || plan.emergency_procedure) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Plan Details</Text>
              {plan.special_instructions && (
                <InfoRow
                  label="Special Instructions"
                  value={plan.special_instructions}
                />
              )}
              {plan.emergency_procedure && (
                <InfoRow
                  label="Emergency Procedure"
                  value={plan.emergency_procedure}
                />
              )}
            </View>
          )}

          <Text style={styles.medicationsHeading}>
            Medications ({medications.length})
          </Text>

          {medications.length === 0 ? (
            <View style={styles.neutralCard}>
              <Text style={styles.neutralCardBody}>
                No medications listed in this plan.
              </Text>
            </View>
          ) : medications.map((med) => (
              <View key={med.id} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationName}>
                    {med.medication_name}
                  </Text>
                  <View style={styles.tagRow}>
                    {med.is_daily && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>Daily</Text>
                      </View>
                    )}
                    {med.is_emergency_only && (
                      <View style={[styles.tag, styles.tagWarning]}>
                        <Text style={[styles.tagText, styles.tagTextWarning]}>
                          Emergency Only
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <InfoRow
                  label="Dosage & Frequency"
                  value={med.dosage_frequency}
                />
                <InfoRow label="Condition / Reason" value={med.condition_reason} />
                <InfoRow
                  label="Prescribing Physician"
                  value={med.physician_name}
                />
                <InfoRow
                  label="Physician Phone"
                  value={med.physician_phone}
                />
                <InfoRow
                  label="Expiration Date"
                  value={formatDate(med.expiration_date)}
                />
              </View>
            ))
          }

          {/* Authorization and signature */}
          {(() => {
            const sig = signatures[0] ?? null;
            return (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>Authorization</Text>
                <Text style={styles.acknowledgmentText}>
                  {SIGNATURE_AUTHORIZATION}
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
            );
          })()}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

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
    marginBottom: 4,
  },
  medicationsHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
    paddingHorizontal: 2,
  },
  medicationCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  medicationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  medicationName: {
    flex: 1,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  tagRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tag: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#C8DFCB",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
  },
  tagWarning: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  tagTextWarning: { color: "#b45309" },
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
  neutralCard: {
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
  },
  neutralCardBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
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
