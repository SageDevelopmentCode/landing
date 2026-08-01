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

const HEALTH_FORM_CONTRACT_ID = 3;

const SIGNATURE_SECTIONS: Record<number, { title: string; text: string }> = {
  1: {
    title: "Over-the-Counter Medications Policy",
    text: "I understand and agree to Sage Field's Over-the-Counter Medications Policy as described above.",
  },
  2: {
    title: "Sunscreen, Lotion, and Topical Products",
    text: "I acknowledge Sage Field's policy on sunscreen, lotion, and topical products and give permission for staff to apply sunscreen to my child as needed during outdoor activities.",
  },
  3: {
    title: "Consent and Release",
    text: "I certify that all information provided in this form is true and accurate to the best of my knowledge. I authorize Sage Field Private School to provide first aid and emergency medical care for my child as necessary. I accept financial responsibility for any medical expenses incurred. I agree to notify Sage Field of any changes to my child's health information, emergency contacts, or insurance coverage.",
  },
};

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

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

function InfoRow({ label, value, signature }: { label: string; value: string | null; signature?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, signature && styles.infoValueSignature]}>{value || "—"}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {children}
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

export default function HealthFormScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [data, setData] = useState<HealthInfo | null>(null);
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

        const [healthResult, sigsResult] = await Promise.all([
          supabase
            .schema("parent_app")
            .from("student_health_info")
            .select("*")
            .eq("student_id", studentId)
            .single(),
          supabase
            .schema("parent_app")
            .from("enrollment_signatures")
            .select("id, section_id, printed_name, signed_at")
            .eq("student_id", studentId)
            .eq("contract_id", HEALTH_FORM_CONTRACT_ID)
            .order("section_id", { ascending: true }),
        ]);

        if (!cancelled) {
          if (healthResult.error) setError(healthResult.error.message);
          else {
            setData(healthResult.data);
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
          Health Information
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={100} height={12} borderRadius={4} />
              <SkeletonBox width="80%" height={14} borderRadius={4} />
              <SkeletonBox width="60%" height={14} borderRadius={4} />
            </View>
          ))}
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
          <SectionCard title="In-State Emergency Contact">
            <InfoRow label="Name" value={data.in_state_contact_name} />
            <InfoRow
              label="Relationship"
              value={data.in_state_contact_relation}
            />
            <InfoRow label="Phone" value={data.in_state_contact_phone} />
          </SectionCard>

          <SectionCard title="Out-of-State Emergency Contact">
            <InfoRow label="Name" value={data.out_of_state_contact_name} />
            <InfoRow
              label="Relationship"
              value={data.out_of_state_contact_relation}
            />
            <InfoRow label="Phone" value={data.out_of_state_contact_phone} />
          </SectionCard>

          <SectionCard title="Physician & Hospital">
            <InfoRow label="Physician" value={data.physician_name} />
            <InfoRow label="Phone" value={data.physician_phone} />
            <InfoRow label="Clinic / Practice" value={data.clinic_name} />
            <InfoRow label="Preferred Hospital" value={data.preferred_hospital} />
          </SectionCard>

          <SectionCard title="Insurance">
            <InfoRow label="Provider" value={data.insurance_provider} />
            <InfoRow label="Policy #" value={data.policy_number} />
            <InfoRow label="Group #" value={data.group_number} />
          </SectionCard>

          <SectionCard title="Medical">
            <InfoRow label="Health Conditions" value={data.health_conditions} />
            <InfoRow
              label="Immunization Status"
              value={data.immunization_status}
            />
            <InfoRow
              label="Ongoing Care"
              value={
                data.ongoing_care === true
                  ? data.ongoing_care_description ?? "Yes"
                  : data.ongoing_care === false
                    ? "No"
                    : "—"
              }
            />
            <InfoRow
              label="Emergency Medication"
              value={
                data.emergency_medication_required === true
                  ? data.emergency_medication_description ?? "Yes"
                  : data.emergency_medication_required === false
                    ? "No"
                    : "—"
              }
            />
          </SectionCard>

          {/* Signature acknowledgments */}
          {signatures.map((sig) => {
            const section = SIGNATURE_SECTIONS[sig.section_id];
            if (!section) return null;
            return (
              <View key={sig.id} style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>{section.title}</Text>
                <Text style={styles.acknowledgmentText}>{section.text}</Text>
                <View style={styles.signatureDivider} />
                <InfoRow label="Signed By" value={sig.printed_name} signature />
                <InfoRow
                  label="Date Signed"
                  value={new Date(sig.signed_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              </View>
            );
          })}
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
