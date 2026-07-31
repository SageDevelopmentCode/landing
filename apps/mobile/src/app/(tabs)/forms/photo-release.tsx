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

const PHOTO_RELEASE_CONTRACT_ID = 5;

interface PhotoRelease {
  student_id: string;
  consent_level: string;
  created_at: string;
  updated_at: string;
}

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

// ---------------------------------------------------------------------------
// Static document content
// ---------------------------------------------------------------------------

const PHOTO_RELEASE_SECTIONS = [
  {
    heading: "Permission to Photograph, Record, and Use Likeness",
    paragraphs: [
      "1.1 — I, the undersigned parent or legal guardian, hereby grant Sage Field Private School (\"the School\") permission to photograph, video record, and otherwise capture images or likenesses of my child during school activities, programs, field trips, events, and related educational experiences.",
      "1.2 — I understand that these images and recordings may be used for educational, promotional, or informational purposes, including but not limited to the School's website, social media channels, newsletters, printed materials, grant applications, and community presentations.",
      "1.3 — This permission extends to the School's authorized staff, contractors, and volunteers acting in an official capacity for the School.",
    ],
  },
  {
    heading: "Scope of Use and Ownership",
    paragraphs: [
      "2.1 — All photographs, videos, and other media captured by Sage Field Private School staff or on behalf of the School are the property of Sage Field Private School.",
      "2.2 — The School may edit, crop, enhance, or otherwise modify media for use in materials described above.",
      "2.3 — The School will not sell images of students to third parties or use them in commercial advertising without separate, explicit written consent.",
    ],
  },
  {
    heading: "No Compensation and No Obligation to Use",
    paragraphs: [
      "3.1 — I understand that no compensation will be provided for the use of my child's likeness, and I waive any right to review or approve the final use of any image or recording before publication.",
      "3.2 — The School is under no obligation to use any image or recording and may choose not to publish or distribute specific materials at its discretion.",
    ],
  },
  {
    heading: "Release of Claims",
    paragraphs: [
      "4.1 — By signing this form, I release Sage Field Private School, its directors, staff, volunteers, and agents from any and all claims, liabilities, or causes of action arising out of or in connection with the use of photographs or recordings of my child as described herein.",
      "4.2 — This release applies to all current and future uses consistent with this agreement and shall remain in effect for the duration of my child's enrollment unless revoked in writing.",
    ],
  },
  {
    heading: "Duration and Revocation",
    paragraphs: [
      "6.1 — This consent is valid for the duration of my child's enrollment at Sage Field Private School. It may be revoked at any time by submitting a written notice to the director at sabrina@sagefield.co.",
      "6.2 — Revocation is effective upon receipt and applies to future use only. It does not apply retroactively to media already published or distributed.",
    ],
  },
  {
    heading: "Miscellaneous",
    paragraphs: [
      "7.1 — This agreement constitutes the entire understanding between the parties with respect to media consent and supersedes any prior verbal or written discussions on this subject.",
      "7.2 — If any provision of this agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.",
    ],
  },
];

const CONSENT_LEVEL_LABELS: Record<string, string> = {
  FULL: "Full Consent",
  LIMITED: "Limited Consent",
  NO: "No Consent",
};

const CONSENT_DESCRIPTIONS: Record<string, string> = {
  FULL: "My child's image and name may be used in all School materials, including website, social media, newsletters, print, and presentations.",
  LIMITED:
    "My child's image may be used in internal School materials only (e.g., newsletters sent to enrolled families). My child's image may NOT be used on public-facing platforms such as the website or social media.",
  NO: "I do not consent to any photography or video recording of my child for School use. My child will be excluded from group photos and media captures.",
};

const SECTION_ACKNOWLEDGMENTS: Record<number, string> = {
  1: "Consent level acknowledgment — I acknowledge my selected consent level for my child's participation in photography and video recording at Sage Field.",
  2: "By signing below, I confirm that I have read and understood this Photo, Video, and Media Release in its entirety. I acknowledge my selected consent level for my child's participation in photography and video recording at Sage Field Academy. I understand that this consent may be revoked at any time in writing and that revocation applies to future use only. I enter this agreement freely and on behalf of my child, and I have the legal authority to grant or withhold consent as described herein.",
};

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

export default function PhotoReleaseScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [data, setData] = useState<PhotoRelease | null>(null);
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

        const [consentResult, sigsResult] = await Promise.all([
          supabase
            .schema("parent_app")
            .from("student_photo_release_consent")
            .select("student_id, consent_level, created_at, updated_at")
            .eq("student_id", studentId)
            .single(),
          supabase
            .schema("parent_app")
            .from("enrollment_signatures")
            .select("id, section_id, printed_name, signed_at")
            .eq("student_id", studentId)
            .eq("contract_id", PHOTO_RELEASE_CONTRACT_ID)
            .order("section_id", { ascending: true }),
        ]);

        if (!cancelled) {
          if (consentResult.error) setError(consentResult.error.message);
          else {
            setData(consentResult.data);
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

  const consentLevel = data?.consent_level ?? "";
  const sigMap: Record<number, SignatureRow> = {};
  for (const sig of signatures) {
    sigMap[sig.section_id] = sig;
  }

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
          Photo Release
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={120} height={12} borderRadius={4} />
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
          {/* Legal sections */}
          {PHOTO_RELEASE_SECTIONS.map((section, idx) => (
            <View key={idx} style={styles.docSection}>
              <Text style={styles.docSectionTitle}>{section.heading}</Text>
              {section.paragraphs.map((p, pi) => (
                <Text key={pi} style={styles.sectionParagraph}>
                  {p}
                </Text>
              ))}
            </View>
          ))}

          {/* Consent level */}
          <View style={styles.consentCard}>
            <View style={styles.consentHeader}>
              <View
                style={[
                  styles.consentDot,
                  consentLevel === "NO" && styles.consentDotNone,
                  consentLevel === "LIMITED" && styles.consentDotLimited,
                ]}
              />
              <Text style={styles.consentLevel}>
                {CONSENT_LEVEL_LABELS[consentLevel] ?? consentLevel}
              </Text>
            </View>
            <Text style={styles.consentDescription}>
              {CONSENT_DESCRIPTIONS[consentLevel] ??
                `Consent level: ${consentLevel}`}
            </Text>
          </View>

          {/* Signature records */}
          {[1, 2].map((sectionNum) => {
            const sig = sigMap[sectionNum];
            return (
              <View key={sectionNum} style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>
                  Signature {sectionNum === 1 ? "(Initials)" : ""}
                </Text>
                <Text style={styles.acknowledgmentText}>
                  {SECTION_ACKNOWLEDGMENTS[sectionNum]}
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
          })}
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
  consentCard: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  consentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  consentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#047857",
  },
  consentDotNone: { backgroundColor: "#be123c" },
  consentDotLimited: { backgroundColor: "#b45309" },
  consentLevel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  consentDescription: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
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
