// The details shared by Upload (step 2) and Edit: caption, date taken,
// publication labels and student tags, plus a consent check that warns —
// inline and before saving — when a tagged student's photo consent doesn't
// cover what the photo is labelled for.
import {
  Garden,
  GardenDateField,
  GardenFonts,
  GardenHintBox,
  GardenRadii,
  HandNote,
  haptic,
} from "@/components/garden";
import { StudentTagSelector } from "@/components/photos/StudentTagSelector";
import type { PublicationLabel, StudentWithConsent } from "@/lib/photos-actions";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export const PUB_LABELS: { key: PublicationLabel; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { key: "newsletter", label: "Newsletter", icon: "newspaper-outline" },
  { key: "social_media", label: "Social Media", icon: "share-social-outline" },
  { key: "website", label: "Website", icon: "globe-outline" },
];

const PUBLIC_LABELS: PublicationLabel[] = ["social_media", "website"];

export type ConsentIssue = { noConsent: string[]; limitedPublic: string[]; publicLabels: string[] };

/** Who's tagged against what their family agreed to. */
export function consentIssues(
  students: StudentWithConsent[],
  selected: string[],
  labels: PublicationLabel[],
): ConsentIssue | null {
  const tagged = students.filter((s) => selected.includes(s.student_id));
  const first = (s: StudentWithConsent) => (s.name ?? "A student").split(" ")[0];
  const publicLabels = PUB_LABELS.filter((l) => labels.includes(l.key) && PUBLIC_LABELS.includes(l.key)).map(
    (l) => l.label,
  );
  const noConsent = tagged.filter((s) => s.consent_level === "NO").map(first);
  const limitedPublic = publicLabels.length ? tagged.filter((s) => s.consent_level === "LIMITED").map(first) : [];
  if (!noConsent.length && !limitedPublic.length) return null;
  return { noConsent, limitedPublic, publicLabels };
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function consentMessage(i: ConsentIssue) {
  const parts: string[] = [];
  if (i.noConsent.length)
    parts.push(`${joinNames(i.noConsent)} ${i.noConsent.length === 1 ? "has" : "have"} No Consent for photos.`);
  if (i.limitedPublic.length)
    parts.push(
      `${joinNames(i.limitedPublic)} ${i.limitedPublic.length === 1 ? "has" : "have"} Limited consent, and this photo is labelled for ${joinNames(i.publicLabels)}.`,
    );
  return parts.join(" ");
}

/** Resolves true when it's OK to save (no issue, or the teacher confirmed). */
export function confirmConsent(issue: ConsentIssue | null, actionLabel: string): Promise<boolean> {
  if (!issue) return Promise.resolve(true);
  haptic.warning();
  return new Promise((resolve) => {
    Alert.alert("Check photo consent", `${consentMessage(issue)} Do you still want to continue?`, [
      { text: "Go back", style: "cancel", onPress: () => resolve(false) },
      { text: actionLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function FieldLabel({ children, note }: { children: string; note?: string }) {
  return (
    <View style={s.labelRow}>
      <Text style={s.label} maxFontSizeMultiplier={1.3}>
        {children}
      </Text>
      {note ? <HandNote size={15} color={Garden.muted}>{note}</HandNote> : null}
    </View>
  );
}

export function PhotoDetailsForm({
  caption,
  onCaption,
  takenOn,
  onTakenOn,
  labels,
  onToggleLabel,
  students,
  studentsLoading,
  studentsError,
  onRetryStudents,
  selected,
  onToggleStudent,
  search,
  onSearch,
}: {
  caption: string;
  onCaption: (v: string) => void;
  takenOn: string;
  onTakenOn: (v: string) => void;
  labels: PublicationLabel[];
  onToggleLabel: (k: PublicationLabel) => void;
  students: StudentWithConsent[];
  studentsLoading: boolean;
  studentsError?: boolean;
  onRetryStudents?: () => void;
  selected: string[];
  onToggleStudent: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const issue = consentIssues(students, selected, labels);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <FieldLabel note="optional">Caption</FieldLabel>
        <TextInput
          style={s.caption}
          placeholder="Add a caption (optional)"
          placeholderTextColor={Garden.muted}
          value={caption}
          onChangeText={onCaption}
          multiline
          maxFontSizeMultiplier={1.4}
          accessibilityLabel="Caption"
        />
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel>Date taken</FieldLabel>
        <GardenDateField value={takenOn} onChange={onTakenOn} modalTitle="Date taken" />
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel note="where it can be used">Publication labels</FieldLabel>
        <View style={s.labels}>
          {PUB_LABELS.map(({ key, label, icon }) => {
            const on = labels.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => {
                  haptic.select();
                  onToggleLabel(key);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={label}
                style={({ pressed }) => [s.labelChip, on && s.labelChipOn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name={on ? "checkmark-circle" : icon} size={16} color={on ? Garden.white : Garden.sageDeep} />
                <Text style={[s.labelChipText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel note={selected.length ? `${selected.length} selected` : undefined}>Tag students</FieldLabel>
        {issue ? (
          <GardenHintBox icon="shield-half-outline" tone="coral" style={{ marginTop: 0 }}>
            {consentMessage(issue)}
          </GardenHintBox>
        ) : null}
        {studentsError ? (
          <GardenHintBox icon="cloud-offline-outline" tone="coral" style={{ marginTop: 0 }}>
            We couldn't load students and their photo consent.{" "}
            <Text onPress={onRetryStudents} style={s.retry} accessibilityRole="button">
              Retry
            </Text>
          </GardenHintBox>
        ) : (
          <StudentTagSelector
            students={students}
            selected={selected}
            onToggle={onToggleStudent}
            searchQuery={search}
            onSearchChange={onSearch}
            loading={studentsLoading}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  labelRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  caption: {
    minHeight: 72,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
    padding: 12,
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15.5,
    color: Garden.ink,
    textAlignVertical: "top",
  },
  labels: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
  },
  labelChipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  labelChipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep },
  retry: { fontFamily: GardenFonts.bodyHeavy, color: Garden.coralDeep, textDecorationLine: "underline" },
});
