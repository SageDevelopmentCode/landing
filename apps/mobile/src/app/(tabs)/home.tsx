import { HomeHeroHeader } from "@/components/HomeHeroHeader";
import { YourChildrenSection } from "@/components/YourChildrenSection";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import {
  FallLeavesOverlay,
  markFallLeavesPlayed,
  shouldPlayFallLeaves,
} from "@/components/FallLeavesOverlay";
import { ParentActivityPreferenceSheet } from "@/components/ParentActivityPreferenceSheet";
import { AutoFillPreferencesSheet } from "@/components/AutoFillPreferencesSheet";
import { ParentTeacherConferenceSheet } from "@/components/ParentTeacherConferenceSheet";
import { BottomTabInset, Brand, FontFamilies } from "@/constants/theme";
import { API_BASE_URL } from "@/constants/config";
import { useAuth } from "@/contexts/AuthContext";
import { getChannels } from "@/lib/channel-actions";
import { isFieldFridayCalendarEvent } from "@/lib/calendar";
import { computePaidDates } from "@/lib/compute-paid-dates";
import {
  computeHasUnsetActivityPreference,
  findFirstUnsetActivity,
} from "@/lib/activity-preferences";
import type { ParticipationLevel } from "@/lib/activity-preferences";
import {
  childHasVisibleUpcomingActivity,
  persistStudentDefaultPreference,
  type StudentDefaultPreference,
} from "@/lib/default-preferences";
import type { DefaultSaveStatus } from "@/components/AutoFillPreferenceCard";
import { getActivities, type Activity } from "@/lib/activities-actions";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { getPublishedNewsletters, type ParentNewsletterListItem } from "@/lib/newsletters-actions";
import { fetchParentVisibleTeachers } from "@/lib/parent-visible-teachers";
import {
  abbreviateName,
  fetchSchoolYearTeachersForStudents,
} from "@/lib/student-teacher-assignments";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getSchoolYearTuitionStudentIds,
  getTuitionActionSubtext,
  needsConferenceScheduling,
  needsSchoolYearTuitionAction,
  type PaidSchoolYearByStudent,
} from "@/lib/action-needed";
import { fetchConferenceContext } from "@/lib/conference-actions";
import {
  getPtcBannerSubtext,
  type ConferenceBookingRecord,
  type ConferenceStudentContext,
  type ConferenceTeacherDisplay,
} from "@/lib/parent-teacher-conference";
import {
  countSchoolYearAftercarePaidMonths,
  countSchoolYearFunFridayPaidMonths,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";

function formatHomeCardStatus(names: string[], status: string): string {
  if (names.length === 0) return status;
  return `${names.join(", ")} · ${status}`;
}

const HOME_CARD_IMAGES = {
  summer: require("../../../assets/images/stock/Stock1.webp"),
  aftercare: require("../../../assets/images/stock/Stock2.webp"),
  funFriday: require("../../../assets/images/stock/Stock3.webp"),
  schoolYear: require("../../../assets/images/stock/Stock4.webp"),
  homeschool: require("../../../assets/images/stock/Stock5.webp"),
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type HomeApplicationRow = {
  id: string;
  student_id: string;
  status: string;
  program: string | null;
  drop_in_program: string | null;
  child_legal_name: string | null;
};

function buildDropInProgramByStudent(
  applications: HomeApplicationRow[],
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const app of applications) {
    if (app.status === "enrolled" && app.program === "homeschool_drop_in") {
      result[app.student_id] = app.drop_in_program;
    }
  }
  return result;
}

type TeacherSuggestion = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

type NotifItem = {
  id: string;
  kind: "direct" | "channel";
  name: string;
  preview: string;
  timestamp: string;
  unreadCount: number;
  conversationId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  otherUserId?: string;
  channelId?: string;
  channelName?: string;
  isMember?: boolean;
  isDefault?: boolean;
  memberCount?: number;
};

// ---------------------------------------------------------------------------
// Calendar helpers (upcoming events)
// ---------------------------------------------------------------------------

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
};

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatEventTime(evt: CalendarEvent): string {
  if (evt.is_all_day) return "All day";
  if (evt.start_time && evt.end_time)
    return `${fmt12(evt.start_time)} – ${fmt12(evt.end_time)}`;
  if (evt.start_time) return fmt12(evt.start_time);
  return "All day";
}

function formatFullDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Onboarding checklist
// ---------------------------------------------------------------------------

const CHECKLIST_TASKS = [
  {
    id: "upload_photo",
    label: "Add your child's photo",
    desc: "Upload a profile photo for your child",
    icon: "camera-outline" as const,
    color: "#7c3aed",
  },
  {
    id: "view_teachers",
    label: "Meet your child's teachers",
    desc: "View the teachers assigned to your child",
    icon: "school-outline" as const,
    color: "#2563eb",
  },
  {
    id: "introduce_community",
    label: "Introduce yourself to the community",
    desc: "Say hello in the community chat",
    icon: "people-outline" as const,
    color: "#6366f1",
  },
  {
    id: "send_message",
    label: "Send your first message",
    desc: "Send a message to a teacher",
    icon: "chatbubble-outline" as const,
    color: "#0284c7",
  },
  {
    id: "setup_tuition",
    label: "Set up tuition",
    desc: "Review tuition details and payment options",
    icon: "card-outline" as const,
    color: "#059669",
  },
  {
    id: "react_post",
    label: "React to a post",
    desc: "Engage with a post on the classroom feed",
    icon: "happy-outline" as const,
    color: "#d97706",
  },
  {
    id: "check_events",
    label: "Check upcoming events",
    desc: "Browse the school calendar",
    icon: "calendar-outline" as const,
    color: "#e11d48",
  },
  {
    id: "add_pickup",
    label: "Add an authorized pickup",
    desc: "Add a person authorized to pick up your child",
    icon: "person-add-outline" as const,
    color: "#ea580c",
  },
] as const;

const TOTAL_TASKS = 8;

// ---------------------------------------------------------------------------
// Intro slideshow — static preview components
// ---------------------------------------------------------------------------

const previewStyles = StyleSheet.create({
  checkinWrap: { flex: 1, backgroundColor: "#EEF5EF", padding: 16, gap: 12 },
  checkinSectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#4b5563",
  },
  checkinRow: { flexDirection: "row", gap: 10 },
  checkinCard: {
    width: 120,
    borderRadius: 14,
    backgroundColor: "#D6EAD8",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  checkinCardInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  checkinAvatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  checkinAvatarRingInactive: { borderColor: "transparent" },
  checkinAvatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkinAvatarInnerActive: { backgroundColor: "#EEF5EF" },
  checkinInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  checkinName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#1a3320",
  },
  checkinGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#5a7a61",
  },
  checkinTime: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: Brand.sage700,
  },
  checkinBtn: {
    marginTop: 6,
    width: "100%",
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: "center",
    backgroundColor: Brand.sage700,
  },
  checkinBtnPickup: { backgroundColor: "rgba(255,255,255,0.6)" },
  checkinBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
  },
  checkinBtnPickupText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
  },

  calendarWrap: { flex: 1, backgroundColor: "#fff", paddingTop: 14 },
  calWeekStrip: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  calWeekCol: { flex: 1, alignItems: "center", gap: 4 },
  calWeekLetter: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#9ca3af",
    letterSpacing: 0.3,
  },
  calDayNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayNumActive: { backgroundColor: Brand.sage700 },
  calDayTxt: { fontFamily: FontFamilies.body, fontSize: 12, color: "#374151" },
  calDayTxtActive: { fontFamily: FontFamilies.bodySemiBold, color: "#fff" },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  calEventsArea: { padding: 14, gap: 8 },
  calEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
  },
  calEventAccent: { width: 3, height: 30, borderRadius: 9999, flexShrink: 0 },
  calEventTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#1f2937",
  },
  calEventTime: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },

  messagesWrap: { flex: 1, backgroundColor: "#fff" },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  msgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: Brand.sage700,
  },
  msgBody: { flex: 1, gap: 2 },
  msgTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  msgName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1f2937",
  },
  msgTime: { fontFamily: FontFamilies.body, fontSize: 10, color: "#9ca3af" },
  msgPreview: { fontFamily: FontFamilies.body, fontSize: 11, color: "#6b7280" },
  msgUnread: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.sage700,
    flexShrink: 0,
  },

  feedWrap: { flex: 1, backgroundColor: "#f9fafb", padding: 12 },
  feedPost: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 10,
  },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
  },
  feedAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage700,
  },
  feedTeacher: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#1f2937",
  },
  feedMeta: { fontFamily: FontFamilies.body, fontSize: 10, color: "#9ca3af" },
  feedText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#374151",
    lineHeight: 18,
  },
  feedReactions: { flexDirection: "row", gap: 8 },
  feedReaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  feedReactionCount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#374151",
  },

  feedCommentSection: { marginTop: 4, gap: 6 },
  feedCommentLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#6b7280",
  },
  feedCommentRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  feedCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  feedCommentAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: Brand.sage700,
  },
  feedCommentBubble: {
    flex: 1,
    backgroundColor: "#EEF4EF",
    borderRadius: 12,
    borderTopLeftRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  feedCommentAuthor: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#4b5563",
  },
  feedCommentText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#1f2937",
    lineHeight: 16,
  },
  feedCommentTime: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 2,
  },

  tuitionWrap: { flex: 1, backgroundColor: "#fff", padding: 14, gap: 10 },
  tuitionCardRow: { flexDirection: "row", gap: 8 },
  tuitionCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  tuitionCardBanner: { height: 80, justifyContent: "flex-end", padding: 8 },
  tuitionCardBannerLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.4,
  },
  tuitionCardBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tuitionCardBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 8,
    color: "#374151",
  },
  tuitionCardBody: { padding: 8, gap: 3 },
  tuitionCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#111827",
    lineHeight: 15,
  },
  tuitionCardStatus: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#9CA3AF",
  },
  tuitionHistorySection: { gap: 6 },
  tuitionHistoryLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#9CA3AF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tuitionTxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
  },
  tuitionTxAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E8F0EA",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tuitionTxAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: Brand.sage800,
  },
  tuitionTxBody: { flex: 1, gap: 2 },
  tuitionTxDesc: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#111827",
  },
  tuitionTxMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 9,
    color: "#9CA3AF",
  },
  tuitionTxRight: { alignItems: "flex-end", gap: 3 },
  tuitionTxAmount: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#111827",
  },
  tuitionPaidBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tuitionPaidBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 9,
    color: "#15803d",
  },
});

function CheckinPreview() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(progress, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.delay(2000),
        Animated.timing(progress, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const animCardBg = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#D6EAD8"],
  });
  const animCardBorder = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#e5e7eb", "#D6EAD8"],
  });
  const animRingBorder = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", Brand.sage700],
  });
  const animCheckinOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [1, 0, 0, 0],
  });
  const animPickupOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [0, 0, 1, 1],
  });
  const animTimeOpacity = progress.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={previewStyles.checkinWrap}>
      <Text style={previewStyles.checkinSectionLabel}>
        Ready to start the day?
      </Text>
      <View style={previewStyles.checkinRow}>
        {/* Emma — animates between unchecked and checked */}
        <Animated.View
          style={[
            previewStyles.checkinCard,
            previewStyles.checkinCardInactive,
            {
              backgroundColor: animCardBg as any,
              borderColor: animCardBorder as any,
            },
          ]}
        >
          <Animated.View
            style={[
              previewStyles.checkinAvatarRing,
              { borderColor: animRingBorder as any },
            ]}
          >
            <View style={previewStyles.checkinAvatarInner}>
              <Text style={previewStyles.checkinInitials}>EJ</Text>
            </View>
          </Animated.View>
          <Text style={previewStyles.checkinName}>Emma</Text>
          <Text style={previewStyles.checkinGrade}>2nd Grade</Text>
          <Animated.View style={{ opacity: animTimeOpacity }}>
            <Text style={previewStyles.checkinTime}>since 2m ago</Text>
          </Animated.View>
          <View style={{ width: "100%", height: 28, marginTop: 6 }}>
            <Animated.View
              style={[
                previewStyles.checkinBtn,
                {
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  marginTop: 0,
                  opacity: animCheckinOpacity,
                },
              ]}
            >
              <Text style={previewStyles.checkinBtnText}>Check in</Text>
            </Animated.View>
            <Animated.View
              style={[
                previewStyles.checkinBtn,
                previewStyles.checkinBtnPickup,
                {
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  marginTop: 0,
                  opacity: animPickupOpacity,
                },
              ]}
            >
              <Text style={previewStyles.checkinBtnPickupText}>Pick up</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Liam — static (always checked in) */}
        <View style={previewStyles.checkinCard}>
          <View style={previewStyles.checkinAvatarRing}>
            <View
              style={[
                previewStyles.checkinAvatarInner,
                previewStyles.checkinAvatarInnerActive,
              ]}
            >
              <Text style={previewStyles.checkinInitials}>LM</Text>
            </View>
          </View>
          <Text style={previewStyles.checkinName}>Liam</Text>
          <Text style={previewStyles.checkinGrade}>4th Grade</Text>
          <Text style={previewStyles.checkinTime}>since 2m ago</Text>
          <View
            style={[previewStyles.checkinBtn, previewStyles.checkinBtnPickup]}
          >
            <Text style={previewStyles.checkinBtnPickupText}>Pick up</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CAL_DAYS_EVENTS = [
  [{ title: "Library Day", time: "9:00 AM", color: "#7c3aed" }],
  [
    { title: "Spring Showcase", time: "10:00 AM", color: "#3b82f6" },
    { title: "Lunch Special: Pizza", time: "All day", color: "#f59e0b" },
  ],
  [{ title: "Parent–Teacher Conf.", time: "All day", color: "#10b981" }],
  [{ title: "Yoga Class", time: "1:30 PM", color: "#f97316" }],
  [
    { title: "Field Trip", time: "8:30 AM", color: "#ef4444" },
    { title: "Early Dismissal", time: "1:00 PM", color: "#8b5cf6" },
  ],
];

function CalendarPreview() {
  const [activeDay, setActiveDay] = useState(1); // drives week strip (immediate)
  const [displayDay, setDisplayDay] = useState(1); // drives events (delayed by fade-out)
  const eventsOpacity = useRef(new Animated.Value(1)).current;
  const highlightOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setActiveDay((d) => (d + 1) % 5), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const FADE_OUT = 200;
    highlightOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(eventsOpacity, {
        toValue: 0,
        duration: FADE_OUT,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(eventsOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(highlightOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const t = setTimeout(() => setDisplayDay(activeDay), FADE_OUT);
    return () => clearTimeout(t);
  }, [activeDay]);

  const days = [
    { letter: "M", num: 13, dot: false },
    { letter: "T", num: 14, dot: true },
    { letter: "W", num: 15, dot: true },
    { letter: "T", num: 16, dot: false },
    { letter: "F", num: 17, dot: false },
  ];

  return (
    <View style={previewStyles.calendarWrap}>
      <View style={previewStyles.calWeekStrip}>
        {days.map((d, i) => {
          const isActive = i === activeDay;
          return (
            <View key={i} style={previewStyles.calWeekCol}>
              <Text style={previewStyles.calWeekLetter}>{d.letter}</Text>
              {isActive ? (
                <Animated.View
                  style={[
                    previewStyles.calDayNum,
                    previewStyles.calDayNumActive,
                    { opacity: highlightOpacity },
                  ]}
                >
                  <Text
                    style={[
                      previewStyles.calDayTxt,
                      previewStyles.calDayTxtActive,
                    ]}
                  >
                    {d.num}
                  </Text>
                </Animated.View>
              ) : (
                <View style={previewStyles.calDayNum}>
                  <Text style={previewStyles.calDayTxt}>{d.num}</Text>
                </View>
              )}
              <View
                style={[
                  previewStyles.calDot,
                  {
                    backgroundColor: d.dot
                      ? isActive
                        ? "#fff"
                        : "#3b82f6"
                      : "transparent",
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <Animated.View
        style={[previewStyles.calEventsArea, { opacity: eventsOpacity }]}
      >
        {CAL_DAYS_EVENTS[displayDay].map((evt, i) => (
          <View key={i} style={previewStyles.calEventRow}>
            <View
              style={[
                previewStyles.calEventAccent,
                { backgroundColor: evt.color },
              ]}
            />
            <View>
              <Text style={previewStyles.calEventTitle}>{evt.title}</Text>
              <Text style={previewStyles.calEventTime}>{evt.time}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function MessagesPreview() {
  const dotScale = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(dotScale, {
          toValue: 1.7,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    ).start();

    let mounted = true;
    const animateSlide = () => {
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(slideY, {
          toValue: -60,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (mounted && finished) animateSlide();
      });
    };
    animateSlide();

    return () => {
      mounted = false;
    };
  }, []);

  const threads = [
    {
      initials: "SO",
      name: "Ms. Sabrina",
      preview: "Emma did great in reading group today!",
      time: "2m ago",
      unread: true,
    },
    {
      initials: "ZM",
      name: "Ms. Zelinda",
      preview: "Reminder: Show and tell is on Friday",
      time: "1h ago",
      unread: false,
    },
    {
      initials: "PW",
      name: "Ms. Paige",
      preview: "Thanks for the update on Liam's allergy",
      time: "Yesterday",
      unread: false,
    },
  ];

  return (
    <View style={previewStyles.messagesWrap}>
      {/* Incoming message slides down from top (clipped by card's overflow:hidden) */}
      <Animated.View
        style={[
          previewStyles.msgRow,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: "#fff",
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={previewStyles.msgAvatar}>
          <Text style={previewStyles.msgAvatarText}>MC</Text>
        </View>
        <View style={previewStyles.msgBody}>
          <View style={previewStyles.msgTopRow}>
            <Text style={previewStyles.msgName}>Ms. Clara</Text>
            <Text style={previewStyles.msgTime}>now</Text>
          </View>
          <Text style={previewStyles.msgPreview} numberOfLines={1}>
            Liam was so helpful today! ☀️
          </Text>
        </View>
        <View style={previewStyles.msgUnread} />
      </Animated.View>

      {/* Existing threads — padded down to leave a slot for the sliding row */}
      <View style={{ paddingTop: 60 }}>
        {threads.map((t, i) => (
          <View key={i} style={previewStyles.msgRow}>
            <View style={previewStyles.msgAvatar}>
              <Text style={previewStyles.msgAvatarText}>{t.initials}</Text>
            </View>
            <View style={previewStyles.msgBody}>
              <View style={previewStyles.msgTopRow}>
                <Text style={previewStyles.msgName}>{t.name}</Text>
                <Text style={previewStyles.msgTime}>{t.time}</Text>
              </View>
              <Text style={previewStyles.msgPreview} numberOfLines={1}>
                {t.preview}
              </Text>
            </View>
            {t.unread && (
              <Animated.View
                style={[
                  previewStyles.msgUnread,
                  { transform: [{ scale: dotScale }] },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function FeedPreview() {
  const c1Opacity = useRef(new Animated.Value(0)).current;
  const c1Y = useRef(new Animated.Value(8)).current;
  const c2Opacity = useRef(new Animated.Value(0)).current;
  const c2Y = useRef(new Animated.Value(8)).current;
  const c3Opacity = useRef(new Animated.Value(0)).current;
  const c3Y = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    const animateComments = () => {
      [c1Opacity, c2Opacity, c3Opacity].forEach((v) => v.setValue(0));
      [c1Y, c2Y, c3Y].forEach((v) => v.setValue(8));
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(c1Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c1Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(c2Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c2Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(c3Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c3Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(c1Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c2Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c3Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (mounted && finished) animateComments();
      });
    };
    animateComments();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={previewStyles.feedWrap}>
      <View style={previewStyles.feedPost}>
        <View style={previewStyles.feedHeader}>
          <View style={previewStyles.feedAvatar}>
            <Text style={previewStyles.feedAvatarText}>SB</Text>
          </View>
          <View>
            <Text style={previewStyles.feedTeacher}>Ms. Sabrina</Text>
            <Text style={previewStyles.feedMeta}>Classroom · 2h ago</Text>
          </View>
        </View>
        <Text style={previewStyles.feedText}>
          We had a wonderful time learning about ecosystems today! 🌿 The kids
          built their own mini terrariums.
        </Text>
        <View style={previewStyles.feedReactions}>
          {[
            ["❤️", "12"],
            ["🎉", "8"],
            ["👏", "5"],
          ].map(([emoji, count]) => (
            <View key={emoji} style={previewStyles.feedReaction}>
              <Text>{emoji}</Text>
              <Text style={previewStyles.feedReactionCount}>{count}</Text>
            </View>
          ))}
        </View>
        <View style={previewStyles.feedCommentSection}>
          <Text style={previewStyles.feedCommentLabel}>Comments</Text>
          <Animated.View
            style={[
              previewStyles.feedCommentRow,
              { opacity: c1Opacity, transform: [{ translateY: c1Y }] },
            ]}
          >
            <View style={previewStyles.feedCommentAvatar}>
              <Text style={previewStyles.feedCommentAvatarText}>MJ</Text>
            </View>
            <View style={previewStyles.feedCommentBubble}>
              <Text style={previewStyles.feedCommentAuthor}>Maria J.</Text>
              <Text style={previewStyles.feedCommentText}>
                So sweet! My son came home talking about it 🌿
              </Text>
              <Text style={previewStyles.feedCommentTime}>2h ago</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              previewStyles.feedCommentRow,
              { opacity: c2Opacity, transform: [{ translateY: c2Y }] },
            ]}
          >
            <View style={previewStyles.feedCommentAvatar}>
              <Text style={previewStyles.feedCommentAvatarText}>TR</Text>
            </View>
            <View style={previewStyles.feedCommentBubble}>
              <Text style={previewStyles.feedCommentAuthor}>Tom R.</Text>
              <Text style={previewStyles.feedCommentText}>
                Emma loved it too! Great idea Ms. Sabrina ❤️
              </Text>
              <Text style={previewStyles.feedCommentTime}>1h ago</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              previewStyles.feedCommentRow,
              { opacity: c3Opacity, transform: [{ translateY: c3Y }] },
            ]}
          >
            <View style={previewStyles.feedCommentAvatar}>
              <Text style={previewStyles.feedCommentAvatarText}>KL</Text>
            </View>
            <View style={previewStyles.feedCommentBubble}>
              <Text style={previewStyles.feedCommentAuthor}>Kim L.</Text>
              <Text style={previewStyles.feedCommentText}>
                Can we get the terrarium instructions? 😊
              </Text>
              <Text style={previewStyles.feedCommentTime}>just now</Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function TuitionPreview() {
  const r1Opacity = useRef(new Animated.Value(0)).current;
  const r1Y = useRef(new Animated.Value(8)).current;
  const r2Opacity = useRef(new Animated.Value(0)).current;
  const r2Y = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    const animate = () => {
      [r1Opacity, r2Opacity].forEach((v) => v.setValue(0));
      [r1Y, r2Y].forEach((v) => v.setValue(8));
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(r1Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(r1Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(r2Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(r2Y, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(r1Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(r2Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (mounted && finished) animate();
      });
    };
    animate();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={previewStyles.tuitionWrap}>
      <View style={previewStyles.tuitionCardRow}>
        <View style={previewStyles.tuitionCard}>
          <View style={previewStyles.tuitionCardBanner}>
            <Image
              source={require("../../../assets/images/stock/Stock2.webp")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.54)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={previewStyles.tuitionCardBannerLabel}>
              SCHOOL YEAR 26–27
            </Text>
            <View style={previewStyles.tuitionCardBadge}>
              <Text style={previewStyles.tuitionCardBadgeText}>$300</Text>
            </View>
          </View>
          <View style={previewStyles.tuitionCardBody}>
            <Text style={previewStyles.tuitionCardTitle} numberOfLines={2}>
              Annual Supply Fee
            </Text>
            <Text style={previewStyles.tuitionCardStatus}>Pay now</Text>
          </View>
        </View>
        <View style={previewStyles.tuitionCard}>
          <View style={previewStyles.tuitionCardBanner}>
            <Image
              source={require("../../../assets/images/stock/Stock1.webp")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.54)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={previewStyles.tuitionCardBannerLabel}>
              SCHOOL YEAR 26–27
            </Text>
            <View style={previewStyles.tuitionCardBadge}>
              <Text style={previewStyles.tuitionCardBadgeText}>3 mo. paid</Text>
            </View>
          </View>
          <View style={previewStyles.tuitionCardBody}>
            <Text style={previewStyles.tuitionCardTitle} numberOfLines={2}>
              School Year Tuition
            </Text>
            <Text style={previewStyles.tuitionCardStatus}>Pay tuition</Text>
          </View>
        </View>
      </View>

      <View style={previewStyles.tuitionHistorySection}>
        <Text style={previewStyles.tuitionHistoryLabel}>Payment History</Text>
        <Animated.View
          style={[
            previewStyles.tuitionTxRow,
            { opacity: r1Opacity, transform: [{ translateY: r1Y }] },
          ]}
        >
          <View style={previewStyles.tuitionTxAvatar}>
            <Text style={previewStyles.tuitionTxAvatarText}>EJ</Text>
          </View>
          <View style={previewStyles.tuitionTxBody}>
            <Text style={previewStyles.tuitionTxDesc} numberOfLines={1}>
              Annual Supply Fee
            </Text>
            <Text style={previewStyles.tuitionTxMeta}>Emma J. · Aug 1</Text>
          </View>
          <View style={previewStyles.tuitionTxRight}>
            <Text style={previewStyles.tuitionTxAmount}>$300</Text>
            <View style={previewStyles.tuitionPaidBadge}>
              <Text style={previewStyles.tuitionPaidBadgeText}>Paid</Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View
          style={[
            previewStyles.tuitionTxRow,
            { opacity: r2Opacity, transform: [{ translateY: r2Y }] },
          ]}
        >
          <View style={previewStyles.tuitionTxAvatar}>
            <Text style={previewStyles.tuitionTxAvatarText}>LM</Text>
          </View>
          <View style={previewStyles.tuitionTxBody}>
            <Text style={previewStyles.tuitionTxDesc} numberOfLines={1}>
              School Year Tuition
            </Text>
            <Text style={previewStyles.tuitionTxMeta}>Liam M. · Sep 1</Text>
          </View>
          <View style={previewStyles.tuitionTxRight}>
            <Text style={previewStyles.tuitionTxAmount}>$1,450</Text>
            <View style={previewStyles.tuitionPaidBadge}>
              <Text style={previewStyles.tuitionPaidBadgeText}>Paid</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

type IntroSlide = {
  key: string;
  headline: string;
  body: string;
  PreviewComponent: React.ComponentType;
};

const INTRO_SLIDES: IntroSlide[] = [
  {
    key: "welcome",
    headline: "Welcome to Sage Field",
    body: "Your family's home base for everything school — all in one place.",
    PreviewComponent: CheckinPreview,
  },
  {
    key: "calendar",
    headline: "School Calendar",
    body: "Browse upcoming events, field trips, and important dates.",
    PreviewComponent: CalendarPreview,
  },
  {
    key: "messages",
    headline: "Message Teachers",
    body: "Send a message directly to your child's teacher, anytime.",
    PreviewComponent: MessagesPreview,
  },
  {
    key: "tuition",
    headline: "Tuition & Billing",
    body: "Pay tuition, track payments, and view your billing history — all from the app.",
    PreviewComponent: TuitionPreview,
  },
  {
    key: "ready",
    headline: "You're All Set",
    body: "Let's finish setting up your account so you get the most out of Sage Field.",
    PreviewComponent: FeedPreview,
  },
];

const SLIDE_BACKGROUNDS = [
  "#ffffff",
  "#FFF9F5",
  "#EEF5EF",
  "#F0F5F2",
  "#FFF9F5",
] as const;

// ---------------------------------------------------------------------------
// Drop-off slots
// ---------------------------------------------------------------------------

const DROP_OFF_SLOTS = [
  { label: "8:15 – 8:30", value: "8:15" },
  { label: "8:30 – 8:45", value: "8:30" },
  { label: "8:45 – 9:00", value: "8:45" },
] as const;

// ---------------------------------------------------------------------------
// Community preview
// ---------------------------------------------------------------------------

type CommunityMessage = {
  body: string;
  senderName: string;
  senderImageUrl: string | null;
};

const AVATAR_COLORS = [
  { bg: "#d4e6d0", text: "#4a7c59" },
  { bg: "#dce8f5", text: "#4a7394" },
  { bg: "#f5e8d4", text: "#946e3a" },
  { bg: "#f5d4e4", text: "#944a6e" },
  { bg: "#e4d4f5", text: "#6e4a94" },
  { bg: "#d4f5e4", text: "#3a9468" },
] as const;

function avatarColor(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Tuition helpers
// ---------------------------------------------------------------------------

type PendingPaymentPreview = {
  id: string;
  label: string;
  amount_cents: number | null;
  program: string;
  student_id: string | null;
  payment_type?: string;
};

function isSupplyFeePendingPayment(p: PendingPaymentPreview): boolean {
  if (p.payment_type === "supply_fee") return true;
  return /supply fee/i.test(p.label);
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatProgram(program: string): string {
  const map: Record<string, string> = {
    summer_26: "Summer 2026",
    school_year_26_27: "School Year 2026–2027",
    both: "Summer 2026 & School Year 2026–2027",
    homeschool_drop_in: "Homeschool Drop-In",
  };
  return map[program] ?? program;
}

// ---------------------------------------------------------------------------

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

function SkeletonUpcomingEvents() {
  return (
    <View style={{ gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <SkeletonBox width={3} height={40} borderRadius={9999} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonBox width="65%" height={14} borderRadius={4} />
            <SkeletonBox width="45%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SkeletonStudentList() {
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
        }}
      >
        <SkeletonBox width={120} height={16} borderRadius={4} />
        <SkeletonBox width={52} height={13} borderRadius={4} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 24, paddingBottom: 6 }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 172,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 72,
                backgroundColor: "#EEF5EF",
                opacity: 0.5,
              }}
            />
            <View style={{ alignItems: "center", marginTop: -44 }}>
              <SkeletonBox width={62} height={62} borderRadius={31} />
            </View>
            <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14, gap: 6 }}>
              <SkeletonBox width={72} height={15} borderRadius={4} />
              <SkeletonBox width={64} height={18} borderRadius={9999} />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <SkeletonBox width={72} height={12} borderRadius={4} />
                <SkeletonBox width={14} height={14} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function SkeletonCommunityPreview() {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#c2ddc8",
        backgroundColor: "#eef5ef",
        padding: 16,
        gap: 12,
      }}
    >
      <SkeletonBox width={80} height={14} borderRadius={9999} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={{ gap: 6, flex: 1 }}>
          <SkeletonBox width="50%" height={12} borderRadius={4} />
          <SkeletonBox width="85%" height={11} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

type HomeProgramCardDef = {
  image: any;
  programLabel: string;
  title: string;
  badge?: string;
  statusLine: string;
};

const homeProgramStyles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  banner: {
    height: 110,
  },
  label: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.4,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#374151",
  },
  body: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
    lineHeight: 18,
  },
  statusLine: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
  },
});

const actPrefStyles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    overflow: "hidden",
    padding: 16,
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#f59e0b",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  rows: {
    gap: 8,
  },
  row: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowTuition: {
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  rowPtc: {
    backgroundColor: "rgba(236, 253, 245, 0.9)",
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  rowActivity: {
    backgroundColor: "rgba(254, 243, 199, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(253, 230, 138, 0.6)",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  rowActivityTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowEmoji: {
    fontSize: 22,
  },
  rowTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1e3a8a",
  },
  rowTitlePtc: {
    color: "#065f46",
  },
  rowTitleActivity: {
    color: "#78350f",
  },
  rowSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#1e40af",
    marginTop: 2,
  },
  rowSubPtc: {
    color: "#047857",
  },
  rowSubActivity: {
    color: "#92400e",
    lineHeight: 17,
  },
  rowBody: {
    flex: 1,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f59e0b",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 32,
    gap: 2,
  },
  ctaText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#fff",
  },
});

const weekActStyles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitleInline: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  autoFillLink: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  section: {
    paddingTop: 18,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 16,
    color: "#1f2937",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  cardsRow: {
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  thumb: {
    width: "100%",
    height: 88,
  },
  thumbPlaceholder: {
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1f2937",
    paddingHorizontal: 10,
    paddingTop: 8,
    lineHeight: 17,
  },
  cardDate: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: Brand.sage700,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
});

function HomeProgramCard({
  card,
  onPress,
}: {
  card: HomeProgramCardDef;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        homeProgramStyles.card,
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
    >
      <View style={homeProgramStyles.banner}>
        <Image
          source={card.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.54)"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={homeProgramStyles.label}>{card.programLabel}</Text>
        {card.badge ? (
          <View style={homeProgramStyles.badge}>
            <Text style={homeProgramStyles.badgeText}>{card.badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={homeProgramStyles.body}>
        <Text style={homeProgramStyles.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={homeProgramStyles.statusLine} numberOfLines={1}>
          {card.statusLine}
        </Text>
      </View>
    </Pressable>
  );
}

type SelectedStudent = { id: string; name: string; grade: string | null };

function NewsletterHomeCard({ item }: { item: ParentNewsletterListItem }) {
  return (
    <Pressable
      style={({ pressed }) => [
        nlCardStyles.card,
        pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
      ]}
      onPress={() => Linking.openURL(`${API_BASE_URL}/newsletter/${item.id}`)}
    >
      <View style={nlCardStyles.imageWrap}>
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={nlCardStyles.image}
            contentFit="cover"
          />
        ) : (
          <View style={nlCardStyles.imageFallback}>
            <Ionicons name="newspaper-outline" size={28} color="#9ca3af" />
          </View>
        )}
      </View>
      <View style={nlCardStyles.body}>
        <Text style={nlCardStyles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={nlCardStyles.week} numberOfLines={1}>
          {item.week_range}
        </Text>
        {item.access_password ? (
          <View style={nlCardStyles.passwordRow}>
            <Ionicons name="lock-closed-outline" size={10} color="#6b7280" />
            <Text style={nlCardStyles.passwordLabel}>Password: </Text>
            <Text selectable style={nlCardStyles.passwordValue}>
              {item.access_password}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const nlCardStyles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  imageWrap: { aspectRatio: 16 / 9, width: "100%" },
  image: { flex: 1 },
  imageFallback: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 10, gap: 3 },
  title: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#1f2937",
    lineHeight: 16,
  },
  week: { fontFamily: FontFamilies.body, fontSize: 10, color: "#6b7280" },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  passwordLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },
  passwordValue: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },
});

async function fetchDMNotifs(userId: string): Promise<NotifItem[]> {
  const { data: participantRows } = await supabase
    .schema("messaging")
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const convIds =
    participantRows?.map(
      (r: { conversation_id: string }) => r.conversation_id,
    ) ?? [];
  if (!convIds.length) return [];

  // Fetch unread messages and all other participants in parallel (both only need convIds)
  const [unreadMsgsResult, allOtherParticipantsResult] = await Promise.all([
    supabase
      .schema("messaging")
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", convIds)
      .neq("sender_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .schema("messaging")
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", userId),
  ]);

  const unreadMsgs = unreadMsgsResult.data;
  if (!unreadMsgs?.length) return [];

  const convUnread = new Map<
    string,
    { count: number; latestBody: string; latestAt: string }
  >();
  for (const msg of unreadMsgs as {
    conversation_id: string;
    body: string;
    created_at: string;
  }[]) {
    const existing = convUnread.get(msg.conversation_id);
    if (!existing) {
      convUnread.set(msg.conversation_id, {
        count: 1,
        latestBody: msg.body,
        latestAt: msg.created_at,
      });
    } else {
      existing.count++;
    }
  }

  const unreadConvIds = [...convUnread.keys()];

  const otherParticipants = (
    (allOtherParticipantsResult.data as { conversation_id: string; user_id: string }[]) ?? []
  ).filter((p) => unreadConvIds.includes(p.conversation_id));

  const otherUserIds = [
    ...new Set(otherParticipants.map((p) => p.user_id)),
  ];
  if (!otherUserIds.length) return [];

  const { data: profiles } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", otherUserIds);

  const profileMap = new Map(
    (
      (profiles as {
        id: string;
        full_name: string;
        profile_image_url: string | null;
      }[]) ?? []
    ).map((p) => [p.id, p]),
  );
  const participantMap = new Map(
    (
      (otherParticipants as { conversation_id: string; user_id: string }[]) ??
      []
    ).map((p) => [p.conversation_id, p.user_id]),
  );

  return unreadConvIds.map((convId) => {
    const data = convUnread.get(convId)!;
    const otherUserId = participantMap.get(convId) ?? "";
    const profile = profileMap.get(otherUserId);
    return {
      id: convId,
      kind: "direct" as const,
      name: profile?.full_name ?? "Unknown",
      preview: data.latestBody.slice(0, 60),
      timestamp: data.latestAt,
      unreadCount: data.count,
      conversationId: convId,
      otherUserName: profile?.full_name ?? "Unknown",
      otherUserAvatar: profile?.profile_image_url ?? "",
      otherUserId,
    };
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const { activityId: activityIdParam } = useLocalSearchParams<{ activityId?: string }>();
  const handledActivityNotificationRef = useRef<string | null>(null);
  const goToTuition = useCallback(() => {
    router.push("/(tabs)/tuition" as any);
  }, [router]);
  const { userId, effectiveParentId, parentViewUserId, isGrantee, ownerName, isReadOnlyPreview } = useAuth();
  const [firstName, setFirstName] = useState<string>("there");
  const [initials, setInitials] = useState<string>("");
  const [parentImageUrl, setParentImageUrl] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [students, setStudents] = useState<
    {
      id: string;
      child_legal_name: string;
      child_grade: string | null;
      profile_image_url: string | null;
    }[]
  >([]);
  const [teacherNameByStudentId, setTeacherNameByStudentId] = useState<
    Record<string, string>
  >({});
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pendingPayments, setPendingPayments] = useState<
    PendingPaymentPreview[]
  >([]);
  const [tuitionLoading, setTuitionLoading] = useState(true);
  const [uploadingParentImage, setUploadingParentImage] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<Set<string>>(
    new Set(),
  );
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [dropOffSlot, setDropOffSlot] = useState<string | null>(null);
  const [dropOffSaved, setDropOffSaved] = useState(false);
  const [dropOffSaving, setDropOffSaving] = useState(false);
  const [dropOffError, setDropOffError] = useState<string | null>(null);
  const [applications, setApplications] = useState<HomeApplicationRow[]>([]);
  const [paidWeeksByStudent, setPaidWeeksByStudent] = useState<
    Record<string, number[]>
  >({});
  const [paidAftercareByStudent, setPaidAftercareByStudent] = useState<
    Record<string, { months: string[]; days: string[] }>
  >({});
  const [paidFunFridayByStudent, setPaidFunFridayByStudent] = useState<
    Record<string, { months: string[]; fridays: string[] }>
  >({});

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const [communityMsgs, setCommunityMsgs] = useState<CommunityMessage[]>([]);
  const [communityIsMember, setCommunityIsMember] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityIdx, setCommunityIdx] = useState(0);
  const communityFade = useRef(new Animated.Value(1)).current;

  const [teachers, setTeachers] = useState<TeacherSuggestion[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [startingConvTeacherId, setStartingConvTeacherId] = useState<
    string | null
  >(null);
  const [homeNewsletters, setHomeNewsletters] = useState<ParentNewsletterListItem[]>([]);
  const [newslettersLoading, setNewslettersLoading] = useState(true);
  const [hasActivityForPaidDay, setHasActivityForPaidDay] = useState(false);
  const [weekActivities, setWeekActivities] = useState<Activity[]>([]);
  const [weekActivitiesLoading, setWeekActivitiesLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const activityBannerRef = useRef<{
    activities: { id: string; activity_date: string | null }[];
    activityPrefs: { student_id: string; activity_id: string }[];
    studentDefaults: StudentDefaultPreference[];
    defaultPrefStudentIds: Set<string>;
    paidSets: Record<string, Set<string>>;
  } | null>(null);
  const [studentDefaults, setStudentDefaults] = useState<StudentDefaultPreference[]>([]);
  const [activityPaidSets, setActivityPaidSets] = useState<Record<string, Set<string>>>({});
  const [defaultSaveStatusByStudent, setDefaultSaveStatusByStudent] = useState<
    Record<string, DefaultSaveStatus>
  >({});
  const [paidSchoolYearByStudent, setPaidSchoolYearByStudent] =
    useState<PaidSchoolYearByStudent>({});
  const [paidSupplyFeeByStudent, setPaidSupplyFeeByStudent] = useState<
    Record<string, boolean>
  >({});
  const [paidHomeschoolByStudent, setPaidHomeschoolByStudent] =
    useState<PaidHomeschoolByStudent>({});
  const [conferenceBookingsByStudent, setConferenceBookingsByStudent] =
    useState<Record<string, ConferenceBookingRecord>>({});
  const [conferenceStudents, setConferenceStudents] = useState<
    ConferenceStudentContext[]
  >([]);
  const [conferenceTeachers, setConferenceTeachers] = useState<
    ConferenceTeacherDisplay[]
  >([]);
  const [conferenceTakenSlotKeys, setConferenceTakenSlotKeys] = useState<
    string[]
  >([]);
  const [conferenceContextLoading, setConferenceContextLoading] =
    useState(false);
  const [conferenceContextError, setConferenceContextError] = useState<
    string | null
  >(null);

  const applyConferenceBookingsFromRows = useCallback(
    (
      rows: Array<{
        student_id: string;
        teacher_id: string;
        conference_date: string;
        time_slot: string;
        format: string;
        accommodation_note: string | null;
      }> | null,
    ) => {
      const map: Record<string, ConferenceBookingRecord> = {};
      for (const row of rows ?? []) {
        map[row.student_id] = {
          teacherId: row.teacher_id,
          conferenceDate: row.conference_date,
          timeSlot: row.time_slot,
          format: row.format as "in_person" | "virtual",
          accommodationNote: row.accommodation_note ?? null,
        };
      }
      setConferenceBookingsByStudent(map);
    },
    [],
  );

  const loadConferenceBookingsFromSupabase = useCallback(async () => {
    if (!effectiveParentId) return;
    const { data } = await supabase
      .schema("teachers")
      .from("parent_teacher_conference_bookings")
      .select(
        "student_id, teacher_id, conference_date, time_slot, format, accommodation_note",
      )
      .eq("parent_id", effectiveParentId);
    applyConferenceBookingsFromRows(data);
  }, [effectiveParentId, applyConferenceBookingsFromRows]);

  const loadConferenceContext = useCallback(async (): Promise<boolean> => {
    if (!effectiveParentId) return false;
    setConferenceContextLoading(true);
    setConferenceContextError(null);
    try {
      const ctx = await fetchConferenceContext(effectiveParentId);
      setConferenceTeachers(ctx.conferenceTeachers);
      setConferenceStudents(ctx.conferenceStudents);
      setConferenceBookingsByStudent(ctx.bookingsByStudent);
      setConferenceTakenSlotKeys(ctx.takenSlotKeys);
      return true;
    } catch (err) {
      console.warn("[home] conference context load failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load conference data";
      setConferenceContextError(message);
      await loadConferenceBookingsFromSupabase();
      return false;
    } finally {
      setConferenceContextLoading(false);
    }
  }, [effectiveParentId, loadConferenceBookingsFromSupabase]);

  const openPtcSheet = useCallback(() => {
    if (isReadOnlyPreview) return;
    ptcSheetRef.current?.present();
    if (
      conferenceTeachers.length === 0 ||
      conferenceStudents.length === 0
    ) {
      void loadConferenceContext();
    }
  }, [
    isReadOnlyPreview,
    conferenceTeachers.length,
    conferenceStudents.length,
    loadConferenceContext,
  ]);

  const profileSheetRef = useRef<BottomSheetModal>(null);
  const eventSheetRef = useRef<BottomSheetModal>(null);
  const checklistSheetRef = useRef<BottomSheetModal>(null);
  const notifSheetRef = useRef<BottomSheetModal>(null);
  const ptcSheetRef = useRef<BottomSheetModal>(null);
  const activityPrefSheetRef = useRef<BottomSheetModal>(null);
  const autoFillSheetRef = useRef<BottomSheetModal>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const introListRef = useRef<FlatList<IntroSlide>>(null);
  const [showFallLeaves, setShowFallLeaves] = useState(false);

  useEffect(() => {
    if (shouldPlayFallLeaves()) {
      setShowFallLeaves(true);
    }
  }, []);

  // Refresh "X min ago" labels every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!onboardingCompleted.has("intro_seen")) {
        const t = setTimeout(() => setIntroVisible(true), 400);
        return () => clearTimeout(t);
      }
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveParentId || !userId) return;

    async function loadUser() {
      try {
        setCurrentUserId(userId);

        // ─── Core data: try RPC first (1 round-trip), fall back to individual queries ───
        type TxRow = {
          student_id: string | null;
          payment_type: string;
          status: string;
          metadata: Record<string, string> | null;
          amount_cents?: number;
          created_at?: string;
        };
        type StudentRow = { id: string; child_legal_name: string; child_grade: string | null; profile_image_url: string | null };

        let studentsForActivity: StudentRow[] = [];
        let txForActivity: TxRow[] = [];

        const { data: rpcRaw, error: rpcError } = await (supabase as any).rpc(
          "rpc_home_screen_data",
          { p_user_id: parentViewUserId ?? userId, p_parent_id: effectiveParentId },
        );

        console.log("[home] core data source:", rpcRaw && !rpcError ? "RPC" : `fallback (rpcError: ${rpcError?.message ?? "no data"})`);

        if (rpcRaw && !rpcError) {
          // ── Fast path: populate everything from the single RPC response ──
          const rpc = rpcRaw as {
            profile: { full_name: string; profile_image_url: string | null } | null;
            students: StudentRow[] | null;
            events: CalendarEvent[] | null;
            pending_payments: PendingPaymentPreview[] | null;
            onboarding: { completed: string[] } | null;
            dropoff: { slot: string } | null;
            applications: HomeApplicationRow[] | null;
            transactions: TxRow[] | null;
          };

          if (rpc.profile?.full_name) {
            setFirstName(rpc.profile.full_name.split(" ")[0]);
            setInitials(getInitials(rpc.profile.full_name));
          } else {
            setInitials("?");
          }
          if (rpc.profile?.profile_image_url) setParentImageUrl(rpc.profile.profile_image_url);

          studentsForActivity = rpc.students ?? [];
          setStudents(studentsForActivity);
          setUpcomingEvents(rpc.events ?? []);
          setPendingPayments(rpc.pending_payments ?? []);
          setTuitionLoading(false);

          console.log("[onboarding] effectiveParentId:", effectiveParentId);
          console.log("[onboarding] onboarding:", JSON.stringify(rpc.onboarding));
          const completedArr = (rpc.onboarding?.completed ?? []) as string[];
          console.log("[onboarding] completed array:", completedArr);
          setOnboardingCompleted(new Set(completedArr));

          if (rpc.dropoff?.slot) {
            setDropOffSlot(rpc.dropoff.slot);
            setDropOffSaved(true);
          }

          setApplications(rpc.applications ?? []);

          txForActivity = rpc.transactions ?? [];
          applyTransactionState(txForActivity);

          const rpcApplications = rpc.applications ?? [];
          const dropInProgramByStudent =
            buildDropInProgramByStudent(rpcApplications);
          const [{ teacherNameByStudentId }, parentVisibleTeachers] =
            await Promise.all([
              fetchSchoolYearTeachersForStudents(
                studentsForActivity.map((s) => s.id),
                dropInProgramByStudent,
              ),
              fetchParentVisibleTeachers(),
            ]);
          setTeacherNameByStudentId(teacherNameByStudentId);
          setTeachers(parentVisibleTeachers);
          setTeachersLoading(false);

          // Unlock the main render immediately after core data is ready
          setLoading(false);
          setOnboardingLoading(false);

          // Background: activity-banner (non-critical, use existing skeletons)
          const paidDatesMap = computePaidDates(txForActivity.filter((tx): tx is typeof tx & { student_id: string } => tx.student_id != null));
          const paidSets: Record<string, Set<string>> = {};
          for (const [sid, dates] of Object.entries(paidDatesMap)) {
            paidSets[sid] = new Set(dates);
          }
          const [activitiesResult, activityPrefsResult, defaultPrefsResult] =
            await Promise.all([
              supabase.schema("teachers").from("activities").select("id, activity_date").eq("status", "published").eq("visibility", "public").eq("is_deleted", false),
              supabase.schema("parent_app").from("activity_preferences").select("student_id, activity_id").eq("parent_id", effectiveParentId),
              supabase.schema("parent_app").from("student_default_preferences").select("student_id, participation_level").eq("parent_id", effectiveParentId),
            ]);

          applyActivityBanner(activitiesResult, activityPrefsResult, defaultPrefsResult, studentsForActivity, paidSets);
          void loadConferenceBookingsFromSupabase();
          void loadConferenceContext();

        } else {
          // ── Fallback: original individual queries (unchanged logic) ──────
          const { data: profileData } = await supabase
            .schema("admin")
            .from("users")
            .select("full_name, profile_image_url")
            .eq("id", userId)
            .single();

          if (profileData?.full_name) {
            setFirstName(profileData.full_name.split(" ")[0]);
            setInitials(getInitials(profileData.full_name));
          } else {
            setInitials("?");
          }
          if (profileData?.profile_image_url) setParentImageUrl(profileData.profile_image_url);

          const { data: fetchedStudents } = await supabase
            .schema("admin")
            .from("students")
            .select("id, child_legal_name, child_grade, profile_image_url")
            .eq("parent_id", effectiveParentId)
            .eq("is_deleted", false);

          studentsForActivity = fetchedStudents ?? [];
          setStudents(studentsForActivity);

          const [
            eventsResult,
            pendingResult,
            onboardingResult,
            dropOffResult,
            applicationsResult,
            transactionsResult,
            activitiesResult,
            activityPrefsResult,
            defaultPrefsResult,
          ] = await Promise.all([
            supabase
              .schema("calendar")
              .from("events")
              .select(
                "id,title,event_date,is_all_day,start_time,end_time,color,category,description,location,attachment_links",
              )
              .gte("event_date", toYMD(new Date()))
              .order("event_date", { ascending: true })
              .limit(3),
            supabase
              .schema("billing")
              .from("pending_payment_requests")
              .select("id, label, amount_cents, program, student_id, payment_type")
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .schema("parent_app")
              .from("onboarding_checklist")
              .select("completed")
              .eq("parent_id", effectiveParentId)
              .maybeSingle(),
            supabase
              .schema("parent_app")
              .from("dropoff_times")
              .select("slot")
              .eq("parent_id", effectiveParentId)
              .maybeSingle(),
            supabase
              .schema("parent_app")
              .from("applications")
              .select(
                "id, student_id, status, program, drop_in_program, child_legal_name",
              )
              .eq("user_id", effectiveParentId)
              .eq("approved", true)
              .in("program", [
                "summer_26",
                "both",
                "homeschool_drop_in",
                "school_year_26_27",
              ]),
            supabase
              .schema("billing")
              .from("stripe_transactions")
              .select(
                "student_id, payment_type, status, metadata, amount_cents, created_at",
              )
              .eq("parent_id", effectiveParentId)
              .eq("is_deleted", false)
              .eq("status", "completed"),
            supabase
              .schema("teachers")
              .from("activities")
              .select("id, activity_date")
              .eq("status", "published")
              .eq("visibility", "public")
              .eq("is_deleted", false),
            supabase
              .schema("parent_app")
              .from("activity_preferences")
              .select("student_id, activity_id")
              .eq("parent_id", effectiveParentId),
            supabase
              .schema("parent_app")
              .from("student_default_preferences")
              .select("student_id, participation_level")
              .eq("parent_id", effectiveParentId),
          ]);

          if (eventsResult.data) setUpcomingEvents(eventsResult.data);

          setPendingPayments(pendingResult.data ?? []);
          setTuitionLoading(false);

          console.log("[onboarding] effectiveParentId:", effectiveParentId);
          console.log(
            "[onboarding] raw result:",
            JSON.stringify(onboardingResult),
          );
          console.log("[onboarding] data:", onboardingResult.data);
          console.log("[onboarding] error:", onboardingResult.error);
          const completedArr = (onboardingResult.data?.completed ??
            []) as string[];
          console.log("[onboarding] completed array:", completedArr);
          setOnboardingCompleted(new Set(completedArr));

          if (dropOffResult.data?.slot) {
            setDropOffSlot(dropOffResult.data.slot);
            setDropOffSaved(true);
          }

          setApplications(applicationsResult.data ?? []);

          const fallbackApplications = applicationsResult.data ?? [];
          const dropInProgramByStudent =
            buildDropInProgramByStudent(fallbackApplications);
          const [{ teacherNameByStudentId }, parentVisibleTeachers] =
            await Promise.all([
              fetchSchoolYearTeachersForStudents(
                studentsForActivity.map((s) => s.id),
                dropInProgramByStudent,
              ),
              fetchParentVisibleTeachers(),
            ]);
          setTeacherNameByStudentId(teacherNameByStudentId);
          setTeachers(parentVisibleTeachers);
          setTeachersLoading(false);

          txForActivity = transactionsResult.data ?? [];
          applyTransactionState(txForActivity);

          const paidDatesMap = computePaidDates(txForActivity.filter((tx): tx is typeof tx & { student_id: string } => tx.student_id != null));
          const paidSets: Record<string, Set<string>> = {};
          for (const [sid, dates] of Object.entries(paidDatesMap)) {
            paidSets[sid] = new Set(dates);
          }

          applyActivityBanner(activitiesResult, activityPrefsResult, defaultPrefsResult, studentsForActivity, paidSets);
          void loadConferenceBookingsFromSupabase();
          void loadConferenceContext();
        }

        // ─── DM + channels (parallel, always runs after core) ────────────────
        setNotifLoading(true);
        const [dmItems, channelsData] = await Promise.all([
          fetchDMNotifs(userId!),
          getChannels(userId!),
        ]);
        const channelNotifItems: NotifItem[] = channelsData
          .filter((ch) => ch.isMember && ch.unreadCount > 0 && ch.lastMessage)
          .map((ch) => ({
            id: ch.id,
            kind: "channel" as const,
            name: `#${ch.name}`,
            preview: ch.lastMessage!.body.slice(0, 60),
            timestamp: ch.lastMessage!.created_at,
            unreadCount: ch.unreadCount,
            channelId: ch.id,
            channelName: ch.name,
            isMember: ch.isMember,
            isDefault: ch.is_default,
            memberCount: ch.memberCount,
          }));
        const allNotifs = [...dmItems, ...channelNotifItems]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 10);
        setNotifItems(allNotifs);
        setNotifTotal(allNotifs.reduce((sum, i) => sum + i.unreadCount, 0));
        setNotifLoading(false);

        // Community preview — members see the carousel, non-members see an invite
        const generalCh = channelsData.find((ch) => ch.is_default);
        if (generalCh) {
          setCommunityIsMember(generalCh.isMember);
          if (generalCh.isMember) {
            const { data: rawMsgs } = await supabase
              .schema("messaging")
              .from("channel_messages")
              .select("body, sender_id")
              .eq("channel_id", generalCh.id)
              .order("created_at", { ascending: false })
              .limit(5);

            if (rawMsgs?.length) {
              const senderIds = [
                ...new Set(rawMsgs.map((m: any) => m.sender_id as string)),
              ];
              const { data: profiles } = await supabase
                .schema("admin")
                .from("users")
                .select("id, full_name, profile_image_url")
                .in("id", senderIds);

              const profileMap = new Map<
                string,
                { full_name: string; profile_image_url: string | null }
              >();
              (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));

              setCommunityMsgs(
                rawMsgs.map((m: any) => {
                  const p = profileMap.get(m.sender_id);
                  return {
                    body: m.body,
                    senderName: p?.full_name ?? "Someone",
                    senderImageUrl: p?.profile_image_url ?? null,
                  };
                }),
              );
            }
          }
        }
        setCommunityLoading(false);
      } catch (e) {
        notifyError("parent-home-load", e);
      } finally {
        setLoading(false);
        setOnboardingLoading(false);
      }
    }

    // ─── Shared helpers (close over state setters) ──────────────────────────
    type TxRow = {
      student_id: string | null;
      payment_type: string;
      status: string;
      metadata: Record<string, string> | null;
      amount_cents?: number;
      created_at?: string;
    };

    function applyTransactionState(txData: TxRow[]) {
      const paidWeeks: Record<string, number[]> = {};
      const aftercareMap: Record<string, { months: string[]; days: string[] }> = {};
      const funFridayMap: Record<string, { months: string[]; fridays: string[] }> = {};
      const schoolYearMap: PaidSchoolYearByStudent = {};
      const supplyFeeMap: Record<string, boolean> = {};
      const homeschoolMap: PaidHomeschoolByStudent = {};

      for (const tx of txData) {
        if (tx.status !== "completed" || !tx.student_id) continue;
        const meta = tx.metadata;
        if (tx.payment_type === "summer_tuition") {
          if (meta?.plan_type === "full") {
            paidWeeks[tx.student_id] = Array.from({ length: 12 }, (_, i) => i + 1);
          } else {
            const weeks = (meta?.weeks ?? "").split(",").map(Number).filter(Boolean);
            const existing = new Set(paidWeeks[tx.student_id] ?? []);
            weeks.forEach((w) => existing.add(w));
            paidWeeks[tx.student_id] = Array.from(existing);
          }
        } else if (tx.payment_type === "aftercare_tuition") {
          const months = (meta?.selected_months ?? "").split(",").filter(Boolean);
          const days = (meta?.selected_days ?? "").split(",").filter(Boolean);
          const prev = aftercareMap[tx.student_id] ?? { months: [], days: [] };
          aftercareMap[tx.student_id] = { months: [...prev.months, ...months], days: [...prev.days, ...days] };
        } else if (tx.payment_type === "fun_friday_tuition") {
          const months = (meta?.selected_months ?? "").split(",").filter(Boolean);
          const fridays = (meta?.selected_fridays ?? "").split(",").filter(Boolean);
          const prev = funFridayMap[tx.student_id] ?? { months: [], fridays: [] };
          funFridayMap[tx.student_id] = { months: [...prev.months, ...months], fridays: [...prev.fridays, ...fridays] };
        } else if (tx.payment_type === "school_year_tuition") {
          const months = (meta?.selected_months ?? "")
            .split(",")
            .map(Number)
            .filter(Boolean);
          if (!schoolYearMap[tx.student_id]) {
            schoolYearMap[tx.student_id] = [];
          }
          schoolYearMap[tx.student_id].push(...months);
        } else if (tx.payment_type === "supply_fee") {
          supplyFeeMap[tx.student_id] = true;
          if (
            meta?.bundle_type === "homeschool" &&
            meta.bundle_homeschool_tier
          ) {
            const tier = meta.bundle_homeschool_tier;
            const weeks = (meta.bundle_homeschool_selected_days ?? "")
              .split(",")
              .map(Number)
              .filter(Boolean);
            const weekDays: Record<number, string[]> = {};
            if (meta.bundle_homeschool_week_selections_json) {
              try {
                const parsed: { week: number; days: string[] }[] = JSON.parse(
                  meta.bundle_homeschool_week_selections_json,
                );
                parsed.forEach(({ week, days }) => {
                  weekDays[week] = days;
                });
              } catch {
                /* ignore */
              }
            }
            if (Object.keys(weekDays).length === 0) {
              weeks.forEach((w) => {
                weekDays[w] = [];
              });
            }
            const days = [...new Set(Object.values(weekDays).flat())];
            const amountCents = meta.bundle_amount_cents
              ? parseInt(meta.bundle_amount_cents, 10)
              : (tx.amount_cents ?? 0);
            if (!homeschoolMap[tx.student_id]) {
              homeschoolMap[tx.student_id] = { summer: [], schoolYear: [] };
            }
            homeschoolMap[tx.student_id].schoolYear.push({
              weeks,
              tier,
              days,
              weekDays,
              amountCents,
              createdAt: tx.created_at ?? "",
            });
          }
        } else if (tx.payment_type === "homeschool_dropin") {
          const program = meta?.program ?? "summer_26";
          const tier = meta?.tier ?? "dropin";
          const days = meta?.selected_days?.split(",").filter(Boolean) ?? [];
          const weeks =
            meta?.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
          const weekDays: Record<number, string[]> = {};
          if (meta?.week_selections) {
            try {
              const parsed: { week: number; days: string[] }[] = JSON.parse(
                meta.week_selections,
              );
              parsed.forEach(({ week, days: d }) => {
                weekDays[week] = d;
              });
            } catch {
              /* ignore */
            }
          }
          if (Object.keys(weekDays).length === 0) {
            weeks.forEach((w) => {
              weekDays[w] = days;
            });
          }
          if (!homeschoolMap[tx.student_id]) {
            homeschoolMap[tx.student_id] = { summer: [], schoolYear: [] };
          }
          const entry = {
            weeks,
            tier,
            days,
            weekDays,
            amountCents: tx.amount_cents ?? 0,
            createdAt: tx.created_at ?? "",
          };
          if (program === "school_year_26_27") {
            homeschoolMap[tx.student_id].schoolYear.push(entry);
          } else {
            homeschoolMap[tx.student_id].summer.push(entry);
          }
        }
      }

      setPaidWeeksByStudent(paidWeeks);
      setPaidAftercareByStudent(aftercareMap);
      setPaidFunFridayByStudent(funFridayMap);
      setPaidSchoolYearByStudent(schoolYearMap);
      setPaidSupplyFeeByStudent(supplyFeeMap);
      setPaidHomeschoolByStudent(homeschoolMap);
    }

    function applyActivityBanner(
      activitiesResult: { data: { id: string; activity_date: string | null }[] | null },
      activityPrefsResult: { data: { student_id: string; activity_id: string }[] | null },
      defaultPrefsResult: {
        data: { student_id: string; participation_level: ParticipationLevel }[] | null;
      },
      studentsData: { id: string }[],
      paidSets: Record<string, Set<string>>,
    ) {
      const activities = activitiesResult.data ?? [];
      const activityPrefs = activityPrefsResult.data ?? [];
      const defaults = (defaultPrefsResult.data ?? []) as StudentDefaultPreference[];
      const defaultPrefStudentIds = new Set(defaults.map((d) => d.student_id));

      setStudentDefaults(defaults);
      setActivityPaidSets(paidSets);

      activityBannerRef.current = {
        activities,
        activityPrefs,
        studentDefaults: defaults,
        defaultPrefStudentIds,
        paidSets,
      };

      setHasActivityForPaidDay(
        computeHasUnsetActivityPreference(
          activities,
          activityPrefs,
          defaultPrefStudentIds,
          studentsData,
          paidSets,
        ),
      );
    }

    loadUser();
  }, [
    effectiveParentId,
    userId,
    parentViewUserId,
    loadConferenceBookingsFromSupabase,
    loadConferenceContext,
  ]);

  useEffect(() => {
    if (communityMsgs.length <= 1) return;
    const t = setInterval(() => {
      Animated.timing(communityFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCommunityIdx((i) => (i + 1) % communityMsgs.length);
        Animated.timing(communityFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(t);
  }, [communityMsgs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectiveParentId) return;
    getPublishedNewsletters(5)
      .then(setHomeNewsletters)
      .catch(() => {})
      .finally(() => setNewslettersLoading(false));
  }, [effectiveParentId]);

  const loadWeekActivities = useCallback(async () => {
    setWeekActivitiesLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const all = await getActivities();
      const filtered = all
        .filter(
          (a) =>
            a.status === "published" &&
            a.visibility === "public" &&
            a.activity_date != null &&
            a.activity_date >= today,
        )
        .sort((a, b) => (a.activity_date ?? "").localeCompare(b.activity_date ?? ""));
      setWeekActivities(filtered);
    } catch (e) {
      notifyError("parent-home-week-activities", e);
    } finally {
      setWeekActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeekActivities();
  }, [loadWeekActivities]);

  const refreshActivityBanner = useCallback(async () => {
    if (!effectiveParentId || !activityBannerRef.current) return;
    const { activities, defaultPrefStudentIds, paidSets } =
      activityBannerRef.current;

    const { data: prefs } = await supabase
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, activity_id")
      .eq("parent_id", effectiveParentId);

    const activityPrefs = prefs ?? [];
    activityBannerRef.current = {
      ...activityBannerRef.current,
      activityPrefs,
    };

    setHasActivityForPaidDay(
      computeHasUnsetActivityPreference(
        activities,
        activityPrefs,
        defaultPrefStudentIds,
        students,
        paidSets,
      ),
    );
  }, [effectiveParentId, students]);

  const eligibleAutoFillStudents = useMemo(() => {
    if (weekActivities.length === 0) return [];
    return students.filter((s) =>
      childHasVisibleUpcomingActivity(
        Array.from(activityPaidSets[s.id] ?? []),
        weekActivities,
      ),
    );
  }, [students, weekActivities, activityPaidSets]);

  const refreshActivityBannerFromDefaults = useCallback(
    (nextDefaults: StudentDefaultPreference[]) => {
      if (!activityBannerRef.current) return;
      const defaultPrefStudentIds = new Set(nextDefaults.map((d) => d.student_id));
      activityBannerRef.current = {
        ...activityBannerRef.current,
        studentDefaults: nextDefaults,
        defaultPrefStudentIds,
      };
      const { activities, activityPrefs, paidSets } = activityBannerRef.current;
      setHasActivityForPaidDay(
        computeHasUnsetActivityPreference(
          activities,
          activityPrefs,
          defaultPrefStudentIds,
          students,
          paidSets,
        ),
      );
    },
    [students],
  );

  const handleHomeSetDefault = useCallback(
    async (studentId: string, level: ParticipationLevel | null) => {
      if (isReadOnlyPreview || !effectiveParentId) return;

      setDefaultSaveStatusByStudent((prev) => ({ ...prev, [studentId]: "saving" }));

      const nextDefaults =
        level !== null
          ? [
              ...studentDefaults.filter((d) => d.student_id !== studentId),
              { student_id: studentId, participation_level: level },
            ]
          : studentDefaults.filter((d) => d.student_id !== studentId);

      setStudentDefaults(nextDefaults);
      refreshActivityBannerFromDefaults(nextDefaults);

      const result = await persistStudentDefaultPreference({
        parentId: effectiveParentId,
        studentId,
        level,
      });

      if (result.error) {
        setDefaultSaveStatusByStudent((prev) => ({ ...prev, [studentId]: "error" }));
        return;
      }

      setDefaultSaveStatusByStudent((prev) => ({ ...prev, [studentId]: "saved" }));
      setTimeout(() => {
        setDefaultSaveStatusByStudent((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }, 2500);
    },
    [
      isReadOnlyPreview,
      effectiveParentId,
      studentDefaults,
      refreshActivityBannerFromDefaults,
    ],
  );

  const openActivityPreferenceSheet = useCallback(
    async (activity?: Activity | null) => {
      if (isReadOnlyPreview && !activity) return;

      let target = activity ?? null;

      if (!target && activityBannerRef.current) {
        const ctx = activityBannerRef.current;
        const unsetId = findFirstUnsetActivity(
          ctx.activities,
          ctx.activityPrefs,
          ctx.defaultPrefStudentIds,
          students,
          ctx.paidSets,
        );
        if (unsetId) {
          target = weekActivities.find((a) => a.id === unsetId) ?? null;
          if (!target) {
            try {
              const all = await getActivities();
              target = all.find((a) => a.id === unsetId) ?? null;
            } catch (e) {
              notifyError("parent-home-activity-pref-open", e);
            }
          }
        }
      }

      if (target) {
        setSelectedActivity(target);
        setTimeout(() => activityPrefSheetRef.current?.present(), 50);
      } else {
        router.push("/(tabs)/preferences" as any);
      }
    },
    [isReadOnlyPreview, students, weekActivities, router],
  );

  useEffect(() => {
    if (!activityIdParam || handledActivityNotificationRef.current === activityIdParam) return;
    if (isReadOnlyPreview || !effectiveParentId) return;

    handledActivityNotificationRef.current = activityIdParam;

    void (async () => {
      try {
        const all = await getActivities();
        const activity = all.find((a) => a.id === activityIdParam) ?? null;
        if (activity) {
          await openActivityPreferenceSheet(activity);
        }
      } catch (e) {
        notifyError("activity-notification-deeplink", e);
      } finally {
        router.setParams({ activityId: undefined });
      }
    })();
  }, [
    activityIdParam,
    effectiveParentId,
    isReadOnlyPreview,
    openActivityPreferenceSheet,
    router,
  ]);

  async function handlePickParentImage() {
    if (isReadOnlyPreview) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingParentImage(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !currentUserId) return;
      const asset = result.assets[0];
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const storagePath = `${currentUserId}/profile.jpg`;
      const fileRes = await fetch(compressed.uri);
      const blob = await fileRes.blob();
      const uploadRes = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/profile-images/${storagePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
          },
          body: blob,
        },
      );
      if (!uploadRes.ok) return;
      const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${storagePath}`;
      await supabase.rpc("update_user_profile_image", {
        p_image_url: publicUrl,
      });
      setParentImageUrl(publicUrl);
    } catch (e) {
      notifyError("parent-home-profile-image", e);
    } finally {
      setUploadingParentImage(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    profileSheetRef.current?.dismiss();
    router.replace("/");
  }

  async function handleMessageTeacher(teacher: TeacherSuggestion) {
    setStartingConvTeacherId(teacher.id);
    try {
      const { data: convId } = await supabase.rpc(
        "find_or_create_conversation",
        { other_user_id: teacher.id },
      );
      if (!convId) return;
      router.push({
        pathname: "/(tabs)/messages/[id]" as any,
        params: {
          id: convId,
          otherUserName: teacher.full_name,
          otherUserAvatar: teacher.profile_image_url ?? "",
          otherUserId: teacher.id,
        },
      });
    } finally {
      setStartingConvTeacherId(null);
    }
  }

  async function handleSaveDropOff() {
    if (isReadOnlyPreview) return;
    if (!dropOffSlot || !effectiveParentId) return;
    setDropOffSaving(true);
    setDropOffError(null);
    const { error } = await supabase
      .schema("parent_app")
      .from("dropoff_times")
      .upsert(
        {
          parent_id: effectiveParentId,
          slot: dropOffSlot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
    setDropOffSaving(false);
    if (error) {
      notifyError("parent-home-dropoff-save", error);
      setDropOffError("Could not save. Please try again.");
      return;
    }
    const wasAlreadySaved = dropOffSaved;
    setDropOffSaved(true);
    const chosen = DROP_OFF_SLOTS.find((s) => s.value === dropOffSlot);
    notifyDiscord({
      type: wasAlreadySaved ? "dropoff_time_updated" : "dropoff_time_selected",
      data: { slot: dropOffSlot, slotLabel: chosen?.label ?? dropOffSlot },
    });
  }

  async function toggleOnboardingTask(id: string) {
    if (isReadOnlyPreview) return;
    const next = new Set(onboardingCompleted);
    next.has(id) ? next.delete(id) : next.add(id);
    setOnboardingCompleted(next);
    if (!effectiveParentId) return;
    await supabase
      .schema("parent_app")
      .from("onboarding_checklist")
      .upsert(
        {
          parent_id: effectiveParentId,
          completed: [...next],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
  }

  async function markIntroSeen() {
    if (isReadOnlyPreview) return;
    const next = new Set(onboardingCompleted);
    next.add("intro_seen");
    setOnboardingCompleted(next);
    if (!effectiveParentId) return;
    await supabase
      .schema("parent_app")
      .from("onboarding_checklist")
      .upsert(
        {
          parent_id: effectiveParentId,
          completed: [...next],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
  }

  function handleIntroNext() {
    if (introIndex < INTRO_SLIDES.length - 1) {
      const next = introIndex + 1;
      introListRef.current?.scrollToIndex({ index: next, animated: true });
      setIntroIndex(next);
    } else {
      handleIntroFinish();
    }
  }

  function handleIntroFinish() {
    setIntroVisible(false);
    markIntroSeen();
    setTimeout(() => checklistSheetRef.current?.present(), 350);
  }

  function handleIntroBack() {
    if (introIndex > 0) {
      const prev = introIndex - 1;
      introListRef.current?.scrollToIndex({ index: prev, animated: true });
      setIntroIndex(prev);
    }
  }

  function handleIntroSkip() {
    setIntroVisible(false);
    markIntroSeen();
  }

  function renderIntroSlide({ item }: { item: IntroSlide }) {
    return (
      <View
        style={[
          styles.introSlide,
          { backgroundColor: SLIDE_BACKGROUNDS[INTRO_SLIDES.indexOf(item)] },
        ]}
      >
        <View style={styles.introPreviewCard}>
          <item.PreviewComponent />
        </View>
        <View style={styles.introTextArea}>
          <Text style={styles.introHeadline}>{item.headline}</Text>
          <Text style={styles.introBody}>{item.body}</Text>
        </View>
      </View>
    );
  }

  function navigateChecklist(id: string) {
    checklistSheetRef.current?.dismiss();
    switch (id) {
      case "upload_photo":
        router.push({
          pathname: "/(tabs)/children" as any,
          params: { tab: "profile" },
        });
        break;
      case "view_teachers":
        router.push({
          pathname: "/(tabs)/children" as any,
          params: { tab: "teacher" },
        });
        break;
      case "introduce_community":
        router.push({
          pathname: "/(tabs)/messages" as any,
          params: { tab: "community" },
        });
        break;
      case "send_message":
        router.push("/(tabs)/messages" as any);
        break;
      case "setup_tuition":
        router.push("/(tabs)/tuition" as any);
        break;
      case "react_post":
        router.push("/(tabs)/feed" as any);
        break;
      case "check_events":
        router.push("/(tabs)/calendar" as any);
        break;
      case "add_pickup":
        router.push({
          pathname: "/(tabs)/children" as any,
          params: { tab: "pickup" },
        });
        break;
    }
  }

  const completedTaskCount = CHECKLIST_TASKS.filter((t) =>
    onboardingCompleted.has(t.id),
  ).length;

  const enrolledApps = applications.filter((a) => a.status === "enrolled");
  const schoolYearTuitionStudentIds = getSchoolYearTuitionStudentIds(
    enrolledApps
      .filter((a) => a.program === "school_year_26_27")
      .map((a) => a.student_id),
    enrolledApps.filter((a) => a.program === "both").map((a) => a.student_id),
  );
  const showActionTuition = needsSchoolYearTuitionAction(
    schoolYearTuitionStudentIds,
    paidSchoolYearByStudent,
  );
  const ptcStudentsForBanner = useMemo((): ConferenceStudentContext[] => {
    if (conferenceStudents.length > 0) return conferenceStudents;
    return students.map((s) => ({
      studentId: s.id,
      name: s.child_legal_name.trim().split(/\s+/)[0] ?? s.child_legal_name,
      assignedTeacherId: null,
    }));
  }, [conferenceStudents, students]);

  const showActionPtc =
    ptcStudentsForBanner.length > 0 &&
    needsConferenceScheduling(
      ptcStudentsForBanner.map((s) => s.studentId),
      conferenceBookingsByStudent,
    );
  const showActionActivity = hasActivityForPaidDay;
  const showActionNeededCard =
    showActionTuition || showActionPtc || showActionActivity;
  const tuitionActionSubtext = getTuitionActionSubtext(
    schoolYearTuitionStudentIds,
    paidSupplyFeeByStudent,
  );
  const ptcActionSubtext = getPtcBannerSubtext(
    ptcStudentsForBanner,
    conferenceBookingsByStudent,
  );

  return (
    <View style={styles.container}>
      <HomeHeroHeader
        name={firstName}
        avatarUrl={parentImageUrl}
        initials={initials}
        onAvatarPress={() => profileSheetRef.current?.present()}
        checklist={{
          onPress: () => checklistSheetRef.current?.present(),
          showBadge:
            !onboardingLoading && completedTaskCount < TOTAL_TASKS,
        }}
        notifications={{
          onPress: () => notifSheetRef.current?.present(),
          count: notifTotal,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={[]}>
        {isGrantee && ownerName && (
          <View style={styles.granteeBanner}>
            <Ionicons name="eye-outline" size={14} color="#7c3aed" />
            <Text style={styles.granteeBannerText}>
              Viewing {ownerName}'s dashboard
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <>
              <SkeletonStudentList />
              <View style={styles.upcomingSection}>
                <SkeletonBox width={140} height={16} borderRadius={4} />
                <SkeletonUpcomingEvents />
              </View>
            </>
          ) : (
            <>
              {showActionNeededCard && (
                <View style={actPrefStyles.card}>
                  <LinearGradient
                    colors={["#fffbeb", "#fff7ed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={actPrefStyles.badge}>
                    <Text style={actPrefStyles.badgeText}>Action Needed</Text>
                  </View>
                  <View style={actPrefStyles.rows}>
                    {showActionTuition && (
                      <Pressable
                        onPress={() => router.push("/(tabs)/tuition")}
                        style={({ pressed }) => [
                          actPrefStyles.row,
                          actPrefStyles.rowTuition,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={actPrefStyles.rowEmoji}>🏫</Text>
                        <View style={actPrefStyles.rowBody}>
                          <Text style={actPrefStyles.rowTitle}>
                            School Year Tuition Available
                          </Text>
                          <Text style={actPrefStyles.rowSub}>
                            {tuitionActionSubtext}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#1e40af"
                        />
                      </Pressable>
                    )}

                    {showActionPtc && (
                      <Pressable
                        onPress={openPtcSheet}
                        style={({ pressed }) => [
                          actPrefStyles.row,
                          actPrefStyles.rowPtc,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={actPrefStyles.rowEmoji}>📅</Text>
                        <View style={actPrefStyles.rowBody}>
                          <Text
                            style={[
                              actPrefStyles.rowTitle,
                              actPrefStyles.rowTitlePtc,
                            ]}
                          >
                            Schedule your parent-teacher conference
                          </Text>
                          <Text
                            style={[
                              actPrefStyles.rowSub,
                              actPrefStyles.rowSubPtc,
                            ]}
                          >
                            {ptcActionSubtext}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#047857"
                        />
                      </Pressable>
                    )}

                    {showActionActivity && (
                      <Pressable
                        onPress={() => void openActivityPreferenceSheet()}
                        style={({ pressed }) => [
                          actPrefStyles.row,
                          actPrefStyles.rowActivity,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <View style={actPrefStyles.rowActivityTop}>
                          <Text style={actPrefStyles.rowEmoji}>🍳</Text>
                          <View style={actPrefStyles.rowBody}>
                            <Text
                              style={[
                                actPrefStyles.rowTitle,
                                actPrefStyles.rowTitleActivity,
                              ]}
                            >
                              Activity Preferences
                            </Text>
                            <Text
                              style={[
                                actPrefStyles.rowSub,
                                actPrefStyles.rowSubActivity,
                              ]}
                            >
                              Your child has upcoming activities — let us know how
                              they'd like to participate.
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#92400e"
                          />
                        </View>
                        <View style={actPrefStyles.cta}>
                          <Text style={actPrefStyles.ctaText}>
                            Set Preferences
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={13}
                            color="#fff"
                          />
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              <YourChildrenSection
                students={students.map((s) => ({
                  id: s.id,
                  child_legal_name: s.child_legal_name,
                  profile_image_url: s.profile_image_url,
                  teacher_name: teacherNameByStudentId[s.id] ?? null,
                }))}
                onViewAll={() => router.push("/(tabs)/children" as any)}
                onSelectStudent={(id) =>
                  router.push({
                    pathname: "/(tabs)/children" as any,
                    params: { studentId: id },
                  })
                }
              />
            </>
          )}

          {/* Messages */}
          <View style={{ marginBottom: 4, marginTop: 24 }}>
            <View style={styles.tuitionSectionHeader}>
              <Text style={[styles.sectionHeading, { paddingHorizontal: 0 }]}>
                Messages
              </Text>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                onPress={() => router.push("/(tabs)/messages" as any)}
                hitSlop={8}
              >
                <Text style={styles.tuitionViewAllTxt}>View all</Text>
              </Pressable>
            </View>

            {teachersLoading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 24 }}
              >
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8,
                    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1,
                    borderColor: "#e5e7eb", paddingVertical: 10, paddingHorizontal: 12 }}>
                    <SkeletonBox width={40} height={40} borderRadius={20} />
                    <SkeletonBox width={80} height={13} borderRadius={4} />
                    <SkeletonBox width={72} height={28} borderRadius={9999} />
                  </View>
                ))}
              </ScrollView>
            ) : teachers.length === 0 ? (
              <Text
                style={{
                  marginTop: 10,
                  paddingHorizontal: 24,
                  fontFamily: FontFamilies.body,
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                No teachers available.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 24 }}
              >
                {teachers.map((teacher) => {
                  const color = avatarColor(teacher.full_name);
                  const isStarting = startingConvTeacherId === teacher.id;
                  return (
                    <Pressable
                      key={teacher.id}
                      style={({ pressed }) => [
                        msgTeacherStyles.card,
                        pressed && {
                          opacity: 0.8,
                          transform: [{ scale: 0.97 }],
                        },
                      ]}
                      onPress={() => handleMessageTeacher(teacher)}
                      disabled={!!startingConvTeacherId}
                    >
                      {teacher.profile_image_url ? (
                        <Image
                          source={{ uri: teacher.profile_image_url }}
                          style={msgTeacherStyles.avatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={[
                            msgTeacherStyles.avatar,
                            {
                              backgroundColor: color.bg,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              msgTeacherStyles.avatarText,
                              { color: color.text },
                            ]}
                          >
                            {getInitials(teacher.full_name)}
                          </Text>
                        </View>
                      )}
                      <Text style={msgTeacherStyles.name} numberOfLines={1}>
                        {abbreviateName(teacher.full_name)}
                      </Text>
                      <View style={msgTeacherStyles.btn}>
                        <Text style={msgTeacherStyles.btnText}>
                          {isStarting ? "Opening…" : "Message"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <Text
            style={[styles.sectionHeading, { marginTop: 28, marginBottom: 8 }]}
          >
            Community
          </Text>

          {/* Community Preview */}
          {communityLoading ? (
            <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
              <SkeletonCommunityPreview />
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                {
                  paddingHorizontal: 24,
                  marginBottom: 28,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => {
                import("expo-haptics").then(
                  ({ impactAsync, ImpactFeedbackStyle }) =>
                    impactAsync(ImpactFeedbackStyle.Light),
                );
                router.push({
                  pathname: "/(tabs)/messages" as any,
                  params: { tab: "community" },
                });
              }}
            >
              <LinearGradient
                colors={["#eef5ef", "#ddeede"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.communityCard}
              >
                {/* Header */}
                <View style={styles.communityHeader}>
                  <View style={styles.communityBadge}>
                    <Text style={styles.communityBadgeText}>Community</Text>
                  </View>
                  <Text style={styles.communityTitle}>General</Text>
                  <View style={{ flex: 1 }} />
                  <View style={styles.communityJoinBtn}>
                    <Text style={styles.communityJoinBtnText}>Join Now</Text>
                    <Ionicons name="chevron-forward" size={13} color="#fff" />
                  </View>
                </View>

                {/* Invite (non-member) or message carousel (member) */}
                {!communityIsMember ? (
                  <View style={styles.communityInviteBody}>
                    <Ionicons name="people-outline" size={22} color="#4a7c59" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.communityInviteTitle}>
                        Connect with Sage Field families
                      </Text>
                      <Text style={styles.communityInviteText}>
                        Ask questions, share tips, and stay in the loop with
                        other parents in the General channel.
                      </Text>
                    </View>
                  </View>
                ) : communityMsgs.length === 0 ? (
                  <Text style={styles.communityEmpty}>
                    Be the first to post in the General channel!
                  </Text>
                ) : (
                  <Animated.View
                    style={[styles.communityMsgRow, { opacity: communityFade }]}
                  >
                    {communityMsgs[communityIdx].senderImageUrl ? (
                      <Image
                        source={{
                          uri: communityMsgs[communityIdx].senderImageUrl,
                        }}
                        style={styles.communityAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.communityAvatarFallback,
                          {
                            backgroundColor: avatarColor(
                              communityMsgs[communityIdx].senderName,
                            ).bg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.communityAvatarInitials,
                            {
                              color: avatarColor(
                                communityMsgs[communityIdx].senderName,
                              ).text,
                            },
                          ]}
                        >
                          {getInitials(communityMsgs[communityIdx].senderName)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.communitySender} numberOfLines={1}>
                        {communityMsgs[communityIdx].senderName.split(" ")[0]}
                      </Text>
                      <Text style={styles.communityBody} numberOfLines={2}>
                        {communityMsgs[communityIdx].body}
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* Dot indicators */}
                {communityMsgs.length > 1 && (
                  <View style={styles.communityDots}>
                    {communityMsgs.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.communityDot,
                          i === communityIdx && styles.communityDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          )}

          {!loading && (
            <View style={weekActStyles.section}>
              <View style={weekActStyles.sectionHeaderRow}>
                <Text style={weekActStyles.sectionTitleInline}>Upcoming Activities</Text>
                {eligibleAutoFillStudents.length > 0 ? (
                  <Pressable
                    onPress={() => autoFillSheetRef.current?.present()}
                    hitSlop={8}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <Text style={weekActStyles.autoFillLink}>Auto-Fill ⚡</Text>
                  </Pressable>
                ) : null}
              </View>
              {weekActivitiesLoading ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={weekActStyles.cardsRow}
                >
                  {[0, 1, 2].map((i) => (
                    <SkeletonBox key={i} width={140} height={120} borderRadius={14} />
                  ))}
                </ScrollView>
              ) : weekActivities.length === 0 ? (
                <Text style={weekActStyles.empty}>No upcoming activities.</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={weekActStyles.cardsRow}
                >
                  {weekActivities.map((activity) => {
                    const thumb = activity.images[0]?.signed_url ?? null;
                    return (
                      <Pressable
                        key={activity.id}
                        style={({ pressed }) => [
                          weekActStyles.card,
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => void openActivityPreferenceSheet(activity)}
                      >
                        {thumb ? (
                          <Image
                            source={{ uri: thumb }}
                            style={weekActStyles.thumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[weekActStyles.thumb, weekActStyles.thumbPlaceholder]}>
                            <Ionicons name="ribbon-outline" size={24} color="#d1d5db" />
                          </View>
                        )}
                        <Text style={weekActStyles.cardTitle} numberOfLines={2}>
                          {activity.title}
                        </Text>
                        {activity.activity_date ? (
                          <Text style={weekActStyles.cardDate}>
                            {new Date(activity.activity_date + "T12:00:00").toLocaleDateString(
                              "en-US",
                              { weekday: "short", month: "short", day: "numeric" },
                            )}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* Morning Drop-Off */}
          {false && !loading && (
            <>
              <Text
                style={[
                  styles.sectionHeading,
                  { marginTop: 4, marginBottom: 8 },
                ]}
              >
                Morning Drop-Off
              </Text>
              <View style={styles.dropOffCard}>
                {/* Header */}
                <View style={styles.dropOffHeader}>
                  <Ionicons name="car-outline" size={18} color="#1d4ed8" />
                  <Text style={styles.dropOffHeaderTitle}>
                    Morning Drop-Off
                  </Text>
                </View>

                {dropOffSaved ? (
                  /* Confirmed state */
                  <View style={styles.dropOffConfirmedRow}>
                    <View style={styles.dropOffConfirmedCheck}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                    <Text style={styles.dropOffConfirmedLabel}>
                      {DROP_OFF_SLOTS.find((s) => s.value === dropOffSlot)
                        ?.label ?? dropOffSlot}
                    </Text>
                    <Text style={styles.dropOffConfirmedMuted}>confirmed</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.dropOffEditBtn,
                        pressed && { opacity: 0.6 },
                      ]}
                      onPress={() => setDropOffSaved(false)}
                      hitSlop={8}
                    >
                      <Text style={styles.dropOffEditBtnText}>Edit</Text>
                    </Pressable>
                  </View>
                ) : (
                  /* Selection state */
                  <>
                    <Text style={styles.dropOffSubtitle}>
                      Choose your 15-minute arrival window
                    </Text>
                    <View style={styles.dropOffPillRow}>
                      {DROP_OFF_SLOTS.map((s) => {
                        const selected = dropOffSlot === s.value;
                        return (
                          <Pressable
                            key={s.value}
                            style={({ pressed }) => [
                              styles.dropOffPill,
                              selected && styles.dropOffPillSelected,
                              pressed && { opacity: 0.75 },
                            ]}
                            onPress={() => setDropOffSlot(s.value)}
                          >
                            {selected && (
                              <Ionicons
                                name="checkmark"
                                size={13}
                                color="#fff"
                              />
                            )}
                            <Text
                              style={[
                                styles.dropOffPillText,
                                selected && styles.dropOffPillTextSelected,
                              ]}
                            >
                              {s.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {dropOffError ? (
                      <Text style={styles.dropOffError}>{dropOffError}</Text>
                    ) : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.dropOffSaveBtn,
                        (!dropOffSlot || dropOffSaving) &&
                          styles.dropOffSaveBtnDisabled,
                        pressed &&
                          dropOffSlot &&
                          !dropOffSaving && { opacity: 0.8 },
                      ]}
                      onPress={handleSaveDropOff}
                      disabled={!dropOffSlot || dropOffSaving}
                    >
                      <Text style={styles.dropOffSaveBtnText}>
                        {dropOffSaving ? "Saving…" : "Save drop-off time"}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          )}

          {/* Upcoming Events */}
          {!loading && (
            <View style={styles.upcomingSection}>
              <View style={styles.tuitionSectionHeader}>
                <Text style={[styles.sectionHeading, { paddingHorizontal: 0 }]}>
                  Upcoming events
                </Text>
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => router.push("/(tabs)/calendar" as any)}
                  hitSlop={8}
                >
                  <Text style={styles.tuitionViewAllTxt}>View all</Text>
                </Pressable>
              </View>
              {upcomingEvents.length === 0 ? (
                <Text style={styles.upcomingEmpty}>No upcoming events</Text>
              ) : (
                upcomingEvents.map((evt) => (
                  <Pressable
                    key={evt.id}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      setSelectedEvent(evt);
                      eventSheetRef.current?.present();
                    }}
                  >
                    <View style={styles.upcomingRow}>
                      <View
                        style={[
                          styles.upcomingAccent,
                          { backgroundColor: evt.color },
                        ]}
                      />
                      <View style={styles.upcomingBody}>
                        <Text style={styles.upcomingTitle} numberOfLines={1}>
                          {evt.title}
                        </Text>
                        <Text style={styles.upcomingMeta}>
                          {formatShortDate(evt.event_date)}
                          {"  ·  "}
                          {formatEventTime(evt)}
                        </Text>
                      </View>
                      {evt.category ? (
                        <View
                          style={[
                            styles.upcomingBadge,
                            { backgroundColor: evt.color + "22" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.upcomingBadgeTxt,
                              { color: evt.color },
                            ]}
                          >
                            {evt.category}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Tuition & Billing Preview */}
          {!loading &&
            (() => {
              const enrolledApps = applications.filter(
                (a) => a.status === "enrolled",
              );
              const schoolYearHomeschoolApps = enrolledApps.filter(
                (a) =>
                  a.program === "homeschool_drop_in" &&
                  (a.drop_in_program === "school_year_26_27" ||
                    a.drop_in_program === "both"),
              );
              const bothEnrollments = enrolledApps.filter(
                (a) => a.program === "both",
              );
              const schoolYearTuitionStudentIds = new Set([
                ...enrolledApps
                  .filter((a) => a.program === "school_year_26_27")
                  .map((a) => a.student_id),
                ...bothEnrollments.map((a) => a.student_id),
              ]);
              const schoolYearStudentIds = new Set([
                ...schoolYearTuitionStudentIds,
                ...schoolYearHomeschoolApps.map((a) => a.student_id),
              ]);

              const studentMap = Object.fromEntries(
                students.map((s) => [
                  s.id,
                  {
                    name:
                      s.child_legal_name?.trim().split(/\s+/)[0] ??
                      s.child_legal_name ??
                      "Student",
                  },
                ]),
              );

              const schoolYearNames = [...schoolYearStudentIds]
                .map((id) => studentMap[id]?.name)
                .filter(Boolean) as string[];

              const tuitionNames = [...schoolYearTuitionStudentIds]
                .map((id) => studentMap[id]?.name)
                .filter(Boolean) as string[];

              const allSupplyFeesPaid =
                schoolYearStudentIds.size > 0 &&
                [...schoolYearStudentIds].every(
                  (id) => paidSupplyFeeByStudent[id],
                );

              const anyTuitionSupplyFeeUnpaid = [
                ...schoolYearTuitionStudentIds,
              ].some((id) => !paidSupplyFeeByStudent[id]);

              const totalTuitionMonthsPaid = [
                ...schoolYearTuitionStudentIds,
              ].reduce(
                (acc, id) =>
                  acc + (paidSchoolYearByStudent[id]?.length ?? 0),
                0,
              );

              const totalAftercareMonths = [...schoolYearStudentIds].reduce(
                (acc, id) =>
                  acc +
                  countSchoolYearAftercarePaidMonths(
                    paidAftercareByStudent[id],
                  ),
                0,
              );

              const totalFunFridayMonths = [...schoolYearStudentIds].reduce(
                (acc, id) =>
                  acc +
                  countSchoolYearFunFridayPaidMonths(
                    paidFunFridayByStudent[id],
                  ),
                0,
              );

              const programLabel = "School Year 26–27";
              const programCards: Array<{ key: string } & HomeProgramCardDef> =
                [];

              if (schoolYearNames.length > 0) {
                programCards.push({
                  key: "supply-fee",
                  image: HOME_CARD_IMAGES.aftercare,
                  programLabel,
                  title: "Annual Supply Fee",
                  badge: "$300",
                  statusLine: formatHomeCardStatus(
                    schoolYearNames,
                    allSupplyFeesPaid ? "Paid ✓" : "Pay now",
                  ),
                });
              }

              if (tuitionNames.length > 0) {
                programCards.push({
                  key: "tuition",
                  image: HOME_CARD_IMAGES.summer,
                  programLabel,
                  title: "School Year Tuition",
                  badge:
                    totalTuitionMonthsPaid > 0
                      ? `${totalTuitionMonthsPaid} mo. paid`
                      : undefined,
                  statusLine: formatHomeCardStatus(
                    tuitionNames,
                    anyTuitionSupplyFeeUnpaid
                      ? "Pay supply fee first"
                      : "Pay tuition",
                  ),
                });
              }

              for (const app of schoolYearHomeschoolApps) {
                const studentName = studentMap[app.student_id]?.name ?? null;
                const paidData = paidHomeschoolByStudent[app.student_id];
                const hasSchoolYear =
                  (paidData?.schoolYear?.length ?? 0) > 0;
                programCards.push({
                  key: `homeschool-sy-${app.id}`,
                  image: HOME_CARD_IMAGES.homeschool,
                  programLabel,
                  title: "Homeschool Drop-In",
                  badge: hasSchoolYear ? "School year active" : undefined,
                  statusLine: formatHomeCardStatus(
                    studentName ? [studentName] : [],
                    hasSchoolYear ? "Manage plan" : "Set up plan",
                  ),
                });
              }

              if (schoolYearNames.length > 0) {
                programCards.push({
                  key: "aftercare",
                  image: HOME_CARD_IMAGES.funFriday,
                  programLabel,
                  title: "Extended Learning (3:00–5:00pm)",
                  badge:
                    totalAftercareMonths > 0
                      ? `${totalAftercareMonths} mo. paid`
                      : "Optional",
                  statusLine: formatHomeCardStatus(
                    schoolYearNames,
                    totalAftercareMonths > 0 ? "Add months" : "Select plan",
                  ),
                });

                programCards.push({
                  key: "fun-friday",
                  image: HOME_CARD_IMAGES.schoolYear,
                  programLabel,
                  title: "Friday Enrichment Day",
                  badge:
                    totalFunFridayMonths > 0
                      ? `${totalFunFridayMonths} mo. paid`
                      : "Optional",
                  statusLine: formatHomeCardStatus(
                    schoolYearNames,
                    totalFunFridayMonths > 0 ? "Add months" : "Select plan",
                  ),
                });
              }

              const visiblePendingPayments = pendingPayments.filter(
                (p) => !isSupplyFeePendingPayment(p),
              );

              for (const p of visiblePendingPayments) {
                programCards.push({
                  key: `pending-${p.id}`,
                  image: HOME_CARD_IMAGES.schoolYear,
                  programLabel: "Pending",
                  title: p.label,
                  statusLine:
                    p.amount_cents != null
                      ? formatCents(p.amount_cents)
                      : "See details",
                });
              }

              const hasAnything =
                visiblePendingPayments.length > 0 ||
                schoolYearStudentIds.size > 0;

              return (
                <View style={styles.tuitionSection}>
                  <View style={styles.tuitionSectionHeader}>
                    <Text
                      style={[styles.sectionHeading, { paddingHorizontal: 0 }]}
                    >
                      Tuition & billing
                    </Text>
                    <Pressable
                      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                      onPress={goToTuition}
                      hitSlop={8}
                    >
                      <Text style={styles.tuitionViewAllTxt}>View all</Text>
                    </Pressable>
                  </View>
                  {tuitionLoading ? (
                    <View style={styles.upcomingRow}>
                      <View style={{ flex: 1, gap: 8 }}>
                        <SkeletonBox width="60%" height={13} borderRadius={4} />
                        <SkeletonBox width="40%" height={11} borderRadius={4} />
                      </View>
                    </View>
                  ) : !hasAnything ? (
                    <View style={styles.tuitionCaughtUp}>
                      <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color={Brand.sage700}
                      />
                      <View style={{ gap: 2 }}>
                        <Text style={styles.tuitionCaughtUpTitle}>
                          All caught up!
                        </Text>
                        <Text style={styles.tuitionCaughtUpSub}>
                          No pending payments
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.tuitionHistoryBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={goToTuition}
                      >
                        <Text style={styles.tuitionHistoryBtnTxt}>
                          See payment history
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color={Brand.sage700}
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tuitionCardScroll}
                      >
                        {programCards.map((item) => (
                          <HomeProgramCard
                            key={item.key}
                            card={{
                              image: item.image,
                              programLabel: item.programLabel,
                              title: item.title,
                              badge: item.badge,
                              statusLine: item.statusLine,
                            }}
                            onPress={goToTuition}
                          />
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>
              );
            })()}

          {/* Newsletters */}
          {!loading && (newslettersLoading || homeNewsletters.length > 0) && (
            <View style={styles.tuitionSection}>
              <View style={styles.tuitionSectionHeader}>
                <Text style={[styles.sectionHeading, { paddingHorizontal: 0 }]}>
                  Newsletters
                </Text>
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  onPress={() => router.push("/(tabs)/newsletters" as any)}
                  hitSlop={8}
                >
                  <Text style={styles.tuitionViewAllTxt}>View all</Text>
                </Pressable>
              </View>

              {newslettersLoading ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tuitionCardScroll}
                >
                  {[0, 1, 2].map((i) => (
                    <SkeletonBox key={i} width={160} height={130} borderRadius={12} />
                  ))}
                </ScrollView>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tuitionCardScroll}
                >
                  {homeNewsletters.map((nl) => (
                    <NewsletterHomeCard key={nl.id} item={nl} />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Photos CTA Banner */}
          <Pressable
            onPress={() => router.push("/(tabs)/photos" as any)}
            style={({ pressed }) => [
              styles.reelsBanner,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={["#FFF7ED", "#FFE4C8", "#FECDA6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.reelsBannerGradient, { overflow: "hidden" }]}
            >
              <View style={styles.summerBannerLeft}>
                <Text style={styles.summerBannerEmoji}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.photosCTATitle}>See This Week's Photos</Text>
                  <Text style={styles.photosCTASub}>See what's been happening ✨</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#92400e" />
            </LinearGradient>
          </Pressable>

          {/* Rewards Teaser */}
          {!loading && (
            <Pressable
              style={({ pressed }) => [
                styles.rewardsCard,
                pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => router.push("/(tabs)/rewards")}
            >
              <LinearGradient
                colors={["#3d6b50", "#5a8a68"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rewardsGradient}
              >
                {/* Top row: label + pill */}
                <View style={styles.rewardsTopRow}>
                  <View style={styles.rewardsPill}>
                    <Ionicons name="gift-outline" size={12} color="#3d6b50" />
                    <Text style={styles.rewardsPillTxt}>Rewards</Text>
                  </View>
                </View>

                {/* Headline */}
                <Text style={styles.rewardsHeadline}>Earn up to $515</Text>

                {/* Chips */}
                <View style={styles.rewardsChipRow}>
                  <View style={styles.rewardsChip}>
                    <Text style={styles.rewardsChipTxt}>🎁 $500 Referral</Text>
                  </View>
                  <View style={styles.rewardsChip}>
                    <Text style={styles.rewardsChipTxt}>☕ $15 Starbucks</Text>
                  </View>
                </View>

                {/* CTA footer */}
                <View style={styles.rewardsFooter}>
                  <Text style={styles.rewardsFooterTxt}>Explore Rewards</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#3d6b50"
                  />
                </View>
              </LinearGradient>
            </Pressable>
          )}

          {/* Feedback Section */}
          {!loading && (
            <View style={styles.feedbackCard}>
              <View style={styles.feedbackCardHeader}>
                <View style={styles.feedbackCardIconBox}>
                  <Ionicons name="sparkles-outline" size={15} color="#7c3aed" />
                </View>
                <Text style={styles.feedbackCardTitle}>
                  Share Your Feedback
                </Text>
              </View>
              <Text style={styles.feedbackCardDesc}>
                How's your experience with Sage Field so far? A minute of honest
                feedback helps us build something every family loves.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.feedbackCardBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push("/(tabs)/feedback" as any)}
              >
                <Text style={styles.feedbackCardBtnText}>Share Feedback</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Profile sheet */}
        <BottomSheetModal
          ref={profileSheetRef}
          snapPoints={["30%"]}
          enablePanDownToClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              pressBehavior="close"
            />
          )}
        >
          <BottomSheetView style={styles.sheetContent}>
            <TouchableOpacity
              onPress={handlePickParentImage}
              activeOpacity={0.75}
              disabled={uploadingParentImage}
            >
              <View style={{ position: "relative", width: 62, height: 62 }}>
                <View style={styles.sheetAvatar}>
                  {parentImageUrl ? (
                    <Image
                      source={{ uri: parentImageUrl }}
                      style={styles.sheetAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.sheetAvatarText}>{initials}</Text>
                  )}
                </View>
                <View style={styles.sheetAvatarBadge}>
                  <Ionicons
                    name={uploadingParentImage ? "hourglass-outline" : "camera"}
                    size={11}
                    color="#fff"
                  />
                </View>
              </View>
            </TouchableOpacity>
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.sheetButtonPressed,
              ]}
              onPress={signOut}
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheetModal>

        {/* Event detail sheet */}
        <BottomSheetModal
          ref={eventSheetRef}
          snapPoints={["60%"]}
          enablePanDownToClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              pressBehavior="close"
            />
          )}
          onDismiss={() => setSelectedEvent(null)}
        >
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {selectedEvent && (
              <View style={styles.eventDetailContainer}>
                {/* Title + category */}
                <View
                  style={[
                    styles.eventDetailHeader,
                    { borderLeftColor: selectedEvent.color },
                  ]}
                >
                  <Text style={styles.eventDetailTitle}>
                    {selectedEvent.title}
                  </Text>
                  {selectedEvent.category ? (
                    <View
                      style={[
                        styles.eventDetailBadge,
                        { backgroundColor: selectedEvent.color + "22" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventDetailBadgeTxt,
                          { color: selectedEvent.color },
                        ]}
                      >
                        {selectedEvent.category}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Date + time */}
                <View style={styles.eventDetailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventDetailRowPrimary}>
                      {formatFullDate(selectedEvent.event_date)}
                    </Text>
                    <Text style={styles.eventDetailRowSub}>
                      {formatEventTime(selectedEvent)}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                {selectedEvent.location ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#6b7280"
                    />
                    <Text style={[styles.eventDetailRowPrimary, { flex: 1 }]}>
                      {selectedEvent.location}
                    </Text>
                  </View>
                ) : null}

                {/* Description */}
                {selectedEvent.description ? (
                  <View style={styles.eventDetailBlock}>
                    <Text style={styles.eventDetailBlockLabel}>Details</Text>
                    <Text style={styles.eventDetailDesc}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                ) : null}

                {/* Attachments */}
                {(selectedEvent.attachment_links ?? []).length > 0 ? (
                  <View style={styles.eventDetailBlock}>
                    <Text style={styles.eventDetailBlockLabel}>
                      Attachments
                    </Text>
                    {(selectedEvent.attachment_links ?? []).map((url, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.eventDetailAttachmentRow}
                        onPress={() => Linking.openURL(url)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="attach-outline"
                          size={16}
                          color={Brand.sage700}
                        />
                        <Text
                          style={styles.eventDetailAttachmentTxt}
                          numberOfLines={1}
                        >
                          {url.split("/").pop() ?? `Attachment ${i + 1}`}
                        </Text>
                        <Ionicons
                          name="open-outline"
                          size={14}
                          color="#9ca3af"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {isFieldFridayCalendarEvent(selectedEvent) ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.eventDetailRegisterBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => {
                      eventSheetRef.current?.dismiss();
                      router.push("/(tabs)/tuition");
                    }}
                  >
                    <Text style={styles.eventDetailRegisterBtnTxt}>
                      Register now!
                    </Text>
                  </Pressable>
                ) : null}

                {/* See in calendar */}
                <Pressable
                  style={({ pressed }) => [
                    styles.eventDetailCalBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => {
                    eventSheetRef.current?.dismiss();
                    router.push({
                      pathname: "/(tabs)/calendar",
                      params: { selectDate: selectedEvent.event_date },
                    });
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={Brand.sage700}
                  />
                  <Text style={styles.eventDetailCalBtnTxt}>
                    See in calendar
                  </Text>
                </Pressable>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* Checklist sheet */}
        <BottomSheetModal
          ref={checklistSheetRef}
          snapPoints={["65%", "92%"]}
          enablePanDownToClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              pressBehavior="close"
            />
          )}
        >
          <BottomSheetScrollView contentContainerStyle={styles.checklistSheet}>
            {/* Header */}
            <View style={{ gap: 4 }}>
              <Text style={styles.checklistTitle}>Get Started</Text>
              <Text style={styles.checklistSubtitle}>
                {completedTaskCount} of {TOTAL_TASKS} completed
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.checklistProgressTrack}>
              <View
                style={[
                  styles.checklistProgressFill,
                  { width: `${(completedTaskCount / TOTAL_TASKS) * 100}%` },
                ]}
              />
            </View>

            {/* All done banner */}
            {completedTaskCount === TOTAL_TASKS && (
              <View style={styles.checklistAllDone}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Brand.sage700}
                />
                <Text style={styles.checklistAllDoneTxt}>
                  All done! Great job getting set up.
                </Text>
              </View>
            )}

            {/* Task list */}
            {onboardingLoading ? (
              <View style={{ gap: 14 }}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.checklistTaskRow}>
                    <SkeletonBox width={40} height={40} borderRadius={10} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBox width="65%" height={14} borderRadius={4} />
                      <SkeletonBox width="80%" height={11} borderRadius={4} />
                    </View>
                    <SkeletonBox width={22} height={22} borderRadius={11} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ gap: 2 }}>
                {CHECKLIST_TASKS.map((task) => {
                  const done = onboardingCompleted.has(task.id);
                  return (
                    <View key={task.id} style={styles.checklistTaskRow}>
                      {/* Icon */}
                      <View
                        style={[
                          styles.checklistTaskIcon,
                          { backgroundColor: task.color + "18" },
                        ]}
                      >
                        <Ionicons
                          name={task.icon}
                          size={20}
                          color={task.color}
                        />
                      </View>

                      {/* Label + desc (tappable → navigate) */}
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => navigateChecklist(task.id)}
                        hitSlop={4}
                      >
                        <Text
                          style={[
                            styles.checklistTaskLabel,
                            done && {
                              color: "#9ca3af",
                              textDecorationLine: "line-through",
                            },
                          ]}
                        >
                          {task.label}
                        </Text>
                        <Text style={styles.checklistTaskDesc}>
                          {task.desc}
                        </Text>
                      </Pressable>

                      {/* Checkbox toggle */}
                      <Pressable
                        onPress={() => toggleOnboardingTask(task.id)}
                        hitSlop={8}
                        style={[
                          styles.checklistCheckCircle,
                          done && styles.checklistCheckCircleDone,
                        ]}
                      >
                        {done && (
                          <Ionicons
                            name="checkmark"
                            size={13}
                            color="#ffffff"
                          />
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* Notification sheet */}
        <BottomSheetModal
          ref={notifSheetRef}
          snapPoints={["55%"]}
          enablePanDownToClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              pressBehavior="close"
            />
          )}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.notifSheetContainer}
          >
            <View style={styles.notifSheetHeader}>
              <Text style={styles.notifSheetTitle}>Notifications</Text>
            </View>

            {notifLoading ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.notifRow}>
                    <SkeletonBox width={36} height={36} borderRadius={18} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBox width="55%" height={13} borderRadius={4} />
                      <SkeletonBox width="75%" height={11} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : notifItems.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons
                  name="notifications-off-outline"
                  size={32}
                  color="#d1d5db"
                />
                <Text style={styles.notifEmptyText}>No new notifications</Text>
              </View>
            ) : (
              notifItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.notifRow,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    notifSheetRef.current?.dismiss();
                    if (item.kind === "direct") {
                      router.push({
                        pathname: "/(tabs)/messages/[id]",
                        params: {
                          id: item.conversationId!,
                          otherUserName: item.otherUserName!,
                          otherUserAvatar: item.otherUserAvatar ?? "",
                          otherUserId: item.otherUserId!,
                        },
                      });
                    } else {
                      router.push({
                        pathname: "/(tabs)/messages/channel/[channelId]",
                        params: {
                          channelId: item.channelId!,
                          channelName: item.channelName!,
                          isMember: item.isMember ? "true" : "false",
                          isDefault: item.isDefault ? "true" : "false",
                          memberCount: String(item.memberCount ?? 0),
                        },
                      });
                    }
                  }}
                >
                  <View style={styles.notifIcon}>
                    <Ionicons
                      name={
                        item.kind === "direct"
                          ? "chatbubble-outline"
                          : "people-outline"
                      }
                      size={16}
                      color={Brand.sage700}
                    />
                  </View>
                  <View style={styles.notifBody}>
                    <View style={styles.notifTopRow}>
                      <Text style={styles.notifName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.notifTime}>
                        {timeAgo(item.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.notifPreview} numberOfLines={1}>
                      {item.preview}
                    </Text>
                  </View>
                  <View style={styles.notifUnreadPill}>
                    <Text style={styles.notifUnreadPillText}>
                      {item.unreadCount > 9 ? "9+" : item.unreadCount}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}

            <Pressable
              style={({ pressed }) => [
                styles.notifFooterBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                notifSheetRef.current?.dismiss();
                router.push("/(tabs)/messages" as any);
              }}
            >
              <Text style={styles.notifFooterBtnText}>View all messages</Text>
              <Ionicons name="arrow-forward" size={14} color={Brand.sage700} />
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheetModal>

        {students.length > 0 && effectiveParentId && (
          <AutoFillPreferencesSheet
            ref={autoFillSheetRef}
            eligibleStudents={eligibleAutoFillStudents}
            studentDefaults={studentDefaults}
            defaultSaveStatusByStudent={defaultSaveStatusByStudent}
            onSetDefault={(studentId, level) => void handleHomeSetDefault(studentId, level)}
            readOnly={isReadOnlyPreview}
          />
        )}

        {students.length > 0 && effectiveParentId && (
          <ParentActivityPreferenceSheet
            ref={activityPrefSheetRef}
            activity={selectedActivity}
            students={students}
            parentId={effectiveParentId}
            userId={userId}
            readOnly={isReadOnlyPreview}
            onSaved={() => void refreshActivityBanner()}
          />
        )}

        {students.length > 0 && effectiveParentId && (
          <ParentTeacherConferenceSheet
            ref={ptcSheetRef}
            parentId={effectiveParentId}
            conferenceTeachers={conferenceTeachers}
            conferenceStudents={
              conferenceStudents.length > 0
                ? conferenceStudents
                : ptcStudentsForBanner
            }
            initialBookingsByStudent={conferenceBookingsByStudent}
            initialTakenSlotKeys={conferenceTakenSlotKeys}
            contextLoading={conferenceContextLoading}
            contextError={conferenceContextError}
            onRetryLoad={() => void loadConferenceContext()}
            onBookingsChange={(bookings, takenKeys) => {
              setConferenceBookingsByStudent(bookings);
              setConferenceTakenSlotKeys(takenKeys);
            }}
          />
        )}
      </SafeAreaView>

      {showFallLeaves ? (
        <FallLeavesOverlay
          onComplete={() => {
            markFallLeavesPlayed();
            setShowFallLeaves(false);
          }}
        />
      ) : null}

      {/* Intro slideshow */}
      <Modal
        visible={introVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleIntroSkip}
      >
        <SafeAreaView
          style={[
            styles.introContainer,
            { backgroundColor: SLIDE_BACKGROUNDS[introIndex] },
          ]}
          edges={["top", "bottom"]}
        >
          {/* Top bar — back button */}
          <View style={styles.introTopBar}>
            {introIndex > 0 && (
              <Pressable
                onPress={handleIntroBack}
                hitSlop={12}
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="arrow-back" size={22} color="#6b7280" />
              </Pressable>
            )}
          </View>

          {/* Slides */}
          <FlatList
            ref={introListRef}
            data={INTRO_SLIDES}
            keyExtractor={(s) => s.key}
            renderItem={renderIntroSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width,
              );
              setIntroIndex(idx);
            }}
            style={{ flex: 1 }}
          />

          {/* Footer: dots + button + skip */}
          <View style={styles.introFooter}>
            <View style={styles.introDots}>
              {INTRO_SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.introDot,
                    i === introIndex && styles.introDotActive,
                  ]}
                />
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.introBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleIntroNext}
            >
              <Text style={styles.introBtnText}>
                {introIndex === INTRO_SLIDES.length - 1
                  ? "Get started"
                  : "Next"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleIntroSkip}
              hitSlop={10}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.introSkipText}>Skip</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const msgTeacherStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
  },
  name: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
    lineHeight: 18,
  },
  btn: {
    backgroundColor: Brand.sage700,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexShrink: 0,
  },
  btnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0DFC4",
  },
  safeArea: {
    flex: 1,
  },

  granteeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },
  granteeBannerText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#7c3aed",
    flex: 1,
  },

  // Notification sheet
  notifSheetContainer: {
    paddingBottom: 32,
  },
  notifSheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  notifSheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#111827",
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF5EF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifBody: {
    flex: 1,
    gap: 2,
  },
  notifTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
    flex: 1,
  },
  notifTime: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  notifPreview: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  notifUnreadPill: {
    backgroundColor: Brand.sage700,
    borderRadius: 9999,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  notifUnreadPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
  },
  notifEmpty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
  },
  notifEmptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  notifFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#EEF5EF",
  },
  notifFooterBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },

  // Content area
  content: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentInner: {
    paddingTop: 8,
    paddingBottom: BottomTabInset + 16,
  },

  sectionHeading: {
    fontFamily: FontFamilies.headingRegular,
    fontSize: 16,
    color: "#4b5563",
    paddingHorizontal: 24,
  },
  // Bottom sheet
  sheetContent: {
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: "center",
    gap: 12,
  },
  sheetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sheetAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  sheetAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 20,
    color: Brand.sage700,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  sheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: Brand.sage700,
  },
  sheetTitleDot: {
    fontFamily: FontFamilies.body,
    fontSize: 16,
    color: "#9ca3af",
  },
  sheetTitleGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#6b7280",
  },
  sheetSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    marginTop: -4,
  },
  sheetButton: {
    backgroundColor: Brand.sage700,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  sheetButtonPressed: {
    opacity: 0.75,
  },
  sheetButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
  sheetAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  signOutButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  signOutButtonText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ef4444",
  },

  // Drop-off card
  dropOffCard: {
    marginHorizontal: 24,
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  dropOffHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  dropOffHeaderTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1d4ed8",
  },
  dropOffSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  dropOffPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  dropOffPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#eff6ff",
    minWidth: 100,
    justifyContent: "center",
  },
  dropOffPillSelected: {
    backgroundColor: "#1d4ed8",
  },
  dropOffPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1d4ed8",
  },
  dropOffPillTextSelected: {
    color: "#fff",
  },
  dropOffSaveBtn: {
    margin: 14,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
  },
  dropOffSaveBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  dropOffSaveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  dropOffConfirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropOffConfirmedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropOffConfirmedLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  dropOffConfirmedMuted: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    flex: 1,
  },
  dropOffEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dropOffEditBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1d4ed8",
  },
  dropOffError: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#ef4444",
    paddingHorizontal: 14,
    paddingTop: 4,
  },

  // Upcoming events
  upcomingSection: {
    gap: 10,
    marginTop: 28,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  upcomingAccent: {
    width: 3,
    height: 40,
    borderRadius: 9999,
    flexShrink: 0,
  },
  upcomingBody: {
    flex: 1,
    gap: 3,
  },
  upcomingTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  upcomingMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  upcomingBadge: {
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  upcomingBadgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
  upcomingEmpty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    paddingVertical: 8,
  },

  // Tuition preview
  tuitionSection: {
    gap: 10,
    marginTop: 24,
  },
  tuitionSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  tuitionCardScroll: {
    paddingHorizontal: 24,
    paddingBottom: 4,
    gap: 12,
  },
  tuitionViewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 24,
    paddingTop: 2,
  },
  tuitionViewAllTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  tuitionCaughtUp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EEF5EF",
    borderRadius: 12,
    marginHorizontal: 24,
    padding: 14,
  },
  tuitionCaughtUpTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  tuitionCaughtUpSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  tuitionHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
  },
  tuitionHistoryBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },

  // Event detail sheet
  eventDetailContainer: {
    padding: 24,
    gap: 16,
  },
  eventDetailHeader: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    gap: 8,
  },
  eventDetailTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    lineHeight: 28,
  },
  eventDetailBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  eventDetailBadgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  eventDetailRowPrimary: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#374151",
  },
  eventDetailRowSub: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  eventDetailBlock: {
    gap: 8,
  },
  eventDetailBlockLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  eventDetailDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  eventDetailAttachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F2F7F3",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8DFCB",
  },
  eventDetailAttachmentTxt: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: Brand.sage700,
  },
  eventDetailRegisterBtn: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Brand.sage700,
    alignItems: "center",
  },
  eventDetailRegisterBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },
  eventDetailCalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Brand.sage700,
    backgroundColor: "#F2F7F3",
  },
  eventDetailCalBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },

  // Rewards teaser card
  rewardsCard: {
    marginHorizontal: 24,
    marginTop: 0,
    borderRadius: 20,
    overflow: "hidden",
  },
  rewardsGradient: {
    padding: 20,
    gap: 6,
  },
  rewardsTopRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  rewardsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardsPillTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#3d6b50",
  },
  rewardsHeadline: {
    fontFamily: FontFamilies.heading,
    fontSize: 30,
    color: "#fff",
    lineHeight: 36,
  },
  rewardsSubline: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 10,
  },
  rewardsChipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  rewardsChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  rewardsChipTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#fff",
  },
  rewardsFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  rewardsFooterTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#3d6b50",
  },

  // Feedback section
  feedbackCard: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    padding: 16,
    gap: 12,
  },
  feedbackCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackCardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7c3aed22",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  feedbackCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    flex: 1,
  },
  feedbackCardDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 19,
  },
  feedbackCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#7c3aed",
    paddingVertical: 11,
    borderRadius: 10,
  },
  feedbackCardBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },

  // Checklist
  checklistSheet: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  checklistTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
  },
  checklistSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  checklistProgressTrack: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 9999,
    overflow: "hidden",
  },
  checklistProgressFill: {
    height: 6,
    backgroundColor: Brand.sage700,
    borderRadius: 9999,
  },
  checklistAllDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF5EF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  checklistAllDoneTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  checklistTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  checklistTaskIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checklistTaskLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  checklistTaskDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  checklistCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checklistCheckCircleDone: {
    backgroundColor: Brand.sage700,
    borderColor: Brand.sage700,
  },

  // Intro slideshow
  introContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  introSkipText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  introSlide: {
    width: Dimensions.get("window").width,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
    justifyContent: "center",
  },
  introPreviewCard: {
    height: 290,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  introTextArea: {
    gap: 8,
    paddingHorizontal: 4,
  },
  introHeadline: {
    fontFamily: FontFamilies.heading,
    fontSize: 24,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 32,
  },
  introBody: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  introFooter: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    alignItems: "center",
  },
  introDots: {
    flexDirection: "row",
    gap: 6,
  },
  introDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  introDotActive: {
    width: 20,
    backgroundColor: Brand.sage700,
  },
  introTopBar: {
    height: 44,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  introBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.sage700,
    paddingVertical: 15,
    borderRadius: 14,
    width: "100%",
  },
  introBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#fff",
  },

  // Community preview
  communityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c2ddc8",
    padding: 16,
    gap: 12,
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  communityBadge: {
    backgroundColor: "#4a7c59",
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  communityBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  communityTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#2d5a3d",
  },
  communityJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#4a7c59",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  communityJoinBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  communityMsgRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 52,
  },
  communityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  communityAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  communityAvatarInitials: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
  },
  communitySender: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#2d5a3d",
    marginBottom: 2,
  },
  communityBody: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  communityEmpty: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  communityDots: {
    flexDirection: "row",
    gap: 5,
    alignSelf: "center",
  },
  communityDot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
    backgroundColor: "#c2ddc8",
  },
  communityDotActive: {
    backgroundColor: "#4a7c59",
  },
  communityInviteBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  communityInviteTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#2d5a3d",
    marginBottom: 3,
  },
  communityInviteText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },

  summerBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summerBannerEmoji: {
    fontSize: 28,
  },

  tuitionBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  tuitionBannerGradient: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tuitionBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tuitionBannerEmoji: {
    fontSize: 28,
  },
  tuitionBannerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1e3a8a",
  },
  tuitionBannerSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#1e40af",
    marginTop: 2,
  },
  tuitionBannerDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#3b82f6",
    marginTop: 4,
  },

  // Reels announcement banner
  reelsBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  reelsBannerGradient: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // Photos CTA banner
  photosCTATitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#78350f",
  },
  photosCTASub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#92400e",
    marginTop: 2,
  },

  // Today's photos banner
  photosBanner: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  photosBannerGradient: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  photosBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  photosBannerEmoji: {
    fontSize: 28,
  },
  photosBannerTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#14532d",
  },
  photosBannerSub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#166534",
    marginTop: 2,
  },
});
