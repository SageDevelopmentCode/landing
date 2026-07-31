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

const AUTHORIZED_PICKUP_CONTRACT_ID = 7;

const SIGNATURE_AUTHORIZATION =
  "I, the undersigned parent or legal guardian, hereby authorize the individual(s) listed above to pick up my child from Sage Field LLC. I understand that school staff will verify the identity of any pickup person using a valid government-issued photo ID before releasing my child.\n\nI accept responsibility for notifying Sage Field LLC of any changes to this authorization. I understand that my child will not be released to any individual not listed on this form or on the emergency contact form, unless I provide explicit written or verbal authorization at the time of pickup.";

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

interface PickupPlan {
  id: string;
  date_of_request: string | null;
  effective_until: string | null;
}

interface PickupPerson {
  id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  dl_state_id_number: string | null;
  vehicle_info: string | null;
  license_plate_state: string | null;
  sort_order: number | null;
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

export default function AuthorizedPickupScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<PickupPlan | null>(null);
  const [persons, setPersons] = useState<PickupPerson[]>([]);
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

        const [planResult, personsResult, sigsResult] = await Promise.all([
          supabase
            .schema("parent_app")
            .from("student_authorized_pickup_plan")
            .select("id, date_of_request, effective_until")
            .eq("student_id", studentId)
            .single(),
          supabase
            .schema("parent_app")
            .from("student_authorized_pickup_persons")
            .select(
              "id, full_name, relationship, phone, email, dl_state_id_number, vehicle_info, license_plate_state, sort_order",
            )
            .eq("student_id", studentId)
            .order("sort_order", { ascending: true }),
          supabase
            .schema("parent_app")
            .from("enrollment_signatures")
            .select("id, section_id, printed_name, signed_at")
            .eq("student_id", studentId)
            .eq("contract_id", AUTHORIZED_PICKUP_CONTRACT_ID)
            .order("section_id", { ascending: true }),
        ]);

        if (!cancelled) {
          if (planResult.error) {
            setError(planResult.error.message);
          } else {
            setPlan(planResult.data);
            setPersons(personsResult.data ?? []);
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
          Authorized Pickup
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={130} height={14} borderRadius={4} />
              <SkeletonBox width="65%" height={12} borderRadius={4} />
              <SkeletonBox width="45%" height={12} borderRadius={4} />
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
          {(plan.date_of_request || plan.effective_until) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Plan Info</Text>
              <InfoRow
                label="Date of Request"
                value={formatDate(plan.date_of_request)}
              />
              <InfoRow
                label="Effective Until"
                value={formatDate(plan.effective_until)}
              />
            </View>
          )}

          <Text style={styles.sectionHeading}>
            Authorized Persons ({persons.length})
          </Text>

          {persons.length === 0 ? (
            <View style={styles.neutralCard}>
              <Text style={styles.neutralCardBody}>
                No authorized pickup persons on file.
              </Text>
            </View>
          ) : persons.map((person) => (
              <View key={person.id} style={styles.personCard}>
                <View style={styles.personHeader}>
                  <View style={styles.personAvatar}>
                    <Ionicons name="person" size={18} color={Brand.sage700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{person.full_name}</Text>
                    {person.relationship && (
                      <Text style={styles.personRelationship}>
                        {person.relationship}
                      </Text>
                    )}
                  </View>
                </View>
                <InfoRow label="Phone" value={person.phone} />
                <InfoRow label="Email" value={person.email} />
                <InfoRow label="ID Number" value={person.dl_state_id_number} />
                <InfoRow label="Vehicle Info" value={person.vehicle_info} />
                {person.license_plate_state && (
                  <InfoRow
                    label="License Plate State"
                    value={person.license_plate_state}
                  />
                )}
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
  sectionHeading: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
    paddingHorizontal: 2,
  },
  personCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  personName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  personRelationship: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
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
