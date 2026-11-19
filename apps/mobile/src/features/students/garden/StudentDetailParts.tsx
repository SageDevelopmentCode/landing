// Garden UI for the staff student detail screen: hero, allergy card, tab rail
// and the tab bodies (Info, Contacts, Notes, Attendance, Messages, and the
// "Coming soon." placeholders).
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  MIN_TAP,
  Pill,
  PressableScale,
  gardenCard,
  haptic,
  type GardenTint,
} from "@/components/garden";
import { AttendanceHistory } from "@/features/attendance/garden/AttendanceParts";
import { ImageViewer } from "@/features/messages/garden/ChatBits";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, LinearTransition, useReducedMotion } from "react-native-reanimated";
import {
  STUDENT_TABS,
  type NoteCategory,
  type NoteRecord,
  type StudentDetailHook,
  type StudentTab,
} from "../useStudentDetail";
import { ContactsList, InfoCards, ProfileCardSkeleton } from "./StudentProfileBits";
import type { StudentDetailFeedback } from "./useStudentDetailFeedback";

export const GUTTER = 18;
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export const CATEGORY_TINT: Record<NoteCategory, GardenTint> = {
  general: "sky",
  behavioral: "lav",
  academic: "butter",
  social: "mint",
  health: "coral",
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────
export function StudentHero({ d, onBack }: { d: StudentDetailHook; onBack: () => void }) {
  const s = d.student;
  const allergies = s?.has_allergies === "yes";
  return (
    <View style={hero.wrap}>
      <View style={hero.top}>
        <GardenIconButton icon="chevron-back" label="Back to Students" onPress={onBack} />
        <Text style={hero.back} maxFontSizeMultiplier={1.3} onPress={onBack} accessible={false}>
          Students
        </Text>
      </View>
      <View style={hero.row}>
        <View>
          <GardenAvatar name={d.name} uri={s?.profile_image_url} seed={d.studentId} size={64} />
          {allergies ? (
            <View style={hero.allergyBadge}>
              <Ionicons name="medical" size={11} color={Garden.white} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Display size={d.name.length > 16 ? 26 : 30} numberOfLines={2}>
            {d.name}
          </Display>
          <View style={hero.pills}>
            {s?.child_grade ? <Pill tint="butter">{s.child_grade}</Pill> : null}
            {d.programLabel ? <Pill tint="sage">{d.programLabel}</Pill> : null}
          </View>
        </View>
      </View>
      {allergies ? (
        <Animated.View entering={FadeIn} style={hero.alert} accessible accessibilityLabel={`Allergies: ${s?.allergies_description || "yes"}`}>
          <View style={hero.alertIcon}>
            <Ionicons name="medical" size={16} color={Garden.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={hero.alertTitle} maxFontSizeMultiplier={1.3}>
              Allergies
            </Text>
            {s?.allergies_description ? (
              <Text style={hero.alertBody} maxFontSizeMultiplier={1.4}>
                {s.allergies_description}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab rail
// ─────────────────────────────────────────────────────────────────────────────
export function StudentTabRail({ d }: { d: StudentDetailHook }) {
  const ref = useRef<ScrollView>(null);
  const x = useRef<Record<string, number>>({});
  useEffect(() => {
    const pos = x.current[d.activeTab];
    if (pos != null) ref.current?.scrollTo({ x: Math.max(0, pos - GUTTER), animated: true });
  }, [d.activeTab]);
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={rail.row}
    >
      {STUDENT_TABS.map((t) => {
        const on = d.activeTab === t.key;
        return (
          <PressableScale
            key={t.key}
            haptics="select"
            onLayout={(e) => {
              x.current[t.key] = e.nativeEvent.layout.x;
            }}
            onPress={() => d.selectTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            style={[rail.tab, on && rail.tabOn]}
          >
            <Ionicons name={t.icon as IoniconName} size={15} color={on ? Garden.white : Garden.soft} />
            <Text style={[rail.text, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
              {t.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────
function TabSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      <ProfileCardSkeleton />
      <ProfileCardSkeleton rows={2} />
    </View>
  );
}

function ContactsTab({ d, fb }: { d: StudentDetailHook; fb: StudentDetailFeedback }) {
  if (d.contactsState === "idle" || d.contactsState === "loading") return <TabSkeleton />;
  if (d.contactsState === "error") {
    return <GardenErrorCard title="Couldn't load contacts" onRetry={() => void fb.retrySection(d.retryContacts)} />;
  }
  if (!d.contacts) return <GardenEmpty emoji="📇" title="No contact data available." tint="sky" />;
  return <ContactsList contacts={d.contacts} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function NoteCard({
  d,
  fb,
  note,
  index,
  onOpenImage,
}: {
  d: StudentDetailHook;
  fb: StudentDetailFeedback;
  note: NoteRecord;
  index: number;
  onOpenImage: (url: string) => void;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const t = GardenTints[CATEGORY_TINT[note.category]];
  const atts = note.teacher_note_attachments ?? [];
  const deleting = d.deletingId === note.id;
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.delay(Math.min(index, 6) * 50).springify()}
      layout={reduce ? undefined : LinearTransition.springify().damping(20)}
      style={[note_.card, deleting && { opacity: 0.5 }]}
    >
      <PressableScale
        pressedScale={0.99}
        haptics="tap"
        onPress={() => setOpen((o) => !o)}
        accessibilityLabel={`${note.category} note, ${note.is_shared ? "shared with parent" : "private"}, ${formatDate(note.created_at)}. ${note.note_text}`}
        accessibilityHint={open ? "Collapses the note" : "Expands the note"}
        accessibilityState={{ expanded: open }}
      >
        <View style={note_.head}>
          <View style={[note_.cat, { backgroundColor: t.bg }]}>
            <Text style={[note_.catText, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
              {note.category}
            </Text>
          </View>
          <View style={[note_.cat, { backgroundColor: note.is_shared ? GardenTints.sky.bg : "#f3eadc" }]}>
            <Ionicons
              name={note.is_shared ? "people" : "lock-closed"}
              size={11}
              color={note.is_shared ? GardenTints.sky.fg : Garden.soft}
            />
            <Text style={[note_.catText, { color: note.is_shared ? GardenTints.sky.fg : Garden.soft }]} maxFontSizeMultiplier={1.3}>
              {note.is_shared ? "Shared" : "Private"}
            </Text>
          </View>
          <Text style={note_.date} maxFontSizeMultiplier={1.3}>
            {formatDate(note.created_at)}
          </Text>
          {atts.length > 0 ? <Ionicons name="attach" size={15} color={Garden.muted} /> : null}
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={Garden.muted} />
        </View>
        <Text style={note_.text} numberOfLines={open ? undefined : 3} maxFontSizeMultiplier={1.4}>
          {note.note_text}
        </Text>
      </PressableScale>

      {open ? (
        <Animated.View entering={reduce ? undefined : FadeIn} style={{ gap: 12, marginTop: 12 }}>
          {atts.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={note_.label}>Attachments</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {atts.map((a) =>
                  a.file_type === "image" && a.signed_url ? (
                    <PressableScale
                      key={a.id}
                      onPress={() => onOpenImage(a.signed_url!)}
                      accessibilityLabel={`Open photo ${a.file_name}`}
                    >
                      <Image source={{ uri: a.signed_url }} style={note_.thumb} contentFit="cover" />
                    </PressableScale>
                  ) : (
                    <PressableScale
                      key={a.id}
                      onPress={() => (a.signed_url ? void Linking.openURL(a.signed_url).catch(() => undefined) : undefined)}
                      accessibilityLabel={`Open file ${a.file_name}`}
                      style={note_.file}
                    >
                      <Ionicons name="document-outline" size={18} color={Garden.sageDeep} />
                      <Text style={note_.fileName} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                        {a.file_name}
                      </Text>
                    </PressableScale>
                  ),
                )}
              </ScrollView>
            </View>
          ) : null}
          <View style={note_.actions}>
            <GardenButton label="Edit" tone="outline" size="sm" icon="pencil" onPress={() => d.openEditNote(note)} />
            <GardenButton
              label="Delete"
              tone="outline"
              size="sm"
              icon="trash-outline"
              loading={deleting}
              loadingLabel="Deleting…"
              onPress={() => fb.deleteNote(note)}
            />
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function NotesTab({ d, fb }: { d: StudentDetailHook; fb: StudentDetailFeedback }) {
  const [viewer, setViewer] = useState<string | null>(null);
  let body: React.ReactNode;
  if (d.notesState === "idle" || d.notesState === "loading") {
    body = (
      <View style={{ gap: 12 }}>
        {[0, 1].map((i) => (
          <View key={i} style={[note_.card, { gap: 10 }]}>
            <GardenSkeleton width="45%" height={20} radius={10} />
            <GardenSkeleton width="90%" height={14} radius={6} />
            <GardenSkeleton width="70%" height={14} radius={6} />
          </View>
        ))}
      </View>
    );
  } else if (d.notesState === "error") {
    body = <GardenErrorCard title="Couldn't load notes" onRetry={() => void fb.retrySection(d.retryNotes)} />;
  } else if (d.notes.length === 0) {
    body = (
      <GardenEmpty
        emoji="📝"
        title="No notes yet."
        body={'Tap "Add Note" to create one.'}
        tint="butter"
      />
    );
  } else {
    body = (
      <View style={{ gap: 10 }}>
        {d.notes.map((n, i) => (
          <NoteCard key={n.id} d={d} fb={fb} note={n} index={i} onOpenImage={setViewer} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      <GardenButton
        label="Add Note"
        tone="coral"
        icon="add"
        fullWidth
        onPress={() => {
          haptic.tap();
          d.openAddNote();
        }}
      />
      {body}
      <ImageViewer url={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

function capitalize(s: string | null) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function MessagesTab({ d, fb }: { d: StudentDetailHook; fb: StudentDetailFeedback }) {
  if (d.contactsState === "idle" || d.contactsState === "loading" || d.accountsState === "loading" || (d.contactsState === "ready" && d.accountsState === "idle" && d.guardians.length > 0)) {
    return (
      <View style={{ gap: 10 }}>
        <GardenSkeleton width="100%" height={76} radius={20} />
        <GardenSkeleton width="100%" height={76} radius={20} />
      </View>
    );
  }
  if (d.contactsState === "error") {
    return <GardenErrorCard title="Couldn't load guardians" onRetry={() => void fb.retrySection(d.retryContacts)} />;
  }
  if (d.guardians.length === 0) {
    return <GardenEmpty emoji="💬" title="No guardian information available." tint="sky" />;
  }
  return (
    <View style={{ gap: 10 }}>
      {d.accountsState === "error" ? (
        <GardenErrorCard title="Couldn't check app accounts" onRetry={() => void fb.retrySection(d.retryAccounts)} />
      ) : null}
      {d.guardians.map((g) => {
        const hasAccount = !!g.accountId;
        return (
          <View key={g.key} style={msg.row}>
            <GardenAvatar name={g.name} seed={g.email ?? g.name} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={msg.name} numberOfLines={1} maxFontSizeMultiplier={1.35}>
                  {g.name}
                </Text>
                <Ionicons
                  name={hasAccount ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={hasAccount ? Garden.sage : Garden.muted}
                  accessibilityLabel={hasAccount ? "Has the app" : "No app account"}
                />
              </View>
              {g.relationship ? (
                <Text style={msg.rel} maxFontSizeMultiplier={1.3}>
                  {capitalize(g.relationship)}
                </Text>
              ) : null}
            </View>
            {hasAccount ? (
              <GardenButton
                label="Message"
                tone="sage"
                size="sm"
                icon="chatbubble-outline"
                loading={d.openingGuardian === g.key}
                loadingLabel="Opening…"
                disabled={!!d.openingGuardian && d.openingGuardian !== g.key}
                onPress={() => void fb.messageGuardian(g)}
              />
            ) : (
              <View style={msg.noApp}>
                <Text style={msg.noAppText} maxFontSizeMultiplier={1.2}>
                  No app yet
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ComingSoon({ label, icon }: { label: string; icon: IoniconName }) {
  return (
    <View style={soon.card} accessible accessibilityLabel={`${label}. Coming soon.`}>
      <View style={soon.icon}>
        <Ionicons name={icon} size={26} color={Garden.sageDeep} />
      </View>
      <Display size={20}>{label}</Display>
      <Text style={soon.body}>Coming soon.</Text>
    </View>
  );
}

export function StudentTabBody({ d, fb }: { d: StudentDetailHook; fb: StudentDetailFeedback }) {
  const reduce = useReducedMotion();
  const tab: StudentTab = d.activeTab;
  let content: React.ReactNode;
  if (!d.student) content = null;
  else if (tab === "info") content = <InfoCards student={d.student} />;
  else if (tab === "contacts") content = <ContactsTab d={d} fb={fb} />;
  else if (tab === "notes") content = <NotesTab d={d} fb={fb} />;
  else if (tab === "attendance") content = <AttendanceHistory att={d.attendance} />;
  else if (tab === "messages") content = <MessagesTab d={d} fb={fb} />;
  else {
    const t = STUDENT_TABS.find((x) => x.key === tab)!;
    content = <ComingSoon label={t.label} icon={t.icon as IoniconName} />;
  }
  return (
    <Animated.View key={tab} entering={reduce ? undefined : FadeIn.duration(180)}>
      {content}
    </Animated.View>
  );
}

export function StudentDetailSkeleton() {
  return (
    <View style={{ gap: 12 }}>
      <ProfileCardSkeleton />
      <ProfileCardSkeleton rows={4} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const hero = StyleSheet.create({
  wrap: { paddingHorizontal: GUTTER, paddingTop: 6, paddingBottom: 14, gap: 14 },
  top: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -4 },
  back: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.soft },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  allergyBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Garden.danger,
    borderWidth: 2,
    borderColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  alert: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: GardenTints.coral.bg,
    borderBottomWidth: 3,
    borderBottomColor: Garden.coral,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { fontFamily: GardenFonts.display, fontSize: 16, color: GardenTints.coral.fg },
  alertBody: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.ink, lineHeight: 20 },
});

const rail = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: GUTTER, paddingBottom: 14 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  tabOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  text: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.soft },
});

const note_ = StyleSheet.create({
  card: { ...gardenCard, borderRadius: 20, padding: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  cat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: GardenRadii.pill,
  },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  date: { flex: 1, textAlign: "right", fontFamily: GardenFonts.bodyBold, fontSize: 12, color: Garden.muted },
  text: { fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.ink, lineHeight: 21 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: Garden.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: "#f3eadc" },
  file: {
    width: 120,
    height: 76,
    borderRadius: 14,
    padding: 10,
    gap: 4,
    backgroundColor: GardenTints.sage.bg,
    justifyContent: "center",
  },
  fileName: { fontFamily: GardenFonts.bodyBold, fontSize: 12, color: Garden.ink },
  actions: { flexDirection: "row", gap: 8 },
});

const msg = StyleSheet.create({
  row: {
    ...gardenCard,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    minHeight: 76,
  },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink, flexShrink: 1 },
  rel: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft },
  noApp: {
    minHeight: MIN_TAP - 6,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.pill,
    backgroundColor: "#f3eadc",
    justifyContent: "center",
  },
  noAppText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.muted },
});

const soon = StyleSheet.create({
  card: { ...gardenCard, borderRadius: 24, padding: 28, alignItems: "center", gap: 8 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  body: { fontFamily: GardenFonts.bodySemi, fontSize: 14.5, color: Garden.soft },
});
