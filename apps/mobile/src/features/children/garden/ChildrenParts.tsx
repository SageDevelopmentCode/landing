// Garden UI for the parent Children screen. Pieces take { c, fb } and only
// render; data lives in useChildren(), feedback in useChildrenFeedback().
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
  GardenSprings,
  GardenTints,
  HandNote,
  PressableScale,
  Polaroid,
  gardenCard,
  gardenShadow,
  initialsOf,
  pastelFor,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { AttendanceHistory } from "@/features/attendance/garden/AttendanceParts";
import { formatFullDate, isValidYMD } from "@/features/calendar/calendarUtils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { ProfileSectionKind } from "../types";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  CATEGORY_TINTS,
  CHILD_TABS,
  firstName,
  TEACHER_PHOTOS,
  type ChildTab,
  type Student,
  type TeacherAssignment,
} from "../types";
import type { Children } from "../useChildren";
import type { ChildrenFeedback } from "./useChildrenFeedback";

export const GUTTER = 18;
const TILTS = [-2, 1.5, -1, 2, -1.5];
const TAPES = [Garden.butter, Garden.sky, Garden.lav, Garden.peach, Garden.mint];

const TAB_ICONS: Record<ChildTab, React.ComponentProps<typeof Ionicons>["name"]> = {
  teacher: "school-outline",
  attendance: "calendar-outline",
  learning: "bulb-outline",
  pickup: "car-outline",
  profile: "person-circle-outline",
};

// ─── Hero + child switcher ───────────────────────────────────────────────────
export function ChildrenHero({ c }: { c: Children }) {
  return (
    <View style={s.hero}>
      <Display size={34} numberOfLines={1}>
        Children
      </Display>
    </View>
  );
}

function SwitcherCard({
  st,
  i,
  selected,
  onPress,
}: {
  st: Student;
  i: number;
  selected: boolean;
  onPress: () => void;
}) {
  const reduce = useReducedMotion();
  const lift = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    lift.value = reduce ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, GardenSprings.gentle);
  }, [selected, reduce, lift]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.62 + lift.value * 0.38,
    transform: [{ translateY: -lift.value * 6 }, { scale: 0.92 + lift.value * 0.08 }],
  }));
  const first = firstName(st.child_legal_name);
  return (
    <PressableScale
      haptics="select"
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${first}${st.child_grade ? `, ${st.child_grade}` : ""}`}
    >
      <Animated.View style={[{ alignItems: "center" }, style]}>
        <Polaroid
          uri={st.profile_image_url}
          initials={initialsOf(st.child_legal_name)}
          caption={first}
          subcaption={st.child_grade}
          tilt={TILTS[i % TILTS.length]}
          tapeColor={TAPES[i % TAPES.length]}
          bg={pastelFor(st.child_legal_name).bg}
          width={112}
        />
        <View style={[s.selDot, { opacity: selected ? 1 : 0 }]} />
      </Animated.View>
    </PressableScale>
  );
}

export function ChildSwitcher({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  if (c.students.length < 2) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={{ gap: 14, paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 6 }}
    >
      {c.students.map((st, i) => (
        <SwitcherCard
          key={st.id}
          st={st}
          i={i}
          selected={i === c.activeIndex}
          onPress={() => fb.selectChild(i)}
        />
      ))}
    </ScrollView>
  );
}

/** Name card for the selected child (and the whole header when there's only one). */
export function ChildBanner({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const st = c.student;
  if (!st) return null;
  const single = c.students.length < 2;
  return (
    <Animated.View key={st.id} entering={FadeIn.duration(200)} style={s.banner}>
      {single ? (
        <PressableScale
          onPress={() => fb.selectTab("profile")}
          accessibilityLabel={`${st.child_legal_name}. Open profile`}
        >
          <GardenAvatar name={st.child_legal_name} uri={st.profile_image_url} size={58} />
        </PressableScale>
      ) : null}
      <View style={{ flex: 1, gap: 4 }}>
        <Display size={single ? 24 : 22} numberOfLines={2}>
          {st.child_legal_name}
        </Display>
        {st.child_grade ? (
          <View style={[s.gradePill, { backgroundColor: GardenTints.butter.bg }]}>
            <Text style={[s.gradeText, { color: GardenTints.butter.fg }]}>{st.child_grade}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function ChildTabRail({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={s.tabRail}
    >
      {CHILD_TABS.map((t) => {
        const on = t.key === c.activeTab;
        const dirty = t.key === "pickup" && c.pickup.isDirty;
        return (
          <PressableScale
            key={t.key}
            haptics="select"
            onPress={() => fb.selectTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${t.label}${dirty ? ", unsaved changes" : ""}`}
            style={[s.tab, on && s.tabOn]}
          >
            <Ionicons name={TAB_ICONS[t.key]} size={16} color={on ? Garden.white : Garden.soft} />
            <Text style={[s.tabText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
              {t.label}
            </Text>
            {dirty ? <View style={s.tabDot} /> : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─── Shared card bits ────────────────────────────────────────────────────────
function InfoRow({ label, value, last }: { label: string; value: string | null; last?: boolean }) {
  return (
    <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.infoLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text style={[s.infoValue, !value && { color: Garden.muted }]} maxFontSizeMultiplier={1.4}>
        {value || "—"}
      </Text>
    </View>
  );
}

function SectionCard({
  emoji,
  title,
  onEdit,
  editLabel = "Edit",
  children,
}: {
  emoji: string;
  title: string;
  onEdit?: () => void;
  editLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <Text style={s.cardEmoji}>{emoji}</Text>
        <Display size={19} style={{ flex: 1 }}>
          {title}
        </Display>
        {onEdit ? (
          <GardenButton label={editLabel} icon="pencil" tone="outline" size="sm" onPress={onEdit} />
        ) : null}
      </View>
      {children}
    </View>
  );
}

function RowHeader({
  title,
  count,
  actionLabel,
  onAction,
}: {
  title: string;
  count: number;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={s.rowHeader}>
      <Display size={20} style={{ flex: 1 }}>
        {`${title}${count > 0 ? ` (${count})` : ""}`}
      </Display>
      <GardenButton label={actionLabel} icon="add" tone="sage" size="sm" onPress={onAction} />
    </View>
  );
}

function CardSkeletons({ n = 3, h = 76 }: { n?: number; h?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: n }, (_, i) => (
        <GardenSkeleton key={i} width="100%" height={h} radius={22} />
      ))}
    </View>
  );
}

// ─── Teacher tab ─────────────────────────────────────────────────────────────
function classroomLabel(classroom: string) {
  return classroom.includes("_") ? classroom.split("_").join(" - ") + " Grade" : classroom;
}

function TeacherCard({ t, c, fb }: { t: TeacherAssignment; c: Children; fb: ChildrenFeedback }) {
  const photo = t.teacher_name ? TEACHER_PHOTOS[t.teacher_name] : undefined;
  const busy = c.messagingTeacherId === t.teacher_id;
  return (
    <PressableScale
      pressedScale={0.97}
      onPress={() => c.openTeacher(t)}
      accessibilityLabel={`${t.teacher_name ?? "Unknown Teacher"}${t.classroom ? `, ${classroomLabel(t.classroom)}` : ""}. View teacher profile`}
      style={s.teacherCard}
    >
      <View style={s.teacherPhotoWrap}>
        {photo ? (
          <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <GardenAvatar name={t.teacher_name ?? "T"} size={76} style={{ borderWidth: 0 }} />
        )}
      </View>
      <Text style={s.teacherName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
        {t.teacher_name ?? "Unknown Teacher"}
      </Text>
      {t.classroom ? (
        <Text style={s.teacherSub} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {classroomLabel(t.classroom)}
        </Text>
      ) : null}
      <GardenButton
        label="Message"
        icon="chatbubble-outline"
        tone="sage"
        size="sm"
        loading={busy}
        loadingLabel="Opening…"
        disabled={!!c.messagingTeacherId && !busy}
        onPress={() => void fb.messageTeacher(t)}
        style={{ marginTop: 10, alignSelf: "stretch" }}
        fullWidth
      />
    </PressableScale>
  );
}

export function TeacherTab({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  if (c.teachers.length === 0) {
    return (
      <GardenEmpty
        emoji="🍎"
        title="Teacher Information"
        body="No teacher has been assigned yet. Contact the school office for more information."
        tint="butter"
      />
    );
  }
  const byProgram: Record<string, TeacherAssignment[]> = {};
  for (const t of c.teachers) {
    const key = t.program ?? "Unassigned";
    (byProgram[key] ??= []).push(t);
  }
  return (
    <View style={{ gap: 22 }}>
      {Object.entries(byProgram).map(([program, group]) => (
        <View key={program} style={{ gap: 10 }}>
          <Text style={s.programLabel}>{program.replace(/_/g, " ")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={164 + 12}
            style={{ marginHorizontal: -GUTTER }}
            contentContainerStyle={{ gap: 12, paddingHorizontal: GUTTER, paddingBottom: 8 }}
          >
            {group.map((t) => (
              <TeacherCard key={t.id} t={t} c={c} fb={fb} />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

// ─── Learning tab ────────────────────────────────────────────────────────────
export function LearningTab({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const st = c.student!;
  const l = c.learning;
  const reduce = useReducedMotion();
  return (
    <View style={{ gap: 20 }}>
      <SectionCard emoji="🎨" title="Learning Overview" onEdit={() => fb.openSection("overview")}>
        <InfoRow label="Learning Style" value={st.learning_style} />
        <InfoRow label="Special Interests" value={st.special_interests} />
        <InfoRow label="Strengths & Interests" value={st.strengths_interests} />
        <InfoRow label="Current Challenges" value={st.current_challenges} last />
      </SectionCard>

      <View style={{ gap: 12 }}>
        <RowHeader title="Special Requests" count={l.notes.length} actionLabel="Add" onAction={fb.openNewNote} />
        {l.loading ? (
          <CardSkeletons />
        ) : l.error ? (
          <GardenErrorCard title="Couldn't load special requests" onRetry={() => void l.retry()} />
        ) : l.notes.length === 0 ? (
          <GardenEmpty
            emoji="📝"
            title="No special requests yet"
            body="Let teachers know if your child needs any extra support"
            actionLabel="Add Your First Request"
            onAction={fb.openNewNote}
            tint="sky"
          />
        ) : (
          l.notes.map((note, i) => {
            const t = GardenTints[CATEGORY_TINTS[note.category]];
            const dateStr = new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <Animated.View
                key={note.id}
                entering={reduce ? undefined : FadeInDown.delay(Math.min(i, 6) * 50).springify()}
                exiting={reduce ? undefined : FadeOutDown.duration(160)}
                style={[s.noteCard, { borderLeftColor: t.fg }]}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <View style={[s.gradePill, { backgroundColor: t.bg }]}>
                      <Text style={[s.gradeText, { color: t.fg }]}>
                        {`${CATEGORY_EMOJI[note.category]} ${CATEGORY_LABELS[note.category]}`}
                      </Text>
                    </View>
                    <Text style={s.noteDate}>{dateStr}</Text>
                  </View>
                  <Text style={s.noteText} maxFontSizeMultiplier={1.4}>
                    {note.note_text}
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <GardenIconButton
                    icon="pencil-outline"
                    label="Edit request"
                    tone="ghost"
                    iconSize={18}
                    onPress={() => fb.openEditNote(note)}
                  />
                  <GardenIconButton
                    icon="trash-outline"
                    label="Remove request"
                    tone="ghost"
                    iconSize={18}
                    onPress={() => fb.confirmDeleteNote(note)}
                  />
                </View>
              </Animated.View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Pickup tab ──────────────────────────────────────────────────────────────
function DateRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  const shown = value ? (isValidYMD(value) ? formatFullDate(value) : value) : null;
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityLabel={`${label}, ${shown ?? "not set"}. Choose a date`}
      style={[s.dateRow, last && { borderBottomWidth: 0 }]}
    >
      <View style={[s.icon, { backgroundColor: GardenTints.sky.bg }]}>
        <Ionicons name="calendar-outline" size={17} color={GardenTints.sky.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={[s.dateValue, !shown && { color: Garden.muted }]}>{shown ?? "YYYY-MM-DD"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Garden.muted} />
    </PressableScale>
  );
}

export function PickupTab({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const pk = c.pickup;
  const reduce = useReducedMotion();
  if (pk.loading) {
    return (
      <View style={{ gap: 12 }}>
        <GardenSkeleton width="60%" height={26} radius={10} />
        <CardSkeletons n={2} />
        <GardenSkeleton width="100%" height={150} radius={22} />
      </View>
    );
  }
  if (pk.error) {
    return <GardenErrorCard title="Couldn't load pickup info" onRetry={() => void pk.retry()} />;
  }
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <RowHeader title="Authorized Persons" count={pk.persons.length} actionLabel="Add Person" onAction={fb.openAddPerson} />
        {pk.persons.length === 0 ? (
          <GardenEmpty
            emoji="🚗"
            title="No authorized persons yet"
            actionLabel="Add Person"
            onAction={fb.openAddPerson}
            tint="peach"
          />
        ) : (
          pk.persons.map((p, i) => (
            <Animated.View
              key={p.tempId}
              entering={reduce ? undefined : FadeInDown.delay(Math.min(i, 6) * 50).springify()}
              exiting={reduce ? undefined : FadeOutDown.duration(160)}
            >
              <PressableScale
                pressedScale={0.98}
                onPress={() => fb.openEditPerson(p)}
                accessibilityLabel={`${p.full_name}${p.relationship ? `, ${p.relationship}` : ""}. Edit`}
                style={s.personCard}
              >
                <GardenAvatar name={p.full_name} size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.personName} maxFontSizeMultiplier={1.35}>
                    {p.full_name}
                  </Text>
                  {p.relationship || p.phone ? (
                    <Text style={s.personSub} maxFontSizeMultiplier={1.35}>
                      {[p.relationship, p.phone].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                  {p.vehicle_info || p.license_plate_state ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="car-outline" size={13} color={Garden.muted} />
                      <Text style={s.personSub} maxFontSizeMultiplier={1.35}>
                        {[p.vehicle_info, p.license_plate_state].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <GardenIconButton
                  icon="trash-outline"
                  label={`Remove ${p.full_name}`}
                  tone="ghost"
                  iconSize={18}
                  onPress={() => fb.confirmRemovePerson(p)}
                />
              </PressableScale>
            </Animated.View>
          ))
        )}
      </View>

      <SectionCard emoji="🗓️" title="Authorization Plan">
        <DateRow label="Date of Request" value={pk.dateOfRequest} onPress={() => fb.openDate("dateOfRequest")} />
        <DateRow label="Effective Until" value={pk.effectiveUntil} onPress={() => fb.openDate("effectiveUntil")} last />
        {pk.dateProblem ? (
          <Animated.View entering={FadeIn.duration(160)} style={s.warn} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color="#8a5a00" />
            <Text style={s.warnText}>{pk.dateProblem}</Text>
          </Animated.View>
        ) : null}
      </SectionCard>
    </View>
  );
}

/** Floating "unsaved changes" bar above the tab bar while pickup edits are pending. */
export function PickupSaveBar({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const reduce = useReducedMotion();
  const pk = c.pickup;
  const show = c.activeTab === "pickup" && (pk.isDirty || fb.pickupSaved);
  if (!show) return null;
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.springify()}
      exiting={reduce ? undefined : FadeOutDown.duration(160)}
      style={[s.saveBar, { bottom: BottomTabInset + 10 }]}
    >
      <View style={{ flex: 1 }}>
        <HandNote size={17} color={Garden.ink}>
          {fb.pickupSaved && !pk.isDirty ? "all saved ✓" : "unsaved changes"}
        </HandNote>
      </View>
      {pk.isDirty ? (
        <GardenIconButton icon="arrow-undo" label="Discard changes" onPress={fb.discardPickup} disabled={pk.saving} />
      ) : null}
      <GardenButton
        label="Save Changes"
        icon="checkmark-circle-outline"
        tone="coral"
        size="sm"
        loading={pk.saving}
        loadingLabel="Saving…"
        success={fb.pickupSaved}
        successLabel="Saved"
        disabled={!pk.isDirty}
        onPress={() => void fb.savePickup()}
      />
    </Animated.View>
  );
}

// ─── Profile tab ─────────────────────────────────────────────────────────────
function medicalValue(flag: string | null, desc: string | null) {
  return flag === "yes" ? desc : flag === "no" ? "None" : null;
}

export function ProfileTab({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const st = c.student!;
  const uploading = c.profile.uploading;
  const edit = (k: ProfileSectionKind) => () => fb.openSection(k);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: "center", paddingVertical: 6 }}>
        <PressableScale
          onPress={() => void fb.pickPhoto()}
          disabled={uploading}
          accessibilityLabel={uploading ? "Uploading photo" : "Change photo"}
          style={{ alignItems: "center", gap: 8 }}
        >
          <View style={s.bigAvatar}>
            <GardenAvatar name={st.child_legal_name} uri={st.profile_image_url} size={110} style={{ borderWidth: 4 }} />
            <View style={s.cameraBadge}>
              <Ionicons name={uploading ? "hourglass-outline" : "camera"} size={16} color={Garden.white} />
            </View>
          </View>
          <HandNote size={17}>{uploading ? "Uploading…" : "Tap to change photo"}</HandNote>
        </PressableScale>
      </View>

      <SectionCard emoji="🩺" title="Medical Info" onEdit={edit("medical")}>
        <InfoRow label="Allergies" value={medicalValue(st.has_allergies, st.allergies_description)} />
        <InfoRow
          label="Medical Conditions"
          value={medicalValue(st.has_medical_conditions, st.medical_conditions_description)}
        />
        <InfoRow
          label="Emergency Medications"
          value={medicalValue(st.has_emergency_medications, st.emergency_medications_description)}
          last
        />
      </SectionCard>

      <SectionCard emoji="🎨" title="Learning Profile" onEdit={edit("learning")}>
        <InfoRow label="Learning Style" value={st.learning_style} />
        <InfoRow label="Special Interests" value={st.special_interests} />
        <InfoRow label="Strengths & Interests" value={st.strengths_interests} last />
      </SectionCard>

      <SectionCard emoji="🌬️" title="Regulation" onEdit={edit("regulation")}>
        <InfoRow label="Regulation Strategies" value={st.regulation_strategies} />
        <InfoRow label="Dysregulation Response" value={st.dysregulation_response} last />
      </SectionCard>

      <SectionCard emoji="🤝" title="Support" onEdit={edit("support")}>
        <InfoRow label="Current Challenges" value={st.current_challenges} last />
      </SectionCard>
    </View>
  );
}

// ─── Tab body switch ─────────────────────────────────────────────────────────
export function ChildTabBody({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  if (!c.student) return null;
  return (
    <Animated.View key={`${c.student.id}-${c.activeTab}`} entering={FadeIn.duration(180)} style={s.body}>
      {c.activeTab === "teacher" ? <TeacherTab c={c} fb={fb} /> : null}
      {c.activeTab === "attendance" ? <AttendanceHistory att={c.attendance} /> : null}
      {c.activeTab === "learning" ? <LearningTab c={c} fb={fb} /> : null}
      {c.activeTab === "pickup" ? <PickupTab c={c} fb={fb} /> : null}
      {c.activeTab === "profile" ? <ProfileTab c={c} fb={fb} /> : null}
    </Animated.View>
  );
}

// ─── Whole-screen states ─────────────────────────────────────────────────────
export function ChildrenSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 14, paddingHorizontal: GUTTER, paddingTop: 12 }}>
        {[0, 1].map((i) => (
          <GardenSkeleton key={i} width={112} height={146} radius={6} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: GUTTER }}>
        {[96, 118, 100, 86].map((w, i) => (
          <GardenSkeleton key={i} width={w} height={42} radius={21} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: GUTTER }}>
        {[0, 1].map((i) => (
          <GardenSkeleton key={i} width={164} height={220} radius={24} />
        ))}
      </View>
    </View>
  );
}

export function ChildrenStates({
  c,
  fb,
  children,
}: {
  c: Children;
  fb: ChildrenFeedback;
  children: React.ReactNode;
}) {
  if (c.loading) return <ChildrenSkeleton />;
  if (c.error) {
    return (
      <View style={{ paddingHorizontal: GUTTER }}>
        <GardenErrorCard title="Couldn't load your children" body={c.error} retrying={fb.retrying} onRetry={() => void fb.retryLoad()} />
      </View>
    );
  }
  if (c.students.length === 0) {
    return (
      <View style={{ paddingHorizontal: GUTTER }}>
        <GardenEmpty
          emoji="🌱"
          title="No Children Found"
          body="Contact your school administrator to link your children to this account."
        />
      </View>
    );
  }
  return <>{children}</>;
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 4 },
  selDot: {
    width: 22,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    backgroundColor: Garden.sageDeep,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    paddingBottom: 4,
  },
  gradePill: {
    alignSelf: "flex-start",
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gradeText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5 },
  tabRail: { gap: 8, paddingHorizontal: GUTTER, paddingTop: 14, paddingBottom: 6 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  tabOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  tabText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.soft },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Garden.coralDeep,
    borderWidth: 1.5,
    borderColor: Garden.white,
  },
  body: { paddingHorizontal: GUTTER, paddingTop: 16 },

  card: { ...gardenCard, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardEmoji: { fontSize: 20 },
  infoRow: {
    paddingVertical: 10,
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: Garden.line,
  },
  infoLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  infoValue: { fontFamily: GardenFonts.bodySemi, fontSize: 15, lineHeight: 21, color: Garden.ink },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: 10 },

  programLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  teacherCard: {
    ...gardenCard,
    width: 164,
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
  },
  teacherPhotoWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: "hidden",
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: Garden.white,
    ...gardenShadow,
  },
  teacherName: { fontFamily: GardenFonts.display, fontSize: 16, lineHeight: 19, color: Garden.ink, textAlign: "center" },
  teacherSub: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft, marginTop: 2, textAlign: "center" },

  noteCard: {
    ...gardenCard,
    borderRadius: 20,
    borderLeftWidth: 5,
    flexDirection: "row",
    gap: 8,
    paddingLeft: 14,
    paddingVertical: 10,
    paddingRight: 4,
  },
  noteDate: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.muted },
  noteText: { fontFamily: GardenFonts.body, fontSize: 15, lineHeight: 21, color: Garden.ink },

  personCard: {
    ...gardenCard,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 10,
  },
  personName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  personSub: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft, flexShrink: 1 },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: Garden.line,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dateValue: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink, marginTop: 1 },
  warn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    marginBottom: 10,
    borderRadius: GardenRadii.sm,
    backgroundColor: "#fff3c4",
  },
  warnText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: "#8a5a00" },

  saveBar: {
    position: "absolute",
    left: GUTTER,
    right: GUTTER,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.butter,
    borderWidth: 1,
    borderColor: Garden.butterDeep,
    ...gardenShadow,
  },

  bigAvatar: { width: 110, height: 110, ...gardenShadow, borderRadius: 55 },
  cameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Garden.sageDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Garden.white,
  },
});
