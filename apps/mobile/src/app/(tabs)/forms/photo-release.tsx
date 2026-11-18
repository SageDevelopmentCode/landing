// Photo, Video, and Media Release (contract 5) — read-only Garden viewer.
// The consent card's tint follows the level (always alongside its label).
import {
  Display,
  Garden,
  GardenFonts,
  GardenRadii,
  GardenTints,
  type GardenTint,
} from "@/components/garden";
import {
  CONSENT_DESCRIPTIONS,
  CONSENT_LEVEL_LABELS,
  PHOTO_RELEASE_CONTRACT_ID,
  PHOTO_RELEASE_SECTIONS,
  SECTION_ACKNOWLEDGMENTS,
} from "@/features/forms/content/photoRelease";
import {
  bySection,
  fetchSignatures,
  MissingParamsError,
  unwrap,
} from "@/features/forms/formsUtils";
import {
  AcknowledgmentCard,
  FormDetailScreen,
  LegalSection,
} from "@/features/forms/garden/FormParts";
import { useFormDetail } from "@/features/forms/useFormDetail";
import { useHideTabBar } from "@/features/forms/useHideTabBar";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

interface PhotoRelease {
  student_id: string;
  consent_level: string;
  created_at: string;
  updated_at: string;
}

const CONSENT_TINT: Record<string, { tint: GardenTint; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  FULL: { tint: "mint", icon: "checkmark-circle" },
  LIMITED: { tint: "butter", icon: "remove-circle" },
  NO: { tint: "coral", icon: "close-circle" },
};

export default function PhotoReleaseScreen() {
  const { studentId, userId } = useLocalSearchParams<{ studentId: string; userId: string }>();
  useHideTabBar();

  const detail = useFormDetail(
    studentId && userId ? `${userId}:${studentId}` : null,
    async () => {
      if (!studentId || !userId) throw new MissingParamsError();
      const [consentRes, signatures] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_photo_release_consent")
          .select("student_id, consent_level, created_at, updated_at")
          .eq("student_id", studentId)
          .eq("parent_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        fetchSignatures(studentId, userId, PHOTO_RELEASE_CONTRACT_ID),
      ]);
      return { consent: unwrap(consentRes) as PhotoRelease | null, signatures };
    },
    "parent-forms-photo-release",
  );

  return (
    <FormDetailScreen title="Photo Release" detail={detail} isEmpty={(d) => !d.consent}>
      {({ consent, signatures }, fb) => {
        const consentLevel = consent?.consent_level ?? "";
        const look = CONSENT_TINT[consentLevel] ?? { tint: "sky" as GardenTint, icon: "information-circle" as const };
        const t = GardenTints[look.tint];
        const sigMap = bySection(signatures);
        return (
          <>
            {PHOTO_RELEASE_SECTIONS.map((section, idx) => (
              <LegalSection key={idx} title={section.heading} section={section} onEmail={fb.openEmail} />
            ))}

            {/* Consent level */}
            <View
              style={[st.consent, { backgroundColor: t.bg }]}
              accessible
              accessibilityLabel={`${CONSENT_LEVEL_LABELS[consentLevel] ?? consentLevel}. ${
                CONSENT_DESCRIPTIONS[consentLevel] ?? `Consent level: ${consentLevel}`
              }`}
            >
              <View style={st.consentHead}>
                <Ionicons name={look.icon} size={22} color={t.fg} />
                <View style={{ flex: 1 }}>
                  <Display size={20} color={t.fg}>
                    {CONSENT_LEVEL_LABELS[consentLevel] ?? consentLevel}
                  </Display>
                </View>
              </View>
              <Text style={[st.consentBody, { color: t.fg }]} maxFontSizeMultiplier={1.4}>
                {CONSENT_DESCRIPTIONS[consentLevel] ?? `Consent level: ${consentLevel}`}
              </Text>
            </View>

            {/* Signature records */}
            {[1, 2].map((sectionNum) => (
              <AcknowledgmentCard
                key={sectionNum}
                title={sectionNum === 1 ? "Signature (Initials)" : "Signature"}
                text={SECTION_ACKNOWLEDGMENTS[sectionNum]}
                sig={sigMap[sectionNum]}
              />
            ))}
          </>
        );
      }}
    </FormDetailScreen>
  );
}

const st = StyleSheet.create({
  consent: { borderRadius: GardenRadii.md, padding: 18, gap: 8 },
  consentHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  consentBody: { fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.ink },
});
