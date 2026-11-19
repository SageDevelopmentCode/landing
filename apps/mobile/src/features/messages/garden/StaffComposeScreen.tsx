// Garden staff "New Message": step 1 pick recipients, step 2 write + send.
// Logic in useStaffCompose(); this file only renders and gives feedback.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  HandNote,
  MIN_TAP,
  PressableScale,
  gardenCard,
  haptic,
  useToast,
} from "@/components/garden";
import { composeTargetKey, composeTargetLabel, type ComposeTarget, type HouseholdComposeRow, type ParentWithChildren } from "@/lib/teacher-messaging";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { pickChatImage } from "../chatShared";
import { useStaffCompose, type StaffCompose } from "../useStaffCompose";

const GUTTER = 18;
const GAP = 10;

type Card =
  | { kind: "household"; household: HouseholdComposeRow }
  | { kind: "parent"; section: "mine" | "all"; parent: ParentWithChildren };
type Row = { key: string; cards: [Card, Card | null] };
type Section = { title: string; data: Row[] };

function pairs(cards: Card[], prefix: string): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < cards.length; i += 2) rows.push({ key: `${prefix}-${i}`, cards: [cards[i], cards[i + 1] ?? null] });
  return rows;
}

export function StaffComposeScreen() {
  const c = useStaffCompose();
  return c.step === 1 ? <SelectStep c={c} /> : <WriteStep c={c} />;
}

// ─── Step 1: Select Recipients ───────────────────────────────────────────────
function SelectStep({ c }: { c: StaffCompose }) {
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);
  const n = c.selected.length;

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (c.filteredHouseholds.length)
      out.push({ title: "HOUSEHOLDS", data: pairs(c.filteredHouseholds.map((h) => ({ kind: "household", household: h })), "h") });
    const d = c.filteredDirectory;
    if (d?.myStudentsParents.length)
      out.push({
        title: "MY STUDENTS' PARENTS",
        data: pairs(d.myStudentsParents.map((p) => ({ kind: "parent", section: "mine", parent: p })), "m"),
      });
    if (d?.allParents.length)
      out.push({
        title: "ALL PARENTS",
        data: pairs(d.allParents.map((p) => ({ kind: "parent", section: "all", parent: p })), "a"),
      });
    return out;
  }, [c.filteredDirectory, c.filteredHouseholds]);

  const isSelected = (card: Card) =>
    c.selectedKeys.has(card.kind === "household" ? `household:${card.household.studentId}` : `parent:${card.parent.id}`);
  const onCard = (card: Card) => {
    haptic.select();
    if (card.kind === "household") c.toggleHousehold(card.household);
    else c.toggleParent(card.parent, card.section);
  };

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      <View style={st.hero}>
        <View style={{ flex: 1 }}>
          <Display size={28} numberOfLines={1}>
            {n > 0 ? `Select Recipients (${n})` : "Select Recipients"}
          </Display>
          <HandNote size={17}>step 1 of 2</HandNote>
        </View>
        <GardenIconButton icon="close" label="Close" onPress={() => c.router.back()} />
      </View>

      <SelectedPills selected={c.selected} onRemove={c.remove} />

      <View style={{ paddingHorizontal: GUTTER, marginBottom: 6 }}>
        <GardenField
          icon="search-outline"
          value={c.search}
          onChangeText={c.setSearch}
          placeholder="Search by name or child..."
          clearable
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search by name or child"
        />
      </View>

      {c.loading ? (
        <GridSkeleton />
      ) : c.loadError ? (
        <View style={{ padding: GUTTER }}>
          <GardenErrorCard
            title="We couldn't load parents"
            retrying={retrying}
            onRetry={async () => {
              setRetrying(true);
              await c.loadDirectory();
              setRetrying(false);
            }}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => r.key}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          windowSize={7}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24, flexGrow: 1 }}
          renderSectionHeader={({ section }) => <Text style={st.section}>{section.title}</Text>}
          renderItem={({ item }) => (
            <View style={st.gridRow}>
              {item.cards.map((card, i) =>
                card ? (
                  <RecipientCard key={i} card={card} selected={isSelected(card)} onPress={() => onCard(card)} />
                ) : (
                  <View key={i} style={{ flex: 1 }} />
                ),
              )}
            </View>
          )}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.duration(180)} style={{ paddingTop: 24 }}>
              <GardenEmpty emoji="🔍" title="No parents found" tint="sky" />
            </Animated.View>
          }
        />
      )}

      <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <GardenButton label="Cancel" tone="outline" onPress={() => c.router.back()} style={{ flex: 1 }} fullWidth />
        <GardenButton
          label="Next →"
          tone="ink"
          disabled={n === 0}
          onPress={() => {
            haptic.press();
            c.setStep(2);
          }}
          accessibilityHint={n === 0 ? "Pick at least one recipient first" : undefined}
          style={{ flex: 1.4 }}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

function SelectedPills({ selected, onRemove }: { selected: ComposeTarget[]; onRemove?: (key: string) => void }) {
  if (selected.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER, paddingBottom: 10 }}
      style={{ flexGrow: 0 }}
    >
      {selected.map((t) => {
        const key = composeTargetKey(t);
        const label = composeTargetLabel(t);
        return (
          <Animated.View key={key} entering={FadeIn.duration(160)} style={st.pill}>
            {t.kind === "household" ? <Ionicons name="people" size={13} color={Garden.sageDeep} /> : null}
            <Text style={st.pillText} numberOfLines={1}>
              {label}
            </Text>
            {onRemove ? (
              <Pressable
                onPress={() => {
                  haptic.select();
                  onRemove(key);
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label}`}
              >
                <Ionicons name="close" size={15} color={Garden.sageDeep} />
              </Pressable>
            ) : null}
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

function RecipientCard({ card, selected, onPress }: { card: Card; selected: boolean; onPress: () => void }) {
  const reduce = useReducedMotion();
  const isHousehold = card.kind === "household";
  const name = isHousehold ? card.household.studentName : (card.parent.full_name ?? "Unknown");
  const firstChild = !isHousehold ? (card.parent.children[0] ?? null) : null;
  const extra = !isHousehold ? card.parent.children.length - 1 : 0;
  const detail = isHousehold
    ? card.household.guardianNames.join(" · ")
    : firstChild
      ? `${firstChild.child_legal_name}${firstChild.child_grade ? ` · ${firstChild.child_grade}` : ""}`
      : "";
  const meta = isHousehold
    ? [card.household.studentGrade, card.household.program].filter(Boolean).join(" · ")
    : (firstChild?.program ?? "");

  return (
    <PressableScale
      haptics={false}
      pressedScale={0.97}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${isHousehold ? "Household of " : ""}${name}${detail ? `, ${detail}` : ""}`}
      style={[st.card, selected && st.cardSelected]}
    >
      {selected ? (
        <Animated.View entering={reduce ? undefined : ZoomIn.springify().damping(14)} style={st.check}>
          <Ionicons name="checkmark" size={13} color={Garden.white} />
        </Animated.View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <GardenAvatar
          name={name}
          uri={isHousehold ? card.household.profileImageUrl : card.parent.profile_image_url}
          seed={isHousehold ? card.household.studentId : card.parent.id}
          size={44}
        />
        {isHousehold ? <Ionicons name="people" size={16} color={Garden.sageDeep} /> : null}
      </View>
      <Text style={st.cardName} numberOfLines={1}>
        {name}
      </Text>
      {detail ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {firstChild ? (
            <GardenAvatar name={firstChild.child_legal_name} uri={firstChild.profile_image_url} seed={firstChild.id} size={20} />
          ) : null}
          <Text style={[st.cardDetail, { flex: 1 }]} numberOfLines={2}>
            {detail}
          </Text>
          {extra > 0 ? (
            <View style={st.extra}>
              <Text style={st.extraText}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {meta ? (
        <Text style={st.cardMeta} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </PressableScale>
  );
}

function GridSkeleton() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: GAP, paddingTop: 10 }}>
      <GardenSkeleton width="40%" height={12} radius={6} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={st.gridRow}>
          {[0, 1].map((j) => (
            <View key={j} style={[st.card, { gap: 8 }]}>
              <GardenSkeleton width={44} height={44} radius={22} />
              <GardenSkeleton width="70%" height={14} radius={6} />
              <GardenSkeleton width="90%" height={11} radius={6} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Step 2: New Message ─────────────────────────────────────────────────────
function WriteStep({ c }: { c: StaffCompose }) {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const n = c.selected.length;
  const sendRef = useRef<(() => Promise<void>) | null>(null);
  const hasFailures = c.failedNames.length > 0;

  const send = useCallback(async () => {
    if (!c.canSend) return;
    haptic.press();
    const count = c.selected.length;
    const id = toast.show({ tone: "loading", title: count > 1 ? `Sending to ${count}…` : "Sending…" });
    const r = await c.send();
    if (r.canceled) {
      toast.dismiss(id);
      return;
    }
    if (r.ok) {
      haptic.success();
      toast.update(id, {
        tone: "success",
        title: (r.sentCount ?? 1) > 1 ? `Sent to ${r.sentCount} conversations` : "Message sent",
        duration: 2200,
      });
      return;
    }
    haptic.error();
    if (r.imageFailed) {
      toast.update(id, {
        tone: "error",
        title: "Photo didn't upload",
        message: "Nothing was sent. Check your connection and try again.",
        duration: 6000,
        action: { label: "Retry", onPress: () => void sendRef.current?.() },
      });
    } else {
      toast.update(id, {
        tone: "error",
        title: r.partial ? `Sent to ${r.sentCount}, some failed` : "Message didn't send",
        message: `Failed to send to: ${(r.failedNames ?? []).join(", ")}`,
        duration: 6000,
        action: { label: "Retry failed", onPress: () => void sendRef.current?.() },
      });
    }
  }, [c, toast]);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const attachPhoto = useCallback(async () => {
    const r = await pickChatImage();
    if (r.ok) {
      c.setImage(r.value);
      haptic.success();
    } else if (r.permissionDenied) {
      toast.show({
        tone: "info",
        title: "Permission needed",
        message: "Allow photo access to attach images.",
        action: { label: "Settings", onPress: () => void Linking.openSettings() },
      });
    } else if (!r.canceled) {
      toast.show({ tone: "error", title: "Couldn't add that photo", message: "Please try another one." });
    }
  }, [c, toast]);

  const sendLabel = hasFailures ? "Retry failed" : n > 1 ? `Send to ${n}` : "Send";

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={st.hero}>
          <GardenIconButton
            icon="arrow-back"
            label="Back to recipients"
            onPress={() => {
              haptic.tap();
              c.setStep(1);
            }}
            disabled={c.sending}
          />
          <View style={{ flex: 1 }}>
            <Display size={28}>New Message</Display>
            <HandNote size={17}>step 2 of 2</HandNote>
          </View>
        </View>

        <View style={st.toRow}>
          <Text style={st.toLabel}>To:</Text>
          <View style={{ flex: 1 }}>
            <SelectedPills selected={c.selected} />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {hasFailures ? (
            <Animated.View entering={FadeInDown.duration(200)} style={st.failCard} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={18} color={Garden.danger} />
              <Text style={st.failText}>{`Failed to send to: ${c.failedNames.join(", ")}`}</Text>
            </Animated.View>
          ) : null}

          {c.pendingImage ? (
            <Animated.View entering={FadeIn} style={st.preview}>
              <Image source={{ uri: c.pendingImage.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Pressable
                onPress={() => {
                  haptic.tap();
                  c.setImage(null);
                }}
                hitSlop={12}
                style={st.previewRemove}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Ionicons name="close" size={16} color={Garden.white} />
              </Pressable>
            </Animated.View>
          ) : null}

          <GardenField
            value={c.draft}
            onChangeText={c.setDraft}
            placeholder="Type a message…"
            multiline
            boxed
            autoFocus
            editable={!c.sending}
            style={{ minHeight: 160 }}
            accessibilityLabel="Message"
          />
        </ScrollView>

        <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <GardenIconButton icon="image-outline" label="Add photo" onPress={() => void attachPhoto()} disabled={c.sending} />
          <GardenButton
            label={sendLabel}
            tone="coral"
            icon={hasFailures ? "refresh" : "paper-plane"}
            loading={c.sending}
            loadingLabel="Sending…"
            disabled={!c.canSend}
            onPress={() => void send()}
            accessibilityHint={n === 0 ? "Pick at least one recipient first" : undefined}
            style={{ flex: 1 }}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Garden.cream },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    backgroundColor: "#e1eee3",
  },
  pillText: { flexShrink: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.sageDeep },
  section: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: Garden.muted,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  gridRow: { flexDirection: "row", gap: GAP, marginBottom: GAP },
  card: {
    ...gardenCard,
    flex: 1,
    borderRadius: 22,
    padding: 12,
    gap: 4,
    minHeight: 128,
  },
  cardSelected: { borderColor: Garden.sage, borderWidth: 2, backgroundColor: "#f3f8f3" },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Garden.sage,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  cardName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink, marginTop: 6 },
  cardDetail: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft },
  cardMeta: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  extra: { backgroundColor: Garden.butter, borderRadius: GardenRadii.pill, paddingHorizontal: 7, paddingVertical: 1 },
  extraText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: "#7a5a00" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
    backgroundColor: Garden.cream,
  },
  toRow: { flexDirection: "row", alignItems: "flex-start", paddingLeft: GUTTER, gap: 4 },
  toLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 14,
    color: Garden.muted,
    minHeight: MIN_TAP - 10,
    lineHeight: 34,
  },
  failCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: Garden.dangerTint,
  },
  failText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.danger, lineHeight: 19 },
  preview: { width: 160, height: 160, borderRadius: GardenRadii.md, overflow: "hidden", backgroundColor: Garden.line },
  previewRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
