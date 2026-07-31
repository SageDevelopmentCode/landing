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

interface SignatureRow {
  id: string;
  section_id: number;
  printed_name: string;
  signed_at: string;
}

interface SectionContent {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  afterBullets?: string[];
}

// ---------------------------------------------------------------------------
// Static contract content
// ---------------------------------------------------------------------------

const CONTRACT_TITLES: Record<number, string> = {
  1: "Program Description, Parent Responsibilities & Key Policies",
  2: "Community Agreement for Families and Staff",
};

const CONTRACT_CONTENT: Record<number, SectionContent[]> = {
  1: [
    {
      heading: "What Sage Field Is",
      paragraphs: [
        "Sage Field Private School is a outdoor-based micro-school offering small-group, project-driven learning for children ages 4-11. Our program integrates academic instruction with hands-on exploration, outdoor education, and community-centered learning.",
        "Sage Field is not a daycare or a traditional school. We operate as a private school. Parents who enroll their children agree to embrace our philosophy, structure, and community expectations as described in this document.",
      ],
    },
    {
      heading: "Program Schedule and Attendance",
      paragraphs: [
        "The program runs Monday through Thursday, with optional Friday enrichment sessions available for an additional fee. Core program hours are 9:00 AM – 3:00 PM. Drop-off begins at 8:45 AM; students must be picked up no later than 3:15 PM unless enrolled in extended care.",
      ],
      bullets: ["Friday sessions are optional add-ons and billed separately."],
    },
    {
      heading: "Tuition, Fees, and Payment",
      paragraphs: [
        "Tuition is due on the 1st of each month. A grace period of three (3) calendar days is provided. Accounts not paid by the 4th of the month will incur a $50 late fee.",
        "Monthly tuition is a fixed, flat rate for the school year and is not pro-rated under any circumstances. This includes months with school holidays, scheduled breaks, shortened weeks, or months in which the program begins or ends mid-month (such as August or June). The monthly payment obligation remains the same regardless of the number of school days in a given month.",
      ],
      bullets: [
        "Tuition is non-refundable.",
        "Registration fees are non-refundable under any circumstances.",
        "If an account remains unpaid for more than 30 days, your child's enrollment may be suspended until the balance is resolved.",
        "We accept payment via ACH bank transfer (0.8% fee, max $5), check, or credit card (2.9% + $0.30 processing fee applies to card payments).",
      ],
      afterBullets: [
        "Families experiencing financial hardship should contact the director to discuss payment plan options before a payment becomes overdue.",
      ],
    },
    {
      heading: "Withdrawal and Enrollment Changes",
      paragraphs: [
        "If you need to withdraw your child or change their enrollment, we require 30 days written notice. Tuition for the contracted commitment is still owed in full, regardless of attendance.",
        "To withdraw, email the director at sabrina@sagefield.co with your child's name, your name, and the intended last day of enrollment.",
      ],
      bullets: [
        "Withdrawing mid-contractual time does not entitle a family to a prorated refund.",
        "Re-enrollment after withdrawal is subject to availability and is not guaranteed.",
      ],
    },
    {
      heading: "Health, Illness, and Medication Policies",
      paragraphs: [
        "The health and safety of our entire community is a shared responsibility. Please keep your child home if they are sick.",
      ],
      bullets: [
        "Children must be fever-free (below 100.4°F) for at least 24 hours without fever-reducing medication before returning.",
        "Children with vomiting or diarrhea must remain home for 24 hours after the last episode.",
        "If a child becomes ill during the day, a parent or emergency contact will be called and the child must be picked up within one hour.",
        "Sage Field staff cannot administer prescription medication without a completed Medication Authorization Form on file.",
        "Emergency medication (e.g., EpiPens, inhalers) must be provided by the family and kept at the program site. An Emergency Medication Plan must be on file before the child's first day.",
      ],
      afterBullets: [
        "All students must have current immunization records on file. Exemptions require written documentation in accordance with applicable state law.",
      ],
    },
    {
      heading: "Outdoor Learning and Physical Activity",
      paragraphs: [
        "Outdoor education is a core part of the Sage Field experience. Students spend significant time outside in all weather conditions except for lightning, extreme heat (above 100°F), or conditions deemed unsafe by staff.",
      ],
      bullets: [
        "Please dress your child in layers and appropriate footwear daily.",
        "Sage Field is not liable for normal wear and tear on clothing or minor scrapes and bruises that occur during typical outdoor play and learning activities.",
        "Students may engage in hiking, gardening, building projects, and free outdoor exploration as part of the curriculum.",
      ],
      afterBullets: [
        "By enrolling your child, you acknowledge and accept that outdoor and nature-based activities carry inherent physical risks, and that Sage Field takes reasonable precautions to mitigate those risks.",
      ],
    },
    {
      heading: "Community Behavior Standards",
      paragraphs: [
        "Sage Field is built on respect — for people, for the natural world, and for the learning process. We ask all students and families to uphold these values.",
      ],
      bullets: [
        "Physical aggression, persistent bullying, or deliberate destruction of property will result in a restorative conversation with the child and a parent meeting. Repeated incidents may result in suspension or disenrollment.",
        "Students are expected to care for shared materials and outdoor spaces.",
        "Parents and caregivers are also expected to model respectful communication with staff and other families — in person and online.",
      ],
      afterBullets: [
        "Sage Field reserves the right to disenroll a student whose behavior, or whose family's behavior, is consistently disruptive to the community or unsafe for staff or other students. In such cases, a two-week notice will be given except in cases of immediate safety concerns.",
      ],
    },
    {
      heading: "Drop-Off, Pick-Up, and Authorized Persons",
      paragraphs: [
        "Student safety is our top priority. Only adults listed as authorized pickup persons on file may pick up your child.",
      ],
      bullets: [
        "Staff will ask for photo ID from any adult they do not recognize.",
        "If someone not on the authorized list arrives, the child will not be released until a parent or guardian on file gives explicit verbal confirmation.",
        "Late pick-up (after 3:15 PM) will be automatically enrolled into After Care. They will be charged the drop-in after-care rate in the next billing cycle.",
        "If you need to permanently or temporarily add or remove an authorized pickup person, submit a written update to the director.",
      ],
    },
    {
      heading: "Photo, Media, and Privacy",
      paragraphs: [
        "Sage Field may photograph or video students during program activities for use in our website, social media, newsletters, and other program materials. A separate Photo Release Form is required for this consent.",
      ],
      bullets: [
        "If you do not sign the Photo Release, your child will not be photographed or filmed for any published materials.",
        "Parents may not photograph or video other families' children without explicit consent from those families.",
        "All student records and personal information are kept confidential and will not be shared with third parties without your consent, except as required by law.",
      ],
    },
    {
      heading: "Emergency Procedures",
      paragraphs: [
        "In the event of a medical emergency, Sage Field staff will call 911 immediately and then contact the parent or guardian. We will not wait for parental approval before calling emergency services.",
      ],
      bullets: [
        "In the event of evacuation (fire, gas leak, etc.), students will be moved to the designated assembly area and parents will be notified as soon as it is safe to do so.",
        "Please ensure your emergency contact information is always current. Update it in writing if it changes.",
        "Sage Field maintains a basic first aid kit on-site at all times. At least one staff member with current first aid and CPR certification is present during program hours.",
      ],
    },
    {
      heading: "Parent Participation and Communication",
      paragraphs: [
        "Sage Field is a community — parent involvement makes us stronger. We ask families to engage actively and respectfully.",
      ],
      bullets: [
        "Respond to important staff communications within 72 hours on school days.",
        "Read newsletters and updates sent through our primary communication channel (currently email).",
        "If you have concerns about your child's experience, please bring them to the director directly rather than discussing them with other families first.",
      ],
      afterBullets: [
        "We are committed to transparent, honest communication with families. We ask for the same in return.",
      ],
    },
    {
      heading: "Program Changes and Director Authority",
      paragraphs: [
        "Sage Field Private School reserves the right to update program schedules, policies, staff, and fees with reasonable notice (generally 30 days, except in cases of health or safety necessity).",
        "The director has final authority over all enrollment, curriculum, staffing, and behavior decisions. Families who repeatedly challenge staff authority or undermine the program culture may be asked to find alternative educational options for their child.",
      ],
    },
    {
      heading: "Final Acknowledgment",
      paragraphs: [
        "By signing each section of this document, I confirm that I have read, understood, and agree to the terms described in that section. I understand that this agreement governs my child's enrollment at Sage Field Private School and that violations of these terms may result in consequences up to and including disenrollment.",
        "I enter this agreement freely and understand that Sage Field Private School is acting in good faith to provide a safe, enriching, and community-centered learning environment for my child.",
      ],
    },
  ],
  2: [
    {
      heading: "Core Community Commitments",
      paragraphs: [
        "As a member of the Sage Field Private School community — whether as a family or staff member — I commit to upholding the following values and behaviors that make our community safe, respectful, and thriving:",
      ],
      bullets: [
        "Respect for All People: I will treat every child, parent, caregiver, and staff member with dignity and respect — regardless of background, ability, race, religion, family structure, or any other characteristic. I will not make derogatory remarks, engage in exclusionary behavior, or tolerate discrimination of any kind.",
        "Honest and Constructive Communication: I will communicate concerns directly, honestly, and respectfully. I will not gossip about other families or staff, spread rumors, or discuss community conflicts in front of children. If I have a concern, I will bring it to the appropriate person (staff member or director) through the proper channels.",
        "Support for Children's Learning and Wellbeing: I understand that children learn best in emotionally safe environments. I will not undermine staff authority, second-guess educators in front of children, or create tension that disrupts the learning environment. I trust the Sage Field team to make thoughtful educational decisions.",
        "Care for Shared Spaces and Property: I will model and encourage responsible care for all shared materials, outdoor spaces, and facilities. I will not damage, misuse, or allow my child to damage school property.",
        "Digital and Social Media Conduct: I will not post negative, disparaging, or identifying content about Sage Field staff, families, or children on social media or in online groups. If I have concerns or feedback, I will raise them directly with the director — not publicly online.",
        "Active Community Participation: I understand that Sage Field is a community — not just a service provider. I will show up, engage, and contribute to a positive culture. This includes volunteering when asked, attending community events, and supporting other families when I can.",
      ],
    },
    {
      heading: "Unacceptable Behaviors (Zero Tolerance)",
      paragraphs: [
        "The following behaviors are not acceptable in our community and may result in immediate disenrollment or termination of the staff relationship:",
      ],
      bullets: [
        "Physical aggression or threats toward any child, parent, or staff member",
        "Verbal abuse, harassment, or intimidation of staff or families",
        "Discrimination or hate speech of any kind",
        "Deliberate damage to school property",
        "Sharing private information about other families or children without consent",
        "Attempting to organize other families against staff or school leadership",
        "Persistent violations of this agreement after being formally warned",
      ],
    },
    {
      heading: "Conflict Resolution Process",
      paragraphs: [
        "We recognize that disagreements will sometimes arise. When they do, we ask that all parties follow this process:",
      ],
      bullets: [
        "Step 1 — Direct Conversation: Address the issue directly and respectfully with the person involved, when safe and appropriate to do so.",
        "Step 2 — Staff Involvement: If the issue involves a child's experience or classroom dynamic, bring it to the lead educator first.",
        "Step 3 — Director Review: If the issue is unresolved or involves a staff member, bring it to the director in writing or by requesting a meeting.",
        "Step 4 — Formal Resolution: The director will review the situation, speak with all involved parties, and make a final decision. That decision is binding.",
      ],
      afterBullets: [
        "Bypassing this process — for example, by confronting another parent or staff member publicly or escalating directly to legal threats without first attempting resolution — is itself a violation of this agreement.",
      ],
    },
    {
      heading: "Acknowledgment and Agreement",
      paragraphs: [
        "By signing this agreement, I acknowledge that I have read, understood, and agree to uphold the community standards described above. I understand that my participation in the Sage Field Private School community — as a family or staff member — comes with a shared responsibility to protect and nurture the culture we are building together. I agree that violations of this agreement may result in consequences up to and including disenrollment of my child or termination of my employment or contractor relationship with Sage Field Private School.",
      ],
    },
  ],
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

export default function ContractScreen() {
  const { studentId, contractId } = useLocalSearchParams<{
    studentId: string;
    contractId: string;
  }>();
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
          .eq("contract_id", Number(contractId))
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
    }, [studentId, contractId]),
  );

  const contractNum = Number(contractId);
  const sections = CONTRACT_CONTENT[contractNum];
  const title = CONTRACT_TITLES[contractNum] ?? `Contract #${contractId}`;

  // Build a lookup map for signature by section_id
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
          {title}
        </Text>
        <CompletedBadge />
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={120} height={12} borderRadius={4} />
              <SkeletonBox width="70%" height={14} borderRadius={4} />
              <SkeletonBox width="50%" height={14} borderRadius={4} />
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
              name="document-text-outline"
              size={20}
              color={Brand.sage700}
            />
            <Text style={styles.infoBoxText}>
              This contract was signed electronically. Each section shows its
              content and your signature record.
            </Text>
          </View>

          {sections ? (
            sections.map((section, idx) => {
              const sectionNum = idx + 1;
              const sig = sigMap[sectionNum];
              return (
                <View key={sectionNum} style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>
                    Section {sectionNum} — {section.heading}
                  </Text>
                  {section.paragraphs.map((p, pi) => (
                    <Text key={pi} style={styles.sectionParagraph}>
                      {p}
                    </Text>
                  ))}
                  {section.bullets?.map((b, bi) => (
                    <Text key={bi} style={styles.sectionBullet}>
                      {"• "}
                      {b}
                    </Text>
                  ))}
                  {section.afterBullets?.map((a, ai) => (
                    <Text key={ai} style={styles.sectionParagraph}>
                      {a}
                    </Text>
                  ))}
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
            })
          ) : (
            // Fallback for unknown contract IDs: signature-only display
            signatures.map((sig) => (
              <View key={sig.id} style={styles.sectionCard}>
                <Text style={styles.sectionCardTitle}>
                  Section {sig.section_id}
                </Text>
                <InfoRow label="Signed By" value={sig.printed_name} signature />
                <InfoRow label="Date Signed" value={formatDate(sig.signed_at)} />
              </View>
            ))
          )}

          {!sections && signatures.length === 0 && (
            <View style={styles.neutralCard}>
              <Text style={styles.neutralCardBody}>
                No signature records found for this contract.
              </Text>
            </View>
          )}
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
  sectionParagraph: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 21,
    marginTop: 6,
  },
  sectionBullet: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 21,
    marginTop: 4,
    paddingLeft: 8,
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
