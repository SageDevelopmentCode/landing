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

const ASSUMPTION_OF_RISK_CONTRACT_ID = 6;

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

// ---------------------------------------------------------------------------
// Static document content
// ---------------------------------------------------------------------------

const AOR_SECTIONS = [
  {
    heading: "Acknowledgment of Risks",
    paragraphs: [
      "I, the undersigned parent or legal guardian, acknowledge that participation in the educational, recreational, and extracurricular activities offered by Sage Field Private School \"School\" involves inherent risks. These risks may include, but are not limited to, physical injury from falls, collisions, equipment use, or other participants; exposure to communicable illness; emotional or psychological stress; allergic reactions; and other unforeseen hazards that may arise during normal school activities, field trips, outdoor education, and community events.",
      "I understand that no environment can be made entirely risk-free and that Sage Field Private School, while committed to maintaining a safe and supportive environment, cannot guarantee complete freedom from injury or illness.",
    ],
  },
  {
    heading: "Assumption of Risk",
    paragraphs: [
      "With full knowledge of the risks described above, I voluntarily enroll my child in Sage Field Private School and authorize their participation in all school-sanctioned activities. I freely and expressly assume all risks associated with such participation, whether known or unknown, foreseeable or unforeseeable, including the risk of serious injury, permanent disability, or death.",
    ],
  },
  {
    heading: "Release of Liability and Indemnification",
    paragraphs: [
      "In consideration of my child's enrollment and participation, I, on behalf of myself, my child, and our heirs, successors, and legal representatives, hereby release, waive, discharge, and hold harmless Sage Field Academy, its officers, directors, employees, volunteers, independent contractors, and agents (collectively, \"Released Parties\") from any and all claims, demands, damages, liabilities, actions, or causes of action — whether arising from negligence or otherwise — that may result from my child's participation in school activities.",
      "I further agree to indemnify and hold harmless the Released Parties from any claims brought by or on behalf of my child arising out of or related to their participation in school activities, including any claims arising from the negligence of the Released Parties, to the fullest extent permitted by applicable law.",
    ],
  },
  {
    heading: "Scope and Limitations",
    paragraphs: [
      "This Agreement applies to all activities conducted under the auspices of Sage Field Private School, including but not limited to: on-campus instruction and activities, field trips and off-site excursions, outdoor and nature-based education, school-sponsored community events, and any transportation provided by or arranged by the School.",
      "Nothing in this Agreement shall be construed to release any party from liability arising from willful or grossly negligent conduct, or from any liability that cannot be released as a matter of law.",
    ],
  },
  {
    heading: "Severability",
    paragraphs: [
      "If any provision of this Agreement is found to be unenforceable or invalid under applicable law, such provision shall be modified to the minimum extent necessary to make it enforceable, or, if modification is not possible, shall be severed from this Agreement, while the remaining provisions shall continue in full force and effect. This Agreement constitutes the entire understanding between the parties regarding the assumption of risk and release of liability for the student's participation at Sage Field Private School.",
    ],
  },
];

const SIGNATURE_ACKNOWLEDGMENT =
  "By signing below, I confirm that I have read and fully understand this Assumption of Risk and Liability Release. I acknowledge that I am signing this Agreement freely and voluntarily, without any duress or undue influence, and that I have had the opportunity to seek independent legal counsel if desired. I represent that I have the legal authority to execute this Agreement on behalf of my child.";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AssumptionOfRiskScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
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
        const { data, error: err } = await supabase
          .schema("parent_app")
          .from("enrollment_signatures")
          .select("id, section_id, printed_name, signed_at")
          .eq("student_id", studentId)
          .eq("contract_id", ASSUMPTION_OF_RISK_CONTRACT_ID)
          .order("section_id", { ascending: true });
        if (!cancelled) {
          if (err) setError(err.message);
          else setSignatures(data ?? []);
          setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [studentId]),
  );

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
          Assumption of Risk
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={130} height={12} borderRadius={4} />
              <SkeletonBox width="90%" height={14} borderRadius={4} />
              <SkeletonBox width="75%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={Brand.sage700}
            />
            <Text style={styles.infoBoxText}>
              This form acknowledges understanding and acceptance of inherent
              risks associated with program activities.
            </Text>
          </View>

          {/* Legal sections */}
          {AOR_SECTIONS.map((section, idx) => (
            <View key={idx} style={styles.docSection}>
              <Text style={styles.docSectionTitle}>{section.heading}</Text>
              {section.paragraphs.map((p, pi) => (
                <Text key={pi} style={styles.sectionParagraph}>
                  {p}
                </Text>
              ))}
            </View>
          ))}

          {/* Signature record */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Releasor Acknowledgment</Text>
            <Text style={styles.acknowledgmentText}>
              {SIGNATURE_ACKNOWLEDGMENT}
            </Text>
            {sig ? (
              <>
                <View style={styles.signatureDivider} />
                <InfoRow label="Signed By" value={sig.printed_name} signature />
                <InfoRow label="Date Signed" value={formatDate(sig.signed_at)} />
              </>
            ) : (
              <View style={[styles.signatureDivider, { marginBottom: 0 }]} />
            )}
          </View>
        </ScrollView>
      )}
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
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F2F7F3",
    borderWidth: 1,
    borderColor: "#C8DFCB",
    borderRadius: 12,
    padding: 12,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
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
