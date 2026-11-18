// Garden building blocks for the parent Home ("Today" feed). Every part reads
// from the shared useParentHome() state; see the sagefield-garden-mobile skill.
import {
  Confetti,
  CountBadge,
  Display,
  Garden,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSectionHeader,
  GardenSkeleton,
  GardenTints,
  HandNote,
  Pill,
  Polaroid,
  PressableScale,
  SeedProgress,
  StickyNote,
  gardenCard,
  gardenShadowSm,
  haptic,
  type GardenTint,
} from "@/components/garden";
import { FallLeavesOverlay } from "@/components/FallLeavesOverlay";
import { getGreeting } from "@/components/HomeHeroHeader";
import { API_BASE_URL } from "@/constants/config";
import {
  formatConferenceDateForDisplay,
  getUpcomingConferenceEntries,
} from "@/lib/parent-teacher-conference";
import { abbreviateName } from "@/lib/student-teacher-assignments";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, type ReactNode } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { buildHomeTuitionCards, type HomeTuitionCard } from "../buildHomeTuitionCards";
import {
  CHECKLIST_TASKS,
  TOTAL_TASKS,
  avatarColor,
  formatEventTime,
  getInitials,
  toYMD,
} from "../constants";
import { IntroSlideshow } from "../IntroSlideshow";
import { ParentHomeExternalSheets } from "../ParentHomeExternalSheets";
import type { CalendarEvent } from "../types";
import type { ParentHome } from "../useParentHome";
import { GardenHomeSheets } from "./GardenHomeSheets";
import type { GardenFeedback } from "./useGardenFeedback";

export const GUTTER = 18;

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// Chrome: sheets, intro, confetti, fall leaves (mount once per screen)
// ─────────────────────────────────────────────────────────────────────────────
export function GardenHomeChrome({ h, fb }: { h: ParentHome; fb: GardenFeedback }) {
  return (
    <>
      <GardenHomeSheets h={h} fb={fb} />
      <ParentHomeExternalSheets
        home={h}
        onDefaultSaved={fb.onDefaultSaved}
        onActivitySaved={fb.onActivitySaved}
        onBookingsChanged={fb.onBookingsChanged}
      />
      <IntroSlideshow
        introVisible={h.introVisible}
        introIndex={h.introIndex}
        setIntroIndex={h.setIntroIndex}
        introListRef={h.introListRef}
        handleIntroNext={h.handleIntroNext}
        handleIntroBack={h.handleIntroBack}
        handleIntroSkip={h.handleIntroSkip}
      />
      <Confetti ref={fb.confettiRef} />
      {h.showFallLeaves ? (
        <FallLeavesOverlay
          onComplete={() => {
            h.markFallLeavesPlayed();
            h.setShowFallLeaves(false);
          }}
        />
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────
function HeroIconButton({
  icon,
  label,
  onPress,
  badge,
  dot,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  badge?: number;
  dot?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={hero.iconBtn}>
      <Ionicons name={icon} size={20} color={Garden.ink} />
      {badge ? (
        <View style={hero.badgePos}>
          <CountBadge count={badge} />
        </View>
      ) : dot ? (
        <View style={hero.dot} />
      ) : null}
    </PressableScale>
  );
}

export function GardenHero({ h }: { h: ParentHome }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const checklistOpen = !h.onboardingLoading && h.completedTaskCount < TOTAL_TASKS;
  return (
    <View style={hero.wrap}>
      <View style={{ flex: 1 }}>
        <HandNote size={20} color={Garden.sageDeep}>
          {getGreeting()},
        </HandNote>
        <Display size={36} numberOfLines={1}>
          {h.firstName}
        </Display>
        <Pill tint="butter" style={{ marginTop: 8 }}>
          ☀️ {today}
        </Pill>
      </View>
      <View style={hero.actions}>
        <HeroIconButton
          icon="checkbox-outline"
          label={`Get started checklist, ${h.completedTaskCount} of ${TOTAL_TASKS} done`}
          onPress={() => h.checklistSheetRef.current?.present()}
          dot={checklistOpen}
        />
        <HeroIconButton
          icon="notifications-outline"
          label={`Notifications${h.notifTotal ? `, ${h.notifTotal} unread` : ""}`}
          onPress={() => h.notifSheetRef.current?.present()}
          badge={h.notifTotal}
        />
        <PressableScale
          onPress={() => h.profileSheetRef.current?.present()}
          accessibilityLabel="Your profile"
          style={hero.avatar}
        >
          {h.parentImageUrl ? (
            <Image source={{ uri: h.parentImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={hero.initials}>{h.initials}</Text>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Garden.line,
  },
  badgePos: { position: "absolute", top: -3, right: -4 },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Garden.coralDeep,
    borderWidth: 1.5,
    borderColor: Garden.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Garden.white,
  },
  initials: { fontFamily: GardenFonts.display, fontSize: 15, color: Garden.sageDeep },
});

// ─────────────────────────────────────────────────────────────────────────────
// Grantee + load error banners
// ─────────────────────────────────────────────────────────────────────────────
export function GardenBanners({ h, fb }: { h: ParentHome; fb: GardenFeedback }) {
  return (
    <>
      {h.isGrantee && h.ownerName ? (
        <View style={ban.grantee}>
          <Ionicons name="eye-outline" size={14} color="#6b4785" />
          <Text style={ban.granteeText}>Viewing {h.ownerName}&apos;s dashboard</Text>
        </View>
      ) : null}
      {h.loadError && !h.loading ? (
        <View style={{ paddingHorizontal: GUTTER, marginBottom: 14 }}>
          <GardenErrorCard onRetry={() => void fb.retryLoad()} retrying={fb.retrying} />
        </View>
      ) : null}
    </>
  );
}

const ban = StyleSheet.create({
  grantee: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: GardenTints.lav.bg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  granteeText: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: "#6b4785" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Next steps — merges Action Needed + onboarding into numbered steps
// ─────────────────────────────────────────────────────────────────────────────
type Step = {
  key: string;
  emoji: string;
  title: string;
  body: string;
  cta: string;
  tint: GardenTint;
  onPress: () => void;
  extra?: ReactNode;
};

function useNextSteps(h: ParentHome): Step[] {
  const steps: Step[] = [];
  if (h.showActionTuition) {
    steps.push({
      key: "tuition",
      emoji: "🏫",
      title: "School Year Tuition Available",
      body: h.tuitionActionSubtext,
      cta: "Go to tuition",
      tint: "sky",
      onPress: () => h.router.push("/(tabs)/tuition"),
    });
  }
  if (h.showActionActivity) {
    steps.push({
      key: "activity",
      emoji: "🍳",
      title: "Activity Preferences",
      body: "Your child has upcoming activities — let us know how they'd like to participate.",
      cta: "Set Preferences",
      tint: "butter",
      onPress: () => void h.openActivityPreferenceSheet(),
    });
  }
  if (!h.onboardingLoading && h.completedTaskCount < TOTAL_TASKS) {
    const next = CHECKLIST_TASKS.find((t) => !h.onboardingCompleted.has(t.id));
    steps.push({
      key: "onboarding",
      emoji: "🌱",
      title: "Get Started",
      body: next ? `Next: ${next.label}` : `${h.completedTaskCount} of ${TOTAL_TASKS} completed`,
      cta: "Continue setup",
      tint: "mint",
      onPress: () => h.checklistSheetRef.current?.present(),
      extra: (
        <SeedProgress
          done={h.completedTaskCount}
          total={TOTAL_TASKS}
          doneFlags={CHECKLIST_TASKS.map((t) => h.onboardingCompleted.has(t.id))}
        />
      ),
    });
  }
  return steps;
}

export function NextStepsStack({
  h,
  title = "Your next steps",
  style,
}: {
  h: ParentHome;
  title?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const steps = useNextSteps(h);
  return (
    <View style={style}>
      <GardenSectionHeader
        title={title}
        note={steps.length ? `${steps.length} thing${steps.length > 1 ? "s" : ""} need you` : undefined}
      />
      <View style={{ paddingHorizontal: GUTTER, gap: 12 }}>
        {steps.length === 0 ? (
          <GardenEmpty emoji="🌿" title="All caught up!" body="Nothing needs your attention right now." />
        ) : (
          steps.map((st, i) => (
            <Animated.View key={st.key} entering={FadeInDown.delay(i * 70).springify()}>
              <PressableScale
                onPress={st.onPress}
                accessibilityLabel={`Step ${i + 1}: ${st.title}. ${st.body}`}
                style={[ns.card, { backgroundColor: GardenTints[st.tint].bg }]}
              >
                <View style={ns.top}>
                  <View style={ns.stepBubble}>
                    <Text style={ns.stepNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <HandNote size={15} color={GardenTints[st.tint].fg}>
                      step {i + 1} of {steps.length}
                    </HandNote>
                    <Text style={ns.title}>
                      {st.emoji} {st.title}
                    </Text>
                    <Text style={ns.body}>{st.body}</Text>
                  </View>
                </View>
                {st.extra ? <View style={{ marginTop: 10, marginLeft: 46 }}>{st.extra}</View> : null}
                <View style={{ marginTop: 12, marginLeft: 46 }}>
                  <GardenButton label={st.cta} size="sm" tone="ink" iconRight="arrow-forward" onPress={st.onPress} />
                </View>
              </PressableScale>
            </Animated.View>
          ))
        )}
      </View>
    </View>
  );
}

const ns = StyleSheet.create({
  card: { borderRadius: GardenRadii.card, padding: 16 },
  top: { flexDirection: "row", gap: 12 },
  stepBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontFamily: GardenFonts.display, fontSize: 17, color: Garden.ink },
  title: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink, marginTop: 1 },
  body: { fontFamily: GardenFonts.body, fontSize: 13.5, lineHeight: 19, color: Garden.soft, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Parent-teacher conference tickets
// ─────────────────────────────────────────────────────────────────────────────
export function ConferenceTickets({ h }: { h: ParentHome }) {
  const entries = useMemo(
    () =>
      getUpcomingConferenceEntries(
        h.ptcStudentsForBanner,
        h.conferenceBookingsByStudent,
        h.conferenceTeachers,
        new Date().toISOString().slice(0, 10),
      ),
    [h.ptcStudentsForBanner, h.conferenceBookingsByStudent, h.conferenceTeachers],
  );
  if (entries.length === 0) return null;
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 12, marginBottom: 20 }}>
      {entries.map((entry) => {
        const d = new Date(`${entry.booking.conferenceDate}T12:00:00`);
        const isVirtual = entry.booking.format === "virtual";
        return (
          <PressableScale
            key={entry.studentId}
            onPress={h.openPtcSheet}
            accessibilityLabel={`Parent teacher conference for ${entry.studentName} with ${entry.teacherName}, ${formatConferenceDateForDisplay(entry.booking.conferenceDate)} at ${entry.booking.timeSlot}`}
            style={tk.ticket}
          >
            <View style={tk.stub}>
              <Text style={tk.stubWk}>{d.toLocaleDateString("en-US", { weekday: "short" })}</Text>
              <Text style={tk.stubDay}>{d.getDate()}</Text>
              <Text style={tk.stubMo}>{d.toLocaleDateString("en-US", { month: "short" })}</Text>
            </View>
            <View style={tk.perf} />
            <View style={{ flex: 1, paddingVertical: 14, paddingRight: 14 }}>
              <HandNote size={15} color={Garden.sageDeep}>
                🎟️ conference
              </HandNote>
              <Text style={tk.name}>{entry.studentName}</Text>
              <Text style={tk.line}>with {entry.teacherName}</Text>
              <Text style={tk.line}>
                {formatConferenceDateForDisplay(entry.booking.conferenceDate)} · {entry.booking.timeSlot}
              </Text>
              <View style={tk.format}>
                <Ionicons name={isVirtual ? "videocam-outline" : "location-outline"} size={13} color={Garden.sageDeep} />
                <Text style={tk.formatText}>{isVirtual ? "Virtual" : "In person at Sage Field"}</Text>
              </View>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const tk = StyleSheet.create({
  ticket: {
    flexDirection: "row",
    backgroundColor: Garden.white,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Garden.line,
    ...gardenShadowSm,
  },
  stub: {
    width: 72,
    backgroundColor: Garden.sage,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  stubWk: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: "rgba(255,255,255,0.85)", textTransform: "uppercase" },
  stubDay: { fontFamily: GardenFonts.display, fontSize: 30, color: Garden.white, lineHeight: 34 },
  stubMo: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: "rgba(255,255,255,0.85)", textTransform: "uppercase" },
  perf: {
    width: 0,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: Garden.line,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  name: { fontFamily: GardenFonts.display, fontSize: 19, color: Garden.ink },
  line: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft },
  format: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  formatText: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.sageDeep },
});

// ─────────────────────────────────────────────────────────────────────────────
// Today sticky note
// ─────────────────────────────────────────────────────────────────────────────
export function TodayNote({ h }: { h: ParentHome }) {
  const todayYmd = toYMD(new Date());
  const todays = h.upcomingEvents.filter((e) => e.event_date === todayYmd);
  const next = h.upcomingEvents[0];
  return (
    <View style={{ paddingHorizontal: GUTTER + 4, marginBottom: 24, marginTop: 4 }}>
      <StickyNote tilt={-1.2}>
        <HandNote size={18} color="#7a5a00">
          {todays.length ? "today at Sage Field" : "coming up next"}
        </HandNote>
        {next ? (
          <PressableScale
            haptics="tap"
            pressedScale={0.98}
            accessibilityLabel={`${next.title}, ${formatEventTime(next)}`}
            onPress={() => {
              h.setSelectedEvent(next);
              h.eventSheetRef.current?.present();
            }}
          >
            <Text style={tn.title} numberOfLines={2}>
              {(todays[0] ?? next).title}
            </Text>
            <Text style={tn.meta}>
              {(todays[0] ?? next).event_date === todayYmd
                ? "Today"
                : new Date((todays[0] ?? next).event_date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
              {"  ·  "}
              {formatEventTime(todays[0] ?? next)}
            </Text>
            {todays.length > 1 ? <Text style={tn.more}>+{todays.length - 1} more today</Text> : null}
          </PressableScale>
        ) : (
          <Text style={tn.title}>No upcoming events</Text>
        )}
      </StickyNote>
    </View>
  );
}

const tn = StyleSheet.create({
  title: { fontFamily: GardenFonts.display, fontSize: 22, color: Garden.ink, marginTop: 2 },
  meta: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: "#5c4500", marginTop: 4 },
  more: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: "#7a5a00", marginTop: 6 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Children polaroids
// ─────────────────────────────────────────────────────────────────────────────
const POLAROID_TAPES = [Garden.butter, Garden.sky, Garden.lav, Garden.peach, Garden.mint];
const POLAROID_TILTS = [-2, 1.5, -1, 2, -1.5];

export function ChildrenPolaroids({ h, title = "Your children" }: { h: ParentHome; title?: string }) {
  if (h.loading) {
    return (
      <View style={{ marginBottom: 26 }}>
        <GardenSectionHeader title={title} />
        <View style={{ flexDirection: "row", gap: 14, paddingHorizontal: GUTTER }}>
          {[0, 1].map((i) => (
            <GardenSkeleton key={i} width={132} height={170} radius={6} />
          ))}
        </View>
      </View>
    );
  }
  if (h.students.length === 0) return null;
  return (
    <View style={{ marginBottom: 26 }}>
      <GardenSectionHeader title={title} onAction={() => h.router.push("/(tabs)/children" as any)} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 8 }}
      >
        {h.students.map((s, i) => {
          const first = s.child_legal_name.trim().split(/\s+/)[0] ?? s.child_legal_name;
          const teacher = h.teacherNameByStudentId[s.id] ?? null;
          return (
            <PressableScale
              key={s.id}
              accessibilityLabel={`${first}${teacher ? `, with ${teacher}` : ""}. View profile`}
              onPress={() =>
                h.router.push({ pathname: "/(tabs)/children" as any, params: { studentId: s.id } })
              }
            >
              <Polaroid
                uri={s.profile_image_url}
                initials={getInitials(s.child_legal_name)}
                caption={first}
                subcaption={teacher}
                tilt={POLAROID_TILTS[i % POLAROID_TILTS.length]}
                tapeColor={POLAROID_TAPES[i % POLAROID_TAPES.length]}
                bg={avatarColor(s.child_legal_name).bg}
              />
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message teachers
// ─────────────────────────────────────────────────────────────────────────────
export function TeacherChips({
  h,
  fb,
  title = "Messages",
}: {
  h: ParentHome;
  fb: GardenFeedback;
  title?: string;
}) {
  return (
    <View style={{ marginBottom: 26 }}>
      <GardenSectionHeader
        title={title}
        note="say hi to a teacher"
        onAction={() => h.router.push("/(tabs)/messages" as any)}
      />
      {h.teachersLoading ? (
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: GUTTER }}>
          {[0, 1, 2].map((i) => (
            <GardenSkeleton key={i} width={120} height={132} radius={22} />
          ))}
        </View>
      ) : h.teachers.length === 0 ? (
        <Text style={[common.muted, { paddingHorizontal: GUTTER }]}>No teachers available.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER, paddingBottom: 6 }}
        >
          {h.teachers.map((t) => {
            const c = avatarColor(t.full_name);
            const starting = h.startingConvTeacherId === t.id;
            return (
              <View key={t.id} style={tc.card}>
                {t.profile_image_url ? (
                  <Image source={{ uri: t.profile_image_url }} style={tc.avatar} contentFit="cover" />
                ) : (
                  <View style={[tc.avatar, { backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={[tc.initials, { color: c.text }]}>{getInitials(t.full_name)}</Text>
                  </View>
                )}
                <Text style={tc.name} numberOfLines={1}>
                  {abbreviateName(t.full_name)}
                </Text>
                <GardenButton
                  label="Message"
                  loadingLabel="Opening…"
                  loading={starting}
                  disabled={!!h.startingConvTeacherId && !starting}
                  size="sm"
                  tone="sage"
                  icon="chatbubble-ellipses-outline"
                  onPress={() => void fb.messageTeacher(t)}
                  accessibilityHint={`Opens a conversation with ${t.full_name}`}
                />
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const tc = StyleSheet.create({
  card: {
    width: 132,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    ...gardenCard,
    borderRadius: 24,
  },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  initials: { fontFamily: GardenFonts.display, fontSize: 18 },
  name: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.ink, maxWidth: 112 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Community
// ─────────────────────────────────────────────────────────────────────────────
export function CommunityCard({ h, style }: { h: ParentHome; style?: StyleProp<ViewStyle> }) {
  const open = () => {
    haptic.tap();
    h.router.push({ pathname: "/(tabs)/messages" as any, params: { tab: "community" } });
  };
  if (h.communityLoading) {
    return (
      <View style={[{ paddingHorizontal: GUTTER, marginBottom: 26 }, style]}>
        <GardenSkeleton width="100%" height={120} radius={GardenRadii.card} />
      </View>
    );
  }
  const msg = h.communityMsgs[h.communityIdx];
  return (
    <View style={[{ paddingHorizontal: GUTTER, marginBottom: 26 }, style]}>
      <PressableScale onPress={open} pressedScale={0.98} accessibilityLabel="Open the General community channel" style={cm.card}>
        <View style={cm.head}>
          <Pill tint="sky">💬 Community</Pill>
          <Text style={cm.title}>General</Text>
          <View style={{ flex: 1 }} />
          <View style={cm.join}>
            <Text style={cm.joinText}>Join Now</Text>
            <Ionicons name="chevron-forward" size={13} color={Garden.white} />
          </View>
        </View>
        {!h.communityIsMember ? (
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <Text style={{ fontSize: 26 }}>👋</Text>
            <View style={{ flex: 1 }}>
              <Text style={cm.inviteTitle}>Connect with Sage Field families</Text>
              <Text style={cm.inviteText}>
                Ask questions, share tips, and stay in the loop with other parents in the General channel.
              </Text>
            </View>
          </View>
        ) : h.communityMsgs.length === 0 || !msg ? (
          <Text style={cm.inviteText}>Be the first to post in the General channel!</Text>
        ) : (
          <Animated.View key={h.communityIdx} entering={FadeIn.duration(260)} style={cm.msgRow}>
            {msg.senderImageUrl ? (
              <Image source={{ uri: msg.senderImageUrl }} style={cm.avatar} contentFit="cover" />
            ) : (
              <View style={[cm.avatar, { backgroundColor: avatarColor(msg.senderName).bg, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: avatarColor(msg.senderName).text }}>
                  {getInitials(msg.senderName)}
                </Text>
              </View>
            )}
            <View style={cm.bubble}>
              <Text style={cm.sender}>{msg.senderName.split(" ")[0]}</Text>
              <Text style={cm.body} numberOfLines={2}>
                {msg.body}
              </Text>
            </View>
          </Animated.View>
        )}
        {h.communityMsgs.length > 1 ? (
          <View style={cm.dots}>
            {h.communityMsgs.map((_, i) => (
              <View key={i} style={[cm.dot, i === h.communityIdx && cm.dotActive]} />
            ))}
          </View>
        ) : null}
      </PressableScale>
    </View>
  );
}

const cm = StyleSheet.create({
  card: { ...gardenCard, backgroundColor: "#f3f9ff", padding: 16, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: GardenFonts.display, fontSize: 17, color: Garden.ink },
  join: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Garden.sage,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white },
  inviteTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  inviteText: { fontFamily: GardenFonts.body, fontSize: 13.5, lineHeight: 19, color: Garden.soft, marginTop: 2 },
  msgRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  bubble: {
    flex: 1,
    backgroundColor: Garden.white,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sender: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.sageDeep },
  body: { fontFamily: GardenFonts.body, fontSize: 14, color: Garden.ink, lineHeight: 19 },
  dots: { flexDirection: "row", gap: 5, justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(43,42,38,0.15)" },
  dotActive: { width: 16, backgroundColor: Garden.sage },
});

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming activities
// ─────────────────────────────────────────────────────────────────────────────
export function ActivitiesRail({ h }: { h: ParentHome }) {
  if (h.loading) return null;
  return (
    <View style={{ marginBottom: 26 }}>
      <View style={common.headerRow}>
        <Display size={22} style={{ flex: 1 }}>
          Upcoming Activities
        </Display>
        {h.eligibleAutoFillStudents.length > 0 ? (
          <PressableScale
            onPress={() => h.autoFillSheetRef.current?.present()}
            accessibilityLabel="Auto-Fill activity preferences"
            style={common.headerChip}
          >
            <Text style={common.headerChipText}>Auto-Fill ⚡</Text>
          </PressableScale>
        ) : null}
      </View>
      {h.weekActivitiesLoading ? (
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: GUTTER }}>
          {[0, 1, 2].map((i) => (
            <GardenSkeleton key={i} width={168} height={150} radius={22} />
          ))}
        </View>
      ) : h.weekActivities.length === 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="🎨" title="No upcoming activities." tint="lav" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={178}
          contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER, paddingBottom: 6 }}
        >
          {h.weekActivities.map((a) => {
            const thumb = a.images[0]?.signed_url ?? null;
            const date = a.activity_date
              ? new Date(a.activity_date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : null;
            return (
              <PressableScale
                key={a.id}
                onPress={() => void h.openActivityPreferenceSheet(a)}
                accessibilityLabel={`${a.title}${date ? `, ${date}` : ""}. Set preferences`}
                style={ac.card}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={ac.thumb} contentFit="cover" />
                ) : (
                  <View style={[ac.thumb, { backgroundColor: Garden.lav, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ fontSize: 26 }}>🎨</Text>
                  </View>
                )}
                {date ? (
                  <View style={ac.date}>
                    <Text style={ac.dateText}>{date}</Text>
                  </View>
                ) : null}
                <Text style={ac.title} numberOfLines={2}>
                  {a.title}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  card: { width: 168, ...gardenCard, borderRadius: 22, overflow: "hidden", paddingBottom: 12 },
  thumb: { width: "100%", height: 96 },
  date: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.sageDeep },
  title: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.ink, paddingHorizontal: 12, paddingTop: 10, lineHeight: 18 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming events + share
// ─────────────────────────────────────────────────────────────────────────────
function EventRow({ h, evt }: { h: ParentHome; evt: CalendarEvent }) {
  const d = new Date(evt.event_date + "T12:00:00");
  return (
    <PressableScale
      pressedScale={0.98}
      accessibilityLabel={`${evt.title}, ${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${formatEventTime(evt)}`}
      accessibilityHint="Shows event details"
      onPress={() => {
        h.setSelectedEvent(evt);
        h.eventSheetRef.current?.present();
      }}
      style={ev.row}
    >
      <View style={[ev.date, { backgroundColor: evt.color + "22" }]}>
        <Text style={[ev.mo, { color: evt.color }]}>{d.toLocaleDateString("en-US", { month: "short" })}</Text>
        <Text style={[ev.day, { color: evt.color }]}>{d.getDate()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ev.title} numberOfLines={2}>
          {evt.title}
        </Text>
        <Text style={ev.meta}>
          {d.toLocaleDateString("en-US", { weekday: "short" })} · {formatEventTime(evt)}
        </Text>
      </View>
      {evt.category ? (
        <View style={[ev.cat, { backgroundColor: evt.color + "22" }]}>
          <Text style={[ev.catText, { color: evt.color }]} numberOfLines={1}>
            {evt.category}
          </Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
    </PressableScale>
  );
}

export function ShareEventCard({ h }: { h: ParentHome }) {
  return (
    <PressableScale
      onPress={() => h.router.push("/(tabs)/calendar?addEvent=1" as any)}
      accessibilityLabel="Share an event"
      pressedScale={0.98}
      style={ev.share}
    >
      <View style={ev.shareIcon}>
        <Ionicons name="sparkles" size={18} color={Garden.sageDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ev.shareTitle}>Share an event!</Text>
        <Text style={ev.shareSub}>Share with other Sagefield families</Text>
      </View>
      <Ionicons name="add-circle" size={28} color={Garden.white} />
    </PressableScale>
  );
}

export function EventsList({ h, showShare = true }: { h: ParentHome; showShare?: boolean }) {
  if (h.loading) {
    return (
      <View style={{ marginBottom: 26 }}>
        <GardenSectionHeader title="Upcoming events" />
        <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <GardenSkeleton key={i} width="100%" height={66} radius={20} />
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 26 }}>
      <GardenSectionHeader title="Upcoming events" onAction={() => h.router.push("/(tabs)/calendar" as any)} />
      <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
        {h.upcomingEvents.length === 0 ? (
          <GardenEmpty emoji="📅" title="No upcoming events" tint="sky" />
        ) : (
          h.upcomingEvents.map((evt) => <EventRow key={evt.id} h={h} evt={evt} />)
        )}
        {showShare ? <ShareEventCard h={h} /> : null}
      </View>
    </View>
  );
}

const ev = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 66,
    ...gardenCard,
    borderRadius: 20,
  },
  date: { width: 46, borderRadius: 14, alignItems: "center", paddingVertical: 6 },
  mo: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, textTransform: "uppercase" },
  day: { fontFamily: GardenFonts.display, fontSize: 20, lineHeight: 22 },
  title: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  meta: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.soft, marginTop: 1 },
  cat: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 90 },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5 },
  share: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    padding: 14,
    backgroundColor: Garden.sage,
    borderBottomWidth: 4,
    borderBottomColor: Garden.sageDeep,
  },
  shareIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  shareTitle: { fontFamily: GardenFonts.display, fontSize: 17, color: Garden.white },
  shareSub: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: "rgba(255,255,255,0.88)" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Tuition & billing
// ─────────────────────────────────────────────────────────────────────────────
function useTuitionCards(h: ParentHome) {
  return useMemo(
    () =>
      buildHomeTuitionCards({
        applications: h.applications,
        students: h.students,
        paidSupplyFeeByStudent: h.paidSupplyFeeByStudent,
        paidSchoolYearByStudent: h.paidSchoolYearByStudent,
        paidAftercareByStudent: h.paidAftercareByStudent,
        paidFunFridayByStudent: h.paidFunFridayByStudent,
        paidHomeschoolByStudent: h.paidHomeschoolByStudent,
        pendingPayments: h.pendingPayments,
      }),
    [
      h.applications,
      h.students,
      h.paidSupplyFeeByStudent,
      h.paidSchoolYearByStudent,
      h.paidAftercareByStudent,
      h.paidFunFridayByStudent,
      h.paidHomeschoolByStudent,
      h.pendingPayments,
    ],
  );
}

function TuitionPostcard({ card, onPress, width }: { card: HomeTuitionCard; onPress: () => void; width?: number }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${card.title}. ${card.badge ? card.badge + ". " : ""}${card.statusLine}`}
      style={[tu.card, width ? { width } : null]}
    >
      <View style={tu.banner}>
        <Image source={card.image} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={StyleSheet.absoluteFill} />
        <Text style={tu.label}>{card.programLabel}</Text>
        {card.badge ? (
          <View style={tu.badge}>
            <Text style={tu.badgeText}>{card.badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12, gap: 3 }}>
        <Text style={tu.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text
          style={[tu.status, /paid ✓|active|manage plan|add months/i.test(card.statusLine) && { color: Garden.sageDeep }]}
          numberOfLines={1}
        >
          {card.statusLine}
        </Text>
      </View>
    </PressableScale>
  );
}

export function TuitionSection({ h }: { h: ParentHome }) {
  const { programCards, hasAnything } = useTuitionCards(h);
  const go = h.goToTuition;
  if (h.loading) return null;
  return (
    <View style={{ marginBottom: 26 }}>
      <GardenSectionHeader title="Tuition & billing" onAction={go} />
      {h.tuitionLoading ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenSkeleton width="100%" height={80} radius={22} />
        </View>
      ) : !hasAnything ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty
            emoji="✅"
            title="All caught up!"
            body="No pending payments"
            actionLabel="See payment history"
            onAction={go}
          />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={220}
          contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER, paddingBottom: 6 }}
        >
          {programCards.map((c) => (
            <TuitionPostcard key={c.key} card={c} onPress={go} width={210} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const tu = StyleSheet.create({
  card: { ...gardenCard, borderRadius: 24, overflow: "hidden" },
  banner: { height: 104, justifyContent: "flex-end" },
  label: {
    position: "absolute",
    left: 12,
    bottom: 9,
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.95)",
    textTransform: "uppercase",
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 9,
    backgroundColor: Garden.butter,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    transform: [{ rotate: "3deg" }],
  },
  badgeText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.ink },
  title: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink, lineHeight: 19 },
  status: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.coralDeep },
});

// ─────────────────────────────────────────────────────────────────────────────
// Newsletters
// ─────────────────────────────────────────────────────────────────────────────
export function NewslettersRail({ h }: { h: ParentHome }) {
  if (h.loading || (!h.newslettersLoading && h.homeNewsletters.length === 0)) return null;
  return (
    <View style={{ marginBottom: 26 }}>
      <GardenSectionHeader title="Newsletters" onAction={() => h.router.push("/(tabs)/newsletters" as any)} />
      {h.newslettersLoading ? (
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: GUTTER }}>
          {[0, 1].map((i) => (
            <GardenSkeleton key={i} width={170} height={150} radius={22} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER, paddingBottom: 6 }}
        >
          {h.homeNewsletters.map((item) => (
            <PressableScale
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={`${item.title}, ${item.week_range}. Opens in browser`}
              onPress={() => Linking.openURL(`${API_BASE_URL}/newsletter/${item.id}`)}
              style={nl.card}
            >
              <View style={nl.image}>
                {item.cover_image_url ? (
                  <Image source={{ uri: item.cover_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Text style={{ fontSize: 28 }}>📰</Text>
                )}
              </View>
              <View style={{ padding: 11, gap: 2 }}>
                <Text style={nl.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={nl.week} numberOfLines={1}>
                  {item.week_range}
                </Text>
                {item.access_password ? (
                  <View style={nl.pw}>
                    <Ionicons name="lock-closed-outline" size={11} color={Garden.soft} />
                    <Text style={nl.week}>Password: </Text>
                    <Text selectable style={[nl.week, { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink }]}>
                      {item.access_password}
                    </Text>
                  </View>
                ) : null}
              </View>
            </PressableScale>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const nl = StyleSheet.create({
  card: { width: 170, ...gardenCard, borderRadius: 22, overflow: "hidden" },
  image: { aspectRatio: 16 / 9, width: "100%", backgroundColor: Garden.peach, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.ink, lineHeight: 18 },
  week: { fontFamily: GardenFonts.body, fontSize: 11.5, color: Garden.soft },
  pw: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Photos, rewards, feedback
// ─────────────────────────────────────────────────────────────────────────────
export function PhotosCta({ h, style }: { h: ParentHome; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingHorizontal: GUTTER, marginBottom: 16 }, style]}>
      <PressableScale
        onPress={() => h.router.push("/(tabs)/photos" as any)}
        accessibilityLabel="See This Week's Photos"
        pressedScale={0.98}
        style={pc.card}
      >
        <View style={pc.stack} aria-hidden>
          <View style={[pc.mini, { transform: [{ rotate: "-8deg" }], backgroundColor: Garden.sky }]} />
          <View style={[pc.mini, { transform: [{ rotate: "6deg" }], backgroundColor: Garden.butter, position: "absolute" }]}>
            <Text style={{ fontSize: 20 }}>📸</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pc.title}>See This Week&apos;s Photos</Text>
          <Text style={pc.sub}>See what&apos;s been happening ✨</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#a2522a" />
      </PressableScale>
    </View>
  );
}

const pc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: GardenRadii.card,
    backgroundColor: Garden.peach,
  },
  stack: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  mini: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink },
  sub: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: "#a2522a", marginTop: 1 },
});

export function RewardsCard({ h, style }: { h: ParentHome; style?: StyleProp<ViewStyle> }) {
  if (h.loading) return null;
  return (
    <View style={[{ paddingHorizontal: GUTTER, marginBottom: 16 }, style]}>
      <PressableScale
        onPress={() => h.router.push("/(tabs)/rewards")}
        accessibilityLabel="Rewards. Earn up to $515. Explore Rewards"
        pressedScale={0.98}
        style={rw.card}
      >
        <Pill tint="butter">🎁 Rewards</Pill>
        <Display size={30} color={Garden.white} style={{ marginTop: 10 }}>
          Earn up to $515
        </Display>
        <View style={rw.chips}>
          <View style={rw.chip}>
            <Text style={rw.chipText}>🎁 $500 Referral</Text>
          </View>
          <View style={rw.chip}>
            <Text style={rw.chipText}>☕ $15 Starbucks</Text>
          </View>
        </View>
        <View style={rw.footer}>
          <Text style={rw.footerText}>Explore Rewards</Text>
          <Ionicons name="arrow-forward" size={14} color={Garden.sageDeep} />
        </View>
      </PressableScale>
    </View>
  );
}

const rw = StyleSheet.create({
  card: { borderRadius: GardenRadii.panel, padding: 20, backgroundColor: Garden.sageDeep, overflow: "hidden" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: GardenFonts.bodyBold, fontSize: 13, color: Garden.white },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: Garden.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  footerText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.sageDeep },
});

export function FeedbackCard({ h, style }: { h: ParentHome; style?: StyleProp<ViewStyle> }) {
  if (h.loading) return null;
  return (
    <View style={[{ paddingHorizontal: GUTTER, marginBottom: 16 }, style]}>
      <View style={fbk.card}>
        <Pill tint="lav">✨ Share Your Feedback</Pill>
        <Text style={fbk.desc}>
          How&apos;s your experience with Sage Field so far? A minute of honest feedback helps us build
          something every family loves.
        </Text>
        <GardenButton
          label="Share Feedback"
          tone="ink"
          size="sm"
          iconRight="arrow-forward"
          onPress={() => h.router.push("/(tabs)/feedback" as any)}
        />
      </View>
    </View>
  );
}

const fbk = StyleSheet.create({
  card: { ...gardenCard, backgroundColor: "#faf6fc", padding: 18, gap: 12 },
  desc: { fontFamily: GardenFonts.body, fontSize: 14, lineHeight: 20, color: Garden.soft },
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────
export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Garden.cream },
  muted: { fontFamily: GardenFonts.body, fontSize: 13.5, color: Garden.muted },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    marginBottom: 12,
    gap: 12,
  },
  headerChip: {
    backgroundColor: Garden.butter,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
  },
  headerChipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.ink },
});
